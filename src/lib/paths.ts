/**
 * Адреса страниц.
 *
 * Сайт живёт в подпапке (/our-games/ на GitHub Pages), а Astro не добавляет
 * base к ссылкам на файлы из public/. Поэтому каждый href, src и адрес
 * iframe собираем через withBase.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function withBase(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}

export interface SitePaths {
  /** Приставка версии сайта; у настольной пустая. */
  prefix: string;
  at(path: string): string;
  home: string;
  gameUrl(id: string): string;
  studioUrl(id: string): string;
  seriesUrl(id: string): string;
  engineUrl(id: string): string;
  platformUrl(id: string): string;
  eraUrl(id: string): string;
  catalogUrl(type?: string): string;
  graphUrl: string;
  studiosUrl: string;
  enginesUrl: string;
  platformsUrl: string;
  erasUrl: string;
  searchUrl: string;
  progressUrl: string;
  aboutUrl: string;
  licensesUrl: string;
  /** Начало адреса игры без идентификатора: скриптам, которые строят ссылки сами. */
  gameBase: string;
}

export function makePaths(prefix: string): SitePaths {
  const at = (path: string) => withBase(`${prefix}/${path.replace(/^\/+/, '')}`);
  return {
    prefix,
    at,
    home: at('/'),
    gameUrl: (id) => at(`games/${id}/`),
    studioUrl: (id) => at(`studios/${id}/`),
    seriesUrl: (id) => at(`series/${id}/`),
    engineUrl: (id) => at(`engines/${id}/`),
    platformUrl: (id) => at(`platforms/${id}/`),
    eraUrl: (id) => at(`eras/${id}/`),
    catalogUrl: (type) => (type ? at(`catalog/${type}/`) : at('catalog/')),
    graphUrl: at('graph/'),
    studiosUrl: at('studios/'),
    enginesUrl: at('engines/'),
    platformsUrl: at('platforms/'),
    erasUrl: at('eras/'),
    searchUrl: at('search/'),
    progressUrl: at('progress/'),
    aboutUrl: at('about/'),
    licensesUrl: at('licenses/'),
    gameBase: at('games/'),
  };
}

export const desktopPaths = makePaths('');

export const gameUrl = desktopPaths.gameUrl;
export const studioUrl = desktopPaths.studioUrl;
export const seriesUrl = desktopPaths.seriesUrl;
export const engineUrl = desktopPaths.engineUrl;
export const platformUrl = desktopPaths.platformUrl;
export const eraUrl = desktopPaths.eraUrl;
export const catalogUrl = desktopPaths.catalogUrl;
