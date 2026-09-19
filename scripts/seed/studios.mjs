/**
 * Реестр студий и издателей: заготовки для src/content/studios.
 *
 * Формат: id → { names: [[name, short, from, to]], city, country, founded, closed, kind, summary, website }.
 * Тексты статей пишутся отдельно; здесь только карточка.
 */
export const STUDIOS = {
  // ── Советская эпоха ──────────────────────────────────────────────────
  'vc-an-sssr': {
    names: [['Вычислительный центр Академии наук СССР', 'ВЦ АН СССР', 1955, null]],
    city: 'Москва', country: 'ussr', founded: 1955, closed: null, kind: 'developer',
    summary: 'Академический институт, где в 1984 году Алексей Пажитнов написал «Тетрис» на «Электронике-60». Не игровая студия, а место рождения самой известной игры, сделанной в СССР.',
  },
  doka: {
    names: [['Дока', 'Дока', 1987, null]],
    city: 'Зеленоград', country: 'ussr', founded: 1987, closed: null, kind: 'both',
    summary: 'Одно из первых советских программистских объединений: участвовало в лицензировании «Тетриса» на Запад и выпустило вместе с Пажитновым головоломки Welltris и Faces.',
  },
  elektronika: {
    names: [['Научно-производственное объединение «Электроника»', 'Электроника', 1970, null]],
    city: 'Зеленоград', country: 'ussr', founded: 1970, closed: null, kind: 'both',
    summary: 'Торговая марка советской микроэлектроники: под ней выходили калькуляторы, часы и карманные игры серии «Электроника ИМ», самая известная из которых — «Ну, погоди!».',
  },
  ratep: {
    names: [['Серпуховский радиотехнический завод', 'Серпуховский радиозавод', 1943, 1990], ['РАТЕП', 'РАТЕП', 1990, null]],
    city: 'Серпухов', country: 'ussr', founded: 1943, closed: null, kind: 'developer',
    summary: 'Оборонный завод, который в семидесятые собирал самый известный советский игровой автомат — «Морской бой». Автоматы делали в порядке конверсии на предприятиях Минрадиопрома.',
  },

  // ── Девяностые ───────────────────────────────────────────────────────
  nikita: {
    names: [['Locis', 'Locis', 1990, 1991], ['Компания «Никита»', 'Никита', 1991, 2007], ['Nikita Online', 'Nikita Online', 2007, null]],
    city: 'Москва', country: 'russia', founded: 1990, closed: null, kind: 'both',
    summary: 'Старейшая российская игровая компания: от «Перестройки» с прыгающими лягушками до космического боевика Parkan и онлайн-игр. Основана Никитой Скрипкиным.',
    website: 'https://nikita.ru',
  },
  gamos: {
    names: [['Gamos', 'Gamos', 1991, null]],
    city: 'Москва', country: 'russia', founded: 1991, closed: null, kind: 'developer',
    summary: 'Московская студия, придумавшая Color Lines — головоломку, которую до сих пор клонируют по всему миру, — и сделавшая квест по мультфильму «Братья Пилоты».',
  },
  'auric-vision': {
    names: [['Auric Vision', 'Auric Vision', 1996, null]],
    city: 'Москва', country: 'russia', founded: 1996, closed: null, kind: 'developer',
    summary: 'Студия одного хита: квест «ГЭГ: Отвязное приключение» 1997 года стал первым по-настоящему массовым отечественным квестом и задал тон юмористической школе жанра.',
  },
  skif: {
    names: [['S.K.I.F.', 'S.K.I.F.', 1996, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 1996, closed: null, kind: 'developer',
    summary: 'Петербургская студия, придумавшая Петьку и Василия Ивановича: первые две части самого долгого сериала российских квестов вышли именно здесь.',
  },
  'saturn-plus': {
    names: [['Сатурн-плюс', 'Сатурн-плюс', 1998, null]],
    city: 'Калуга', country: 'russia', founded: 1998, closed: null, kind: 'developer',
    summary: 'Калужская студия, которая с третьей части взяла на себя сериал «Петька и Василий Иванович» и довела его до девятого выпуска.',
  },
  buka: {
    names: [['Бука', 'Бука', 1993, null]],
    city: 'Москва', country: 'russia', founded: 1993, closed: null, kind: 'both',
    summary: 'Один из трёх больших издателей девяностых и нулевых: «Петька», «Штырлиц», «Вангеры», «Дальнобойщики», «Аллоды» вышли под маркой «Буки». Собственная разработка — квесты про Штырлица.',
    website: 'https://buka.ru',
  },
  '1c': {
    names: [['Фирма «1С»', '1С', 1991, null]],
    city: 'Москва', country: 'russia', founded: 1991, closed: null, kind: 'publisher',
    summary: 'Крупнейший издатель отечественных игр нулевых: жёлто-красные jewel-боксы «1С» стояли в каждом киоске. Издавала «Ил-2», «Космических рейнджеров», «Блицкриг», «Мор», King’s Bounty.',
    website: 'https://1c.ru',
  },
  akella: {
    names: [['Акелла', 'Акелла', 1993, 2012]],
    city: 'Москва', country: 'russia', founded: 1993, closed: 2012, kind: 'both',
    summary: 'Издатель и разработчик, придумавший «Корсаров» — серию пиратских ролевых игр, дожившую до Disney и «Пиратов Карибского моря». Закрылась после кризиса, оставив десятки локализаций.',
  },
  'kd-lab': {
    names: [['K-D Lab', 'K-D Lab', 1995, null]],
    city: 'Калининград', country: 'russia', founded: 1995, closed: null, kind: 'developer',
    summary: 'Калининградская лаборатория странных игр: «Вангеры» с живыми мирами, «Самогонки», «Периметр» с меняющейся землёй. Ни одна не похожа на другие, и все стали культовыми.',
    website: 'https://kdlab.com',
  },
  'softlab-nsk': {
    names: [['СофтЛаб-НСК', 'SoftLab-NSK', 1988, null]],
    city: 'Новосибирск', country: 'russia', founded: 1988, closed: null, kind: 'developer',
    summary: 'Новосибирская лаборатория при Академгородке, сделавшая «Дальнобойщиков» — единственный отечественный сериал о грузовиках, разошедшийся по всему миру под именем Hard Truck.',
  },
  nival: {
    names: [['Nival Interactive', 'Nival', 1996, 2007], ['Astrum Nival', 'Astrum Nival', 2007, 2010], ['Nival', 'Nival', 2010, null]],
    city: 'Москва', country: 'russia', founded: 1996, closed: null, kind: 'developer',
    summary: 'Самая известная студия российских стратегий: «Аллоды», «Проклятые земли», «Блицкриг», Silent Storm, Heroes of Might and Magic V. Основана Сергеем Орловским.',
    website: 'https://nival.com',
  },
  lesta: {
    names: [['Lesta Studio', 'Lesta', 1991, 2011], ['Lesta Studio (Wargaming)', 'Lesta', 2011, 2022], ['Леста Игры', 'Леста Игры', 2022, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 1991, closed: null, kind: 'developer',
    summary: 'Петербургская студия с тридцатилетней историей: от квеста «Князь» и «Стальных монстров» до World of Warships и «Мира танков», которые она ведёт после ухода Wargaming из России.',
    website: 'https://lesta.ru',
  },
  snowball: {
    names: [['Snowball Interactive', 'Snowball', 1996, 2018]],
    city: 'Москва', country: 'russia', founded: 1996, closed: 2018, kind: 'publisher',
    summary: 'Издатель и локализатор, сделавший перевод игры искусством: «Горький-17», «Князь», Planescape: Torment по-русски вышли через Snowball. Позже — часть «1С».',
  },
  'eagle-dynamics': {
    names: [['Eagle Dynamics', 'Eagle Dynamics', 1991, null]],
    city: 'Москва', country: 'russia', founded: 1991, closed: null, kind: 'developer',
    summary: 'Разработчик самых серьёзных авиасимуляторов: «Су-27 Фланкер», Lock On и DCS World — платформа, к которой до сих пор выходят модули самолётов и вертолётов.',
    website: 'https://www.digitalcombatsimulator.com',
  },
  'copper-feet': {
    names: [['Copper Feet', 'Copper Feet', 1995, null]],
    city: 'Новокузнецк', country: 'russia', founded: 1995, closed: null, kind: 'developer',
    summary: 'Команда с постсоветской сцены ZX Spectrum, сделавшая «Чёрного ворона» — стратегию в духе Warcraft для восьмибитного компьютера, одно из главных достижений спектрумистов девяностых.',
  },
  'action-forms': {
    names: [['Action Forms', 'Action Forms', 1995, null]],
    city: 'Киев', country: 'ukraine', founded: 1995, closed: null, kind: 'developer',
    summary: 'Киевская студия шутеров на собственных движках: Chasm: The Rift, охота на динозавров Carnivores, Vivisector и ледяной хоррор Cryostasis.',
  },
  'gsc-game-world': {
    names: [['GSC Game World', 'GSC Game World', 1995, null]],
    city: 'Киев', country: 'ukraine', founded: 1995, closed: null, kind: 'both',
    summary: 'Самая известная студия постсоветского пространства: «Казаки» и S.T.A.L.K.E.R. Основана Сергеем Григоровичем в Киеве; после долгой паузы вернулась с S.T.A.L.K.E.R. 2.',
    website: 'https://www.gsc-game.com',
  },
  'best-way': {
    names: [['Best Way', 'Best Way', 1991, null]],
    city: 'Северодонецк', country: 'ukraine', founded: 1991, closed: null, kind: 'developer',
    summary: 'Студия из Северодонецка, придумавшая «В тылу врага» — тактику Второй мировой с прямым управлением каждым солдатом и техникой, разросшуюся в серию Men of War.',
  },

  // ── Нулевые ──────────────────────────────────────────────────────────
  'elemental-games': {
    names: [['Elemental Games', 'Elemental Games', 2000, null]],
    city: 'Владивосток', country: 'russia', founded: 2000, closed: null, kind: 'developer',
    summary: 'Владивостокская команда Дмитрия Гусарова, сделавшая «Космических рейнджеров» — игру, в которой сочетаются пошаговая стратегия, аркада, текстовые квесты и живая галактика.',
  },
  katauri: {
    names: [['Katauri Interactive', 'Katauri', 2006, null]],
    city: 'Владивосток', country: 'russia', founded: 2006, closed: null, kind: 'developer',
    summary: 'Часть команды «Космических рейнджеров», отделившаяся ради King’s Bounty: «Легенда о рыцаре» вернула жанр к жизни и получила продолжения.',
  },
  'maddox-games': {
    names: [['1C: Maddox Games', 'Maddox Games', 1999, 2011]],
    city: 'Москва', country: 'russia', founded: 1999, closed: 2011, kind: 'developer',
    summary: 'Студия Олега Медокса, сделавшая «Ил-2 Штурмовик» — авиасимулятор, десять лет остававшийся мировым эталоном жанра и разошедшийся миллионами копий.',
  },
  '1c-game-studios': {
    names: [['1C Game Studios', '1C Game Studios', 2011, null]],
    city: 'Москва', country: 'russia', founded: 2011, closed: null, kind: 'developer',
    summary: 'Внутренняя студия «1С», продолжившая серию «Ил-2 Штурмовик» вместе с американской 777 Studios: «Битва за Сталинград» выросла в платформу «Великие сражения».',
  },
  '1c-entertainment': {
    names: [['1C Entertainment', '1C Entertainment', 2011, 2022], ['Fulqrum Games', 'Fulqrum', 2022, null]],
    city: 'Москва', country: 'russia', founded: 2011, closed: null, kind: 'both',
    summary: 'Игровое подразделение «1С», которое издавало игры за рубежом и само сделало King’s Bounty II. В 2022 году продано Tencent и переименовано в Fulqrum Games.',
  },
  'ice-pick-lodge': {
    names: [['Ice-Pick Lodge', 'Ice-Pick Lodge', 2002, null]],
    city: 'Москва', country: 'russia', founded: 2002, closed: null, kind: 'developer',
    summary: 'Студия Николая Дыбовского, делающая игры как театр: «Мор. Утопия», «Тургор», «Тук-тук-тук». Самая известная арт-студия отечественного игростроя.',
    website: 'https://ice-pick.com',
  },
  'deep-shadows': {
    names: [['Deep Shadows', 'Deep Shadows', 2001, null]],
    city: 'Киев', country: 'ukraine', founded: 2001, closed: null, kind: 'developer',
    summary: 'Киевская студия открытых миров на движке Vital Engine: Xenus с латиноамериканской республикой, Xenus 2 и космическая ролевая игра Precursors.',
  },
  fireglow: {
    names: [['Fireglow Games', 'Fireglow', 1998, null]],
    city: 'Калининград', country: 'russia', founded: 1998, closed: null, kind: 'developer',
    summary: 'Разработчик Sudden Strike («Противостояние») — стратегии Второй мировой, ставшей самой продаваемой российской игрой в Германии и родоначальницей длинной серии.',
  },
  'mist-land': {
    names: [['MiST land-South', 'MiST land', 1998, 2008]],
    city: 'Железнодорожный', country: 'russia', founded: 1998, closed: 2008, kind: 'developer',
    summary: 'Подмосковная студия тактических игр: «Код доступа: РАЙ», «Власть закона», «Альфа: антитеррор». Первая в России попытка делать пошаговую тактику уровня Jagged Alliance.',
  },
  skyriver: {
    names: [['SkyRiver Studios', 'SkyRiver', 2001, null]],
    city: 'Воронеж', country: 'russia', founded: 2001, closed: null, kind: 'developer',
    summary: 'Воронежская студия, придумавшая «Механоидов» — ролевой боевик о разумных машинах-глайдерах на планете, где нет ни одного человека.',
  },
  'x-bow': {
    names: [['X-bow Software', 'X-bow', 2001, null]],
    city: 'Москва', country: 'russia', founded: 2001, closed: null, kind: 'developer',
    summary: 'Московская студия космических ролевых стратегий: Star Wolves («Звёздные волки») и её продолжения.',
  },
  gaijin: {
    names: [['Gaijin Entertainment', 'Gaijin', 2002, null]],
    city: 'Москва', country: 'russia', founded: 2002, closed: null, kind: 'both',
    summary: 'От «Бумера» и «Адреналина» до War Thunder — одной из крупнейших онлайн-игр мира. Собственный движок Dagor, штаб-квартира переехала в Будапешт.',
    website: 'https://gaijin.net',
  },
  targem: {
    names: [['Targem Games', 'Targem', 2002, null]],
    city: 'Екатеринбург', country: 'russia', founded: 2002, closed: null, kind: 'developer',
    summary: 'Екатеринбургская студия, десять лет делавшая гонки и постапокалипсис на колёсах: Ex Machina выросла в онлайн-боевик Crossout, а Star Conflict — в космический.',
    website: 'https://targem.ru',
  },
  'sigma-team': {
    names: [['Sigma Team', 'Sigma Team', 2000, null]],
    city: 'Воронеж', country: 'russia', founded: 2000, closed: null, kind: 'both',
    summary: 'Небольшая студия, сделавшая Alien Shooter — шутер с видом сверху и тысячами монстров на экране, который продавался в каждом киоске и на каждом телефоне.',
  },
  burut: {
    names: [['Burut CT', 'Burut', 1999, 2010]],
    city: 'Воронеж', country: 'russia', founded: 1999, closed: 2010, kind: 'developer',
    summary: 'Воронежская студия, запустившая в 2003 году «Сферу» — первую российскую массовую онлайн-ролевую игру, — и шутеры «Восточный фронт» с супер-солдатами.',
  },
  'it-territory': {
    names: [['IT Territory', 'IT Territory', 2003, 2011]],
    city: 'Москва', country: 'russia', founded: 2003, closed: 2011, kind: 'developer',
    summary: 'Студия браузерных игр, сделавшая «Легенду: Наследие драконов» — самую популярную браузерную онлайн-игру Рунета середины нулевых. Позже стала частью Mail.Ru.',
  },
  'mail-ru-games': {
    names: [['Astrum Online', 'Astrum Online', 2007, 2010], ['Mail.Ru Games', 'Mail.Ru Games', 2010, 2019], ['MY.GAMES', 'MY.GAMES', 2019, null]],
    city: 'Москва', country: 'russia', founded: 2007, closed: null, kind: 'both',
    summary: 'Игровое подразделение Mail.Ru, собравшее «Аллоды Онлайн», Warface, Skyforge и десятки проектов в единый холдинг. Крупнейший издатель онлайн-игр Рунета.',
    website: 'https://my.games',
  },
  'allods-team': {
    names: [['Allods Team', 'Allods Team', 2010, null]],
    city: 'Москва', country: 'russia', founded: 2010, closed: null, kind: 'developer',
    summary: 'Команда, выросшая из Astrum Nival внутри Mail.Ru: ведёт «Аллоды Онлайн» и сделала Skyforge — научно-фантастическую онлайн-ролевую игру с богами.',
  },
  wargaming: {
    names: [['Wargaming.net', 'Wargaming', 1998, null]],
    city: 'Минск', country: 'belarus', founded: 1998, closed: null, kind: 'both',
    summary: 'Минская студия, десять лет делавшая нишевые стратегии, а в 2010 году выпустившая World of Tanks и ставшая одной из крупнейших игровых компаний мира. Штаб-квартира на Кипре.',
    website: 'https://wargaming.com',
  },
  frogwares: {
    names: [['Frogwares', 'Frogwares', 2000, null]],
    city: 'Киев', country: 'ukraine', founded: 2000, closed: null, kind: 'both',
    summary: 'Киевская студия, двадцать лет делающая игры о Шерлоке Холмсе, а между ними — лавкрафтовский The Sinking City.',
    website: 'https://frogwares.com',
  },
  '4a-games': {
    names: [['4A Games', '4A Games', 2006, null]],
    city: 'Киев', country: 'ukraine', founded: 2006, closed: null, kind: 'developer',
    summary: 'Студия выходцев из GSC, сделавшая трилогию Metro по романам Дмитрия Глуховского на собственном движке 4A Engine. Часть команды переехала на Мальту.',
    website: 'https://www.4a-games.com.mt',
  },
  'crytek-kiev': {
    names: [['Crytek Kiev', 'Crytek Kiev', 2006, 2020], ['Blackwood Games', 'Blackwood', 2020, null]],
    city: 'Киев', country: 'ukraine', founded: 2006, closed: null, kind: 'developer',
    summary: 'Киевское отделение Crytek, сделавшее Warface — бесплатный онлайн-шутер на CryEngine, ставший одной из главных сетевых игр Рунета.',
  },
  'vostok-games': {
    names: [['Vostok Games', 'Vostok Games', 2012, null]],
    city: 'Киев', country: 'ukraine', founded: 2012, closed: null, kind: 'developer',
    summary: 'Команда бывших разработчиков S.T.A.L.K.E.R. 2, собравшаяся после его отмены ради онлайн-шутера Survarium.',
  },
  melesta: {
    names: [['Melesta Games', 'Melesta', 2005, null]],
    city: 'Минск', country: 'belarus', founded: 2005, closed: null, kind: 'developer',
    summary: 'Минская студия казуальных игр, придумавшая «Весёлую ферму» — самый известный тайм-менеджер русскоязычного рынка, разошедшийся по миру как Farm Frenzy.',
  },
  alawar: {
    names: [['Alawar Entertainment', 'Alawar', 1999, null]],
    city: 'Новосибирск', country: 'russia', founded: 1999, closed: null, kind: 'both',
    summary: 'Новосибирский издатель казуальных игр, через которого прошли «Весёлая ферма», Beholder и сотни игр «на часок». В нулевые — главное имя жанра в России.',
    website: 'https://www.alawar.ru',
  },
  awem: {
    names: [['Awem Games', 'Awem', 2002, null]],
    city: 'Минск', country: 'belarus', founded: 2002, closed: null, kind: 'developer',
    summary: 'Минская студия казуальных игр: Cradle of Rome и его продолжения стали одними из самых продаваемых «три в ряд» середины нулевых.',
  },
  'seaward': {
    names: [['Seaward.ru', 'Seaward', 2003, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2003, closed: null, kind: 'developer',
    summary: 'Команда, выросшая из сообщества модов к «Корсарам» и сделавшая «Корсары: Возвращение легенды» и «Город потерянных кораблей» — лучшие, по мнению фанатов, части серии.',
  },
  'geleos': {
    names: [['Geleos Media', 'Geleos', 2004, 2009]],
    city: 'Москва', country: 'russia', founded: 2004, closed: 2009, kind: 'developer',
    summary: 'Студия, оставшаяся в истории одной игрой: Lada Racing Club 2006 года стал символом провала при огромной рекламной кампании и мемом на годы.',
  },
  'mandel-artplains': {
    names: [['Mandel ArtPlains', 'Mandel ArtPlains', 2003, 2007]],
    city: 'Киев', country: 'ukraine', founded: 2003, closed: 2007, kind: 'developer',
    summary: 'Киевская студия, сделавшая You Are Empty — шутер об альтернативном СССР 1950-х с мутантами, запомнившийся стилем сильнее, чем игрой.',
  },
  'alternativa': {
    names: [['AlternativaPlatform', 'Alternativa', 2006, null]],
    city: 'Пермь', country: 'russia', founded: 2006, closed: null, kind: 'developer',
    summary: 'Пермская компания, сделавшая «Танки Онлайн» — трёхмерный танковый боевик прямо в браузере на собственном движке Alternativa3D.',
    website: 'https://tankionline.com',
  },

  'ino-co': {
    names: [['1C: Ino-Co', 'Ino-Co', 2004, 2009], ['Ino-Co Plus', 'Ino-Co Plus', 2009, null]],
    city: 'Воронеж', country: 'russia', founded: 2004, closed: null, kind: 'developer',
    summary: 'Воронежская студия внутри «1С», сделавшая «Санитаров подземелий» по роману Гоблина, а затем Majesty 2 и «Кодекс войны».',
  },
  'novy-disk': {
    names: [['Новый Диск', 'Новый Диск', 1997, null]],
    city: 'Москва', country: 'russia', founded: 1997, closed: null, kind: 'publisher',
    summary: 'Крупный издатель и дистрибутор нулевых: через «Новый Диск» вышли «Тургор», Lada Racing Club и сотни локализаций западных игр.',
  },
  'russobit-m': {
    names: [['Руссобит-М', 'Руссобит-М', 1997, null]],
    city: 'Москва', country: 'russia', founded: 1997, closed: null, kind: 'publisher',
    summary: 'Издатель, выпустивший в России «Казаков», «Противостояние» и Xenus. В нулевые — один из пяти крупнейших игроков рынка jewel-боксов.',
  },
  skyfallen: {
    names: [['SkyFallen Entertainment', 'SkyFallen', 2004, 2010]],
    city: 'Москва', country: 'russia', founded: 2004, closed: 2010, kind: 'developer',
    summary: 'Московская студия, сделавшая ролевой боевик «Магия крови» и боевые гонки Death Track: Возрождение, а затем растворившаяся в кризисе.',
  },
  blackmark: {
    names: [['BlackMark Studio', 'BlackMark', 2009, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2009, closed: null, kind: 'developer',
    summary: 'Команда, выросшая из фанатского сообщества «Корсаров» и сделавшая «Корсары: Каждому своё!» — последнюю большую часть серии на движке Storm.',
  },

  // ── Десятые ──────────────────────────────────────────────────────────
  zeptolab: {
    names: [['ZeptoLab', 'ZeptoLab', 2009, null]],
    city: 'Москва', country: 'russia', founded: 2009, closed: null, kind: 'both',
    summary: 'Студия братьев Ефима и Семёна Войновых, сделавшая Cut the Rope — одну из первых мировых сенсаций App Store с миллиардом загрузок. Штаб-квартира переехала в Барселону.',
    website: 'https://www.zeptolab.com',
  },
  nekki: {
    names: [['Nekki', 'Nekki', 2002, null]],
    city: 'Москва', country: 'russia', founded: 2002, closed: null, kind: 'both',
    summary: 'Студия файтингов с тенями: Shadow Fight 2 и 3 скачали сотни миллионов раз, а паркур-игра Vector стала хитом первых лет смартфонов.',
    website: 'https://nekki.com',
  },
  playrix: {
    names: [['Playrix', 'Playrix', 2004, null]],
    city: 'Вологда', country: 'russia', founded: 2004, closed: null, kind: 'both',
    summary: 'Компания братьев Бухманов из Вологды, ставшая одним из крупнейших мобильных издателей мира: Gardenscapes, Homescapes, Fishdom, Township. Штаб-квартира в Дублине.',
    website: 'https://www.playrix.com',
  },
  pixonic: {
    names: [['Pixonic', 'Pixonic', 2009, null]],
    city: 'Москва', country: 'russia', founded: 2009, closed: null, kind: 'developer',
    summary: 'Московская студия, сделавшая War Robots — мобильный боевик о шагающих роботах с сотнями миллионов загрузок. Часть MY.GAMES.',
  },
  axlebolt: {
    names: [['Axlebolt', 'Axlebolt', 2016, null]],
    city: 'Краснодар', country: 'russia', founded: 2016, closed: null, kind: 'developer',
    summary: 'Студия, сделавшая Standoff 2 — мобильный тактический шутер в духе Counter-Strike, одну из самых популярных игр среди подростков России и СНГ.',
  },
  'warm-lamp': {
    names: [['Warm Lamp Games', 'Warm Lamp', 2015, null]],
    city: 'Барнаул', country: 'russia', founded: 2015, closed: null, kind: 'developer',
    summary: 'Барнаульская студия, придумавшая Beholder — игру о управдоме-доносчике в тоталитарном государстве, разошедшуюся миллионами копий.',
  },
  'lazy-bear': {
    names: [['Lazy Bear Games', 'Lazy Bear', 2013, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2013, closed: null, kind: 'developer',
    summary: 'Петербургская команда, сделавшая пиксельный симулятор боксёра Punch Club и «средневековую Stardew Valley» Graveyard Keeper.',
  },
  'four-quarters': {
    names: [['Four Quarters', 'Four Quarters', 2014, null]],
    city: 'Москва', country: 'russia', founded: 2014, closed: null, kind: 'developer',
    summary: 'Четыре человека, сделавшие Loop Hero — роглайк с бесконечной петлёй дороги, ставший одним из главных инди-хитов 2021 года.',
  },
  morteshka: {
    names: [['Morteshka', 'Morteshka', 2017, null]],
    city: 'Пермь', country: 'russia', founded: 2017, closed: null, kind: 'developer',
    summary: 'Пермская студия, делающая игры на фольклоре Урала и Прикамья: The Mooseman по мифам коми-пермяков и «Чёрная книга» по быличкам Чердынского района.',
    website: 'https://morteshka.com',
  },
  niceplay: {
    names: [['niceplay games', 'niceplay games', 2016, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2016, closed: null, kind: 'developer',
    summary: 'Небольшая команда, сделавшая Potion Craft — симулятор алхимика в стилистике средневековых манускриптов, попавший в топы Steam ещё в раннем доступе.',
  },
  'odd-meter': {
    names: [['Odd Meter', 'Odd Meter', 2016, null]],
    city: 'Алма-Ата', country: 'kazakhstan', founded: 2016, closed: null, kind: 'developer',
    summary: 'Студия Дмитрия Светлова, переехавшая из Москвы в Алма-Ату и выпустившая INDIKA — игру о монахине и её внутреннем бесе в альтернативной России XIX века.',
  },
  'atom-team': {
    names: [['AtomTeam', 'AtomTeam', 2015, null]],
    city: 'Москва', country: 'russia', founded: 2015, closed: null, kind: 'developer',
    summary: 'Команда, собравшая на Kickstarter деньги на ATOM RPG — «советский Fallout» о СССР после ядерной войны 1986 года, — и выпустившая продолжение Trudograd.',
  },
  'dark-crystal': {
    names: [['Dark Crystal Games', 'Dark Crystal', 2017, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2017, closed: null, kind: 'developer',
    summary: 'Петербургская студия выходцев из Larian, сделавшая Encased — изометрическую ролевую игру о Куполе, аномальной зоне в духе Стругацких.',
  },
  'ink-stains': {
    names: [['Ink Stains Games', 'Ink Stains', 2016, null]],
    city: 'Москва', country: 'russia', founded: 2016, closed: null, kind: 'developer',
    summary: 'Студия, делающая Stoneshard — хардкорный пошаговый роглайк в открытом мире, который живёт в раннем доступе с 2020 года.',
  },
  'dynamic-pixels': {
    names: [['Dynamic Pixels', 'Dynamic Pixels', 2005, null]],
    city: 'Москва', country: 'russia', founded: 2005, closed: null, kind: 'developer',
    summary: 'Московская студия, начинавшая с мобильных игр на Java и сделавшая Hello Neighbor — стелс-хоррор о соседе с подвалом, разошедшийся на YouTube миллиардами просмотров.',
  },
  tinybuild: {
    names: [['tinyBuild', 'tinyBuild', 2011, null]],
    city: 'Белвью', country: 'other', founded: 2011, closed: null, kind: 'publisher',
    summary: 'Американский издатель, основанный Алексом Ничипорчиком, через который вышли многие игры постсоветских инди-команд: Hello Neighbor, Party Hard, Punch Club, Graveyard Keeper.',
    website: 'https://www.tinybuild.com',
  },
  pinokl: {
    names: [['Pinokl Games', 'Pinokl', 2012, null]],
    city: 'Киев', country: 'ukraine', founded: 2012, closed: null, kind: 'developer',
    summary: 'Киевская студия, сделавшая Party Hard — стелс-игру о маньяке на вечеринке, которая стала хитом стримов.',
  },
  battlestate: {
    names: [['Battlestate Games', 'Battlestate', 2012, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2012, closed: null, kind: 'developer',
    summary: 'Петербургская студия Никиты Буянова, сделавшая Escape from Tarkov — хардкорный шутер с эвакуацией, который придумал целый жанр.',
    website: 'https://www.escapefromtarkov.com',
  },
  owlcat: {
    names: [['Owlcat Games', 'Owlcat', 2016, null]],
    city: 'Москва', country: 'russia', founded: 2016, closed: null, kind: 'developer',
    summary: 'Студия выходцев из Nival и Mail.Ru, сделавшая большие изометрические ролевые игры: Pathfinder: Kingmaker, Wrath of the Righteous и Warhammer 40,000: Rogue Trader. Штаб-квартира на Кипре.',
    website: 'https://owlcat.games',
  },
  noskov: {
    names: [['Сергей Носков', 'Сергей Носков', 2013, null]],
    city: 'Смоленск', country: 'russia', founded: 2013, closed: null, kind: 'developer',
    summary: 'Разработчик-одиночка, сделавший 35MM — медленную прогулку по постапокалиптической русской провинции, — а затем «Сюжет» и «Семь».',
  },
  'flying-cafe': {
    names: [['Flying Cafe for Semianimals', 'Flying Cafe', 2011, null]],
    city: 'Киев', country: 'ukraine', founded: 2011, closed: null, kind: 'developer',
    summary: 'Киевская команда, сделавшая Cradle — фантастическое приключение в монгольской степи будущего на движке Unigine.',
  },
  'za-um': {
    names: [['ZA/UM', 'ZA/UM', 2016, null]],
    city: 'Таллин', country: 'estonia', founded: 2016, closed: null, kind: 'developer',
    summary: 'Эстонская студия, выросшая из художественного объединения, сделавшая Disco Elysium — ролевую игру без боёв, признанную одной из лучших в истории жанра.',
  },
  triada: {
    names: [['Triada Studio', 'Triada', 1995, null]],
    city: 'Ереван', country: 'armenia', founded: 1995, closed: null, kind: 'developer',
    summary: 'Ереванская студия компьютерной графики, сделавшая головоломку Shadowmatic о тенях предметов — обладателя Apple Design Award 2015 года.',
  },

  // ── Двадцатые ────────────────────────────────────────────────────────
  mundfish: {
    names: [['Mundfish', 'Mundfish', 2017, null]],
    city: 'Москва', country: 'russia', founded: 2017, closed: null, kind: 'developer',
    summary: 'Студия Роберта Багратуни, сделавшая Atomic Heart — шутер об альтернативном СССР 1955 года с роботами, самый крупный отечественный релиз со времён S.T.A.L.K.E.R. Штаб-квартира на Кипре.',
    website: 'https://mundfish.com',
  },
  'cyberia-nova': {
    names: [['Cyberia Nova', 'Cyberia Nova', 2015, null]],
    city: 'Москва', country: 'russia', founded: 2015, closed: null, kind: 'developer',
    summary: 'Студия, сделавшая «Смуту» — историческую игру о Смутном времени, первый большой проект на грант Института развития интернета и один из самых обсуждаемых релизов 2024 года.',
  },
  timelock: {
    names: [['Timelock Studio', 'Timelock', 2018, null]],
    city: 'Москва', country: 'russia', founded: 2018, closed: null, kind: 'developer',
    summary: 'Команда мододелов, которой Croteam доверила официальное дополнение Serious Sam: Siberian Mayhem — единственный случай, когда отечественная студия делала игру знаменитой западной серии.',
  },
  'konfa-games': {
    names: [['Konfa Games', 'Konfa Games', 2019, null]],
    city: 'Москва', country: 'russia', founded: 2019, closed: null, kind: 'developer',
    summary: 'Небольшая студия, сделавшая Despot’s Game — роглайк-автобатлер о человечках в подземелье, изданный tinyBuild.',
  },
  perelesoq: {
    names: [['perelesoq', 'perelesoq', 2018, null]],
    city: 'Москва', country: 'russia', founded: 2018, closed: null, kind: 'developer',
    summary: 'Студия, сделавшая «Вдали» (Torn Away) — приключение о девочке, бегущей из трудового лагеря через Вторую мировую, без единого выстрела со стороны игрока.',
  },
  'do-my-best': {
    names: [['DO MY BEST Games', 'DO MY BEST', 2015, null]],
    city: 'Санкт-Петербург', country: 'russia', founded: 2015, closed: null, kind: 'developer',
    summary: 'Петербургская студия, сделавшая The Final Station и The Bookwalker — приключение о писателе, который ходит внутрь книг.',
  },
  'goodwin-games': {
    names: [['Goodwin Games', 'Goodwin Games', 2018, null]],
    city: 'Москва', country: 'russia', founded: 2018, closed: null, kind: 'developer',
    summary: 'Студия, сделавшая Selfloss — приключение о старике с посохом в мире, вдохновлённом славянской и исландской мифологией.',
  },
  'darkflow': {
    names: [['Darkflow Software', 'Darkflow', 2015, null]],
    city: 'Рига', country: 'latvia', founded: 2015, closed: null, kind: 'developer',
    summary: 'Рижская студия, сделавшая вместе с Gaijin онлайн-шутер Enlisted о Второй мировой с отрядами под управлением игрока.',
  },
};
