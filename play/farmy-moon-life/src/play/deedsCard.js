





















import { deedLines } from 'moon/play/deeds.mjs';

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

export function createDeedsCard({ el: root, button: opener, onOpened = () => {} }) {
  let open = false;
  let last = null;
  const stats = { opens: 0, renders: 0 };

  
  
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('pointerup', (e) => e.stopPropagation());

  const card = {
    get isOpen() { return open; },
    stats,
    
    get lines() { return last ? deedLines(last) : []; },
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
      
      
      
      if (!open) return;
      stats.renders += 1;

      const lines = deedLines(s);
      const parts = [];
      const head = el('div', 'head');
      const title = el('div', 'title');
      title.append(el('b', undefined, 'What you have done'));
      head.append(title, button('close', '×', () => card.hide(), { aria: 'Close' }));
      parts.push(head);

      const table = el('div', 'parts');
      for (const l of lines) {
        const row = el('div', 'part');
        const what = el('span', 'what');
        what.append(el('b', 'lab', l.label));
        
        
        
        if (l.detail) what.append(el('i', 'det', l.detail));
        row.append(what, el('span', 'much', l.text));
        table.append(row);
      }
      parts.push(table);
      root.replaceChildren(...parts);
    },
  };

  opener.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); });
  card.hide();
  return card;
}
