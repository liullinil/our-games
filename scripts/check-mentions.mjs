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

/**
 * Страна и города: о них не говорим.
 *
 * Латинские написания здесь не для красоты: `country: ukraine` — это поле
 * frontmatter, и кириллическим шаблоном оно не ловится. Одна карточка студии
 * из-за этого дожила до конца правки с нетронутой страной.
 */
const PLACES =
  /Украин|украинск|украинц|Киев|киевск|Харьков|харьковск|Одесс|Львов|Днепропетровск|\bukraine\b|\bukrainian\b|\bkyiv\b|\bkiev\b|\bkharkiv\b/i;

/**
 * Современные конфликты и всё, что тянется за ними с 2022 года.
 *
 * Ловим связку, а не отдельное слово: «вторжение» и «эвакуация» в играх
 * встречаются на каждом шагу и к политике отношения не имеют. У Escape from
 * Tarkov эвакуация — это выход из рейда и название целого жанра, у Massive
 * Assault угроза вторжения — тактический приём, у «НЛО» вторжение — сюжет
 * 1994 года.
 */
const MODERN =
  /полномасштабн|релоциров|вторжени[а-яё]* Росси|российск[а-яё]* вторжени|24 февраля 2022|эвакуац[а-яё]*\s+(сотрудник|команд|студи|офис|разработчик)/i;

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
    test: (line) => /^\s*url:\s*"?https?:/.test(line),
  },
  {
    why: 'Идентификатор записи: crytek-kiev — это адрес страницы и имя папки, переименование порвало бы все ссылки',
    test: (line) => /crytek-kiev/.test(line),
  },
  {
    why: 'Имена компаний: Crytek Kiev и Global Ukraine — вывески, а не рассказ о том, где сделана игра. Переименовать чужую фирму значило бы соврать',
    test: (line) => /Crytek Kiev|Global Ukraine/.test(line),
  },
  {
    why: 'Киевский вокзал — московский, им объясняется название студии «Крыша»',
    test: (line) => /Киевск[а-яё]* вокзал/.test(line),
  },
  {
    why: 'ПК-01 «Львов» — модель советского компьютера, а не город',
    test: (line) => /ПК-01|«Львов»/.test(line),
  },
  {
    why: 'Украина как одна из шестнадцати играбельных наций «Казаков» — содержание игры XVII века',
    test: (line) => /(наци[йия]|сторон)[а-яё]*[^.]{0,120}Украин/i.test(line),
  },
  {
    why: 'География Второй мировой: карты, кампании и места боёв — история, а не современный конфликт',
    test: (line) =>
      /Маньчжур|Халхин-Гол|Арнем|Рейн|Днепр[еа]|Бирм|кампани[а-яё]*[^.]{0,80}(карт|миссии)/i.test(line),
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
