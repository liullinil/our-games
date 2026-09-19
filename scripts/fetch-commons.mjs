#!/usr/bin/env node
/**
 * Скачивает фотографии техники с Викисклада вместе с автором и лицензией: для страниц платформ и эпох.
 *
 * Берём только свободные лицензии (CC0, PD, CC BY, CC BY-SA). Рядом с каждым
 * файлом кладём *.meta.json, а в конце печатаем готовый кусок frontmatter —
 * остаётся вставить его в статью и поправить подписи.
 *
 * Примеры:
 *   npm run commons:fetch -- --search "Dendy Junior"                    найти файлы
 *   npm run commons:fetch -- --files "File:Dendy Junior.jpg" --platform dendy
 *   npm run commons:fetch -- --category "PlayStation Vita" --era tens --limit 3
 *   npm run commons:fetch -- --files "File:A.jpg|File:Б, с запятой.jpg" --era nineties
 *
 * Снимки платформ ложатся в src/content/platforms/<id>/photos, эпох — в
 * src/content/eras/<id>/. Скрипт печатает готовый кусок frontmatter.
 *
 * Уже скачанные файлы повторно не загружаются: на диске лежит пересжатая версия,
 * а с Викисклада придёт полноразмерный оригинал. Флаг --refetch заставляет перекачать.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://commons.wikimedia.org/w/api.php';

/** Wikimedia требует осмысленный User-Agent, иначе отвечает 403. */
const contact = process.env.COMMONS_CONTACT ?? 'https://github.com/liullinil/our-games';
const UA = `Igrostroy/0.1 (${contact})`;

/**
 * Что считаем свободной лицензией. Остальное пропускаем.
 *
 * Номер версии проверяем целиком. Раньше правило `^cc by-sa 2` ловило и
 * «CC BY-SA 2.5», а в галерею писало «CC BY-SA 2.0» — снимок оказывался
 * подписан не той лицензией, под которой выложен.
 */
const ALLOWED = [
  { test: /^cc0/i, name: 'CC0' },
  { test: /public domain|^pd$|^pd[-\s]/i, name: 'PD' },
  { test: /^cc by-sa 4\.0/i, name: 'CC BY-SA 4.0' },
  { test: /^cc by-sa 3\.0/i, name: 'CC BY-SA 3.0' },
  { test: /^cc by-sa 2\.5/i, name: 'CC BY-SA 2.5' },
  { test: /^cc by-sa 2\.0/i, name: 'CC BY-SA 2.0' },
  { test: /^cc by 4\.0/i, name: 'CC BY 4.0' },
  { test: /^cc by 3\.0/i, name: 'CC BY 3.0' },
  { test: /^cc by 2\.5/i, name: 'CC BY 2.5' },
  { test: /^cc by 2\.0/i, name: 'CC BY 2.0' },
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[name] = true;
    else {
      // Флаг можно повторять: значения копятся, а не затирают друг друга.
      args[name] = name in args && args[name] !== true ? `${args[name]}|${next}` : next;
      i += 1;
    }
  }
  return args;
}

async function api(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`Викисклад ответил ${res.status} на ${url.pathname}${url.search}`);
  return res.json();
}

/** Файлы категории; при --subcats заходим и в подкатегории (на один уровень). */
async function listCategoryFiles(category, useSubcats) {
  const titles = [`Category:${category.replace(/^Category:/, '')}`];

  if (useSubcats) {
    let cont;
    do {
      const data = await api({
        action: 'query',
        list: 'categorymembers',
        cmtitle: titles[0],
        cmtype: 'subcat',
        cmlimit: 'max',
        ...(cont ? { cmcontinue: cont } : {}),
      });
      for (const sub of data.query?.categorymembers ?? []) titles.push(sub.title);
      cont = data.continue?.cmcontinue;
    } while (cont);
  }

  const files = [];
  for (const title of titles) {
    let cont;
    do {
      const data = await api({
        action: 'query',
        generator: 'categorymembers',
        gcmtitle: title,
        gcmtype: 'file',
        gcmlimit: 'max',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size|mime',
        iiurlwidth: '2000',
        ...(cont ? { gcmcontinue: cont } : {}),
      });
      for (const page of data.query?.pages ?? []) files.push(page);
      cont = data.continue?.gcmcontinue;
    } while (cont);
  }
  return files;
}

async function fetchByTitles(titles) {
  const data = await api({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '2000',
  });
  return data.query?.pages ?? [];
}

/** Убираем разметку из поля «Автор»: там бывает HTML со ссылками. */
const stripHtml = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function classifyLicense(meta) {
  const short = stripHtml(meta?.LicenseShortName?.value);
  const raw = String(meta?.License?.value ?? '');
  for (const rule of ALLOWED) {
    if (rule.test.test(short) || rule.test.test(raw)) return rule.name;
  }
  return null;
}

/**
 * Разбор списка имён из --files.
 *
 * Запятая не годится разделителем: в названиях файлов Викисклада она
 * встречается сплошь и рядом («File:Ляскеля, ГАЗ-53.jpg»), и такое имя
 * молча распадалось на два несуществующих. Основной разделитель —
 * вертикальная черта; запятая понимается только там, где черты нет вовсе,
 * ради старых команд.
 */
function splitTitles(raw) {
  if (raw.includes('|')) return raw.split('|').map((s) => s.trim()).filter(Boolean);

  // Запятую считаем разделителем только тогда, когда КАЖДЫЙ кусок выглядит
  // самостоятельным именем, то есть начинается с «File:». Иначе это одно
  // название, внутри которого просто есть запятая.
  const byComma = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const looksLikeList = byComma.length > 1 && byComma.every((s) => /^File:/i.test(s));
  return looksLikeList ? byComma : [raw.trim()];
}


/**
 * Расширение по адресу. Берём последнюю точку в имени файла, а не проверку
 * «оканчивается на .png»: у эскизов адрес выглядит как
 * `…/Файл.tiff/2000px-Файл.tiff.jpg`, и проверка по одному расширению путалась.
 */
function extFromUrl(url) {
  const name = decodeURIComponent(String(url).split('?')[0].split('/').pop() ?? '');
  const m = name.toLowerCase().match(/\.([a-z0-9]{2,4})$/);
  const ext = m?.[1];
  if (ext === 'jpeg') return 'jpg';
  return ext === 'png' || ext === 'jpg' ? ext : 'jpg';
}

/**
 * Настоящий формат по первым байтам.
 *
 * Расширение из адреса иногда врёт, и на диск ложился PNG с именем .jpg —
 * дальше это ломало пересжатие и подпись в галерее. Байты не врут.
 */
function sniffExt(buffer, fallback) {
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  return fallback;
}

/**
 * Имя файла на диске.
 *
 * «File:GAZ-66.jpg» и «File:Gaz_66.jpg» дают одну и ту же основу. Раньше
 * второй файл молча затирал первый, но в галерею попадали обе записи — и
 * одна из них подписывала снимок чужим автором и чужой лицензией. Теперь
 * имена разводятся.
 *
 * Занятым считается только имя, за которым стоит ДРУГОЙ файл Викисклада:
 * это видно по сохранённому рядом *.meta.json. Если там тот же самый
 * источник, имя переиспользуется, и повторная загрузка категории просто
 * обновляет снимок, а не плодит копии.
 */
async function pickName(outDir, base, ext, takenNames, title) {
  for (let n = 1; ; n += 1) {
    const name = n === 1 ? `${base}.${ext}` : `${base}-${n}.${ext}`;
    if (takenNames.has(name)) continue;

    const onDisk = path.join(outDir, name);
    if (!existsSync(onDisk)) return name;

    try {
      const meta = JSON.parse(await readFile(`${onDisk}.meta.json`, 'utf8'));
      if (meta.title === title) return name;
    } catch {
      // Метаданных нет — считаем имя чужим и берём следующее.
    }
  }
}


/** Поиск файлов на Викискладе: имена, размеры и лицензии кандидатов. */
async function searchFiles(query, limit) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: 6,
    gsrlimit: limit,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
  });
  const pages = data.query?.pages ?? [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const license = classifyLicense(info.extmetadata) ?? `✗ ${stripHtml(info.extmetadata?.LicenseShortName?.value) || 'без лицензии'}`;
    console.log(`${page.title}\n    ${info.width}×${info.height}  ${license}  ${stripHtml(info.extmetadata?.Artist?.value).slice(0, 40)}`);
  }
  if (pages.length === 0) console.log('Ничего не найдено.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.search) {
    await searchFiles(String(args.search), Number(args.limit ?? 12));
    return;
  }
  const platform = args.platform;
  const era = args.era;
  const game = args.game;
  if (!platform && !era && !game) {
    console.error('Укажите, куда класть: --platform dendy, --era nineties или --game magistral (или --search "запрос").');
    process.exit(1);
  }
  if (!args.category && !args.files) {
    console.error(
      'Укажите источник: --category "GAZ-51" или --files "File:A.jpg|File:B.jpg".' +
        '\n' +
        'Имена разделяются вертикальной чертой: в названиях с Викисклада бывают запятые.',
    );
    process.exit(1);
  }

  const limit = Number(args.limit ?? 6);
  /*
   * Игровому автомату скриншот взять неоткуда: экран у него телевизионный,
   * а сам автомат — шкаф с рулём или перископом. Лучшая иллюстрация здесь —
   * фотография самой машины, и она вполне бывает на Викискладе под свободной
   * лицензией. Кладём такие снимки туда же, куда и кадры из Steam.
   */
  const outDir = game
    ? path.join(root, 'src', 'content', 'games', game, 'shots')
    : platform
      ? path.join(root, 'src', 'content', 'platforms', platform, 'photos')
      : path.join(root, 'src', 'content', 'eras', era);
  if (game && !existsSync(path.join(root, 'src', 'content', 'games', game))) {
    console.error(`Нет статьи src/content/games/${game}. Сначала создайте index.md.`);
    process.exit(1);
  }
  if (platform && !existsSync(path.join(root, 'src', 'content', 'platforms', platform))) {
    console.error(`Нет статьи src/content/platforms/${platform}. Сначала создайте index.md.`);
    process.exit(1);
  }
  if (era && !existsSync(path.join(root, 'src', 'content', 'eras', `${era}.yaml`))) {
    console.error(`Нет эпохи src/content/eras/${era}.yaml.`);
    process.exit(1);
  }
  await mkdir(outDir, { recursive: true });
  const rel = game ? './shots/' : platform ? './photos/' : `./${era}/`;

  const pages = args.files
    ? await fetchByTitles(splitTitles(String(args.files)))
    : await listCategoryFiles(String(args.category), Boolean(args.subcats));

  const picked = [];
  const skipped = [];
  /** Занятые имена: два разных файла Викисклада легко дают одно и то же. */
  const takenNames = new Set();

  for (const page of pages) {
    if (picked.length >= limit) break;
    const info = page.imageinfo?.[0];
    if (!info) continue;
    // TIFF на Викискладе встречается у музейных сканов, и лучшие снимки иногда
    // лежат именно в нём. Сам файл нам не нужен: Викисклад отдаёт для него
    // готовый эскиз в JPEG, и качаем мы как раз эскиз. Поэтому пропускаем
    // не по формату оригинала, а по тому, есть ли пригодная картинка.
    const mime = info.mime ?? '';
    const raster = /^image\/(jpeg|png)$/.test(mime);
    const rendered = /^image\/(tiff|webp|gif)$/.test(mime) && Boolean(info.thumburl);
    if (!raster && !rendered) continue;

    const license = classifyLicense(info.extmetadata);
    if (!license) {
      skipped.push(`${page.title} — лицензия «${stripHtml(info.extmetadata?.LicenseShortName?.value) || 'не указана'}»`);
      continue;
    }

    const author = stripHtml(info.extmetadata?.Artist?.value) || 'автор не указан';
    const описание = stripHtml(info.extmetadata?.ImageDescription?.value);
    const src = info.thumburl ?? info.url;
    const ext = extFromUrl(src);
    const base = page.title
      .replace(/^File:/, '')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9а-я]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);

    const file = await pickName(outDir, base, ext, takenNames, page.title);
    takenNames.add(file);

    // Тот же снимок уже лежит на диске — не перекачиваем. Лежащий файл, скорее
    // всего, уже пересжат `npm run photos:shrink`, а с Викисклада придёт
    // полноразмерный оригинал: повторный прогон категории раздувал вес
    // репозитория и портил ранее подготовленные файлы. Данные для галереи
    // при этом всё равно печатаем — они берутся из ответа, а не из файла.
    let onDisk = path.join(outDir, file);
    let name = file;
    const reuse = existsSync(onDisk) && !args.refetch;
    if (reuse) {
      console.log(`= ${file}  уже на месте, не перекачиваю`);
    } else {
      const bin = await fetch(src, { headers: { 'user-agent': UA } });
      if (!bin.ok) {
        skipped.push(`${page.title} — не удалось скачать (${bin.status})`);
        continue;
      }
      const buffer = Buffer.from(await bin.arrayBuffer());
      const realExt = sniffExt(buffer, ext);
      if (realExt !== ext) {
        takenNames.delete(file);
        name = await pickName(outDir, base, realExt, takenNames, page.title);
        takenNames.add(name);
        onDisk = path.join(outDir, name);
      }
      await writeFile(onDisk, buffer);
    }

    const item = {
      file: name,
      title: page.title,
      caption: описание ? описание.slice(0, 120) : page.title.replace(/^File:/, ''),
      author,
      license,
      licenseUrl: stripHtml(info.extmetadata?.LicenseUrl?.value) || undefined,
      sourceUrl: info.descriptionurl,
      width: info.thumbwidth ?? info.width,
      height: info.thumbheight ?? info.height,
      date: stripHtml(info.extmetadata?.DateTimeOriginal?.value) || undefined,
    };
    await writeFile(
      path.join(outDir, `${name}.meta.json`),
      JSON.stringify(item, null, 2) + '\n',
      'utf8',
    );
    picked.push(item);
    if (!reuse) console.log(`✓ ${name}  ${license}  ${author}`);
  }

  if (skipped.length) {
    console.log('\nПропущено:');
    for (const line of skipped.slice(0, 10)) console.log(`  · ${line}`);
    if (skipped.length > 10) console.log(`  · …и ещё ${skipped.length - 10}`);
  }

  if (picked.length === 0) {
    console.log('\nНичего не подошло: в категории нет файлов со свободной лицензией.');
    return;
  }

  if (game) {
    console.log('\nВставьте в frontmatter игры:\n');
    console.log(`poster: ${rel}${picked[0].file}`);
    console.log('gallery:');
    for (const p of picked) {
      console.log(`  - kind: image`);
      console.log(`    src: ${rel}${p.file}`);
      console.log(`    caption: ${JSON.stringify(p.caption)}`);
      console.log(`    author: ${JSON.stringify(p.author)}`);
      console.log(`    license: ${JSON.stringify(p.license)}`);
      if (p.licenseUrl) console.log(`    licenseUrl: ${JSON.stringify(p.licenseUrl)}`);
      console.log(`    sourceUrl: ${JSON.stringify(p.sourceUrl)}`);
    }
  } else if (platform) {
    const p = picked[0];
    console.log('\nВставьте в frontmatter платформы (первый снимок):\n');
    console.log(`photo: ${rel}${p.file}`);
    console.log(`photoCaption: ${JSON.stringify(p.caption)}`);
    console.log('photoCredits:');
    console.log(`  author: ${JSON.stringify(p.author)}`);
    console.log(`  license: ${JSON.stringify(p.license)}`);
    if (p.licenseUrl) console.log(`  licenseUrl: ${JSON.stringify(p.licenseUrl)}`);
    console.log(`  sourceUrl: ${JSON.stringify(p.sourceUrl)}`);
  } else {
    console.log('\nВставьте в images: эпохи:\n');
    for (const p of picked) {
      console.log(`  - src: ${rel}${p.file}`);
      console.log(`    caption: ${JSON.stringify(p.caption)}`);
      console.log(`    author: ${JSON.stringify(p.author)}`);
      console.log(`    license: ${JSON.stringify(p.license)}`);
      if (p.licenseUrl) console.log(`    licenseUrl: ${JSON.stringify(p.licenseUrl)}`);
      console.log(`    sourceUrl: ${JSON.stringify(p.sourceUrl)}`);
    }
  }
  console.log(`\nПодписи взяты из описаний на Викискладе — их стоит переписать по-русски.`);
  console.log('Снимок стоит ужать: npm run photos:shrink — оригиналы весят по 2–5 МБ.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
