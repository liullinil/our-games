#!/usr/bin/env node
/**
 * Изображения со страниц Википедии для игр, которых нет в Steam.
 *
 * У статей о старых играх в русской и английской Википедии лежат скриншоты и
 * обложки, загруженные по правилам добросовестного использования. Мы берём их
 * по тем же основаниям: в информационных целях, в уменьшенном размере, с
 * указанием правообладателя и ссылкой на страницу файла.
 *
 *   node scripts/fetch-wiki.mjs --game gag --title "ГЭГ: Отвязное приключение"
 *   node scripts/fetch-wiki.mjs --game chasm --title "Chasm: The Rift" --lang en
 *   node scripts/fetch-wiki.mjs --auto            все игры без изображений: ищем статью по имени
 *   node scripts/fetch-wiki.mjs --auto --dry      только показать, что нашлось
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { titleRank, fieldList } from './lib/names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = path.join(root, 'src', 'content', 'games');
const UA = 'igrostroy/0.1 (https://github.com/liullinil/our-games)';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const LIMIT = Number(opt('limit', 4));
const DRY = flag('dry');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(lang, params) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Википедия (${lang}) ответила ${res.status}`);
  return res.json();
}

/**
 * Категории статьи. По ним видно, о чём она на самом деле.
 */
async function categories(lang, titles) {
  const data = await api(lang, {
    action: 'query',
    titles: titles.join('|'),
    prop: 'categories',
    cllimit: 'max',
    clshow: '!hidden',
  });
  const out = new Map();
  for (const page of data.query?.pages ?? []) {
    out.set(page.title, (page.categories ?? []).map((c) => c.title).join(' | '));
  }
  return out;
}

/** Приметы статьи о видеоигре в названиях категорий. */
const GAME_CATEGORY = /компьютерные игры|видеоигр|video games|игры для |компьютерных игр/i;

/**
 * Поиск статьи об игре по названию.
 *
 * Одного поиска мало: по запросу «Перестройка» первой идёт статья о политике
 * позднего СССР, по «Ну, погоди!» — о мультфильме, по «Морскому бою» — о
 * настольной игре. Все три отдают снимки, которые не имеют к игре отношения,
 * и без проверки они попадали в статью. Поэтому смотрим категории каждого
 * кандидата и берём первого, у которого они говорят о видеоигре.
 */
async function findTitle(lang, name, altNames = []) {
  const data = await api(lang, {
    action: 'query',
    list: 'search',
    srsearch: lang === 'ru' ? `${name} компьютерная игра` : `${name} video game`,
    srlimit: 6,
    srnamespace: 0,
  });
  const hits = (data.query?.search ?? []).map((h) => h.title);
  if (hits.length === 0) return null;
  const cats = await categories(lang, hits.slice(0, 6));
  const ours = [name, ...altNames];
  /*
   * Категорий мало: «Чёрная книга» — такая же компьютерная игра, как наш
   * «Чёрный ворон», и без сверки названий её кадры приезжали к нему. А ещё
   * выдача любит ставить сиквел выше оригинала, поэтому ровное совпадение
   * названия обходит просто похожее.
   */
  const ranked = hits
    .filter((title) => GAME_CATEGORY.test(cats.get(title) ?? '') && sameNumbers(name, title))
    .map((title) => ({ title, rank: titleRank(ours, title) }))
    .filter((c) => c.rank > 0)
    .sort((a, b) => b.rank - a.rank);
  return ranked[0]?.title ?? null;
}

/**
 * Совпадают ли числа в названиях.
 *
 * По запросу «Периметр 2: Новая Земля» поиск уверенно отдаёт статью
 * «Периметр (игра)» — про первую часть. Категории у неё правильные, и без этой
 * проверки в статью о второй части попадали кадры из первой. Номер части —
 * самое надёжное, что отличает продолжение от оригинала.
 */
function sameNumbers(name, title) {
  const digits = (s) => (String(s).match(/\d+/g) ?? []).filter((d) => d.length <= 2);
  const want = digits(name);
  const got = digits(title.replace(/\s*\(.*\)\s*$/, ''));
  if (want.length === 0) return got.length === 0;
  return want.every((d) => got.includes(d));
}

/** Файлы на странице с адресами, лицензией и описанием. */
async function pageImages(lang, title) {
  const data = await api(lang, {
    action: 'query',
    generator: 'images',
    titles: title,
    gimlimit: 50,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: 1600,
  });
  return (data.query?.pages ?? []).filter((p) => p.imageinfo?.[0]);
}

/*
 * Свободные лицензии, которые понимает схема (src/content.config.ts). Если
 * Викимедиа сообщает одну из них, подписываем картинку автором снимка, а не
 * разработчиком игры: CC BY и CC BY-SA прямо требуют указания автора.
 */
const FREE = new Set([
  'CC0',
  'PD',
  'CC BY 2.0',
  'CC BY 2.5',
  'CC BY 3.0',
  'CC BY 4.0',
  'CC BY-SA 2.0',
  'CC BY-SA 2.5',
  'CC BY-SA 3.0',
  'CC BY-SA 4.0',
]);

/** Мусорные файлы: логотипы, значки, флаги, иконки википроектов. */
const JUNK = /логотип|logo|icon|flag|wiki|symbol|commons|ambox|question|crystal|nuvola|emblem|button|star|arrow|edit|padlock|disambig|stub|portal|\.svg$|\.gif$/i;

/**
 * Портреты людей на странице игры — не иллюстрация к ней.
 *
 * В статье о «Тетрисе» рядом с кадрами лежат фотографии Хэнка и Майи Роджерс,
 * и по размеру они даже крупнее. Для статьи об игре они не годятся: у нас
 * иллюстрируется игра, а не её история в лицах.
 */
const PEOPLE = /face|portrait|crop|headshot|\b(rogers|pajitnov|пажитнов)\b|speaking|interview|gdc|conference|award/i;

/**
 * Что это за изображение и стоит ли его брать.
 *
 * Возвращает основание («Скриншот» или «Обложка») либо null, если по описанию
 * и имени файла непонятно, имеет ли картинка отношение к игре. Брать наугад
 * нельзя: на странице попадаются фотографии разработчиков, коробки настольных
 * игр и посторонние схемы.
 */
function classify(file) {
  const meta = file.imageinfo[0].extmetadata ?? {};
  const strip = (v) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const desc = `${strip(meta.ImageDescription?.value)} ${file.title}`.toLowerCase();
  if (PEOPLE.test(desc)) return null;
  /*
   * Категории Википедии надёжнее описания: их проставляют по смыслу файла,
   * а описание автор пишет как придётся — у «Диверсанта» там стоит просто
   * «Игра Диверсант», зато категория честно говорит «Video game screenshots».
   */
  const cats = strip(meta.Categories?.value).toLowerCase();
  const cover = /cover|box|обложк|коробк|постер|poster|title screen|титул|заставк|splash/.test(desc);
  const shot = /screenshot|скриншот|снимок экрана|gameplay|игровой процесс|кадр|уровень|level/.test(desc);
  if (shot) return 'Скриншот';
  if (cover) return 'Обложка';
  if (/screenshot|скриншот/.test(cats)) return 'Скриншот';
  if (/cover|обложк|box art/.test(cats)) return 'Обложка';
  /*
   * Ни одной приметы. Такой файл берём, только если он единственный на
   * странице и его имя повторяет название статьи: в статьях о старых играх
   * часто лежит один-единственный кадр без всякого описания.
   */
  return null;
}

function split(text) {
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/);
  if (!m) throw new Error('нет frontmatter');
  return { head: m[1], fm: m[2], tail: m[3], body: text.slice(m[0].length) };
}
const field = (fm, name) => fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? null;
const unquote = (s) => (s ? s.replace(/^["']|["']$/g, '') : s);
const QUOTE = String.fromCharCode(34);
const yamlStr = (s) => QUOTE + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim() + QUOTE;

function patchFrontmatter(fm, { poster, shots }) {
  let out = fm.replace(/^poster:.*\r?\n/m, '');
  const blocks = shots
    .map(
      (s) =>
        [
          `  - kind: image`,
          `    src: ./shots/${s.file}`,
          `    caption: ${yamlStr(s.caption)}`,
          `    author: ${yamlStr(s.author)}`,
          `    license: ${yamlStr(s.license)}`,
          ...(s.licenseUrl ? [`    licenseUrl: ${yamlStr(s.licenseUrl)}`] : []),
          `    sourceUrl: ${yamlStr(s.sourceUrl)}`,
        ].join('\n') + '\n',
    )
    .join('');
  const posterLine = poster ? `poster: ./shots/${poster}\n` : '';
  /*
   * Ищем строку `gallery:` целиком — не важно, `gallery: []` это или голое
   * `gallery:` перед уже существующими роликами. Раньше эти два случая
   * разбирались отдельными регулярками, а третий (что угодно ещё на той же
   * строке — например, случайно оставшийся пробел) утекал в else-ветку,
   * которая вставляла ВТОРОЙ ключ `gallery` перед `summary:` вместо того,
   * чтобы дописать картинки в уже существующий список. YAML с двумя `gallery`
   * не разбирается, и сборка падает на каждом таком файле.
   * Теперь заменяем саму строку `gallery: ...` на `gallery:` плюс новые
   * блоки-изображения первым пунктом; всё, что шло ПОСЛЕ этой строки
   * (например, уже существующие ролики), остаётся нетронутым.
   */
  const galleryKeyRe = /^gallery:[^\n]*\r?\n/m;
  if (galleryKeyRe.test(out)) {
    out = out.replace(galleryKeyRe, `${posterLine}gallery:\n${blocks}`);
  } else {
    out = out.replace(/^summary:/m, `${posterLine}gallery:\n${blocks}summary:`);
  }
  // Страховка: если после патча ключ всё равно задублирован — лучше упасть
  // с понятной ошибкой, чем молча записать битый YAML.
  const galleryCount = (out.match(/^gallery:/gm) || []).length;
  if (galleryCount > 1) {
    throw new Error(
      `patchFrontmatter: после вставки получилось ${galleryCount} ключей gallery — запись отменена`,
    );
  }
  return out;
}

async function fetchFor(gameId, lang, title, developer, gameName = title) {
  const files = (await pageImages(lang, title)).filter((f) => {
    const info = f.imageinfo[0];
    if (!/^image\/(jpeg|png)$/.test(info.mime ?? '')) return false;
    if (JUNK.test(f.title)) return false;
    if ((info.width ?? 0) < 240) return false;
    return true;
  });
  /*
   * Берём только то, что опознано как кадр или обложка. Исключение —
   * единственный файл на странице: в статьях о старых играх часто лежит один
   * кадр вовсе без описания, и отбрасывать его значило бы остаться ни с чем.
   */
  const named = files.map((f) => ({ f, kind: classify(f) }));
  const usable = named.filter((x) => x.kind) ;
  const chosen = usable.length > 0 ? usable : named.length === 1 ? [{ f: named[0].f, kind: 'Скриншот' }] : [];
  // Сначала скриншоты, потом обложки; внутри — крупнее раньше.
  chosen.sort(
    (a, b) =>
      (a.kind === 'Скриншот' ? 0 : 1) - (b.kind === 'Скриншот' ? 0 : 1) ||
      (b.f.imageinfo[0].width ?? 0) - (a.f.imageinfo[0].width ?? 0),
  );
  const picked = chosen.slice(0, LIMIT).map((x) => x.f);
  const kindOf = new Map(chosen.map((x) => [x.f.title, x.kind]));
  console.log(`  ${lang}: ${title} — файлов ${files.length}, годится ${chosen.length}, берём ${picked.length}`);
  for (const f of picked) console.log(`    · ${f.title} (${kindOf.get(f.title)}, ${f.imageinfo[0].width}×${f.imageinfo[0].height})`);
  if (DRY || picked.length === 0) return null;

  const dir = path.join(GAMES, gameId, 'shots');
  await mkdir(dir, { recursive: true });
  const shots = [];
  let poster = null;
  for (const [i, f] of picked.entries()) {
    const info = f.imageinfo[0];
    const src = info.thumburl ?? info.url;
    const res = await fetch(src, { headers: { 'User-Agent': UA } });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const kind = kindOf.get(f.title) ?? 'Скриншот';
    const ext = 'jpg';
    const file = `${kind === 'Обложка' ? 'cover' : 'wiki'}-${String(i + 1).padStart(2, '0')}.${ext}`;
    const out = await sharp(buf, { failOn: 'none' }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    await writeFile(path.join(dir, file), out);
    /*
     * Чем подписать. Свободная лицензия требует назвать автора снимка —
     * берём его из метаданных Викимедиа. Иначе это добросовестное
     * использование кадра из игры, и отвечает за него разработчик.
     */
    const meta = info.extmetadata ?? {};
    const clean = (v) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const named = clean(meta.LicenseShortName?.value).toUpperCase().replace('CC-BY', 'CC BY');
    const artist = clean(meta.Artist?.value);
    const isFree = FREE.has(named) && artist.length > 0 && artist.length < 60;
    shots.push({
      file,
      caption: kind === 'Обложка' ? `${gameName}: обложка` : `${gameName}: кадр из игры`,
      author: isFree ? artist : developer,
      license: isFree ? named : kind,
      licenseUrl: isFree ? clean(meta.LicenseUrl?.value) || undefined : undefined,
      sourceUrl: info.descriptionurl,
    });
    if (!poster && kind === 'Скриншот') poster = file;
    await sleep(400);
  }
  if (!poster && shots[0]) poster = shots[0].file;
  return { poster, shots };
}

async function readGame(id) {
  const file = path.join(GAMES, id, 'index.md');
  if (!existsSync(file)) return null;
  const text = await readFile(file, 'utf8');
  const { fm } = split(text);
  return {
    id,
    file,
    name: unquote(field(fm, 'name')),
    altNames: fieldList(fm, 'altNames'),
    developer: field(fm, 'developer'),
    hasImages: /- kind: image/.test(fm),
  };
}

/** Имя студии для подписи «©»: короткое имя из карточки студии. */
async function studioName(id) {
  try {
    const text = await readFile(path.join(root, 'src', 'content', 'studios', id, 'index.md'), 'utf8');
    const shorts = [...text.matchAll(/^\s+short:\s*(.+)$/gm)].map((m) => unquote(m[1].trim()));
    return shorts[shorts.length - 1] ?? id;
  } catch {
    return id;
  }
}

async function apply(game, result) {
  const text = await readFile(game.file, 'utf8');
  const { head, fm, tail, body } = split(text);
  await writeFile(game.file, head + patchFrontmatter(fm, result) + tail + body, 'utf8');
}

async function main() {
  if (flag('auto')) {
    // Можно ограничить прогон списком игр: --auto gag chasm tetris.
    const only = args.filter((a) => !a.startsWith('--') && a !== opt('limit', '') && a !== opt('lang', ''));
    const ids = only.length
      ? only
      : (await readdir(GAMES, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
    for (const id of ids) {
      const game = await readGame(id);
      if (!game || game.hasImages) continue;
      console.log(`${id}: ${game.name}`);
      let result = null;
      for (const lang of ['ru', 'en']) {
        const title = await findTitle(lang, game.name, game.altNames ?? []);
        if (!title) continue;
        result = await fetchFor(id, lang, title, await studioName(game.developer), game.name);
        if (result) break;
        await sleep(500);
      }
      if (result) {
        await apply(game, result);
        console.log(`  ✓ записано ${result.shots.length}`);
      }
      await sleep(800);
    }
    return;
  }

  const id = opt('game');
  const title = opt('title');
  if (!id || !title) {
    console.error('Укажите --game <id> --title "Название статьи" [--lang ru|en], либо --auto.');
    process.exit(1);
  }
  const game = await readGame(id);
  if (!game) {
    console.error(`Нет игры ${id}`);
    process.exit(1);
  }
  const result = await fetchFor(id, opt('lang', 'ru'), title, await studioName(game.developer), game.name);
  if (result) {
    await apply(game, result);
    console.log(`✓ записано ${result.shots.length}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
