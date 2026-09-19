#!/usr/bin/env node
/**
 * Изображения со страниц Википедии для игр, которых нет в Steam.
 *
 * У статей о старых играх в русской и английской Википедии лежат скриншоты и
 * обложки, загруженные по правилам добросовестного использования. Мы берём их
 * по тем же основаниям: в информационных целях, в уменьшенном размере, с
 * указанием правообладателя и ссылкой на страницу файла.
 *
 *   node scripts/fetch-wiki.mjs --game gag --title "ГЭГ: Отвязное приключение"
 *   node scripts/fetch-wiki.mjs --game chasm --title "Chasm: The Rift" --lang en
 *   node scripts/fetch-wiki.mjs --auto            все игры без изображений: ищем статью по имени
 *   node scripts/fetch-wiki.mjs --auto --dry      только показать, что нашлось
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'igrostroy/0.1 (https://github.com/liullinil/our-games)';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const LIMIT = Number(opt('limit', 4));
const DRY = flag('dry');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(lang, params) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Википедия (${lang}) ответила ${res.status}`);
  return res.json();
}

/**
 * Категории статьи. По ним видно, о чём она на самом деле.
 */
async function categories(lang, titles) {
  const data = await api(lang, {
    action: 'query',
    titles: titles.join('|'),
    prop: 'categories',
    cllimit: 'max',
    clshow: '!hidden',
  });
  const out = new Map();
  for (const page of data.query?.pages ?? []) {
    out.set(page.title, (page.categories ?? []).map((c) => c.title).join(' | '));
  }
  return out;
}

/** Приметы статьи о видеоигре в названиях категорий. */
const GAME_CATEGORY = /компьютерные игры|видеоигр|video games|игры для |компьютерных игр/i;

/**
 * Поиск статьи об игре по названию.
 *
 * Одного поиска мало: по запросу «Перестройка» первой идёт статья о политике
 * позднего СССР, по «Ну, погоди!» — о мультфильме, по «Морскому бою» — о
 * настольной игре. Все три отдают снимки, которые не имеют к игре отношения,
 * и без проверки они попадали в статью. Поэтому смотрим категории каждого
 * кандидата и берём первого, у которого они говорят о видеоигре.
 */
async function findTitle(lang, name) {
  const data = await api(lang, {
    action: 'query',
    list: 'search',
    srsearch: lang === 'ru' ? `${name} компьютерная игра` : `${name} video game`,
    srlimit: 6,
    srnamespace: 0,
  });
  const hits = (data.query?.search ?? []).map((h) => h.title);
  if (hits.length === 0) return null;
  const cats = await categories(lang, hits.slice(0, 6));
  for (const title of hits) {
    if (!GAME_CATEGORY.test(cats.get(title) ?? '')) continue;
    if (!sameNumbers(name, title)) continue;
    return title;
  }
  return null;
}

/**
 * Совпадают ли числа в названиях.
 *
 * По запросу «Периметр 2: Новая Земля» поиск уверенно отдаёт статью
 * «Периметр (игра)» — про первую часть. Категории у неё правильные, и без этой
 * проверки в статью о второй части попадали кадры из первой. Номер части —
 * самое надёжное, что отличает продолжение от оригинала.
 */
function sameNumbers(name, title) {
  const digits = (s) => (String(s).match(/\d+/g) ?? []).filter((d) => d.length <= 2);
  const want = digits(name);
  const got = digits(title.replace(/\s*\(.*\)\s*$/, ''));
  if (want.length === 0) return got.length === 0;
  return want.every((d) => got.includes(d));
}

/** Файлы на странице с адресами, лицензией и описанием. */
async function pageImages(lang, title) {
  const data = await api(lang, {
    action: 'query',
    generator: 'images',
    titles: title,
    gimlimit: 50,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: 1600,
  });
  return (data.query?.pages ?? []).filter((p) => p.imageinfo?.[0]);
}

/** Мусорные файлы: логотипы, значки, флаги, иконки википроектов. */
const JUNK = /logo|icon|flag|wiki|symbol|commons|ambox|question|crystal|nuvola|emblem|button|star|arrow|edit|padlock|disambig|stub|portal|\.svg$|\.gif$/i;

function classify(file) {
  const meta = file.imageinfo[0].extmetadata ?? {};
  const strip = (v) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const desc = `${strip(meta.ImageDescription?.value)} ${file.title}`.toLowerCase();
  const cover = /cover|box|обложк|коробк|постер|poster|logo|title screen|титул/.test(desc);
  const shot = /screenshot|скриншот|снимок экрана|gameplay|игровой процесс|кадр/.test(desc);
  return shot ? 'Скриншот' : cover ? 'Обложка' : 'Скриншот';
}

function split(text) {
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/);
  if (!m) throw new Error('нет frontmatter');
  return { head: m[1], fm: m[2], tail: m[3], body: text.slice(m[0].length) };
}
const field = (fm, name) => fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? null;
const unquote = (s) => (s ? s.replace(/^["']|["']$/g, '') : s);
const QUOTE = String.fromCharCode(34);
const yamlStr = (s) => QUOTE + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim() + QUOTE;

function patchFrontmatter(fm, { poster, shots }) {
  let out = fm.replace(/^poster:.*\r?\n/m, '');
  const blocks = shots
    .map(
      (s) =>
        [
          `  - kind: image`,
          `    src: ./shots/${s.file}`,
          `    caption: ${yamlStr(s.caption)}`,
          `    author: ${yamlStr(s.author)}`,
          `    license: ${yamlStr(s.license)}`,
          `    sourceUrl: ${yamlStr(s.sourceUrl)}`,
        ].join('\n') + '\n',
    )
    .join('');
  const posterLine = poster ? `poster: ./shots/${poster}\n` : '';
  if (/^gallery:\s*\[\]\s*$/m.test(out)) {
    out = out.replace(/^gallery:\s*\[\]\s*$/m, `${posterLine}gallery:\n${blocks}`.replace(/\n$/, ''));
  } else {
    out = out.replace(/^summary:/m, `${posterLine}gallery:\n${blocks}summary:`);
  }
  return out;
}

async function fetchFor(gameId, lang, title, developer, gameName = title) {
  const files = (await pageImages(lang, title)).filter((f) => {
    const info = f.imageinfo[0];
    if (!/^image\/(jpeg|png)$/.test(info.mime ?? '')) return false;
    if (JUNK.test(f.title)) return false;
    if ((info.width ?? 0) < 240) return false;
    return true;
  });
  // Сначала скриншоты, потом обложки; внутри — крупнее раньше.
  files.sort((a, b) => {
    const ka = classify(a) === 'Скриншот' ? 0 : 1;
    const kb = classify(b) === 'Скриншот' ? 0 : 1;
    return ka - kb || (b.imageinfo[0].width ?? 0) - (a.imageinfo[0].width ?? 0);
  });
  const picked = files.slice(0, LIMIT);
  console.log(`  ${lang}: ${title} — файлов ${files.length}, берём ${picked.length}`);
  for (const f of picked) console.log(`    · ${f.title} (${classify(f)}, ${f.imageinfo[0].width}×${f.imageinfo[0].height})`);
  if (DRY || picked.length === 0) return null;

  const dir = path.join(GAMES, gameId, 'shots');
  await mkdir(dir, { recursive: true });
  const shots = [];
  let poster = null;
  for (const [i, f] of picked.entries()) {
    const info = f.imageinfo[0];
    const src = info.thumburl ?? info.url;
    const res = await fetch(src, { headers: { 'User-Agent': UA } });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const license = classify(f);
    const ext = 'jpg';
    const file = `${license === 'Обложка' ? 'cover' : 'wiki'}-${String(i + 1).padStart(2, '0')}.${ext}`;
    const out = await sharp(buf, { failOn: 'none' }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    await writeFile(path.join(dir, file), out);
    shots.push({
      file,
      caption: license === 'Обложка' ? `${gameName}: обложка` : `${gameName}: кадр из игры`,
      author: developer,
      license,
      sourceUrl: info.descriptionurl,
    });
    if (!poster && license === 'Скриншот') poster = file;
    await sleep(400);
  }
  if (!poster && shots[0]) poster = shots[0].file;
  return { poster, shots };
}

async function readGame(id) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) return null;
  const text = await readFile(file, 'utf8');
  const { fm } = split(text);
  return {
    id,
    file,
    name: unquote(field(fm, 'name')),
    developer: field(fm, 'developer'),
    hasImages: /- kind: image/.test(fm),
  };
}

/** Имя студии для подписи «©»: короткое имя из карточки студии. */
async function studioName(id) {
  try {
    const text = await readFile(path.join(root, 'src', 'content', 'studios', id, 'index.md'), 'utf8');
    const shorts = [...text.matchAll(/^\s+short:\s*(.+)$/gm)].map((m) => unquote(m[1].trim()));
    return shorts[shorts.length - 1] ?? id;
  } catch {
    return id;
  }
}

async function apply(game, result) {
  const text = await readFile(game.file, 'utf8');
  const { head, fm, tail, body } = split(text);
  await writeFile(game.file, head + patchFrontmatter(fm, result) + tail + body, 'utf8');
}

async function main() {
  if (flag('auto')) {
    const ids = (await readdir(GAMES, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
    for (const id of ids) {
      const game = await readGame(id);
      if (!game || game.hasImages) continue;
      console.log(`${id}: ${game.name}`);
      let result = null;
      for (const lang of ['ru', 'en']) {
        const title = await findTitle(lang, game.name);
        if (!title) continue;
        result = await fetchFor(id, lang, title, await studioName(game.developer), game.name);
        if (result) break;
        await sleep(500);
      }
      if (result) {
        await apply(game, result);
        console.log(`  ✓ записано ${result.shots.length}`);
      }
      await sleep(800);
    }
    return;
  }

  const id = opt('game');
  const title = opt('title');
  if (!id || !title) {
    console.error('Укажите --game <id> --title "Название статьи" [--lang ru|en], либо --auto.');
    process.exit(1);
  }
  const game = await readGame(id);
  if (!game) {
    console.error(`Нет игры ${id}`);
    process.exit(1);
  }
  const result = await fetchFor(id, opt('lang', 'ru'), title, await studioName(game.developer), game.name);
  if (result) {
    await apply(game, result);
    console.log(`✓ записано ${result.shots.length}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
