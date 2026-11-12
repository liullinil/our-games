#!/usr/bin/env node
/**
 * Рецензии в сканах журналов на archive.org.
 *
 * Оценки «Игромании», «Страны игр», «Навигатора», Game.EXE и «PC Игр» за
 * девяностые и нулевые больше нигде не лежат — только в сканах номеров на
 * archive.org. Найти нужный номер руками долго: идентификаторы не
 * угадываются, а полнотекстовый поиск выдаёт сотни упоминаний — новости,
 * превью, рекламу, хит-парады. Скрипт делает черновую работу:
 *
 *  1. ищет название игры и её другие названия полнотекстовым поиском
 *     archive.org — только в журналах и только с года выхода по третий
 *     после него;
 *  2. в каждом найденном номере находит листы, где игра упомянута, и
 *     склеивает соседние в статьи;
 *  3. прикидывает, похожа ли статья на рецензию: «вердикт», «оценка»,
 *     «плюсы/минусы», жанр с издателем — да; «дата выхода», «в разработке»,
 *     «прохождение» — нет;
 *  4. печатает кандидатов и сохраняет OCR-текст каждой статьи, чтобы её
 *     можно было прочитать и пересказать.
 *
 * Оценку скрипт не читает и рецензию не записывает. OCR стабильно теряет
 * цифры из рейтинговых врезок, поэтому оценку смотрят глазами на снимке
 * страницы — адрес снимка печатается рядом с кандидатом. И только глазами
 * отличается рецензия от превью с такой же врезкой «Жанр / Издатель».
 *
 * Номер листа — это `n<N>` в адресе читалки archive.org: счёт с нуля, по
 * порядку сканов, а не по печатным страницам журнала.
 *
 *   node scripts/find-scans.mjs ex-machina pathologic
 *   node scripts/find-scans.mjs --from 1995 --to 2016 --out tmp/scans
 *
 * Скачанное кэшируется во временной папке системы: повторный прогон по тем же
 * играм почти мгновенный.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const CACHE = path.join(os.tmpdir(), 'our-games-archive');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) nashi-igry-encyclopedia/1.0';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
const WITH_VALUE = ['--from', '--to', '--out', '--top', '--issues'];
const only = args.filter((a, i) => !a.startsWith('--') && !WITH_VALUE.includes(args[i - 1]));
const FROM = Number(opt('from') ?? 0);
const TO = Number(opt('to') ?? 9999);
const OUT = opt('out');
/* Сколько кандидатов печатать на игру. */
const TOP = Number(opt('top') ?? 12);
/* Сколько номеров на игру разбирать всего и сколько — одного журнала. */
const ISSUES = Number(opt('issues') ?? 70);
/* У главных русских журналов номеров с упоминаниями за год — десяток, и рецензия не всегда в первой пятёрке выдачи. */
const PER_MAGAZINE = [10, 4, 3];
/*
 * Через сколько лет после выхода рецензий уже не ищем. Раньше года выхода —
 * тоже нет: там только превью. Западное издание русской игры выходит на год-
 * два позже, его рецензии в окно попадают.
 */
const LATE = 3;
/* Сколько номеров качать одновременно. */
const PARALLEL = 6;
const DEBUG = args.includes('--debug');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Обработать список не больше чем `limit` задачами сразу, сохранив порядок результатов. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/* ---------- сеть с кэшем ---------- */

async function get(url, { binary = false } = {}) {
  const key = createHash('sha1').update(url).digest('hex');
  const file = path.join(CACHE, key);
  if (existsSync(file)) {
    const buf = await readFile(file);
    if (buf.length === 0) return null;
    return binary ? buf : buf.toString('utf8');
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    } catch {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(8000 * (attempt + 1));
      continue;
    }
    await mkdir(CACHE, { recursive: true });
    if (!res.ok) {
      // Отказ тоже запоминаем: файла нет — и в следующий раз его не будет.
      if (res.status === 404 || res.status === 403) await writeFile(file, '');
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(file, buf);
    return binary ? buf : buf.toString('utf8');
  }
  return null;
}

const json = async (url) => {
  const text = await get(url);
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

/** Имя файла в адресе: в них пробелы, скобки и кириллица. */
const fileUrl = (id, name) => `https://archive.org/download/${id}/${name.split('/').map(encodeURIComponent).join('/')}`;

/* ---------- журналы ---------- */

/*
 * Русские журналы — первыми: ради них скрипт и написан. Регулярное выражение
 * проверяется по названию и идентификатору номера; у «Игромании» на
 * archive.org пять разных схем идентификаторов, у «PC Игр» — три.
 */
const MAGAZINES = [
  ['Страна игр', /страна игр|game_land|gameland/i, 0],
  ['Игромания', /игромани|igromania/i, 0],
  ['Навигатор игрового мира', /навигатор игрового|game ?world ?navigator|game-world-navigator|^navi[ _-]/i, 0],
  ['Game.EXE', /game\.exe/i, 0],
  ['PC Игры', /pc игры|pc_igry|^pc-20\d\d-\d\d/i, 0],
  ['Лучшие компьютерные игры', /лучшие компьютерные|^lki[_ -]/i, 0],
  ['Домашний ПК', /домашний пк|^dpk_/i, 0],
  ['Шпиль!', /шпиль|shpil/i, 0],
  ['Gameplay', /^gameplay\b(?! -)/i, 0],
  ['Виртуальные радости', /виртуальные радости|virtualnieradosti/i, 0],
  ['Мир фантастики', /мир фантастики|^mirf/i, 0],
  ['Хакер', /^хакер|^xakep/i, 0],
  ['XS Magazine', /xs ?magazine/i, 1],
  ['PC Gamer', /pc ?gamer/i, 1],
  ['PC Zone', /pc ?zone/i, 1],
  ['Computer Gaming World', /computer ?gaming ?world/i, 1],
  ['Games for Windows', /games for windows/i, 1],
  ['PC Format', /pc ?format/i, 1],
  ['PC PowerPlay', /pc ?powerplay/i, 1],
  ['Edge', /^edge\b/i, 1],
  ['GameStar', /gamestar/i, 1],
];
const MAGAZINE_COLLECTIONS =
  /^(videogamemagazines|videogamemagazinesmisc|computermagazines|computermagazinesmisc|magazine_rack|gameland-magazine-rus|game-world-navigator|game_exe_magazine|DPK_magazine|spire-magazine-ru)$/;
/* Подшивки за год и сборники номеров: читалка открывает их с первого файла, лист не адресуется. */
const PACK = /все выпуски|collection of|\(\d{4}\s*-\s*\d{4}\)|\d{4}\s*-\s*\d{4}$/i;

function magazineOf(hit) {
  const f = hit.fields;
  const title = String(f.title ?? '');
  const id = String(f.identifier);
  const collections = [].concat(f.collection ?? []);
  if (f.mediatype && f.mediatype !== 'texts') return null;
  if (collections.includes('magazine_packs') || PACK.test(title)) return null;
  if (/^(cd|dvd)rom-/i.test(id)) return null;
  for (const [name, re, rank] of MAGAZINES) if (re.test(title) || re.test(id)) return { name, rank };
  if (!collections.some((c) => MAGAZINE_COLLECTIONS.test(c))) return null;
  // Незнакомый журнал: название без номера и даты.
  const name = title.replace(/\s*(?:[#№(\[]|\d|vol\.?|issue|nr\.?|no\.?\s*\d).*$/i, '').trim();
  return name.length >= 2 ? { name, rank: 2 } : null;
}

function yearOf(hit) {
  const f = hit.fields;
  if (f.year) return Number(f.year);
  const m = `${f.title} ${f.identifier} ${f.date ?? ''}`.match(/\b(19[89]\d|20[0-3]\d)\b/);
  return m ? Number(m[1]) : null;
}

/* ---------- полнотекстовый поиск ---------- */

async function search(phrase, from, to) {
  const hits = [];
  const filter = JSON.stringify({ year: { [from]: 'gte', [to]: 'lte' } });
  for (let page = 1; page <= 3; page++) {
    const url =
      'https://archive.org/services/search/beta/page_production/?service_backend=fts' +
      `&user_query=${encodeURIComponent(`"${phrase}"`)}&hits_per_page=100&page=${page}` +
      `&filter_map=${encodeURIComponent(filter)}`;
    const body = await json(url);
    const got = body?.response?.body?.hits?.hits ?? [];
    hits.push(...got);
    if (got.length < 100) break;
  }
  return hits;
}

/* ---------- текст номера по листам ---------- */

/** Тексты листов номера: индекс массива — это `n<N>` читалки. */
async function pagesOf(id, hitFile) {
  const meta = await json(`https://archive.org/metadata/${id}`);
  if (!meta?.files) return null;
  const names = meta.files.map((f) => f.name);
  const books = names.filter((n) => n.endsWith('_hocr_searchtext.txt.gz'));
  // Номер из нескольких книг (журнал плюс вкладка) читалка открывает с первой — лист не угадать.
  if (books.length > 1) return null;
  if (books.length === 1) {
    const base = books[0].slice(0, -'_hocr_searchtext.txt.gz'.length);
    if (hitFile && !hitFile.startsWith(base)) return null;
    const [text, index] = await Promise.all([
      get(fileUrl(id, books[0]), { binary: true }),
      get(fileUrl(id, `${base}_hocr_pageindex.json.gz`), { binary: true }),
    ]);
    if (!text || !index) return null;
    try {
      const all = gunzipSync(text).toString('utf8');
      const ranges = JSON.parse(gunzipSync(index).toString('utf8'));
      return ranges.map(([a, b]) => all.slice(a, b));
    } catch {
      return null;
    }
  }
  const xmls = names.filter((n) => n.endsWith('_djvu.xml'));
  if (xmls.length !== 1) return null;
  const xml = await get(fileUrl(id, xmls[0]));
  if (!xml) return null;
  return xml
    .split(/<OBJECT\b/)
    .slice(1)
    .map((chunk) =>
      [...chunk.matchAll(/<WORD\b[^>]*>([^<]*)<\/WORD>/g)]
        .map((m) => m[1])
        .join(' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>'),
    );
}

/* ---------- узнавание названия в OCR ---------- */

/*
 * OCR путает латиницу с похожей кириллицей («Ех Масhinа»), а в русском тексте
 * название склоняется: «в Периметре», «Космических рейнджеров». Поэтому
 * каждая буква допускает двойника, а у русского слова свободен хвост.
 */
const TWINS = {
  a: 'aа', b: 'bв', c: 'cс', e: 'eе', h: 'hн', k: 'kк', m: 'mм', o: 'oо0', p: 'pр', t: 'tт', x: 'xх', y: 'yу',
  а: 'аa', в: 'вb', е: 'еeё', ё: 'ёеe', к: 'кk', м: 'мm', н: 'нh', о: 'оo0', р: 'рp', с: 'сc', т: 'тt', у: 'уy', х: 'хx',
  i: 'il1|', l: 'li1|', 0: '0oо', 1: '1il',
};
const esc = (ch) => ch.replace(/[\\^$.*+?()[\]{}|/-]/g, '\\$&');
const letterClass = (ch) => (TWINS[ch] ? `[${[...new Set(TWINS[ch])].map(esc).join('')}]` : esc(ch));

function titleRegex(name) {
  const tokens = name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^a-zа-я0-9]+/)
    .filter(Boolean);
  if (tokens.length === 0) return null;
  const parts = tokens.map((t) => {
    let stem = t;
    let tail = '';
    if (/^[а-я]{4,}$/.test(t)) {
      stem = t.replace(/[аеиоуыэюяйь]$/, '');
      tail = '[а-яё]{0,3}';
    }
    return [...stem].map(letterClass).join('') + tail;
  });
  return new RegExp(`(?<![\\p{L}\\p{N}])${parts.join('[\\s\\p{P}«»„“”"\'’]{0,4}')}(?![\\p{L}\\p{N}])`, 'giu');
}

/** OCR-текст без переносов: «ат¬ мосферным», «Ма-\nшина». */
const clean = (s) =>
  String(s)
    .replace(/[¬­]\s*/g, '')
    .replace(/(\p{Ll})-\s*\n\s*(\p{Ll})/gu, '$1$2')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/ё/g, 'е');

/* ---------- похоже ли на рецензию ---------- */

const STRONG = [
  'вердикт', 'оценка', 'рейтинг', 'итог', 'резюме', 'плюсы', 'минусы', 'играбельность', 'увлекательность',
  'оправданность ожиданий', 'ценность для жанра', 'мастерство исполнения', 'дождались', 'обзор', 'рецензия',
  'verdict', 'score', 'overall', 'pros', 'cons', 'bottom line', 'we liked', 'lastability', 'rating',
];
const INFO = [
  'жанр', 'разработчик', 'издатель', 'системные требования', 'требования', 'похожие игры', 'мультиплеер',
  'графика', 'звук', 'интерфейс', 'управление', 'геймплей', 'developer', 'publisher', 'graphics', 'sound',
  'gameplay', 'genre',
];
const AGAINST = [
  'дата выхода', 'в разработке', 'превью', 'первый взгляд', 'ожидается', 'анонс', 'прохождение', 'секреты',
  'коды', 'хит-парад', 'чарт', 'preview', 'walkthrough', 'release date', 'cheats',
];
const has = (text, words) => words.filter((w) => text.includes(w));

/* ---------- игры ---------- */

const plain = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();

async function readGames() {
  const all = [];
  for (const id of (await readdir(GAMES)).sort()) {
    const file = path.join(GAMES, id, 'index.md');
    if (!existsSync(file)) continue;
    const fm = yaml.parse((await readFile(file, 'utf8')).split(/^---$/m)[1]);
    all.push({
      id,
      names: [fm.name, ...(fm.altNames ?? [])],
      year: fm.years?.start,
      reviews: fm.reviews ?? [],
      reading: fm.reading ?? [],
    });
  }
  for (const id of only) if (!all.some((g) => g.id === id)) console.error(`нет такой игры: ${id}`);
  const chosen = all.filter((g) => (only.length ? only.includes(g.id) : true) && g.year >= FROM && g.year <= TO);
  /*
   * Продолжения, чьё название начинается с названия игры: «Ex Machina:
   * Меридиан 113» для Ex Machina, «Корсары: Возвращение легенды» для
   * «Корсаров». Поиск по «Ex Machina» находит и их рецензии, и такие статьи
   * надо отличать.
   */
  for (const g of chosen) {
    const own = g.names.map(plain);
    g.sequels = all
      .filter((o) => o.id !== g.id)
      .flatMap((o) => o.names)
      .filter((n) => own.some((m) => m.length >= 3 && plain(n).startsWith(`${m} `)));
  }
  return chosen;
}

/** Выпуски, которые статья уже упоминает: их кандидатами не показываем. */
const usedIssues = (g) =>
  new Set(
    [...g.reviews.flatMap((r) => [r.url, r.scan]), ...g.reading.map((r) => r.url)]
      .filter(Boolean)
      .map((u) => u.match(/archive\.org\/(?:details|download|stream|embed)\/([^/?#]+)/)?.[1])
      .filter(Boolean),
  );

const outletKey = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, '');

async function scan(game) {
  const used = usedIssues(game);
  const scannedOutlets = new Set(
    game.reviews.filter((r) => /archive\.org/.test(r.scan ?? r.url)).map((r) => outletKey(r.outlet)),
  );
  const patterns = game.names.map(titleRegex).filter(Boolean);
  const sequels = game.sequels.map(titleRegex).filter(Boolean);
  const issues = new Map();
  for (const name of game.names) {
    if (name.replace(/[^\p{L}\p{N}]/gu, '').length < 3) continue;
    const hits = await search(name, game.year, game.year + LATE);
    hits.forEach((hit, order) => {
      const id = hit.fields.identifier;
      if (issues.has(id) || used.has(id)) return;
      const magazine = magazineOf(hit);
      const year = yearOf(hit);
      if (!magazine || !year || year < game.year || year > game.year + LATE) return;
      issues.set(id, { id, title: hit.fields.title, year, magazine, order, file: hit.fields.filename });
    });
  }
  /*
   * Поиск ранжирует номера по числу упоминаний, и номер с рецензией обычно
   * стоит в своём журнале высоко. Берём от каждого журнала первые несколько,
   * а русские журналы — раньше прочих.
   */
  const byMagazine = new Map();
  for (const issue of issues.values()) {
    const list = byMagazine.get(issue.magazine.name) ?? [];
    list.push(issue);
    byMagazine.set(issue.magazine.name, list);
  }
  const queue = [...byMagazine.values()]
    .flatMap((list) => list.sort((a, b) => a.order - b.order).slice(0, PER_MAGAZINE[list[0].magazine.rank]))
    .sort((a, b) => a.magazine.rank - b.magazine.rank || a.order - b.order)
    .slice(0, ISSUES);

  const found = [];
  if (DEBUG) for (const q of queue) console.log(`    · ${q.magazine.name} ${q.id} (${q.year})`);
  const loaded = await pool(queue, PARALLEL, (issue) => pagesOf(issue.id, issue.file).catch(() => null));
  for (const [k, issue] of queue.entries()) {
    const pages = loaded[k];
    if (!pages) continue;
    const texts = pages.map(clean);
    const counts = texts.map((t) => patterns.reduce((sum, re) => sum + (t.match(re)?.length ?? 0), 0));
    // Соседние листы с упоминаниями — одна статья; разрыв в лист допускаем (полоса с картинкой).
    let run = null;
    const runs = [];
    counts.forEach((c, i) => {
      if (!c) return;
      if (run && i - run.last <= 2) {
        run.last = i;
        run.hits += c;
      } else {
        run = { first: i, last: i, hits: c };
        runs.push(run);
      }
    });
    for (const r of runs) {
      // Врезка с оценкой бывает на следующем листе после текста.
      const span = texts.slice(r.first, r.last + 2).join(' ');
      // Статья про продолжение: его название занимает половину упоминаний.
      const sequelHits = sequels.reduce((sum, re) => sum + (span.match(re)?.length ?? 0), 0);
      if (sequelHits * 2 >= r.hits) continue;
      const strong = has(span, STRONG);
      const info = has(span, INFO);
      const against = has(span, AGAINST);
      const length = r.last - r.first + 1;
      const score = Math.min(r.hits, 20) + 2 * strong.length + info.length - 3 * against.length + Math.min(length, 4);
      const lead = texts[r.first];
      const at = patterns.map((re) => lead.search(re)).find((i) => i >= 0) ?? 0;
      found.push({
        game: game.id,
        outlet: issue.magazine.name,
        rank: issue.magazine.rank,
        issue: issue.title,
        id: issue.id,
        year: issue.year,
        n: r.first,
        sheets: length,
        hits: r.hits,
        score,
        strong,
        against,
        snippet: lead.slice(Math.max(0, at - 90), at + 160),
        image: `https://archive.org/download/${issue.id}/page/n${r.first}_w1400.jpg`,
        url: `https://archive.org/details/${issue.id}/page/n${r.first}/mode/2up`,
        text: pages.slice(r.first, r.last + 2).join('\n\n=== следующий лист ===\n\n'),
        scannedOutlet: scannedOutlets.has(outletKey(issue.magazine.name)),
      });
    }
  }
  /*
   * Одно издание — не больше двух кандидатов: в номере рядом с рецензией
   * обычно ещё превью. Один и тот же номер на archive.org бывает загружен
   * дважды под разными идентификаторами — такие статьи совпадают текстом.
   */
  found.sort((a, b) => a.rank - b.rank || b.score - a.score);
  if (DEBUG) for (const c of found) console.log(`    ${c.score} ${c.hits} ${c.id} n${c.n} [${c.strong}] -[${c.against}]`);
  const perOutlet = new Map();
  const seen = new Set();
  return found
    .filter((c) => c.score >= 8 && c.hits >= 2 && !c.scannedOutlet)
    .filter((c) => {
      const twin = `${c.outlet}|${c.year}|${c.snippet.replace(/[^a-zа-я]/g, '').slice(20, 80)}`;
      if (seen.has(twin)) return false;
      seen.add(twin);
      perOutlet.set(c.outlet, (perOutlet.get(c.outlet) ?? 0) + 1);
      return perOutlet.get(c.outlet) <= 2;
    })
    .filter((c, i, list) => list.slice(0, i).filter((o) => (o.rank === 0) === (c.rank === 0)).length < (c.rank === 0 ? TOP : 3));
}

/* ---------- главное ---------- */

const games = await readGames();
const report = {};
if (OUT) await mkdir(OUT, { recursive: true });
for (const game of games) {
  let candidates;
  try {
    candidates = await scan(game);
  } catch (error) {
    console.error(`${game.id}: ${error.message}`);
    continue;
  }
  report[game.id] = candidates.map(({ text, ...c }) => c);
  console.log(`\n${game.id} (${game.year}) — кандидатов: ${candidates.length}`);
  for (const c of candidates) {
    console.log(
      `  ${String(c.score).padStart(3)}  ${c.outlet} · ${c.issue} · лист n${c.n}` +
        (c.sheets > 1 ? `–n${c.n + c.sheets - 1}` : '') +
        `  [${c.strong.join(', ')}]${c.against.length ? ` против: ${c.against.join(', ')}` : ''}`,
    );
    console.log(`       ${c.url}`);
    if (OUT) {
      const dir = path.join(OUT, game.id);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${c.id}-n${c.n}.txt`), `${c.issue}\n${c.url}\n${c.image}\n\n${c.text}`);
    }
  }
  if (OUT) await writeFile(path.join(OUT, 'candidates.json'), JSON.stringify(report, null, 2));
}
