#!/usr/bin/env node
/**
 * Проверка ссылок в уже собранном сайте.
 *
 * check-links.mjs смотрит относительные ссылки внутри статей — то, что
 * написал автор. Но половина ссылок на сайте не из статей: их рисуют
 * шапка, карточки, хлебные крошки, списки соседей и карта связей. Опечатка
 * в адресе, собранном кодом, ни одной проверкой не ловилась и всплывала бы
 * уже у читателя.
 *
 * Здесь обход другой: берём каждую собранную страницу, вытаскиваем все
 * href, ведущие внутрь сайта, и смотрим, есть ли на диске страница, которую
 * сервер по такому адресу отдаст.
 *
 *   npm run build && node scripts/check-site.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(root, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('Нет папки dist — сначала соберите сайт: npm run build');
  process.exit(1);
}

/** Подпуть сайта: на Pages это /our-games/, локально может быть другим. */
const BASE = (() => {
  const index = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const m = index.match(/href="(\/[^"]*?)_astro\//);
  return m ? m[1] : '/';
})();

/** Все файлы сайта: и страницы, и картинки со шрифтами. */
const files = new Set();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.add('/' + path.relative(DIST, full).split(path.sep).join('/'));
  }
};
walk(DIST);

const pages = [...files].filter((f) => f.endsWith('.html'));

/**
 * Отдаст ли сервер что-нибудь по этому адресу.
 *
 * Адрес приходит с процентным кодированием, а на диске имя лежит как есть:
 * «электроника-им-02.webp» в разметке выглядит как цепочка из %D1%8D и так
 * далее. Без раскодирования все картинки с русскими именами выглядели бы
 * пропавшими, хотя сервер их прекрасно отдаёт.
 */
function served(href) {
  let local = href.slice(BASE.length - 1) || '/';
  try {
    local = decodeURIComponent(local);
  } catch {
    // Битое кодирование — оставляем как есть, пусть ругается.
  }
  const clean = local.split('#')[0].split('?')[0];
  if (files.has(clean)) return true;
  const slashed = clean.endsWith('/') ? clean : clean + '/';
  return files.has(slashed + 'index.html') || files.has(clean + '/index.html');
}

const broken = new Map();
let checked = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(DIST, page.slice(1)), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    // Наружные адреса, якоря и данные нас не касаются.
    if (!href.startsWith(BASE)) continue;
    checked += 1;
    if (served(href)) continue;
    if (!broken.has(href)) broken.set(href, page);
  }
}

console.log(`Страниц: ${pages.length}, ссылок внутрь сайта: ${checked}.`);
if (broken.size === 0) {
  console.log('Все ведут на существующие страницы и файлы.');
  process.exit(0);
}

console.log(`\nВедут в никуда (${broken.size}):`);
for (const [href, from] of broken) console.log(`  ${href}\n      со страницы ${from}`);
process.exit(1);
