/**
 * Виды родства между играми — то, что карта связей рисует линиями.
 *
 * Включён всегда ровно один вид: вместе они дают сотни линий, и карта
 * перестаёт читаться. Зато при наведении на игру показываются все её связи
 * сразу — выбранный вид ярко, остальные приглушённо.
 */
import type { Graph } from './graph';

export const REL_KINDS = ['predecessor', 'basedOn', 'engine', 'publisher'] as const;
export type RelKind = (typeof REL_KINDS)[number];

export const REL_LABEL: Record<RelKind, string> = {
  predecessor: 'Продолжение',
  basedOn: 'Одна серия',
  engine: 'Общий движок',
  publisher: 'Общий издатель',
};

/** Ребро карты: от старшей игры к младшей. */
export interface RelEdge {
  from: string;
  to: string;
  kind: RelKind;
}

/**
 * Цепочка вместо полного перебора.
 *
 * Общий движок или издатель связывает все игры со всеми: у «1С» изданных игр
 * десятки, а это сотни линий из одного узла. Поэтому группу выстраиваем по
 * годам и соединяем соседей — получается нитка, по которой видно, как движок
 * или издатель шёл от игры к игре.
 */
function chainPairs(ids: string[], order: (id: string) => number): [string, string][] {
  const known = [...new Set(ids)].sort((a, b) => order(a) - order(b));
  const out: [string, string][] = [];
  for (let i = 1; i < known.length; i += 1) out.push([known[i - 1]!, known[i]!]);
  return out;
}

/**
 * Все рёбра карты для заданного набора игр.
 *
 * `fold` переносит связи спрятанных дополнений на их базовую игру: само
 * дополнение живёт внутри карточки базовой, а его родство должно остаться
 * видимым.
 */
export function relationEdges(
  graph: Graph,
  visible: Set<string>,
  fold: Map<string, string> = new Map(),
): RelEdge[] {
  const at = (id: string) => fold.get(id) ?? id;
  const on = (id: string) => visible.has(at(id));
  const edges: RelEdge[] = [];
  const seen = new Set<string>();
  const add = (from: string, to: string, kind: RelKind) => {
    const a = at(from);
    const b = at(to);
    if (a === b || !visible.has(a) || !visible.has(b)) return;
    const key = `${kind}:${a}>${b}`;
    const back = `${kind}:${b}>${a}`;
    if (seen.has(key) || seen.has(back)) return;
    seen.add(key);
    edges.push({ from: a, to: b, kind });
  };

  const year = (id: string) => graph.games.get(id)?.data.years.start ?? 0;

  for (const g of graph.games.values()) {
    if (!on(g.id)) continue;
    for (const p of g.predecessors) add(p, g.id, 'predecessor');
    for (const b of g.basedOnGames) add(b, g.id, 'basedOn');
    for (const m of g.variants) add(g.id, m, 'basedOn');
    for (const m of g.expansions) add(g.id, m, 'basedOn');
  }

  const linkChain = (ids: string[], kind: RelKind) => {
    for (const [a, b] of chainPairs(ids.filter(on).map(at), year)) add(a, b, kind);
  };

  // Серия — тоже общая основа: игры одной серии связаны по определению.
  for (const s of graph.series.values()) linkChain(s.gameIds, 'basedOn');
  for (const engine of graph.engines.values()) linkChain(engine.gameIds, 'engine');
  for (const studio of graph.studioList) linkChain(studio.publishedIds, 'publisher');

  return edges;
}

/** Все соседи игры по каждому виду родства — для подсветки при наведении. */
export function neighbourMap(
  graph: Graph,
  visible: Set<string>,
  fold: Map<string, string> = new Map(),
): Record<string, Record<RelKind, string[]>> {
  const at = (id: string) => fold.get(id) ?? id;
  const out: Record<string, Record<RelKind, string[]>> = {};
  const bucket = (id: string) =>
    (out[id] ??= { predecessor: [], basedOn: [], engine: [], publisher: [] });
  const pair = (a0: string, b0: string, kind: RelKind) => {
    const a = at(a0);
    const b = at(b0);
    if (a === b || !visible.has(a) || !visible.has(b)) return;
    const la = bucket(a)[kind];
    const lb = bucket(b)[kind];
    if (!la.includes(b)) la.push(b);
    if (!lb.includes(a)) lb.push(a);
  };

  for (const g of graph.games.values()) {
    if (!visible.has(at(g.id))) continue;
    bucket(at(g.id));
    for (const p of g.predecessors) pair(p, g.id, 'predecessor');
    for (const s of g.successors) pair(g.id, s, 'predecessor');
    for (const b of g.basedOnGames) pair(b, g.id, 'basedOn');
    for (const b of g.basedOnBy) pair(g.id, b, 'basedOn');
    for (const m of [...g.variants, ...g.expansions]) pair(g.id, m, 'basedOn');
    for (const m of [...g.variantOf]) pair(m, g.id, 'basedOn');
  }

  const all = (ids: string[], kind: RelKind) => {
    const list = [...new Set(ids.map(at))].filter((id) => visible.has(id));
    for (const a of list) for (const b of list) pair(a, b, kind);
  };

  for (const s of graph.series.values()) all(s.gameIds, 'basedOn');
  for (const engine of graph.engines.values()) all(engine.gameIds, 'engine');
  for (const studio of graph.studioList) all(studio.publishedIds, 'publisher');

  return out;
}

/** Игры, у которых на карте не оказалось ни одной связи. */
export function lonelyNodes(neighbours: Record<string, Record<RelKind, string[]>>): string[] {
  return Object.entries(neighbours)
    .filter(([, kinds]) => Object.values(kinds).every((list) => list.length === 0))
    .map(([id]) => id);
}

/** Соседи одной игры по каждому виду родства. */
export function neighboursOf(graph: Graph, id: string): Record<RelKind, string[]> {
  const g = graph.games.get(id);
  const out: Record<RelKind, string[]> = {
    predecessor: [],
    basedOn: [],
    engine: [],
    publisher: [],
  };
  if (!g) return out;

  const put = (kind: RelKind, other: string) => {
    if (other !== id && graph.games.has(other) && !out[kind].includes(other)) {
      out[kind].push(other);
    }
  };

  for (const x of [...g.predecessors, ...g.successors]) put('predecessor', x);
  for (const x of [...g.basedOnGames, ...g.basedOnBy]) put('basedOn', x);
  if (g.seriesId) {
    for (const x of graph.series.get(g.seriesId)?.gameIds ?? []) put('basedOn', x);
  }
  for (const x of [...g.variants, ...g.expansions, ...g.variantOf]) put('basedOn', x);
  if (g.baseGameId) put('basedOn', g.baseGameId);
  for (const eid of g.engineIds) {
    for (const x of graph.engines.get(eid)?.gameIds ?? []) put('engine', x);
  }
  for (const pid of g.publisherIds) {
    for (const x of graph.studios.get(pid)?.publishedIds ?? []) put('publisher', x);
  }

  return out;
}
