#!/usr/bin/env node
/**
 * Поиск роликов об игре на YouTube, Rutube и VK Видео.
 *
 * Идентификатор ролика нельзя придумать: он либо ведёт на настоящее видео,
 * либо никуда. Поэтому берём их только из выдачи площадок, а название и канал
 * пишем в статью из ответа, а не из головы.
 *
 * Выдача по запросу «Мор» или «Смута» наполовину состоит из чужого: новости,
 * реакции, нарезки, «топ-10» и ролики о ремонте. Поэтому каждое название
 * проходит три сита: в нём должна стоять сама игра, длительность должна быть
 * человеческой, а название — без мусорных примет. Для игры годятся обзоры,
 * геймплей, прохождения и ретроспективы — это и есть то, что мы ищем.
 *
 *   node scripts/fetch-video.mjs --auto all --take 3 --report tmp/video/report
 *   node scripts/fetch-video.mjs --auto stalker-shoc perimeter --write
 *   node scripts/fetch-video.mjs --query "Вангеры обзор" --source rutube
 *   node scripts/fetch-video.mjs --game vangers --add https://www.youtube.com/watch?v=<id>
 *   node scripts/fetch-video.mjs --game vangers --drop <id>
 *
 * Ключи к API не нужны ни YouTube, ни Rutube. VK Видео закрыт целиком: и поиск,
 * и проверка ролика требуют токен, поэтому для него нужен VK_TOKEN в .env.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const GAMES = path.join(root, 'src', 'content', 'games');
const PLATFORMS = ['youtube', 'rutube', 'vk'];
const PLATFORM_LABEL = { youtube: 'YouTube', rutube: 'Rutube', vk: 'VK Видео' };

/** Токен VK, если он есть: без него площадка не отвечает вообще ничего. */
async function vkToken() {
  try {
    const env = await readFile(path.join(root, '.env'), 'utf8');
    return env.match(/^VK_TOKEN=(.+)$/m)?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Каналы, которым доверяем без оглядки на остальные признаки.
 *
 * Список служит прибавкой к рейтингу, а не пропуском: ролик с незнакомого
 * канала тоже проходит, если название точно называет игру, длительность
 * человеческая и в заголовке нет мусорных примет. Иначе три четверти статей
 * остались бы без видео вовсе — снимают эту технику в основном любители.
 */
const TRUSTED = [
  'StopGame', 'StopGame.ru', 'Игромания', 'IGM', 'Kinaman', 'Антон Логвинов', 'Дмитрий Бурдуков',
  'Денис Карамышев', 'iXBT games', 'iXBT Games', 'Navigator', 'Ностальгия по играм', 'Игры Тех Лет',
  'GameSpot', 'IGN', 'Noclip', 'Digital Foundry', 'Eurogamer', 'PC Gamer', 'GamersGate',
  'Канобу', 'DTF', 'Stratege', 'Битый Пиксель', 'Retro Gamer', 'Old-Games.RU', 'ГДЕ ИГРЫ',
];

/**
 * Каналы, которых в энциклопедии быть не должно.
 *
 * Пополняется глазами по отчёту: робот не отличит честный любительский обзор
 * от пересказа, начитанного синтезатором поверх чужих кадров, а человек отличит.
 */
const BLOCKED = [
  // Пересказы, начитанные синтезатором поверх чужих кадров, и каналы-фермы.
  'Vortex Motors', 'Студия Настроения', 'Kindness Glow',
];

/**
 * Имя канала из чужой области — верная примета перезаливщика.
 *
 * Выдача Rutube наполовину состоит из каналов-ферм, которые заливают чужие
 * игровые ролики под именами «Секреты ухода за кожей», «Рецепты вегетарианских
 * закусок», «Женская психология и саморазвитие». Ролик при этом настоящий, но
 * автор у него другой, а подписать его чужим именем — хуже, чем не ставить
 * вовсе. Живой игровой канал так себя не назовёт.
 */
const FOREIGN_CHANNEL = new RegExp(
  [
    'уход за', 'красот', 'бьюти', 'beauty', 'мод(а|ы|ные|ных)', 'стил(ь|я)', 'причёск', 'прическ',
    'волос', 'кож(а|и|е)', 'маникюр', 'макияж', 'примерк', 'обув', 'аксессуар',
    'психолог', 'саморазвит', 'мотивац', 'вдохновля', 'мудрост', 'эзотерик', 'астролог', 'таро',
    'здоровь', 'фитнес', 'диет', 'похуден', 'сна(?![а-я])', 'сон(?![а-я])', 'медитац',
    'рецепт', 'кулинар', 'закус', 'выпечк', 'кофе(?![а-я])', 'питани',
    'декор', 'интерьер', 'ремонт кварт', 'уборк', 'хозяйств', 'садовод', 'ландшафт', 'огород',
    'дач(а|и|е)', 'растени', 'цвето', 'воспитан', 'семейн(ые|ых) (истори|совет|путешеств)',
    'путешеств', 'туриз', 'финанс', 'инвестиц', 'бизнес-', 'заработок', 'лайфхак',
    'организац (рабоч|прост)', 'отношени', 'знаменитост', 'автообзор', 'лекторск',
  ].join('|'),
  'i',
);

/**
 * Имя канала, собранное по шаблону, — третья примета фермы.
 *
 * Перезаливщики берут себе имена из двух-трёх слов по одному образцу:
 * «Игровые Загадки», «Геймеры и Магия», «Игры и Сюжеты», «Обзоры игр: стоит ли
 * играть?», «Полное прохождение игр с комментариями». За ними нет ни автора,
 * ни канала — только чужие ролики, и подписать статью таким именем значит
 * назвать автором не того.
 */
const FARM_CHANNEL = new RegExp(
  [
    '^игровые\\s', '^игры\\s(и|для|в)\\s', '^геймер', '^полное\\s(прохождение|руководство)',
    '^обзоры\\s(игр|и\\s)', '^секреты\\s', '^советы\\s', '^искусство\\s', '^мастерство\\s',
    '^открытие\\s', '^учебник\\s', '^развлекательный\\s', '^выставки\\s', '^танцы\\s',
    '^идеи\\sдля', '^кухня\\s', '^почему\\s', '^университетск',
    'стоит\\sли\\sиграть',
  ].join('|'),
  'i',
);

/**
 * Длинное название канала — четвёртая примета перезаливщика.
 *
 * Каналы-фермы берут себе целые фразы («Как использовать зеркала в интерьере
 * для создания визуального эффекта пространства») и заливают под ними чужие
 * ролики. У живых каналов имя короткое: самое длинное в списке доверенных —
 * тридцать шесть знаков.
 */
const LONG_CHANNEL = 45;

/** Скачивание, взлом и читы: ролик не про игру, а про то, как её обойти. */
const FOR_SALE = /скачать|download|торрент|torrent|crack|кряк|взлом|чит(ы|ов)?(?![а-я])|cheat|промокод|донат|бесплатно/i;

/** Приметы чужой темы прямо в названии. */
const SLOP = new RegExp(
  [
    '#shorts', 'шортс', 'shorts',
    'топ[\\s-]?\\d', '\\d+\\s+(фактов|причин|вещей|секретов|игр)', 'что если', 'а что,? если',
    '\\d+\\s+(самых|лучших|худших|редких|странных|необычных)', 'нейросет', 'сгенерир', 'ии сделал',
    // Дутая подача: такими заголовками подписывают пересказы, а не съёмку.
    'в шоке', 'шокиру', 'не поверите', 'вы не знали', 'никто не ожидал',
    'которую .{0,20}скрывал', 'от нас скрывали', '(?<![а-я])шок(?![а-я])',
    // Реакции, нарезки, мемы.
    'реакци', 'reaction', 'подборка', 'нарезка', 'прикол', 'ржач', 'фейл', 'мем(ы|ов)?(?![а-я])',
    'тикток', 'tiktok', 'coub', 'смешные моменты', 'funny moments',
    // Не про эту игру: моды на другие игры, песни, фанфики.
    'в майнкрафт', 'в minecraft', 'roblox', 'роблокс', 'песня', 'клип', 'cover(?![a-z])', 'кавер',
    // Стримы целиком — слишком длинно и без монтажа.
    'запись стрима', 'стрим полностью', 'full stream', 'vod(?![a-z])',
  ].join('|'),
  'i',
);

/** Разделы площадок, которые точно не про игру. */
const BAD_CATEGORY = /музык|эротик|аниме|сериал|мультфильм/i;

const MIN_SECONDS = 90;
const MAX_SECONDS = 4 * 3600;

/** Пауза между запросами: площадки отвечают 429 на частые обращения. */
const PAUSE_MS = 1100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Без регистра, без «ё» и без хвостов: подписи каналов бывают неряшливые. */
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/ё/g, 'е');
const inList = (list, channel) => {
  const c = norm(channel);
  return list.some((t) => c === norm(t) || c.startsWith(norm(t)));
};

// ── Сопоставление названия с игрой ────────────────────────────────────────

/**
 * Названия игры во всех видах, какие могут встретиться в заголовке ролика.
 *
 * Берём имя, его вариант без прозвища, все альтернативные написания и латиницу
 * из адреса статьи: заголовок вполне может быть «ZIL-130 restoration».
 */
function nameForms(name, altNames, slug) {
  const forms = new Map();
  const add = (s, latin = false) => {
    const t = String(s ?? '').replace(/[«»"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (t.length >= 2 && !forms.has(t)) forms.set(t, latin);
  };
  for (const raw of [name, ...altNames]) {
    add(raw);
    // Прозвище в кавычках или скобках в заголовке ролика обычно опускают.
    add(String(raw).replace(/[«(].*$/, ''));
    // «ГАЗ-АА / ГАЗ-ММ» — два имени одной строкой.
    for (const part of String(raw).split(/\s+\/\s+/)) add(part);
  }
  add(slug.replace(/-/g, ' ').replace(/\b(\d+)$/, ' $1'), true);
  return [...forms].map(([form, latin]) => ({ form, latin }));
}

/**
 * Название в виде выражения для поиска по заголовку.
 *
 * Буквы и цифры разделяем чем угодно: «Metro 2033», «Metro-2033» и «metro2033» — одна
 * игра. А вот следом за числом цифры быть не должно, иначе «Петька 2» найдётся
 * внутри «Петька 20», и в статью попадёт чужая игра.
 */
function formRegex(form) {
  const parts = form.match(/[a-zа-я]+|\d+/gi);
  if (!parts || parts.length === 0) return null;
  const body = parts
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s._\\-–—]*');
  const last = parts[parts.length - 1];
  const tail = /\d/.test(last) ? '(?!\\d)' : '(?![a-zа-я0-9])';
  return new RegExp(`(?<![a-zа-я0-9])${body}${tail}`, 'i');
}

/**
 * Слова темы для коротких имён.
 *
 * «Т-16» или «МТ-ЛБ» сами по себе встречаются где угодно — от ГОСТа до
 * радиолампы. Для таких имён требуем, чтобы в заголовке нашлось ещё и слово
 * про игру: тогда «Т-16 трактор» пройдёт, а «объектив Т-16» нет.
 */
const TOPIC = {
  strategy: 'стратеги|rts|кампани|миссия|юнит|тактик',
  rpg: 'rpg|ролев|квест|партия|прокачк',
  shooter: 'шутер|fps|стрел|оруж',
  action: 'экшен|action|боевик|платформер|файтинг',
  adventure: 'квест|адвенчур|приключен|сюжет',
  simulation: 'симулятор|sim(?![a-z])|полёт|полет|кабин|грузовик',
  racing: 'гонк|заезд|racing|трасс',
  puzzle: 'головоломк|puzzle|уровн',
  online: 'онлайн|online|бой|матч|сервер',
  other: '',
};
/*
 * Слова, по которым видно, что ролик про игру. Обзор и геймплей здесь нарочно:
 * мы ищем именно их. Без такого слова короткое название вроде «Мор» найдёт
 * что угодно, от сериала до сводки Минздрава.
 */
const TOPIC_ANY =
  'игр|game|геймплей|gameplay|обзор|review|прохожден|walkthrough|longplay|летсплей|let.?s ?play|' +
  'стрим|ретро|retro|истори|history|разбор|playthrough|трейлер|trailer|мнение|ревью|прошёл|прошел|играем|играю|ostalgia|ностальги';

const topicRegex = (type) => new RegExp(`${TOPIC[type] || TOPIC_ANY}|${TOPIC_ANY}`, 'i');
const strictTopicRegex = () => new RegExp(TOPIC_ANY, 'i');

/**
 * Насколько имени можно верить одному.
 *
 * `strong` — марка с индексом, такое сочетание больше нигде не встречается.
 *
 * `weak` — «Т-16», «ГАЗ-А» или латиница из адреса статьи: находится где угодно,
 * от ГОСТа до радиолампы, а «rsm 8» нашёл итальянский вагон RSM 8 B. Нужна
 * поддержка любым словом про игру.
 *
 * `bare` — имя одним словом без цифр: «Остин», «Коммунар», «Муравей». Такое
 * слово живёт своей жизнью: поиск принёс песню Земфиры и лекцию о Джейн Остин.
 * Здесь мало общих слов — нужно слово именно про этот род техники.
 */
function formStrength({ form, latin }) {
  const letters = form.match(/[a-zа-я]+/gi) ?? [];
  const digits = form.match(/\d+/g) ?? [];
  if (letters.length <= 1 && digits.length === 0) return 'bare';
  if (latin) return 'weak';
  if (letters.length === 0 || letters.every((l) => l.length <= 2)) return 'weak';
  // «ГАЗ-А»: одна буква в хвосте попадётся и в обычной фразе «залил газ, а потом».
  if (digits.length === 0 && letters[letters.length - 1].length <= 1) return 'weak';
  return 'strong';
}

// ── Сеть ────────────────────────────────────────────────────────────────────

/** Запрос с повтором: площадки иногда отвечают 429 или рвут соединение. */
async function get(url, { json = false, headers = {}, tries = 3 } = {}) {
  let wait = 3000;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.8', ...headers },
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`ответ ${res.status}`);
      if (!res.ok) return null;
      return json ? await res.json() : await res.text();
    } catch (e) {
      if (attempt === tries) throw e;
      await sleep(wait);
      wait *= 2;
    }
  }
  return null;
}

/** «11:42» и «1:02:03» — в секунды. */
function hmsToSeconds(text) {
  const parts = String(text ?? '').trim().split(':').map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p))) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

const digitsOf = (text) => Number(String(text ?? '').replace(/[^\d]/g, '')) || 0;

// ── Площадки ────────────────────────────────────────────────────────────────

/**
 * YouTube отдаёт всю выдачу одним куском JSON внутри страницы поиска.
 *
 * Раньше скрипт брал оттуда только идентификаторы, а потом спрашивал название
 * у oEmbed — по запросу на ролик. Но в том же куске лежат и название, и канал,
 * и длительность, и число просмотров: двадцать запросов превращаются в один,
 * а отсеивать мусор становится чем.
 */
async function searchYoutube(query, limit) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
  const html = await get(url);
  if (!html) return [];
  const raw = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!raw) return [];
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.videoRenderer) found.push(node.videoRenderer);
    for (const key of Object.keys(node)) walk(node[key]);
  };
  walk(data);

  const out = [];
  for (const v of found.slice(0, limit)) {
    const badges = (v.badges ?? []).map((b) => b?.metadataBadgeRenderer?.label ?? '');
    out.push({
      platform: 'youtube',
      id: v.videoId,
      title: v.title?.runs?.[0]?.text ?? v.title?.simpleText ?? '',
      channel: v.ownerText?.runs?.[0]?.text ?? v.longBylineText?.runs?.[0]?.text ?? '',
      seconds: hmsToSeconds(v.lengthText?.simpleText),
      views: digitsOf(v.viewCountText?.simpleText),
      published: v.publishedTimeText?.simpleText ?? '',
      category: '',
      live: badges.some((b) => /live|эфир/i.test(b)) || !v.lengthText,
      poster: null,
    });
  }
  return out.filter((v) => v.id && v.title);
}

/** У Rutube открытый поиск: ключ не нужен, ответ сразу с длительностью и разделом. */
async function searchRutube(query, limit) {
  const url = `https://rutube.ru/api/search/video/?query=${encodeURIComponent(query)}&limit=${limit}`;
  const data = await get(url, { json: true });
  const items = data?.results ?? [];
  return items
    .filter((v) => v?.id && !v.is_deleted && !v.is_hidden)
    .map((v) => ({
      platform: 'rutube',
      id: v.id,
      title: v.title ?? '',
      channel: v.author?.name ?? v.feed_name ?? '',
      seconds: Number(v.duration) || 0,
      views: Number(v.hits) || 0,
      published: (v.publication_ts ?? '').slice(0, 10),
      category: v.category?.name ?? '',
      live: Boolean(v.is_livestream || v.is_on_air),
      adult: Boolean(v.is_adult) || Number(v.pg_rating?.age ?? 0) >= 18,
      poster: v.thumbnail_url ?? null,
    }));
}

/**
 * VK Видео закрыт: и поиск, и карточка ролика требуют токен доступа.
 *
 * Без токена площадка не отвечает ничего — ни выдачи, ни названия по готовому
 * идентификатору, — поэтому выдумывать записи для неё нельзя. Заведите токен
 * сообщества или сервисный ключ приложения и положите его в .env как VK_TOKEN.
 */
async function searchVk(query, limit, token) {
  if (!token) return [];
  const url =
    `https://api.vk.com/method/video.search?q=${encodeURIComponent(query)}` +
    `&count=${limit}&adult=0&sort=2&extended=1&v=5.199&access_token=${token}`;
  const data = await get(url, { json: true });
  if (data?.error) throw new Error(`VK: ${data.error.error_msg}`);
  const response = data?.response ?? {};
  const names = new Map();
  for (const g of response.groups ?? []) names.set(-g.id, g.name);
  for (const p of response.profiles ?? []) names.set(p.id, `${p.first_name} ${p.last_name}`.trim());
  return (response.items ?? [])
    .filter((v) => v?.id && v?.owner_id)
    .map((v) => ({
      platform: 'vk',
      id: `${v.owner_id}_${v.id}`,
      title: v.title ?? '',
      channel: names.get(v.owner_id) ?? '',
      seconds: Number(v.duration) || 0,
      views: Number(v.views) || 0,
      published: v.date ? new Date(v.date * 1000).toISOString().slice(0, 10) : '',
      category: '',
      live: Boolean(v.live),
      poster: (v.image ?? []).slice(-1)[0]?.url ?? null,
    }));
}

const SEARCH = { youtube: searchYoutube, rutube: searchRutube, vk: searchVk };

// ── Проверка одного ролика по идентификатору ───────────────────────────────

async function verifyYoutube(id) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}&format=json`;
  const data = await get(url, { json: true });
  return data ? { platform: 'youtube', id, title: data.title, channel: data.author_name } : null;
}

async function verifyRutube(id) {
  const data = await get(`https://rutube.ru/api/video/${id}/`, { json: true });
  if (!data || data.is_deleted || data.detail) return null;
  return {
    platform: 'rutube',
    id,
    title: data.title,
    channel: data.author?.name ?? '',
    poster: data.thumbnail_url ?? null,
  };
}

async function verifyVk(id, token) {
  if (!token) return null;
  const url = `https://api.vk.com/method/video.get?videos=${encodeURIComponent(
    id,
  )}&extended=1&v=5.199&access_token=${token}`;
  const data = await get(url, { json: true });
  const item = data?.response?.items?.[0];
  if (!item) return null;
  const groups = data.response.groups ?? [];
  const profiles = data.response.profiles ?? [];
  const channel =
    groups.find((g) => -g.id === item.owner_id)?.name ??
    (() => {
      const p = profiles.find((p) => p.id === item.owner_id);
      return p ? `${p.first_name} ${p.last_name}`.trim() : '';
    })();
  return {
    platform: 'vk',
    id,
    title: item.title,
    channel,
    poster: (item.image ?? []).slice(-1)[0]?.url ?? null,
  };
}

/** Разбор ссылки или голого идентификатора: с какой он площадки. */
function parseRef(ref) {
  const s = String(ref).trim();
  let m;
  if ((m = s.match(/rutube\.ru\/(?:video|play\/embed)\/([0-9a-f]{32})/i))) {
    return { platform: 'rutube', id: m[1].toLowerCase() };
  }
  if ((m = s.match(/video_ext\.php\?oid=(-?\d+)&id=(\d+)/i))) {
    return { platform: 'vk', id: `${m[1]}_${m[2]}` };
  }
  if ((m = s.match(/(?:vk\.com|vkvideo\.ru)\/(?:.*?)video(-?\d+_\d+)/i))) {
    return { platform: 'vk', id: m[1] };
  }
  if ((m = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/i))) {
    return { platform: 'youtube', id: m[1] };
  }
  if (/^[0-9a-f]{32}$/i.test(s)) return { platform: 'rutube', id: s.toLowerCase() };
  if (/^-?\d+_\d+$/.test(s)) return { platform: 'vk', id: s };
  if (/^[\w-]{11}$/.test(s)) return { platform: 'youtube', id: s };
  return null;
}

// ── Отбор ───────────────────────────────────────────────────────────────────

/**
 * Годится ли ролик для статьи. Возвращает причину отказа или прибавку к месту
 * в очереди: чем выше, тем раньше ролик попадёт в статью.
 */
function judge(video, ctx) {
  if (inList(BLOCKED, video.channel)) return { ok: false, why: 'канал отклонён' };
  if (FOREIGN_CHANNEL.test(String(video.channel))) return { ok: false, why: 'канал не про игры' };
  if (FARM_CHANNEL.test(String(video.channel).trim())) return { ok: false, why: 'канал-ферма' };
  if (String(video.channel).length > LONG_CHANNEL) return { ok: false, why: 'канал-перезаливщик' };
  if (video.live) return { ok: false, why: 'прямой эфир' };
  if (video.adult) return { ok: false, why: 'возрастное ограничение' };
  if (!video.seconds || video.seconds < MIN_SECONDS) return { ok: false, why: 'короче полутора минут' };
  if (video.seconds > MAX_SECONDS) return { ok: false, why: 'длиннее трёх часов' };
  /*
   * Приметы ищем и в названии канала: «Масштабные модели» в заголовке роликов
   * пишут не всегда, а в имени канала — почти всегда.
   */
  if (SLOP.test(`${video.title} ${video.channel}`)) {
    return { ok: false, why: 'мусорная примета в названии' };
  }
  if (video.category && BAD_CATEGORY.test(video.category)) return { ok: false, why: 'чужой раздел' };

  const hit = ctx.forms.find((f) => f.re.test(video.title));
  if (!hit) return { ok: false, why: 'в названии нет марки с индексом' };
  if (hit.strength === 'weak' && !ctx.topic.test(video.title)) {
    return { ok: false, why: 'короткое имя без слова про игру' };
  }
  if (hit.strength === 'bare' && !ctx.strictTopic.test(video.title)) {
    return { ok: false, why: 'имя одним словом без слова про род техники' };
  }

  let score = 0;
  if (inList(TRUSTED, video.channel)) score += 60;
  score += Math.log10(video.views + 1) * 12;
  if (video.seconds >= 180 && video.seconds <= 2400) score += 12;
  if (video.title.search(hit.re) <= 25) score += 10;
  // Обзор или ретроспектива — то, что нужно статье; геймплей и прохождение чуть ниже.
  if (/обзор|review|ретро|retro|истори|history|разбор|ретроспектив/i.test(video.title)) score += 18;
  else if (/геймплей|gameplay|прохожден|walkthrough|longplay|летсплей|let.?s ?play/i.test(video.title)) score += 8;
  if (FOR_SALE.test(video.title)) score -= 60;
  // Заголовок капсом с восклицаниями — почти всегда перекупщик или пересказ.
  if (/[А-ЯA-Z]{8,}/.test(video.title) && /[!?]/.test(video.title)) score -= 25;
  // Россыпь значков в заголовке — оттуда же.
  if ((video.title.match(/\p{Extended_Pictographic}/gu) ?? []).length >= 2) score -= 20;
  return { ok: true, score, matched: hit.form };
}

/**
 * Что взять из отобранного.
 *
 * Два ролика с одного канала подряд — уже перебор, а если всё найденное лежит
 * на одной площадке, последнее место отдаём другой: у части читателей YouTube
 * не открывается, и статья не должна оставаться для них без видео.
 */
function pick(candidates, take) {
  const sorted = [...candidates].sort((a, b) => b.judged.score - a.judged.score);
  const chosen = [];
  const perChannel = new Map();
  /*
   * Один и тот же ролик часто лежит на двух площадках: оригинал на YouTube и
   * перезалив на Rutube. Названия у них совпадают, и без этой проверки статья
   * получала одно и то же видео дважды. Сравниваем по началу названия: хвосты
   * перезаливщики любят дописывать.
   */
  const titleKey = (t) => norm(t).replace(/[^\p{L}\p{N}]/gu, '').slice(0, 40);
  const seenTitles = new Set();
  for (const c of sorted) {
    if (chosen.length >= take) break;
    const used = perChannel.get(norm(c.channel)) ?? 0;
    if (c.channel && used >= 2) continue;
    const key = titleKey(c.title);
    if (key.length >= 12 && seenTitles.has(key)) continue;
    seenTitles.add(key);
    chosen.push(c);
    perChannel.set(norm(c.channel), used + 1);
  }
  if (take >= 2 && chosen.length >= 2) {
    const have = new Set(chosen.map((c) => c.platform));
    if (have.size === 1) {
      const other = sorted.find((c) => !have.has(c.platform) && !chosen.includes(c));
      if (other) chosen[chosen.length - 1] = other;
    }
  }
  return chosen;
}

// ── Статьи ──────────────────────────────────────────────────────────────────

const QUOTE = String.fromCharCode(34);
const BACKSLASH = String.fromCharCode(92);

/**
 * Экранирование для двойных кавычек YAML.
 *
 * Перенос строки в названии тоже надо убрать: заголовки вида
 * «VID - 20251225.mp4.\nСоветский автопром» попадаются, а перенос внутри
 * строки в кавычках разбирается уже не как строка — и frontmatter ломается.
 */
const escape = (s) =>
  String(s)
    .replace(/\s+/g, ' ')
    .trim()
    .split(BACKSLASH)
    .join(BACKSLASH + BACKSLASH)
    .split(QUOTE)
    .join(BACKSLASH + QUOTE);

const articleFile = (slug) => path.join(GAMES, slug, 'index.md');

/** Машины из содержимого: имя, альтернативные имена, тип и уже вписанные ролики. */
function readGame(slug) {
  const file = articleFile(slug);
  if (!existsSync(file)) return null;
  // Читаем синхронно: разбор четырёх сотен статей короче, чем очередь промисов.
  const text = readFileSync(file, 'utf8');
  const name = (text.match(/^name:\s*(.+)$/m)?.[1] ?? slug).trim().replace(/^["']|["']$/g, '');
  // altNames бывает и строкой [a, b], и списком строк «  - "a"».
  const altRaw = text.match(/^altNames:\s*\[(.*)\]\s*$/m)?.[1];
  const altNames = altRaw !== undefined
    ? altRaw.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    : [...(text.match(/^altNames:\s*\n((?:\s+- .*\n)+)/m)?.[1] ?? '').matchAll(/^\s+- (.+)$/gm)].map((m) =>
        m[1].trim().replace(/^["']|["']$/g, ''),
      );
  const type = text.match(/^type:\s*(\w+)/m)?.[1] ?? 'other';
  const have = [];
  for (const m of text.matchAll(/- kind: (youtube|rutube|vk)\r?\n(?:[ \t]+.*\r?\n)*?[ \t]+id: "([^"]+)"/g)) {
    have.push({ platform: m[1], id: m[2] });
  }
  return { slug, name, altNames, type, have, file };
}

/** Дописывает проверенные ролики в галерею игры. Возвращает, сколько вписал. */
async function addVideos(slug, picks) {
  const file = articleFile(slug);
  if (!existsSync(file)) {
    console.log(`Нет такой игры: ${slug}`);
    return 0;
  }
  const text = await readFile(file, 'utf8');
  const checkedAt = new Date().toISOString().slice(0, 10);
  const blocks = [];
  for (const v of picks) {
    if (text.includes(`id: ${QUOTE}${v.id}${QUOTE}`)) continue;
    const lines = [
      `  - kind: ${v.platform}`,
      `    id: ${QUOTE}${v.id}${QUOTE}`,
      `    title: ${QUOTE}${escape(v.title)}${QUOTE}`,
    ];
    if (v.channel) lines.push(`    channel: ${QUOTE}${escape(v.channel)}${QUOTE}`);
    // Превью есть только у российских площадок: YouTube проигрыватель берёт своё сам.
    if (v.poster && v.platform !== 'youtube') lines.push(`    poster: ${QUOTE}${v.poster}${QUOTE}`);
    lines.push(`    checkedAt: ${QUOTE}${checkedAt}${QUOTE}`, '');
    blocks.push(lines.join('\n'));
  }
  if (blocks.length === 0) return 0;
  await writeFile(file, insertIntoGallery(text, blocks), 'utf8');
  return blocks.length;
}

/**
 * Вставляет готовые блоки в галерею статьи.
 *
 * Работаем строго внутри frontmatter. Галерея — список до следующего ключа
 * верхнего уровня, но у полусотни статей она стоит последней, и поиск
 * «следующего ключа» по всему файлу уводил конец списка в самый низ страницы:
 * ролики оказывались в тексте статьи, а не в данных.
 */
function insertIntoGallery(text, blocks) {
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) return text;
  const [whole, head, tail] = [m[0], m[1], m[3]];
  let body = m[2];
  const rest = text.slice(whole.length);
  const insert = blocks.join('');

  // Пустая галерея записана как inline-список: дописывать в неё пункты нельзя,
  // сначала превращаем её в обычный ключ.
  if (/^gallery:s*[]s*$/m.test(body)) body = body.replace(/^gallery:s*[]s*$/m, 'gallery:');

  if (!/^gallery:/m.test(body)) {
    return head + body.replace(/^status:/m, `gallery:\n${insert}status:`) + tail + rest;
  }

  const start = body.search(/^gallery:/m);
  // Цифры в классе обязательны: без них ключ `model3d:` не считался ключом
  // верхнего уровня, и ролики уезжали внутрь блока модели, ломая YAML.
  const endRel = body.slice(start + 1).search(/\n(?=[A-Za-z0-9_-]+:)/);
  if (endRel === -1) {
    // Галерея — последний ключ: дописываем в конец, без пустой строки перед «---».
    return head + body + '\n' + insert.replace(/\n+$/, '') + tail + rest;
  }
  const end = start + 1 + endRel + 1;
  return head + body.slice(0, end) + insert + body.slice(end) + tail + rest;
}

/** Убирает ролик из статьи по идентификатору. */
async function dropVideos(slug, ids) {
  const file = articleFile(slug);
  let text = await readFile(file, 'utf8');
  let removed = 0;
  for (const ref of ids) {
    const id = parseRef(ref)?.id ?? ref;
    const block = new RegExp(
      `^[ \\t]*- kind: (?:youtube|rutube|vk)\\r?\\n(?:[ \\t]{4,}.*\\r?\\n)*?[ \\t]{4,}id: ${QUOTE}${id.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      )}${QUOTE}\\r?\\n(?:[ \\t]{4,}.*\\r?\\n)*`,
      'm',
    );
    const before = text;
    text = text.replace(block, '');
    if (text !== before) removed += 1;
    else console.log(`${id}: в статье не нашёл`);
  }
  if (removed) await writeFile(file, text, 'utf8');
  return removed;
}

// ── Лист для просмотра глазами ──────────────────────────────────────────────

const thumb = (v) =>
  v.platform === 'youtube' ? `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` : (v.poster ?? '');

const watchUrl = (v) =>
  v.platform === 'rutube'
    ? `https://rutube.ru/video/${v.id}/`
    : v.platform === 'vk'
      ? `https://vkvideo.ru/video${v.id}`
      : `https://www.youtube.com/watch?v=${v.id}`;

const htmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Страница со всем отобранным: превью, канал, длительность.
 *
 * Отклонённое накапливается прямо на странице и копируется одной кнопкой —
 * список идентификаторов потом скармливается ключу --skip. Сервер для этого
 * не нужен: файл открывается из проводника.
 */
async function buildSheet(reportPath) {
  const rows = (await readFile(path.join(root, reportPath), 'utf8'))
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .filter((r) => (r.picked ?? []).length > 0);
  const total = rows.reduce((n, r) => n + r.picked.length, 0);

  const cards = rows
    .map((r) => {
      const items = r.picked
        .map(
          (v) => `      <figure class="v" data-id="${htmlEscape(v.id)}">
        <a href="${htmlEscape(watchUrl(v))}" target="_blank" rel="noopener"><img loading="lazy" src="${htmlEscape(thumb(v))}" alt=""></a>
        <figcaption><b>${htmlEscape(v.title)}</b><br>${htmlEscape(v.channel)} · ${PLATFORM_LABEL[v.platform]} · ${fmtTime(v.seconds)} · ${v.views.toLocaleString('ru')} просм.</figcaption>
        <button type="button">✗ Мимо</button>
      </figure>`,
        )
        .join('\n');
      return `    <section><h2>${htmlEscape(r.name)} <span class="s">${htmlEscape(r.slug)} · было ${r.had}</span></h2>
      <div class="row">\n${items}\n      </div>
    </section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="ru"><meta charset="utf-8"><title>Ролики к статьям</title>
<style>
 body{font:15px/1.45 system-ui,sans-serif;margin:0;padding:1rem 1.5rem 7rem;background:#14140f;color:#eee}
 h1{font-size:1.3rem} h2{font-size:1rem;margin:1.4rem 0 .5rem;font-weight:600}
 .s{color:#998;font-weight:400}
 .row{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.9rem}
 .v{margin:0;background:#22221c;border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
 .v img{width:100%;aspect-ratio:16/9;object-fit:cover;background:#333;display:block}
 .v figcaption{padding:.5rem .6rem;font-size:.8rem;flex:1}
 .v b{font-weight:600} .v button{border:0;padding:.45rem;background:#3a3a31;color:#eee;cursor:pointer}
 .v.out{opacity:.35} .v.out button{background:#7a3030}
 footer{position:fixed;left:0;right:0;bottom:0;background:#0d0d0a;padding:.7rem 1.5rem;border-top:1px solid #333}
 textarea{width:100%;height:3.2rem;background:#14140f;color:#eee;border:1px solid #333;font:12px monospace}
</style>
<h1>Отобранные ролики · ${total} к ${rows.length} статьям</h1>
<p class="s">Нажмите «Мимо» у неподходящего. Внизу соберётся список — скопируйте его в файл и передайте ключом <code>--skip</code>.</p>
${cards}
<footer><textarea id="out" readonly placeholder="Отклонённых пока нет"></textarea></footer>
<script>
document.addEventListener('click', (e) => {
  const b = e.target.closest('.v button'); if (!b) return;
  b.closest('.v').classList.toggle('out');
  document.getElementById('out').value =
    [...document.querySelectorAll('.v.out')].map((v) => v.dataset.id).join('\\n');
});
</script>
</html>`;
  const out = path.join(root, reportPath.replace(/\.jsonl$/, '') + '.html');
  await writeFile(out, html, 'utf8');
  console.log(`Лист: ${out} — ${total} роликов к ${rows.length} статьям`);
}

// ── Разбор аргументов ───────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { add: [], auto: [], drop: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const name = argv[i].slice(2);
    if (name === 'add' || name === 'drop' || name === 'auto') {
      for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j += 1) {
        args[name].push(argv[j]);
        i = j;
      }
      continue;
    }
    const next = argv[i + 1];
    args[name] = !next || next.startsWith('--') ? true : ((i += 1), next);
  }
  return args;
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Всё, что нужно, чтобы судить ролики для одной игры. */
function buildCtx(game, slug) {
  const forms = nameForms(game.name, game.altNames, slug)
    .map((f) => ({ form: f.form, re: formRegex(f.form), strength: formStrength(f) }))
    .filter((f) => f.re);
  return {
    forms,
    topic: topicRegex(game.type),
    strictTopic: strictTopicRegex(game.type),
  };
}

// ── Работа ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = await vkToken();
  const sources =
    args.source === true || !args.source
      ? PLATFORMS.filter((p) => p !== 'vk' || token)
      : String(args.source).split(',').filter((p) => PLATFORMS.includes(p));

  if (args.drop.length > 0) {
    if (!args.game) {
      console.error('Нужен --game: из чьей статьи убирать.');
      process.exitCode = 1;
      return;
    }
    const n = await dropVideos(String(args.game), args.drop);
    console.log(`Убрано роликов: ${n}`);
    return;
  }

  if (args.add.length > 0) {
    if (!args.game) {
      console.error('Нужен --game: в чью статью вписывать.');
      process.exitCode = 1;
      return;
    }
    const infos = [];
    for (const ref of args.add) {
      const parsed = parseRef(ref);
      if (!parsed) {
        console.log(`${ref}: не понял, что это за ссылка`);
        continue;
      }
      const info =
        parsed.platform === 'rutube'
          ? await verifyRutube(parsed.id)
          : parsed.platform === 'vk'
            ? await verifyVk(parsed.id, token)
            : await verifyYoutube(parsed.id);
      if (!info) {
        console.log(
          parsed.platform === 'vk' && !token
            ? `${parsed.id}: для VK нужен VK_TOKEN в .env — не вписываю`
            : `${parsed.id}: ролик не открывается — не вписываю`,
        );
        continue;
      }
      console.log(`${info.id}: ${info.title} — ${info.channel} (${PLATFORM_LABEL[info.platform]})`);
      infos.push(info);
    }
    const n = await addVideos(String(args.game), infos);
    console.log(`\nВписано роликов: ${n} → ${args.game}`);
    return;
  }

  /*
   * Перебрать четыре сотни статей — полчаса запросов, и повторять их ради
   * того, чтобы что-то поправить в отборе, незачем. Поэтому проход пишет
   * найденное в отчёт, а вписывание в статьи — отдельный шаг по этому отчёту.
   */
  if (args.apply) {
    const file = path.join(root, String(args.apply));
    const rows = (await readFile(file, 'utf8'))
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
    // Список отклонённых глазами: по одному идентификатору в строке.
    const skip = new Set();
    if (args.skip) {
      for (const line of (await readFile(path.join(root, String(args.skip)), 'utf8')).split('\n')) {
        const id = line.trim().split(/\s+/)[0];
        if (id && !id.startsWith('#')) skip.add(id);
      }
    }
    let added = 0;
    let touched = 0;
    for (const row of rows) {
      const picks = (row.picked ?? []).filter((p) => !skip.has(p.id));
      if (picks.length === 0) continue;
      const n = await addVideos(row.slug, picks);
      added += n;
      if (n > 0) touched += 1;
    }
    console.log(`Статей затронуто: ${touched}, роликов вписано: ${added}, пропущено по списку: ${skip.size}`);
    return;
  }

  if (args.sheet) {
    await buildSheet(String(args.sheet));
    return;
  }

  /*
   * Вычистить отклонённое после того, как ролики уже вписаны.
   *
   * Лист отбора собирает внизу список идентификаторов; --skip годится, только
   * пока ничего не вписано, а глазами лист обычно смотрят позже. Здесь не
   * нужно знать, в какой статье лежит ролик: проходим по всем и убираем.
   */
  if (args.purge) {
    const ids = (await readFile(path.join(root, String(args.purge)), 'utf8'))
      .split('\n')
      .map((l) => l.trim().split(/\s+/)[0])
      .filter((id) => id && !id.startsWith('#'));
    let removed = 0;
    for (const slug of readdirSync(GAMES)) {
      const file = articleFile(slug);
      if (!existsSync(file)) continue;
      const text = readFileSync(file, 'utf8');
      const here = ids.filter((id) => text.includes(`id: ${QUOTE}${id}${QUOTE}`));
      if (here.length === 0) continue;
      removed += await dropVideos(slug, here);
    }
    console.log(`Убрано роликов: ${removed} из ${ids.length} указанных.`);
    return;
  }

  /*
   * Пересборка отбора по готовому отчёту.
   *
   * Правила отсева уточняются по тому, что вылезло в прошлый раз, и каждый
   * раз заново опрашивать площадки было бы и долго, и невежливо. В отчёте
   * лежат не только взятые ролики, но и запас — этого хватает, чтобы
   * пересудить всё заново и подобрать замену прямо здесь.
   */
  if (args.repick) {
    const file = path.join(root, String(args.repick));
    const rows = (await readFile(file, 'utf8'))
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
    const take = Number(args.take ?? 3);
    const globalUse = new Map();
    const out = [];
    let kept = 0;
    let dropped = 0;
    for (const row of rows) {
      const game = readGame(row.slug);
      if (!game) continue;
      const ctx = buildCtx(game, row.slug);
      const pool = [];
      for (const v of [...(row.picked ?? []), ...(row.spare ?? [])]) {
        const key = `${v.platform}:${v.id}`;
        if ((globalUse.get(key) ?? 0) >= 2) continue;
        const judged = judge(v, ctx);
        if (judged.ok) pool.push({ ...v, judged });
        else dropped += 1;
      }
      const picked = pick(pool, take - game.have.length);
      for (const p of picked) {
        const key = `${p.platform}:${p.id}`;
        globalUse.set(key, (globalUse.get(key) ?? 0) + 1);
      }
      kept += picked.length;
      out.push({
        ...row,
        had: game.have.length,
        picked,
        spare: pool.filter((c) => !picked.includes(c)).slice(0, 8),
      });
    }
    const dest = file.replace(/\.jsonl$/, '') + '-2.jsonl';
    await writeFile(dest, out.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
    console.log(`Отсеяно по новым правилам: ${dropped}. Осталось к вписыванию: ${kept}. → ${dest}`);
    return;
  }

  if (args.query) {
    const limit = Number(args.limit ?? 15);
    for (const source of sources) {
      console.log(`\n── ${PLATFORM_LABEL[source]} ──`);
      const found = await SEARCH[source](String(args.query), limit, token);
      for (const v of found) {
        const mark = inList(TRUSTED, v.channel) ? ' ✓' : '';
        console.log(
          `${v.id}  ${fmtTime(v.seconds).padStart(7)}  ${String(v.views).padStart(9)}  ${v.title} — ${v.channel}${mark}`,
        );
      }
      await sleep(PAUSE_MS);
    }
    return;
  }

  if (args.auto.length === 0) {
    console.error('Нужен --auto <игры|all>, --query "что искать" или --game + --add.');
    process.exitCode = 1;
    return;
  }

  const take = Number(args.take ?? 3);
  const write = args.write === true;
  const onlyMissing = args.missing === true;
  const slugs =
    args.auto.length === 1 && args.auto[0] === 'all'
      ? readdirSync(GAMES).filter((d) => existsSync(articleFile(d)))
      : args.auto;

  const reportBase = args.report === true ? 'tmp/video/report' : args.report;
  const jsonl = reportBase ? path.join(root, `${reportBase}.jsonl`) : null;
  if (jsonl) await mkdir(path.dirname(jsonl), { recursive: true });
  // Продолжение прерванного прохода: заново перебирать сотни игр незачем.
  const done = new Set();
  if (jsonl && args.resume === true && existsSync(jsonl)) {
    for (const line of (await readFile(jsonl, 'utf8')).split('\n')) {
      if (line.trim()) done.add(JSON.parse(line).slug);
    }
    console.log(`Уже разобрано раньше: ${done.size}`);
  }

  const reasons = new Map();
  /** Сколько статей уже забрали этот ролик: одна нарезка не должна стоять везде. */
  const globalUse = new Map();
  let added = 0;
  let touched = 0;
  let index = 0;

  for (const slug of slugs) {
    index += 1;
    if (done.has(slug)) continue;
    const game = readGame(slug);
    if (!game) {
      console.log(`${slug}: нет такой игры`);
      continue;
    }
    const need = take - game.have.length;
    if (need <= 0 || (onlyMissing && game.have.length > 0)) continue;

    const ctx = buildCtx(game, slug);
    const short = game.name.replace(/[«(].*$/, '').replace(/[«»"]/g, '').trim();
    const queries = [`${short} обзор`, `${short} геймплей`];

    const seen = new Set(game.have.map((h) => `${h.platform}:${h.id}`));
    const candidates = [];

    /*
     * Площадки спрашиваем разом: хосты разные, друг другу они не мешают, а
     * перебор четырёх сотен статей по очереди растянулся бы на три часа.
     */
    const sweep = async (query) => {
      const answers = await Promise.all(
        sources.map(async (source) => {
          try {
            return await SEARCH[source](query, 20, token);
          } catch (e) {
            console.log(`  ${slug}: ${PLATFORM_LABEL[source]} — ${e.message}`);
            return [];
          }
        }),
      );
      await sleep(PAUSE_MS);
      for (const found of answers) {
        for (const v of found) {
          const key = `${v.platform}:${v.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          // Одна и та же сборная нарезка иначе разошлась бы по десятку статей.
          if ((globalUse.get(key) ?? 0) >= 2) continue;
          const judged = judge(v, ctx);
          if (!judged.ok) {
            reasons.set(judged.why, (reasons.get(judged.why) ?? 0) + 1);
            continue;
          }
          candidates.push({ ...v, judged });
        }
      }
    };

    await sweep(queries[0]);
    // Второй запрос — только если первого не хватило: лишние обращения к
    // площадкам не нужны ни им, ни нам.
    if (candidates.length < need * 3) await sweep(queries[1]);
    // Редкая игра в обычную выдачу не попадает: добираем узким запросом.
    if (candidates.length === 0) await sweep(`${short} игра`);

    const picked = pick(candidates, need);
    for (const p of picked) {
      const key = `${p.platform}:${p.id}`;
      globalUse.set(key, (globalUse.get(key) ?? 0) + 1);
    }
    console.log(
      `[${index}/${slugs.length}] ${slug} (${game.name}): было ${game.have.length}, нашёл ${candidates.length}, беру ${picked.length}`,
    );
    for (const p of picked) {
      console.log(
        `    ${PLATFORM_LABEL[p.platform].padEnd(8)} ${fmtTime(p.seconds).padStart(7)} ${p.title} — ${p.channel}`,
      );
    }
    if (write && picked.length > 0) {
      const n = await addVideos(slug, picked);
      added += n;
      if (n > 0) touched += 1;
    }
    if (jsonl) {
      /*
       * В отчёт кладём и запас — восемь лучших кандидатов сверх взятых.
       * Если потом захочется заменить неудачный ролик, замена уже найдена,
       * и гонять запросы к площадкам заново не придётся.
       */
      const spare = candidates
        .filter((c) => !picked.includes(c))
        .sort((a, b) => b.judged.score - a.judged.score)
        .slice(0, 8);
      const row = { slug, name: game.name, had: game.have.length, picked, spare, found: candidates.length };
      await writeFile(jsonl, `${JSON.stringify(row)}\n`, { flag: 'a', encoding: 'utf8' });
    }
  }

  console.log(`\nСтатей затронуто: ${touched}, роликов вписано: ${added}${write ? '' : ' (пробный проход, --write не задан)'}`);
  const top = [...reasons.entries()].sort((a, b) => b[1] - a[1]);
  if (top.length > 0) {
    console.log('\nОтсеяно:');
    for (const [why, n] of top) console.log(`  ${String(n).padStart(5)}  ${why}`);
  }
}

await main();
