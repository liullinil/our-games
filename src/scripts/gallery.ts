/**
 * Лайтбокс для галереи: клавиши, свайп, подпись с указанием правообладателя.
 * Без JS ссылка просто открывает большую версию файла — это тоже рабочий вариант.
 */

interface Shot {
  href: string;
  caption: string;
  /** Готовая подпись: у скриншота — правообладатель, у фото — автор и лицензия. */
  credit: string;
  licenseUrl: string;
  source: string;
  /** Подпись источника: «Викисклад», «Sketchfab» или архив с изданием. */
  sourceText: string;
  modified: boolean;
}

function init(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  const image = document.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const caption = document.querySelector<HTMLElement>('[data-lightbox-caption]');
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
  if (!dialog || !image || !caption || links.length === 0) return;

  const shots: Shot[] = links.map((a) => ({
    href: a.href,
    caption: a.dataset.caption ?? '',
    credit: a.dataset.credit ?? '',
    licenseUrl: a.dataset.licenseUrl ?? '',
    source: a.dataset.source ?? '',
    sourceText: a.dataset.sourceText ?? 'источник',
    modified: a.dataset.modified === '1',
  }));

  let index = 0;

  const show = (i: number) => {
    index = (i + shots.length) % shots.length;
    const shot = shots[index]!;
    image.src = shot.href;
    image.alt = shot.caption;

    caption.replaceChildren();
    const title = document.createElement('span');
    title.textContent = shot.caption;
    caption.append(title, document.createElement('br'));

    const credit = document.createElement('span');
    credit.append(`${shot.credit}, `);
    if (shot.source) {
      const sourceLink = document.createElement('a');
      sourceLink.href = shot.source;
      sourceLink.rel = 'noopener external';
      sourceLink.textContent = shot.sourceText;
      credit.append(sourceLink);
    } else {
      // Кадр из книги или журнала: страницы в сети нет, есть издание.
      credit.append(shot.sourceText);
    }
    if (shot.modified) credit.append(', изменено');
    credit.append(` · ${index + 1} из ${shots.length}`);
    caption.append(credit);
  };

  links.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));

  dialog.addEventListener('click', (e) => {
    // Клик мимо картинки и кнопок закрывает просмотр.
    if (e.target === dialog || e.target === image) {
      if (e.target === dialog) dialog.close();
    }
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(index + 1);
    }
  });

  // Свайп пальцем.
  let startX = 0;
  let startY = 0;
  image.addEventListener(
    'touchstart',
    (e) => {
      const t = e.changedTouches[0]!;
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true },
  );
  image.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0]!;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/** Файл подключается как модуль; экспорт нужен, чтобы имена не попадали в глобальную область. */
export {};
