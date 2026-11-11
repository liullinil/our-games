/**
 * Сканы журналов на archive.org.
 *
 * Оценки журналов девяностых и нулевых живут только в сканах, и у многих
 * рецензий в энциклопедии адрес ведёт прямо на лист номера в библиотеке
 * archive.org. По этому адресу можно показать и обложку номера, и саму
 * статью — не перекладывая ни то, ни другое к себе.
 *
 * Обложку archive.org отдаёт своим сервисом миниатюр, а статью — своей
 * читалкой, которую он сам разрешает встраивать. Скачивать и хранить у себя
 * целые страницы журналов значило бы перепечатывать чужие статьи; так же
 * они остаются в библиотеке, со всеми её правилами и подписью.
 */

export interface MagazineScan {
  /** Идентификатор номера на archive.org. */
  id: string;
  /** Лист с рецензией, если адрес на него указывает: «n23». */
  page?: string;
  /** Обложка номера — миниатюра от самого archive.org. */
  cover: string;
  /** Читалка archive.org, открытая на листе с рецензией. */
  reader: string;
}

/**
 * Разбирает адрес рецензии. Подходят все виды ссылок на номер:
 * `/details/<id>/page/n23/mode/2up`, `/download/<id>/page/n23_w1400.jpg`,
 * `/stream/<id>`, `/embed/<id>`. Для остального возвращает null.
 */
export function magazineScan(url: string | undefined): MagazineScan | null {
  const m = String(url ?? '').match(/archive\.org\/(?:details|download|stream|embed)\/([^/?#]+)(?:\/page\/(n?\d+))?/);
  if (!m) return null;
  const [, id, page] = m;
  return {
    id,
    page,
    cover: `https://archive.org/services/img/${id}`,
    reader: `https://archive.org/embed/${id}${page ? `/page/${page}/mode/1up` : ''}`,
  };
}
