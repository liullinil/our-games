#!/usr/bin/env node
/**
 * Обложки коробок и сами диски из библиотеки archive.org.
 *
 * Old-Games.RU не держит игр, которые ещё продаются, — а это как раз
 * «Сталкер», «Периметр», Ex Machina, King's Bounty. Зато на archive.org
 * люди выкладывают свои диски вместе со сканами коробок: коллекции русских
 * изданий нулевых (`russian-post-soviet-cds`, архив сканов в 1200 dpi
 * `pravdyvtsev-a-k-software-preservation`), россыпь `clearancebin_unsorted`,
 * образы `cdromimages`. Порядка там нет: одно издание лежит трижды, у
 * половины предметов сканов нет вовсе — только образ диска, — а издание
 * подписано через раз.
 *
 * Поэтому работа та же, что с Old-Games.RU, в два шага:
 *
 *  1. --collect <папка> — найти предметы, чьё название точно совпадает с
 *     названием игры, скачать из них крупные картинки, отсеять повторы по
 *     отпечатку и составить опись;
 *  2. человек смотрит листы-превью и отмечает в описи `keep`, `kind`
 *     («box» — коробка, «media» — диск) и `edition`; записывает отобранное
 *     `node scripts/fetch-oldgames-covers.mjs --apply <опись>`.
 *
 * Сборники, демоверсии, моды и репаки отбрасываются по названию: обложка
 * сборника — это не обложка игры.
 *
 *   node scripts/fetch-archive-covers.mjs --collect tmp/ia-covers
 *   node scripts/fetch-archive-covers.mjs --collect tmp/ia-covers xenus postal-3
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yaml from 'yaml';
import { namesMatch } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) nashi-igry-encyclopedia/1.0';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
const COLLECT = opt('collect');
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--collect');
/* Коробки с дисками — это примерно с 1990 по середину десятых; дальше игры продаются цифрой. */
const FIRST_YEAR = 1990;
const LAST_YEAR = 2016;
/* Сколько картинок брать из одного предмета и сколько всего на игру. */
const PER_ITEM = 6;
const PER_GAME = 12;
/* Меньше этого — превью или скриншот, а не скан. */
const MIN_BYTES = 150_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Сборники, демо, моды, саундтреки и прочее, что не коробка самой игры. */
const NOT_A_BOX =
  /сборник|антолог|коллекц|collection|anthology|compilation|gold|золот|платин|platinum|\d\s*(в|in)\s*1|demo|демо|\bmods?\b|\bмод\b|patch|патч|repack|репак|trainer|soundtrack|\bost\b|artbook|press ?kit|assets|fan ?art|wiki|magazine|журнал|alpha|beta|prototype|build \d/i;

async function json(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      return res.ok ? await res.json() : null;
    } catch {
      await sleep(3000);
    }
  }
  return null;
}

async function image(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? '')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Части названия предмета: «Space Rangers 2: Dominators / Космические рейнджеры 2: Доминаторы (2004) (1C) [Scans]». */
const titleParts = (title) =>
  String(title)
    .replace(/\s*[[(].*$/, '')
    .replace(/[«»"]/g, '')
    .split(/\s+\/\s+|;\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Предметы archive.org, чьё название — это название нашей игры. */
async function findItems(names) {
  const items = new Map();
  for (const name of names) {
    const q = `title:("${name.replace(/"/g, '')}") AND mediatype:(software OR image OR texts)`;
    const url =
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}` +
      '&fl[]=identifier&fl[]=title&fl[]=collection&rows=100&output=json';
    const body = await json(url);
    await sleep(500);
    for (const d of body?.response?.docs ?? []) {
      if (items.has(d.identifier) || NOT_A_BOX.test(d.title)) continue;
      if (!titleParts(d.title).some((part) => namesMatch(names, part, { strict: true }))) continue;
      items.set(d.identifier, { id: d.identifier, title: String(d.title) });
    }
  }
  return [...items.values()];
}

/** Крупные картинки предмета: сначала то, что похоже на обложку, потом диски. */
async function picturesOf(id) {
  const meta = await json(`https://archive.org/metadata/${id}`);
  await sleep(400);
  const files = (meta?.files ?? []).filter(
    (f) =>
      /\.(jpe?g|png)$/i.test(f.name) &&
      Number(f.size ?? 0) >= MIN_BYTES &&
      !/thumb|__ia|screen|скрин|shot|ss_|snap|_page_|\/page/i.test(f.name),
  );
  const rank = (name) => (/front|cover|обложк|box|короб|^1[._]/i.test(name) ? 0 : /disc|disk|диск|cd|dvd/i.test(name) ? 1 : 2);
  return files
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'ru', { numeric: true }))
    .slice(0, PER_ITEM)
    .map((f) => ({
      name: f.name,
      kind: /disc|disk|диск|cd|dvd/i.test(f.name) && !/cover|обложк|box/i.test(f.name) ? 'media' : 'box',
      url: `https://archive.org/download/${id}/${f.name.split('/').map(encodeURIComponent).join('/')}`,
    }));
}

/** Отпечаток картинки, как в fetch-oldgames-covers.mjs: 9×8 серого и разница соседей. */
async function print(buf) {
  const px = await sharp(buf, { failOn: 'none' }).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  return bits;
}
const distance = (a, b) => [...a].filter((c, i) => c !== b[i]).length;
const SAME = 12;

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
    const year = fm.years?.start ?? 0;
    if (!only.length && (year < FIRST_YEAR || year > LAST_YEAR)) continue;
    const names = [fm.name, ...(fm.altNames ?? [])];

    const items = (await findItems(names)).filter((it) => !text.includes(`archive.org/details/${it.id}`));
    if (items.length === 0) continue;

    // Отпечатки уже лежащих обложек — чтобы не предлагать ту же самую второй раз.
    const known = [];
    for (const g of fm.gallery ?? []) {
      if (g.kind !== 'image' || g.license !== 'Обложка') continue;
      try {
        known.push(await print(await readFile(path.join(GAMES, id, g.src))));
      } catch {}
    }

    const picked = [];
    for (const item of items) {
      if (picked.length >= PER_GAME) break;
      for (const pic of await picturesOf(item.id)) {
        if (picked.length >= PER_GAME) break;
        const buf = await image(pic.url);
        await sleep(300);
        if (!buf) continue;
        let p;
        try {
          p = await print(buf);
        } catch {
          continue;
        }
        if ([...known, ...picked.map((x) => x.print)].some((q) => distance(p, q) <= SAME)) continue;
        const name = `${id}--ia-${picked.length + 1}.jpg`;
        await writeFile(
          path.join(dir, name),
          await sharp(buf, { failOn: 'none' })
            .rotate()
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 84, mozjpeg: true })
            .toBuffer(),
        );
        picked.push({
          kind: pic.kind,
          file: name,
          url: pic.url,
          page: `https://archive.org/details/${item.id}`,
          item: item.title,
          print: p,
        });
      }
    }
    if (picked.length === 0) continue;

    manifest[id] = {
      name: fm.name,
      credit: 'archive.org',
      prefix: 'ia',
      items: picked.map(({ print: _, ...rest }) => ({ ...rest, keep: false, edition: '' })),
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`${id} (${fm.name}): ${picked.length} — ${[...new Set(picked.map((p) => p.item))].join(' | ')}`);
  }
  console.log(`\nКандидатов: ${Object.values(manifest).reduce((n, g) => n + g.items.length, 0)} в ${Object.keys(manifest).length} играх. Опись: ${manifestPath}`);
}

if (!COLLECT) {
  console.error('Укажите --collect <папка>');
  process.exitCode = 1;
} else {
  collect(path.resolve(COLLECT)).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
