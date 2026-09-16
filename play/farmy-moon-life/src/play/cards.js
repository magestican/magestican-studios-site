



















import { nameOf } from 'moon/play/names.mjs';
import { noticeSentence } from 'moon/play/town.mjs';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clock = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`);

export function createCards({ el, iconFor, onAct, onChoose, onClose }) {
  const icons = new Map();
  const iconEl = (good, size, cls = 'icon') => {
    const c = document.createElement('canvas');
    c.width = c.height = size * 2;
    c.className = cls;
    const key = `${good}|${size * 2}`;
    if (!icons.has(key)) icons.set(key, iconFor(good, { size: size * 2 }));
    icons.get(key).then((src) => c.getContext('2d').drawImage(src, 0, 0, size * 2, size * 2));
    return c;
  };
  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const button = (cls, act, text, fn, disabled = false) => {
    const b = node('button', cls, text);
    b.type = 'button';
    if (act) b.dataset.act = act;
    b.disabled = disabled;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!b.disabled) fn();
    });
    return b;
  };
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  let sig = null, selected = null, kind = null;

  function place(anchor) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    const w = r.width || 320, h = r.height || 200;
    const x = Math.max(8, Math.min(vw - w - 8, (anchor ? anchor.x : vw / 2) - w / 2));
    
    const y = Math.max(8, Math.min(vh - h - 118, (anchor ? anchor.y : vh / 2) - h - 18));
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function head(title, sub) {
    const h = node('div', 'head');
    const t = node('div', 'title');
    t.append(node('b', '', title), node('span', 'sub', sub));
    h.append(t, button('close', 'close', '×', () => onClose()));
    return h;
  }

  function upgradeRow(upgrade, what) {
    const foot = node('div', 'foot');
    if (!upgrade) { foot.append(node('span', 'why', `The ${what} is as big as it gets.`)); return foot; }
    const b = button('upgrade', 'upgrade', `Upgrade to level ${upgrade.level} · ${upgrade.cost}`, () => onAct(upgrade.action), Boolean(upgrade.why));
    b.append(iconEl('coin', 16, 'coin-icon'));
    foot.append(b);
    if (upgrade.why) foot.append(node('span', 'why', upgrade.why));
    return foot;
  }

  
  function press(menu, anchor) {
    if (kind !== 'press') selected = null;
    kind = 'press';
    const tiles = menu.recipes;
    if (!tiles.some((t) => t.recipe === selected)) selected = (tiles.find((t) => t.action) || tiles[0] || {}).recipe || null;
    const s = JSON.stringify([menu, selected]);
    if (s !== sig) {
      sig = s;
      el.dataset.kind = 'press';
      const free = menu.free > 0 ? `${menu.free} of ${menu.slots} station${menu.slots > 1 ? 's' : ''} free` : 'every station busy';
      const grid = node('div', 'tiles');
      for (const t of tiles) {
        const b = button(`tile${t.recipe === selected ? ' on' : ''}${t.locked ? ' locked' : ''}${t.action ? '' : ' cannot'}`, null, '', () => { selected = t.recipe; sig = null; });
        b.dataset.recipe = t.recipe;
        b.setAttribute('aria-label', cap(nameOf(t.output)));
        b.append(iconEl(t.output, 40), node('span', 'name', cap(nameOf(t.output))), node('span', 'time', t.locked ? `level ${t.level}` : clock(t.time_s)));
        grid.append(b);
      }
      const detail = node('div', 'detail');
      const tile = tiles.find((t) => t.recipe === selected);
      if (tile) {
        const inputs = node('div', 'inputs');
        inputs.append(node('span', 'per', 'Each:'));
        for (const { good, n, held } of tile.inputs) {
          const chip = node('span', `in${held >= n ? '' : ' short'}`);
          chip.append(iconEl(good, 22), node('b', '', `${n}`), node('span', 'held', `(${held})`));
          inputs.append(chip);
        }
        detail.append(inputs);
        const row = node('div', 'row');
        if (tile.action) {
          const step = node('div', 'stepper');
          step.append(
            button('less', 'less', '−', () => onChoose(tile.recipe, Math.max(1, tile.batches - 1)), tile.batches <= 1),
            node('b', 'batches', String(tile.batches)),
            button('more', 'more', '+', () => onChoose(tile.recipe, Math.min(tile.max, tile.batches + 1)), tile.batches >= tile.max),
          );
          row.append(step, button('start', 'start', `Make ${tile.batches}`, () => onAct(tile.action)));
        } else {
          row.append(node('span', 'why', tile.why || ''));
        }
        detail.append(row);
      }
      el.replaceChildren(head(`Press · level ${menu.level}`, free), grid, detail, upgradeRow(menu.upgrade, 'press'));
      el.hidden = false;
    }
    place(anchor);
  }

  
  function shop(info, anchor) {
    kind = 'shop';
    const s = JSON.stringify(info);
    if (s !== sig) {
      sig = s;
      el.dataset.kind = 'shop';
      const boards = node('div', 'boards');
      info.shelves.forEach((shelf, i) => {
        const b = node('div', `board${shelf ? '' : ' empty'}`);
        b.dataset.shelf = String(i);
        if (shelf) b.append(iconEl(shelf.good, 26), node('b', '', String(shelf.count)));
        else b.append(node('span', 'why', 'empty'));
        boards.append(b);
      });
      const hint = node('div', 'row');
      hint.append(node('span', 'why', info.hint));
      el.replaceChildren(head(`Shop · level ${info.level}`, `${info.shelves.length} shelves of ${info.stack}`), boards, hint, upgradeRow(info.upgrade, 'shop'));
      el.hidden = false;
    }
    place(anchor);
  }

  
  
  
  
  const MAX_ROWS = 7;

  function store(view, anchor) {
    kind = 'store';
    const s = JSON.stringify(view);
    if (s !== sig) {
      sig = s;
      el.dataset.kind = 'store';
      el.dataset.store = view.id;
      const rows = node('div', 'rows');
      const shown = view.rows.slice(0, MAX_ROWS);
      for (const r of shown) {
        const line = node('div', `rowline${r.max > 0 ? '' : ' cannot'}`);
        line.dataset.good = r.good;
        const what = node('span', 'what');
        what.append(iconEl(r.good, 26), node('span', 'name', cap(r.name)));
        const price = node('span', 'price', String(r.price));
        price.append(iconEl('coin', 14, 'coin-icon'));
        line.append(what, price);
        if (view.open) {
          const act = view.buying ? 'sell' : 'buy';
          const one = button('one', `${act}1`, view.buying ? 'Sell 1' : 'Buy 1', () => onAct(actionFor(view, r, 1)), r.max < 1);
          const all = button('all', `${act}all`, `${view.buying ? 'Sell' : 'Buy'} ${r.max}`, () => onAct(actionFor(view, r, r.max)), r.max < 2);
          line.append(one, all);
        } else {
          line.append(node('span', 'held', view.buying ? `${r.have} in your pockets` : `${r.have} held`));
        }
        rows.append(line);
      }
      const foot = node('div', 'foot');
      if (!view.open) foot.append(node('span', 'why', view.why));
      else if (view.empty) foot.append(node('span', 'why', view.empty));
      else if (view.rows.length > shown.length) foot.append(node('span', 'why', `and ${view.rows.length - shown.length} more in your pockets`));
      else foot.append(node('span', 'why', view.buying ? `${view.keeper} pays on the spot.` : `${view.keeper} is behind the counter.`));
      el.replaceChildren(head(view.name, view.open ? `${view.keeper} is in` : 'shut'), rows, foot);
      el.hidden = false;
    }
    place(anchor);
  }

  const actionFor = (view, row, count) => (view.buying
    ? { type: 'sellTo', store: view.id, good: row.good, count }
    : { type: 'buyFrom', store: view.id, good: row.good, count });

  
  function notice(view, anchor) {
    kind = 'notice';
    const s = JSON.stringify(view);
    if (s !== sig) {
      sig = s;
      el.dataset.kind = 'notice';
      const body = node('div', 'rows');
      if (view.open && view.up && !view.filled) {
        const line = node('div', `rowline${view.request.short ? ' cannot' : ''}`);
        line.dataset.good = view.request.good;
        const what = node('span', 'what');
        what.append(iconEl(view.request.good, 26), node('span', 'name', `Wanted: ${cap(view.request.name)}`));
        const price = node('span', 'price', String(view.request.coins));
        price.append(iconEl('coin', 14, 'coin-icon'));
        line.append(what, price);
        body.append(line);
        const row = node('div', 'row');
        if (view.request.short > 0) row.append(node('span', 'why', `You have ${view.request.held}. ${view.request.short} more to find.`));
        else row.append(button('start', 'hand', 'Hand them in', () => onAct({ type: 'fillRequest' })));
        body.append(row);
      } else {
        const row = node('div', 'row');
        row.append(node('span', 'why', noticeSentence(view)));
        body.append(row);
      }
      const foot = node('div', 'foot');
      const standing = view.standing;
      foot.append(node('span', 'why', standing.next
        ? `${cap(standing.label)} \u00b7 ${standing.toNext} more notice${standing.toNext === 1 ? '' : 's'}' worth to grow`
        : `${cap(standing.label)}`));
      el.replaceChildren(head(view.name, view.open ? `${view.keeper} is in` : 'shut'), body, foot);
      el.hidden = false;
    }
    place(anchor);
  }

  function hide() {
    if (el.hidden && kind === null) return;
    el.hidden = true;
    kind = null;
    sig = null;
  }

  return { press, shop, store, notice, hide, get kind() { return kind; }, get selected() { return selected; } };
}
