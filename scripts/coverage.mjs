#!/usr/bin/env node
/**
 * Полнота энциклопедии: где статьи есть, а где ещё заготовки.
 *
 * Считает по эпохам, жанрам и студиям, сколько игр описано подробно, у скольких
 * есть скриншоты и видео. Отдельно показывает игры без связей: такая карточка
 * висит на карте в пустоте, и это почти всегда пробел в данных, а не замысел.
 *
 *   node scripts/coverage.mjs            общая картина
 *   node scripts/coverage.mjs --gaps     только то, чего не хватает
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = path.join(root, 'src', 'content');
const GAPS = process.argv.includes('--gaps');

const frontmatter = (text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parseYaml(m[1]) : null;
};
const body = (text) => {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return m ? text.slice(m[0].length).trim() : text.trim();
};

/** Записи коллекции: папка с index.md или отдельный файл. */
async function load(collection) {
  const dir = path.join(content, collection);
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    let file;
    let id;
    if (entry.isDirectory()) {
      file = path.join(dir, entry.name, 'index.md');
      id = entry.name;
      if (!existsSync(file)) continue;
    } else if (/\.(md|ya?ml)$/.test(entry.name)) {
      file = path.join(dir, entry.name);
      id = entry.name.replace(/\.(md|ya?ml)$/, '');
    } else continue;

    const text = await readFile(file, 'utf8');
    const isYaml = /\.ya?ml$/.test(file);
    out.push({
      id,
      data: isYaml ? parseYaml(text) : (frontmatter(text) ?? {}),
      words: isYaml ? 0 : body(text).split(/\s+/).filter(Boolean).length,
    });
  }
  return out;
}

const pct = (n, total) => (total ? Math.round((n * 100) / total) : 0);
const bar = (n, total, width = 18) => {
  const filled = total ? Math.round((n * width) / total) : 0;
  return '█'.repeat(filled) + '·'.repeat(width - filled);
};

/** Строка таблицы: название, сколько всего, сколько со статьёй, с медиа. */
function row(label, items) {
  const total = items.length;
  const articles = items.filter((g) => g.data.status === 'article').length;
  const shots = items.filter((g) => (g.data.gallery ?? []).some((x) => x.kind === 'image')).length;
  const videos = items.filter((g) =>
    (g.data.gallery ?? []).some((x) => x.kind === 'youtube' || x.kind === 'rutube' || x.kind === 'vk'),
  ).length;
  return { label, total, articles, shots, videos };
}

function print(title, rows) {
  console.log(`\n${title}`);
  const width = Math.max(...rows.map((r) => r.label.length), 6);
  for (const r of rows.sort((a, b) => b.total - a.total)) {
    console.log(
      `  ${r.label.padEnd(width)}  ${String(r.total).padStart(3)} игр  ` +
        `${bar(r.articles, r.total)} ${String(pct(r.articles, r.total)).padStart(3)}% статей  ` +
        `кадры ${String(pct(r.shots, r.total)).padStart(3)}%  видео ${String(pct(r.videos, r.total)).padStart(3)}%`,
    );
  }
}

const games = await load('games');
const studios = await load('studios');
const engines = await load('engines');
const platforms = await load('platforms');
const eras = await load('eras');

const eraOf = (game) => {
  if (game.data.era) return game.data.era;
  const year = game.data.years?.start ?? 0;
  let current = eras[0]?.id;
  for (const e of [...eras].sort((a, b) => a.data.from - b.data.from)) {
    if (year >= e.data.from) current = e.id;
  }
  return current;
};

if (!GAPS) {
  const all = row('всего', games);
  console.log(
    `Игр: ${all.total}. Статей: ${all.articles} (${pct(all.articles, all.total)}%), ` +
      `со скриншотами: ${all.shots} (${pct(all.shots, all.total)}%), ` +
      `с видео: ${all.videos} (${pct(all.videos, all.total)}%).`,
  );

  const byEra = [...eras]
    .sort((a, b) => a.data.from - b.data.from)
    .map((e) => row(e.data.shortTitle, games.filter((g) => eraOf(g) === e.id)));
  print('По эпохам:', byEra);

  const types = [...new Set(games.map((g) => g.data.type))];
  print('По жанрам:', types.map((t) => row(t, games.filter((g) => g.data.type === t))));

  const bigStudios = studios
    .map((s) => ({ s, items: games.filter((g) => g.data.developer === s.id) }))
    .filter((x) => x.items.length >= 3);
  print('Студии с тремя и более играми:', bigStudios.map((x) => row(x.s.id, x.items)));
}

// ── Пробелы ────────────────────────────────────────────────────────────────

const shortArticles = games.filter((g) => g.data.status === 'article' && g.words < 300);
const noSources = games.filter((g) => (g.data.sources ?? []).length === 0);
const noShots = games.filter((g) => !(g.data.gallery ?? []).some((x) => x.kind === 'image'));
const noVideo = games.filter(
  (g) => !(g.data.gallery ?? []).some((x) => ['youtube', 'rutube', 'vk'].includes(x.kind)),
);
const noSpecs = games.filter((g) => !g.data.specs || Object.keys(g.data.specs).length <= 1);

/*
 * Список показываем не целиком.
 *
 * Пока энциклопедия пустая, в каждой строке оказываются все сто шестьдесят
 * записей, и отчёт перестаёт читаться: важно не перечисление, а число.
 * Полный список всегда можно получить `--gaps`.
 */
const LIMIT = GAPS ? 500 : 12;
const list = (label, items, show = (x) => x.id) => {
  if (items.length === 0) return null;
  const head = items.slice(0, LIMIT).map(show).join(' ');
  const tail = items.length > LIMIT ? ` …и ещё ${items.length - LIMIT}` : '';
  return `${label}: ${items.length} — ${head}${tail}`;
};

/** Пустые записи других коллекций: карточка есть, текста нет. */
const emptyOf = (items, label) => list(label, items.filter((x) => x.words < 120));

const lines = [
  list('Игры без источников', noSources),
  list('Статьи короче трёхсот слов', shortArticles, (g) => `${g.id} (${g.words})`),
  list('Игры без характеристик', noSpecs),
  list('Игры без скриншотов', noShots),
  list('Игры без видео', noVideo),
  emptyOf(studios, 'Студии без текста'),
  emptyOf(engines, 'Движки без текста'),
  emptyOf(platforms, 'Платформы без текста'),
  list('Платформы без фотографии', platforms.filter((p) => !p.data.photo)),
  list('Эпохи без образов', eras.filter((e) => (e.data.images ?? []).length === 0)),
].filter(Boolean);

console.log('\nЧего не хватает:');
if (lines.length === 0) console.log('  Всё на месте.');
for (const line of lines) console.log(`  · ${line}`);
