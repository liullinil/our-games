import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Граф связей строится один раз за сборку и используется всеми страницами:
 * крошками, деревом каталога, картой связей, блоком «Соседи».
 *
 * Здесь же проверяются ссылки между коллекциями. Astro сам по себе не роняет
 * сборку на висячей ссылке (getEntry просто вернёт undefined), поэтому проверка
 * наша: собираем все проблемы и бросаем исключение со списком.
 */

export type EraId = string;

export interface EraNode {
  id: EraId;
  data: CollectionEntry<'eras'>['data'];
}

export interface ExternalPrototype {
  name: string;
  maker?: string;
  country?: string;
  year?: number;
  url?: string;
  note?: string;
}

export interface GameNode {
  id: string;
  entry: CollectionEntry<'games'>;
  data: CollectionEntry<'games'>['data'];
  era: EraId;
  studioId: string;
  publisherIds: string[];
  seriesId: string | null;
  /** Заданы автором. */
  predecessors: string[];
  basedOnGames: string[];
  basedOnExternal: ExternalPrototype[];
  variants: string[];
  baseGameId: string | null;
  engineIds: string[];
  platformIds: string[];
  /** Выведены автоматически из встречных ссылок. */
  successors: string[];
  basedOnBy: string[];
  variantOf: string[];
  /** Дополнения и переиздания, у которых эта игра — базовая. */
  expansions: string[];
}

/**
 * Родственная связь между студиями.
 *
 * `own` — связь записана в карточке этой студии («основана выходцами из»),
 * `mirror` — выведена из карточки другой («выходцы основали»). Вид один и
 * тот же, направление разное: подпись выбирается по нему.
 */
export interface StudioKin {
  studioId: string;
  kind: 'spinoff' | 'parent' | 'successor' | 'sibling';
  note?: string;
  side: 'own' | 'mirror';
}

export interface StudioNode {
  id: string;
  entry: CollectionEntry<'studios'>;
  data: CollectionEntry<'studios'>['data'];
  /** Разработанные игры. */
  gameIds: string[];
  /** Изданные игры. */
  publishedIds: string[];
  seriesIds: string[];
  /** Движки собственной разработки. */
  engineIds: string[];
  /** Родственные студии, с обеих сторон. */
  kin: StudioKin[];
}

export interface SeriesNode {
  id: string;
  entry: CollectionEntry<'series'>;
  data: CollectionEntry<'series'>['data'];
  studioId: string | null;
  gameIds: string[];
}

export interface EngineNode {
  id: string;
  entry: CollectionEntry<'engines'>;
  data: CollectionEntry<'engines'>['data'];
  gameIds: string[];
}

export interface PlatformNode {
  id: string;
  entry: CollectionEntry<'platforms'>;
  data: CollectionEntry<'platforms'>['data'];
  gameIds: string[];
}

export interface Graph {
  games: Map<string, GameNode>;
  /** Все игры, отсортированные по году выхода, затем по имени. */
  gameList: GameNode[];
  studios: Map<string, StudioNode>;
  studioList: StudioNode[];
  series: Map<string, SeriesNode>;
  seriesList: SeriesNode[];
  engines: Map<string, EngineNode>;
  engineList: EngineNode[];
  platforms: Map<string, PlatformNode>;
  platformList: PlatformNode[];
  eras: Map<EraId, EraNode>;
  /** Эпохи по возрастанию года начала. */
  eraList: EraNode[];
}

let graphPromise: Promise<Graph> | null = null;

/** Граф строится один раз за процесс сборки. */
export function getGraph(): Promise<Graph> {
  if (!graphPromise) graphPromise = buildGraph();
  return graphPromise;
}

const byYearThenName = (a: GameNode, b: GameNode) =>
  a.data.years.start - b.data.years.start || a.data.name.localeCompare(b.data.name, 'ru');

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

async function buildGraph(): Promise<Graph> {
  const [gameEntries, studioEntries, seriesEntries, engineEntries, platformEntries, eraEntries] =
    await Promise.all([
      getCollection('games'),
      getCollection('studios'),
      getCollection('series'),
      getCollection('engines'),
      getCollection('platforms'),
      getCollection('eras'),
    ]);

  const problems: string[] = [];

  const eraList: EraNode[] = eraEntries
    .map((entry) => ({ id: entry.id, data: entry.data }))
    .sort((a, b) => a.data.from - b.data.from);
  const eras = new Map(eraList.map((era) => [era.id, era]));

  if (eraList.length === 0) problems.push('Не найдено ни одной эпохи в src/content/eras.');

  const studios = new Map<string, StudioNode>(
    studioEntries.map((entry) => [
      entry.id,
      {
        id: entry.id,
        entry,
        data: entry.data,
        gameIds: [],
        publishedIds: [],
        seriesIds: [],
        engineIds: [],
        kin: [],
      },
    ]),
  );

  // Родство студий: записано с одной стороны, видно с обеих.
  for (const s of studios.values()) {
    for (const r of s.data.related) {
      const other = studios.get(r.studio.id);
      if (!other) {
        problems.push(`studios/${s.id}: родственная студия «${r.studio.id}» не найдена`);
        continue;
      }
      if (other.id === s.id) {
        problems.push(`studios/${s.id}: студия указана родственной самой себе`);
        continue;
      }
      s.kin.push({ studioId: other.id, kind: r.kind, note: r.note, side: 'own' });
      if (!other.kin.some((k) => k.studioId === s.id)) {
        other.kin.push({ studioId: s.id, kind: r.kind, note: r.note, side: 'mirror' });
      }
    }
  }

  const series = new Map<string, SeriesNode>(
    seriesEntries.map((entry) => [
      entry.id,
      {
        id: entry.id,
        entry,
        data: entry.data,
        studioId: entry.data.studio?.id ?? null,
        gameIds: [],
      },
    ]),
  );

  const engines = new Map<string, EngineNode>(
    engineEntries.map((entry) => [entry.id, { id: entry.id, entry, data: entry.data, gameIds: [] }]),
  );

  const platforms = new Map<string, PlatformNode>(
    platformEntries.map((entry) => [entry.id, { id: entry.id, entry, data: entry.data, gameIds: [] }]),
  );

  const games = new Map<string, GameNode>();
  for (const entry of gameEntries) {
    const d = entry.data;
    const basedOnGames: string[] = [];
    const basedOnExternal: ExternalPrototype[] = [];
    for (const item of d.basedOn) {
      if (isReference(item)) basedOnGames.push(item.id);
      else basedOnExternal.push(item as ExternalPrototype);
    }
    games.set(entry.id, {
      id: entry.id,
      entry,
      data: d,
      era: d.era ?? eraForYear(d.years.start, eraList),
      studioId: d.developer.id,
      publisherIds: d.publishers.map((r) => r.id),
      seriesId: d.series?.id ?? null,
      predecessors: d.predecessors.map((r) => r.id),
      basedOnGames,
      basedOnExternal,
      variants: d.variants.map((r) => r.id),
      baseGameId: d.baseGame?.id ?? null,
      engineIds: d.engines.map((r) => r.id),
      platformIds: d.platforms.map((r) => r.id),
      successors: [],
      basedOnBy: [],
      variantOf: [],
      expansions: [],
    });
  }

  // Проверка ссылок и сбор встречных связей.
  for (const g of games.values()) {
    const where = `games/${g.id}`;

    if (!studios.has(g.studioId)) {
      problems.push(`${where}: студия «${g.studioId}» не найдена в studios`);
    } else {
      studios.get(g.studioId)!.gameIds.push(g.id);
    }

    for (const pid of g.publisherIds) {
      const p = studios.get(pid);
      if (!p) problems.push(`${where}: издатель «${pid}» не найден в studios`);
      else pushUnique(p.publishedIds, g.id);
    }

    if (g.seriesId) {
      const s = series.get(g.seriesId);
      if (!s) problems.push(`${where}: серия «${g.seriesId}» не найдена в series`);
      else s.gameIds.push(g.id);
    }

    if (g.baseGameId) {
      const base = games.get(g.baseGameId);
      if (!base) problems.push(`${where}: базовая игра «${g.baseGameId}» не найдена`);
      else {
        pushUnique(g.variantOf, base.id);
        pushUnique(base.expansions, g.id);
      }
    }
    if (g.data.kind !== 'game' && !g.baseGameId) {
      problems.push(`${where}: kind: ${g.data.kind}, но не указана baseGame`);
    }

    for (const pid of g.predecessors) {
      const prev = games.get(pid);
      if (!prev) problems.push(`${where}: предшественник «${pid}» не найден`);
      else pushUnique(prev.successors, g.id);
    }

    for (const bid of g.basedOnGames) {
      const base = games.get(bid);
      if (!base) problems.push(`${where}: basedOn «${bid}» не найден`);
      else pushUnique(base.basedOnBy, g.id);
    }

    for (const vid of g.variants) {
      const variant = games.get(vid);
      if (!variant) problems.push(`${where}: вариант «${vid}» не найден`);
      else pushUnique(variant.variantOf, g.id);
    }

    for (const eid of g.engineIds) {
      const engine = engines.get(eid);
      if (!engine) problems.push(`${where}: движок «${eid}» не найден в engines`);
      else engine.gameIds.push(g.id);
    }

    for (const pid of g.platformIds) {
      const platform = platforms.get(pid);
      if (!platform) problems.push(`${where}: платформа «${pid}» не найдена в platforms`);
      else platform.gameIds.push(g.id);
    }

    if (!eras.has(g.era)) {
      problems.push(`${where}: эпоха «${g.era}» не найдена в eras`);
    }

    for (const f of g.data.availability.files) {
      if (!/^[\w.-]+$/.test(f.file)) {
        problems.push(`${where}: имя файла «${f.file}» должно быть без путей и пробелов`);
      }
    }
  }

  for (const s of series.values()) {
    if (s.studioId) {
      if (!studios.has(s.studioId)) problems.push(`series/${s.id}: студия «${s.studioId}» не найдена`);
      else studios.get(s.studioId)!.seriesIds.push(s.id);
    }
  }

  for (const engine of engines.values()) {
    const dev = engine.data.developer;
    if (dev) {
      if (!studios.has(dev.id)) problems.push(`engines/${engine.id}: студия «${dev.id}» не найдена`);
      else studios.get(dev.id)!.engineIds.push(engine.id);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Ошибки в связях контента (${problems.length}):\n  - ${problems.join('\n  - ')}\n` +
        'Проверьте идентификаторы в frontmatter: они совпадают с именем папки или файла в src/content.',
    );
  }

  const gameList = [...games.values()].sort(byYearThenName);
  const sortIds = (ids: string[]) => ids.sort((a, b) => byYearThenName(games.get(a)!, games.get(b)!));

  for (const g of games.values()) {
    sortIds(g.successors);
    sortIds(g.basedOnBy);
    sortIds(g.expansions);
  }
  for (const s of studios.values()) {
    sortIds(s.gameIds);
    sortIds(s.publishedIds);
  }
  for (const s of series.values()) sortIds(s.gameIds);
  for (const e of engines.values()) sortIds(e.gameIds);
  for (const p of platforms.values()) sortIds(p.gameIds);

  const studioList = [...studios.values()].sort((a, b) => {
    // Чистые издатели без своих игр идут после разработчиков: на карте
    // связей строки — это студии-разработчики.
    const onlyPubA = a.gameIds.length === 0 ? 1 : 0;
    const onlyPubB = b.gameIds.length === 0 ? 1 : 0;
    if (onlyPubA !== onlyPubB) return onlyPubA - onlyPubB;
    const firstA = a.gameIds.length ? games.get(a.gameIds[0]!)!.data.years.start : a.data.founded;
    const firstB = b.gameIds.length ? games.get(b.gameIds[0]!)!.data.years.start : b.data.founded;
    return firstA - firstB || a.data.city.localeCompare(b.data.city, 'ru');
  });

  const seriesList = [...series.values()].sort((a, b) => {
    const firstA = a.gameIds.length ? games.get(a.gameIds[0]!)!.data.years.start : 9999;
    const firstB = b.gameIds.length ? games.get(b.gameIds[0]!)!.data.years.start : 9999;
    return firstA - firstB || a.data.name.localeCompare(b.data.name, 'ru');
  });

  const engineList = [...engines.values()].sort(
    (a, b) =>
      (a.data.years.start ?? 9999) - (b.data.years.start ?? 9999) ||
      a.data.name.localeCompare(b.data.name, 'ru'),
  );

  const platformList = [...platforms.values()].sort(
    (a, b) => a.data.years.start - b.data.years.start || a.data.name.localeCompare(b.data.name, 'ru'),
  );

  return {
    games,
    gameList,
    studios,
    studioList,
    series,
    seriesList,
    engines,
    engineList,
    platforms,
    platformList,
    eras,
    eraList,
  };
}

function isReference(value: unknown): value is { collection: string; id: string } {
  return typeof value === 'object' && value !== null && 'id' in value && 'collection' in value;
}

/** Эпоха по году: from включительно, to исключительно. */
export function eraForYear(year: number, eraList: EraNode[]): EraId {
  let current = eraList[0]?.id ?? 'twenties';
  for (const era of eraList) {
    if (year >= era.data.from) current = era.id;
  }
  return current;
}

/** Название студии на конкретный год («Никита» → Nikita Online). */
export function studioNameAt(node: StudioNode, year: number): string {
  const names = [...node.data.names].sort((a, b) => a.from - b.from);
  let current = names[0];
  for (const n of names) {
    if (year >= n.from) current = n;
  }
  return current?.short ?? node.data.names[0]!.short;
}

/** Текущее (последнее) короткое имя студии. */
export function studioShort(node: StudioNode): string {
  const names = [...node.data.names].sort((a, b) => a.from - b.from);
  return names[names.length - 1]!.short;
}

/**
 * Родословная игры: все предки и все потомки по связям «предшественник»,
 * «на основе», «дополнение». Используется для подсветки цепочки на карте.
 */
export function lineage(graph: Graph, gameId: string): Set<string> {
  const result = new Set<string>([gameId]);

  const walkUp = (id: string) => {
    const g = graph.games.get(id);
    if (!g) return;
    for (const next of [...g.predecessors, ...g.basedOnGames, ...g.variantOf]) {
      if (!result.has(next)) {
        result.add(next);
        walkUp(next);
      }
    }
  };
  const walkDown = (id: string) => {
    const g = graph.games.get(id);
    if (!g) return;
    for (const next of [...g.successors, ...g.basedOnBy, ...g.expansions, ...g.variants]) {
      if (!result.has(next)) {
        result.add(next);
        walkDown(next);
      }
    }
  };
  walkUp(gameId);
  walkDown(gameId);
  return result;
}

/** Игры на том же движке. */
export function sharingEngines(graph: Graph, gameId: string): string[] {
  const g = graph.games.get(gameId);
  if (!g) return [];
  const out = new Set<string>();
  for (const eid of g.engineIds) {
    const engine = graph.engines.get(eid);
    if (!engine) continue;
    for (const id of engine.gameIds) if (id !== gameId) out.add(id);
  }
  return [...out];
}

/** Игры того же издателя. */
export function sharingPublishers(graph: Graph, gameId: string): string[] {
  const g = graph.games.get(gameId);
  if (!g) return [];
  const out = new Set<string>();
  for (const pid of g.publisherIds) {
    const p = graph.studios.get(pid);
    if (!p) continue;
    for (const id of p.publishedIds) if (id !== gameId) out.add(id);
  }
  return [...out];
}

/** Игры на той же платформе, кроме ПК: там окажется почти всё. */
export function sharingPlatforms(graph: Graph, gameId: string): string[] {
  const g = graph.games.get(gameId);
  if (!g) return [];
  const out = new Set<string>();
  for (const pid of g.platformIds) {
    const p = graph.platforms.get(pid);
    if (!p || p.data.kind === 'pc') continue;
    for (const id of p.gameIds) if (id !== gameId) out.add(id);
  }
  return [...out];
}

/** Дерево каталога: жанр → студия → серия → игры. */
export function treeByType(graph: Graph, type: string) {
  const studios = graph.studioList
    .map((s) => {
      const gameIds = s.gameIds.filter((id) => graph.games.get(id)!.data.type === type);
      if (gameIds.length === 0) return null;
      const inSeries = new Map<string, string[]>();
      const loose: string[] = [];
      for (const id of gameIds) {
        const g = graph.games.get(id)!;
        if (g.data.kind !== 'game') continue;
        if (g.seriesId) {
          const list = inSeries.get(g.seriesId) ?? [];
          list.push(id);
          inSeries.set(g.seriesId, list);
        } else loose.push(id);
      }
      return {
        studio: s,
        series: [...inSeries.entries()].map(([seriesId, ids]) => ({
          series: graph.series.get(seriesId)!,
          gameIds: ids,
        })),
        gameIds: loose,
        total: gameIds.length,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return studios;
}
