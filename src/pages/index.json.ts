import type { APIRoute } from 'astro';
import { getGraph, studioNameAt } from '../lib/graph';
import { gameUrl } from '../lib/paths';
import { yearOf } from '../lib/labels';

/**
 * Маленький индекс для быстрого перехода в шапке: только то, что нужно
 * подсказкам. Полнотекстовый поиск живёт отдельно на /search/ (Pagefind).
 */
export const GET: APIRoute = async () => {
  const graph = await getGraph();
  const items = graph.gameList.map((v) => {
    const studio = graph.studios.get(v.studioId);
    return {
      id: v.id,
      name: v.data.name,
      alt: v.data.altNames,
      studio: studio ? studioNameAt(studio, v.data.years.start) : '',
      years: yearOf(v.data.years),
      url: gameUrl(v.id),
      article: v.data.status === 'article',
    };
  });

  return new Response(JSON.stringify(items), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
