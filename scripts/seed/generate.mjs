#!/usr/bin/env node
/**
 * Генерирует заготовки контента из реестра scripts/seed/*.mjs.
 *
 * Пишет только те файлы, которых ещё нет: готовые статьи не затираются.
 * С флагом --force перезаписывает frontmatter карточек (status: card), не трогая
 * статьи (status: article).
 *
 *   node scripts/seed/generate.mjs [--force]
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES } from './games.mjs';
import { STUDIOS } from './studios.mjs';
import { PLATFORMS } from './platforms.mjs';
import { ENGINES } from './engines.mjs';
import { SERIES } from './series.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const content = path.join(root, 'src', 'content');
const FORCE = process.argv.includes('--force');

const q = (s) => JSON.stringify(String(s));
const list = (arr) => (arr && arr.length ? arr.map((x) => `\n  - ${q(x)}`).join('') : ' []');
const refList = (arr) => (arr && arr.length ? arr.map((x) => `\n  - ${x}`).join('') : ' []');

/** Страна игры: студия на момент выхода, но до 1992 года — СССР. */
const SOVIET = new Set(['russia', 'ukraine', 'belarus', 'kazakhstan', 'armenia', 'georgia', 'estonia', 'latvia', 'lithuania', 'moldova', 'uzbekistan', 'azerbaijan']);
function countryOf(game) {
  if (game.country) return game.country;
  const studio = STUDIOS[game.dev];
  if (!studio) throw new Error(`${game.name}: студия ${game.dev} не в реестре`);
  if (game.year <= 1991 && (studio.country === 'ussr' || SOVIET.has(studio.country))) return 'ussr';
  return studio.country;
}

function externalPrototype(line) {
  const [name, maker, country, year] = line.split('|').map((s) => s.trim());
  const out = [`    - name: ${q(name)}`];
  if (maker) out.push(`      maker: ${q(maker)}`);
  if (country) out.push(`      country: ${q(country)}`);
  if (year) out.push(`      year: ${Number(year)}`);
  return out.join('\n');
}

function gameFrontmatter(id, g) {
  const lines = ['---', `name: ${q(g.name)}`, `altNames:${list(g.alt)}`];
  if (g.kind && g.kind !== 'game') lines.push(`kind: ${g.kind}`, `baseGame: ${g.base}`);
  lines.push(`type: ${g.type}`, `class: ${g.class}`, `developer: ${g.dev}`, `publishers:${refList(g.pub)}`);
  if (g.series) lines.push(`series: ${g.series}`);
  lines.push(`country: ${countryOf(g)}`);
  lines.push('years:', `  start: ${g.year}`);
  if (g.end === null) lines.push('  end: null');
  else if (typeof g.end === 'number') lines.push(`  end: ${g.end}`);
  if (g.pred && g.pred.length) lines.push(`predecessors:${refList(g.pred)}`);
  const basedOn = g.basedOn ?? [];
  if (basedOn.length) {
    lines.push('basedOn:');
    for (const item of basedOn) {
      if (item.includes('|')) lines.push(externalPrototype(item));
      else lines.push(`  - ${item}`);
    }
  }
  lines.push(`platforms:${refList(g.platforms)}`);
  if (g.engines && g.engines.length) lines.push(`engines:${refList(g.engines)}`);
  lines.push('summary: >-', `  ${g.summary}`);
  if (g.steam) lines.push(`steamAppId: ${g.steam}`);
  lines.push('gallery: []', 'sources: []', 'status: card', '---', '');
  return lines.join('\n');
}

function studioFrontmatter(id, s) {
  const names = s.names
    .map(([name, short, from, to]) => `  - name: ${q(name)}\n    short: ${q(short)}\n    from: ${from}\n    to: ${to === null ? 'null' : to}`)
    .join('\n');
  const lines = ['---', 'names:', names, `city: ${q(s.city)}`, `country: ${s.country}`, `founded: ${s.founded}`, `closed: ${s.closed === null ? 'null' : s.closed}`, `kind: ${s.kind}`];
  if (s.website) lines.push(`website: ${s.website}`);
  lines.push('summary: >-', `  ${s.summary}`, 'sources: []', '---', '');
  return lines.join('\n');
}

function platformFrontmatter(id, p) {
  const lines = ['---', `name: ${q(p.name)}`, `altNames:${list(p.altNames)}`, `kind: ${p.kind}`];
  if (p.maker) lines.push(`maker: ${q(p.maker)}`);
  lines.push(`country: ${p.country}`, 'years:', `  start: ${p.years[0]}`, `  end: ${p.years[1] === null ? 'null' : p.years[1]}`);
  lines.push('summary: >-', `  ${p.summary}`, 'sources: []', '---', '');
  return lines.join('\n');
}

function engineFrontmatter(id, e) {
  const lines = ['---', `name: ${q(e.name)}`, `altNames:${list(e.altNames)}`];
  if (e.developer) lines.push(`developer: ${e.developer}`);
  if (e.maker) lines.push(`maker: ${q(e.maker)}`);
  lines.push(`origin: ${e.origin}`);
  if (e.tech) lines.push(`tech: ${q(e.tech)}`);
  lines.push('years:', `  start: ${e.years[0] === null ? 'null' : e.years[0]}`, `  end: ${e.years[1] === null ? 'null' : e.years[1]}`);
  if (e.basedOn) lines.push(`basedOn: ${q(e.basedOn)}`);
  if (e.website) lines.push(`website: ${e.website}`);
  lines.push('summary: >-', `  ${e.summary}`, 'sources: []', '---', '');
  return lines.join('\n');
}

function seriesYaml(id, s) {
  const lines = [`name: ${q(s.name)}`];
  if (s.studio) lines.push(`studio: ${s.studio}`);
  lines.push(`type: ${s.type}`, 'summary: >-', `  ${s.summary}`, '');
  return lines.join('\n');
}

/** Пишет файл, если его нет; при --force заменяет frontmatter карточки, сохраняя тело. */
async function put(file, frontmatter, bodyDefault = '') {
  await mkdir(path.dirname(file), { recursive: true });
  if (!existsSync(file)) {
    await writeFile(file, frontmatter + bodyDefault, 'utf8');
    return 'new';
  }
  if (!FORCE) return 'kept';
  const text = await readFile(file, 'utf8');
  if (/^status:\s*article/m.test(text)) return 'article';
  // У yaml-карточек (серии) тела нет: файл заменяется целиком.
  if (file.endsWith('.yaml')) {
    await writeFile(file, frontmatter, 'utf8');
    return 'updated';
  }
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  const body = m ? text.slice(m[0].length) : text;
  await writeFile(file, frontmatter + body, 'utf8');
  return 'updated';
}

const stats = {};
const tick = (k) => (stats[k] = (stats[k] ?? 0) + 1);

for (const [id, g] of Object.entries(GAMES)) {
  for (const p of g.platforms) if (!PLATFORMS[p]) throw new Error(`${id}: платформа ${p} не в реестре`);
  for (const e of g.engines ?? []) if (!ENGINES[e]) throw new Error(`${id}: движок ${e} не в реестре`);
  for (const p of g.pub ?? []) if (!STUDIOS[p]) throw new Error(`${id}: издатель ${p} не в реестре`);
  if (g.series && !SERIES[g.series]) throw new Error(`${id}: серия ${g.series} не в реестре`);
  for (const p of g.pred ?? []) if (!GAMES[p]) throw new Error(`${id}: предшественник ${p} не в реестре`);
  tick(await put(path.join(content, 'games', id, 'index.md'), gameFrontmatter(id, g), '\n'));
}
for (const [id, s] of Object.entries(STUDIOS)) {
  tick(await put(path.join(content, 'studios', id, 'index.md'), studioFrontmatter(id, s), '\n'));
}
for (const [id, p] of Object.entries(PLATFORMS)) {
  tick(await put(path.join(content, 'platforms', id, 'index.md'), platformFrontmatter(id, p), '\n'));
}
for (const [id, e] of Object.entries(ENGINES)) {
  if (e.developer && !STUDIOS[e.developer]) throw new Error(`engine ${id}: студия ${e.developer} не в реестре`);
  tick(await put(path.join(content, 'engines', `${id}.md`), engineFrontmatter(id, e), '\n'));
}
for (const [id, s] of Object.entries(SERIES)) {
  if (s.studio && !STUDIOS[s.studio]) throw new Error(`series ${id}: студия ${s.studio} не в реестре`);
  tick(await put(path.join(content, 'series', `${id}.yaml`), seriesYaml(id, s)));
}

console.log(
  `Игр: ${Object.keys(GAMES).length}, студий: ${Object.keys(STUDIOS).length}, платформ: ${Object.keys(PLATFORMS).length}, движков: ${Object.keys(ENGINES).length}, серий: ${Object.keys(SERIES).length}.`,
);
console.log(Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(', '));
