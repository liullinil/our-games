#!/usr/bin/env node
/**
 * Контраст текста во всех темах эпох, в светлом и тёмном варианте.
 *
 * Тема задаёт два набора цветов: светлый (--c-*) и тёмный (--d-*). Списки
 * должны совпадать по составу, иначе тёмный вариант унаследует случайный цвет
 * из другой темы — так в автопроме получилось белое по белому. Здесь же
 * считается контраст по WCAG для пар, которые реально встречаются на странице.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const themes = path.join(root, 'public', 'themes');

/** Пары «что на чём»: цвет текста, цвет фона и требуемый контраст. */
const PAIRS = [
  ['text', 'bg', 4.5, 'основной текст на фоне страницы'],
  ['text', 'surface', 4.5, 'текст на карточке'],
  ['text', 'surface-2', 4.5, 'текст на второй поверхности'],
  ['muted', 'bg', 4.5, 'приглушённый текст на фоне'],
  ['muted', 'surface', 4.5, 'приглушённый текст на карточке'],
  ['link', 'bg', 4.5, 'ссылка на фоне'],
  ['link', 'surface', 4.5, 'ссылка на карточке'],
  ['on-accent', 'accent', 4.5, 'текст на акцентной кнопке'],
  // Отметка «прочитано» — вспомогательная, ей хватает контраста крупного текста.
  ['read', 'surface', 3, 'отметка о прочитанном'],
  ['accent', 'bg', 3, 'акцентная линия на фоне'],
];

const hex = (value) => {
  const m = String(value).trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Относительная яркость по WCAG 2.1. */
const luminance = ([r, g, b]) => {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const contrast = (a, b) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/** Значения переменных из блока темы. Берём только шестизначные цвета. */
function readVars(css) {
  const out = new Map();
  for (const m of css.matchAll(/^\s*--([a-z0-9-]+):\s*([^;]+);/gim)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

const problems = [];
const files = (await readdir(themes)).filter((f) => f.endsWith('.css'));

for (const file of files.sort()) {
  const id = file.replace(/\.css$/, '');
  const css = await readFile(path.join(themes, file), 'utf8');
  const vars = readVars(css);
  // Нейтральная тема сайта держит цвета в src/styles/tokens.css, а не у себя.
  if (vars.size === 0) continue;

  const light = [...vars.keys()].filter((k) => k.startsWith('c-')).map((k) => k.slice(2));
  const dark = [...vars.keys()].filter((k) => k.startsWith('d-')).map((k) => k.slice(2));
  for (const key of light) {
    if (!dark.includes(key) && hex(vars.get(`c-${key}`))) {
      problems.push(`${id}: есть --c-${key}, но нет --d-${key} — в тёмной теме цвет достанется от соседней`);
    }
  }

  for (const [prefix, label] of [
    ['c', 'светлая'],
    ['d', 'тёмная'],
  ]) {
    for (const [fg, bg, need, what] of PAIRS) {
      const a = hex(vars.get(`${prefix}-${fg}`));
      const b = hex(vars.get(`${prefix}-${bg}`));
      if (!a || !b) continue;
      const ratio = contrast(a, b);
      if (ratio < need) {
        problems.push(
          `${id}, ${label}: ${what} — ${ratio.toFixed(2)} при нужных ${need} ` +
            `(--${prefix}-${fg} ${vars.get(`${prefix}-${fg}`)} на --${prefix}-${bg} ${vars.get(`${prefix}-${bg}`)})`,
        );
      }
    }
  }
}

console.log(`Проверено тем: ${files.length}.`);
if (problems.length === 0) {
  console.log('Контраст везде достаточный.');
  process.exit(0);
}
console.error(`\nПроблемы (${problems.length}):`);
for (const p of problems) console.error(`  · ${p}`);
process.exit(1);
