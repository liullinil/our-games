#!/usr/bin/env node
/**
 * Проверка редакционного правила: о чём энциклопедия молчит.
 *
 * Владелец проекта решил, что тексты не говорят, где сделана игра, когда речь
 * об Украине и её городах, и не рассказывают о современных конфликтах начиная
 * с 2022 года — эвакуациях, переездах студий, уходе из магазинов. Вторая
 * мировая и прочая история этим правилом не затронуты: игры про войну
 * остаются играми про войну.
 *
 * Правило легко нарушить по невнимательности: статей почти две сотни, и
 * каждая новая партия дополнений приносит новые абзацы. Поэтому проверка
 * живёт в репозитории, а не в чьей-то голове.
 *
 * Разрешённые исключения перечислены явно и по одному: список исключений —
 * это то, что кто-то однажды обдумал и решил оставить, а не дыра, в которую
 * проваливается всё подряд.
 *
 *   node scripts/check-mentions.mjs
 *   node scripts/check-mentions.mjs --verbose   показать и разрешённое
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(root, 'src', 'content');
const VERBOSE = process.argv.includes('--verbose');

/** Страна и города: о них не говорим. */
const PLACES = /Украин|украинск|украинц|Киев|киевск|Харьков|харьковск|Одесс|Львов|Днепропетровск/;

/** Современные конфликты и всё, что тянется за ними с 2022 года. */
const MODERN = /вторжени|полномасштабн|эвакуац|релоцир|кибератак|военкомат|мобилизац/i;

/**
 * Что решено оставить, с причиной. Проверка сверяет строку с этим списком,
 * и если строка подходит — молчит.
 */
const ALLOWED = [
  {
    why: 'Названия игр серии S.T.A.L.K.E.R. — «Тень Чернобыля», «Зов Припяти», Chornobyl, Prypiat',
    test: (line) => /Чернобыл|Припят|Chornobyl|Chernobyl|Prypiat|Pripyat/.test(line) && !PLACES.test(line),
  },
  {
    why: 'Игровые юниты и нации «Казаков»: сердюки, запорожцы, Украина как играбельная сторона XVII века',
    test: (line) => /сердюк|запорож|играбельн/i.test(line),
  },
  {
    why: 'Адрес источника: по нему проверяют факт, текст статьи он не составляет',
    test: (line) => /^\s*url:\s*"/.test(line),
  },
];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(md|mdx|yaml)$/.test(e.name) ? [path.join(dir, e.name)] : [],
  );

const found = [];
const allowed = [];

for (const file of walk(CONTENT)) {
  const rel = path.relative(CONTENT, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    if (!PLACES.test(line) && !MODERN.test(line)) continue;
    const ok = ALLOWED.find((a) => a.test(line));
    const hit = { rel, n: i + 1, text: line.trim().slice(0, 150) };
    if (ok) allowed.push({ ...hit, why: ok.why });
    else found.push(hit);
  }
}

if (VERBOSE && allowed.length) {
  console.log(`Разрешённые упоминания: ${allowed.length}`);
  for (const a of allowed) console.log(`  ${a.rel}:${a.n}\n    ${a.text}\n    — ${a.why}`);
  console.log('');
}

if (found.length === 0) {
  console.log(`Правило соблюдено: ничего лишнего. Разрешённых упоминаний: ${allowed.length}.`);
} else {
  console.log(`Требуют внимания: ${found.length}`);
  for (const f of found) console.log(`  ${f.rel}:${f.n}\n    ${f.text}`);
  process.exitCode = 1;
}
