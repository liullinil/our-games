/** Название сайта. Держим в одном месте: оно попадает и в заголовок
 *  вкладки, и в шапку, и на главную. */
export const SITE_NAME = 'Наши Игры';

/** Русские подписи для всех перечислений схемы. Держим в одном месте. */

export const TYPE_LABEL: Record<string, string> = {
  strategy: 'Стратегии',
  rpg: 'Ролевые игры',
  shooter: 'Шутеры',
  action: 'Экшен',
  adventure: 'Квесты и приключения',
  simulation: 'Симуляторы',
  racing: 'Гонки',
  puzzle: 'Головоломки и казуальные',
  online: 'Онлайн-игры',
  other: 'Прочее',
};

/**
 * Порядок жанров в каталоге, на главной и в крошках. Шаблоны берут порядок
 * отсюда и отсеивают жанры, которых в базе нет.
 */
export const TYPE_ORDER = [
  'strategy',
  'rpg',
  'shooter',
  'action',
  'adventure',
  'simulation',
  'racing',
  'online',
  'puzzle',
  'other',
] as const;

export const TYPE_LABEL_ONE: Record<string, string> = {
  strategy: 'Стратегия',
  rpg: 'Ролевая игра',
  shooter: 'Шутер',
  action: 'Экшен',
  adventure: 'Квест',
  simulation: 'Симулятор',
  racing: 'Гонки',
  puzzle: 'Головоломка',
  online: 'Онлайн-игра',
  other: 'Игра',
};

export const CLASS_LABEL: Record<string, string> = {
  rts: 'Стратегия в реальном времени',
  tbs: 'Пошаговая стратегия',
  wargame: 'Варгейм',
  tactics: 'Тактика',
  economic: 'Экономическая стратегия',
  'tower-defense': 'Tower defense',
  'grand-strategy': 'Глобальная стратегия',
  'auto-battler': 'Автобатлер',
  crpg: 'Партийная ролевая игра',
  'space-rpg': 'Космическая ролевая игра',
  'action-rpg': 'Ролевой экшен',
  roguelike: 'Роглайк',
  'tactical-rpg': 'Тактическая ролевая игра',
  jrpg: 'Ролевая игра в японском духе',
  fps: 'Шутер от первого лица',
  tps: 'Шутер от третьего лица',
  'survival-shooter': 'Шутер с выживанием',
  'shoot-em-up': 'Скролл-шутер',
  'arena-shooter': 'Арена-шутер',
  'extraction-shooter': 'Шутер с эвакуацией',
  'tactical-shooter': 'Тактический шутер',
  'action-adventure': 'Приключенческий экшен',
  platformer: 'Платформер',
  stealth: 'Стелс',
  'beat-em-up': 'Beat ’em up',
  fighting: 'Файтинг',
  horror: 'Хоррор',
  survival: 'Выживание',
  'open-world': 'Открытый мир',
  metroidvania: 'Метроидвания',
  'immersive-sim': 'Иммерсив-сим',
  quest: 'Квест',
  'visual-novel': 'Визуальная новелла',
  'text-adventure': 'Текстовое приключение',
  'interactive-story': 'Интерактивная история',
  'walking-sim': 'Симулятор ходьбы',
  'flight-sim': 'Авиасимулятор',
  'space-sim': 'Космический симулятор',
  'truck-sim': 'Симулятор дальнобойщика',
  'racing-sim': 'Автосимулятор',
  tycoon: 'Экономический симулятор',
  'life-sim': 'Симулятор жизни',
  'vehicle-sim': 'Симулятор техники',
  sandbox: 'Песочница',
  crafting: 'Крафт и выживание',
  'arcade-racing': 'Аркадные гонки',
  'combat-racing': 'Боевые гонки',
  puzzle: 'Головоломка',
  'match-3': 'Три в ряд',
  'hidden-object': 'Поиск предметов',
  casual: 'Казуальная игра',
  'physics-puzzle': 'Физическая головоломка',
  card: 'Карточная игра',
  'time-management': 'Тайм-менеджмент',
  mmorpg: 'MMORPG',
  'mmo-shooter': 'Онлайн-шутер',
  'vehicle-mmo': 'Онлайн-экшен на технике',
  'browser-mmo': 'Браузерная онлайн-игра',
  'battle-royale': 'Королевская битва',
  moba: 'MOBA',
  'coop-shooter': 'Кооперативный шутер',
  arcade: 'Аркада',
  electronic: 'Электронная игра',
  'arcade-machine': 'Игровой автомат',
  sports: 'Спортивная игра',
  music: 'Музыкальная игра',
  educational: 'Обучающая игра',
  party: 'Игра для компании',
  other: 'Прочее',
};

export const COUNTRY_LABEL: Record<string, string> = {
  ussr: 'СССР',
  russia: 'Россия',
  ukraine: 'Украина',
  belarus: 'Беларусь',
  kazakhstan: 'Казахстан',
  armenia: 'Армения',
  georgia: 'Грузия',
  estonia: 'Эстония',
  latvia: 'Латвия',
  lithuania: 'Литва',
  moldova: 'Молдова',
  uzbekistan: 'Узбекистан',
  azerbaijan: 'Азербайджан',
  cyprus: 'Кипр',
  other: 'Другая страна',
};

export const COUNTRY_SHORT: Record<string, string> = {
  ...COUNTRY_LABEL,
  other: '—',
};

export const STUDIO_KIND_LABEL: Record<string, string> = {
  developer: 'разработчик',
  publisher: 'издатель',
  both: 'разработчик и издатель',
};

export const PLATFORM_KIND_LABEL: Record<string, string> = {
  computer: 'Советские компьютеры и клоны',
  pc: 'Персональные компьютеры',
  console: 'Приставки',
  handheld: 'Портативные',
  mobile: 'Телефоны и планшеты',
  arcade: 'Игровые автоматы',
  web: 'Браузер',
};

export const PLATFORM_KIND_ORDER = [
  'computer',
  'pc',
  'console',
  'handheld',
  'mobile',
  'arcade',
  'web',
] as const;

export const MODE_LABEL: Record<string, string> = {
  single: 'одиночная',
  multiplayer: 'многопользовательская',
  coop: 'кооператив',
  online: 'онлайн',
};

export const ENGINE_ORIGIN_LABEL: Record<string, string> = {
  inhouse: 'собственный',
  licensed: 'лицензированный',
  opensource: 'открытый',
};

/** Типы связей на карте и в списках. */
export const EDGE_LABEL: Record<string, string> = {
  predecessor: 'Предшественник',
  successor: 'Продолжение',
  basedOn: 'Сделана на основе',
  basedOnBy: 'На её основе сделаны',
  variant: 'Переиздание',
  variantOf: 'Переиздание игры',
};

/**
 * Год выхода одной строкой: «2007».
 *
 * У игры одна дата — когда она вышла. Раньше здесь собирался отрезок
 * «2010 — н. в.» по году закрытия серверов, но срок жизни игры — факт для
 * статьи, а не вторая координата: карточка с ним читалась как «игра шла
 * с 2010 по 2025», хотя вышла она один раз.
 */
export function yearOf(years: { start: number }): string {
  return String(years.start);
}

/** Где взять игру: подпись состояния. */
export const AVAILABILITY_LABEL: Record<string, string> = {
  sold: 'продаётся',
  free: 'бесплатно',
  freeware: 'свободно распространяется',
  opensource: 'открытый код',
  unavailable: 'не продаётся',
  unknown: 'не выяснено',
};

/**
 * Родство студий с обеих сторон.
 *
 * Запись «related: [{ studio: gsc, kind: spinoff }]» у 4A Games читается как
 * «основана выходцами из GSC»; на странице GSC та же связь показывается
 * зеркально — «выходцы основали 4A Games».
 */
export const STUDIO_RELATION_LABEL: Record<string, { own: string; mirror: string }> = {
  spinoff: { own: 'основана выходцами из', mirror: 'выходцы основали' },
  /*
   * «Дочерняя студия» с обеих сторон читалось одинаково и потому никуда не
   * годилось: по надписи нельзя было понять, кто кому дочерний. Родство
   * пишется у младшей студии, и подписи теперь прямо это говорят.
   */
  parent: { own: 'входит в', mirror: 'в состав входят' },
  successor: { own: 'продолжает дело', mirror: 'дело продолжила' },
  sibling: { own: 'родственная студия', mirror: 'родственная студия' },
};

/** Разряды в больших числах: 3 481 033. */
export function formatCount(n: number): string {
  return n.toLocaleString('ru-RU').replace(/ /g, ' ');
}

/** Слово в нужной форме: 1 игра, 2 игры, 5 игр. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** «12 игр» одной строкой. */
export const nGames = (n: number) => `${n} ${plural(n, 'игра', 'игры', 'игр')}`;

/**
 * Библиографическая запись источника-книги. Для источника без книжных полей
 * возвращает пустую строку — такой печатается обычной ссылкой.
 */
export function bookCitation(s: {
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  isbn?: string;
  pages?: string;
}): string {
  if (!s.author && !s.publisher && !s.year) return '';
  const head = s.author ? `${s.author} ${s.title}` : s.title;
  const imprint = [s.publisher, s.year].filter(Boolean).join(', ');
  return [head, imprint, s.pages, s.isbn && `ISBN ${s.isbn}`].filter(Boolean).join('. — ');
}

/** Откуда изображение — одной подписью. */
export function photoSource(p: {
  sourceUrl?: string;
  sourceBook?: string;
}): { href?: string; label: string } {
  if (p.sourceUrl) {
    let label = 'источник';
    try {
      const host = new URL(p.sourceUrl).hostname;
      if (host.endsWith('wikimedia.org')) label = 'Викисклад';
      else if (host.endsWith('wikipedia.org')) label = 'Википедия';
      else if (host.endsWith('steampowered.com')) label = 'Steam';
      else if (host.endsWith('gog.com')) label = 'GOG';
      else if (host.endsWith('mobygames.com')) label = 'MobyGames';
      else if (host.endsWith('old-games.ru')) label = 'Old-Games.RU';
    } catch {
      /* адрес уже проверен схемой, но подпись важнее исключения */
    }
    return { href: p.sourceUrl, label };
  }
  return { label: `опубл.: ${p.sourceBook}` };
}

/** Несвободное изображение из самой игры: скриншот, обложка, промо-арт. */
export const isGameArt = (license: string): boolean =>
  license === 'Скриншот' || license === 'Обложка' || license === 'Промо';

/** Подпись под изображением из игры: чьё оно и на каком основании здесь. */
export const gameArtNote = (license: string, author: string): string => {
  const what = license === 'Обложка' ? 'Обложка' : license === 'Промо' ? 'Промо-арт' : 'Кадр из игры';
  return `${what}. © ${author}; приводится в информационных целях`;
};
