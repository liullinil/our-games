/**
 * Реестр платформ: заготовки для src/content/platforms.
 */
export const PLATFORMS = {
  'elektronika-60': {
    name: 'Электроника-60', altNames: ['Электроника 60'], kind: 'computer', maker: 'Воронежский завод «Процессор»', country: 'ussr',
    years: [1978, 1991],
    summary: 'Советская мини-ЭВМ, клон DEC LSI-11: на такой машине в Вычислительном центре Академии наук в 1984 году Алексей Пажитнов написал первый «Тетрис» — без графики, квадратными скобками на текстовом терминале.',
    commons: 'Elektronika 60',
  },
  'bk-0010': {
    name: 'БК-0010', altNames: ['БК-0010-01', 'БК-0011М', 'Электроника БК'], kind: 'computer', maker: 'НПО «Электроника»', country: 'ussr',
    years: [1985, 1993],
    summary: 'Первый массовый советский домашний компьютер, продававшийся в магазинах: 16-разрядный процессор, 32 килобайта памяти, кассетный магнитофон вместо диска. Для него написаны тысячи любительских игр.',
    commons: 'Elektronika BK-0010',
  },
  'zx-spectrum': {
    name: 'ZX Spectrum и клоны', altNames: ['ZX Spectrum', 'Пентагон', 'Скорпион', 'Ленинград'], kind: 'computer', maker: 'Sinclair Research и десятки советских заводов', country: 'ussr',
    years: [1986, 2000],
    summary: 'Британский домашний компьютер 1982 года, который в конце восьмидесятых начали копировать по всему СССР: «Ленинград», «Пентагон», «Скорпион», «Байт». В девяностые на «спектрумах» выросла целая отечественная игровая сцена.',
    commons: 'ZX Spectrum clones',
  },
  agat: {
    name: 'Агат', altNames: ['Агат-7', 'Агат-9'], kind: 'computer', maker: 'НИИВК, Лианозовский электромеханический завод', country: 'ussr',
    years: [1983, 1993],
    summary: 'Первый советский персональный компьютер для школ, частично совместимый с Apple II. На «Агатах» целое поколение впервые увидело компьютерные игры на уроках информатики.',
    commons: 'Agat (computer)',
  },
  'vector-06c': {
    name: 'Вектор-06Ц', altNames: ['Вектор'], kind: 'computer', maker: 'Кишинёвский завод «Счётмаш»', country: 'ussr',
    years: [1987, 1993],
    summary: 'Кишинёвский домашний компьютер с лучшей графикой среди советских машин конца восьмидесятых: 256 цветов на экране и звук на три канала. Для него портировали игры с ZX Spectrum и писали свои.',
    commons: 'Vector-06C',
  },
  'radio-86rk': {
    name: 'Радио-86РК', altNames: ['Радио 86РК', 'РК-86'], kind: 'computer', maker: 'Журнал «Радио», радиолюбители', country: 'ussr',
    years: [1986, 1992],
    summary: 'Компьютер для самостоятельной сборки, опубликованный журналом «Радио» в 1986 году. Его спаяли десятки тысяч радиолюбителей; текстовая графика не мешала писать для него игры.',
    commons: 'Radio-86RK',
  },
  'elektronika-im': {
    name: 'Электроника ИМ', altNames: ['Ну, погоди!', 'Электроника ИМ-02'], kind: 'handheld', maker: 'НПО «Электроника»', country: 'ussr',
    years: [1984, 1995],
    summary: 'Серия карманных электронных игр на жидкокристаллическом экране, советский аналог Nintendo Game & Watch. Самая известная — ИМ-02 «Ну, погоди!», где волк ловит яйца.',
    commons: 'Elektronika IM-02',
  },
  'soviet-arcade': {
    name: 'Советские игровые автоматы', altNames: ['Игровые автоматы СССР'], kind: 'arcade', maker: 'Заводы Минрадиопрома и Миноборонпрома', country: 'ussr',
    years: [1974, 1991],
    summary: 'Электромеханические и электронные автоматы, стоявшие в парках, кинотеатрах и на вокзалах: «Морской бой», «Магистраль», «Снайпер», «Городки». Делали их оборонные заводы по образцам японских и американских автоматов.',
    commons: 'Soviet arcade machines',
  },
  dendy: {
    name: 'Dendy', altNames: ['Денди', 'Dendy Junior'], kind: 'console', maker: 'Steepler', country: 'russia',
    years: [1992, 1998],
    summary: 'Тайваньский клон восьмибитной Nintendo Famicom, который московская компания Steepler в 1992 году начала продавать под собственной маркой. Слонёнок Денди стал символом детства девяностых.',
    commons: 'Dendy (console)',
  },
  dos: {
    name: 'ПК (MS-DOS)', altNames: ['DOS', 'IBM PC'], kind: 'pc', maker: 'IBM и совместимые', country: 'other',
    years: [1981, 1999],
    summary: 'IBM PC и совместимые машины под MS-DOS — платформа, на которой сделаны первые коммерческие российские игры: Color Lines, «Братья Пилоты», «ГЭГ», «Вангеры», ранние «Петька и Василий Иванович».',
    commons: 'IBM PC compatibles',
  },
  windows: {
    name: 'ПК (Windows)', altNames: ['Windows', 'PC'], kind: 'pc', maker: 'Microsoft', country: 'other',
    years: [1995, null],
    summary: 'Главная платформа отечественных игр с конца девяностых: почти всё, что вышло в jewel-боксах нулевых и в Steam десятых, сделано для Windows.',
    commons: 'Microsoft Windows',
  },
  macos: {
    name: 'macOS', altNames: ['Mac'], kind: 'pc', maker: 'Apple', country: 'other',
    years: [2001, null],
    summary: 'Компьютеры Apple редко были главной целью отечественных студий, но многие независимые игры десятых и двадцатых вышли и на Mac — чаще всего через Steam.',
    commons: 'MacBook Pro',
  },
  linux: {
    name: 'Linux', altNames: ['Linux'], kind: 'pc', maker: 'Сообщество', country: 'other',
    years: [1991, null],
    summary: 'Свободная операционная система, на которую портируют часть независимых игр; с появлением Steam Deck версии для Linux стали обычным делом.',
    commons: 'Steam Deck',
  },
  psp: {
    name: 'PlayStation Portable', altNames: ['PSP'], kind: 'handheld', maker: 'Sony', country: 'other',
    years: [2004, 2014],
    summary: 'Портативная приставка Sony с широким экраном и дисками UMD. Одна из немногих консолей, на которую вышла игра отечественной студии — «Ил-2 Штурмовик: Крылатые хищники» от Gaijin.',
    commons: 'PlayStation Portable',
  },
  'xbox-360': {
    name: 'Xbox 360', altNames: ['Xbox 360'], kind: 'console', maker: 'Microsoft', country: 'other',
    years: [2005, 2016],
    summary: 'Приставка седьмого поколения, на которой отечественные студии впервые вышли на мировой консольный рынок: Metro 2033, «Крылатые хищники», X-Blades, Blades of Time.',
    commons: 'Xbox 360',
  },
  'playstation-3': {
    name: 'PlayStation 3', altNames: ['PS3'], kind: 'console', maker: 'Sony', country: 'other',
    years: [2006, 2017],
    summary: 'Приставка Sony седьмого поколения; на неё выходили Metro: Last Light, «Ил-2 Штурмовик: Крылатые хищники», Blades of Time и другие игры постсоветских студий.',
    commons: 'PlayStation 3',
  },
  'playstation-4': {
    name: 'PlayStation 4', altNames: ['PS4'], kind: 'console', maker: 'Sony', country: 'other',
    years: [2013, null],
    summary: 'Самая продаваемая приставка десятых: на ней вышли Metro Exodus, Pathfinder, Beholder, Disco Elysium, Мор и десятки независимых игр из бывшего СССР.',
    commons: 'PlayStation 4',
  },
  'xbox-one': {
    name: 'Xbox One', altNames: ['Xbox One'], kind: 'console', maker: 'Microsoft', country: 'other',
    years: [2013, 2020],
    summary: 'Приставка Microsoft восьмого поколения; отечественные игры выходили на ней параллельно с PlayStation 4.',
    commons: 'Xbox One',
  },
  'nintendo-switch': {
    name: 'Nintendo Switch', altNames: ['Switch'], kind: 'console', maker: 'Nintendo', country: 'other',
    years: [2017, null],
    summary: 'Гибридная приставка Nintendo, на которую охотно портируют независимые игры: Loop Hero, Black Book, Beholder, Punch Club, Graveyard Keeper, Мор.',
    commons: 'Nintendo Switch',
  },
  'playstation-5': {
    name: 'PlayStation 5', altNames: ['PS5'], kind: 'console', maker: 'Sony', country: 'other',
    years: [2020, null],
    summary: 'Приставка девятого поколения. Atomic Heart в 2023 году стал первой игрой российской студии, попавшей в её мировые чарты.',
    commons: 'PlayStation 5',
  },
  'xbox-series': {
    name: 'Xbox Series X/S', altNames: ['Xbox Series'], kind: 'console', maker: 'Microsoft', country: 'other',
    years: [2020, null],
    summary: 'Приставки Microsoft девятого поколения; Atomic Heart вышел на них в день релиза и попал в Game Pass, S.T.A.L.K.E.R. 2 — эксклюзив среди консолей.',
    commons: 'Xbox Series X',
  },
  ios: {
    name: 'iOS', altNames: ['iPhone', 'iPad'], kind: 'mobile', maker: 'Apple', country: 'other',
    years: [2008, null],
    summary: 'App Store открыл отечественным студиям мировой рынок без издателей: Cut the Rope, Shadow Fight, Gardenscapes и Shadowmatic сделали здесь состояние и имя.',
    commons: 'IPhone 4',
  },
  android: {
    name: 'Android', altNames: ['Android'], kind: 'mobile', maker: 'Google', country: 'other',
    years: [2008, null],
    summary: 'Самая массовая платформа в мире; для русскоязычного рынка — главная: Standoff 2, War Robots, Shadow Fight 2 и «Танки Онлайн» собирают здесь основную аудиторию.',
    commons: 'Android smartphones',
  },
  web: {
    name: 'Браузер', altNames: ['Браузер', 'Flash'], kind: 'web', maker: 'Adobe Flash, HTML5', country: 'other',
    years: [2002, null],
    summary: 'Игры прямо в окне браузера: от текстовых боёв «Бойцовского клуба» и «Легенды: Наследие драконов» до трёхмерных «Танков Онлайн» на Flash. С уходом Flash в 2020 году сцена переехала на HTML5.',
    commons: 'Adobe Flash',
  },
};
