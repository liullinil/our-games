#!/usr/bin/env node
/**
 * Скриншоты из GOG для старых игр, которых нет в Steam.
 *
 * Многие игры девяностых и нулевых живут не в Steam, а на GOG: «Аллоды»
 * продаются там как Rage of Mages, Codename: Outbreak — как Venom. У статей о
 * них по одной картинке из Википедии, хотя в карточке магазина лежит
 * десяток кадров. Каталог GOG отвечает открытым JSON без ключа, и в выдаче
 * сразу есть и адреса скриншотов, и имя разработчика.
 *
 * Игру ищем не по названию, а по адресу карточки, который уже стоит в блоке
 * «где взять»: название магазина и наше часто расходятся, а адрес однозначен.
 * Кадры дописываются следом за уже лежащими картинками — обложка и постер
 * остаются на месте.
 *
 *   node scripts/fetch-gog.mjs allods codename-outbreak
 *   node scripts/fetch-gog.mjs allods --dry
 *   node scripts/fetch-gog.mjs allods --limit 6        сколько кадров брать (по умолчанию 5)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'nashi-igry-encyclopedia/1.0';
const QUOTE = '"';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const DRY = flag('dry');
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || 5;
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--limit');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const yamlStr = (s) => QUOTE + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim() + QUOTE;

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`GOG ответил ${res.status}`);
  return res.json();
}

async function getBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

/** Адрес карточки GOG из блока «где взять»: по нему игра определяется однозначно. */
function gogSlug(text) {
  return text.match(/gog\.com\/(?:[a-z]{2}\/)?game\/([a-z0-9_]+)/)?.[1] ?? null;
}

/**
 * Карточка в каталоге. Ищем по словам из адреса и берём ту, у которой адрес
 * совпадает в точности: «rage_of_mages» и «rage_of_mages_ii_necromancer» —
 * разные игры, а поиск по словам вернёт обе.
 */
async function findProduct(slug) {
  const q = encodeURIComponent(slug.replace(/_/g, ' '));
  const data = await getJson(
    `https://catalog.gog.com/v1/catalog?query=like:${q}&limit=20&locale=en-US&countryCode=US&currencyCode=USD`,
  );
  return (data.products ?? []).find((p) => p.slug === slug) ?? null;
}

for (const id of only) {
  const file = path.join(GAMES, id, 'index.md');
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    console.log(`· ${id}: нет такой игры`);
    continue;
  }
  const slug = gogSlug(text);
  if (!slug) {
    console.log(`· ${id}: в «где взять» нет ссылки на GOG`);
    continue;
  }
  const product = await findProduct(slug);
  if (!product) {
    console.log(`· ${id}: карточка ${slug} в каталоге не нашлась`);
    continue;
  }
  const author = (product.developers ?? [])[0]?.trim() || (product.publishers ?? [])[0]?.trim() || 'правообладатель';
  const page = `https://www.gog.com/en/game/${slug}`;
  const shots = (product.screenshots ?? []).slice(0, LIMIT);
  console.log(`${id}: ${product.title} (${slug}) — ${author}, кадров ${shots.length}`);
  if (DRY || shots.length === 0) continue;

  const dir = path.join(GAMES, id, 'shots');
  await mkdir(dir, { recursive: true });
  const written = [];
  for (const [i, tpl] of shots.entries()) {
    // Без суффикса формата GOG отдаёт оригинал; ужимаем до 1600 по ширине сами.
    const bytes = await getBytes(tpl.replace('_{formatter}', ''));
    if (!bytes) continue;
    const name = `gog-${String(i + 1).padStart(2, '0')}.jpg`;
    const buf = await sharp(bytes, { failOn: 'none' }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    await writeFile(path.join(dir, name), buf);
    written.push(name);
    await sleep(150);
  }

  // Перечитываем: пока качались кадры, статью могли поправить.
  const fresh = await readFile(file, 'utf8');
  const name = fresh.match(/^name:\s*"?(.+?)"?\s*$/m)?.[1] ?? id;
  const blocks = written
    .map((f) =>
      [
        `  - kind: image`,
        `    src: ./shots/${f}`,
        `    caption: ${yamlStr(`${name}: кадр из игры`)}`,
        `    author: ${yamlStr(author)}`,
        `    license: "Скриншот"`,
        `    sourceUrl: ${yamlStr(page)}`,
      ].join('\n') + '\n',
    )
    .join('');
  const images = [...fresh.matchAll(/^ {2}- kind: image\r?\n(?: {4}.*\r?\n)*/gm)];
  let out;
  if (images.length) {
    const last = images[images.length - 1];
    const at = last.index + last[0].length;
    out = fresh.slice(0, at) + blocks + fresh.slice(at);
  } else if (/^gallery:\s*\[\]\s*$/m.test(fresh)) {
    out = fresh.replace(/^gallery:\s*\[\]\s*$/m, `gallery:\n${blocks}`.replace(/\n$/, ''));
  } else {
    out = fresh.replace(/^gallery:[ \t]*\r?\n/m, `gallery:\n${blocks}`);
  }
  await writeFile(file, out, 'utf8');
  console.log(`  ✓ дописано ${written.length}`);
  await sleep(600);
}
