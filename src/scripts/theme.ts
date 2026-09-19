/**
 * Светлая и тёмная тема.
 *
 * Выбор хранится в localStorage и применяется инлайн-скриптом в <head>, до
 * первой отрисовки, — иначе страница мигала бы светлым. Здесь остаётся только
 * переключение по нажатию.
 */
const KEY = 'igrostroy:theme';

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function current(): 'light' | 'dark' {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return systemDark() ? 'dark' : 'light';
}

function apply(theme: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = theme;
  try {
    // Выбор, совпавший с системным, всё равно запоминаем: иначе смена системной
    // настройки увела бы тему вопреки тому, что человек выбрал руками.
    localStorage.setItem(KEY, theme);
  } catch {
    /* приватный режим — тема продержится до перезагрузки */
  }
  for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
    button.setAttribute('aria-label', theme === 'dark' ? 'Светлая тема' : 'Тёмная тема');
  }
}

for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
  button.addEventListener('click', () => apply(current() === 'dark' ? 'light' : 'dark'));
  button.setAttribute('aria-label', current() === 'dark' ? 'Светлая тема' : 'Тёмная тема');
}

/*
 * Оформление по эпохе.
 *
 * Выключенное, оно подменяет тему страницы современной: меняется только вид,
 * содержание и адрес прежние. Как и светлая/тёмная, выбор применяется
 * инлайн-скриптом в <head> до первой отрисовки.
 */
const ERA_KEY = 'igrostroy:eraDesign';

const eraLink = document.querySelector<HTMLLinkElement>('link[data-era-css]');

function eraDesignOn(): boolean {
  try {
    return localStorage.getItem(ERA_KEY) !== 'off';
  } catch {
    return true;
  }
}

function applyEraDesign(on: boolean): void {
  const own = eraLink?.dataset.eraOwn ?? 'site';
  let preview = '';
  try {
    preview = localStorage.getItem('igrostroy:eraPreview') ?? '';
  } catch {
    /* приватный режим */
  }
  // Предпросмотр чужой эпохи из подвала — тоже оформление по эпохе.
  const era = on ? preview || own : 'site';
  document.documentElement.dataset.era = era;
  if (eraLink) {
    eraLink.href = `${eraLink.dataset.eraBase}${era}.css?v=${eraLink.dataset.eraBuild}`;
  }
  for (const button of document.querySelectorAll<HTMLElement>('[data-era-toggle]')) {
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.setAttribute(
      'aria-label',
      on ? 'Выключить оформление по эпохе' : 'Включить оформление по эпохе',
    );
  }
}

for (const button of document.querySelectorAll<HTMLElement>('[data-era-toggle]')) {
  button.addEventListener('click', () => {
    const next = !eraDesignOn();
    try {
      localStorage.setItem(ERA_KEY, next ? 'on' : 'off');
    } catch {
      /* приватный режим — выбор продержится до перезагрузки */
    }
    applyEraDesign(next);
  });
}
applyEraDesign(eraDesignOn());

export {};
