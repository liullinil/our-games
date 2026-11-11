#!/usr/bin/env node
/**
 * Обложки коробок и сами диски с Old-Games.RU.
 *
 * У большинства статей обложка уже есть, но взята она из Википедии, и
 * какое там издание — как повезёт. Самый полный архив коробок — Old-Games.RU:
 * у каждой игры там страница сканов, у каждого скана подписано, что это —
 * «Передняя сторона», «Задняя сторона», «Разворот», «Носитель», — и кто его
 * залил. Носитель — это сам диск или кассета.
 *
 * Издания при этом не размечены: у «Аллодов» обе передние стороны
 * оказались западным Rage of Mages, а русская коробка «Буки» лежит только в
 * Википедии. Подписать издание автоматически нельзя, а подписать неверно —
 * хуже, чем не подписать. Поэтому работа идёт в два шага:
 *
 *  1. --collect <папка> — скачать кандидатов в черновую папку и составить
 *     опись. Передние стороны, совпадающие с уже лежащей обложкой или друг с
 *     другом, отсеиваются по отпечатку.
 *  2. --apply <опись> — записать в статьи то, что человек отобрал и подписал
 *     в описи: для каждого скана поле `keep` и, если нужно, `edition` —
 *     «русское издание», «западное издание».
 *
 * Основание то же, что у обложек из Википедии: изображение приводится для
 * опознания издания, правообладатель — издатель, в подписи назван тот, кто
 * сделал скан.
 *
 *   node scripts/fetch-oldgames-covers.mjs --collect tmp/covers
 *   node scripts/fetch-oldgames-covers.mjs --collect tmp/covers vangers knyaz
 *   node scripts/fetch-oldgames-covers.mjs --apply tmp/covers/manifest.json
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yaml from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const STUDIOS = path.join(root, 'src', 'content', 'studios');
const SITE = 'https://www.old-games.ru';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) nashi-igry-encyclopedia/1.0';
const QUOTE = '"';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
const COLLECT = opt('collect');
const APPLY = opt('apply');
const only = args.filter((a, i) => !a.startsWith('--') && !['--collect', '--apply'].includes(args[i - 1]));
/* Old-Games.RU — про старые игры; дальше этого года их там почти нет. */
const LAST_YEAR = 2014;
/* Сколько разных передних сторон брать на игру: обычно это русское и западное издание. */
const MAX_FRONTS = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const yamlStr = (s) => QUOTE + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim() + QUOTE;

/** Название без регистра, «ё» и пунктуации: «Корсары: Проклятие…» = «корсары проклятие». */
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'’.,:!?–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru' } });
  if (!res.ok) throw new Error(`Old-Games.RU ответил ${res.status} на ${url}`);
  return res.text();
}

/** Картинка — только если это действительно картинка: на чужой адрес сервер отвечает текстом. */
async function image(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: SITE } });
  if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? '')) return null;
  return Buffer.from(await res.arrayBuffer());
}

/** Идентификатор игры: из ссылки, уже стоящей в статье, или из поиска по каталогу. */
async function findId(fm, text) {
  const linked = text.match(/old-games\.ru\/game\/(?:[a-z]+\/)?(\d+)\.html/)?.[1];
  if (linked) return { id: linked, how: 'ссылка в статье' };

  const ours = new Set([fm.name, ...(fm.altNames ?? [])].map(norm));
  const html = (await get(`${SITE}/catalog/?gamename=${encodeURIComponent(String(fm.name).replace(/[«»"]/g, ''))}`)).replace(/\s+/g, ' ');
  /*
   * Строка выдачи: <a title="Вангеры" href="/game/616.html">…</a> и следом
   * <div class="alt-titles-list">Vangers: One for the Road</div>. Берём только
   * точное совпадение с нашим названием или одним из альтернативных:
   * «Корсары» и «Корсары 2» — разные игры, а поиск вернёт обе.
   */
  for (const row of html.split('<tr').slice(1)) {
    const m = row.match(/<a title="([^"]+)" href="\/game\/(\d+)\.html">/);
    if (!m) continue;
    const alt = row.match(/<div class="alt-titles-list">([^<]*)<\/div>/)?.[1] ?? '';
    const titles = [m[1], ...alt.split(/\s*[,;]\s*/)].map((t) => norm(t.replace(/&amp;/g, '&').replace(/&#039;/g, "'")));
    if (titles.some((t) => ours.has(t))) return { id: m[2], how: `поиск: «${m[1]}»` };
  }
  return null;
}

/** Сканы со страницы обложек: адрес большой версии, что это за сторона, кто залил. */
async function covers(id) {
  const html = (await get(`${SITE}/game/covers/${id}.html`)).replace(/\s+/g, ' ');
  const items = [];
  for (const block of html.split('class="game-cover-item').slice(1)) {
    const large = block.match(/href="(\/games\/[^"]+\/covers\/largecover\/[^"]+\.(?:jpe?g|png|gif))"/i)?.[1];
    const side = block.match(/class="cover-text">\s*([^<]+?)\s*</)?.[1];
    const who = block.match(/class="cover-author">\s*Залил\s*(?:<a[^>]*>)?\s*([^<]+?)\s*</)?.[1];
    if (large && side) items.push({ url: SITE + large, side, who: who ?? 'участник Old-Games.RU' });
  }
  return items;
}

/**
 * Отпечаток картинки: 9×8 оттенков серого и разница соседних точек. Две
 * сканированные копии одной обложки дают почти одинаковые отпечатки.
 */
async function print(buf) {
  const px = await sharp(buf, { failOn: 'none' }).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  return bits;
}
const distance = (a, b) => [...a].filter((c, i) => c !== b[i]).length;
const SAME = 12;

/** Шаг первый: кандидаты в черновую папку и опись. */
async function collect(dir) {
  await mkdir(dir, { recursive: true });
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};
  const ids = only.length ? only : (await readdir(GAMES)).sort();

  for (const id of ids) {
    const file = path.join(GAMES, id, 'index.md');
    if (!existsSync(file) || manifest[id]) continue;
    const text = await readFile(file, 'utf8');
    const fm = yaml.parse(text.split(/^---$/m)[1]);
    if (fm.years?.start > LAST_YEAR) continue;
    if (text.includes('old-games.ru/game/covers/')) continue;

    let found;
    try {
      found = await findId(fm, text);
    } catch (e) {
      console.log(`· ${id}: ${e.message}`);
      await sleep(2000);
      continue;
    }
    await sleep(1200);
    if (!found) continue;

    let all;
    try {
      all = await covers(found.id);
    } catch (e) {
      console.log(`· ${id}: ${e.message}`);
      continue;
    }
    await sleep(1200);

    // Отпечатки уже лежащих обложек — чтобы не предлагать ту же самую второй раз.
    const known = [];
    for (const g of fm.gallery ?? []) {
      if (g.kind !== 'image' || g.license !== 'Обложка') continue;
      try {
        known.push(await print(await readFile(path.join(GAMES, id, g.src))));
      } catch {}
    }

    const picked = [];
    const fronts = all.filter((c) => /^Передняя/i.test(c.side));
    const media = all.find((c) => /^Носитель/i.test(c.side));
    for (const c of [...fronts, media].filter(Boolean)) {
      const isFront = /^Передняя/i.test(c.side);
      if (isFront && picked.filter((p) => p.kind === 'box').length >= MAX_FRONTS) continue;
      const buf = await image(c.url);
      await sleep(600);
      if (!buf) continue;
      const p = await print(buf);
      if (isFront && [...known, ...picked.map((x) => x.print)].some((q) => distance(p, q) <= SAME)) continue;
      const kind = isFront ? 'box' : 'media';
      const name = `${id}--${kind}-${picked.length + 1}.jpg`;
      await writeFile(path.join(dir, name), await sharp(buf, { failOn: 'none' }).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer());
      picked.push({ kind, file: name, url: c.url, who: c.who, print: p });
    }
    if (picked.length === 0) continue;

    manifest[id] = {
      name: fm.name,
      page: `${SITE}/game/covers/${found.id}.html`,
      found: found.how,
      items: picked.map(({ print: _, ...rest }) => ({ ...rest, keep: true, edition: '' })),
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`${id} (${fm.name}) → ${found.how}: ${picked.map((p) => p.kind).join(', ')}`);
  }
  console.log(`\nКандидатов: ${Object.values(manifest).reduce((n, g) => n + g.items.length, 0)} в ${Object.keys(manifest).length} играх. Опись: ${manifestPath}`);
}

/** Правообладатель для подписи: первый издатель, а если его нет — разработчик. */
async function owner(fm) {
  const sid = (fm.publishers ?? [])[0] ?? fm.developer;
  if (!sid) return 'правообладатель';
  try {
    const s = await readFile(path.join(STUDIOS, sid, 'index.md'), 'utf8');
    return s.match(/^\s+- name:\s*"?([^"\n]+)"?/m)?.[1]?.trim() ?? sid;
  } catch {
    return sid;
  }
}

/** Шаг второй: записать отобранное. */
async function apply(manifestPath) {
  const dir = path.dirname(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  let wrote = 0;
  for (const [id, entry] of Object.entries(manifest)) {
    const items = entry.items.filter((x) => x.keep);
    if (items.length === 0) continue;
    const file = path.join(GAMES, id, 'index.md');
    const text = await readFile(file, 'utf8');
    if (text.includes(entry.page)) continue;
    const fm = yaml.parse(text.split(/^---$/m)[1]);
    const who = await owner(fm);
    const carrier = (fm.years?.start ?? 0) >= 1995 ? 'диск' : 'носитель';
    const shots = path.join(GAMES, id, 'shots');
    await mkdir(shots, { recursive: true });

    const blocks = [];
    for (const [i, it] of items.entries()) {
      const name = `og-${it.kind}-${i + 1}.jpg`;
      await writeFile(path.join(shots, name), await readFile(path.join(dir, it.file)));
      // В описи можно уточнить, что это за предмет: у Welltris 1989 года носитель — дискета.
      const noun = it.what ?? (it.kind === 'box' ? 'обложка коробки' : carrier);
      const what = `${noun}${it.edition ? `, ${it.edition}` : ''}`;
      blocks.push(
        [
          `  - kind: image`,
          `    src: ./shots/${name}`,
          `    caption: ${yamlStr(`${fm.name}: ${what} (скан: ${it.who}, Old-Games.RU)`)}`,
          `    author: ${yamlStr(who)}`,
          `    license: "Обложка"`,
          `    sourceUrl: ${yamlStr(entry.page)}`,
        ].join('\n') + '\n',
      );
    }

    // Ставим после последней картинки — перед роликами и моделями.
    const images = [...text.matchAll(/^ {2}- kind: image\r?\n(?: {4}.*\r?\n)*/gm)];
    let next;
    if (images.length) {
      const last = images[images.length - 1];
      const at = last.index + last[0].length;
      next = text.slice(0, at) + blocks.join('') + text.slice(at);
    } else if (/^gallery:\s*\[\]\s*$/m.test(text)) {
      next = text.replace(/^gallery:\s*\[\]\s*$/m, `gallery:\n${blocks.join('')}`.replace(/\n$/, ''));
    } else {
      next = text.replace(/^gallery:[ \t]*\r?\n/m, `gallery:\n${blocks.join('')}`);
    }
    await writeFile(file, next, 'utf8');
    wrote += items.length;
    console.log(`${id}: ${items.length}`);
  }
  console.log(`\nЗаписано сканов: ${wrote}`);
}

const run = COLLECT ? collect(path.resolve(COLLECT)) : APPLY ? apply(path.resolve(APPLY)) : null;
if (!run) {
  console.error('Укажите --collect <папка> или --apply <опись>');
  process.exitCode = 1;
} else {
  run.catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
