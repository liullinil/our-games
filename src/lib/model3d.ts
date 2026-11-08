/**
 * 3D-модели со Sketchfab.
 *
 * Модели встраиваются проигрывателем Sketchfab, а не скачиваются: так можно
 * показать любую публичную модель, тогда как хранить файл у себя разрешает
 * только часть лицензий. Многие фанатские модели к тому же собраны из
 * ресурсов самой игры, и лицензия, под которой их выложили, автору модели
 * не принадлежит, — встраивание этот вопрос снимает: модель остаётся там,
 * куда её выложили, с подписью автора.
 */
import type { CollectionEntry } from 'astro:content';

type GalleryItem = CollectionEntry<'games'>['data']['gallery'][number];
export type ModelItem = Extract<GalleryItem, { kind: 'sketchfab' }>;

export const isModel = (item: GalleryItem): item is ModelItem => item.kind === 'sketchfab';

export const models = (gallery: GalleryItem[]): ModelItem[] => gallery.filter(isModel);

/** Страница модели на Sketchfab: туда ведёт подпись. */
export const modelUrl = (model: ModelItem): string => `https://sketchfab.com/3d-models/${model.id}`;

/**
 * Адрес проигрывателя. Подставляется в iframe только по нажатию: WebGL-сцена
 * тяжёлая, и грузить её для всех, кто просто листает статью, незачем.
 */
export const modelEmbedUrl = (model: ModelItem): string =>
  `https://sketchfab.com/models/${model.id}/embed?autostart=1&ui_theme=dark&dnt=1`;
