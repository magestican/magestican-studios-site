
























import { kartBoardModel } from 'arbelo/kartLeaderboard';

function el(doc, tag, cls, text) {
  const node = doc.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = String(text);
  return node;
}









export function renderKartBoard(root, opts) {
  if (!root) return;
  const doc = root.ownerDocument;
  const model = kartBoardModel(opts);
  root.textContent = '';

  const head = el(doc, 'div', 'fkb-head');
  head.appendChild(el(doc, 'span', 'fkb-title', model.title));
  
  
  head.appendChild(el(doc, 'span', `fkb-badge fkb-${model.scope}`, model.badge));
  root.appendChild(head);

  
  
  root.appendChild(el(doc, 'div', 'fkb-device',
    `${model.device.races} race${model.device.races === 1 ? '' : 's'} `
    + `and ${model.device.wins} win${model.device.wins === 1 ? '' : 's'} in this browser`));

  if (model.pending) {
    root.appendChild(el(doc, 'div', 'fkb-note', 'Loading the board...'));
    return;
  }

  if (model.rows.length) {
    const list = el(doc, 'ol', 'fkb-rows');
    for (const row of model.rows) {
      const li = el(doc, 'li', row.isMe ? 'me' : null);
      li.appendChild(el(doc, 'span', 'fkb-rank', row.rank));
      const glyph = el(doc, 'span', 'fkb-glyph', row.glyph);
      
      
      
      glyph.setAttribute('role', 'img');
      glyph.setAttribute('aria-label', row.characterName);
      li.appendChild(glyph);
      li.appendChild(el(doc, 'span', 'fkb-name', row.name));
      li.appendChild(el(doc, 'span', 'fkb-wins', row.wins));
      list.appendChild(li);
    }
    root.appendChild(list);
  }

  root.appendChild(el(doc, 'p', 'fkb-note', model.note));
}
