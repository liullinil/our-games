import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getGraph, studioNameAt } from '../lib/graph';
import { gameUrl } from '../lib/paths';
import { yearOf, CLASS_LABEL } from '../lib/labels';
import { isVideo } from '../lib/video';

/**
 * Данные карточек предпросмотра для карты связей.
 *
 * Отдельным файлом, а не в разметке страницы: описания с адресами миниатюр
 * нужны только после нажатия. Скрипт запрашивает файл один раз.
 *
 * Ключи короткие, потому что повторяются сотни раз:
 * n — название, y — годы, p — студия, c — поджанр, u — адрес статьи,
 * s — краткое описание, a — есть статья, v — роликов, f — скриншотов,
 * t — миниатюра.
 */
export const GET: APIRoute = async () => {
  const graph = await getGraph();
  const out: Record<string, unknown> = {};

  for (const g of graph.gameList) {
    const studio = graph.studios.get(g.studioId);
    const shots = g.data.gallery.filter((x) => x.kind === 'image').length;
    const videos = g.data.gallery.filter(isVideo).length;

    const first = g.data.gallery.find((x) => x.kind === 'image');
    const source = g.data.poster ?? (first && first.kind === 'image' ? first.src : null);
    let thumb: string | undefined;
    if (source) {
      const image = await getImage({ src: source, width: 320, format: 'webp' });
      thumb = image.src;
    }

    out[g.id] = {
      n: g.data.name,
      y: yearOf(g.data.years),
      p: studio ? studioNameAt(studio, g.data.years.start) : '',
      c: CLASS_LABEL[g.data.class] ?? '',
      u: gameUrl(g.id),
      s: g.data.summary,
      a: g.data.status === 'article' ? 1 : 0,
      v: videos,
      f: shots + (g.data.poster ? 1 : 0),
      ...(thumb ? { t: thumb } : {}),
    };
  }

  return new Response(JSON.stringify(out), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
