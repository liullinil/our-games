#!/usr/bin/env node
/**
 * Ужимает исходные фотографии статей.
 *
 * С Викисклада приходят миниатюры шириной 2000 точек, но весят они по 2–4 МБ:
 * это больше, чем нужно даже для лайтбокса, а в репозитории такие файлы
 * копятся навсегда. Здесь они пересжимаются на месте — имя и расширение
 * сохраняются, поэтому ссылки в статьях не ломаются.
 *
 * Astro всё равно готовит из них свои размеры при сборке, так что на вид
 * сайта это не влияет.
 *
 *   node scripts/shrink-photos.mjs [игры ...] [--max 1800] [--quality 82] [--dry]
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src', 'content');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};
const MAX_WIDTH = flag('max', 1800);
const QUALITY = flag('quality', 82);
const DRY = args.includes('--dry');

/** Ниже этого порога трогать нечего. */
const LEAVE_ALONE_BYTES = 400 * 1024;

/*
 * Можно ограничить прогон игры: `node scripts/shrink-photos.mjs gaz-51 zil-130`.
 *
 * Без этого скрипт ходит по всему дереву, и когда над содержимым работают
 * несколько человек (или агентов) сразу, он пересжимает чужие свежие снимки —
 * за одну такую осечку в работу попало полторы сотни чужих файлов.
 */
const only = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const targets = only.length
  ? only.map((id) => path.join(contentDir, 'games', id, 'shots'))
  : [contentDir];

async function* images(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* images(full);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) yield full;
  }
}

let saved = 0;
let touched = 0;
let kept = 0;

for await (const file of (async function* () {
  for (const dir of targets) {
    if (!existsSync(dir)) {
      console.log(`нет папки ${path.relative(root, dir)} — пропускаю`);
      continue;
    }
    yield* images(dir);
  }
})()) {
  const before = (await stat(file)).size;
  if (before <= LEAVE_ALONE_BYTES) {
    kept += 1;
    continue;
  }

  const input = await readFile(file);
  const image = sharp(input, { failOn: 'none' });
  const meta = await image.metadata();
  const isPng = (meta.format ?? '') === 'png';

  let pipeline = image.rotate();
  if ((meta.width ?? 0) > MAX_WIDTH) pipeline = pipeline.resize({ width: MAX_WIDTH });
  // Формат сохраняем: имя файла указано в статье, менять расширение нельзя.
  pipeline = isPng
    ? pipeline.png({ compressionLevel: 9, palette: true })
    : pipeline.jpeg({ quality: QUALITY, mozjpeg: true });

  const output = await pipeline.toBuffer();
  if (output.length >= before) {
    kept += 1;
    continue;
  }

  if (!DRY) await writeFile(file, output);
  saved += before - output.length;
  touched += 1;
  console.log(
    `${path.relative(contentDir, file)}: ${(before / 1048576).toFixed(2)} → ${(output.length / 1048576).toFixed(2)} МБ`,
  );
}

console.log(
  `\nПересжато файлов: ${touched}, оставлено как есть: ${kept}. ` +
    `Освобождено ${(saved / 1048576).toFixed(1)} МБ${DRY ? ' (черновой прогон, файлы не менялись)' : ''}.`,
);
