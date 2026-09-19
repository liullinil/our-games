#!/usr/bin/env node
/**
 * Подбор идентификатора Steam по названию игры — с проверкой, а не наугад.
 *
 * Идентификатор нельзя выдумывать: число само по себе ведёт на какую-нибудь
 * карточку, и скриншоты приедут от чужой игры. Поэтому здесь берётся выдача
 * поиска Steam, и запись принимается только тогда, когда название карточки
 * сходится с нашим (с точностью до «&» против «and», приписок вроде HD и
 * Gold и знаков препинания). Всё остальное печатается для просмотра глазами.
 *
 *   node scripts/find-steam.mjs            показать, что нашлось
 *   node scripts/find-steam.mjs --write     вписать подтверждённые совпадения
 *   node scripts/find-steam.mjs --write 35mm cradle
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { namesMatch, fieldList } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) igrostroy/0.1';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const only = args.filter((a) => !a.startsWith('--'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(term) {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&cc=us&l=english`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((x) => ({ id: x.id, name: x.name }));
}


const ids = only.length
  ? only
  : (await readdir(GAMES, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

let found = 0;
let missed = 0;

for (const id of ids) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) continue;
  const text = await readFile(file, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  if (/^steamAppId:/m.test(fm)) continue;

  const name = fm.match(/^name: "?(.+?)"?\s*$/m)?.[1] ?? id;
  const alts = fieldList(fm, 'altNames');
  const ours = [name, ...alts];

  /*
   * Ищем по латинскому написанию, если оно есть: магазин Steam почти не знает
   * русских названий, и запрос «Корсары: Возвращение легенды» не находит
   * ничего, тогда как «Age of Pirates 2» находит сразу.
   */
  const terms = [...new Set([...alts.filter((a) => /[a-z]/i.test(a)), name])];
  let hit = null;
  const seen = [];
  for (const term of terms) {
    const items = await search(term);
    seen.push(...items);
    hit = items.find((x) => namesMatch(ours, x.name, { strict: true }));
    await sleep(700);
    if (hit) break;
  }

  if (hit) {
    found += 1;
    console.log(`✓ ${id.padEnd(24)} ${String(hit.id).padEnd(9)} ${hit.name}`);
    if (WRITE) {
      const patched = text.replace(/^(gallery:)/m, `steamAppId: ${hit.id}\n$1`);
      await writeFile(file, patched, 'utf8');
    }
  } else {
    missed += 1;
    const top = seen.slice(0, 3).map((x) => `${x.id} «${x.name}»`).join(' | ') || 'ничего';
    console.log(`· ${id.padEnd(24)} не нашлось: ${top}`);
  }
}

console.log(`\nПодтверждено: ${found}, без совпадения: ${missed}.${WRITE ? ' Идентификаторы вписаны.' : ' Запись: --write'}`);
