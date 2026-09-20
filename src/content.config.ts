import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Эпохи. Границы: from включительно, to исключительно. */
export const ERA_IDS = ['soviet', 'nineties', 'noughties', 'tens', 'twenties'] as const;

/** Жанры — разделы каталога. */
export const GAME_TYPES = [
  'strategy',
  'rpg',
  'shooter',
  'action',
  'adventure',
  'simulation',
  'racing',
  'puzzle',
  'online',
  'other',
] as const;

/** Поджанр: определяет подпись и фильтры каталога. */
export const GAME_CLASSES = [
  // Стратегии
  'rts',
  'tbs',
  'wargame',
  'tactics',
  'economic',
  'tower-defense',
  'grand-strategy',
  'auto-battler',
  // Ролевые
  'crpg',
  'space-rpg',
  'action-rpg',
  'roguelike',
  'tactical-rpg',
  'jrpg',
  // Шутеры
  'fps',
  'tps',
  'survival-shooter',
  'shoot-em-up',
  'arena-shooter',
  'extraction-shooter',
  'tactical-shooter',
  // Экшен
  'action-adventure',
  'platformer',
  'stealth',
  'beat-em-up',
  'fighting',
  'horror',
  'survival',
  'open-world',
  'metroidvania',
  'immersive-sim',
  // Приключения
  'quest',
  'visual-novel',
  'text-adventure',
  'interactive-story',
  'walking-sim',
  // Симуляторы
  'flight-sim',
  'space-sim',
  'truck-sim',
  'racing-sim',
  'tycoon',
  'life-sim',
  'vehicle-sim',
  'sandbox',
  'crafting',
  // Гонки
  'arcade-racing',
  'combat-racing',
  // Головоломки и казуальные
  'puzzle',
  'match-3',
  'hidden-object',
  'casual',
  'physics-puzzle',
  'card',
  'time-management',
  // Онлайн
  'mmorpg',
  'mmo-shooter',
  'vehicle-mmo',
  'browser-mmo',
  'battle-royale',
  'moba',
  'coop-shooter',
  // Прочее
  'arcade',
  'electronic',
  'arcade-machine',
  'sports',
  'music',
  'educational',
  'party',
  'other',
] as const;

/** Страна студии на момент выхода игры. */
export const COUNTRIES = [
  'ussr',
  'russia',
  'ukraine',
  'belarus',
  'kazakhstan',
  'armenia',
  'georgia',
  'estonia',
  'latvia',
  'lithuania',
  'moldova',
  'uzbekistan',
  'azerbaijan',
  'cyprus',
  'other',
] as const;

/** Чем занимается студия: делает игры, издаёт или и то и другое. */
export const STUDIO_KINDS = ['developer', 'publisher', 'both'] as const;

/** Виды платформ. */
export const PLATFORM_KINDS = [
  'computer',
  'pc',
  'console',
  'handheld',
  'mobile',
  'arcade',
  'web',
] as const;

/** Режимы игры. */
export const GAME_MODES = ['single', 'multiplayer', 'coop', 'online'] as const;

/** Откуда движок: свой, лицензированный у другой студии или открытый. */
export const ENGINE_ORIGINS = ['inhouse', 'licensed', 'opensource'] as const;

/**
 * Можно ли сегодня в игру поиграть и на каких условиях.
 *
 * sold — продаётся (Steam, GOG, консольные и мобильные магазины);
 * free — бесплатна официально (условно-бесплатная онлайн-игра или релиз,
 * который правообладатель раздаёт сам), но распространять её другим нельзя;
 * freeware — автор разрешил свободно копировать и раздавать;
 * opensource — исходный код открыт под свободной лицензией (данные игры
 * при этом могут остаться несвободными — это пишется в note);
 * unavailable — не продаётся и не раздаётся: снята с продажи, серверы
 * закрыты, найти можно только в архивах;
 * unknown — не выяснено.
 */
export const AVAILABILITY = ['sold', 'free', 'freeware', 'opensource', 'unavailable', 'unknown'] as const;

/**
 * Родство студий: студии переименовываются, делятся и разбегаются постоянно,
 * и без этих связей на карте «выходцы из GSC» лежат где попало.
 *
 * spinoff — основана выходцами из другой студии; parent — другая студия
 * материнская (владелец); successor — эта студия продолжает дело другой
 * после её закрытия или продажи; sibling — общие основатели или владельцы
 * без прямого происхождения.
 */
export const STUDIO_RELATIONS = ['spinoff', 'parent', 'successor', 'sibling'] as const;

/**
 * Лицензии и основания использования изображений.
 *
 * Фотографии техники (компьютеры, приставки) берутся с Викисклада на условиях
 * свободных лицензий. Скриншоты, обложки и промо-арт игр несвободны: права
 * принадлежат разработчику и издателю, а мы приводим их в информационных
 * целях, как это принято в энциклопедиях о видеоиграх. Такие изображения
 * отмечаются не лицензией, а основанием.
 */
export const LICENSES = [
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
  'Скриншот',
  'Обложка',
  'Промо',
] as const;

const idFromIndex = ({ entry }: { entry: string }) =>
  entry
    .replace(/\\/g, '/')
    .replace(/\/index\.mdx?$/, '')
    .replace(/\.mdx?$/, '');

const idFromFile = ({ entry }: { entry: string }) =>
  entry.replace(/\\/g, '/').replace(/\.(ya?ml|mdx?)$/, '');

/** Источник: ссылка в сети либо книга или журнал. */
const sources = z
  .array(
    z.object({
      title: z.string(),
      url: z.url().optional(),
      author: z.string().optional(),
      publisher: z.string().optional(),
      year: z.number().int().optional(),
      isbn: z.string().optional(),
      pages: z.string().optional(),
    }),
  )
  .default([]);

/** Подпись к изображению: автор, основание, источник. */
const credits = {
  author: z.string(),
  license: z.enum(LICENSES),
  licenseUrl: z.url().optional(),
  /** Страница файла или страница игры в магазине, откуда взят кадр. */
  sourceUrl: z.url().optional(),
  /** Издание, где кадр опубликован, если страницы в сети нет. */
  sourceBook: z.string().optional(),
  /** true, если изображение кадрировали или правили (требование BY-SA). */
  modified: z.boolean().default(false),
};

const specs = z.object({
  /** Дата выхода словами: «20 марта 2007». */
  releaseDate: z.string().optional(),
  modes: z.array(z.enum(GAME_MODES)).default([]),
  /** Вид: «от первого лица», «изометрия», «вид сверху». */
  perspective: z.string().optional(),
  /** Сеттинг: «Чернобыльская зона отчуждения, 2012 год». */
  setting: z.string().optional(),
  /** Продано копий или число игроков, когда известно точно. */
  sales: z.number().optional(),
  /** Текстом, когда точного числа нет: «свыше 2 млн копий». */
  salesNote: z.string().optional(),
  /** Сколько делали: «1999–2003, четыре года». */
  development: z.string().optional(),
  /** Оценка Metacritic, если игра там есть. */
  metacritic: z.number().int().min(0).max(100).optional(),
  /**
   * Выходила ли за пределами России и СНГ и как: «в Европе и США как Rage of
   * Mages, издатель Monolith, 1998» или «за рубежом не издавалась».
   */
  abroad: z.string().optional(),
});

/** Рецензия: издание, оценка и вердикт своими словами. Прямые цитаты не нужны. */
const review = z.object({
  outlet: z.string(),
  /** Как у издания: «9/10», «82/100», «4 из 5», «B+». */
  score: z.string().optional(),
  /** Пересказ вердикта одним-двумя предложениями, без цитирования. */
  verdict: z.string(),
  url: z.url(),
  author: z.string().optional(),
  /** Год или дата словами. */
  date: z.string().optional(),
});

/** Что почитать дальше: разборы механик, истории создания, ретроспективы. */
const reading = z.object({
  title: z.string(),
  url: z.url(),
  /** DTF, StopGame, «Игромания», Habr… */
  outlet: z.string().optional(),
  /** Чем полезно: «разбор экономики игры», «интервью с автором». */
  note: z.string().optional(),
});

/**
 * Где взять игру.
 *
 * `where` — официальные магазины, сайт автора, репозиторий кода, архив с
 * разрешения правообладателя. `files` — то, что лежит у нас: только когда
 * лицензия прямо разрешает распространение; файл кладётся в
 * public/downloads/<id>/ и проверяется скриптом content:validate.
 */
const availability = z.object({
  status: z.enum(AVAILABILITY).default('unknown'),
  /** Пояснение: «в Steam с 2014 года, на консолях снята с продажи». */
  note: z.string().optional(),
  where: z
    .array(
      z.object({
        title: z.string(),
        url: z.url(),
        note: z.string().optional(),
      }),
    )
    .default([]),
  files: z
    .array(
      z.object({
        /** Имя файла в public/downloads/<id>/. */
        file: z.string(),
        title: z.string(),
        /** Условия, на которых файл можно раздавать: «GPL-3.0», «разрешение автора». */
        license: z.string(),
        licenseUrl: z.url().optional(),
        /** Откуда файл взят. */
        sourceUrl: z.url(),
        /** Размер словами: «12 КБ». */
        size: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .default([]),
});

/** Прообраз, которого нет в базе отдельной игрой (Fallout, Warcraft II). */
const externalPrototype = z.object({
  name: z.string(),
  maker: z.string().optional(),
  country: z.string().optional(),
  year: z.number().int().optional(),
  url: z.url().optional(),
  note: z.string().optional(),
});

const games = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/games',
    generateId: idFromIndex,
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      altNames: z.array(z.string()).default([]),
      /** game — самостоятельная игра, expansion — дополнение, remake — переиздание. */
      kind: z.enum(['game', 'expansion', 'remake']).default('game'),
      baseGame: reference('games').optional(),
      type: z.enum(GAME_TYPES),
      class: z.enum(GAME_CLASSES),
      developer: reference('studios'),
      publishers: z.array(reference('studios')).default([]),
      series: reference('series').optional(),
      country: z.enum(COUNTRIES),
      /*
       * У игры один год — год выхода. Диапазона «с какого по какой» здесь
       * нет нарочно: срок жизни онлайн-игры или дата закрытия серверов —
       * это факт для статьи и для `note`, а не вторая координата на карте.
       */
      years: z.object({
        /** Год выхода: первый релиз на любой платформе. */
        start: z.number().int().min(1970).max(2100),
        /** Пояснение: «ранний доступ с 2017», «серверы закрыты в 2025». */
        note: z.string().optional(),
      }),
      /** Переопределение эпохи, если год выхода вводит в заблуждение. */
      era: z.enum(ERA_IDS).optional(),
      predecessors: z.array(reference('games')).default([]),
      basedOn: z.array(z.union([reference('games'), externalPrototype])).default([]),
      variants: z.array(reference('games')).default([]),
      platforms: z.array(reference('platforms')).min(1),
      engines: z.array(reference('engines')).default([]),
      specs: specs.default({ modes: [] }),
      summary: z.string(),
      poster: image().optional(),
      gallery: z
        .array(
          z.discriminatedUnion('kind', [
            z
              .object({
                kind: z.literal('image'),
                src: image(),
                caption: z.string(),
                ...credits,
              })
              .refine((p) => p.sourceUrl || p.sourceBook, {
                message: 'у изображения должен быть sourceUrl или sourceBook',
                path: ['sourceUrl'],
              }),
            z.object({
              kind: z.literal('youtube'),
              id: z.string().regex(/^[\w-]{11}$/, 'ID ролика YouTube — 11 символов'),
              title: z.string(),
              channel: z.string().optional(),
              checkedAt: z.string().optional(),
            }),
            z.object({
              kind: z.literal('rutube'),
              id: z.string().regex(/^[0-9a-f]{32}$/, 'ID ролика Rutube — 32 шестнадцатеричных знака'),
              title: z.string(),
              channel: z.string().optional(),
              poster: z.url().optional(),
              checkedAt: z.string().optional(),
            }),
            z.object({
              kind: z.literal('vk'),
              id: z.string().regex(/^-?\d+_\d+$/, 'ID ролика VK — «владелец_ролик»'),
              title: z.string(),
              channel: z.string().optional(),
              poster: z.url().optional(),
              checkedAt: z.string().optional(),
            }),
          ]),
        )
        .default([]),
      /** Идентификатор в Steam: по нему скрипт забирает скриншоты. */
      steamAppId: z.number().int().optional(),
      website: z.url().optional(),
      /** Рецензии прессы с оценками. */
      reviews: z.array(review).default([]),
      /** Разборы и статьи о механиках, истории, пасхалках — DTF, StopGame и другие. */
      reading: z.array(reading).default([]),
      availability: availability.default({ status: 'unknown', where: [], files: [] }),
      sources,
      /** article — есть полная статья, card — карточка реестра. */
      status: z.enum(['article', 'card']).default('card'),
      draft: z.boolean().default(false),
    }),
});

const studios = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/studios',
    generateId: idFromIndex,
  }),
  schema: ({ image }) =>
    z.object({
      /** Названия по годам: «Никита» → Nikita Online. */
      names: z
        .array(
          z.object({
            name: z.string(),
            short: z.string(),
            from: z.number().int(),
            to: z.number().int().nullable().default(null),
          }),
        )
        .min(1),
      city: z.string(),
      country: z.enum(COUNTRIES),
      founded: z.number().int(),
      closed: z.number().int().nullable().default(null),
      kind: z.enum(STUDIO_KINDS).default('developer'),
      logo: image().optional(),
      website: z.url().optional(),
      /**
       * Родственные студии: откуда вышла команда, кому принадлежит, чьё дело
       * продолжает. Достаточно указать с одной стороны — встречная связь
       * появится сама. Карта связей кладёт родственников рядом.
       */
      related: z
        .array(
          z.object({
            studio: reference('studios'),
            kind: z.enum(STUDIO_RELATIONS),
            /** «основана в 2006 году выходцами из GSC во главе с Андреем Прохоровым». */
            note: z.string().optional(),
          }),
        )
        .default([]),
      summary: z.string(),
      sources,
    }),
});

const series = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/series',
    generateId: idFromFile,
  }),
  schema: z.object({
    name: z.string(),
    /** Студия-родоначальник; серия может перейти к другой команде. */
    studio: reference('studios').optional(),
    type: z.enum(GAME_TYPES),
    summary: z.string(),
  }),
});

const engines = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/engines',
    generateId: idFromFile,
  }),
  schema: z.object({
    name: z.string(),
    altNames: z.array(z.string()).default([]),
    developer: reference('studios').optional(),
    /** Кем сделан движок, если студии нет в базе: «Epic Games (США)». */
    maker: z.string().optional(),
    origin: z.enum(ENGINE_ORIGINS),
    /** Языки и технологии: «C++, DirectX 9». */
    tech: z.string().optional(),
    years: z.object({
      start: z.number().int().nullable().default(null),
      end: z.number().int().nullable().default(null),
    }),
    basedOn: z.string().optional(),
    website: z.url().optional(),
    summary: z.string(),
    sources,
  }),
});

const platforms = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/platforms',
    generateId: idFromIndex,
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      altNames: z.array(z.string()).default([]),
      kind: z.enum(PLATFORM_KINDS),
      /** Производитель: «Steepler», «Sony», «Электроника». */
      maker: z.string().optional(),
      country: z.enum(COUNTRIES),
      years: z.object({
        start: z.number().int(),
        end: z.number().int().nullable().default(null),
      }),
      summary: z.string(),
      photo: image().optional(),
      photoCaption: z.string().optional(),
      photoCredits: z
        .object({
          author: z.string(),
          license: z.enum(LICENSES),
          licenseUrl: z.url().optional(),
          sourceUrl: z.url(),
        })
        .optional(),
      sources,
    }),
});

const eras = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/eras', generateId: idFromFile }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      shortTitle: z.string(),
      from: z.number().int(),
      to: z.number().int().nullable().default(null),
      /** Подпись диапазона для интерфейса: «1991–2000». */
      range: z.string(),
      description: z.string(),
      /** Цвет для полосы эпохи и карточек. */
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      band: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      /** Шрифты для preload: файлы лежат в public/fonts. */
      fonts: z
        .array(
          z.object({
            file: z.string(),
            family: z.string(),
            weight: z.string().default('400'),
          }),
        )
        .default([]),
      styleNote: z.string(),
      /** Приметы времени: то, что стояло на столах и в карманах. */
      motifs: z.array(z.string()).default([]),
      /** Узнаваемые образы эпохи: снимки техники с Викисклада. */
      images: z
        .array(
          z.object({
            src: image(),
            caption: z.string(),
            author: z.string(),
            license: z.enum(LICENSES),
            licenseUrl: z.url().optional(),
            sourceUrl: z.url(),
          }),
        )
        .default([]),
    }),
});

export const collections = { games, studios, series, engines, platforms, eras };
