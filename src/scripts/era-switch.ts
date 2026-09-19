/**
 * Предпросмотр темы другой эпохи. Меняем data-era и адрес файла темы —
 * страница перекрашивается без перезагрузки. Выбор запоминается.
 */

const KEY = 'igrostroy:eraPreview';
const DESIGN_KEY = 'igrostroy:eraDesign';

/** Оформление по эпохе может быть выключено кнопкой в шапке. */
const designOn = () => {
  try {
    return localStorage.getItem(DESIGN_KEY) !== 'off';
  } catch {
    return true;
  }
};

function apply(era: string, link: HTMLLinkElement): void {
  const base = link.dataset.eraBase ?? '';
  const build = link.dataset.eraBuild ?? 'dev';
  const target = era || link.dataset.eraOwn || 'site';
  document.documentElement.dataset.era = target;
  link.href = `${base}${target}.css?v=${build}`;
}

function init(): void {
  const select = document.querySelector<HTMLSelectElement>('[data-era-select]');
  const link = document.querySelector<HTMLLinkElement>('link[data-era-css]');
  if (!select || !link) return;

  // Запомним, какая эпоха у самой страницы, чтобы к ней можно было вернуться.
  if (!link.dataset.eraOwn) {
    const own = new URL(link.href, location.href).pathname.split('/').pop()?.replace('.css', '');
    link.dataset.eraOwn = own ?? 'site';
  }

  let saved = '';
  try {
    saved = localStorage.getItem(KEY) ?? '';
  } catch {
    /* нет доступа к хранилищу */
  }
  if (saved) {
    select.value = saved;
    if (designOn()) apply(saved, link);
  }

  select.addEventListener('change', () => {
    const value = select.value;
    try {
      if (value) localStorage.setItem(KEY, value);
      else localStorage.removeItem(KEY);
      // Выбрали эпоху — значит, оформление по эпохе снова нужно.
      localStorage.setItem(DESIGN_KEY, 'on');
    } catch {
      /* нет доступа к хранилищу */
    }
    for (const button of document.querySelectorAll('[data-era-toggle]')) {
      button.setAttribute('aria-pressed', 'true');
    }
    apply(value, link);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/** Файл подключается как модуль; экспорт нужен, чтобы имена не попадали в глобальную область. */
export {};
