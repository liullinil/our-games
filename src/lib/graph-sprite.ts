/**
 * Спрайт миниатюр для карты связей.
 *
 * На карте четыре сотни карточек, и у каждой есть фотография. Четыреста
 * отдельных картинок — это четыреста запросов при каждом открытии главной,
 * а общий хостинг на такие залпы отвечает 503. Поэтому все миниатюры лежат
 * одним листом: один запрос, один файл в кэше браузера, а карточка
 * показывает свою клетку через viewBox вложенного svg.
 *
 * Раскладку считает эта функция — и лист (`/graph-sprite.webp`), и разметка
 * карты берут её отсюда, поэтому разойтись они не могут.
 */
import type { Graph, GameNode } from './graph';

/**
 * Клетка 3:2, как и миниатюра на карточке (39×26 CSS-пикселей): на экране
 * с удвоенной плотностью это 78×52, так что клетка резкая при обычном
 * масштабе и лишь слегка мягчеет при увеличении карты. Крупнее не делаем:
 * при 84×56 лист весил 450 КБ, при 72×48 — около 300.
 */
export const CELL_W = 72;
export const CELL_H = 48;
export const COLS = 20;

export interface SpriteCell {
  x: number;
  y: number;
  /** Файл-источник на диске; его читает сборщик листа. */
  fsPath: string;
}

export interface SpriteLayout {
  cols: number;
  rows: number;
  width: number;
  height: number;
  cells: Map<string, SpriteCell>;
}

/**
 * Фотография для миниатюры: постер, иначе первый снимок галереи.
 *
 * `fsPath` — служебное поле, которое Astro кладёт в метаданные картинки из
 * коллекции; в публичном типе его нет, поэтому читаем через приведение.
 */
export function thumbSource(v: GameNode): { fsPath?: string } | null {
  if (v.data.poster) return v.data.poster as unknown as { fsPath?: string };
  const first = v.data.gallery.find((g) => g.kind === 'image');
  if (first && first.kind === 'image') return first.src as unknown as { fsPath?: string };
  return null;
}

export function spriteLayout(graph: Graph): SpriteLayout {
  // Порядок по идентификатору: лист получается одинаковым от сборки к сборке,
  // и браузеру не приходится качать его заново без причины.
  const ids = graph.gameList.map((v) => v.id).sort();
  const cells = new Map<string, SpriteCell>();
  let i = 0;
  for (const id of ids) {
    const v = graph.games.get(id);
    if (!v) continue;
    const src = thumbSource(v);
    if (!src?.fsPath) continue;
    cells.set(id, {
      x: (i % COLS) * CELL_W,
      y: Math.floor(i / COLS) * CELL_H,
      fsPath: src.fsPath,
    });
    i += 1;
  }
  const rows = Math.max(1, Math.ceil(i / COLS));
  return { cols: COLS, rows, width: COLS * CELL_W, height: rows * CELL_H, cells };
}
