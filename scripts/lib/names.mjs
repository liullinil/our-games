/**
 * Сравнение названий игр из разных источников.
 *
 * «Heroes of Might & Magic V» и «Heroes of Might and Magic V» — одна игра, как
 * и «Crimes and Punishments» с «Crimes & Punishments». А приписки вроде HD,
 * Gold, Redux и «Перезагрузка» отличают переиздание от оригинала, но не игру
 * от игры, поэтому их тоже отбрасываем.
 */
const SUFFIX =
  /(hd|gold|deluxe|redux|remaster(ed)?|definitive|complete|enhanced|edition|collection|anthology|переиздание|перезагрузка|awarapart)/g;

export const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/&/g, 'and')
    .replace(/[^a-zа-я0-9]+/g, '')
    .replace(SUFFIX, '');

/** Числа в названии: по ним продолжение отличается от оригинала. */
const digits = (s) => (String(s).match(/\d+/g) ?? []).filter((d) => d.length <= 2).join(',');

/**
 * Совпадают ли названия.
 *
 * Мягкая проверка (по умолчанию) считает совпадением вхождение одного названия
 * в другое: ею сверяют уже скачанные кадры, и придираться к «Cossacks II»
 * против «Cossacks II: Battle for Europe» незачем.
 *
 * Строгая нужна там, где по названию выбирают идентификатор: вхождения хватает,
 * чтобы принять «Sudden Strike 5» за «Sudden Strike», «Perestroika Drive» за
 * «Перестройку», а «DOA6LR Character Unlock Key» — за Lada Racing Club, у
 * которой сокращение LRC. Поэтому там требуется точное совпадение.
 */
export function namesMatch(ours, theirs, { strict = false } = {}) {
  const b = norm(theirs);
  if (b.length < 3) return false;
  return ours.map(norm).some((a) => {
    if (a.length < 3) return false;
    if (a === b) return digits(ours.find((x) => norm(x) === a) ?? '') === digits(theirs);
    if (strict) return false;
    return a.includes(b) || b.includes(a);
  });
}

/** Список значений вложенного ключа frontmatter: altNames, platforms и прочие. */
export function fieldList(fm, name) {
  const block = fm.match(new RegExp(String.raw`^${name}:\s*\n((?:\s+- .*\n)+)`, 'm'));
  if (!block) return [];
  return [...block[1].matchAll(/^\s+- "?(.+?)"?\s*$/gm)].map((m) => m[1]);
}
