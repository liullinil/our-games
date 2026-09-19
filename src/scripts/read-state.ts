/**
 * Отметки о прочитанных статьях.
 *
 * Сайт статический, без бэкенда, поэтому прогресс лежит в localStorage этого
 * браузера. Перенести его на другое устройство можно через страницу /progress/:
 * экспорт и импорт обычным текстом JSON.
 */

const KEY = 'igrostroy:progress';
const HIDE_KEY = 'igrostroy:hideRead';
/** Сколько секунд статья должна быть открыта, прежде чем считать её прочитанной. */
const MIN_SECONDS = 10;

export interface Progress {
  v: 1;
  read: Record<string, number>;
  last?: { id: string; title: string; url: string; y: number; t: number };
  hideRead?: boolean;
}

const empty = (): Progress => ({ v: 1, read: {} });

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Progress;
    if (!parsed || parsed.v !== 1 || typeof parsed.read !== 'object') return empty();
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* приватный режим или переполнение — молча продолжаем */
  }
}

/**
 * Сообщаем странице, что список прочитанного изменился.
 *
 * Карта связей по нему решает, какие линии скрыть, а блок «Продолжить чтение» —
 * что предложить следующим. Оба живут в других модулях и до этого события
 * узнать об изменении не могли.
 */
const announce = () => document.dispatchEvent(new CustomEvent('igrostroy:progress'));

export const isRead = (id: string): boolean => Boolean(load().read[id]);

export function markRead(id: string): void {
  const p = load();
  if (!p.read[id]) {
    p.read[id] = Math.floor(Date.now() / 1000);
    save(p);
  }
  applyBadges();
  announce();
}

export function unmark(id: string): void {
  const p = load();
  delete p.read[id];
  save(p);
  applyBadges();
  announce();
}

export function toggle(id: string): boolean {
  const now = isRead(id);
  if (now) unmark(id);
  else markRead(id);
  return !now;
}

export const all = (): Progress => load();

export const exportJson = (): string => JSON.stringify(load(), null, 2);

/** Импорт объединяет отметки: побеждает более ранняя дата прочтения. */
export function importJson(text: string): { added: number; total: number } {
  const incoming = JSON.parse(text) as Progress;
  if (!incoming || incoming.v !== 1 || typeof incoming.read !== 'object') {
    throw new Error('Не похоже на файл прогресса: нет поля v: 1 и списка прочитанного.');
  }
  const current = load();
  let added = 0;
  for (const [id, ts] of Object.entries(incoming.read)) {
    if (typeof ts !== 'number') continue;
    if (!current.read[id]) added += 1;
    current.read[id] = current.read[id] ? Math.min(current.read[id]!, ts) : ts;
  }
  if (incoming.last && (!current.last || incoming.last.t > current.last.t)) {
    current.last = incoming.last;
  }
  save(current);
  applyBadges();
  announce();
  return { added, total: Object.keys(current.read).length };
}

export function reset(): void {
  save(empty());
  applyBadges();
  announce();
}

// ── «Скрыть прочитанные» ─────────────────────────────────────────────────
/*
 * Одна настройка на весь сайт: флажок в каталоге и кнопка на карте связей
 * меняют одно и то же значение, а состояние на <html> ставится ещё
 * инлайн-скриптом в <head>, чтобы список не мигал прочитанными.
 */

export function isHideRead(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setHideRead(on: boolean): void {
  document.documentElement.classList.toggle('hide-read', on);
  try {
    localStorage.setItem(HIDE_KEY, on ? '1' : '0');
  } catch {
    /* нет доступа к хранилищу */
  }
  document.dispatchEvent(new CustomEvent('igrostroy:hideread'));
}

/** Проставляет класс is-read и заполняет счётчики «Прочитано N из M». */
export function applyBadges(): void {
  const read = load().read;

  document.querySelectorAll<HTMLElement>('[data-game-id]').forEach((el) => {
    const id = el.dataset.gameId!;
    el.classList.toggle('is-read', Boolean(read[id]));
  });

  document.querySelectorAll<HTMLElement>('[data-progress]').forEach((counter) => {
    /*
     * Счётчик по всему сайту, а не по странице.
     *
     * На главной в разметке лежат последние шесть статей, и счётчик честно
     * сообщал «прочитано 0 из 6» — при трёх с половиной сотнях статей это
     * выглядело недоразумением. Там, где нужно число по всей энциклопедии,
     * страница передаёт его сама.
     */
    const siteTotal = Number(counter.dataset.progressTotal);
    if (siteTotal > 0) {
      const done = Object.keys(read).length;
      counter.textContent = `Прочитано ${Math.min(done, siteTotal)} из ${siteTotal}`;
      counter.hidden = false;
      return;
    }

    const scopeSelector = counter.dataset.progressScope;
    const scope = scopeSelector ? document.querySelector(scopeSelector) : document;
    if (!scope) return;
    // Считаем только игры со статьёй: карточки реестра читать нечего.
    const items = scope.querySelectorAll<HTMLElement>('[data-game-id][data-has-article="1"]');
    const total = items.length;
    let done = 0;
    items.forEach((el) => {
      if (read[el.dataset.gameId!]) done += 1;
    });
    counter.textContent = total ? `Прочитано ${done} из ${total}` : '';
    counter.hidden = total === 0;
  });

  document.querySelectorAll<HTMLElement>('[data-read-toggle]').forEach((button) => {
    const id = button.dataset.readToggle!;
    const done = Boolean(read[id]);
    button.setAttribute('aria-pressed', done ? 'true' : 'false');
    const label = button.querySelector('[data-read-label]') ?? button;
    label.textContent = done ? 'Прочитано' : 'Отметить прочитанным';
  });
}

function setupToggles(): void {
  document.querySelectorAll<HTMLElement>('[data-read-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggle(button.dataset.readToggle!));
  });

  const hideBox = document.querySelector<HTMLInputElement>('[data-hide-read]');
  // Флажок каталога; кнопка карты — тоже [data-hide-read], но это <button>,
  // и своим состоянием она занимается сама.
  if (hideBox instanceof HTMLInputElement) {
    hideBox.checked = isHideRead();
    document.documentElement.classList.toggle('hide-read', hideBox.checked);
    hideBox.addEventListener('change', () => setHideRead(hideBox.checked));
    document.addEventListener('igrostroy:hideread', () => {
      hideBox.checked = isHideRead();
    });
  }
}

/** Автоотметка: дочитал до конца статьи и провёл на странице хотя бы 10 секунд. */
function setupAutoMark(): void {
  const sentinel = document.querySelector<HTMLElement>('[data-read-sentinel]');
  if (!sentinel) return;
  const id = sentinel.dataset.readSentinel;
  if (!id) return;

  const openedAt = Date.now();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (Date.now() - openedAt < MIN_SECONDS * 1000) return;
      markRead(id);
      observer.disconnect();
    }
  });
  observer.observe(sentinel);
}

/** Запоминаем, где читатель остановился, чтобы предложить «Продолжить». */
function setupLastPosition(): void {
  const article = document.querySelector<HTMLElement>('[data-article-id]');
  if (!article) return;
  const id = article.dataset.articleId!;
  const title = article.dataset.articleTitle ?? id;
  const url = location.pathname;

  let queued = false;
  const store = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const p = load();
    p.last = { id, title, url, y, t: Math.floor(Date.now() / 1000) };
    save(p);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      setTimeout(store, 1000);
    },
    { passive: true },
  );

  // Возврат по ссылке «Продолжить чтение».
  if (location.hash === '#continue') {
    const last = load().last;
    if (last && last.id === id && last.y > 0.02) {
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: last.y * max, behavior: 'auto' });
      });
    }
  }
}

// ── «Продолжить чтение» на главной ──────────────────────────────────────

/** Запись из /graph-cards.json — те же ключи, что у карты связей. */
interface Card {
  n: string;
  y: string;
  p: string;
  c: string;
  u: string;
  s: string;
  a: number;
  t?: string;
}

/**
 * Блок показывает недочитанную статью, а если такой нет — случайную из
 * непрочитанных. Кнопка «Прочтено» отмечает текущую и сразу подставляет
 * следующую, так что читать список можно, не уходя с главной.
 *
 * В разметке уже лежит настоящая статья (самая свежая), поэтому до загрузки
 * скрипта блок не пустует; здесь он только подменяется под читателя.
 */
function setupContinue(): void {
  const box = document.querySelector<HTMLElement>('[data-continue]');
  if (!box) return;
  const cardsUrl = box.dataset.continueCards;
  if (!cardsUrl) return;

  const q = <T extends HTMLElement>(sel: string) => box.querySelector<T>(sel);
  const img = q<HTMLImageElement>('[data-continue-img]');
  const bar = q('[data-continue-bar]');
  const label = q('[data-continue-label]');
  const title = q('[data-continue-title]');
  const meta = q('[data-continue-meta]');
  const summary = q('[data-continue-summary]');
  const note = q('[data-continue-note]');
  const done = q<HTMLButtonElement>('[data-continue-done]');
  const links = [...box.querySelectorAll<HTMLAnchorElement>('[data-continue-link]')];

  let cards: Record<string, Card> | null = null;
  let currentId: string | null = box.dataset.continueId ?? null;
  /*
   * Адреса статей в /graph-cards.json настольные. Мобильная главная передаёт
   * своё начало адреса и получает ссылки на страницы под /m/.
   */
  const gameBase = box.dataset.continueBase ?? '';
  const urlOf = (id: string, c: Card) => (gameBase ? `${gameBase}${id}/` : c.u);

  const loadCards = async (): Promise<Record<string, Card>> => {
    if (cards) return cards;
    try {
      const r = await fetch(cardsUrl);
      cards = r.ok ? ((await r.json()) as Record<string, Card>) : {};
    } catch {
      cards = {};
    }
    return cards;
  };

  /** Случайная непрочитанная статья, кроме той, что показана сейчас. */
  const pickNext = (): string | null => {
    if (!cards) return null;
    const read = load().read;
    const pool = Object.entries(cards)
      .filter(([id, c]) => c.a === 1 && !read[id] && id !== currentId)
      .map(([id]) => id);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)]!;
  };

  const show = (id: string, resume: { y: number } | null) => {
    const c = cards?.[id];
    if (!c) return;
    currentId = id;
    box.dataset.continueId = id;
    const href = resume ? `${urlOf(id, c)}#continue` : urlOf(id, c);
    for (const a of links) a.href = href;
    if (title) title.textContent = c.n;
    if (meta) meta.textContent = [c.p, c.y, c.c].filter(Boolean).join(' · ');
    if (summary) summary.textContent = c.s;
    if (img) {
      if (c.t) {
        img.removeAttribute('srcset');
        img.src = c.t;
        img.hidden = false;
      } else {
        img.hidden = true;
      }
    }
    const percent = resume ? Math.round(resume.y * 100) : 0;
    if (label) label.textContent = resume ? 'Продолжить чтение' : 'Что почитать';
    if (note) {
      note.textContent = resume
        ? percent > 0
          ? `Вы остановились на ${percent} %`
          : 'Вы открывали эту статью, но не дочитали'
        : 'Случайная статья из непрочитанных';
    }
    if (bar) {
      const fill = bar.firstElementChild as HTMLElement | null;
      if (fill) fill.style.width = `${percent}%`;
      bar.hidden = !resume || percent <= 0;
    }
    box.classList.remove('is-empty');
  };

  const showEmpty = () => {
    currentId = null;
    if (label) label.textContent = 'Всё прочитано';
    if (title) title.textContent = 'Непрочитанных статей не осталось';
    if (meta) meta.textContent = '';
    if (summary) summary.textContent = 'Все статьи энциклопедии отмечены прочитанными. Сбросить отметки можно на странице прогресса.';
    if (note) note.textContent = '';
    if (img) img.hidden = true;
    if (bar) bar.hidden = true;
    box.classList.add('is-empty');
  };

  const start = async () => {
    await loadCards();
    const p = load();
    const last = p.last;
    if (last && !p.read[last.id] && cards?.[last.id]?.a === 1) {
      show(last.id, last);
      return;
    }
    // Свежая статья из разметки годится, если она ещё не прочитана.
    if (currentId && cards?.[currentId] && !p.read[currentId]) {
      show(currentId, null);
      return;
    }
    const id = pickNext();
    if (id) show(id, null);
    else showEmpty();
  };

  done?.addEventListener('click', () => {
    if (currentId) markRead(currentId);
    const id = pickNext();
    if (id) show(id, null);
    else showEmpty();
  });

  void start();
}

function init(): void {
  applyBadges();
  // Динамически отрисованные списки (подсказки поиска, фильтры) просят обновить значки.
  document.addEventListener('igrostroy:rescan', () => applyBadges());
  setupToggles();
  setupAutoMark();
  setupLastPosition();
  setupContinue();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Страница /progress/ дёргает эти функции напрямую.
declare global {
  interface Window {
    igrostroyProgress: {
      exportJson: typeof exportJson;
      importJson: typeof importJson;
      reset: typeof reset;
      all: typeof all;
    };
  }
}
window.igrostroyProgress = { exportJson, importJson, reset, all };
