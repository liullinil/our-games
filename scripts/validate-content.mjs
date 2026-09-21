#!/usr/bin/env node
/**
 * Проверка контента перед публикацией.
 *
 * Ссылки между коллекциями проверяет сам сайт при сборке (src/lib/graph.ts).
 * Здесь — то, что сборка пропустит: несогласованные годы, статьи без
 * источников, фотографии без автора, забытые файлы моделей.
 *
 *   npm run content:validate
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const warnings = [];

/**
 * Разбор frontmatter без внешних зависимостей: нам хватает верхнего уровня.
 *
 * Возвращает null, если открывающей или закрывающей черты нет. Раньше в этом
 * случае возвращалась пустая строка — и файл с незакрытым frontmatter молча
 * считался файлом без него: `isbn: 978-5-699-50821-1---` прошёл проверку,
 * а сборка на нём упала.
 */
function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

/** Есть ли frontmatter вообще и разбирается ли он. Обе беды — ошибка. */
function checkFrontmatter(label, text) {
  const fm = frontmatter(text);
  if (fm === null) {
    problems.push(`${label}: frontmatter не закрыт чертой «---» или отсутствует`);
    return null;
  }
  return checkYamlSyntax(label, fm) ? fm : null;
}

/*
 * Синтаксис YAML проверяем настоящим разборщиком.
 *
 * Разбор выше построчный и на синтаксис не смотрит вовсе, поэтому мимо него
 * спокойно проходит `summary: текст с двоеточием: вот так` — YAML считает это
 * вложенным отображением. Сборка и `relations:check` после такого валятся
 * стеком вызовов, а `content:validate` рапортует «в порядке». Ловим здесь
 * и называем файл.
 */
/*
 * Ключи, которые в схеме объявлены списками.
 *
 * YAML читает голый ключ «gallery:» без пунктов не как пустой список, а как
 * null, и сборка падает на несоответствии схеме. Сам по себе такой ключ
 * появляется не руками: он остаётся, когда из галереи убрали последний
 * ролик. Разбор YAML при этом проходит, поэтому проверка нужна отдельная.
 */
const LIST_FIELDS = {
  '': ['gallery', 'altNames', 'sources'],
  games: ['platforms', 'publishers', 'engines', 'predecessors', 'basedOn', 'variants', 'reviews', 'reading'],
  studios: ['names', 'related'],
  eras: ['images', 'motifs'],
};

function checkListShape(label, doc) {
  if (!doc || typeof doc !== 'object') return;
  // «games/diversant» → games. У движков basedOn — строка, а не список.
  const collection = label.split('/')[0];
  const keys = [...LIST_FIELDS[''], ...(LIST_FIELDS[collection] ?? [])];
  for (const key of keys) {
    if (!(key in doc)) continue;
    const value = doc[key];
    if (value === null) {
      problems.push(`${label}: ключ ${key} пуст — напишите ${key}: [] или уберите его`);
    } else if (!Array.isArray(value)) {
      problems.push(`${label}: ключ ${key} должен быть списком, а не ${typeof value}`);
    }
  }
}

function checkYamlSyntax(label, fm) {
  try {
    checkListShape(label, parseYaml(fm));
    return true;
  } catch (e) {
    const where = e.linePos && e.linePos[0] ? ` (строка ${e.linePos[0].line})` : '';
    const first = String(e.message).split(String.fromCharCode(10))[0];
    problems.push(`${label}: frontmatter не разбирается как YAML${where} — ${first}`);
    return false;
  }
}

/** Значения списочного ключа: platforms, engines, publishers и прочие. */
const listField = (fm, name) => {
  const block = fm.match(new RegExp(String.raw`^${name}:\s*\n((?:[ \t]+- .*\n)+)`, 'm'));
  if (!block) return [];
  return [...block[1].matchAll(/^[ \t]+- "?(.+?)"?\s*$/gm)].map((m) => m[1].trim());
};

const field = (fm, name) => {
  const m = fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
  return m ? m[1].trim() : null;
};

/*
 * Значения перечислений читаем прямо из схемы.
 *
 * Схема — единственный источник правды, а дублировать её список здесь значит
 * однажды разойтись с ней. Проверка нужна потому, что этот валидатор смотрит
 * на поля построчно и о перечислениях не знает: «class: tyagach» вместо
 * «ballastny-tyagach» он пропустил, отрапортовал «Контент в порядке», а сборка
 * упала с ошибкой схемы на том же файле.
 */
async function enumFromConfig(name) {
  const src = await readFile(path.join(root, 'src', 'content.config.ts'), 'utf8');
  const m = src.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\]`));
  if (!m) return null;
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

/**
 * Что вообще есть в коллекции: имена папок и файлов без расширения.
 *
 * Нужно, чтобы ловить ссылки на несуществующие записи здесь, а не на сборке.
 * Разница существенная: сборку авторы статей не запускают, а эту проверку
 * запускают после каждого файла.
 */
async function idsOf(collection) {
  const base = path.join(root, 'src', 'content', collection);
  if (!existsSync(base)) return new Set();
  const entries = await readdir(base, { withFileTypes: true });
  return new Set(entries.map((e) => (e.isDirectory() ? e.name : e.name.replace(/\.(md|ya?ml)$/, ''))));
}

async function checkGames() {
  const base = path.join(root, 'src', 'content', 'games');
  const dirs = await readdir(base, { withFileTypes: true });
  const eras = await loadEras();
  const classes = await enumFromConfig('GAME_CLASSES');
  const types = await enumFromConfig('GAME_TYPES');
  const countries = await enumFromConfig('COUNTRIES');
  const known = {
    platforms: await idsOf('platforms'),
    engines: await idsOf('engines'),
    studios: await idsOf('studios'),
    series: await idsOf('series'),
  };

  for (const dir of dirs.filter((d) => d.isDirectory())) {
    const id = dir.name;
    const file = path.join(base, id, 'index.md');
    if (!existsSync(file)) {
      problems.push(`games/${id}: нет index.md`);
      continue;
    }
    const text = await readFile(file, 'utf8');
    const fm = checkFrontmatter(`games/${id}`, text) ?? '';
    // Имя переменной не `field`: так называется функция чтения поля выше,
    // и цикл бы её затенил.
    for (const [key, allowed] of [
      ['class', classes],
      ['type', types],
      ['country', countries],
    ]) {
      const value = field(fm, key);
      if (allowed && value && !allowed.has(value)) {
        problems.push(`games/${id}: ${key}: ${value} — нет такого значения в схеме`);
      }
    }

    /*
     * Ссылки на другие коллекции. Опечатку тут ловила только сборка, а до
     * неё дело доходило нескоро: «  - windows  - macos» в одну строку YAML
     * читает как одну платформу с таким именем, схеме это не противоречит,
     * и валидатор говорил, что всё в порядке.
     */
    for (const [key, ids] of [
      ['platforms', known.platforms],
      ['engines', known.engines],
      ['publishers', known.studios],
      ['predecessors', new Set([...(await idsOf('games'))])],
    ]) {
      for (const ref of listField(fm, key)) {
        if (!ids.has(ref)) problems.push(`games/${id}: ${key}: «${ref}» — нет такой записи`);
      }
    }
    for (const [key, ids] of [
      ['developer', known.studios],
      ['series', known.series],
    ]) {
      const ref = field(fm, key);
      if (ref && ref !== '[]' && !ids.has(ref)) {
        problems.push(`games/${id}: ${key}: «${ref}» — нет такой записи`);
      }
    }
    const body = text.slice(text.indexOf('---', 3) + 3).trim();

    /*
     * Поле `status` не имеет права отсутствовать.
     *
     * В схеме у него есть значение по умолчанию, поэтому запись без него
     * молча считается карточкой реестра. Иначе статьи лежали бы:
     * статьи написаны, а `npm run coverage` показывал их незаполненными, и
     * поиск по `status: card` их не находил — искать было нечего. Лучше
     * потребовать поле явно, чем разбираться потом, почему числа не сходятся.
     */
    if (!field(fm, 'status')) {
      problems.push(`games/${id}: нет поля status — допишите article или card`);
    }
    const status = field(fm, 'status') ?? 'card';
    const startMatch = fm.match(/^\s{2}start:\s*(\d{4})/m);
    const start = startMatch ? Number(startMatch[1]) : null;

    if (!field(fm, 'summary') && !fm.includes('summary: >-')) {
      problems.push(`games/${id}: нет краткого описания (summary)`);
    }

    if (status === 'article') {
      if (body.length < 800) {
        warnings.push(`games/${id}: статья короткая (${body.length} знаков)`);
      }
      if (!fm.includes('sources:')) {
        problems.push(`games/${id}: статья без источников`);
      }
    }

    /*
     * Диапазона лет у игры больше нет.
     *
     * Раньше `years.end` означал закрытие серверов или последний патч, и
     * карточка читалась как «игра шла с 2010 по 2025». У игры одна дата —
     * выход; всё остальное — факт для статьи и для `years.note`.
     */
    if (/^\s{2}end:/m.test(fm.match(/^years:\r?\n((?:[ \t]+.*\r?\n)+)/m)?.[1] ?? '')) {
      problems.push(`games/${id}: поле years.end больше не используется — опишите закрытие в years.note или в статье`);
    }

    checkExtras(id, fm);

    // Эпоха задаётся вручную только осознанно: сверяем с годом начала выпуска.
    const era = field(fm, 'era');
    if (era && start) {
      const computed = eraFor(start, eras);
      if (computed !== era) {
        warnings.push(
          `games/${id}: эпоха задана как «${era}», хотя по году ${start} это «${computed}»`,
        );
      }
    }

    // У каждого изображения должны быть автор, лицензия, подпись и источник.
    const images = fm.split('- kind: image').slice(1);
    for (const [i, chunk] of images.entries()) {
      const block = chunk.split('- kind:')[0];
      for (const need of ['author:', 'license:', 'caption:']) {
        if (!block.includes(need)) {
          problems.push(`games/${id}: у фотографии ${i + 1} нет поля ${need.slice(0, -1)}`);
        }
      }
      /*
       * Источник обязателен, но бывает двух видов.
       *
       * У снимка с Викисклада есть страница файла, у архивного кадра из книги
       * её нет: есть издание, где он обнародован, и архив-хранитель. Требовать
       * sourceUrl в обоих случаях значило бы выдумывать несуществующий адрес.
       */
      if (!block.includes('sourceUrl:') && !block.includes('sourceBook:')) {
        problems.push(`games/${id}: у фотографии ${i + 1} нет ни sourceUrl, ни sourceBook`);
      }
    }
  }
}

/**
 * Рецензии, чтение и доступность: то, что сборка проверит по схеме, но
 * назовёт ошибку невнятно. Здесь — по-человечески и заранее.
 *
 * Файлы из `availability.files` должны лежать в public/downloads/<id>/:
 * ссылка на несуществующий файл — это битая кнопка «Скачать» на сайте.
 */
function checkExtras(id, fm) {
  let doc;
  try {
    doc = parseYaml(fm);
  } catch {
    return; // синтаксис уже отмечен выше
  }
  if (!doc || typeof doc !== 'object') return;

  for (const [i, r] of (Array.isArray(doc.reviews) ? doc.reviews : []).entries()) {
    if (!r || typeof r !== 'object') continue;
    for (const need of ['outlet', 'verdict', 'url']) {
      if (!r[need]) problems.push(`games/${id}: у рецензии ${i + 1} нет поля ${need}`);
    }
    if (typeof r.verdict === 'string' && r.verdict.length > 320) {
      warnings.push(`games/${id}: вердикт рецензии ${i + 1} длиннее 320 знаков — это пересказ, а не цитата`);
    }
  }
  for (const [i, r] of (Array.isArray(doc.reading) ? doc.reading : []).entries()) {
    if (!r || typeof r !== 'object') continue;
    for (const need of ['title', 'url']) {
      if (!r[need]) problems.push(`games/${id}: у ссылки «что почитать» ${i + 1} нет поля ${need}`);
    }
  }

  const av = doc.availability;
  if (av && typeof av === 'object') {
    for (const [i, w] of (Array.isArray(av.where) ? av.where : []).entries()) {
      if (!w?.title || !w?.url) problems.push(`games/${id}: у места «где взять» ${i + 1} нет title или url`);
    }
    for (const [i, f] of (Array.isArray(av.files) ? av.files : []).entries()) {
      if (!f?.file || !f?.title || !f?.license || !f?.sourceUrl) {
        problems.push(`games/${id}: у файла ${i + 1} в availability.files нужны file, title, license и sourceUrl`);
        continue;
      }
      const onDisk = path.join(root, 'public', 'downloads', id, f.file);
      if (!existsSync(onDisk)) {
        problems.push(`games/${id}: файла public/downloads/${id}/${f.file} нет на диске`);
      }
    }
    if (Array.isArray(av.files) && av.files.length > 0 && !['freeware', 'opensource'].includes(av.status)) {
      problems.push(
        `games/${id}: файлы у нас лежат только у игр со status: freeware или opensource, а не «${av.status}»`,
      );
    }
  }
}

async function loadEras() {
  const base = path.join(root, 'src', 'content', 'eras');
  const files = await readdir(base);
  const eras = [];
  for (const f of files.filter((x) => x.endsWith('.yaml'))) {
    const text = await readFile(path.join(base, f), 'utf8');
    const from = Number(text.match(/^from:\s*(-?\d+)/m)?.[1]);
    eras.push({ id: f.replace(/\.yaml$/, ''), from });
  }
  return eras.sort((a, b) => a.from - b.from);
}

function eraFor(year, eras) {
  let current = eras[0]?.id ?? 'modern';
  for (const era of eras) if (year >= era.from) current = era.id;
  return current;
}

/**
 * Остальные коллекции: проверяем только целость frontmatter.
 *
 * Схему за нас проверит сборка, а вот незакрытую черту или сломанный YAML
 * лучше поймать здесь — падение сборки на таком файле выглядит куда
 * загадочнее, чем строка «frontmatter не закрыт».
 */
async function checkOtherCollections() {
  for (const name of ['studios', 'engines', 'platforms']) {
    const base = path.join(root, 'src/content', name);
    let entries;
    try {
      entries = await readdir(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const file = entry.isDirectory()
        ? path.join(base, entry.name, 'index.md')
        : path.join(base, entry.name);
      if (!existsSync(file) || !/\.(md|mdx)$/.test(file)) continue;
      checkFrontmatter(`${name}/${entry.name.replace(/\.mdx?$/, '')}`, await readFile(file, 'utf8'));
    }
  }
}

/**
 * Игра не может быть сделана студией, которой ещё нет.
 *
 * Проверка дешёвая, а класс ошибок ловит настоящий: «Князь» 1999 года
 * числился за Lesta, хотя её собственный список игр начинается с 2003-го.
 * Годы студии такого случая не поймали — но поймают следующий, когда
 * разработчика перепутают с командой, основанной позже игры.
 */
async function checkStudioYears() {
  const studios = new Map();
  const base = path.join(root, 'src', 'content', 'studios');
  for (const dir of (await readdir(base, { withFileTypes: true })).filter((d) => d.isDirectory())) {
    const file = path.join(base, dir.name, 'index.md');
    if (!existsSync(file)) continue;
    const fm = (await readFile(file, 'utf8')).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    studios.set(dir.name, {
      founded: Number(field(fm, 'founded')) || null,
      closed: Number(field(fm, 'closed')) || null,
    });
  }

  const games = path.join(root, 'src', 'content', 'games');
  for (const dir of (await readdir(games, { withFileTypes: true })).filter((d) => d.isDirectory())) {
    const file = path.join(games, dir.name, 'index.md');
    if (!existsSync(file)) continue;
    const fm = (await readFile(file, 'utf8')).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const dev = field(fm, 'developer');
    const year = Number(fm.match(/^\s+start: (\d+)/m)?.[1]);
    const studio = dev ? studios.get(dev) : null;
    if (!studio || !year) continue;
    if (studio.founded && year < studio.founded) {
      problems.push(`games/${dir.name}: вышла в ${year}, а студия «${dev}» основана в ${studio.founded}`);
    }
    // Год после закрытия прощаем: игру могли доделывать и издавать позже.
    if (studio.closed && year > studio.closed + 1) {
      warnings.push(`games/${dir.name}: вышла в ${year}, а студия «${dev}» закрыта в ${studio.closed}`);
    }
  }
}

await checkGames();
await checkOtherCollections();
await checkStudioYears();

if (warnings.length) {
  console.log(`Замечания (${warnings.length}):`);
  for (const w of warnings) console.log(`  · ${w}`);
  console.log('');
}

if (problems.length) {
  console.error(`Ошибки (${problems.length}):`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}

console.log('Контент в порядке.');
