/**
 * Фильтры каталога и хронологии.
 *
 * Прячем карточки и полосы по атрибутам data-*, состояние держим в адресе
 * страницы: ссылку с выбранными условиями можно переслать или сохранить.
 */

type Groups = Record<string, Set<string>>;

const FILTER_KEYS = ['studio', 'era', 'country', 'platform', 'article', 'type'] as const;

function readUrl(): Groups {
  const params = new URLSearchParams(location.search);
  const groups: Groups = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) groups[key] = new Set(value.split(','));
  }
  return groups;
}

function writeUrl(groups: Groups): void {
  const params = new URLSearchParams(location.search);
  for (const key of FILTER_KEYS) {
    const set = groups[key];
    if (set && set.size > 0) params.set(key, [...set].join(','));
    else params.delete(key);
  }
  const query = params.toString();
  history.replaceState(null, '', query ? `${location.pathname}?${query}` : location.pathname);
}

const ATTR: Record<string, string> = {
  studio: 'data-studio',
  era: 'data-era',
  country: 'data-country',
  type: 'data-type',
  platform: 'data-platforms',
  article: 'data-has-article',
};

function matches(el: Element, groups: Groups): boolean {
  for (const [key, values] of Object.entries(groups)) {
    if (values.size === 0) continue;
    if (key === 'article') {
      if (el.getAttribute(ATTR[key]!) !== '1') return false;
      continue;
    }
    // У игры несколько платформ: атрибут хранит их списком через пробел.
    if (key === 'platform') {
      const have = (el.getAttribute(ATTR[key]!) ?? '').split(' ');
      if (![...values].some((v) => have.includes(v))) return false;
      continue;
    }
    const attr = el.getAttribute(ATTR[key] ?? `data-${key}`);
    if (!attr || !values.has(attr)) return false;
  }
  return true;
}

function init(): void {
  const form = document.querySelector<HTMLElement>('[data-filters]');
  if (!form) return;

  const buttons = [...form.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const reset = form.querySelector<HTMLButtonElement>('[data-filters-reset]');
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const groups = readUrl();

  const apply = () => {
    const active = Object.values(groups).some((s) => s.size > 0);
    let visible = 0;

    // toggleAttribute, а не .hidden: у элементов SVG (полосы хронологии)
    // свойства hidden нет, а атрибут понимают и они.
    document.querySelectorAll<Element>('[data-game-id][data-studio]').forEach((el) => {
      const ok = matches(el, groups);
      el.toggleAttribute('hidden', !ok);
      if (ok) visible += 1;
    });

    // Заголовок студии прячется, если под фильтр не подошла ни одна её игра.
    document.querySelectorAll<HTMLElement>('[data-studio-group]').forEach((group) => {
      const any = [...group.querySelectorAll<Element>('[data-game-id]')].some(
        (el) => !el.hasAttribute('hidden'),
      );
      group.toggleAttribute('hidden', !any);
    });

    buttons.forEach((b) => {
      const set = groups[b.dataset.filter!];
      b.setAttribute('aria-pressed', String(Boolean(set?.has(b.dataset.value!))));
    });

    if (reset) reset.toggleAttribute('hidden', !active);
    if (empty) empty.toggleAttribute('hidden', visible > 0);

    document.dispatchEvent(new CustomEvent('igrostroy:filters', { detail: groups }));
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.filter!;
      const value = button.dataset.value!;
      const set = groups[key] ?? new Set<string>();
      if (set.has(value)) set.delete(value);
      else set.add(value);
      groups[key] = set;
      writeUrl(groups);
      apply();
    });
  });

  reset?.addEventListener('click', () => {
    for (const key of Object.keys(groups)) groups[key] = new Set();
    writeUrl(groups);
    apply();
  });

  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/** Файл подключается как модуль; экспорт нужен, чтобы имена не попадали в глобальную область. */
export {};
