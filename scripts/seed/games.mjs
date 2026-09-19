/**
 * Реестр игр: заготовки для src/content/games.
 *
 * Поля: name, alt, year, end (null — живёт; не указан — вышла один раз), type, class,
 * dev, pub (издатели), series, platforms, engines, kind/base, pred (предшественники),
 * basedOn (внешние прообразы: строки вида «Название | автор | страна | год»),
 * summary, steam (идентификатор приложения), country (если отличается от студии).
 *
 * Год выхода — первый релиз на любой платформе. Факты сверяются агентами при написании статей.
 */
export const GAMES = {
  // ── Советская эпоха ──────────────────────────────────────────────────
  tetris: {
    name: 'Тетрис', alt: ['Tetris'], year: 1984, type: 'puzzle', class: 'puzzle', dev: 'vc-an-sssr', series: 'tetris',
    platforms: ['elektronika-60', 'dos'],
    summary: 'Головоломка Алексея Пажитнова о падающих фигурах из четырёх квадратов, написанная в 1984 году на «Электронике-60» в Вычислительном центре Академии наук. Самая известная игра, сделанная в СССР, и одна из самых продаваемых в истории.',
  },
  welltris: {
    name: 'Welltris', alt: ['Веллтрис'], year: 1989, type: 'puzzle', class: 'puzzle', dev: 'doka', series: 'tetris', pred: ['tetris'],
    platforms: ['dos'],
    summary: 'Продолжение «Тетриса» от самого Пажитнова: фигуры падают по стенкам колодца и ложатся на его дно. Одна из первых советских игр, изданных на Западе официально.',
  },
  'nu-pogodi': {
    name: 'Ну, погоди!', alt: ['Электроника ИМ-02'], year: 1984, type: 'other', class: 'electronic', dev: 'elektronika',
    platforms: ['elektronika-im'],
    summary: 'Карманная игра, где волк ловит яйца, скатывающиеся с четырёх насестов. Копия японской Nintendo EG-26 Egg с героями советского мультфильма, ставшая символом детства восьмидесятых.',
  },
  'morskoy-boy': {
    name: 'Морской бой', alt: ['Игровой автомат «Морской бой»'], year: 1974, type: 'other', class: 'arcade-machine', dev: 'ratep',
    platforms: ['soviet-arcade'],
    summary: 'Самый известный советский игровой автомат: игрок смотрит в перископ и торпедирует проходящие корабли. Стоял в каждом парке и кинотеатре, играть стоило пятнадцать копеек.',
  },
  perestroika: {
    name: 'Перестройка', alt: ['Perestroika', 'Toppler'], year: 1990, type: 'action', class: 'arcade', dev: 'nikita',
    platforms: ['dos'],
    summary: 'Лягушка-демократ прыгает по исчезающим кувшинкам и собирает льготы, уворачиваясь от бюрократов. Аркада Никиты Скрипкина, ставшая первой массовой игрой позднего СССР на IBM PC.',
  },

  // ── Девяностые ───────────────────────────────────────────────────────
  'color-lines': {
    name: 'Color Lines', alt: ['Lines', 'Шарики'], year: 1992, type: 'puzzle', class: 'puzzle', dev: 'gamos',
    platforms: ['dos'],
    summary: 'Головоломка о цветных шариках, которые нужно выстраивать в линии по пять. Стояла на каждом офисном компьютере девяностых и до сих пор клонируется под именем Lines.',
  },
  'black-raven': {
    name: 'Чёрный ворон', alt: ['Black Raven'], year: 1997, type: 'strategy', class: 'rts', dev: 'copper-feet',
    platforms: ['zx-spectrum'],
    basedOn: ['Warcraft II | Blizzard Entertainment | США | 1995'],
    summary: 'Стратегия в реальном времени для ZX Spectrum, сделанная в Новокузнецке по образцу Warcraft II. Главная гордость постсоветской спектрумовской сцены: 128 килобайт памяти хватило на полноценную RTS.',
  },
  'pilot-brothers': {
    name: 'Братья Пилоты: По следам полосатого слона', alt: ['Братья Пилоты'], year: 1997, type: 'adventure', class: 'quest', dev: 'gamos', pub: ['1c'],
    platforms: ['dos', 'windows'],
    summary: 'Квест по мультфильму студии «Пилот» о Шефе и Коллеге, которые ищут похищенного полосатого слона. Один из первых российских квестов и начало длинной серии.',
  },
  gag: {
    name: 'ГЭГ: Отвязное приключение', alt: ['ГЭГ', 'GAG'], year: 1997, type: 'adventure', class: 'quest', dev: 'auric-vision',
    platforms: ['dos', 'windows'],
    summary: 'Квест о писателе, который отправился в Сан-Франциско встречаться с Айзеком Азимовым и попал в водоворот абсурда. Первый российский квест, разошедшийся большим тиражом.',
  },
  'parkan-chronicle': {
    name: 'Parkan: Хроника Империи', alt: ['Parkan', 'Паркан'], year: 1997, type: 'simulation', class: 'space-sim', dev: 'nikita', pub: ['nikita'], series: 'parkan',
    platforms: ['dos', 'windows'],
    summary: 'Космический боевик с высадкой на планеты и станции: игрок ищет пропавший корабль «Паркан» в закрытой звёздной системе. Одна из первых российских игр, изданных в США.',
  },
  'petka-1': {
    name: 'Петька и Василий Иванович спасают галактику', alt: ['Петька и ВИЧ', 'Red Comrades Save the Galaxy'], year: 1998, type: 'adventure', class: 'quest', dev: 'skif', pub: ['buka'], series: 'petka',
    platforms: ['windows'], steam: 336880,
    summary: 'Квест по анекдотам о Чапаеве, Петьке и Анке: герои Гражданской войны попадают на летающую тарелку и в будущее. Самая продаваемая российская игра конца девяностых.',
  },
  'petka-2': {
    name: 'Петька и Василий Иванович 2: Судный день', alt: ['Петька 2', 'Red Comrades 2'], year: 1999, type: 'adventure', class: 'quest', dev: 'skif', pub: ['buka'], series: 'petka', pred: ['petka-1'],
    platforms: ['windows'], steam: 336890,
    summary: 'Продолжение квеста: Петька и Чапаев в Москве девяностых, на телевидении и в аду. Последняя часть, сделанная студией S.K.I.F.',
  },
  'petka-3': {
    name: 'Петька 3: Возвращение Аляски', alt: ['Петька 3', 'Red Comrades 3'], year: 2001, type: 'adventure', class: 'quest', dev: 'saturn-plus', pub: ['buka'], series: 'petka', pred: ['petka-2'],
    platforms: ['windows'], steam: 358520,
    summary: 'Первая часть сериала, сделанная калужской «Сатурн-плюс»: Петька и Василий Иванович отправляются на Аляску возвращать её России.',
  },
  allods: {
    name: 'Аллоды: Печать тайны', alt: ['Аллоды', 'Rage of Mages'], year: 1998, type: 'rpg', class: 'tactical-rpg', dev: 'nival', pub: ['buka'], series: 'allods',
    platforms: ['windows'],
    summary: 'Первая игра Nival: смесь ролевой игры и тактики в реальном времени в фэнтезийном мире летающих островов-аллодов. Вышла на Западе как Rage of Mages и открыла Nival дорогу к мировым издателям.',
  },
  'allods-2': {
    name: 'Аллоды 2: Повелитель душ', alt: ['Аллоды 2', 'Rage of Mages II'], year: 1999, type: 'rpg', class: 'tactical-rpg', dev: 'nival', pub: ['buka'], series: 'allods', pred: ['allods'],
    platforms: ['windows'],
    summary: 'Продолжение «Аллодов» с двумя кампаниями и сетевой игрой: тот же мир, больше магии и первые в серии массовые сражения.',
  },
  vangers: {
    name: 'Вангеры', alt: ['Vangers'], year: 1998, type: 'action', class: 'action-adventure', dev: 'kd-lab', pub: ['buka'],
    platforms: ['windows', 'linux', 'macos'], steam: 264080,
    summary: 'Гонки, ролевая игра и странный живой мир в одном: игрок водит машину-«мехос» по подземным мирам, торгует и участвует в цикле Побега. Самая необычная российская игра девяностых.',
  },
  'hard-truck': {
    name: 'Дальнобойщики: Путь к победе', alt: ['Дальнобойщики', 'Hard Truck: Road to Victory'], year: 1998, type: 'simulation', class: 'truck-sim', dev: 'softlab-nsk', pub: ['buka'], series: 'dalnoboyshchiki',
    platforms: ['windows'],
    summary: 'Гонки на грузовиках с грузом: чтобы победить в чемпионате, надо ещё и заработать на ремонт и бензин. Начало единственного отечественного сериала о дальнобойщиках.',
  },
  carnivores: {
    name: 'Carnivores', alt: ['Хищники'], year: 1998, type: 'shooter', class: 'fps', dev: 'action-forms',
    platforms: ['windows'],
    summary: 'Охота на динозавров на далёкой планете: выбор оружия, скрадывание против ветра и трофеи. Киевская Action Forms сделала одну из самых продаваемых охотничьих игр девяностых.',
  },
  chasm: {
    name: 'Chasm: The Rift', alt: ['Chasm'], year: 1997, type: 'shooter', class: 'fps', dev: 'action-forms',
    platforms: ['dos'],
    summary: 'Шутер в духе Quake на собственном движке киевской студии: путешествия во времени, отстреливаемые конечности монстров и один из первых отечественных релизов в США.',
  },
  knyaz: {
    name: 'Князь: Легенды Лесной страны', alt: ['Князь', 'Konung: Legends of the North'], year: 1999, type: 'rpg', class: 'crpg', dev: 'lesta', pub: ['1c', 'snowball'], series: 'knyaz',
    platforms: ['windows'],
    summary: 'Ролевая игра о Древней Руси, где славянский, варяжский и византийский герои ищут части волшебного амулета. Первая заметная игра петербургской Lesta.',
  },
  'su-27-flanker': {
    name: 'Су-27 Фланкер', alt: ['Su-27 Flanker', 'Flanker'], year: 1995, type: 'simulation', class: 'flight-sim', dev: 'eagle-dynamics', series: 'dcs',
    platforms: ['dos', 'windows'],
    summary: 'Первый серьёзный авиасимулятор из России: Су-27 над Крымом с честной аэродинамикой и авионикой. Изданный на Западе SSI, он положил начало линии Lock On и DCS.',
  },
  shtyrlitz: {
    name: 'Штырлиц: Операция «Бюст»', alt: ['Штырлиц'], year: 2000, type: 'adventure', class: 'quest', dev: 'buka', pub: ['buka'],
    platforms: ['windows'],
    summary: 'Квест по анекдотам о Штирлице: разведчик, Мюллер, Борман и бесконечные каламбуры. Вместе с «Петькой» составил ядро юмористической школы российского квеста.',
  },

  // ── Нулевые ──────────────────────────────────────────────────────────
  'evil-islands': {
    name: 'Проклятые земли', alt: ['Evil Islands'], year: 2000, type: 'rpg', class: 'action-rpg', dev: 'nival', pub: ['1c'], series: 'allods', pred: ['allods-2'],
    platforms: ['windows'], steam: 1122190,
    summary: 'Трёхмерная ролевая игра в мире «Аллодов» с крафтом оружия из добытых материалов и стелсом. Одна из самых технологичных российских игр рубежа веков.',
  },
  corsairs: {
    name: 'Корсары: Проклятье дальних морей', alt: ['Корсары', 'Sea Dogs'], year: 2000, type: 'rpg', class: 'action-rpg', dev: 'akella', pub: ['akella', '1c'], series: 'corsairs', engines: ['storm-engine'],
    platforms: ['windows'], steam: 1155630,
    summary: 'Пиратская ролевая игра о Карибах XVII века: торговля, абордажи и открытое море. На Западе вышла как Sea Dogs у Bethesda и дала начало серии, дожившей до «Пиратов Карибского моря».',
  },
  'sudden-strike': {
    name: 'Sudden Strike', alt: ['Противостояние III', 'Противостояние 3'], year: 2000, type: 'strategy', class: 'rts', dev: 'fireglow', pub: ['russobit-m'], series: 'sudden-strike',
    platforms: ['windows'], steam: 315960,
    summary: 'Стратегия Второй мировой без строительства базы: сотни единиц техники и пехоты на огромных картах. В Германии стала самой продаваемой игрой года и сделала Fireglow имя.',
  },
  'il-2-sturmovik': {
    name: 'Ил-2 Штурмовик', alt: ['IL-2 Sturmovik'], year: 2001, type: 'simulation', class: 'flight-sim', dev: 'maddox-games', pub: ['1c'], series: 'il-2',
    platforms: ['windows'],
    summary: 'Авиасимулятор Восточного фронта с самой точной на тот момент физикой полёта и моделью повреждений. Десять лет оставался мировым эталоном жанра.',
  },
  'il-2-forgotten-battles': {
    name: 'Ил-2 Штурмовик: Забытые сражения', alt: ['IL-2 Sturmovik: Forgotten Battles'], year: 2003, type: 'simulation', class: 'flight-sim', dev: 'maddox-games', pub: ['1c'], series: 'il-2', pred: ['il-2-sturmovik'],
    platforms: ['windows'],
    summary: 'Расширенное продолжение «Ил-2»: Финляндия, Венгрия, десятки новых самолётов и динамическая кампания. Основа, на которой выросли «Асы в небе» и «1946».',
  },
  'il-2-1946': {
    name: 'Ил-2 Штурмовик: 1946', alt: ['IL-2 Sturmovik: 1946'], year: 2006, type: 'simulation', class: 'flight-sim', dev: 'maddox-games', pub: ['1c'], series: 'il-2', pred: ['il-2-forgotten-battles'],
    platforms: ['windows'], steam: 15320,
    summary: 'Итоговое издание серии со всеми дополнениями и реактивными самолётами альтернативного 1946 года. До сих пор живёт благодаря сообществу и модам.',
  },
  cossacks: {
    name: 'Казаки: Европейские войны', alt: ['Казаки', 'Cossacks: European Wars'], year: 2001, type: 'strategy', class: 'rts', dev: 'gsc-game-world', pub: ['russobit-m'], series: 'cossacks',
    platforms: ['windows'], steam: 4880,
    summary: 'Стратегия о войнах XVII–XVIII веков с тысячами солдат на экране и линейной тактикой. Первый большой успех GSC: миллионы проданных копий в Европе.',
  },
  'cossacks-2': {
    name: 'Казаки II: Наполеоновские войны', alt: ['Казаки 2', 'Cossacks II'], year: 2005, type: 'strategy', class: 'rts', dev: 'gsc-game-world', pub: ['russobit-m'], series: 'cossacks', pred: ['cossacks'],
    platforms: ['windows'], steam: 4890,
    summary: 'Наполеоновские войны с моралью отрядов, дымом от залпов и походовым режимом на глобальной карте Европы.',
  },
  'cossacks-3': {
    name: 'Казаки 3', alt: ['Cossacks 3'], year: 2016, type: 'strategy', class: 'rts', dev: 'gsc-game-world', pub: ['gsc-game-world'], series: 'cossacks', pred: ['cossacks-2'],
    platforms: ['windows', 'linux', 'macos'], steam: 333420,
    summary: 'Возвращение GSC после долгой паузы: пересборка первых «Казаков» в трёхмерной графике с той же механикой и теми же тысячами солдат.',
  },
  'codename-outbreak': {
    name: 'Codename: Outbreak', alt: ['Веном. Кодовое имя: Вспышка'], year: 2001, type: 'shooter', class: 'tactical-shooter', dev: 'gsc-game-world', pub: ['russobit-m'],
    platforms: ['windows'],
    summary: 'Тактический шутер о пришельцах-паразитах с командой из двух бойцов и большими открытыми картами. Первый шутер GSC и полигон для идей будущего S.T.A.L.K.E.R.',
  },
  etherlords: {
    name: 'Демиурги', alt: ['Etherlords'], year: 2001, type: 'strategy', class: 'tbs', dev: 'nival', pub: ['1c'],
    platforms: ['windows'],
    summary: 'Пошаговая стратегия с боями по правилам коллекционной карточной игры: четыре расы, колоды заклинаний и карта в духе Heroes of Might and Magic.',
  },
  'hard-truck-2': {
    name: 'Дальнобойщики 2', alt: ['Hard Truck 2: King of the Road'], year: 2001, type: 'simulation', class: 'truck-sim', dev: 'softlab-nsk', pub: ['buka'], series: 'dalnoboyshchiki', pred: ['hard-truck'],
    platforms: ['windows'],
    summary: 'Открытая карта вымышленного региона с городами, заправками и гаишниками, выбор грузов и конкуренты на дороге. Самая любимая часть серии и одна из самых узнаваемых российских игр.',
  },
  'space-rangers': {
    name: 'Космические рейнджеры', alt: ['Space Rangers'], year: 2002, type: 'rpg', class: 'space-rpg', dev: 'elemental-games', pub: ['1c'], series: 'space-rangers',
    platforms: ['windows'],
    summary: 'Живая галактика, где события идут без игрока: торговля, пошаговые перелёты, аркадные бои в гиперпространстве и текстовые квесты. Одна из самых оригинальных игр десятилетия.',
  },
  'space-rangers-2': {
    name: 'Космические рейнджеры 2: Доминаторы', alt: ['Космические рейнджеры 2', 'Space Rangers 2'], year: 2004, type: 'rpg', class: 'space-rpg', dev: 'elemental-games', pub: ['1c'], series: 'space-rangers', pred: ['space-rangers'], engines: ['theengine'],
    platforms: ['windows'], steam: 214730,
    summary: 'Расширенное продолжение с трёхмерными наземными боями роботов и войной против машин-доминаторов. Многими считается лучшей российской игрой вообще.',
  },
  samogonki: {
    name: 'Самогонки', alt: ['Moonshine Runners'], year: 2002, type: 'racing', class: 'arcade-racing', dev: 'kd-lab', pub: ['buka'],
    platforms: ['windows'],
    summary: 'Аркадные гонки K-D Lab в мире «Вангеров» и его окрестностей: странные машины, живые трассы и юмор калининградской лаборатории.',
  },
  'code-access-paradise': {
    name: 'Код доступа: РАЙ', alt: ['Paradise Cracked'], year: 2002, type: 'strategy', class: 'tactics', dev: 'mist-land', pub: ['1c'],
    platforms: ['windows'],
    summary: 'Пошаговая киберпанк-тактика в духе Jagged Alliance о хакере, который узнал правду о суперкомпьютере РАЙ. Первая большая работа подмосковной MiST land.',
  },
  'sudden-strike-2': {
    name: 'Sudden Strike 2', alt: ['Противостояние 4'], year: 2002, type: 'strategy', class: 'rts', dev: 'fireglow', pub: ['russobit-m'], series: 'sudden-strike', pred: ['sudden-strike'],
    platforms: ['windows'], steam: 315980,
    summary: 'Продолжение с шестью кампаниями, включая Тихий океан, поездами и улучшенной графикой на том же движке.',
  },
  blitzkrieg: {
    name: 'Блицкриг', alt: ['Blitzkrieg'], year: 2003, type: 'strategy', class: 'rts', dev: 'nival', pub: ['1c'], series: 'blitzkrieg', engines: ['enigma'],
    platforms: ['windows'], steam: 313480,
    summary: 'Стратегия Второй мировой с генератором случайных заданий и сотнями единиц техники. Движок Enigma лицензировали десятку студий, и «Блицкриг» стал целой индустрией дополнений.',
  },
  'silent-storm': {
    name: 'Операция Silent Storm', alt: ['Silent Storm'], year: 2003, type: 'strategy', class: 'tactics', dev: 'nival', pub: ['1c'], engines: ['silent-storm-engine'],
    platforms: ['windows'],
    summary: 'Пошаговая тактика Второй мировой с полностью разрушаемыми зданиями и физикой рэгдолл. Считается одним из лучших наследников Jagged Alliance.',
  },
  'massive-assault': {
    name: 'Massive Assault', alt: [], year: 2003, type: 'strategy', class: 'tbs', dev: 'wargaming', pub: ['russobit-m'],
    platforms: ['windows'],
    summary: 'Пошаговая стратегия о войне на выдуманной планете с тайными союзниками. Одна из нишевых игр Wargaming до World of Tanks.',
  },
  'lock-on': {
    name: 'Lock On: Modern Air Combat', alt: ['Lock On', 'LOMAC'], year: 2003, type: 'simulation', class: 'flight-sim', dev: 'eagle-dynamics', pub: ['1c'], series: 'dcs', pred: ['su-27-flanker'],
    platforms: ['windows'],
    summary: 'Симулятор современных истребителей: Су-27, Су-33, МиГ-29, F-15 и A-10 над Крымом и Кавказом. Прямой предок DCS World.',
  },
  'alien-shooter': {
    name: 'Alien Shooter', alt: [], year: 2003, type: 'shooter', class: 'shoot-em-up', dev: 'sigma-team', pub: ['1c'], series: 'alien-shooter',
    platforms: ['windows', 'ios', 'android'], steam: 33130,
    summary: 'Шутер с видом сверху, где на экране одновременно тысячи монстров и горы трупов. Продавался в каждом киоске и стал одной из самых портируемых российских игр.',
  },
  sphere: {
    name: 'Сфера', alt: ['Sphere', 'Сфера: Перерождение'], year: 2003, end: null, type: 'online', class: 'mmorpg', dev: 'burut', pub: ['nikita'],
    platforms: ['windows'],
    summary: 'Первая российская массовая онлайн-ролевая игра: замки, осады и клановые войны в фэнтезийном мире. Пережила несколько перезапусков и жива до сих пор.',
  },
  perimeter: {
    name: 'Периметр', alt: ['Perimeter'], year: 2004, type: 'strategy', class: 'rts', dev: 'kd-lab', pub: ['1c'], series: 'perimeter',
    platforms: ['windows'], steam: 289440,
    summary: 'Стратегия о терраформировании: игрок выравнивает землю под здания, накрывает базу защитным полем-периметром и превращает одних юнитов в других. Ничего похожего в жанре не было.',
  },
  'men-of-war-1': {
    name: 'В тылу врага', alt: ['Soldiers: Heroes of World War II'], year: 2004, type: 'strategy', class: 'tactics', dev: 'best-way', pub: ['1c'], series: 'men-of-war', engines: ['gem'],
    platforms: ['windows'],
    summary: 'Тактика Второй мировой, где любым солдатом и любой машиной можно управлять напрямую, а каждый снаряд считается по-настоящему. Начало серии Men of War.',
  },
  'star-wolves': {
    name: 'Star Wolves', alt: ['Звёздные волки'], year: 2004, type: 'rpg', class: 'space-rpg', dev: 'x-bow', pub: ['1c'],
    platforms: ['windows'], steam: 32270,
    summary: 'Космическая ролевая стратегия: авианосец, звено истребителей с пилотами-персонажами и пауза для раздачи приказов.',
  },
  mechanoids: {
    name: 'Механоиды', alt: ['A.I.M.'], year: 2004, type: 'rpg', class: 'action-rpg', dev: 'skyriver', pub: ['1c'], series: 'mekhanoidy',
    platforms: ['windows'],
    summary: 'Ролевой боевик о разумных глайдерах на планете, где нет ни одного человека: торговля, война кланов и своя философия машин.',
  },
  bumer: {
    name: 'Бумер: Сорванные башни', alt: ['Бумер'], year: 2004, type: 'racing', class: 'combat-racing', dev: 'gaijin', pub: ['1c'], engines: ['dagor'],
    platforms: ['windows'],
    summary: 'Боевые гонки по мотивам фильма «Бумер»: BMW, погони и стрельба по трассам средней полосы. Первая заметная игра Gaijin и символ волны игр по российским фильмам.',
  },
  'sherlock-silver-earring': {
    name: 'Шерлок Холмс: Загадка серебряной серёжки', alt: ['Sherlock Holmes: The Case of the Silver Earring'], year: 2004, type: 'adventure', class: 'quest', dev: 'frogwares', pub: ['1c'], series: 'sherlock-holmes',
    platforms: ['windows'], steam: 11040,
    summary: 'Классический квест Frogwares о Холмсе и Ватсоне с допросами и тестами на дедукцию. Первая часть, сделавшая киевскую студию хранителем сыщика в играх.',
  },
  pathologic: {
    name: 'Мор. Утопия', alt: ['Мор', 'Pathologic'], year: 2005, type: 'adventure', class: 'survival', dev: 'ice-pick-lodge', pub: ['buka'], series: 'pathologic',
    platforms: ['windows'], steam: 384110,
    summary: 'Двенадцать дней в степном городе, который убивает песочная язва: голод, сон, торговля и три героя с разной правдой. Самая известная арт-игра из России.',
  },
  xenus: {
    name: 'Xenus: Точка кипения', alt: ['Xenus', 'Boiling Point: Road to Hell'], year: 2005, type: 'shooter', class: 'open-world', dev: 'deep-shadows', pub: ['russobit-m'], series: 'xenus', engines: ['vital-engine'],
    platforms: ['windows'],
    summary: 'Шутер с открытым миром в 625 квадратных километров латиноамериканской республики без загрузок: фракции, машины, вертолёты и репутация. Опередил время и утонул в багах.',
  },
  'ex-machina': {
    name: 'Ex Machina', alt: ['Hard Truck Apocalypse'], year: 2005, type: 'racing', class: 'combat-racing', dev: 'targem', pub: ['buka'], series: 'ex-machina',
    platforms: ['windows'], steam: 285440,
    summary: 'Постапокалиптические гонки с торговлей и стрельбой: грузовик, пустоши и города-крепости. Идеи Ex Machina через десять лет выросли в Crossout.',
  },
  'ex-machina-meridian': {
    name: 'Ex Machina: Меридиан 113', alt: ['Меридиан 113'], year: 2006, type: 'racing', class: 'combat-racing', dev: 'targem', pub: ['buka'], series: 'ex-machina', kind: 'expansion', base: 'ex-machina',
    platforms: ['windows'],
    summary: 'Самостоятельное дополнение с новой картой, машинами и сюжетом о загадочном сигнале «Меридиан 113».',
  },
  'night-watch': {
    name: 'Ночной дозор', alt: ['Night Watch'], year: 2005, type: 'strategy', class: 'tactics', dev: 'nival', pub: ['1c'], engines: ['silent-storm-engine'],
    platforms: ['windows'],
    summary: 'Пошаговая тактика по роману Сергея Лукьяненко и фильму Тимура Бекмамбетова на движке Silent Storm: Иные, Сумрак и московские дворы.',
  },
  'parkan-2': {
    name: 'Parkan II', alt: ['Паркан 2'], year: 2005, type: 'simulation', class: 'space-sim', dev: 'nikita', pub: ['1c'], series: 'parkan', pred: ['parkan-chronicle'],
    platforms: ['windows'], steam: 271640,
    summary: 'Возвращение Parkan: пять сотен планет в свободном полёте, высадки, торговля и битвы флотов на собственном движке «Никиты».',
  },
  vivisector: {
    name: 'Vivisector: Beast Within', alt: ['Vivisector', 'Вивисектор: Зверь внутри'], year: 2005, type: 'shooter', class: 'fps', dev: 'action-forms', pub: ['1c'], engines: ['atmosfear'],
    platforms: ['windows'],
    summary: 'Шутер об острове доктора Моро с зверолюдьми, сделанный на новом движке AtmosFear: дневная и ночная стороны острова и ролевые элементы.',
  },
  'corsairs-3': {
    name: 'Корсары III', alt: ['Корсары 3', 'Age of Pirates: Caribbean Tales'], year: 2005, type: 'rpg', class: 'action-rpg', dev: 'akella', pub: ['akella'], series: 'corsairs', pred: ['corsairs'], engines: ['storm-engine'],
    platforms: ['windows'], steam: 12420,
    summary: 'Возвращение серии после «Пиратов Карибского моря»: открытый архипелаг, две сюжетные линии и знаменитая сырость на релизе, которую годами лечили патчи и фанаты.',
  },
  'pacific-storm': {
    name: 'Стальные монстры', alt: ['Pacific Storm'], year: 2005, type: 'strategy', class: 'wargame', dev: 'lesta', pub: ['buka'],
    platforms: ['windows'],
    summary: 'Война на Тихом океане от стратегической карты до управления отдельным самолётом или кораблём: смесь глобальной стратегии и симулятора.',
  },
  adrenaline: {
    name: 'Адреналин: Экстрим-шоу', alt: ['Adrenalin: Extreme Show'], year: 2005, type: 'racing', class: 'arcade-racing', dev: 'gaijin', pub: ['buka'], engines: ['dagor'],
    platforms: ['windows'],
    summary: 'Аркадные гонки с трюками и телешоу: раннее применение движка Dagor, который потом дожил до War Thunder.',
  },
  'blood-magic': {
    name: 'Магия крови', alt: ['Dawn of Magic'], year: 2005, type: 'rpg', class: 'action-rpg', dev: 'skyfallen', pub: ['1c'],
    platforms: ['windows'],
    summary: 'Ролевой боевик в духе Diablo, где герой меняется от применяемой магии: чем больше огня, тем сильнее он обгорает. Первая игра SkyFallen.',
  },
  'heroes-5': {
    name: 'Heroes of Might and Magic V', alt: ['Герои Меча и Магии V', 'Heroes 5'], year: 2006, type: 'strategy', class: 'tbs', dev: 'nival', engines: ['silent-storm-engine'],
    platforms: ['windows', 'macos'], steam: 15170,
    summary: 'Возрождение главной пошаговой стратегии девяностых силами Nival по заказу Ubisoft: трёхмерный мир Асхан и шесть фракций. Крупнейший заказ, доверенный российской студии.',
  },
  sanitary: {
    name: 'Санитары подземелий', alt: ['Planet Alcatraz'], year: 2006, type: 'rpg', class: 'tactical-rpg', dev: 'ino-co', pub: ['1c'], engines: ['theengine'],
    platforms: ['windows'], steam: 264200,
    summary: 'Ролевая игра по роману Дмитрия «Гоблина» Пучкова о планете-тюрьме: отряд, брань, пошаговые бои на движке «Космических рейнджеров 2».',
  },
  'men-of-war-2': {
    name: 'В тылу врага 2', alt: ['Faces of War'], year: 2006, type: 'strategy', class: 'tactics', dev: 'best-way', pub: ['1c'], series: 'men-of-war', pred: ['men-of-war-1'], engines: ['gem'],
    platforms: ['windows'], steam: 6120,
    summary: 'Продолжение с тремя кампаниями за союзников, СССР и Германию и подчинёнными отрядами, действующими сами по себе.',
  },
  'lada-racing-club': {
    name: 'Lada Racing Club', alt: ['LRC'], year: 2006, type: 'racing', class: 'arcade-racing', dev: 'geleos', pub: ['novy-disk'],
    platforms: ['windows'],
    summary: 'Гонки на тюнингованных «Ладах» по ночной Москве, анонсированные как ответ Need for Speed. Огромная реклама и провальный релиз сделали игру мемом на десятилетия.',
  },
  'heroes-annihilated': {
    name: 'Heroes of Annihilated Empires', alt: ['Герои уничтоженных империй'], year: 2006, type: 'strategy', class: 'rts', dev: 'gsc-game-world', pub: ['gsc-game-world'],
    platforms: ['windows'], steam: 4870,
    summary: 'Фэнтезийная стратегия GSC на движке «Казаков II» с героем, который может стать сильнее целой армии. Задуманная трилогия остановилась на первой части.',
  },
  'legend-dragons': {
    name: 'Легенда: Наследие драконов', alt: ['Легенда', 'Dragon Eternity'], year: 2006, end: null, type: 'online', class: 'browser-mmo', dev: 'it-territory', pub: ['mail-ru-games'],
    platforms: ['web'],
    summary: 'Браузерная онлайн-ролевая игра о войне двух рас, ставшая самой популярной в Рунете середины нулевых и принёсшая IT Territory деньги Mail.Ru.',
  },
  'alien-shooter-2': {
    name: 'Alien Shooter 2: Reloaded', alt: ['Alien Shooter 2', 'Alien Shooter: Vengeance'], year: 2006, type: 'shooter', class: 'shoot-em-up', dev: 'sigma-team', pub: ['1c'], series: 'alien-shooter', pred: ['alien-shooter'],
    platforms: ['windows'], steam: 33120,
    summary: 'Продолжение с ролевой прокачкой, наёмниками и ещё большим числом монстров на экране.',
  },
  'you-are-empty': {
    name: 'You Are Empty', alt: ['Ты пуст'], year: 2006, type: 'shooter', class: 'fps', dev: 'mandel-artplains', pub: ['1c'],
    platforms: ['windows'],
    summary: 'Шутер об альтернативном СССР 1950-х, где эксперимент по созданию сверхчеловека превратил жителей в мутантов. Запомнился стилем сталинской Москвы больше, чем стрельбой.',
  },
  'stalker-shoc': {
    name: 'S.T.A.L.K.E.R.: Тень Чернобыля', alt: ['S.T.A.L.K.E.R.', 'Сталкер', 'Shadow of Chernobyl'], year: 2007, type: 'shooter', class: 'open-world', dev: 'gsc-game-world', pub: ['gsc-game-world'], series: 'stalker', engines: ['x-ray'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 4500,
    basedOn: ['Пикник на обочине | Аркадий и Борис Стругацкие | СССР | 1972', 'Сталкер | Андрей Тарковский | СССР | 1979'],
    summary: 'Шутер о Зоне отчуждения вокруг Чернобыльской АЭС с аномалиями, артефактами и живущими своей жизнью сталкерами. Шесть лет разработки и самая влиятельная игра постсоветского пространства.',
  },
  'stalker-cs': {
    name: 'S.T.A.L.K.E.R.: Чистое небо', alt: ['Clear Sky', 'Чистое небо'], year: 2008, type: 'shooter', class: 'open-world', dev: 'gsc-game-world', pub: ['gsc-game-world'], series: 'stalker', pred: ['stalker-shoc'], engines: ['x-ray'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 20510,
    summary: 'Приквел о войне группировок за территорию Зоны с обновлённым движком, апгрейдами оружия и печально известными вылетами на релизе.',
  },
  'stalker-cop': {
    name: 'S.T.A.L.K.E.R.: Зов Припяти', alt: ['Call of Pripyat', 'Зов Припяти'], year: 2009, type: 'shooter', class: 'open-world', dev: 'gsc-game-world', pub: ['gsc-game-world'], series: 'stalker', pred: ['stalker-cs'], engines: ['x-ray'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 41700,
    summary: 'Три большие локации, свободное исследование и самая стабильная часть трилогии. Многими считается лучшей игрой серии.',
  },
  'corsairs-return': {
    name: 'Корсары: Возвращение легенды', alt: ['Корсары: ВЛ', 'Age of Pirates 2: City of Abandoned Ships'], year: 2007, type: 'rpg', class: 'action-rpg', dev: 'seaward', pub: ['akella'], series: 'corsairs', pred: ['corsairs-3'], engines: ['storm-engine'],
    platforms: ['windows'], steam: 12430,
    summary: 'Часть, сделанную фанатами, признали лучшей в серии: огромный Карибский архипелаг, десятки квестов и «Город потерянных кораблей» как продолжение.',
  },
  'farm-frenzy': {
    name: 'Весёлая ферма', alt: ['Farm Frenzy'], year: 2007, type: 'puzzle', class: 'time-management', dev: 'melesta', pub: ['alawar'],
    platforms: ['windows', 'ios', 'android'], steam: 3410,
    summary: 'Тайм-менеджер о ферме, где надо успевать поливать траву, кормить кур и отгонять медведей. Самая известная казуальная игра русскоязычного рынка, разошедшаяся десятками продолжений.',
  },
  'cradle-of-rome': {
    name: 'Cradle of Rome', alt: ['Колыбель Рима'], year: 2007, type: 'puzzle', class: 'match-3', dev: 'awem',
    platforms: ['windows', 'ios'],
    summary: 'Головоломка «три в ряд», где собранные ресурсы идут на постройку Рима. Хит казуальных порталов середины нулевых.',
  },
  'sudden-strike-3': {
    name: 'Sudden Strike 3: Arms for Victory', alt: ['Противостояние: Последняя битва'], year: 2007, type: 'strategy', class: 'rts', dev: 'fireglow', pub: ['russobit-m'], series: 'sudden-strike', pred: ['sudden-strike-2'],
    platforms: ['windows'], steam: 315990,
    summary: 'Переход серии в трёхмерную графику с морскими десантами и Тихим океаном.',
  },
  turgor: {
    name: 'Тургор', alt: ['The Void', 'Tension'], year: 2008, type: 'adventure', class: 'interactive-story', dev: 'ice-pick-lodge', pub: ['novy-disk'],
    platforms: ['windows'], steam: 37000,
    summary: 'Игра о Промежутке между жизнью и смертью, где единственный ресурс — цвет: им рисуют, кормят Сестёр и сражаются с Братьями. Самая радикальная работа Ice-Pick Lodge.',
  },
  'kings-bounty-legend': {
    name: 'King’s Bounty: Легенда о рыцаре', alt: ['King’s Bounty: The Legend'], year: 2008, type: 'rpg', class: 'tactical-rpg', dev: 'katauri', pub: ['1c'], series: 'kings-bounty', engines: ['theengine'],
    platforms: ['windows', 'macos'], steam: 25900,
    summary: 'Возрождение классики 1990 года: герой путешествует по сказочному миру, а бои идут на шестиугольном поле как в Heroes of Might and Magic. Одна из самых тепло принятых российских игр на Западе.',
  },
  'kings-bounty-princess': {
    name: 'King’s Bounty: Принцесса в доспехах', alt: ['King’s Bounty: Armored Princess'], year: 2009, type: 'rpg', class: 'tactical-rpg', dev: 'katauri', pub: ['1c'], series: 'kings-bounty', pred: ['kings-bounty-legend'], engines: ['theengine'],
    platforms: ['windows', 'macos'], steam: 25910,
    summary: 'Самостоятельное продолжение о принцессе Амели с ручным драконом, новыми островами и медалями за подвиги.',
  },
  cryostasis: {
    name: 'Cryostasis', alt: ['Анабиоз: Сон разума'], year: 2008, type: 'shooter', class: 'horror', dev: 'action-forms', pub: ['1c'], engines: ['atmosfear'],
    platforms: ['windows'],
    summary: 'Хоррор на вмёрзшем в лёд атомном ледоколе «Северный ветер»: герой греется у любого источника тепла и переживает смерти членов экипажа. Одна из первых игр с физикой воды на PhysX.',
  },
  'xenus-2': {
    name: 'Xenus 2: Белое золото', alt: ['White Gold: War in Paradise'], year: 2008, type: 'shooter', class: 'open-world', dev: 'deep-shadows', pub: ['russobit-m'], series: 'xenus', pred: ['xenus'], engines: ['vital-engine'],
    platforms: ['windows'],
    summary: 'Продолжение на карибском архипелаге: острова, лодки и тот же герой Сол Майерс на обновлённом Vital Engine.',
  },
  'perimeter-2': {
    name: 'Периметр 2: Новая Земля', alt: ['Perimeter 2: New Earth'], year: 2008, type: 'strategy', class: 'rts', dev: 'kd-lab', pub: ['1c'], series: 'perimeter', pred: ['perimeter'],
    platforms: ['windows'],
    summary: 'Продолжение о войне двух рас за землю и воду: одни заливают мир, другие сушат. Более традиционная стратегия, чем первая часть.',
  },
  fishdom: {
    name: 'Fishdom', alt: [], year: 2008, end: null, type: 'puzzle', class: 'match-3', dev: 'playrix', series: 'scapes',
    platforms: ['windows', 'ios', 'android'],
    summary: 'Головоломка «три в ряд», где выигрыш тратится на обустройство аквариума. Первый большой хит Playrix, переросший в мобильную игру с сотнями миллионов загрузок.',
  },
  'dcs-black-shark': {
    name: 'DCS: Black Shark', alt: ['Ка-50 Чёрная акула'], year: 2008, type: 'simulation', class: 'flight-sim', dev: 'eagle-dynamics', pub: ['1c'], series: 'dcs', pred: ['lock-on'],
    platforms: ['windows'],
    summary: 'Симулятор вертолёта Ка-50 с точностью учебного тренажёра: каждый переключатель в кабине работает. Первый модуль будущей платформы DCS World.',
  },
  'dcs-world': {
    name: 'DCS World', alt: ['Digital Combat Simulator'], year: 2012, end: null, type: 'simulation', class: 'flight-sim', dev: 'eagle-dynamics', series: 'dcs', pred: ['dcs-black-shark'], engines: ['edge'],
    platforms: ['windows'], steam: 223750,
    summary: 'Бесплатная платформа боевых симуляторов, к которой выходят платные модули самолётов, вертолётов и карт. Самый детальный авиасимулятор в мире делается в Москве.',
  },
  'death-track': {
    name: 'Death Track: Возрождение', alt: ['Death Track: Resurrection'], year: 2008, type: 'racing', class: 'combat-racing', dev: 'skyfallen', pub: ['1c'],
    platforms: ['windows', 'playstation-3'],
    summary: 'Боевые гонки по разрушенным столицам мира с ракетами и пулемётами — перезапуск игры 1989 года. Одна из немногих российских игр на PlayStation 3.',
  },
  'men-of-war': {
    name: 'В тылу врага 2: Лис пустыни', alt: ['Men of War'], year: 2009, type: 'strategy', class: 'tactics', dev: 'best-way', pub: ['1c'], series: 'men-of-war', pred: ['men-of-war-2'], engines: ['gem'],
    platforms: ['windows'], steam: 7830,
    summary: 'Часть, известная в мире как Men of War: с неё началась международная слава серии и десяток самостоятельных дополнений.',
  },
  precursors: {
    name: 'Precursors', alt: ['Предтечи'], year: 2009, type: 'rpg', class: 'space-rpg', dev: 'deep-shadows', pub: ['russobit-m'], engines: ['vital-engine'],
    platforms: ['windows'],
    summary: 'Космическая ролевая игра, где можно ходить по планетам, летать между звёздами и стрелять в открытом мире. Самый амбициозный проект Deep Shadows.',
  },
  'allods-online': {
    name: 'Аллоды Онлайн', alt: ['Allods Online'], year: 2009, end: null, type: 'online', class: 'mmorpg', dev: 'nival', pub: ['mail-ru-games'], series: 'allods',
    platforms: ['windows'], steam: 241720,
    summary: 'Онлайн-ролевая игра в мире «Аллодов» с астральными кораблями и битвами между кораблями в астрале. Самая дорогая российская игра своего времени и главная MMORPG Рунета.',
  },
  'il-2-birds-of-prey': {
    name: 'Ил-2 Штурмовик: Крылатые хищники', alt: ['IL-2 Sturmovik: Birds of Prey', 'Wings of Prey'], year: 2009, type: 'simulation', class: 'flight-sim', dev: 'gaijin', pub: ['1c'], series: 'il-2', engines: ['dagor'],
    platforms: ['playstation-3', 'xbox-360', 'psp', 'windows'],
    summary: 'Консольный «Ил-2» от Gaijin с аркадным и реалистичным режимами и лучшими на тот момент видами земли с высоты. На PC вышел как Wings of Prey и стал основой War Thunder.',
  },
  'x-blades': {
    name: 'X-Blades', alt: ['Ониблэйд'], year: 2009, type: 'action', class: 'action-adventure', dev: 'gaijin', pub: ['1c'], engines: ['dagor'],
    platforms: ['windows', 'playstation-3', 'xbox-360'], steam: 11460,
    summary: 'Слэшер об охотнице за сокровищами Аюми в аниме-стилистике. Первая российская игра, вышедшая одновременно на двух консолях седьмого поколения.',
  },
  'hard-truck-3': {
    name: 'Дальнобойщики 3: Покорение Америки', alt: ['Rig’n’Roll'], year: 2009, type: 'simulation', class: 'truck-sim', dev: 'softlab-nsk', pub: ['1c'], series: 'dalnoboyshchiki', pred: ['hard-truck-2'],
    platforms: ['windows'], steam: 20560,
    summary: 'Калифорния, реальные шоссе и десять лет разработки: самый долгий долгострой российского игростроя, вышедший под именем Rig’n’Roll.',
  },
  'tanki-online': {
    name: 'Танки Онлайн', alt: ['Tanki Online'], year: 2009, end: null, type: 'online', class: 'vehicle-mmo', dev: 'alternativa', engines: ['alternativa3d', 'unity'],
    platforms: ['web', 'windows', 'android', 'ios'],
    summary: 'Трёхмерный танковый боевик прямо в браузере, сделанный в Перми на Flash. Одна из самых массовых онлайн-игр Рунета, пережившая уход Flash переходом на Unity.',
  },

  // ── Десятые ──────────────────────────────────────────────────────────
  'metro-2033': {
    name: 'Metro 2033', alt: ['Метро 2033'], year: 2010, type: 'shooter', class: 'fps', dev: '4a-games', pub: ['akella'], series: 'metro', engines: ['4a-engine'],
    platforms: ['windows', 'xbox-360'], steam: 43110,
    basedOn: ['Метро 2033 | Дмитрий Глуховский | Россия | 2005'],
    summary: 'Шутер по роману Глуховского о жизни в московском метро после ядерной войны: патроны как валюта, противогазы и вылазки на поверхность. Первая постсоветская игра, изданная THQ на консолях.',
  },
  'world-of-tanks': {
    name: 'World of Tanks', alt: ['WoT', 'Танки'], year: 2010, end: null, type: 'online', class: 'vehicle-mmo', dev: 'wargaming', pub: ['wargaming'], series: 'world-of', engines: ['bigworld', 'core'],
    platforms: ['windows', 'xbox-360', 'xbox-one', 'playstation-4', 'playstation-5', 'xbox-series'], steam: 1407200,
    summary: 'Танковые бои пятнадцать на пятнадцать на технике первой половины XX века. Игра, сделавшая минскую Wargaming одной из крупнейших компаний индустрии: сотни миллионов регистраций.',
  },
  'cut-the-rope': {
    name: 'Cut the Rope', alt: [], year: 2010, type: 'puzzle', class: 'physics-puzzle', dev: 'zeptolab',
    platforms: ['ios', 'android'],
    summary: 'Физическая головоломка: перерезать верёвки так, чтобы конфета попала в рот монстрику Ам Няму. Первая мировая сенсация App Store из России, больше миллиарда загрузок серии.',
  },
  'il-2-cliffs-of-dover': {
    name: 'Ил-2 Штурмовик: Битва за Британию', alt: ['IL-2 Sturmovik: Cliffs of Dover'], year: 2011, type: 'simulation', class: 'flight-sim', dev: 'maddox-games', pub: ['1c'], series: 'il-2', pred: ['il-2-1946'],
    platforms: ['windows'], steam: 63950,
    summary: 'Новый движок и битва за Британию 1940 года. Тяжёлый релиз, закрывший Maddox Games, но спасённый сообществом в виде Blitz Edition.',
  },
  'postal-3': {
    name: 'Postal III', alt: ['Postal 3'], year: 2011, type: 'shooter', class: 'tps', dev: 'akella', pub: ['akella'],
    platforms: ['windows'],
    summary: 'Продолжение скандальной американской серии, отданное в разработку «Акелле». Вышло настолько сырым, что Running With Scissors отреклись от него, а игру убрали из Steam.',
  },
  vector: {
    name: 'Vector', alt: [], year: 2012, type: 'action', class: 'platformer', dev: 'nekki',
    platforms: ['ios', 'android', 'windows'], steam: 248970,
    summary: 'Паркур-раннер о бегущем от системы человеке с анимацией по захвату движений. Первый мировой хит Nekki.',
  },
  'war-thunder': {
    name: 'War Thunder', alt: [], year: 2012, end: null, type: 'online', class: 'vehicle-mmo', dev: 'gaijin', pub: ['gaijin'], engines: ['dagor'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'xbox-one', 'playstation-5', 'xbox-series'], steam: 236390,
    summary: 'Онлайн-бои самолётов, танков и кораблей от Второй мировой до наших дней в одном матче. Выросла из «Крылатых хищников» и стала одной из самых массовых игр Steam.',
  },
  warface: {
    name: 'Warface', alt: [], year: 2012, end: null, type: 'online', class: 'mmo-shooter', dev: 'crytek-kiev', pub: ['mail-ru-games'], engines: ['cryengine'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 291480,
    summary: 'Бесплатный шутер на CryEngine с классами, кооперативными операциями и сетевыми боями. Главный онлайн-шутер Рунета десятых.',
  },
  'prime-world': {
    name: 'Prime World', alt: [], year: 2012, end: null, type: 'online', class: 'moba', dev: 'nival',
    platforms: ['windows'],
    summary: 'MOBA с замком, который игрок отстраивает между боями, и героями, различающимися по стороне конфликта. Попытка Nival войти в жанр Dota.',
  },
  'star-conflict': {
    name: 'Star Conflict', alt: [], year: 2012, end: null, type: 'online', class: 'vehicle-mmo', dev: 'targem', pub: ['gaijin'],
    platforms: ['windows', 'macos', 'linux'], steam: 212070,
    summary: 'Космический онлайн-боевик о сражениях эскадрилий истребителей в духе Freelancer, изданный Gaijin.',
  },
  'blades-of-time': {
    name: 'Blades of Time', alt: [], year: 2012, type: 'action', class: 'action-adventure', dev: 'gaijin', pred: ['x-blades'], engines: ['dagor'],
    platforms: ['windows', 'playstation-3', 'xbox-360', 'nintendo-switch'], steam: 209330,
    summary: 'Слэшер с перемоткой времени, позволяющей сражаться вместе с собственными копиями. Продолжение X-Blades о той же героине.',
  },
  township: {
    name: 'Township', alt: [], year: 2012, end: null, type: 'puzzle', class: 'casual', dev: 'playrix', series: 'scapes',
    platforms: ['ios', 'android', 'windows'],
    summary: 'Ферма и город в одной игре: сеять, собирать, строить и торговать. Один из самых долгоживущих мобильных хитов Playrix.',
  },
  'royal-quest': {
    name: 'Royal Quest', alt: [], year: 2012, end: null, type: 'online', class: 'mmorpg', dev: 'katauri', pub: ['1c'],
    platforms: ['windows'], steam: 256150,
    summary: 'Онлайн-ролевая игра Katauri в мире Ауры с стилистикой King’s Bounty и элементальной системой боя.',
  },
  'corsairs-to-each': {
    name: 'Корсары: Каждому своё!', alt: ['Sea Dogs: To Each His Own'], year: 2012, type: 'rpg', class: 'action-rpg', dev: 'blackmark', series: 'corsairs', pred: ['corsairs-return'], engines: ['storm-engine'],
    platforms: ['windows'], steam: 223330,
    summary: 'Последняя большая часть «Корсаров»: сюжет о французском дворянине Шарле де Море, десятки часов квестов и знаменитая сложность. Сделана бывшими фанатами на движке 2000 года.',
  },
  'metro-last-light': {
    name: 'Metro: Last Light', alt: ['Метро: Луч надежды'], year: 2013, type: 'shooter', class: 'fps', dev: '4a-games', pub: ['buka'], series: 'metro', pred: ['metro-2033'], engines: ['4a-engine'],
    platforms: ['windows', 'playstation-3', 'xbox-360', 'linux', 'macos', 'playstation-4', 'xbox-one'], steam: 43160,
    summary: 'Продолжение с оригинальным сюжетом Глуховского о Чёрных и войне между станциями. Более зрелищное и просторное, чем первая часть.',
  },
  'knock-knock': {
    name: 'Тук-тук-тук', alt: ['Knock-Knock'], year: 2013, type: 'adventure', class: 'horror', dev: 'ice-pick-lodge', engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'ios', 'android', 'playstation-4'], steam: 250380,
    summary: 'Хоррор о Жильце, который ночами обходит дом и включает свет, спасаясь от Гостей. Собран на Kickstarter и выполнен в рисованной стилистике.',
  },
  survarium: {
    name: 'Survarium', alt: [], year: 2013, end: 2022, type: 'online', class: 'mmo-shooter', dev: 'vostok-games',
    platforms: ['windows'],
    summary: 'Сетевой шутер о мире, захваченном аномальным лесом, от бывших разработчиков S.T.A.L.K.E.R. 2. Так и не дожил до обещанного открытого мира и закрылся в 2022 году.',
  },
  'world-of-warplanes': {
    name: 'World of Warplanes', alt: ['WoWp'], year: 2013, end: null, type: 'online', class: 'vehicle-mmo', dev: 'wargaming', pub: ['wargaming'], series: 'world-of', engines: ['bigworld'],
    platforms: ['windows'],
    summary: 'Воздушные бои на самолётах 1930–1950-х в духе World of Tanks. Разработана киевской Persha Studia внутри Wargaming.',
  },
  'il-2-battle-of-stalingrad': {
    name: 'Ил-2 Штурмовик: Битва за Сталинград', alt: ['IL-2 Sturmovik: Battle of Stalingrad', 'Ил-2 Штурмовик: Великие сражения'], year: 2013, end: null, type: 'simulation', class: 'flight-sim', dev: '1c-game-studios', pub: ['1c'], series: 'il-2', engines: ['digital-nature'],
    platforms: ['windows'], steam: 307960,
    summary: 'Перезапуск серии на движке Rise of Flight: Сталинград, Москва, Кубань и десятки самолётов в одной платформе «Великие сражения», которая развивается до сих пор.',
  },
  'shadow-fight-2': {
    name: 'Shadow Fight 2', alt: [], year: 2014, type: 'action', class: 'fighting', dev: 'nekki', series: 'shadow-fight',
    platforms: ['ios', 'android', 'windows', 'nintendo-switch'],
    summary: 'Файтинг о бойце-тени с оружием и магией, скачанный более полумиллиарда раз. Одна из самых успешных мобильных игр из России.',
  },
  'war-robots': {
    name: 'War Robots', alt: ['Walking War Robots'], year: 2014, end: null, type: 'online', class: 'mmo-shooter', dev: 'pixonic', pub: ['mail-ru-games'], engines: ['unity'],
    platforms: ['ios', 'android', 'windows'], steam:
      1078260,
    summary: 'Сетевые бои шагающих роботов шесть на шесть на телефоне. Сотни миллионов загрузок и одна из главных мобильных игр MY.GAMES.',
  },
  'sherlock-crimes': {
    name: 'Шерлок Холмс: Преступления и наказания', alt: ['Sherlock Holmes: Crimes & Punishments'], year: 2014, type: 'adventure', class: 'quest', dev: 'frogwares', series: 'sherlock-holmes', pred: ['sherlock-silver-earring'], engines: ['unreal-engine-3'],
    platforms: ['windows', 'playstation-3', 'playstation-4', 'xbox-360', 'xbox-one', 'nintendo-switch'], steam: 241260,
    summary: 'Шесть дел с возможностью обвинить невиновного и отпустить преступника. Лучшая, по мнению критики, часть серии Frogwares.',
  },
  'world-of-warships': {
    name: 'World of Warships', alt: ['WoWs'], year: 2015, end: null, type: 'online', class: 'vehicle-mmo', dev: 'lesta', pub: ['wargaming'], series: 'world-of', engines: ['bigworld'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'playstation-5', 'xbox-series'], steam: 552990,
    summary: 'Морские бои на линкорах, крейсерах, эсминцах и авианосцах первой половины XX века. Сделана петербургской Lesta и после 2022 года разделилась на две версии.',
  },
  skyforge: {
    name: 'Skyforge', alt: [], year: 2015, end: null, type: 'online', class: 'mmorpg', dev: 'allods-team', pub: ['mail-ru-games'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 414530,
    summary: 'Онлайн-ролевая игра о мире Аэлион, где игрок становится бессмертным и в конце концов богом; сделана вместе с американской Obsidian.',
  },
  'party-hard': {
    name: 'Party Hard', alt: [], year: 2015, type: 'action', class: 'stealth', dev: 'pinokl', pub: ['tinybuild'], engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'xbox-one', 'nintendo-switch', 'ios', 'android'], steam: 356570,
    summary: 'Стелс о человеке, которому мешает спать вечеринка за стеной, и он решает вопрос радикально. Пиксельный хит стримов от киевской Pinokl.',
  },
  shadowmatic: {
    name: 'Shadowmatic', alt: [], year: 2015, type: 'puzzle', class: 'puzzle', dev: 'triada',
    platforms: ['ios', 'android'],
    summary: 'Головоломка, где абстрактный предмет нужно повернуть так, чтобы его тень стала узнаваемым силуэтом. Обладатель Apple Design Award из Еревана.',
  },
  cradle: {
    name: 'Cradle', alt: [], year: 2015, type: 'adventure', class: 'walking-sim', dev: 'flying-cafe', engines: ['unigine'],
    platforms: ['windows', 'linux'], steam: 219890,
    summary: 'Фантастическое приключение в монгольской степи будущего: юрта, механическая девушка и заброшенный парк аттракционов. Одна из немногих игр на томском Unigine.',
  },
  beholder: {
    name: 'Beholder', alt: [], year: 2016, type: 'adventure', class: 'interactive-story', dev: 'warm-lamp', pub: ['alawar'], series: 'beholder', engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'ios', 'android', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 475550,
    summary: 'Игрок — управдом тоталитарного государства, который ставит камеры, следит за жильцами и пишет доносы, выбирая между совестью и семьёй. Миллионы копий и экранизация.',
  },
  gardenscapes: {
    name: 'Gardenscapes', alt: [], year: 2016, end: null, type: 'puzzle', class: 'match-3', dev: 'playrix', series: 'scapes',
    platforms: ['ios', 'android'],
    summary: 'Дворецкий Остин восстанавливает сад, а игрок зарабатывает на это в «три в ряд». Игра, сделавшая Playrix одним из крупнейших мобильных издателей мира.',
  },
  'punch-club': {
    name: 'Punch Club', alt: [], year: 2016, type: 'simulation', class: 'life-sim', dev: 'lazy-bear', pub: ['tinybuild'], engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'ios', 'android', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 394310,
    summary: 'Пиксельный симулятор боксёра из восьмидесятых: тренировки, работа, любовь и путь к мести за отца. Первый релиз, который tinyBuild запустил через прохождение на Twitch.',
  },
  '35mm': {
    name: '35MM', alt: [], year: 2016, type: 'adventure', class: 'walking-sim', dev: 'noskov', engines: ['unity'],
    platforms: ['windows'], steam: 442760,
    summary: 'Двое идут через опустевшую после эпидемии Россию: деревни, гаражи, электрички. Сделана одним человеком и стала главной русской «инди про провинцию».',
  },
  'escape-from-tarkov': {
    name: 'Escape from Tarkov', alt: ['Тарков'], year: 2017, end: null, type: 'shooter', class: 'extraction-shooter', dev: 'battlestate', engines: ['unity'],
    platforms: ['windows'],
    summary: 'Хардкорный шутер о вымышленном городе Таркове: рейды за лутом, смерть с потерей всего и баллистика с медициной по-настоящему. Породил целый жанр шутеров с эвакуацией.',
  },
  crossout: {
    name: 'Crossout', alt: [], year: 2017, end: null, type: 'online', class: 'vehicle-mmo', dev: 'targem', pub: ['gaijin'], series: 'ex-machina', engines: ['dagor'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'playstation-5', 'xbox-series'], steam: 386180,
    summary: 'Онлайн-бои на машинах, собранных из деталей по кусочкам: наследник Ex Machina, где каждая часть машины отстреливается отдельно.',
  },
  'hello-neighbor': {
    name: 'Hello Neighbor', alt: ['Привет, сосед'], year: 2017, type: 'action', class: 'stealth', dev: 'dynamic-pixels', pub: ['tinybuild'], engines: ['unreal-engine-4'],
    platforms: ['windows', 'xbox-one', 'playstation-4', 'nintendo-switch', 'ios', 'android'], steam: 521890,
    summary: 'Стелс-хоррор о мальчике, который пробирается в дом соседа узнать, что тот прячет в подвале. Сосед учится на действиях игрока; миллиарды просмотров на YouTube.',
  },
  'blitzkrieg-3': {
    name: 'Блицкриг 3', alt: ['Blitzkrieg 3'], year: 2017, type: 'strategy', class: 'rts', dev: 'nival', series: 'blitzkrieg', pred: ['blitzkrieg'],
    platforms: ['windows', 'macos'], steam: 235380,
    summary: 'Онлайн-стратегия с асинхронными штурмами чужих укреплений и первым в жанре нейросетевым противником «Борисом».',
  },
  'shadow-fight-3': {
    name: 'Shadow Fight 3', alt: [], year: 2017, type: 'action', class: 'fighting', dev: 'nekki', series: 'shadow-fight', pred: ['shadow-fight-2'], engines: ['unity'],
    platforms: ['ios', 'android', 'nintendo-switch'],
    summary: 'Трёхмерное продолжение с полноценными моделями бойцов вместо теней и сюжетом о трёх фракциях.',
  },
  homescapes: {
    name: 'Homescapes', alt: [], year: 2017, end: null, type: 'puzzle', class: 'match-3', dev: 'playrix', series: 'scapes',
    platforms: ['ios', 'android'],
    summary: 'Тот же дворецкий Остин, но теперь ремонтирует родительский особняк. Вторая опора мобильной империи Playrix.',
  },
  'standoff-2': {
    name: 'Standoff 2', alt: [], year: 2017, end: null, type: 'online', class: 'mmo-shooter', dev: 'axlebolt', engines: ['unity'],
    platforms: ['ios', 'android'],
    summary: 'Мобильный тактический шутер пять на пять в духе Counter-Strike: закладка бомбы, экономика раундов и скины. Одна из самых популярных игр среди подростков СНГ.',
  },
  'the-mooseman': {
    name: 'Человеколось', alt: ['The Mooseman'], year: 2017, type: 'adventure', class: 'interactive-story', dev: 'morteshka', engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'ios', 'android', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 573910,
    summary: 'Путь через три мира по мифам коми-пермяков в стилистике пермского звериного стиля. Первая игра пермской Morteshka.',
  },
  'pathfinder-kingmaker': {
    name: 'Pathfinder: Kingmaker', alt: [], year: 2018, type: 'rpg', class: 'crpg', dev: 'owlcat', series: 'pathfinder', engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'xbox-one'], steam: 640820,
    summary: 'Изометрическая ролевая игра по настольной системе Pathfinder с управлением собственным королевством. Первая большая партийная RPG из России со времён девяностых.',
  },
  'graveyard-keeper': {
    name: 'Graveyard Keeper', alt: [], year: 2018, type: 'simulation', class: 'life-sim', dev: 'lazy-bear', pub: ['tinybuild'], engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'xbox-one', 'nintendo-switch', 'ios', 'android'], steam: 599140,
    summary: 'Средневековый симулятор кладбищенского смотрителя, который хоронит, торгует и чинит церковь. «Самая неточная средневековая игра» по словам авторов.',
  },
  'atom-rpg': {
    name: 'ATOM RPG', alt: [], year: 2018, type: 'rpg', class: 'crpg', dev: 'atom-team', series: 'atom-rpg', engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'xbox-one', 'nintendo-switch', 'ios', 'android'], steam: 552620,
    basedOn: ['Fallout | Interplay | США | 1997'],
    summary: 'СССР через двадцать лет после ядерной войны 1986 года в духе первых Fallout: изометрия, пошаговые бои и деревни с бабками у забора. Собран на Kickstarter.',
  },
  'beholder-2': {
    name: 'Beholder 2', alt: [], year: 2018, type: 'adventure', class: 'interactive-story', dev: 'warm-lamp', pub: ['alawar'], series: 'beholder', pred: ['beholder'], engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'ios', 'android', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 761620,
    summary: 'Продолжение о карьере в министерстве того же государства: доносы на коллег и путь наверх.',
  },
  'metro-exodus': {
    name: 'Metro Exodus', alt: ['Метро: Исход'], year: 2019, type: 'shooter', class: 'fps', dev: '4a-games', series: 'metro', pred: ['metro-last-light'], engines: ['4a-engine'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'playstation-5', 'xbox-series', 'macos', 'linux'], steam: 412020,
    summary: 'Выход из метро: паровоз «Аврора» идёт через Волгу, Каспий и тайгу к Байкалу. Одна из первых игр с трассировкой лучей в реальном времени.',
  },
  'pathologic-2': {
    name: 'Мор', alt: ['Pathologic 2'], year: 2019, type: 'adventure', class: 'survival', dev: 'ice-pick-lodge', series: 'pathologic', pred: ['pathologic'], engines: ['unity'],
    platforms: ['windows', 'playstation-4', 'xbox-one'], steam: 505230,
    summary: 'Пересказ «Мора. Утопии» за Гаруспика с новой графикой и ещё более жестоким выживанием. Признан одной из самых важных игр года при провальных продажах.',
  },
  'disco-elysium': {
    name: 'Disco Elysium', alt: [], year: 2019, type: 'rpg', class: 'crpg', dev: 'za-um', engines: ['unity'],
    platforms: ['windows', 'macos', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series', 'nintendo-switch'], steam: 632470,
    summary: 'Ролевая игра без боёв о детективе-алкоголике в городе Ревашоль, где навыки говорят с героем голосами. Эстонская студия получила за неё четыре награды The Game Awards.',
  },
  'sinking-city': {
    name: 'The Sinking City', alt: [], year: 2019, type: 'adventure', class: 'action-adventure', dev: 'frogwares', engines: ['unreal-engine-4'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch', 'playstation-5', 'xbox-series'], steam: 750110,
    summary: 'Детектив в тонущем городе Окмонте по мотивам Лавкрафта с открытым миром и расследованиями без подсказок. Прославился ещё и судом Frogwares с издателем.',
  },
  stoneshard: {
    name: 'Stoneshard', alt: [], year: 2020, end: null, type: 'rpg', class: 'roguelike', dev: 'ink-stains', engines: ['gamemaker'],
    platforms: ['windows', 'macos', 'linux'], steam: 625960,
    summary: 'Пошаговый роглайк в открытом средневековом мире с медициной, психикой и смертью навсегда. Живёт в раннем доступе с 2020 года.',
  },

  // ── Двадцатые ────────────────────────────────────────────────────────
  'loop-hero': {
    name: 'Loop Hero', alt: [], year: 2021, type: 'rpg', class: 'roguelike', dev: 'four-quarters',
    platforms: ['windows', 'macos', 'linux', 'nintendo-switch', 'ios', 'android'], steam: 1282730,
    summary: 'Герой сам идёт по кольцевой дороге, а игрок выкладывает вокруг карты местности, которые порождают врагов и ресурсы. Инди-сенсация 2021 года: миллион копий за месяц.',
  },
  'black-book': {
    name: 'Чёрная книга', alt: ['Black Book'], year: 2021, type: 'rpg', class: 'card', dev: 'morteshka', engines: ['unity'],
    platforms: ['windows', 'macos', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 1138660,
    summary: 'Карточная ролевая игра о знахарке Василисе в Пермском крае XIX века по настоящим быличкам и заговорам. Сделана с этнографами Пермского университета.',
  },
  'potion-craft': {
    name: 'Potion Craft', alt: ['Potion Craft: Alchemist Simulator'], year: 2021, type: 'simulation', class: 'crafting', dev: 'niceplay', pub: ['tinybuild'], engines: ['unity'],
    platforms: ['windows', 'xbox-one', 'xbox-series', 'playstation-4', 'playstation-5', 'nintendo-switch'], steam: 1210320,
    summary: 'Симулятор алхимика в стилистике средневековых манускриптов: зелья варятся движением по карте ингредиентов. Лидер продаж Steam в первую неделю раннего доступа.',
  },
  encased: {
    name: 'Encased', alt: [], year: 2021, type: 'rpg', class: 'crpg', dev: 'dark-crystal', engines: ['unity'],
    platforms: ['windows', 'macos', 'linux'], steam: 921800,
    summary: 'Изометрическая ролевая игра о Куполе — аномальной зоне с артефактами в альтернативных семидесятых, вдохновлённая Стругацкими и Fallout.',
  },
  'pathfinder-wotr': {
    name: 'Pathfinder: Wrath of the Righteous', alt: [], year: 2021, type: 'rpg', class: 'crpg', dev: 'owlcat', series: 'pathfinder', pred: ['pathfinder-kingmaker'], engines: ['unity'],
    platforms: ['windows', 'macos', 'playstation-4', 'xbox-one', 'nintendo-switch', 'playstation-5', 'xbox-series'], steam: 1184370,
    summary: 'Крестовый поход против демонов с мифическими путями героя от ангела до лича. Одна из самых больших ролевых игр десятилетия по объёму контента.',
  },
  'kings-bounty-2': {
    name: 'King’s Bounty II', alt: [], year: 2021, type: 'rpg', class: 'tactical-rpg', dev: '1c-entertainment', pub: ['1c-entertainment'], series: 'kings-bounty', pred: ['kings-bounty-princess'], engines: ['unreal-engine-4'],
    platforms: ['windows', 'playstation-4', 'xbox-one', 'nintendo-switch'], steam: 1141400,
    summary: 'Перезапуск серии с видом от третьего лица и мрачным реалистичным королевством Нострия вместо сказки. Принят прохладно и стал последней игрой 1C Entertainment до продажи.',
  },
  'sherlock-chapter-one': {
    name: 'Sherlock Holmes Chapter One', alt: [], year: 2021, type: 'adventure', class: 'open-world', dev: 'frogwares', series: 'sherlock-holmes', pred: ['sherlock-crimes'], engines: ['unreal-engine-4'],
    platforms: ['windows', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series'], steam: 1073320,
    summary: 'Молодой Холмс на средиземноморском острове Кордона ищет правду о смерти матери. Открытый мир и первый Холмс Frogwares без Ватсона.',
  },
  enlisted: {
    name: 'Enlisted', alt: [], year: 2021, end: null, type: 'online', class: 'mmo-shooter', dev: 'darkflow', pub: ['gaijin'], engines: ['dagor'],
    platforms: ['windows', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series'], steam: 2051620,
    summary: 'Шутер Второй мировой, где каждый игрок командует отрядом из нескольких солдат и может переключаться между ними. Сделан рижской Darkflow на движке Dagor.',
  },
  'atom-trudograd': {
    name: 'ATOM RPG Trudograd', alt: [], year: 2021, type: 'rpg', class: 'crpg', dev: 'atom-team', series: 'atom-rpg', pred: ['atom-rpg'], engines: ['unity'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'xbox-one', 'nintendo-switch', 'playstation-5', 'xbox-series', 'ios', 'android'], steam: 1139940,
    summary: 'Самостоятельное продолжение в огромном постъядерном городе Трудограде, к которому летит метеорит.',
  },
  'mir-tankov': {
    name: 'Мир танков', alt: [], year: 2022, end: null, type: 'online', class: 'vehicle-mmo', dev: 'lesta', series: 'world-of', basedOn: ['world-of-tanks'], engines: ['core'],
    platforms: ['windows'],
    summary: 'Российская версия World of Tanks, которую после раздела с Wargaming ведёт петербургская «Леста Игры» с собственными ветками техники и событиями.',
  },
  'siberian-mayhem': {
    name: 'Serious Sam: Siberian Mayhem', alt: [], year: 2022, type: 'shooter', class: 'fps', dev: 'timelock', engines: ['serious-engine'],
    platforms: ['windows', 'playstation-5', 'xbox-series'], steam: 1827280,
    summary: 'Официальное самостоятельное дополнение к Serious Sam 4 о походе Сэма через Сибирь: сделано российскими мододелами по заказу Croteam и Devolver.',
  },
  'despots-game': {
    name: 'Despot’s Game', alt: [], year: 2022, type: 'strategy', class: 'auto-battler', dev: 'konfa-games', pub: ['tinybuild'],
    platforms: ['windows', 'macos', 'linux', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series', 'nintendo-switch'], steam: 1227280,
    summary: 'Роглайк-автобатлер о толпе голых человечков в подземелье, которых надо одевать, кормить и бросать в бой против машины-деспота.',
  },
  'atomic-heart': {
    name: 'Atomic Heart', alt: [], year: 2023, type: 'shooter', class: 'fps', dev: 'mundfish', engines: ['unreal-engine-4'],
    platforms: ['windows', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series'], steam: 668580,
    basedOn: ['BioShock | Irrational Games | США | 2007'],
    summary: 'Шутер об альтернативном СССР 1955 года, где роботы восстали на Предприятии 3826: балерины-близняшки, полимер и советская эстетика. Самый крупный релиз из России со времён S.T.A.L.K.E.R.',
  },
  'rogue-trader': {
    name: 'Warhammer 40,000: Rogue Trader', alt: [], year: 2023, type: 'rpg', class: 'crpg', dev: 'owlcat', engines: ['unity'],
    platforms: ['windows', 'macos', 'playstation-5', 'xbox-series'], steam: 2186680,
    summary: 'Первая партийная ролевая игра по Warhammer 40,000: игрок — вольный торговец с собственным крейсером и сектором космоса.',
  },
  'sherlock-awakened': {
    name: 'Sherlock Holmes: The Awakened', alt: [], year: 2023, type: 'adventure', class: 'quest', dev: 'frogwares', series: 'sherlock-holmes', pred: ['sherlock-chapter-one'], engines: ['unreal-engine-4'],
    platforms: ['windows', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series', 'nintendo-switch'], steam: 1900950,
    summary: 'Пересказ лавкрафтовской части 2006 года, сделанный Frogwares во время войны и собранный на Kickstarter: Холмс и Ватсон против культа Ктулху.',
  },
  'torn-away': {
    name: 'Вдали', alt: ['Torn Away'], year: 2023, type: 'adventure', class: 'interactive-story', dev: 'perelesoq', engines: ['unity'],
    platforms: ['windows', 'macos', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series', 'nintendo-switch'], steam: 1443060,
    summary: 'Десятилетняя Ася бежит из трудового лагеря через Германию 1944 года домой. Приключение о войне без единого выстрела игрока.',
  },
  bookwalker: {
    name: 'The Bookwalker: Thief of Tales', alt: [], year: 2023, type: 'adventure', class: 'quest', dev: 'do-my-best', pub: ['tinybuild'],
    platforms: ['windows', 'playstation-4', 'playstation-5', 'xbox-one', 'xbox-series'], steam: 1432100,
    summary: 'Писатель-вор ходит внутрь книг и крадёт оттуда предметы: изометрия внутри историй, вид от первого лица снаружи.',
  },
  smuta: {
    name: 'Смута', alt: [], year: 2024, type: 'action', class: 'action-adventure', dev: 'cyberia-nova', engines: ['unreal-engine-5'],
    platforms: ['windows'],
    summary: 'Историческая игра о Смутном времени по роману Загоскина: боярин Юрий Милославский, Нижний Новгород и ополчение. Первый большой проект на грант Института развития интернета, встреченный шквалом критики.',
  },
  indika: {
    name: 'INDIKA', alt: ['Индика'], year: 2024, type: 'adventure', class: 'action-adventure', dev: 'odd-meter', engines: ['unreal-engine-5'],
    platforms: ['windows', 'playstation-5', 'xbox-series'], steam: 1373960,
    summary: 'Монахиня Индика идёт через альтернативную Россию конца XIX века с бесом в голове, паровыми машинами и пиксельными вставками. Сделана в Алма-Ате переехавшей из Москвы студией.',
  },
  selfloss: {
    name: 'Selfloss', alt: [], year: 2024, type: 'adventure', class: 'action-adventure', dev: 'goodwin-games',
    platforms: ['windows', 'playstation-5', 'xbox-series', 'nintendo-switch'], steam: 1465370,
    summary: 'Старик Казимир с волшебным посохом плывёт на лодке по миру славянских и исландских мифов, чтобы исцелить свою утрату.',
  },
  'stalker-2': {
    name: 'S.T.A.L.K.E.R. 2: Сердце Чернобыля', alt: ['S.T.A.L.K.E.R. 2', 'Heart of Chornobyl'], year: 2024, type: 'shooter', class: 'open-world', dev: 'gsc-game-world', pub: ['gsc-game-world'], series: 'stalker', pred: ['stalker-cop'], engines: ['unreal-engine-5'],
    platforms: ['windows', 'xbox-series'], steam: 1643320,
    summary: 'Возвращение в Зону через пятнадцать лет: бесшовный открытый мир на Unreal Engine 5, сделанный студией, переехавшей из Киева в Прагу во время войны.',
  },
};
