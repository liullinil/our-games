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

/*
 * Римские цифры в номере части. «Parkan II» и «Parkan 2» — одна игра, как
 * «Корсары III» и «Корсары 3»; пишут и так и так, а иногда по-разному в
 * названии и в магазине. Заменяем только заглавные и только отдельным
 * словом, чтобы не трогать буквы внутри слов.
 */
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
const romanize = (s) =>
  String(s).replace(/\b(X(?:II|I)?|I[VX]|VI{0,3}|I{1,3})\b/g, (m) => String(ROMAN[m] ?? m));

export const norm = (s) =>
  romanize(s)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/&/g, 'and')
    .replace(/[^a-zа-я0-9]+/g, '')
    .replace(SUFFIX, '');

/** Числа в названии: по ним продолжение отличается от оригинала. */
const digits = (s) => (romanize(s).match(/\d+/g) ?? []).filter((d) => d.length <= 2).join(',');

/*
 * В Steam карточка часто подписана сразу двумя названиями — западным и
 * нашим: «Hard Truck Apocalypse / Ex Machina», «Hard Truck Apocalypse: Rise
 * Of Clans / Ex Machina: Meridian 113». Это не два разных имени игры, а одно
 * составное, поэтому половинки пробуем отдельно.
 */
const variants = (s) => {
  const whole = String(s).trim();
  const parts = whole.split(/\s+\/\s+/).map((p) => p.trim()).filter((p) => p.length > 2);
  return parts.length > 1 ? [whole, ...parts] : [whole];
};

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
  return variants(theirs).some((variant) => {
    const b = norm(variant);
    if (b.length < 3) return false;
    return ours.map(norm).some((a, i) => {
      if (a.length < 3) return false;
      if (a === b) return digits(ours[i]) === digits(variant);
      if (strict) return false;
      return a.includes(b) || b.includes(a);
    });
  });
}

/* Уточнения в скобках: «Аллоды (игра)», «Cradle (video game)». */
const DISAMBIG = /\s*\((?:[^)]*?(?:игра|game|серия|series|компьютерн\w*)[^)]*)\)\s*$/i;

/**
 * Похоже ли название статьи в Википедии на название игры.
 *
 * Вхождением тут пользоваться нельзя: «Ex Machina» входит в «Deus Ex
 * Machina», хотя это разные игры с разницей в двадцать лет. Зато приставка
 * спереди — верный признак другой игры, а хвост обычно подзаголовок
 * («Аллоды» → «Аллоды: Печать тайны»). Поэтому требуем общее начало.
 *
 * Ровное совпадение возвращает 2, общее начало — 1, непохожее — 0: по этому
 * числу кандидаты сортируются. Поиск по «Проклятым землям» отдаёт первой
 * статью о сиквеле «Затерянные в астрале», и без такой сортировки обложка
 * продолжения уезжала в статью об оригинале.
 */
export function titleRank(ours, theirs) {
  const b = norm(String(theirs).replace(DISAMBIG, ''));
  if (b.length < 3) return 0;
  let best = 0;
  for (const a of ours.map(norm)) {
    if (a.length < 3) continue;
    if (a === b) return 2;
    if (a.startsWith(b) || b.startsWith(a)) best = 1;
  }
  return best;
}

/** Список значений вложенного ключа frontmatter: altNames, platforms и прочие. */
export function fieldList(fm, name) {
  const block = fm.match(new RegExp(String.raw`^${name}:\s*\n((?:\s+- .*\n)+)`, 'm'));
  if (!block) return [];
  return [...block[1].matchAll(/^\s+- "?(.+?)"?\s*$/gm)].map((m) => m[1]);
}
