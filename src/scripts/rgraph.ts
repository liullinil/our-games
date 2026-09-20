/**
 * Карта связей: подсветка родства при наведении, карточка предпросмотра,
 * фильтр прочитанного, полноэкранный режим.
 *
 * Плитки — обычная разметка, а не холст, поэтому ни перетаскивания, ни
 * масштаба здесь нет: карта листается как страница. Линии связи рисуются
 * поверх плиток по координатам, снятым с самой разметки, и только для той
 * игры, на которую навели: двести игр дают сотни рёбер, и нарисованные все
 * разом они превращают карту в паутину.
 */
import { all, isHideRead, setHideRead } from './read-state';

type RelKind = 'predecessor' | 'basedOn' | 'engine' | 'publisher';

/**
 * Виды, которые тянутся цепочкой.
 *
 * Преемственность и общая основа передаются дальше: если «Корсары 3» выросли
 * из «Корсаров 2», а те — из первых, то вся эта линия — родословная третьей
 * части, и показывать надо её целиком. Общий движок и общий издатель так не
 * работают: там связаны все со всеми внутри группы, и «цепочка» захватила бы
 * пол-карты через случайные пересечения.
 */
const CHAINED: RelKind[] = ['predecessor', 'basedOn'];

/** Ключи коротки, потому что повторяются сотни раз; расшифровка в graph-cards.json.ts. */
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

type Neighbours = Record<string, Partial<Record<RelKind, string[]>>>;

const SVG_NS = 'http://www.w3.org/2000/svg';

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-rgraph]');
  if (!root) return;
  const scroll = root.querySelector<HTMLElement>('[data-rgraph-scroll]');
  const content = root.querySelector<HTMLElement>('[data-rgraph-content]');
  const wires = root.querySelector<SVGSVGElement>('[data-rgraph-wires]');
  const pop = root.querySelector<HTMLElement>('[data-rgraph-pop]');
  if (!scroll || !content || !wires || !pop) return;

  const neighbours: Neighbours = JSON.parse(root.dataset.neighbours ?? '{}');
  const cards = new Map<string, HTMLAnchorElement>();
  for (const el of root.querySelectorAll<HTMLAnchorElement>('[data-node]')) {
    cards.set(el.dataset.node!, el);
  }

  let kind: RelKind = (root.dataset.rel as RelKind) ?? 'predecessor';
  let litId: string | null = null;

  // ── Кто с кем связан ──────────────────────────────────────────────────

  /**
   * Соседи игры по выбранному виду родства.
   *
   * Для преемственности и общей основы обходим цепочку целиком: показываем
   * всю родословную, а не только соседние звенья.
   */
  function related(id: string, of: RelKind): Set<string> {
    const out = new Set<string>();
    if (!CHAINED.includes(of)) {
      for (const next of neighbours[id]?.[of] ?? []) out.add(next);
      return out;
    }
    const queue = [id];
    const seen = new Set([id]);
    while (queue.length > 0) {
      const at = queue.shift()!;
      for (const next of neighbours[at]?.[of] ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        out.add(next);
        queue.push(next);
      }
    }
    return out;
  }

  /** Все прочие связи игры — их показываем приглушённо, чтобы не терялись. */
  function others(id: string, except: RelKind): Set<string> {
    const out = new Set<string>();
    for (const [name, list] of Object.entries(neighbours[id] ?? {})) {
      if (name === except) continue;
      for (const next of list ?? []) out.add(next);
    }
    return out;
  }

  // ── Линии ─────────────────────────────────────────────────────────────

  /**
   * Координаты карточки внутри полотна.
   *
   * Берём разницу прямоугольников, а не offsetTop: карточка лежит в двух
   * вложенных сетках, и складывать смещения пришлось бы через всех предков.
   */
  function boxOf(el: HTMLElement): { x: number; y: number; w: number; h: number } {
    const a = el.getBoundingClientRect();
    const b = content!.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }

  /**
   * Дуга между карточками.
   *
   * Прямая через полкарты читается плохо и пересекает десятки плиток, поэтому
   * ведём кривую: она заметно отходит от прямой и глаз прослеживает её до
   * конца. Чем дальше игры друг от друга, тем сильнее прогиб.
   */
  function wire(from: HTMLElement, to: HTMLElement): string {
    const a = boxOf(from);
    const b = boxOf(to);
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const bow = Math.min(90, Math.hypot(bx - ax, by - ay) * 0.22);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2 - bow;
    return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
  }

  function clearWires(): void {
    for (const el of wires!.querySelectorAll('path[data-wire]')) el.remove();
  }

  function drawWires(id: string, strong: Set<string>, soft: Set<string>): void {
    clearWires();
    const from = cards.get(id);
    if (!from) return;
    const size = content!.getBoundingClientRect();
    wires!.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
    wires!.setAttribute('width', String(size.width));
    wires!.setAttribute('height', String(size.height));

    const draw = (to: string, weak: boolean) => {
      const el = cards.get(to);
      if (!el || el.offsetParent === null) return;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', wire(from, el));
      path.setAttribute('data-wire', weak ? 'soft' : 'strong');
      path.setAttribute('fill', 'none');
      wires!.append(path);
    };
    for (const to of soft) if (!strong.has(to)) draw(to, true);
    for (const to of strong) draw(to, false);
  }

  // ── Подсветка ─────────────────────────────────────────────────────────

  function clearLight(): void {
    root!.removeAttribute('data-lit');
    for (const el of cards.values()) {
      el.removeAttribute('data-lit');
      el.removeAttribute('data-lit-soft');
    }
    clearWires();
    litId = null;
  }

  function light(id: string): void {
    const self = cards.get(id);
    if (!self) return;
    clearLight();
    litId = id;
    const strong = related(id, kind);
    const soft = others(id, kind);
    root!.setAttribute('data-lit', '');
    self.setAttribute('data-lit', '');
    for (const to of strong) cards.get(to)?.setAttribute('data-lit', '');
    for (const to of soft) {
      if (!strong.has(to)) cards.get(to)?.setAttribute('data-lit-soft', '');
    }
    drawWires(id, strong, soft);
  }

  for (const [id, el] of cards) {
    el.addEventListener('mouseenter', () => light(id));
    el.addEventListener('focus', () => light(id));
  }
  root.querySelector('[data-rgraph-frame]')?.addEventListener('mouseleave', clearLight);

  // ── Вид родства ───────────────────────────────────────────────────────

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-rel-kind]')) {
    button.addEventListener('click', () => {
      kind = button.dataset.relKind as RelKind;
      root.dataset.rel = kind;
      for (const other of root.querySelectorAll<HTMLButtonElement>('[data-rel-kind]')) {
        other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
      }
      if (litId) light(litId);
    });
  }

  // ── Фильтр «Скрыть прочитанные» ───────────────────────────────────────

  /*
   * Настройка общая с каталогом: один флажок «скрыть прочитанные» на весь
   * сайт. Прячем сами плитки, а заодно гасим линии — вести их к спрятанной
   * карточке некуда.
   */
  const hideButton = root.querySelector<HTMLButtonElement>('[data-hide-read]');
  const hideCount = hideButton?.querySelector<HTMLElement>('[data-hide-count]') ?? null;

  function applyRead(): void {
    const on = isHideRead();
    const read = all().read;
    root!.toggleAttribute('data-hide-read', on);
    hideButton?.setAttribute('aria-pressed', on ? 'true' : 'false');
    let count = 0;
    for (const [id, el] of cards) {
      const was = Boolean(read[id]);
      el.toggleAttribute('data-read', was);
      if (was) count += 1;
    }
    if (hideCount) hideCount.textContent = count > 0 ? String(count) : '';
    if (litId) (on && read[litId] ? clearLight() : light(litId));
  }

  hideButton?.addEventListener('click', () => {
    setHideRead(!isHideRead());
    applyRead();
  });
  document.addEventListener('igrostroy:progress', applyRead);
  document.addEventListener('igrostroy:hideread', applyRead);
  applyRead();

  // ── Карточка предпросмотра ────────────────────────────────────────────

  /*
   * Адреса в /graph-cards.json настольные; мобильная карта передаёт своё
   * начало адреса игры и получает ссылки на страницы под /m/.
   */
  const cardsUrl = root.dataset.cards!;
  const gameBase = root.dataset.gameBase;
  let data: Record<string, Card> | null = null;
  let openId: string | null = null;

  async function loadCards(): Promise<Record<string, Card>> {
    if (data) return data;
    const res = await fetch(cardsUrl);
    data = (await res.json()) as Record<string, Card>;
    return data;
  }

  const num = (n: number, one: string, few: string, many: string) => {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
    if (mod10 === 1) return `${n} ${one}`;
    if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
    return `${n} ${many}`;
  };

  function closeCard(): void {
    pop!.hidden = true;
    openId = null;
  }

  async function openCard(id: string, anchor: HTMLElement): Promise<void> {
    const all = await loadCards();
    const card = all[id];
    if (!card) return;
    openId = id;
    const href = gameBase ? `${gameBase}${id}/` : card.u;
    const media: string[] = [];
    if (card.f > 0) media.push(num(card.f, 'кадр', 'кадра', 'кадров'));
    if (card.v > 0) media.push(num(card.v, 'ролик', 'ролика', 'роликов'));
    pop!.innerHTML = `
      ${card.t ? `<img src="${card.t}" alt="" loading="lazy">` : ''}
      <strong>${card.n}</strong>
      <span class="rgraph__popmeta">${[card.y, card.p, card.c].filter(Boolean).join(' · ')}</span>
      <span class="rgraph__popsum">${card.s}</span>
      <span class="rgraph__popmeta">${card.a ? 'статья' : 'коротко'}${media.length ? ` · ${media.join(' · ')}` : ''}</span>
      <a href="${href}">Открыть статью →</a>`;
    pop!.hidden = false;

    // Ставим карточку рядом с плиткой, но не даём вылезти за края окна карты.
    const box = anchor.getBoundingClientRect();
    const frame = root!.getBoundingClientRect();
    const width = pop!.offsetWidth;
    const left = Math.min(
      Math.max(8, box.left - frame.left),
      Math.max(8, frame.width - width - 8),
    );
    const below = box.bottom - frame.top + 8;
    const fits = below + pop!.offsetHeight < frame.height;
    pop!.style.left = `${left}px`;
    pop!.style.top = fits ? `${below}px` : `${Math.max(8, box.top - frame.top - pop!.offsetHeight - 8)}px`;
  }

  /*
   * Первое нажатие открывает карточку, второе — уводит на статью. Так один
   * и тот же жест работает и мышью, и пальцем: на сенсорном экране наведения
   * нет, а сразу уходить со страницы по первому касанию — потеря места.
   */
  for (const [id, el] of cards) {
    el.addEventListener('click', (event) => {
      if (openId === id) return;
      event.preventDefault();
      light(id);
      void openCard(id, el);
    });
  }
  document.addEventListener('click', (event) => {
    if (!openId) return;
    const target = event.target as HTMLElement;
    if (!target.closest('[data-node]') && !target.closest('[data-rgraph-pop]')) closeCard();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeCard();
    clearLight();
  });
  scroll.addEventListener('scroll', closeCard, { passive: true });

  // ── На весь экран ─────────────────────────────────────────────────────

  const full = root.querySelector<HTMLButtonElement>('[data-rfull]');
  full?.addEventListener('click', () => {
    const on = !root.hasAttribute('data-full');
    root.toggleAttribute('data-full', on);
    full.setAttribute('aria-pressed', on ? 'true' : 'false');
    full.textContent = on ? 'Свернуть' : 'На весь экран';
    document.body.style.overflow = on ? 'hidden' : '';
    if (litId) light(litId);
  });

  // Размер окна поменялся — нарисованные линии надо пересчитать.
  window.addEventListener('resize', () => {
    if (litId) light(litId);
  });

  // ── Глубокая ссылка вида /graph/#vangers ──────────────────────────────

  const wanted = decodeURIComponent(location.hash.slice(1));
  if (wanted && cards.has(wanted)) {
    const el = cards.get(wanted)!;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    light(wanted);
    void openCard(wanted, el);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
