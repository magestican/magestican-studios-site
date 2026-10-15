










import { faceOf } from './cards.js';






export function spriteStyle(atlas, id, { width, dpr = 1, base = '' } = {}) {
  if (!atlas || !atlas.cards) return null;
  const face = id === 'back' ? 'back' : faceOf(id);
  const at = atlas.cards[face];
  if (!at) return null;
  const [cw, ch] = atlas.cell;
  const w = width || cw;
  const k = w / cw;
  const h = Math.round(ch * k * 100) / 100;
  const cols = atlas.cols;
  const rows = Math.ceil(Object.keys(atlas.cards).length / cols);
  const use2x = dpr * k > 1.05 && (atlas.scales || []).includes(2);
  const file = use2x ? 'deck@2x.webp' : 'deck.webp';
  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    width: `${r2(w)}px`,
    height: `${h}px`,
    backgroundImage: `url("${base}${file}")`,
    backgroundSize: `${r2(cols * cw * k)}px ${r2(rows * ch * k)}px`,
    backgroundPosition: `${r2(-at[0] * k)}px ${r2(-at[1] * k)}px`,
    backgroundRepeat: 'no-repeat',
  };
}


export const cardHeight = (atlas, width) => Math.round((atlas.cell[1] / atlas.cell[0]) * width * 100) / 100;


export async function loadAtlas(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`card atlas ${url}: HTTP ${res.status}`);
  const atlas = await res.json();
  atlas.base = url.slice(0, url.lastIndexOf('/') + 1);
  return atlas;
}





export function makeCard(doc, atlas, id, { width, label = '', faceDown = false, onClick, className = 'card' } = {}) {
  const el = doc.createElement(onClick ? 'button' : 'div');
  el.className = className;
  if (onClick) { el.type = 'button'; el.addEventListener('click', onClick); }
  const st = spriteStyle(atlas, faceDown ? 'back' : id, {
    width, dpr: (doc.defaultView && doc.defaultView.devicePixelRatio) || 1, base: atlas.base || '',
  });
  if (st) Object.assign(el.style, st);
  el.dataset.card = faceDown ? 'back' : faceOf(id);
  if (label) { el.setAttribute('aria-label', label); el.title = label; }
  else if (!onClick) el.setAttribute('aria-hidden', 'true');
  return el;
}
