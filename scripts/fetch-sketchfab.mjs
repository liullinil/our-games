#!/usr/bin/env node
/**
 * 3D-модели со Sketchfab для статей об играх.
 *
 * Модели не скачиваются, а встраиваются проигрывателем Sketchfab, как ролики
 * с YouTube: так можно показать любую публичную модель, тогда как хранить
 * файл у себя разрешает только часть лицензий. Многие фанатские модели к тому
 * же собраны из ресурсов самой игры, и лицензия, под которой их выложили,
 * автору модели не принадлежит.
 *
 * Поиск Sketchfab открыт без ключа, но выдача шумная: по запросу «stalker»
 * приходит и детектор из S.T.A.L.K.E.R., и «Лиса и курица». Поэтому каждую
 * модель проверяем двумя способами — по её имени и по тегам:
 *
 *  - название игры стоит в имени модели — годится, если название
 *    достаточно приметное («Metro 2033», «Atomic Heart», «Pathologic»);
 *  - все слова названия есть среди тегов — тоже годится: «librarian» из
 *    Metro 2033 называется просто «librarian», но помечен «metro» и «2033»;
 *  - короткое обиходное название вроде «stalker» или «cradle» засчитывается,
 *    только если модель к тому же помечена как игровая: «fanart», «game» и
 *    подобное в тегах или описании.
 *
 *   node scripts/fetch-sketchfab.mjs --auto all                пробный проход
 *   node scripts/fetch-sketchfab.mjs --auto metro-2033 --write записать
 *   node scripts/fetch-sketchfab.mjs --game vangers --add <uid>
 *   node scripts/fetch-sketchfab.mjs --game vangers --drop <uid>
 *   node scripts/fetch-sketchfab.mjs --take 3                  сколько моделей на статью (по умолчанию 2)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenText } from './lib/mentions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'nashi-igry-encyclopedia/1.0';
const API = 'https://api.sketchfab.com/v3';
const QUOTE = '"';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const list = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j += 1) out.push(argv[j]);
  return out;
};
const opt = (name, fallback) => list(name)[0] ?? fallback;

const WRITE = flag('write');
const TAKE = Number(opt('take', 2));

/** Без регистра, без пунктуации: «S.T.A.L.K.E.R.» и «stalker» — одно и то же. */
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.'’`]/g, '')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim();

/** Признак того, что модель — из видеоигры, а не просто предмет с тем же словом. */
const GAMEY = /\b(game|games|gaming|videogame|video game|fanart|fan art|gameart|game art|game asset|ingame|in game|mod|игр[аыуеой]|игров|фанарт)\b/i;

const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();

function readGame(id) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const name = (text.match(/^name:\s*(.+)$/m)?.[1] ?? id).trim().replace(/^["']|["']$/g, '');
  const altRaw = text.match(/^altNames:\s*\[(.*)\]\s*$/m)?.[1];
  const altNames =
    altRaw !== undefined
      ? altRaw.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      : [...(text.match(/^altNames:\s*\n((?:\s+- .*\n)+)/m)?.[1] ?? '').matchAll(/^\s+- (.+)$/gm)].map((m) =>
          m[1].trim().replace(/^["']|["']$/g, ''),
        );
  const have = [...text.matchAll(/- kind: sketchfab\r?\n\s+id: "([0-9a-f]{32})"/g)].map((m) => m[1]);
  return { id, name, altNames, have, file };
}

/**
 * Под какими именами искать. Sketchfab международный, и игры там подписывают
 * латиницей, поэтому сначала идут латинские названия, а русское — последним.
 * Подзаголовки отбрасываем: «Metro 2033 Redux» и «Metro 2033» ищутся одинаково.
 */
function searchForms(game) {
  const all = [...game.altNames, game.name];
  const seen = new Set();
  const out = [];
  for (const raw of all) {
    const base = raw.replace(/[«»"]/g, '').replace(/\s*[:(].*$/, '').trim();
    const n = norm(base);
    if (!n || n.length < 3 || seen.has(n)) continue;
    seen.add(n);
    out.push({ raw: base, n, latin: /^[a-z0-9 ]+$/.test(n) });
  }
  return out.sort((a, b) => Number(b.latin) - Number(a.latin));
}

/**
 * Стоит ли название среди тегов. Целиком — «potion-craft», «metro2033» —
 * годится всегда. По отдельным словам — только если среди них есть цифра:
 * «metro» и «2033» ни с чем не спутаешь, а «potion» и «craft» стоят и на
 * зелье из Minecraft.
 */
function nameInTags(n, tagSet) {
  if (tagSet.has(n) || tagSet.has(n.replace(/ /g, ''))) return true;
  const words = n.split(' ');
  return words.length >= 2 && /\d/.test(n) && words.every((w) => tagSet.has(w));
}

/** Приметное ли название: из двух слов, с цифрой или длинное само по себе. */
const distinctive = (n) => n.split(' ').length >= 2 || /\d/.test(n) || n.length >= 9;

/**
 * Какая игра из всей энциклопедии подходит модели точнее всего: та, чьё
 * название стоит в имени модели и длиннее остальных. «Pathologic 2:
 * Bachelor» подходит и «Мору» 2005 года («pathologic»), и «Мору» 2019-го
 * («pathologic 2») — второму точнее.
 */
let INDEX = null;
function bestGame(model) {
  if (!INDEX) {
    INDEX = readdirSync(GAMES)
      .map(readGame)
      .filter(Boolean)
      .map((g) => ({ id: g.id, forms: searchForms(g).map((f) => f.n) }));
  }
  const name = norm(model.name);
  const tags = new Set((model.tags ?? []).map((t) => norm(t.name)));
  let best = null;
  for (const g of INDEX) {
    for (const n of g.forms) {
      const words = n.split(' ');
      const inName = new RegExp(`(^| )${n}( |$)`).test(name);
      const inTags = nameInTags(n, tags);
      if ((inName || inTags) && (!best || n.length > best.n.length)) best = { id: g.id, n };
    }
  }
  return best;
}

/**
 * Названа ли в тегах игра другой серии. Серию узнаём по первому слову
 * латинского названия — «metro», «stalker», «pathologic»: у Metro 2033 и
 * Metro Exodus оно общее, у S.T.A.L.K.E.R. — своё.
 */
function stuffed(tagSet, ourFamily) {
  bestGame({ name: '', tags: [] }); // строит индекс, если его ещё нет
  for (const g of INDEX) {
    for (const n of g.forms) {
      const family = n.split(' ')[0];
      if (family === ourFamily || family.length < 5 || !/^[a-z]+$/.test(family)) continue;
      if (tagSet.has(family) || tagSet.has(n.replace(/ /g, ''))) return true;
    }
  }
  return false;
}

/**
 * Годится ли модель для игры. Возвращает причину отказа или null.
 */
function judge(model, game, forms) {
  const owner = bestGame(model);
  if (owner && owner.id !== game.id && !forms.some((f) => f.n === owner.n)) return `точнее подходит ${owner.id}`;
  if (model.isAgeRestricted) return 'возрастное ограничение';
  const name = norm(model.name);
  const tags = (model.tags ?? []).map((t) => norm(t.name));
  const tagSet = new Set(tags);
  const desc = String(model.description ?? '');
  if (forbiddenText(`${model.name} ${tags.join(' ')}`, game.id)) return 'под редакционным правилом';

  for (const f of forms) {
    const words = f.n.split(' ');
    const inName = new RegExp(`(^| )${f.n}( |$)`).test(name);
    // Одно слово в тегах — ещё не примета: «tetris» стоит и на модели приставки NES.
    const inTags = nameInTags(f.n, tagSet);
    if (!inName && !inTags) continue;
    /*
     * Набивка тегов: обычный станок, помеченный сразу «metro2033», «stalker»
     * и «metro-exodus», чтобы его находили по любой из игр. Если модель
     * попала к нам только по тегам, а в тегах названы игры разных серий,
     * это ассет на все случаи, а не модель из нашей игры.
     */
    if (!inName && stuffed(tagSet, words[0])) return 'теги собраны под несколько игр';
    if (distinctive(f.n)) return null;
    // Короткое обиходное название: нужна примета видеоигры.
    if (GAMEY.test(`${model.name} ${tags.join(' ')} ${desc}`)) return null;
    return 'короткое название без приметы игры';
  }
  return 'нет названия игры ни в имени, ни в тегах';
}

async function search(query) {
  const url = `${API}/search?type=models&q=${encodeURIComponent(query)}&count=24&sort_by=-likeCount`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Sketchfab ответил ${res.status}`);
    return (await res.json()).results ?? [];
  }
  throw new Error('Sketchfab отвечает 429 подряд');
}

async function model(uid) {
  const res = await fetch(`${API}/models/${uid}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Sketchfab ответил ${res.status} на модель ${uid}`);
  return res.json();
}

/** Превью среднего размера: большое тяжело, маленькое расплывается в рамке. */
function poster(m) {
  const images = [...(m.thumbnails?.images ?? [])].sort((a, b) => b.width - a.width);
  return (images.find((i) => i.width <= 1024) ?? images[images.length - 1])?.url;
}

function block(m) {
  const lines = [
    `  - kind: sketchfab`,
    `    id: ${QUOTE}${m.uid}${QUOTE}`,
    `    title: ${QUOTE}${escape(m.name)}${QUOTE}`,
    `    author: ${QUOTE}${escape(m.user?.displayName || m.user?.username || 'неизвестен')}${QUOTE}`,
  ];
  if (m.license?.label) lines.push(`    license: ${QUOTE}${escape(m.license.label)}${QUOTE}`);
  const p = poster(m);
  if (p) lines.push(`    poster: ${QUOTE}${p}${QUOTE}`);
  lines.push(`    checkedAt: ${QUOTE}${new Date().toISOString().slice(0, 10)}${QUOTE}`);
  return lines.join('\n') + '\n';
}

/** Модели встают в конец галереи — после кадров и роликов. */
function writeModels(game, models) {
  let text = readFileSync(game.file, 'utf8');
  const blocks = models.filter((m) => !text.includes(`id: ${QUOTE}${m.uid}${QUOTE}`)).map(block);
  if (blocks.length === 0) return 0;
  if (/^gallery:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^gallery:\s*\[\]\s*$/m, `gallery:\n${blocks.join('').replace(/\n$/, '')}`);
  } else {
    const g = text.match(/^gallery:[ \t]*\r?\n((?:[ \t]+.*\r?\n)*)/m);
    if (!g) throw new Error(`${game.id}: нет галереи`);
    const at = g.index + g[0].length;
    text = text.slice(0, at) + blocks.join('') + text.slice(at);
  }
  writeFileSync(game.file, text, 'utf8');
  return blocks.length;
}

function dropModels(game, uids) {
  let text = readFileSync(game.file, 'utf8');
  let n = 0;
  for (const uid of uids) {
    const re = new RegExp(`^ {2}- kind: sketchfab\\r?\\n {4}id: "${uid}"\\r?\\n(?: {4}.*\\r?\\n)*`, 'm');
    if (re.test(text)) {
      text = text.replace(re, '');
      n += 1;
    }
  }
  writeFileSync(game.file, text, 'utf8');
  return n;
}

async function main() {
  const only = list('game')[0];
  if (only && (flag('add') || flag('drop'))) {
    const game = readGame(only);
    if (!game) throw new Error(`нет такой игры: ${only}`);
    if (flag('drop')) {
      console.log(`Убрано моделей: ${dropModels(game, list('drop'))}`);
      return;
    }
    const picked = [];
    for (const uid of list('add')) {
      const m = await model(uid);
      if (forbiddenText(m.name, game.id)) throw new Error(`«${m.name}» — под редакционным правилом`);
      console.log(`${uid}: ${m.name} — ${m.user?.displayName} (${m.license?.label ?? 'стандартная лицензия'})`);
      picked.push(m);
    }
    console.log(`Вписано моделей: ${writeModels(game, picked)} → ${game.id}`);
    return;
  }

  const auto = list('auto');
  const ids = auto.includes('all') || auto.length === 0 ? readdirSync(GAMES).sort() : auto;
  const reasons = new Map();
  const used = new Map();
  let touched = 0;
  let written = 0;

  for (const [i, id] of ids.entries()) {
    const game = readGame(id);
    if (!game) continue;
    const need = TAKE - game.have.length;
    if (need <= 0) continue;
    const forms = searchForms(game);
    const candidates = [];
    const seen = new Set(game.have);
    // Две формы названия — латинская и русская; больше обращений не нужно.
    for (const f of forms.slice(0, 2)) {
      let found;
      try {
        found = await search(f.raw);
      } catch (e) {
        console.log(`  ${id}: ${e.message}`);
        continue;
      }
      await sleep(800);
      for (const m of found) {
        if (seen.has(m.uid)) continue;
        seen.add(m.uid);
        // Одна модель не должна разойтись по нескольким статьям.
        if (used.has(m.uid)) continue;
        const why = judge(m, game, forms);
        if (why) {
          reasons.set(why, (reasons.get(why) ?? 0) + 1);
          continue;
        }
        candidates.push(m);
      }
      if (candidates.length >= need * 3) break;
    }
    if (candidates.length === 0) continue;
    // Лучшие — по лайкам и просмотрам; один автор — не больше одной модели.
    candidates.sort((a, b) => b.likeCount * 20 + b.viewCount - (a.likeCount * 20 + a.viewCount));
    const picked = [];
    const authors = new Set();
    // Предмет модели — её имя без названия игры и служебных слов.
    const NOISE = new Set(['fan', 'art', 'fanart', 'model', 'game', 'from', 'the', 'and', 'low', 'poly', 'lowpoly', '3d']);
    const gameWords = new Set(forms.flatMap((f) => f.n.split(' ')));
    const subject = (m) => new Set(norm(m.name).split(' ').filter((w) => w.length > 2 && !gameWords.has(w) && !NOISE.has(w)));
    const subjects = [];
    for (const m of candidates) {
      const who = m.user?.username ?? '';
      if (authors.has(who)) continue;
      const sub = subject(m);
      if (sub.size && subjects.some((prev) => [...sub].filter((w) => prev.has(w)).length >= Math.min(sub.size, prev.size))) continue;
      authors.add(who);
      subjects.push(sub);
      picked.push(m);
      if (picked.length >= need) break;
    }
    console.log(`[${i + 1}/${ids.length}] ${id} (${game.name}): нашёл ${candidates.length}, беру ${picked.length}`);
    for (const m of picked) {
      used.set(m.uid, id);
      console.log(`    ${m.uid}  ♥${m.likeCount}  ${m.name} — ${m.user?.displayName}`);
    }
    if (WRITE) {
      written += writeModels(game, picked);
      touched += 1;
    }
  }

  console.log(`\nСтатей затронуто: ${touched}, моделей вписано: ${written}${WRITE ? '' : ' (пробный проход, --write не задан)'}`);
  if (reasons.size) {
    console.log('\nОтсеяно:');
    for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${why}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
