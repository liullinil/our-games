/**
 * Укладка полос для хронологии и карты связей.
 *
 * Машины одного завода складываются в минимальное число дорожек так, чтобы
 * отрезки выпуска не накладывались друг на друга. Жадный алгоритм: элементы
 * сортируются по году начала, каждый кладётся в первую дорожку, где предыдущий
 * отрезок уже закончился.
 */

export interface LayoutItem {
  id: string;
  start: number;
  end: number;
  group: string;
  /** Приблизительная ширина подписи в годах, чтобы текст не налезал на соседа. */
  labelYears?: number;
}

export interface PlacedItem extends LayoutItem {
  lane: number;
  /** Дорожка с учётом смещения группы: готовая координата по вертикали. */
  row: number;
}

export interface PlacedGroup {
  group: string;
  firstLane: number;
  lanes: number;
  items: PlacedItem[];
}

export interface LayoutResult {
  groups: PlacedGroup[];
  items: PlacedItem[];
  totalLanes: number;
  minYear: number;
  maxYear: number;
}

export interface LayoutOptions {
  /** Зазор между отрезками в одной дорожке, в годах. */
  gapYears?: number;
  /** Порядок групп; неуказанные идут после, по году первой машины. */
  groupOrder?: string[];
  /**
   * Порядок разбора внутри группы.
   *
   * Дорожку занимает тот, кто попросил её первым, поэтому порядок разбора и
   * решает, как лягут линии. Если разбирать машины просто по годам, преемник
   * почти всегда оказывается в чужой дорожке, и связь тянется наискось через
   * всю карту. Если же идти по родословной — предшественник, за ним сразу его
   * преемник, — тот занимает ту же дорожку, и линия получается короткой
   * и горизонтальной. Идентификаторы, которых здесь нет, разбираются после,
   * по году начала выпуска.
   */
  sequence?: string[];
}

export function packLanes(items: LayoutItem[], options: LayoutOptions = {}): LayoutResult {
  const gap = options.gapYears ?? 1;

  const byGroup = new Map<string, LayoutItem[]>();
  for (const item of items) {
    const list = byGroup.get(item.group) ?? [];
    list.push(item);
    byGroup.set(item.group, list);
  }

  const order = options.groupOrder ?? [];
  const groupNames = [...byGroup.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    const firstA = Math.min(...byGroup.get(a)!.map((i) => i.start));
    const firstB = Math.min(...byGroup.get(b)!.map((i) => i.start));
    return firstA - firstB || a.localeCompare(b, 'ru');
  });

  const groups: PlacedGroup[] = [];
  const placed: PlacedItem[] = [];
  let laneOffset = 0;
  let minYear = Number.POSITIVE_INFINITY;
  let maxYear = Number.NEGATIVE_INFINITY;

  const rank = new Map<string, number>();
  (options.sequence ?? []).forEach((id, i) => rank.set(id, i));
  // Не Infinity: у двух неуказанных разность дала бы NaN, а сравнение с NaN
  // ломает сортировку. Конечное число больше любого возможного индекса.
  const unranked = (options.sequence?.length ?? 0) + 1;
  const orderOf = (id: string) => rank.get(id) ?? unranked;

  for (const group of groupNames) {
    const list = [...byGroup.get(group)!].sort(
      (a, b) =>
        orderOf(a.id) - orderOf(b.id) || a.start - b.start || a.id.localeCompare(b.id),
    );
    /** Для каждой дорожки — год, до которого она занята. */
    const laneEnds: number[] = [];
    const groupItems: PlacedItem[] = [];

    for (const item of list) {
      const occupiedUntil = Math.max(item.end, item.start + (item.labelYears ?? 0));
      let lane = laneEnds.findIndex((end) => end + gap <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(occupiedUntil);
      } else {
        laneEnds[lane] = occupiedUntil;
      }
      const p: PlacedItem = { ...item, lane, row: laneOffset + lane };
      groupItems.push(p);
      placed.push(p);
      if (item.start < minYear) minYear = item.start;
      if (item.end > maxYear) maxYear = item.end;
    }

    groups.push({
      group,
      firstLane: laneOffset,
      lanes: Math.max(laneEnds.length, 1),
      items: groupItems,
    });
    laneOffset += Math.max(laneEnds.length, 1);
  }

  return {
    groups,
    items: placed,
    totalLanes: laneOffset,
    minYear: Number.isFinite(minYear) ? minYear : 1900,
    maxYear: Number.isFinite(maxYear) ? maxYear : new Date().getFullYear(),
  };
}

/**
 * Путь ребра карты связей: ступенька со скруглёнными углами.
 *
 * Раньше здесь была кривая Безье. На десятке машин она читалась прекрасно,
 * но на трёх сотнях карта превратилась в клубок: каждая кривая идёт по своей
 * дуге, дуги пересекаются под произвольными углами, и глазу не за что
 * зацепиться. Ступенчатая разводка — как на схеме метро или в графе коммитов:
 * короткий выход вправо, вертикаль в свободном коридоре, вход в цель. Линии
 * пересекаются под прямым углом, и в месте пересечения видно, какая из них
 * куда идёт.
 *
 * Ребро «назад» (преемник левее предка — так бывает у модификаций, начатых
 * раньше базовой машины) разводится тем же способом, только вертикаль уходит
 * левее источника.
 */
export function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  if (Math.abs(y2 - y1) < 0.5) return `M ${x1} ${y1} H ${x2}`;

  const r = Math.min(8, Math.abs(y2 - y1) / 2);
  const down = y2 > y1 ? 1 : -1;

  // Коридор для вертикали: сразу за источником, если цель правее, и с отступом
  // назад, если цель левее.
  const stub = 14;
  const gutter = x2 > x1 + stub * 2 ? x1 + stub : Math.min(x1, x2) - stub;
  const toGutter = gutter > x1 ? 1 : -1;
  const fromGutter = x2 > gutter ? 1 : -1;

  return [
    `M ${x1} ${y1}`,
    `H ${gutter - r * toGutter}`,
    `Q ${gutter} ${y1} ${gutter} ${y1 + r * down}`,
    `V ${y2 - r * down}`,
    `Q ${gutter} ${y2} ${gutter + r * fromGutter} ${y2}`,
    `H ${x2}`,
  ].join(' ');
}
