#!/usr/bin/env node
/**
 * Сверка картинок из Википедии с игрой, к которой они приписаны.
 *
 * Поиск по Википедии наводится на статью по названию, и промахивается он
 * тише, чем ошибка в идентификаторе Steam: статья находится, картинка с неё
 * скачивается, подпись собирается из названия нашей игры — и всё выглядит
 * правильно. А на деле у Ex Machina постером оказалась обложка британской
 * «Deus Ex Machina» 1984 года, а у «Проклятых земель» — обложка сиквела.
 *
 * По имени файла судить нельзя: половина наших картинок лежит под
 * транслитерацией (Magiakrovicover, Mehanoid_26581) или аббревиатурой
 * (ШХЗСС, КосмРейндж). Зато Википедия знает, в каких статьях файл стоит, —
 * и если он стоит в статье про нашу игру, вопрос закрыт.
 *
 *   node scripts/check-wiki.mjs             сверить по статьям (нужна сеть)
 *   node scripts/check-wiki.mjs --offline   грубая сверка по имени файла
 *   node scripts/check-wiki.mjs --all       показать и сошедшиеся
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { norm, namesMatch, fieldList } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const OFFLINE = process.argv.includes('--offline');
const ALL = process.argv.includes('--all');

/* Уточнения в скобках: «Аллоды (игра)», «Cradle (video game)». */
const DISAMBIG = /\s*\((?:[^)]*?(?:игра|game|серия|series|компьютерн\w*)[^)]*)\)\s*$/i;

/* Служебные слова в именах файлов — нужны только для сверки без сети. */
const NOISE =
  /\b(cover ?art|box ?art|cover|box|screen ?shot|screen|gameplay|splash|title|logo|art|scaled|video ?game|игра|игры|обложка|обложки|скриншот|скриншоты|кадр|кадры|заставка|диска|видеоигра)\b/gi;

/**
 * Совпадает ли название статьи с названием игры.
 *
 * Здесь нельзя пользоваться обычным вхождением: «Ex Machina» входит в «Deus
 * Ex Machina», хотя это две разные игры с разницей в двадцать лет. Зато
 * приставка спереди — признак другой игры, а хвост — обычно подзаголовок
 * («Аллоды» → «Аллоды: Печать тайны»). Поэтому требуем общее начало.
 */
const titleMatches = (ours, theirs) => {
  const b = norm(theirs.replace(DISAMBIG, ''));
  if (b.length < 3) return false;
  return ours.map(norm).some((a) => a.length >= 3 && (a.startsWith(b) || b.startsWith(a)));
};

/** Кто использует файлы: {«Файл:X.jpg» → [названия статей]}. */
async function fileUsage(host, titles) {
  const usage = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const url = new URL(`https://${host}/w/api.php`);
    url.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'fileusage',
      fulimit: '50',
      funamespace: '0',
      titles: titles.slice(i, i + 50).join('|'),
    });
    const res = await fetch(url, { headers: { 'user-agent': 'igrostroy-check/1.0' } });
    if (!res.ok) throw new Error(`${host} ответил ${res.status}`);
    const data = await res.json();
    for (const page of data.query?.pages ?? []) {
      usage.set(page.title, (page.fileusage ?? []).map((u) => u.title));
    }
  }
  return usage;
}

const shots = [];
const ids = (await readdir(GAMES, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

for (const id of ids) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) continue;
  const text = await readFile(file, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const name = fm.match(/^name: "?(.+?)"?\s*$/m)?.[1] ?? id;
  const ours = [name, ...fieldList(fm, 'altNames')];

  for (const m of fm.matchAll(/sourceUrl: "(https:\/\/([a-z-]+)\.wikipedia\.org\/[^"]+)"/g)) {
    const title = decodeURIComponent(m[1]).split('/wiki/').pop() ?? '';
    shots.push({ id, ours, host: `${m[2]}.wikipedia.org`, title, url: m[1] });
  }
}

const problems = [];
const ok = [];

if (OFFLINE) {
  for (const s of shots) {
    const bare = s.title
      .replace(/^[^:]+:/, '')
      .replace(/\.(jpe?g|png|gif|webp|svg)$/i, '')
      .replace(/[_()]+/g, ' ')
      .replace(NOISE, ' ')
      .replace(/\b\d{3,4}\b/g, ' ')
      .trim();
    (namesMatch(s.ours, bare) ? ok : problems).push({ ...s, where: `имя файла: ${bare}` });
  }
} else {
  const byHost = new Map();
  for (const s of shots) {
    if (!byHost.has(s.host)) byHost.set(s.host, []);
    byHost.get(s.host).push(s.title);
  }
  const usage = new Map();
  for (const [host, titles] of byHost) {
    for (const [title, arts] of await fileUsage(host, [...new Set(titles)])) {
      usage.set(`${host}|${title}`, arts);
    }
  }
  for (const s of shots) {
    const arts = usage.get(`${s.host}|${s.title.replace(/_/g, ' ')}`) ?? [];
    const row = { ...s, where: arts.length ? `стоит в статьях: ${arts.join(', ')}` : 'не стоит ни в одной статье' };
    (arts.some((a) => titleMatches(s.ours, a)) ? ok : problems).push(row);
  }
}

if (ALL) {
  console.log(`Сошлись (${ok.length}):`);
  for (const r of ok) console.log(`  ${r.id.padEnd(24)} ${r.where}`);
  console.log();
}

if (problems.length === 0) {
  console.log(`Картинки из Википедии сверены со статьями: ${ok.length}, расхождений нет.`);
  process.exit(0);
}

console.log(`Картинка не подтверждается статьёй про игру (${problems.length}):\n`);
for (const p of problems) {
  console.log(`  ${p.id}`);
  console.log(`    у нас:  ${p.ours.join(' / ')}`);
  console.log(`    ${p.where}`);
  console.log(`    ${p.url}`);
  console.log();
}
console.log('Картинка своя, а название у неё западное или старое — впишите его в altNames.');
console.log('Чужая — уберите её из галереи и из папки shots.');
console.log(`Сошлось без вопросов: ${ok.length}.`);
process.exit(1);
