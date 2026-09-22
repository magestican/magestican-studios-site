






















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

export function createShapeCard({ el: root, button: opener, onChoose = () => {}, onOpened = () => {} }) {
  let open = false;
  let last = null;
  const stats = { opens: 0, renders: 0, chosen: null };

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
      if (!open) return;
      stats.renders += 1;
      const head = el('div', 'head');
      const title = el('div', 'title');
      title.append(el('b', undefined, 'Shape the land'));
      head.append(title, button('close', '×', () => card.hide(), { aria: 'Close' }));

      const rows = el('div', 'parts');
      for (const b of s.brushes) {
        const row = el('div', 'part');
        const what = el('span', 'what');
        what.append(el('b', 'lab', b.label));
        if (b.hint) what.append(el('i', 'det', b.hint));
        const pick = button(b.on ? 'pick on' : 'pick', b.on ? 'In hand' : 'Take', () => {
          stats.chosen = b.kind;
          card.hide();
          onChoose(b.kind);
        }, { aria: `${b.label}: take this brush` });
        row.append(what, pick);
        rows.append(row);
      }
      const foot = el('div', 'why', s.note || '');
      const put = button('away', 'Put the tools away', () => {
        stats.chosen = null;
        card.hide();
        onChoose(null);
      });
      root.replaceChildren(head, rows, foot, put);
    },
  };

  opener.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); });
  card.hide();
  return card;
}
