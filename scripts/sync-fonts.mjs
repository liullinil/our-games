#!/usr/bin/env node
/**
 * Копирует нужные начертания из пакетов @fontsource в public/fonts.
 *
 * Берём только подмножества cyrillic и latin: файл на начертание выходит
 * 15–40 КБ вместо полного шрифта. Темы эпох подключают их относительными
 * путями (../fonts/...), поэтому подпуть сайта на GitHub Pages им не мешает.
 *
 * Запуск: npm run fonts:sync
 */
import { mkdir, copyFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'fonts');

/** Что копируем: пакет, начертания, и имя семейства для @font-face. */
const FONTS = [
  // Советская эпоха: техно-гротеск в духе надписей на «Электронике» и терминальный моно.
  { pkg: 'tektur', family: 'Tektur', weights: ['500', '700'] },
  { pkg: 'pt-mono', family: 'PT Mono', weights: ['400'] },
  { pkg: 'pt-sans', family: 'PT Sans', weights: ['400', '700'] },
  // Девяностые: пиксельный шрифт восьмибитных приставок.
  { pkg: 'press-start-2p', family: 'Press Start 2P', weights: ['400'] },
  // Нулевые: рубленый «технологичный» гротеск игровых журналов и Ubuntu.
  { pkg: 'exo-2', family: 'Exo 2', weights: ['600', '800'] },
  { pkg: 'ubuntu', family: 'Ubuntu', weights: ['400', '700'] },
  // Десятые: плоский дизайн, Montserrat и Roboto.
  { pkg: 'montserrat', family: 'Montserrat', weights: ['600', '800'] },
  { pkg: 'roboto', family: 'Roboto', weights: ['400', '700'] },
  // Двадцатые: широкий Unbounded и Inter.
  { pkg: 'unbounded', family: 'Unbounded', weights: ['500', '700'] },
  { pkg: 'inter', family: 'Inter', weights: ['400', '600'] },
];

const SUBSETS = ['cyrillic', 'latin'];

async function main() {
  await mkdir(outDir, { recursive: true });
  const faces = [];
  let copied = 0;

  for (const font of FONTS) {
    const filesDir = path.join(root, 'node_modules', '@fontsource', font.pkg, 'files');
    if (!existsSync(filesDir)) {
      console.error(`Нет пакета @fontsource/${font.pkg}. Установите: npm i -D @fontsource/${font.pkg}`);
      process.exitCode = 1;
      continue;
    }
    const available = await readdir(filesDir);

    for (const weight of font.weights) {
      const sources = [];
      for (const subset of SUBSETS) {
        const name = `${font.pkg}-${subset}-${weight}-normal.woff2`;
        if (available.includes(name)) sources.push({ subset, name });
      }
      if (sources.length === 0) {
        console.error(`Не найдено начертание ${font.pkg} ${weight} в подмножествах ${SUBSETS.join(', ')}`);
        process.exitCode = 1;
        continue;
      }
      for (const { subset, name } of sources) {
        const target = `${font.pkg}-${weight}-${subset}.woff2`;
        await copyFile(path.join(filesDir, name), path.join(outDir, target));
        copied += 1;
        faces.push({ series: font.series, weight, subset, file: target });
      }
    }
  }

  // Общий файл с @font-face: подключается из каждой темы эпохи.
  const css = [
    '/* Сгенерировано scripts/sync-fonts.mjs. Не править вручную. */',
    ...faces.map(
      (f) =>
        `@font-face {\n` +
        `  font-series: '${f.series}';\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${f.weight};\n` +
        `  font-display: swap;\n` +
        `  src: url('./${f.file}') format('woff2');\n` +
        `  unicode-range: ${f.subset === 'cyrillic' ? 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122, U+2191, U+2193, U+2212, U+2215'};\n` +
        `}`,
    ),
    '',
  ].join('\n');
  await writeFile(path.join(outDir, 'fonts.css'), css, 'utf8');

  console.log(`Скопировано файлов: ${copied}; описано начертаний: ${faces.length}`);
  console.log(`Каталог: ${path.relative(root, outDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
