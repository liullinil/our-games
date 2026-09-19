/**
 * Карта связей: перетаскивание, масштаб, выбор вида родства, подсветка связей
 * при наведении, карточка предпросмотра по нажатию, фильтр прочитанного и
 * отложенная загрузка листа миниатюр.
 */
import { all, isHideRead, setHideRead } from './read-state';

type RelKind = 'predecessor' | 'basedOn' | 'engine' | 'publisher';

const REL_LABEL: Record<RelKind, string> = {
  predecessor: 'Продолжение',
  basedOn: 'Одна серия',
  engine: 'Общий движок',
  publisher: 'Общий издатель',
};

/**
 * Виды, которые тянутся цепочкой.
 *
 * Преемственность и общая база передаются дальше: если ГАЗель NN выросла из
 * «Валдая», а тот из своей игры, то вся эта линия — родословная NN, и
 * показывать надо её целиком. Общий движок и общий издатель так не
 * работают: там связаны все со всеми внутри группы, и «цепочка» захватила бы
 * пол-карты через случайные пересечения.
 */
const CHAINED: RelKind[] = ['predecessor', 'basedOn'];

interface Card {
  n: string;
  y: string;
  p: string;
  c: string;
  u: string;
  s: string;
  a: number;
  v: number;
  f: number;
  t?: string;
}

interface Box {
  x: number;
  y: number;
  w: number;
  cy: number;
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-rgraph]');
  if (!root) return;
  const viewport = root.querySelector<HTMLElement>('[data-rgraph-viewport]');
  const svg = root.querySelector<SVGSVGElement>('.rgraph__svg');
  const rail = root.querySelector<HTMLElement>('[data-rgraph-rail]');
  if (!viewport || !svg) return;

  const neighbours: Record<string, Partial<Record<RelKind, string[]>>> = JSON.parse(
    root.querySelector('[data-rgraph-neighbours]')?.textContent || '{}',
  );

  /** Геометрия карточек: считаем один раз, координаты в системе SVG. */
  const boxes = new Map<string, Box>();
  const nodes = new Map<string, SVGGraphicsElement>();
  for (const node of svg.querySelectorAll<SVGGraphicsElement>('[data-node]')) {
    const id = node.getAttribute('data-node')!;
    const rect = node.querySelector('rect');
    if (!rect) continue;
    const x = Number(rect.getAttribute('x'));
    const y = Number(rect.getAttribute('y'));
    const w = Number(rect.getAttribute('width'));
    const h = Number(rect.getAttribute('height'));
    boxes.set(id, { x, y, w, cy: y + h / 2 });
    nodes.set(id, node);
  }

  // ── Лист миниатюр ────────────────────────────────────────────────────
  /*
   * Адрес листа лежит в data-href, а не в href: на главной карта стоит
   * внизу, и качать двести килобайт до того, как до неё долистали, незачем.
   * Переносим адрес, когда карта подходит к окну. Лист один на все
   * карточки — браузер скачает его один раз.
   */
  const lazyImages = [...svg.querySelectorAll<SVGImageElement>('image[data-href]')];
  const revealThumbs = () => {
    for (const img of lazyImages) {
      const href = img.dataset.href;
      if (href) img.setAttribute('href', href);
    }
  };
  if (lazyImages.length > 0) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          revealThumbs();
          io.disconnect();
        },
        { rootMargin: '400px' },
      );
      io.observe(root);
    } else {
      revealThumbs();
    }
  }

  // ── Панорамирование и масштаб ────────────────────────────────────────
  let scale = 1;
  let tx = 0;
  let ty = 0;

  const applyTransform = () => {
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    syncRail();
  };

  const railItems = rail
    ? [...rail.querySelectorAll<HTMLElement>('.rgraph__railitem')]
    : [];

  let railQueued = false;
  function syncRail(): void {
    if (!rail || railQueued) return;
    railQueued = true;
    requestAnimationFrame(() => {
      railQueued = false;
      const height = rail.clientHeight;
      for (const item of railItems) {
        const top = Number(item.dataset.top) * scale + ty;
        const bandHeight = Number(item.dataset.height) * scale;
        // Подпись держится у верхнего края полосы, но не уезжает за экран:
        // пока хоть часть завода видна, его имя остаётся на месте.
        const clamped = Math.min(Math.max(top, 2), Math.max(top + bandHeight - 14, 2));
        const off = top + bandHeight < 0 || top > height;
        item.hidden = off;
        item.style.transform = `translateY(${Math.min(clamped, height - 14)}px)`;
      }
    });
  }

  const zoomAt = (factor: number, px: number, py: number) => {
    const next = Math.min(3, Math.max(0.2, scale * factor));
    if (next === scale) return;
    tx = px - ((px - tx) * next) / scale;
    ty = py - ((py - ty) * next) / scale;
    scale = next;
    applyTransform();
  };

  const pointers = new Map<number, { x: number; y: number }>();
  const origins = new Map<number, { x: number; y: number }>();
  const captured = new Set<number>();
  /*
   * Была ли последняя работа указателем протяжкой.
   *
   * Проверять captured в обработчике нажатия нельзя: указатель отпускают
   * раньше, чем приходит событие нажатия, и к тому моменту множество уже
   * пусто. Из-за этого карта, которую просто подвинули мышью, закрывала
   * открытую карточку.
   */
  let didDrag = false;
  let pinchDist = 0;
  const DRAG_SLOP = 5;

  viewport.addEventListener('pointerdown', (e) => {
    didDrag = false;
    // Протяжка внутри карточки предпросмотра — это прокрутка самой карточки,
    // а не панорама карты: иначе на телефоне длинное описание не пролистать.
    if ((e.target as Element).closest('[data-rgraph-card]')) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    origins.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });

  viewport.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };

    if (pointers.size === 2) {
      pointers.set(e.pointerId, now);
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchDist > 0) {
        const rect = viewport.getBoundingClientRect();
        zoomAt(dist / pinchDist, (a!.x + b!.x) / 2 - rect.left, (a!.y + b!.y) / 2 - rect.top);
      }
      pinchDist = dist;
      return;
    }

    // Пока указатель не ушёл дальше порога, это ещё нажатие, а не протяжка:
    // не двигаем карту и не захватываем указатель — иначе событие нажатия
    // достанется холсту, и карточка игры не откроется.
    const from = origins.get(e.pointerId);
    if (!captured.has(e.pointerId)) {
      if (!from || Math.hypot(now.x - from.x, now.y - from.y) <= DRAG_SLOP) {
        pointers.set(e.pointerId, now);
        return;
      }
      viewport.setPointerCapture(e.pointerId);
      captured.add(e.pointerId);
      didDrag = true;
      viewport.classList.add('is-grabbing');
    }

    tx += now.x - prev.x;
    ty += now.y - prev.y;
    pointers.set(e.pointerId, now);
    applyTransform();
  });

  /*
   * Холст не должен прокручиваться сам.
   *
   * Положение карты держит преобразование, а не прокрутка: по нему же
   * считается, где рисовать подписи заводов. Но у холста `overflow: hidden`,
   * и браузер всё равно прокручивает его, когда наводит фокус на нажатую
   * ссылку внутри. Карта тогда уезжала, а полоса заводов оставалась на месте,
   * и подписи переставали соответствовать полосам. Переводим случайную
   * прокрутку в преобразование: картинка не дёргается, а счёт снова сходится.
   */
  viewport.addEventListener('scroll', () => {
    if (!viewport.scrollLeft && !viewport.scrollTop) return;
    tx -= viewport.scrollLeft;
    ty -= viewport.scrollTop;
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
    applyTransform();
  });

  const endPointer = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    captured.delete(e.pointerId);
    origins.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0) viewport.classList.remove('is-grabbing');
  };
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);

  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
    },
    { passive: false },
  );

  root.querySelectorAll<HTMLButtonElement>('[data-rzoom]').forEach((button) => {
    button.addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      if (button.dataset.rzoom === 'reset') {
        scale = 1;
        tx = 0;
        ty = 0;
        applyTransform();
      } else {
        zoomAt(button.dataset.rzoom === 'in' ? 1.25 : 1 / 1.25, rect.width / 2, rect.height / 2);
      }
    });
  });

  const fullButton = root.querySelector<HTMLButtonElement>('[data-rfull]');
  const setFull = (on: boolean) => {
    root.classList.toggle('is-full', on);
    fullButton?.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (fullButton) fullButton.textContent = on ? 'Свернуть' : 'На весь экран';
    document.body.style.overflow = on ? 'hidden' : '';
    // Окно карты изменилось — подписи заводов считаются от его высоты.
    applyTransform();
  };
  fullButton?.addEventListener('click', () => setFull(!root.classList.contains('is-full')));

  /** Ставим точку карты в центр окна. */
  const centerOn = (id: string) => {
    const box = boxes.get(id);
    if (!box) return;
    tx = viewport.clientWidth / 2 - (box.x + box.w / 2) * scale;
    ty = viewport.clientHeight / 2 - box.cy * scale;
    applyTransform();
  };

  railItems.forEach((item) => {
    item.addEventListener('click', () => {
      ty = 12 - Number(item.dataset.top) * scale;
      applyTransform();
    });
  });

  // ── Вид родства ──────────────────────────────────────────────────────
  let relKind: RelKind = 'predecessor';

  const setKind = (kind: RelKind) => {
    relKind = kind;
    root.dataset.rel = kind;
    root.querySelectorAll<HTMLButtonElement>('[data-rel-kind]').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.relKind === kind ? 'true' : 'false');
    });
    svg.querySelectorAll<SVGGElement>('[data-layer]').forEach((layer) => {
      if (layer.getAttribute('data-layer') === kind) layer.removeAttribute('hidden');
      else layer.setAttribute('hidden', '');
    });
    svg.querySelectorAll<SVGGElement>('[data-pop]').forEach((pop) => pop.setAttribute('hidden', ''));
    if (openId) {
      fillCard(openId);
      // Смена вида меняет и то, что подсвечено: пересобираем цепочку.
      select(openId);
    }
  };

  root.querySelectorAll<HTMLButtonElement>('[data-rel-kind]').forEach((button) => {
    button.addEventListener('click', () => setKind(button.dataset.relKind as RelKind));
  });

  // ── Подсветка связей при наведении ───────────────────────────────────
  /*
   * Рёбра слоёв разбираем один раз: по ним считается цепочка предков и
   * потомков, и они же подсвечиваются. Рисовать вместо них лучи из выбранной
   * игры было бы неправдой — на карте цепочка идёт от звена к звену.
   */
  interface LayerEdge {
    el: SVGPathElement;
    from: string;
    to: string;
  }
  const layerEdges = new Map<RelKind, LayerEdge[]>();
  const upOf = new Map<RelKind, Map<string, string[]>>();
  const downOf = new Map<RelKind, Map<string, string[]>>();
  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };
  for (const layer of svg.querySelectorAll<SVGGElement>('[data-layer]')) {
    const kind = layer.getAttribute('data-layer') as RelKind;
    const list: LayerEdge[] = [];
    const up = new Map<string, string[]>();
    const down = new Map<string, string[]>();
    for (const el of layer.querySelectorAll<SVGPathElement>('.rgraph__edge')) {
      const from = el.getAttribute('data-from')!;
      const to = el.getAttribute('data-to')!;
      list.push({ el, from, to });
      push(up, to, from);
      push(down, from, to);
    }
    layerEdges.set(kind, list);
    upOf.set(kind, up);
    downOf.set(kind, down);
  }

  // ── Фильтр «Скрыть прочитанные» ──────────────────────────────────────
  /*
   * Карточки прочитанных игр прячет CSS по классу is-read, который ставит
   * read-state. Но линии к спрятанной карточке остались бы висеть в пустоте,
   * а список модификаций — раскрываться из ничего; их убираем здесь, по тому
   * же списку прочитанного. Настройка общая с каталогом: один флажок
   * «скрыть прочитанные» на весь сайт.
   */
  const hideButton = root.querySelector<HTMLButtonElement>('[data-hide-read]');
  const hideCount = hideButton?.querySelector<HTMLElement>('[data-hide-count]') ?? null;
  const applyHideRead = () => {
    const on = isHideRead();
    const read = all().read;
    root.classList.toggle('is-hide-read', on);
    hideButton?.setAttribute('aria-pressed', on ? 'true' : 'false');
    let readHere = 0;
    const hidden = new Set<string>();
    for (const id of nodes.keys()) {
      if (!read[id]) continue;
      readHere += 1;
      if (on) hidden.add(id);
    }
    for (const list of layerEdges.values()) {
      for (const edge of list) {
        edge.el.classList.toggle('is-hidden', hidden.has(edge.from) || hidden.has(edge.to));
      }
    }
    svg.querySelectorAll<SVGGElement>('[data-pop]').forEach((pop) => {
      pop.classList.toggle('is-hidden', hidden.has(pop.getAttribute('data-pop') ?? ''));
    });
    if (hideCount) hideCount.textContent = readHere > 0 ? String(readHere) : '';
    // Открытую карточку спрятанной игры закрываем: указывать ей некуда.
    if (on && openId && hidden.has(openId)) {
      closeCard();
      clearHighlight();
    }
  };
  hideButton?.addEventListener('click', () => {
    setHideRead(!isHideRead());
    applyHideRead();
  });
  document.addEventListener('igrostroy:progress', applyHideRead);
  document.addEventListener('igrostroy:hideread', applyHideRead);

  /** Все предки и потомки игры по выбранному виду родства. */
  const relatedSet = (id: string, kind: RelKind): Set<string> => {
    const found = new Set<string>([id]);
    if (!CHAINED.includes(kind)) {
      for (const other of neighbours[id]?.[kind] ?? []) found.add(other);
      return found;
    }
    const walk = (start: string, map: Map<string, string[]>) => {
      const queue = [start];
      while (queue.length) {
        const current = queue.pop()!;
        for (const next of map.get(current) ?? []) {
          if (found.has(next)) continue;
          found.add(next);
          queue.push(next);
        }
      }
    };
    // Вверх и вниз отдельно: иначе через общего предка в родословную попадут
    // двоюродные ветки, к самой игре отношения не имеющие.
    walk(id, upOf.get(kind) ?? new Map());
    walk(id, downOf.get(kind) ?? new Map());
    return found;
  };

  const clearHighlight = () => {
    root.classList.remove('is-highlight');
    svg.querySelectorAll('.is-near').forEach((el) => el.classList.remove('is-near'));
    svg.querySelectorAll('.is-focus').forEach((el) => el.classList.remove('is-focus'));
    svg.querySelectorAll('.is-chain').forEach((el) => el.classList.remove('is-chain'));
    railItems.forEach((i) => i.classList.remove('is-near'));
  };

  /** Отмечаем игры и полосы заводов, которых касается подсветка. */
  const markNear = (ids: Iterable<string>) => {
    const studios = new Set<string>();
    for (const other of ids) {
      const node = nodes.get(other);
      node?.classList.add('is-near');
      const studio = node?.getAttribute('data-studio');
      if (studio) studios.add(studio);
    }
    railItems.forEach((i) => i.classList.toggle('is-near', studios.has(i.dataset.band ?? '')));
  };

  /**
   * Подсветка игры: вся цепочка выбранного вида родства.
   *
   * И наведение, и нажатие показывают одно и то же. Раньше наведение рисовало
   * лучи ко всем соседям всех видов сразу — вокруг игры загоралась россыпь
   * карточек, по которой непонятно, кто кому кем приходится.
   */
  const select = (id: string) => {
    if (!boxes.has(id)) return;
    clearHighlight();
    root.classList.add('is-highlight');
    nodes.get(id)?.classList.add('is-focus');
    const chain = relatedSet(id, relKind);
    markNear(chain);
    for (const edge of layerEdges.get(relKind) ?? []) {
      if (chain.has(edge.from) && chain.has(edge.to)) edge.el.classList.add('is-chain');
    }
  };

  // ── Карточка предпросмотра ───────────────────────────────────────────
  const card = root.querySelector<HTMLElement>('[data-rgraph-card]');
  const cardsUrl = root.dataset.cards ?? '';
  // Адреса в /graph-cards.json настольные; мобильная карта передаёт своё
  // начало адреса игры и получает ссылки на страницы под /m/.
  const gameBase = root.dataset.gameBase ?? '';
  const urlOf = (id: string, c: Card | undefined) =>
    gameBase ? `${gameBase}${id}/` : (c?.u ?? '#');
  let cards: Record<string, Card> | null = null;
  let openId: string | null = null;

  const loadCards = async () => {
    if (cards) return cards;
    try {
      const r = await fetch(cardsUrl);
      cards = (await r.json()) as Record<string, Card>;
    } catch {
      cards = {};
    }
    return cards;
  };

  const el = <T extends HTMLElement>(sel: string) => card?.querySelector<T>(sel) ?? null;

  function fillCard(id: string): void {
    if (!card || !cards) return;
    const c = cards[id];
    if (!c) return;
    const media = el('[data-card-media]');
    if (media) {
      media.replaceChildren();
      if (c.t) {
        const img = document.createElement('img');
        img.src = c.t;
        img.alt = '';
        img.loading = 'lazy';
        media.appendChild(img);
      }
    }
    const link = el<HTMLAnchorElement>('[data-card-link]');
    if (link) {
      link.textContent = c.n;
      link.href = urlOf(id, c);
    }
    const go = el<HTMLAnchorElement>('[data-card-go]');
    if (go) go.href = urlOf(id, c);
    const meta = el('[data-card-meta]');
    if (meta) meta.textContent = [c.p, c.y, c.c].filter(Boolean).join(' · ');
    const summary = el('[data-card-summary]');
    if (summary) summary.textContent = c.s;

    const has = el('[data-card-has]');
    if (has) {
      has.replaceChildren();
      const marks: [string, boolean][] = [
        [c.a ? 'Статья' : 'Карточка', c.a === 1],
        [c.v ? `Видео · ${c.v}` : 'Видео', c.v > 0],
        [c.f ? `Скриншоты · ${c.f}` : 'Скриншоты', c.f > 0],
      ];
      for (const [label, on] of marks) {
        const li = document.createElement('li');
        li.textContent = label;
        if (on) li.classList.add('is-on');
        has.appendChild(li);
      }
    }

    const rels = el('[data-card-rels]');
    if (rels) {
      rels.replaceChildren();
      /*
       * У преемственности и общей базы перечисляем всю линию, а не ближайшее
       * звено: карта подсвечивает именно её, и список должен совпадать
       * с картинкой. Порядок — по годам, то есть слева направо по карте.
       */
      const list = CHAINED.includes(relKind)
        ? [...relatedSet(id, relKind)]
            .filter((other) => other !== id)
            .sort((a, b) => (boxes.get(a)?.x ?? 0) - (boxes.get(b)?.x ?? 0))
        : (neighbours[id]?.[relKind] ?? []);
      const title = document.createElement('b');
      title.textContent = list.length
        ? REL_LABEL[relKind]
        : `${REL_LABEL[relKind]} — связей нет`;
      rels.appendChild(title);
      for (const other of list.slice(0, 12)) {
        const a = document.createElement('a');
        a.href = urlOf(other, cards[other]);
        a.textContent = cards[other]?.n ?? other;
        a.addEventListener('click', (e) => {
          // Переходим по карте, а не на другую страницу: соседа видно сразу.
          e.preventDefault();
          /*
           * Дальше событие не пускаем.
           *
           * Холст закрывает карточку, когда нажали мимо неё, и узнаёт «мимо»
           * по тому, лежит ли цель внутри карточки. Но карточку к этому
           * моменту уже перерисовали под соседа, и нажатая ссылка из дерева
           * удалена — проверка отвечала «мимо», и карточка тут же закрывалась.
           */
          e.stopPropagation();
          openCard(other);
          centerOn(other);
          select(other);
        });
        rels.appendChild(a);
      }
    }
  }

  async function openCard(id: string): Promise<void> {
    if (!card) return;
    openId = id;
    await loadCards();
    if (openId !== id) return;
    fillCard(id);
    card.hidden = false;
    history.replaceState(null, '', `#${id}`);
  }

  const closeCard = () => {
    openId = null;
    if (card) card.hidden = true;
  };

  el('[data-card-close]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard();
  });

  /*
   * Нажатие по карточке ведёт в статью.
   *
   * Догадываться, что переход спрятан в заголовке, не нужно: работает вся
   * карточка целиком. Ссылки соседей и крестик при этом остаются при своём —
   * они обрабатывают нажатие сами.
   *
   * Но на телефоне карточка занимает экран целиком, и там это уже ловушка:
   * читатель ведёт пальцем по тексту или промахивается мимо соседа — и
   * улетает со страницы. На весь экран переход только по кнопке.
   */
  const fullScreenCard = window.matchMedia('(max-width: 640px)');
  card?.addEventListener('click', (e) => {
    if (fullScreenCard.matches) return;
    if ((e.target as Element).closest('a, button')) return;
    const href = el<HTMLAnchorElement>('[data-card-go]')?.href;
    if (href) location.href = href;
  });

  // Карточка на весь экран закрывает собой всё, поэтому Escape тоже закрывает.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openId) closeCard();
  });

  // ── Наведение и нажатие на карточки ──────────────────────────────────
  // На сенсорном экране наведения нет: там первое касание открывает карточку
  // и подсвечивает связи. Одного «(hover: none)» мало — так себя описывает и
  // браузер без мыши на обычном компьютере.
  const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const dragging = () => didDrag;

  for (const [id, node] of nodes) {
    if (!touchOnly) {
      node.addEventListener('mouseenter', () => {
        if (!openId) select(id);
      });
      node.addEventListener('mouseleave', () => {
        if (!openId) clearHighlight();
      });
    }
    node.addEventListener('click', (e) => {
      if (dragging()) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      openCard(id);
      select(id);
    });
  }

  // Модификации: счётчик «+N» раскрывает список наведением и нажатием.
  svg.querySelectorAll<SVGGElement>('[data-mods]').forEach((mark) => {
    const id = mark.getAttribute('data-mods')!;
    const pop = svg.querySelector<SVGGElement>(`[data-pop="${CSS.escape(id)}"]`);
    if (!pop) return;
    // Наведение открывает список на время, нажатие оставляет его открытым.
    let pinned = false;
    const show = () => pop.removeAttribute('hidden');
    const hide = () => {
      if (!pinned) pop.setAttribute('hidden', '');
    };
    mark.addEventListener('mouseenter', show);
    mark.addEventListener('mouseleave', hide);
    mark.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pinned = !pinned;
      if (pinned) show();
      else pop.setAttribute('hidden', '');
    });
    pop.addEventListener('mouseenter', show);
    pop.addEventListener('mouseleave', hide);
  });

  viewport.addEventListener('click', (e) => {
    if (dragging()) return;
    if ((e.target as Element).closest('[data-node], [data-pop], [data-rgraph-card]')) return;
    closeCard();
    clearHighlight();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (root.classList.contains('is-full')) {
      setFull(false);
      return;
    }
    closeCard();
    clearHighlight();
  });

  // Фильтр применяем после того, как собраны рёбра и карточка: он их трогает.
  applyHideRead();

  // ── Глубокая ссылка вида /graph/#gaz-51 ──────────────────────────────
  applyTransform();
  const target = decodeURIComponent(location.hash.slice(1));
  if (target && boxes.has(target)) {
    /*
     * Прокруткой страницы занимаемся сами.
     *
     * У карточек нет id: будь он, браузер прыгнул бы к узлу сам и утащил бы
     * переключатель видов под шапку. Нам же нужно показать карту целиком,
     * а нужную игру поставить в середину холста.
     */
    root.scrollIntoView({ block: 'start' });
    centerOn(target);
    select(target);
    openCard(target);
  } else {
    syncRail();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/** Файл подключается как модуль; экспорт держит имена вне глобальной области. */
export {};
