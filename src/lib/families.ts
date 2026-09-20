/**
 * Строки карты связей: семьи студий и общие полки.
 *
 * Игр в базе меньше двухсот, а студий — за сотню, и у половины из них ровно
 * одна игра. Если давать каждой студии свою строку, карта превращается в
 * длинный список полупустых полос, а родственные студии — GSC и выходцы из
 * неё, Maddox Games и Gaijin, Lesta и Wargaming — оказываются в разных концах.
 *
 * Поэтому строки собираются так:
 *
 * 1. Студии объединяются в семьи. Родня — это записанное в карточке студии
 *    родство (`related`) и игры, связанные друг с другом продолжением, общей
 *    основой, переизданием или серией: если «Ил-2» сделали в Maddox Games, а
 *    его продолжение — в Gaijin, эти студии лягут рядом. Общий издатель и
 *    общий движок родством не считаются — иначе «1С» склеила бы полкарты.
 * 2. Студия, у которой одна игра и нет родни, своей строки не получает: её
 *    игра уходит на общую полку своего жанра. Имя студии при этом остаётся на
 *    самой карточке, а полки лежат внизу карты.
 * 3. Семьи идут по году первой игры, студии внутри семьи — тоже.
 */
import type { Graph, GameNode } from './graph';
import { studioShort } from './graph';
import { TYPE_ORDER } from './labels';

export interface MapBand {
  /** `studio:nival` или `pool:strategy`. */
  id: string;
  kind: 'studio' | 'pool';
  /** Короткая подпись для полосы слева. */
  label: string;
  /** Полная подпись для подсказки. */
  title: string;
  familyId: string;
  studioId?: string;
  type?: string;
  gameIds: string[];
}

export interface MapFamily {
  id: string;
  studioIds: string[];
  firstYear: number;
  bands: MapBand[];
}

export interface MapRows {
  families: MapFamily[];
  /** Все полосы в порядке сверху вниз: сначала семьи, затем полки. */
  bands: MapBand[];
  /** Игра → полоса. */
  bandOf: Map<string, string>;
}

/** Подписи общих полок: коротко, чтобы влезали в узкую колонку слева. */
const POOL_LABEL: Record<string, string> = {
  strategy: 'Другие стратегии',
  rpg: 'Другие RPG',
  shooter: 'Другие шутеры',
  action: 'Другой экшен',
  adventure: 'Другие квесты',
  simulation: 'Другие симуляторы',
  racing: 'Другие гонки',
  puzzle: 'Другие казуальные',
  online: 'Другие онлайн-игры',
  other: 'Прочее',
};

const POOL_TITLE: Record<string, string> = {
  strategy: 'Стратегии студий с одной игрой',
  rpg: 'Ролевые игры студий с одной игрой',
  shooter: 'Шутеры студий с одной игрой',
  action: 'Экшен студий с одной игрой',
  adventure: 'Квесты и приключения студий с одной игрой',
  simulation: 'Симуляторы студий с одной игрой',
  racing: 'Гонки студий с одной игрой',
  puzzle: 'Головоломки и казуальные игры студий с одной игрой',
  online: 'Онлайн-игры студий с одной игрой',
  other: 'Прочие игры студий с одной игрой',
};

/** Система непересекающихся множеств: кто с кем в одной семье. */
class Union {
  private parent = new Map<string, string>();

  find(x: string): string {
    let root = x;
    while (this.parent.get(root) !== undefined && this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    if (!this.parent.has(root)) this.parent.set(root, root);
    // Сжатие пути: следующий поиск короче.
    let cur = x;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export function mapRows(graph: Graph, games: GameNode[]): MapRows {
  const shown = new Map(games.map((g) => [g.id, g]));
  const byStudio = new Map<string, GameNode[]>();
  for (const g of games) {
    const list = byStudio.get(g.studioId) ?? [];
    list.push(g);
    byStudio.set(g.studioId, list);
  }
  const rows = new Set(byStudio.keys());
  const year = (g: GameNode) => g.data.years.start;
  const firstYearOf = (studioId: string) => Math.min(...byStudio.get(studioId)!.map(year));

  const union = new Union();
  for (const s of rows) union.find(s);

  // Родство, записанное в карточках студий.
  for (const s of rows) {
    for (const kin of graph.studios.get(s)?.kin ?? []) {
      if (rows.has(kin.studioId)) union.union(s, kin.studioId);
    }
  }

  // Родство через игры: продолжение, общая основа, переиздание, серия.
  const link = (a: string, b: string) => {
    const ga = shown.get(a);
    const gb = shown.get(b);
    if (ga && gb && ga.studioId !== gb.studioId) union.union(ga.studioId, gb.studioId);
  };
  for (const g of games) {
    for (const other of [
      ...g.predecessors,
      ...g.successors,
      ...g.basedOnGames,
      ...g.basedOnBy,
      ...g.variants,
      ...g.variantOf,
      ...g.expansions,
    ]) {
      link(g.id, other);
    }
    if (g.baseGameId) link(g.id, g.baseGameId);
  }
  for (const s of graph.series.values()) {
    const ids = s.gameIds.filter((id) => shown.has(id));
    for (let i = 1; i < ids.length; i += 1) link(ids[0]!, ids[i]!);
  }

  // Семьи.
  const members = new Map<string, string[]>();
  for (const s of rows) {
    const root = union.find(s);
    const list = members.get(root) ?? [];
    list.push(s);
    members.set(root, list);
  }

  const families: MapFamily[] = [];
  const pooled = new Map<string, GameNode[]>();
  for (const studioIds of members.values()) {
    const only = studioIds.length === 1 ? byStudio.get(studioIds[0]!)! : null;
    if (only && only.length === 1) {
      // Одиночка без родни — на полку своего жанра.
      const g = only[0]!;
      const list = pooled.get(g.data.type) ?? [];
      list.push(g);
      pooled.set(g.data.type, list);
      continue;
    }
    const ordered = [...studioIds].sort(
      (a, b) => firstYearOf(a) - firstYearOf(b) || a.localeCompare(b),
    );
    const id = `family:${ordered[0]}`;
    families.push({
      id,
      studioIds: ordered,
      firstYear: Math.min(...ordered.map(firstYearOf)),
      bands: ordered.map((studioId) => {
        const node = graph.studios.get(studioId)!;
        const list = [...byStudio.get(studioId)!].sort((a, b) => year(a) - year(b));
        return {
          id: `studio:${studioId}`,
          kind: 'studio' as const,
          label: studioShort(node),
          title: node.data.names[node.data.names.length - 1]!.name,
          familyId: id,
          studioId,
          gameIds: list.map((g) => g.id),
        };
      }),
    });
  }
  families.sort((a, b) => a.firstYear - b.firstYear || a.id.localeCompare(b.id));

  const bands: MapBand[] = families.flatMap((f) => f.bands);
  for (const type of TYPE_ORDER) {
    const list = pooled.get(type);
    if (!list) continue;
    list.sort((a, b) => year(a) - year(b));
    bands.push({
      id: `pool:${type}`,
      kind: 'pool',
      label: POOL_LABEL[type] ?? type,
      title: POOL_TITLE[type] ?? type,
      familyId: `pool:${type}`,
      type,
      gameIds: list.map((g) => g.id),
    });
  }

  const bandOf = new Map<string, string>();
  for (const band of bands) for (const id of band.gameIds) bandOf.set(id, band.id);

  return { families, bands, bandOf };
}
