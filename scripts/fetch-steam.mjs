#!/usr/bin/env node
/**
 * Скриншоты и обложки из Steam.
 *
 * Магазин Steam отдаёт карточку игры открытым JSON без ключа: там лежат адреса
 * скриншотов, обложка (header) и имена разработчиков. Забираем их, ужимаем и
 * вписываем в frontmatter статьи: постер и галерею с основанием «Скриншот».
 *
 *   node scripts/fetch-steam.mjs                 все игры со steamAppId без галереи
 *   node scripts/fetch-steam.mjs stalker-shoc    только эти игры
 *   node scripts/fetch-steam.mjs --refetch ...   перекачать, даже если галерея есть
 *   node scripts/fetch-steam.mjs --search        подобрать steamAppId играм, у которых его нет
 *   node scripts/fetch-steam.mjs --limit 6       сколько скриншотов брать (по умолчанию 5)
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) igrostroy/0.1 (+https://github.com/liullinil/our-games)';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const LIMIT = Number(opt('limit', 5));
const REFETCH = flag('refetch');
const only = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a) && a !== opt('limit', ''));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  let wait = 2000;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.8' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`ответ ${res.status}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      if (attempt === tries) throw e;
      await sleep(wait);
      wait *= 2;
    }
  }
  return null;
}

async function getBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

/** Frontmatter и тело статьи по отдельности. */
function split(text) {
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/);
  if (!m) throw new Error('нет frontmatter');
  return { head: m[1], fm: m[2], tail: m[3], body: text.slice(m[0].length) };
}

const field = (fm, name) => fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? null;
const unquote = (s) => (s ? s.replace(/^["']|["']$/g, '') : s);

/** Ужать кадр: скриншоты Steam идут в 1920 точек и весят по полмегабайта. */
async function shrink(buffer, maxWidth = 1600) {
  const img = sharp(buffer, { failOn: 'none' });
  const meta = await img.metadata();
  let pipe = img;
  if ((meta.width ?? 0) > maxWidth) pipe = pipe.resize({ width: maxWidth });
  return pipe.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

const QUOTE = String.fromCharCode(34);
const yamlStr = (s) => QUOTE + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim() + QUOTE;

/**
 * Вписывает постер и галерею.
 *
 * `gallery: []` заменяется списком; если галерея уже непустая, скриншоты
 * добавляются в начало списка (видео остаётся после них). Постер ставится
 * перед галереей, старый постер заменяется.
 */
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
          `    license: ${yamlStr(s.license ?? 'Скриншот')}`,
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
    appId: Number(field(fm, 'steamAppId')) || null,
    hasImages: /- kind: image/.test(fm),
  };
}

async function fetchGame(game) {
  // Часть игр снята с продажи в российском регионе: тогда спрашиваем американский.
  let entry = null;
  for (const cc of ['ru', 'us']) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${game.appId}&l=russian&cc=${cc}`;
    const data = await getJson(url);
    entry = data?.[String(game.appId)];
    if (entry?.success) break;
    await sleep(800);
  }
  if (!entry?.success) {
    console.log(`  ${game.id}: Steam не отдал карточку ${game.appId}`);
    return null;
  }
  const d = entry.data;
  if (d.type && d.type !== 'game' && d.type !== 'dlc') {
    console.log(`  ${game.id}: ${game.appId} — это ${d.type}, а не игра`);
  }
  const author = (d.developers ?? []).concat(d.publishers ?? []).filter((x, i, a) => a.indexOf(x) === i).join(', ') || game.name;
  const dir = path.join(GAMES, game.id, 'shots');
  await mkdir(dir, { recursive: true });
  const sourceUrl = `https://store.steampowered.com/app/${game.appId}/`;

  /*
   * Постер — обложка из библиотеки Steam (1920×620), на ней логотип игры:
   * на карточке каталога и на карте связей игра узнаётся по нему, а не по
   * случайному кадру. Если широкой обложки нет, берём маленький header.
   */
  let poster = null;
  const shots = [];
  const hero = await getBytes(`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/library_hero.jpg`);
  const cover = hero ?? (d.header_image ? await getBytes(d.header_image) : null);
  if (cover) {
    const buf = await sharp(cover, { failOn: 'none' }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    await writeFile(path.join(dir, 'poster.jpg'), buf);
    poster = 'poster.jpg';
    shots.push({ file: 'poster.jpg', caption: `${d.name ?? game.name}: обложка в Steam`, author, sourceUrl, license: 'Промо' });
  }

  const list = (d.screenshots ?? []).slice(0, LIMIT);
  for (const [i, s] of list.entries()) {
    const src = s.path_full ?? s.path_thumbnail;
    if (!src) continue;
    const bytes = await getBytes(src);
    if (!bytes) continue;
    const file = `shot-${String(i + 1).padStart(2, '0')}.jpg`;
    await writeFile(path.join(dir, file), await shrink(bytes));
    shots.push({ file, caption: `${d.name ?? game.name}: кадр из игры`, author, sourceUrl, license: 'Скриншот' });
  }
  return { poster, shots, steamName: d.name };
}

async function searchAppId(name) {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(name)}&cc=ru&l=russian`;
  const data = await getJson(url);
  return (data?.items ?? []).slice(0, 3).map((x) => ({ id: x.id, name: x.name }));
}

async function main() {
  const ids = only.length ? only : (await readdir(GAMES, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const games = (await Promise.all(ids.map(readGame))).filter(Boolean);

  if (flag('search')) {
    for (const g of games) {
      if (g.appId) continue;
      const found = await searchAppId(g.name);
      console.log(`${g.id} (${g.name}): ${found.map((f) => `${f.id} «${f.name}»`).join(' | ') || 'ничего'}`);
      await sleep(600);
    }
    return;
  }

  let done = 0;
  let skipped = 0;
  for (const g of games) {
    if (!g.appId) continue;
    if (g.hasImages && !REFETCH) {
      skipped += 1;
      continue;
    }
    console.log(`${g.id}: ${g.name} (${g.appId})`);
    let result;
    try {
      result = await fetchGame(g);
    } catch (e) {
      console.log(`  ошибка: ${e.message}`);
      continue;
    }
    if (!result || (!result.poster && result.shots.length === 0)) continue;
    // Перечитываем файл: статью могли поправить, пока качались кадры.
    const text = await readFile(g.file, 'utf8');
    const { head, fm, tail, body } = split(text);
    let cleanFm = fm;
    if (REFETCH) cleanFm = cleanFm.replace(/^ {2}- kind: image\r?\n(?: {4}.*\r?\n)*/gm, '');
    const patched = patchFrontmatter(cleanFm, result);
    await writeFile(g.file, head + patched + tail + body, 'utf8');
    console.log(`  ✓ постер${result.poster ? '' : ' нет'}, скриншотов: ${result.shots.length}`);
    done += 1;
    await sleep(1200);
  }
  console.log(`\nГотово: обработано ${done}, пропущено с галереей ${skipped}, без steamAppId ${games.filter((g) => !g.appId).length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
