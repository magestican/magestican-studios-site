
















import { boardLine, boardWithMe, isStale, normaliseName } from 'moon/play/leaderboard.mjs';
import { worthText } from 'moon/economy/netWorth.mjs';


const PARTS = Object.freeze([
  ['coins', 'Coins'],
  ['pockets', 'In your pockets'],
  ['land', 'Land'],
  ['buildings', 'Buildings'],
  ['made', 'Made, not yet placed'],
  ['placed', 'Put down'],
  ['trees', 'Planted trees'],
]);

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
};

function button(className, label, fn, { aria = null } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
}

export function createBoardCard({
  el: root, button: opener, onName = () => {}, onOpened = () => {}, onShare = null,
}) {
  let open = false;
  let last = null;
  const stats = { opens: 0, renders: 0, names: 0, shares: 0 };

  
  
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('pointerup', (e) => e.stopPropagation());

  const card = {
    get isOpen() { return open; },
    stats,
    show() {
      if (open) return;
      open = true;
      stats.opens += 1;
      root.hidden = false;
      onOpened();
      if (last) card.render(last);
    },
    hide() { open = false; root.hidden = true; },
    toggle() { if (open) card.hide(); else card.show(); },

    








    render(s) {
      last = s;
      opener.hidden = false;
      
      
      
      opener.textContent = s.mine && s.mine.worth > 0 ? worthText(s.mine.worth) : 'Worth';
      if (!open) return;
      stats.renders += 1;

      const parts = [];
      const head = el('div', 'head');
      const title = el('div', 'title');
      title.append(el('b', null, 'What your farm is worth'));
      head.append(title);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (onShare) {
        head.append(button('share', 'Share', () => { stats.shares += 1; onShare('worth'); },
          { aria: 'Share what your farm is worth' }));
      }
      head.append(button('close', '×', () => card.hide(), { aria: 'Close' }));
      parts.push(head);

      
      
      
      const total = el('div', 'total');
      total.append(el('b', null, worthText(s.worth.total)));
      total.append(el('span', 'day', s.mine.day === 1 ? 'on day 1' : `on day ${s.mine.day}`));
      parts.push(total);
      if (s.best > s.worth.total) {
        parts.push(el('div', 'best', `Your best so far: ${worthText(s.best)}`));
      }

      
      
      const table = el('div', 'parts');
      for (const [key, label] of PARTS) {
        if (!s.worth[key]) continue;
        const line = el('div', 'part');
        line.append(el('span', 'what', label), el('span', 'much', worthText(s.worth[key])));
        table.append(line);
      }
      if (!table.childElementCount) {
        table.append(el('div', 'why', 'Nothing yet - sell some fruit and it will show up here.'));
      }
      parts.push(table);

      
      
      const nameRow = el('div', 'namerow');
      const input = el('input', 'name-in');
      input.type = 'text';
      input.maxLength = 16;
      input.value = s.mine.name;
      input.setAttribute('aria-label', 'The name you appear under');
      input.addEventListener('pointerdown', (e) => e.stopPropagation());
      input.addEventListener('keydown', (e) => e.stopPropagation());
      input.addEventListener('change', () => {
        const name = normaliseName(input.value);
        input.value = name || s.mine.name;
        if (name) { stats.names += 1; onName(name); }
      });
      nameRow.append(el('span', 'what', 'You appear as'), input);
      parts.push(nameRow);

      
      if (!s.global) {
        parts.push(el('div', 'why', 'The global board is not running yet - this is your own farm, kept on this device.'));
      } else {
        const rows = boardWithMe(s.rows, s.mine);
        parts.push(el('div', 'sub', rows.length ? 'Best farms' : 'Nobody has published a farm yet.'));
        for (const r of rows) {
          const line = el('div', `row${r.me ? ' me' : ''}${isStale(r, s.now) ? ' stale' : ''}`, boardLine(r));
          parts.push(line);
        }
      }
      root.replaceChildren(...parts.filter(Boolean));
    },
  };

  opener.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); });
  card.hide();
  return card;
}
