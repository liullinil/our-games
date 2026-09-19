#!/usr/bin/env node
/**
 * Сверка скриншотов Steam с игрой, к которой они приписаны.
 *
 * Идентификатор приложения в Steam — просто число, и ошибиться в нём легко:
 * 12420 это не «Корсары III», а «Периметр 2», 285440 — не Ex Machina, а
 * японский шутер Crimzon Clover. Кадры при этом скачиваются и подписываются
 * как ни в чём не бывало, и в статье оказываются чужие картинки. Подпись,
 * которую оставляет scripts/fetch-steam.mjs, хранит настоящее имя карточки —
 * по нему и сверяемся.
 *
 *   node scripts/check-steam.mjs           показать расхождения
 *   node scripts/check-steam.mjs --purge   убрать чужие кадры и неверный id
 */
import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { namesMatch, fieldList } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const PURGE = process.argv.includes('--purge');


/**
 * Переиздания, у которых карточка называется иначе, чем игра.
 *
 * «Петька и Василий Иванович 3: Возвращение Аляски. Перезагрузка» — та же
 * игра, только переизданная, и кадры из неё честные. Имена расходятся сильнее,
 * чем ловит сравнение, поэтому такие случаи перечислены явно.
 */
const REMASTERS = new Set(['petka-3']);

const problems = [];
const ids = (await readdir(GAMES, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

for (const id of ids) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) continue;
  const text = await readFile(file, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  // Подпись вида «Название: обложка в Steam» оставляет только fetch-steam.
  const caption = fm.match(/caption: "(.+?): (?:обложка в Steam|кадр из игры)"/);
  if (!caption) continue;

  const name = fm.match(/^name: "?(.+?)"?\s*$/m)?.[1] ?? id;
  const ours = [name, ...fieldList(fm, 'altNames')];
  if (REMASTERS.has(id) || namesMatch(ours, caption[1])) continue;

  problems.push({ id, file, theirs: caption[1], ours: ours.join(' / '), appId: fm.match(/^steamAppId: (\d+)/m)?.[1] });
}

if (problems.length === 0) {
  console.log('Все кадры из Steam принадлежат своим играм.');
  process.exit(0);
}

console.log(`Кадры от чужой игры (${problems.length}):\n`);
for (const p of problems) {
  console.log(`  ${p.id.padEnd(24)} appId ${String(p.appId ?? '—').padEnd(8)} карточка «${p.theirs}» ≠ ${p.ours}`);
}

if (!PURGE) {
  console.log('\nЧтобы убрать чужие кадры и неверный идентификатор: node scripts/check-steam.mjs --purge');
  process.exit(1);
}

for (const p of problems) {
  const text = await readFile(p.file, 'utf8');
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/);
  let fm = m[2];
  fm = fm.replace(/^steamAppId: \d+\r?\n/m, '');
  fm = fm.replace(/^poster: \.\/shots\/.*\r?\n/m, '');
  // Убираем только блоки-изображения; видео в галерее остаётся.
  fm = fm.replace(/^ {2}- kind: image\r?\n(?: {4}.*\r?\n)*/gm, '');
  fm = fm.replace(/^gallery:\s*\r?\n(?=[a-zA-Z])/m, 'gallery: []\n');
  await writeFile(p.file, m[1] + fm + m[3] + text.slice(m[0].length), 'utf8');
  await rm(path.join(GAMES, p.id, 'shots'), { recursive: true, force: true });
  console.log(`  ✓ ${p.id}: кадры убраны`);
}
console.log(`\nОчищено игр: ${problems.length}. Идентификаторы придётся подобрать заново: npm run steam:fetch -- --search`);
