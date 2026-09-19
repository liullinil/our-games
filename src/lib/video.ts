/**
 * Ролики трёх площадок в одном виде.
 *
 * YouTube в галерее был с самого начала, но одной площадки мало: часть съёмки
 * о советской технике выкладывают только на Rutube и во «ВКонтакте», да и
 * открывается YouTube в России не у всех. Поэтому статья хранит ролики разных
 * площадок вперемешку, а разметка спрашивает у этого модуля, куда вести
 * ссылку и что грузить в проигрыватель.
 */
import type { CollectionEntry } from 'astro:content';

export const VIDEO_KINDS = ['youtube', 'rutube', 'vk'] as const;
export type VideoKind = (typeof VIDEO_KINDS)[number];

type GalleryItem = CollectionEntry<'games'>['data']['gallery'][number];
export type VideoItem = Extract<GalleryItem, { kind: VideoKind }>;

/** Ролик ли это (в отличие от фотографии). */
export const isVideo = (item: GalleryItem): item is VideoItem =>
  (VIDEO_KINDS as readonly string[]).includes(item.kind);

export const videos = (gallery: GalleryItem[]): VideoItem[] => gallery.filter(isVideo);

export const PLATFORM_LABEL: Record<VideoKind, string> = {
  youtube: 'YouTube',
  rutube: 'Rutube',
  vk: 'VK Видео',
};

/** Страница ролика: туда ведёт подпись и ссылка на странице источников. */
export function videoUrl(video: VideoItem): string {
  if (video.kind === 'rutube') return `https://rutube.ru/video/${video.id}/`;
  if (video.kind === 'vk') return `https://vkvideo.ru/video${video.id}`;
  return `https://www.youtube.com/watch?v=${video.id}`;
}

/**
 * Адрес проигрывателя. Подставляется в iframe только после нажатия: до этого
 * на странице лежит картинка, а не чужой скрипт.
 */
export function videoEmbedUrl(video: VideoItem): string {
  if (video.kind === 'rutube') return `https://rutube.ru/play/embed/${video.id}/?autoplay=1`;
  if (video.kind === 'vk') {
    const [owner, id] = video.id.split('_');
    return `https://vk.com/video_ext.php?oid=${owner}&id=${id}&hd=2&autoplay=1`;
  }
  return `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&autoplay=1`;
}
