














const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function createCraftCard({ el, trayEl, button, iconFor, onCraft, onPlace, onTab, onPick, onClose }) {
  const icons = new Map();
  const iconEl = (item, size, cls = 'icon') => {
    const c = document.createElement('canvas');
    c.width = c.height = size * 2;
    c.className = cls;
    const key = `${item}|${size * 2}`;
    if (!icons.has(key)) icons.set(key, Promise.resolve(iconFor(item, { size: size * 2 })).catch(() => null));
    icons.get(key).then((src) => { if (src) c.getContext('2d').drawImage(src, 0, 0, size * 2, size * 2); });
    return c;
  };
  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const tap = (n, fn) => {
    n.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!n.disabled) fn();
    });
    return n;
  };
  const button2 = (cls, act, text, fn, disabled = false) => {
    const b = node('button', cls, text);
    b.type = 'button';
    if (act) b.dataset.act = act;
    b.disabled = disabled;
    return tap(b, fn);
  };
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  trayEl.addEventListener('pointerdown', (e) => e.stopPropagation());
  tap(button, () => (open ? close() : onTab(null)));

  let open = false, sig = null, traySig = null;
  const stats = { open: false, tab: null, selected: null, crafts: 0, places: 0, tiles: 0, trayItems: 0 };

  function close() {
    open = false;
    stats.open = false;
    sig = null;
    el.hidden = true;
    delete el.dataset.open;
    onClose();
  }

  
  function show(menu, world) {
    open = true;
    stats.open = true;
    stats.tab = menu.category;
    stats.selected = menu.selected;
    stats.tiles = menu.items.length;
    const s = JSON.stringify([menu, world.coins]);
    if (s === sig) return;
    sig = s;
    el.hidden = false;
    el.dataset.open = menu.category;

    const head = node('div', 'head');
    const title = node('div', 'title');
    title.append(node('b', '', 'Workshop'), node('span', 'sub', `${menu.items.length} to make`));
    head.append(title, button2('close', 'close', '×', close));

    const tabs = node('div', 'tabs');
    for (const c of menu.categories) {
      const b = button2(`tab${c.key === menu.category ? ' on' : ''}`, null, c.label, () => onTab(c.key));
      b.dataset.tab = c.key;
      if (c.made > 0) b.append(node('i', 'dot', String(c.made)));
      tabs.append(b);
    }

    const grid = node('div', 'tiles');
    for (const t of menu.items) {
      const b = button2(`tile${t.item === menu.selected ? ' on' : ''}${t.action ? '' : ' cannot'}`, null, '', () => onPick(t.item));
      b.dataset.item = t.item;
      b.setAttribute('aria-label', cap(t.name));
      b.append(iconEl(t.item, 44), node('span', 'name', cap(t.name)));
      if (t.made > 0) b.append(node('i', 'have', `x${t.made}`));
      grid.append(b);
    }

    const detail = node('div', 'detail');
    const tile = menu.items.find((t) => t.item === menu.selected);
    if (tile) {
      const costs = node('div', 'costs');
      costs.append(node('span', 'per', 'Takes:'));
      for (const { resource, n, held } of tile.cost) {
        const chip = node('span', `in${held >= n ? '' : ' short'}`);
        chip.append(node('b', '', `${n} ${resource}`), node('span', 'held', `(${held})`));
        costs.append(chip);
      }
      detail.append(costs);
      const row = node('div', 'row');
      if (tile.action) {
        row.append(button2('make', 'make', cap(tile.label), () => { stats.crafts += 1; onCraft(tile.action); }));
      } else {
        row.append(node('span', 'why', tile.why || ''));
      }
      if (tile.made > 0) row.append(button2('place', 'place', `Place (${tile.made})`, () => { stats.places += 1; onPlace(tile.item); }));
      detail.append(row);
    }
    el.replaceChildren(head, tabs, grid, detail);
  }

  




  function tray(items, placing) {
    stats.trayItems = items.length;
    const s = JSON.stringify([items, placing]);
    if (s === traySig) return;
    traySig = s;
    if (!items.length) {
      trayEl.hidden = true;
      trayEl.replaceChildren();
      return;
    }
    trayEl.hidden = false;
    const chips = items.map((entry) => {
      const b = button2(`made${entry.item === placing ? ' on' : ''}`, null, '', () => onPlace(entry.item));
      b.dataset.item = entry.item;
      b.setAttribute('aria-label', `Place ${entry.name}`);
      b.append(iconEl(entry.item, 34), node('b', 'n', String(entry.count)));
      return b;
    });
    trayEl.replaceChildren(...chips);
  }

  return { show, tray, hide: close, stats, get isOpen() { return open; } };
}
