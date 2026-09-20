#!/usr/bin/env node
/**
 * Снимки экрана мобильных игр из App Store.
 *
 * В Steam мобильных игр нет, в Википедии статьи о них без картинок, на
 * Викискладе их нет и подавно — Fishdom, Homescapes и Township так и стояли
 * с пустыми карточками. Зато Apple отдаёт карточку приложения открытым JSON
 * без ключа, и в ней лежат и снимки экрана, и настоящее имя издателя.
 *
 * Основание то же, что и у кадров из Steam: это промо-материалы, которые
 * издатель сам выложил в витрину магазина. Правообладателем в подпись идёт
 * продавец из карточки, ссылкой — страница приложения.
 *
 *   node scripts/fetch-appstore.mjs fishdom homescapes township
 *   node scripts/fetch-appstore.mjs --id 664575829 fishdom
 *   node scripts/fetch-appstore.mjs fishdom --dry
 *
 * Идентификатор нельзя выдумывать ровно по той же причине, что и в Steam:
 * число само по себе ведёт на какое-нибудь приложение, и кадры приедут от
 * чужой игры. Поэтому по имени ищем сами, а найденное принимаем только при
 * строгом совпадении названий.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { namesMatch, fieldList } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'igrostroy/0.1 (+https://github.com/liullinil/our-games)';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const LIMIT = Number(opt('limit', 5));
const DRY = flag('dry');
const FORCED_ID = opt('id', null);
const only = args.filter((a) => !a.startsWith('--') && a !== opt('limit', '') && a !== FORCED_ID);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`App Store ответил ${res.status}`);
  return res.json();
}

async function getBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function split(text) {
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/);
  if (!m) throw new Error('нет frontmatter');
  return { head: m[1], fm: m[2], tail: m[3], body: text.slice(m[0].length) };
}
const field = (fm, name) => fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? null;
const unquote = (s) => (s ? s.replace(/^["']|["']$/g, '') : s);

/** Снимки из App Store приходят в полный размер телефона — ужимаем. */
async function shrink(buffer, maxWidth = 1200) {
  const img = sharp(buffer, { failOn: 'none' });
  const meta = await img.metadata();
  let pipe = img;
  if ((meta.width ?? 0) > maxWidth) pipe = pipe.resize({ width: maxWidth });
  return pipe.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

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
  } else if (/^gallery:\s*$/m.test(out)) {
    out = out.replace(/^gallery:\s*$/m, `${posterLine}gallery:\n${blocks}`.replace(/\n$/, ''));
  } else {
    out = out.replace(/^summary:/m, `${posterLine}gallery:\n${blocks}summary:`);
  }
  return out;
}

async function readGame(id) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) return null;
  const text = await readFile(file, 'utf8');
  const { fm } = split(text);
  return {
    id,
    file,
    text,
    name: unquote(field(fm, 'name')),
    altNames: fieldList(fm, 'altNames'),
    hasImages: /- kind: image/.test(fm),
  };
}

/**
 * Карточка приложения по названию.
 *
 * Строгое совпадение имён с точностью до приписок вроде «Match 3 Games»:
 * у Homescapes в магазине именно такой хвост. Поэтому сравниваем и полное
 * имя, и часть до двоеточия.
 */
async function findApp(game) {
  if (FORCED_ID) {
    const data = await getJson(`https://itunes.apple.com/lookup?id=${FORCED_ID}`);
    return data.results?.[0] ?? null;
  }
  const terms = [...new Set([...game.altNames.filter((a) => /[a-z]/i.test(a)), game.name])];
  const ours = [game.name, ...game.altNames];
  for (const term of terms) {
    const url = new URL('https://itunes.apple.com/search');
    url.search = new URLSearchParams({ term, entity: 'software', country: 'us', limit: '8' });
    const data = await getJson(url);
    for (const r of data.results ?? []) {
      const head = String(r.trackName).split(/\s*[:–—-]\s*/)[0];
      if (namesMatch(ours, r.trackName, { strict: true }) || namesMatch(ours, head, { strict: true })) return r;
    }
    await sleep(600);
  }
  return null;
}

async function fetchGame(game) {
  const app = await findApp(game);
  if (!app) {
    console.log(`· ${game.id}: в App Store не нашлось`);
    return false;
  }
  const page = `https://apps.apple.com/app/id${app.trackId}`;
  console.log(`${game.id}: ${app.trackName} (${app.trackId}) — ${app.sellerName}`);

  const shots = (app.screenshotUrls ?? []).slice(0, LIMIT);
  if (shots.length === 0) {
    console.log('  нет снимков экрана');
    return false;
  }
  if (DRY) {
    console.log(`  нашлось снимков: ${shots.length}, обложка: ${app.artworkUrl512 ? 'есть' : 'нет'}`);
    return false;
  }

  const dir = path.join(GAMES, game.id, 'shots');
  await mkdir(dir, { recursive: true });
  const written = [];

  if (app.artworkUrl512) {
    const buf = await sharp(await getBytes(app.artworkUrl512), { failOn: 'none' })
      .resize({ width: 512, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
    await writeFile(path.join(dir, 'poster.jpg'), buf);
    written.push({
      file: 'poster.jpg',
      caption: `${game.name}: значок в App Store`,
      author: app.sellerName,
      license: 'Промо',
      sourceUrl: page,
    });
  }

  for (const [i, url] of shots.entries()) {
    const file = `shot-${String(i + 1).padStart(2, '0')}.jpg`;
    await writeFile(path.join(dir, file), await shrink(await getBytes(url)));
    written.push({
      file,
      caption: `${game.name}: кадр из игры`,
      author: app.sellerName,
      license: 'Скриншот',
      sourceUrl: page,
    });
    await sleep(150);
  }

  const { head, fm, tail, body } = split(game.text);
  const poster = written[0]?.file === 'poster.jpg' ? 'poster.jpg' : undefined;
  const gallery = poster ? written.slice(1) : written;
  const patched = patchFrontmatter(fm, { poster, shots: poster ? [written[0], ...gallery] : gallery });
  await writeFile(game.file, head + patched + tail + body, 'utf8');
  console.log(`  ✓ записано ${written.length}`);
  return true;
}

if (only.length === 0) {
  console.error('Укажите игры: node scripts/fetch-appstore.mjs fishdom homescapes township');
  process.exit(1);
}

let done = 0;
for (const id of only) {
  const game = await readGame(id);
  if (!game) {
    console.log(`· ${id}: нет такой игры`);
    continue;
  }
  if (game.hasImages) {
    console.log(`· ${id}: картинки уже есть`);
    continue;
  }
  if (await fetchGame(game)) done += 1;
  await sleep(800);
}
console.log(`\nГотово: заполнено ${done} из ${only.length}.`);
