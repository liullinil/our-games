// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import { execSync } from 'node:child_process';

/*
 * Метка сборки идёт в адреса тем эпох и листа миниатюр (`?v=…`): GitHub Pages
 * кэширует статику, и без метки обновлённая тема не доехала бы до читателя.
 * В Actions есть GITHUB_SHA, локально берём хеш коммита и время сборки.
 */
function buildId() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 8);
  const stamp = Date.now().toString(36).slice(-5);
  try {
    return `${execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()}-${stamp}`;
  } catch {
    return stamp;
  }
}

const BUILD_ID = buildId();

// Сайт живёт в подпапке GitHub Pages (/our-games), но умеет и корень своего
// домена: адрес и подпуть задаются окружением.
const SITE = process.env.SITE_URL ?? 'https://liullinil.github.io';
const BASE = process.env.SITE_BASE ?? '/our-games';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  compressHTML: true,
  markdown: {
    // smartPunctuation выключен: иначе получаются английские «умные» кавычки
    processor: satteri({ features: { gfm: true, smartPunctuation: false } }),
  },
  integrations: [mdx(), sitemap(), pagefind()],
  image: { layout: 'constrained', responsiveStyles: true },
  vite: {
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  },
});
