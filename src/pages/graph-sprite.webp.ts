import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getGraph } from '../lib/graph';
import { spriteLayout, CELL_W, CELL_H } from '../lib/graph-sprite';

/**
 * Лист миниатюр для карты связей: все фотографии машин в одной картинке.
 *
 * Собирается при сборке из тех же файлов, что и постеры статей, по раскладке
 * из `lib/graph-sprite.ts`. Клетки без фотографии остаются серыми — карта их
 * и не показывает, у таких машин вместо миниатюры буквенный знак.
 */
let building: Promise<Buffer> | null = null;

async function build(): Promise<Buffer> {
  const graph = await getGraph();
  const layout = spriteLayout(graph);
  const entries = [...layout.cells.entries()];
  const tiles: { input: Buffer; left: number; top: number }[] = [];

  // По несколько файлов разом: исходники — полноразмерные снимки, и читать
  // четыре сотни по одному было бы медленно, а все сразу — прожорливо.
  const POOL = 6;
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < entries.length) {
      const [id, cell] = entries[next++]!;
      try {
        // rotate() без аргументов разворачивает кадр по EXIF: снимки с
        // телефона иначе ложатся боком.
        const input = await sharp(cell.fsPath)
          .rotate()
          .resize(CELL_W, CELL_H, { fit: 'cover' })
          .toBuffer();
        tiles.push({ input, left: cell.x, top: cell.y });
      } catch (e) {
        failed += 1;
        console.warn(`graph-sprite: ${id} — не прочитан ${cell.fsPath}: ${(e as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: POOL }, worker));

  const out = await sharp({
    create: { width: layout.width, height: layout.height, channels: 3, background: '#e6e9ed' },
  })
    .composite(tiles)
    .webp({ quality: 62 })
    .toBuffer();
  console.log(
    `graph-sprite: ${tiles.length} миниатюр${failed ? `, не прочитано ${failed}` : ''}, ${layout.width}×${layout.height}, ${Math.round(out.length / 1024)} КБ`,
  );
  return out;
}

export const GET: APIRoute = async () => {
  building ??= build();
  const bytes = await building;
  return new Response(new Uint8Array(bytes), {
    headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' },
  });
};
