#!/usr/bin/env node
/**
 * Проверка ссылок «где взять игру».
 *
 * Блок `availability` — самое практичное, что есть в статье: читатель жмёт
 * ссылку, чтобы игру купить или скачать. Ссылки гниют быстрее всего
 * остального, и обычный `check-links.mjs` их не видит: он про внутренние
 * адреса сайта.
 *
 * Отдельная беда — мягкие отказы. У World of Spectrum адрес несуществующей
 * игры отдаёт честные 200 и страницу поиска, так что проверка «код не 404»
 * ничего не значит. Поэтому для каждого хоста берём ещё и заведомо
 * выдуманный адрес: если он отвечает так же, значит, хост отвечает 200 на
 * что угодно, и его ответы ничего не подтверждают.
 *
 *   node scripts/check-stores.mjs                 проверить все
 *   node scripts/check-stores.mjs --host gog.com  только один хост
 *   node scripts/check-stores.mjs --game vangers  только одну игру
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};
const ONLY_HOST = opt('host');
const ONLY_GAME = opt('game');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Адреса из блока availability вместе с игрой, которой они принадлежат. */
async function collect() {
  const out = [];
  for (const id of (await readdir(GAMES, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()) {
    if (ONLY_GAME && id !== ONLY_GAME) continue;
    const text = await readFile(path.join(GAMES, id, 'index.md'), 'utf8');
    const block = text.match(/^availability:\n([\s\S]*?)\n(?=[a-zA-Z]+:|---)/m);
    if (!block) continue;
    const status = block[1].match(/^\s*status:\s*(\S+)/m)?.[1] ?? '?';
    for (const m of block[1].matchAll(/^\s*(?:- )?title: "([^"]+)"\n\s*url: "([^"]+)"/gm)) {
      out.push({ game: id, status, title: m[1], url: m[2] });
    }
  }
  return out;
}

/** Один запрос: код ответа, конечный адрес и размер тела. */
async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.8' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const body = await res.text();
    const pageTitle = body.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
    return { code: res.status, final: res.url, size: body.length, pageTitle };
  } catch (e) {
    return { code: 0, final: url, size: 0, pageTitle: '', error: String(e.message || e).slice(0, 60) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Выдуманный адрес того же вида: последний кусок пути заменён на заведомую
 * чушь. Магазины устроены как одностраничные приложения и отвечают кодом 200
 * на любой путь, так что сам по себе код ничего не значит. Зато настоящая
 * карточка отличается от выдуманной заголовком и объёмом — по ним и судим.
 */
function decoy(url) {
  const u = new URL(url);
  const parts = u.pathname.replace(/\/$/, '').split('/');
  if (parts.length < 2) return null;
  parts[parts.length - 1] = 'zzz-takoy-igry-net-000';
  u.pathname = parts.join('/');
  u.search = '';
  return u.toString();
}

/**
 * Steam проверяем не страницей, а её же API: карточка снятой с продажи игры
 * молча отдаёт главную магазина с кодом 200.
 */
async function steamCheck(url) {
  const id = url.match(/\/app\/(\d+)/)?.[1];
  if (!id) return null;
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&cc=us&l=english`, {
    headers: { 'User-Agent': UA },
  });
  const data = await res.json().catch(() => null);
  const entry = data?.[id];
  if (entry?.success) return { ok: true, note: `appid ${id}: ${entry.data.name}` };
  /*
   * API отказал — это ещё не приговор. Смотрим саму карточку: если она
   * открывается и называется своим именем, игра просто снята с продажи, но
   * ссылка живая. Если вместо карточки главная магазина — ссылка мёртвая.
   */
  const page = await fetch(`https://store.steampowered.com/app/${id}/`, {
    headers: { 'User-Agent': UA, Cookie: 'birthtime=315532801; wants_mature_content=1' },
    redirect: 'follow',
  }).catch(() => null);
  const html = page ? await page.text().catch(() => '') : '';
  const title = html.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1]?.trim() ?? '';
  if (/on Steam$/i.test(title)) {
    return { ok: true, note: `appid ${id}: ${title.replace(/ on Steam$/i, '')} — карточка есть, в продаже нет` };
  }
  return { ok: false, note: `appid ${id}: карточка уводит на главную магазина` };
}

const links = await collect();
const byHost = new Map();
for (const link of links) {
  const host = new URL(link.url).host.replace(/^www\./, '');
  if (ONLY_HOST && host !== ONLY_HOST) continue;
  if (!byHost.has(host)) byHost.set(host, []);
  byHost.get(host).push(link);
}

console.log(`Ссылок «где взять»: ${[...byHost.values()].reduce((n, a) => n + a.length, 0)} на ${byHost.size} хостах.`);

const problems = [];
const blind = [];

for (const [host, group] of byHost) {
  /*
   * Слепок несуществующей страницы этого хоста: с чем сравнивать настоящие.
   * Steam сверяем не страницей, а его же API, поэтому слепок ему не нужен.
   */
  const viaApi = host === 'store.steampowered.com';
  let sample = null;
  if (!viaApi) {
    const probeDecoy = decoy(group[0].url);
    if (probeDecoy) {
      const r = await probe(probeDecoy);
      if (r.code >= 200 && r.code < 300) sample = r;
      await sleep(700);
    }
  }

  for (const link of group) {
    let verdict;
    if (viaApi) {
      const s = await steamCheck(link.url);
      verdict = s ? { code: s.ok ? 200 : 404, note: s.note } : await probe(link.url);
    } else {
      verdict = await probe(link.url);
    }

    if (verdict.code === 0 || verdict.code >= 400) {
      problems.push({ ...link, ...verdict });
    } else if (!viaApi && verdict.size === 0) {
      /* Код 200 с пустым телом — так World of Spectrum отвечает на выдуманную игру. */
      problems.push({ ...link, ...verdict, empty: true });
    } else if (sample) {
      /*
       * Хост отвечает и на выдумку. Настоящая карточка обязана чем-то от неё
       * отличаться: своим заголовком или заметно другим объёмом страницы.
       * Если не отличается ничем — за адресом пусто.
       */
      /* Пустой заголовок у обоих — тоже совпадение: страница ничем себя не называет. */
      const sameTitle = (verdict.pageTitle || '') === (sample.pageTitle || '');
      const sameSize = sample.size > 0 && Math.abs(verdict.size - sample.size) / sample.size < 0.02;
      if (sameTitle && sameSize) problems.push({ ...link, ...verdict, soft: true });
      else if (sameTitle) blind.push({ ...link, ...verdict });
    }
    await sleep(700);
  }
}

if (blind.length) {
  console.log('\nЗаголовок как у несуществующей страницы, но объём другой — проверьте глазами:');
  for (const b of blind) console.log(`  ${b.game} · ${b.pageTitle || '(без заголовка)'}\n    ${b.url}`);
}

if (problems.length === 0) {
  console.log('\nВсе ссылки ведут на живые страницы.');
} else {
  console.log(`\nТребуют внимания: ${problems.length}`);
  for (const p of problems) {
    const why = p.empty
      ? 'ответ пустой — за адресом ничего нет'
      : p.soft
        ? 'страница неотличима от несуществующей'
        : p.error
          ? p.error
          : `код ${p.code}`;
    console.log(`  ${p.game} · ${p.title}\n    ${p.url}\n    ${why}${p.note ? ` — ${p.note}` : ''}`);
  }
  process.exitCode = 1;
}
