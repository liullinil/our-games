/**
 * Реестр движков: заготовки для src/content/engines.
 */
export const ENGINES = {
  'x-ray': {
    name: 'X-Ray Engine', altNames: ['X-Ray'], developer: 'gsc-game-world', origin: 'inhouse', tech: 'C++, DirectX 8–11',
    years: [2001, 2012],
    summary: 'Собственный движок GSC Game World, на котором сделана трилогия S.T.A.L.K.E.R.: отложенное освещение, симуляция жизни Зоны и открытые локации. Исходники утекли в сеть и породили десятки модов.',
  },
  '4a-engine': {
    name: '4A Engine', altNames: [], developer: '4a-games', origin: 'inhouse', tech: 'C++, DirectX 11–12, трассировка лучей',
    years: [2008, null],
    summary: 'Движок 4A Games, написанный с нуля для Metro 2033. Metro Exodus стал одной из первых игр с полноценной трассировкой лучей в реальном времени.',
  },
  gem: {
    name: 'GEM Engine', altNames: ['GEM 2'], developer: 'best-way', origin: 'inhouse', tech: 'C++, DirectX 9',
    years: [2004, null],
    summary: 'Движок Best Way с полностью разрушаемым окружением и физикой каждого снаряда, на котором сделаны «В тылу врага», Men of War и вся их долгая серия.',
  },
  dagor: {
    name: 'Dagor Engine', altNames: ['Dagor'], developer: 'gaijin', origin: 'inhouse', tech: 'C++, DirectX, Vulkan; открыт в 2023 году',
    years: [2002, null],
    summary: 'Движок Gaijin, живущий двадцать лет: от «Бумера» и «Крылатых хищников» до War Thunder, Enlisted и Crossout. В 2023 году исходники выложены под свободной лицензией.',
    website: 'https://github.com/GaijinEntertainment/DagorEngine',
  },
  theengine: {
    name: 'TheEngine', altNames: [], developer: 'elemental-games', origin: 'inhouse', tech: 'C++, DirectX 9',
    years: [2004, 2010],
    summary: 'Движок Elemental Games и Katauri, связавший «Космических рейнджеров 2», King’s Bounty и «Санитаров подземелий»: лицензировался и другим студиям «1С».',
  },
  'silent-storm-engine': {
    name: 'Silent Storm Engine', altNames: [], developer: 'nival', origin: 'inhouse', tech: 'C++, DirectX 9',
    years: [2003, 2007],
    summary: 'Движок Nival с разрушаемыми зданиями и физикой падения тел, сделанный для Silent Storm и переработанный для «Ночного дозора» и Heroes of Might and Magic V.',
  },
  enigma: {
    name: 'Enigma Engine', altNames: [], developer: 'nival', origin: 'inhouse', tech: 'C++, изометрия',
    years: [2003, 2005],
    summary: 'Изометрический движок «Блицкрига», который Nival лицензировала десятку студий: на нём вышли «Сталинград», «Курск 1943», «Великие битвы» и другие стратегии нулевых.',
  },
  'vital-engine': {
    name: 'Vital Engine', altNames: [], developer: 'deep-shadows', origin: 'inhouse', tech: 'C++, DirectX 9',
    years: [2005, 2009],
    summary: 'Движок Deep Shadows для бесшовных открытых миров: 25 квадратных километров Xenus без загрузок, потом Xenus 2 и Precursors.',
  },
  atmosfear: {
    name: 'AtmosFear', altNames: [], developer: 'action-forms', origin: 'inhouse', tech: 'C++, DirectX 9–10',
    years: [2005, 2008],
    summary: 'Движок Action Forms, сделанный для Vivisector и доведённый в Cryostasis до одной из первых игр с физикой PhysX для воды и льда.',
  },
  'storm-engine': {
    name: 'Storm Engine', altNames: [], developer: 'akella', origin: 'inhouse', tech: 'C++, DirectX 8–9',
    years: [2000, 2012],
    summary: 'Движок «Акеллы» для «Корсаров»: море, паруса и абордажи. На нём вышли все части серии, включая фанатские «Возвращение легенды» и «Город потерянных кораблей».',
  },
  'digital-nature': {
    name: 'Digital Nature', altNames: [], developer: '1c-game-studios', origin: 'inhouse', tech: 'C++, DirectX 11',
    years: [2013, null],
    summary: 'Движок «Ил-2 Штурмовик: Битва за Сталинград» и всей серии «Великие сражения», сделанный 1C Game Studios вместе с 777 Studios на основе технологии Rise of Flight.',
  },
  edge: {
    name: 'EDGE', altNames: ['Eagle Dynamics Graphics Engine'], developer: 'eagle-dynamics', origin: 'inhouse', tech: 'C++, DirectX 11, Vulkan',
    years: [2015, null],
    summary: 'Графический движок Eagle Dynamics, сменивший в DCS World технологию времён Lock On: карты в сотни километров с фотореалистичным рельефом.',
  },
  bigworld: {
    name: 'BigWorld', altNames: ['BigWorld Technology'], developer: 'wargaming', maker: 'BigWorld (Австралия), с 2012 года — Wargaming', origin: 'licensed', tech: 'C++, Python',
    years: [2010, 2018],
    summary: 'Австралийский движок для массовых онлайн-игр, на котором вышли World of Tanks, World of Warplanes и World of Warships. Wargaming купила компанию целиком в 2012 году.',
  },
  core: {
    name: 'Core Engine', altNames: ['enCore'], developer: 'wargaming', origin: 'inhouse', tech: 'C++, DirectX 11–12',
    years: [2018, null],
    summary: 'Собственный графический движок Wargaming, заменивший BigWorld в World of Tanks 1.0 и унаследованный «Миром танков».',
  },
  alternativa3d: {
    name: 'Alternativa3D', altNames: [], developer: 'alternativa', origin: 'inhouse', tech: 'ActionScript 3, Flash; позже Unity',
    years: [2008, 2020],
    summary: 'Трёхмерный движок для Adobe Flash пермской AlternativaPlatform, на котором «Танки Онлайн» жили в браузере до конца эпохи Flash.',
  },
  unigine: {
    name: 'Unigine', altNames: ['UNIGINE Engine'], maker: 'UNIGINE (Томск)', origin: 'licensed', tech: 'C++, DirectX, Vulkan, OpenGL',
    years: [2005, null],
    summary: 'Томский движок, известный по бенчмаркам Heaven и Superposition. Игр на нём немного: Oil Rush самой UNIGINE и приключение Cradle киевской Flying Cafe.',
    website: 'https://unigine.com',
  },
  unity: {
    name: 'Unity', altNames: [], maker: 'Unity Technologies (США)', origin: 'licensed', tech: 'C#',
    years: [2005, null],
    summary: 'Самый распространённый движок независимых игр десятых: на нём сделаны Escape from Tarkov, Pathfinder, Beholder, «Мор», Loop Hero, Disco Elysium, Potion Craft и большинство мобильных хитов.',
    website: 'https://unity.com',
  },
  'unreal-engine-3': {
    name: 'Unreal Engine 3', altNames: ['UE3'], maker: 'Epic Games (США)', origin: 'licensed', tech: 'C++, UnrealScript',
    years: [2006, 2015],
    summary: 'Движок Epic Games времён Xbox 360 и PlayStation 3: на нём Frogwares сделала «Преступления и наказания», а многие студии — консольные порты нулевых.',
    website: 'https://www.unrealengine.com',
  },
  'unreal-engine-4': {
    name: 'Unreal Engine 4', altNames: ['UE4'], maker: 'Epic Games (США)', origin: 'licensed', tech: 'C++, Blueprints',
    years: [2014, 2022],
    summary: 'Движок Epic Games, на котором сделаны Atomic Heart, Hello Neighbor, King’s Bounty II, The Sinking City и Sherlock Holmes Chapter One.',
    website: 'https://www.unrealengine.com',
  },
  'unreal-engine-5': {
    name: 'Unreal Engine 5', altNames: ['UE5'], maker: 'Epic Games (США)', origin: 'licensed', tech: 'C++, Blueprints, Nanite, Lumen',
    years: [2022, null],
    summary: 'Движок нового поколения, на который перешли почти все большие постсоветские проекты двадцатых: S.T.A.L.K.E.R. 2, «Смута», INDIKA.',
    website: 'https://www.unrealengine.com',
  },
  cryengine: {
    name: 'CryEngine', altNames: ['CryEngine 3'], maker: 'Crytek (Германия)', origin: 'licensed', tech: 'C++, Lua',
    years: [2007, null],
    summary: 'Движок Crytek, на котором киевское отделение компании сделало бесплатный онлайн-шутер Warface.',
    website: 'https://www.cryengine.com',
  },
  gamemaker: {
    name: 'GameMaker', altNames: ['GameMaker Studio'], maker: 'YoYo Games (Великобритания)', origin: 'licensed', tech: 'GML',
    years: [1999, null],
    summary: 'Движок для двумерных игр, на котором сделан Stoneshard и многие пиксельные независимые проекты.',
    website: 'https://gamemaker.io',
  },
  'serious-engine': {
    name: 'Serious Engine', altNames: ['Serious Engine 4'], maker: 'Croteam (Хорватия)', origin: 'licensed', tech: 'C++',
    years: [2001, null],
    summary: 'Движок хорватской Croteam, на котором российская Timelock Studio сделала официальное дополнение Serious Sam: Siberian Mayhem.',
  },
};
