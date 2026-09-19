#!/usr/bin/env node
/**
 * Проверка ссылок внутри статей.
 *
 * Ссылки на другие записи пишутся относительными путями, и ошибиться на один
 * уровень легко: со страницы `/games/zis-5/` путь `../engines/zis-5-eng`
 * ведёт в несуществующий `/games/engines/...`, а нужен `../../engines/...`.
 * Сборка такие ссылки не ловит — они становятся битыми только в браузере.
 *
 * Скрипт раскрывает каждую относительную ссылку от адреса страницы и
 * сверяет с картой существующих адресов сайта.
 *
 *   node scripts/check-links.mjs           проверить
 *   node scripts/check-links.mjs --fix     исправить очевидное
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src', 'content');
const FIX = process.argv.includes('--fix');

/** Коллекция → участок адреса. Заводы живут по /studios/, а не /studios/. */
const ROUTES = {
  games: 'games',
  studios: 'studios',
  series: 'series',
  engines: 'engines',
  platforms: 'platforms',
  eras: 'eras',
};

async function idsOf(collection) {
  const dir = path.join(contentDir, collection);
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(entry.name);
    else if (/\.(md|mdx|ya?ml)$/.test(entry.name)) out.push(entry.name.replace(/\.(md|mdx|ya?ml)$/, ''));
  }
  return out;
}

// Карта всех существующих адресов сайта.
const known = new Set(['/', '/catalog', '/graph', '/search', '/progress', '/about', '/licenses', '/studios', '/platforms', '/engines', '/eras']);
const byId = {};
for (const [collection, segment] of Object.entries(ROUTES)) {
  byId[collection] = await idsOf(collection);
  for (const id of byId[collection]) known.add(`/${segment}/${id}`);
}

/** Где на сайте лежит страница этого файла. */
function pageUrlOf(collection, id) {
  return `/${ROUTES[collection]}/${id}`;
}

/** Ищем, в какой коллекции есть такой идентификатор: для подсказки и починки. */
function findCollection(id) {
  for (const [collection, ids] of Object.entries(byId)) if (ids.includes(id)) return collection;
  return null;
}

const problems = [];
let checked = 0;

for (const collection of Object.keys(ROUTES)) {
  for (const id of byId[collection]) {
    /*
     * Запись может лежать папкой с index.md (игры, студии, платформы) или
     * отдельным файлом (двигатели). Раньше проверялся только первый вид, и
     * тела всех статей о двигателях не читались вовсе — а в них, как
     * выяснилось, ссылки были написаны на уровень выше, чем нужно.
     * Только `*.yaml` действительно тела не имеет.
     */
    const candidates = [
      path.join(contentDir, collection, id, 'index.md'),
      path.join(contentDir, collection, id, 'index.mdx'),
      path.join(contentDir, collection, `${id}.md`),
      path.join(contentDir, collection, `${id}.mdx`),
    ];
    let text = null;
    let file = null;
    for (const candidate of candidates) {
      try {
        text = await readFile(candidate, 'utf8');
        file = candidate;
        break;
      } catch {
        /* пробуем следующий вид записи */
      }
    }
    if (text === null) continue;

    const pageUrl = pageUrlOf(collection, id);
    let patched = text;

    for (const m of text.matchAll(/\[([^\]]*)\]\((\.[^)\s]*)\)/g)) {
      checked += 1;
      const [whole, label, href] = m;
      // Адрес страницы оканчивается слешем, поэтому относительный путь
      // считаем от него же, а не от «файла».
      const resolved = path.posix.normalize(path.posix.join(pageUrl, href)).replace(/\/$/, '');
      if (known.has(resolved)) continue;

      const target = href.split('/').pop();
      const guessCollection = findCollection(target);
      const suggestion = guessCollection ? pageUrlOf(guessCollection, target) : null;

      problems.push({ file: `${collection}/${id}`, label, href, resolved, suggestion });
      if (FIX && suggestion) {
        const depth = pageUrl.split('/').filter(Boolean).length;
        const rel = path.posix.relative(pageUrl, suggestion) || '.';
        patched = patched.replace(whole, `[${label}](${rel.startsWith('.') ? rel : './' + rel})`);
        void depth;
      }
    }

    if (FIX && patched !== text) await writeFile(file, patched, 'utf8');
  }
}

console.log(`Проверено ссылок: ${checked}.`);
if (!problems.length) {
  console.log('Битых нет.');
  process.exit(0);
}

console.log(`\nБитых: ${problems.length}${FIX ? ' (исправлены там, где цель нашлась)' : ''}\n`);
for (const p of problems) {
  console.log(`  ${p.file}: «${p.label}» → ${p.href}`);
  console.log(`      ведёт в ${p.resolved}${p.suggestion ? `, а нужно ${p.suggestion}` : ', цель не найдена'}`);
}
process.exit(FIX ? 0 : 1);
