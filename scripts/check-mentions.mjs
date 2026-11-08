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
import { PLACES, MODERN, ZONE_GAMES, ZONE_TITLE, ZONE_WORD } from './lib/mentions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(root, 'src', 'content');
const VERBOSE = process.argv.includes('--verbose');



/**
 * Что решено оставить, с причиной. Проверка сверяет строку с этим списком,
 * и если строка подходит — молчит.
 */
const ALLOWED = [
  {
    why: 'Зона из S.T.A.L.K.E.R.: в статьях о самих играх серии — их выдуманный мир, в остальных — название игры',
    /*
     * Строка проходит, только если в ней из запретного — одни Чернобыль и
     * Припять. Если рядом стоит ещё и, скажем, «киевская студия», правило
     * не спасает: убирать надо её.
     */
    test: (line, rel) => {
      if (!ZONE_WORD.test(line)) return false;
      const rest = line.replace(new RegExp(ZONE_WORD.source, 'gi'), '');
      if (PLACES.test(rest)) return false;
      return ZONE_GAMES.has(rel.replace(/^games\//, '').replace(/\/index\.md$/, '')) || ZONE_TITLE.test(line);
    },
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
    const ok = ALLOWED.find((a) => a.test(line, rel));
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
