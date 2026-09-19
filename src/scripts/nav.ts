/**
 * Навигация: быстрый переход по играм, панель «Ещё», выпадающие крошки.
 * Всё работает поверх обычных ссылок, поэтому без JS страница остаётся рабочей.
 */

interface IndexItem {
  id: string;
  name: string;
  alt: string[];
  studio: string;
  years: string;
  url: string;
  article: boolean;
}

let indexCache: IndexItem[] | null = null;
let indexLoading: Promise<IndexItem[]> | null = null;

function loadIndex(url: string): Promise<IndexItem[]> {
  if (indexCache) return Promise.resolve(indexCache);
  if (!indexLoading) {
    indexLoading = fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: IndexItem[]) => {
        indexCache = data;
        return data;
      })
      .catch(() => []);
  }
  return indexLoading;
}

/** Простая нормализация: регистр, ё → е, дефисы и пробелы убираем. */
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[\s\-_]/g, '');

/** Длина общего начала двух строк. */
function commonPrefix(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return i;
}

function score(item: IndexItem, query: string): number {
  const q = norm(query);
  if (!q) return 0;
  const names = [item.name, ...item.alt];
  let best = 0;
  for (const raw of names) {
    const n = norm(raw);
    if (n === q) best = Math.max(best, 100);
    else if (n.startsWith(q)) best = Math.max(best, 80);
    else if (n.includes(q)) best = Math.max(best, 60);
    else {
      // Русские окончания: «рейнджеров» должны находить «рейнджеры».
      const shared = commonPrefix(n, q);
      if (shared >= 4 && shared >= Math.min(n.length, q.length) - 2) {
        best = Math.max(best, 50);
      }
    }
  }
  if (best === 0 && norm(item.studio).includes(q)) best = 30;
  // Готовые статьи показываем выше карточек реестра.
  return best > 0 ? best + (item.article ? 5 : 0) : 0;
}

function setupQuickSwitch(): void {
  const form = document.querySelector<HTMLFormElement>('[data-quick]');
  if (!form) return;
  const input = form.querySelector<HTMLInputElement>('input[name="q"]');
  const list = form.querySelector<HTMLUListElement>('.quick__list');
  if (!input || !list) return;

  const indexUrl = form.dataset.index!;
  // Адреса в индексе настольные; мобильная версия передаёт своё начало адреса.
  const gameBase = form.dataset.gameBase ?? '';
  const urlOf = (item: IndexItem) => (gameBase ? `${gameBase}${item.id}/` : item.url);
  let items: IndexItem[] = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    list.replaceChildren();
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  };

  const render = (matches: IndexItem[]) => {
    list.replaceChildren();
    matches.forEach((item, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      const a = document.createElement('a');
      a.href = urlOf(item);
      a.dataset.gameId = item.id;
      if (item.article) a.dataset.hasArticle = '1';
      const name = document.createElement('span');
      name.textContent = item.name;
      const studio = document.createElement('span');
      studio.className = 'quick__studio';
      studio.textContent = item.studio;
      const years = document.createElement('span');
      years.className = 'quick__years';
      years.textContent = item.years;
      const badge = document.createElement('span');
      badge.className = 'badge-read';
      badge.textContent = '✓';
      a.append(name, studio, years, badge);
      li.append(a);
      list.append(li);
    });
    list.hidden = matches.length === 0;
    input.setAttribute('aria-expanded', String(matches.length > 0));
    // Подсветить уже прочитанные строки подсказок.
    document.dispatchEvent(new CustomEvent('igrostroy:rescan'));
  };

  const update = () => {
    const q = input.value.trim();
    if (q.length < 1) return close();
    const matches = items
      .map((item) => ({ item, s: score(item, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.item.name.localeCompare(b.item.name, 'ru'))
      .slice(0, 8)
      .map((x) => x.item);
    active = matches.length ? 0 : -1;
    render(matches);
  };

  const move = (delta: number) => {
    const options = [...list.querySelectorAll<HTMLLIElement>('li')];
    if (options.length === 0) return;
    active = (active + delta + options.length) % options.length;
    options.forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    options[active]?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('focus', () => {
    loadIndex(indexUrl).then((data) => {
      items = data;
      if (input.value.trim()) update();
    });
  });
  input.addEventListener('input', () => {
    if (items.length === 0) loadIndex(indexUrl).then((d) => ((items = d), update()));
    else update();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Escape') {
      close();
      input.blur();
    } else if (e.key === 'Enter') {
      const options = [...list.querySelectorAll<HTMLLIElement>('li')];
      const chosen = options[active]?.querySelector('a');
      if (chosen) {
        e.preventDefault();
        location.href = chosen.href;
      }
    }
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target as Node)) close();
  });

  // Клавиша «/» ставит курсор в поиск, как в популярных справочниках.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
    e.preventDefault();
    input.focus();
    input.select();
  });
}

function setupMoreSheet(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-more-button]');
  const sheet = document.querySelector<HTMLDialogElement>('[data-more-sheet]');
  if (!button || !sheet) return;
  button.addEventListener('click', () => {
    sheet.showModal();
    button.setAttribute('aria-expanded', 'true');
  });
  sheet.querySelector('[data-more-close]')?.addEventListener('click', () => sheet.close());
  sheet.addEventListener('close', () => button.setAttribute('aria-expanded', 'false'));
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });
}

/** Выпадающий список соседей у крошки: другие заводы, семейства, модели. */
function setupCrumbMenus(): void {
  document.querySelectorAll<HTMLDetailsElement>('[data-crumb-menu]').forEach((details) => {
    document.addEventListener('click', (e) => {
      if (details.open && !details.contains(e.target as Node)) details.open = false;
    });
    details.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') details.open = false;
    });
  });
}

/** Переходы стрелками между предшественником и преемником. */
function setupArrowNav(): void {
  const strip = document.querySelector<HTMLElement>('[data-neighbors]');
  if (!strip) return;
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
    const dir = e.key === 'ArrowLeft' ? 'prev' : e.key === 'ArrowRight' ? 'next' : null;
    if (!dir) return;
    const link = strip.querySelector<HTMLAnchorElement>(`a[data-neighbor="${dir}"]`);
    if (link) {
      e.preventDefault();
      location.href = link.href;
    }
  });
}

/** Панель каталога в выезжающем окне — на телефоне. */
function setupDrawer(): void {
  const opener = document.querySelector<HTMLButtonElement>('[data-tree-open]');
  const drawer = document.querySelector<HTMLDialogElement>('[data-tree-drawer]');
  if (!opener || !drawer) return;
  opener.addEventListener('click', () => drawer.showModal());
  drawer.querySelector('[data-tree-close]')?.addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) drawer.close();
  });
}

function init(): void {
  setupQuickSwitch();
  setupMoreSheet();
  setupCrumbMenus();
  setupArrowNav();
  setupDrawer();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/** Файл подключается как модуль; экспорт нужен, чтобы имена не попадали в глобальную область. */
export {};
