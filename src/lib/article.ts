/**
 * Раскладка статьи: где в тексте стоят кадры и ролики.
 *
 * Картинки и видео не вписываются в разметку руками — их приносят скрипты
 * (Steam, Википедия, Викисклад, поиск роликов), и автор статьи галерею не
 * трогает. Раньше из-за этого весь медиаматериал лежал одним блоком под
 * текстом, а сама статья шла сплошной простынёй. Здесь готовая разметка
 * режется по заголовкам разделов, и страница ставит по кадру в каждый —
 * как в журнале, — а геймплейный ролик попадает туда, где о самой игре и
 * говорится.
 *
 * Режем именно разметку, а не исходный Markdown: в разметке заголовок —
 * это всегда `<h2`, а в тексте «##» может оказаться внутри блока кода.
 */

/*
 * Подписи, по которым узнаём раздел про игровой процесс.
 *
 * Кириллицу приходится перечислять руками: \w в JavaScript — это латиница,
 * цифры и подчёркивание, и «игров\w* процесс» не ловило «Игровой процесс»
 * вообще никогда. Раздел не находился, и геймплейный ролик в текст не
 * попадал ни у одной статьи.
 */
const GAMEPLAY_HEADING = /игров[а-яё]* процесс|геймплей|как в это играли|устройство игры/i;

/** Ролик, который показывает саму игру, а не разговор о ней. */
const GAMEPLAY_VIDEO =
  /геймпл|игровой процесс|прохожден|летсплей|let'?s\s*play|gameplay|walkthrough|playthrough|полное прохождение/i;

export interface MediaPart<P, V> {
  /** Начало раздела: заголовок и первый абзац. */
  before: string;
  /** Остальное. Пусто, если абзаца в разделе не нашлось. */
  after: string;
  photo?: P;
  video?: V;
}

export interface ArticlePlan<P, V> {
  parts: MediaPart<P, V>[];
  /** Кадры, которым не хватило разделов: они уходят в галерею под статьёй. */
  restPhotos: P[];
  /** Ролики, не попавшие в текст. */
  restVideos: V[];
}

/**
 * Разделы статьи: вступление до первого заголовка и всё, что за каждым `<h2`.
 */
export function splitSections(html: string): string[] {
  if (!html) return [];
  return html.split(/(?=<h2[\s>])/).filter((part) => part.trim().length > 0);
}

/**
 * Место для медиа внутри раздела — после первого абзаца.
 *
 * Сразу под заголовком кадр отрывал бы заголовок от текста, а в самом конце
 * раздела он превращается в разделитель. После первого абзаца читатель уже
 * понимает, о чём речь, и картинка попадает в нужный контекст.
 */
export function splitAtFirstParagraph(html: string): { before: string; after: string } {
  const end = html.indexOf('</p>');
  if (end === -1) return { before: html, after: '' };
  return { before: html.slice(0, end + 4), after: html.slice(end + 4) };
}

/** Текст заголовка раздела — по нему ищется «Игровой процесс». */
function headingOf(section: string): string {
  const m = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  return m ? m[1]!.replace(/<[^>]*>/g, '') : '';
}

/**
 * Что и куда поставить.
 *
 * Правила простые: вступление остаётся без картинки — над ним уже стоит
 * постер; сам постер в тексте не повторяется; в раздел про игровой процесс
 * идёт геймплейный ролик, а не кадр (два медиа подряд в одном разделе
 * читателя только сбивают); остальным разделам достаётся по кадру, в том
 * порядке, в каком они лежат в галерее.
 */
export function planArticle<P extends { src: { src: string } }, V extends { title: string }>(
  html: string,
  photos: P[],
  videos: V[],
  poster: { src: string } | undefined,
): ArticlePlan<P, V> {
  const sections = splitSections(html);
  const pool = photos.filter((p) => p.src.src !== poster?.src);

  // Ролик в текст берём один: тот, что показывает игру. Нет такого — ни один.
  const video = videos.find((v) => GAMEPLAY_VIDEO.test(v.title));
  const videoAt = video
    ? sections.findIndex((s, i) => i > 0 && GAMEPLAY_HEADING.test(headingOf(s)))
    : -1;

  const parts: MediaPart<P, V>[] = [];
  let next = 0;
  for (const [i, section] of sections.entries()) {
    const { before, after } = splitAtFirstParagraph(section);
    if (i === videoAt) {
      parts.push({ before, after, video });
      continue;
    }
    // Вступление обходится без кадра: под ним постер.
    const photo = i > 0 ? pool[next] : undefined;
    if (photo) next += 1;
    parts.push({ before, after, photo });
  }

  return {
    parts,
    restPhotos: pool.slice(next),
    restVideos: videos.filter((v) => v !== video),
  };
}
