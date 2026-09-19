/** Страница /progress/: показать, скопировать, перенести и сбросить отметки. */
import { all, exportJson, importJson, reset } from './read-state';

function init(): void {
  const textarea = document.querySelector<HTMLTextAreaElement>('[data-progress-text]');
  const summary = document.querySelector<HTMLElement>('[data-progress-summary]');
  const status = document.querySelector<HTMLElement>('[data-progress-status]');
  if (!textarea || !summary || !status) return;

  const say = (message: string) => {
    status.textContent = message;
    setTimeout(() => (status.textContent = ''), 4000);
  };

  const refresh = () => {
    const data = all();
    const count = Object.keys(data.read).length;
    summary.textContent =
      count === 0
        ? 'Пока ничего не отмечено как прочитанное.'
        : `Прочитано статей: ${count}`;
    textarea.value = exportJson();
  };

  document.querySelector('[data-progress-copy]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      say('Скопировано в буфер обмена.');
    } catch {
      textarea.select();
      say('Не удалось скопировать автоматически — текст выделен, нажмите Ctrl+C.');
    }
  });

  document.querySelector('[data-progress-download]')?.addEventListener('click', () => {
    const blob = new Blob([textarea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'igrostroy-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector('[data-progress-import]')?.addEventListener('click', () => {
    try {
      const result = importJson(textarea.value);
      refresh();
      say(`Готово: добавлено ${result.added}, всего ${result.total}.`);
    } catch (error) {
      say(error instanceof Error ? error.message : 'Не удалось разобрать данные.');
    }
  });

  document.querySelector('[data-progress-reset]')?.addEventListener('click', () => {
    if (!confirm('Удалить все отметки о прочитанном? Это нельзя отменить.')) return;
    reset();
    refresh();
    say('Отметки удалены.');
  });

  refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
