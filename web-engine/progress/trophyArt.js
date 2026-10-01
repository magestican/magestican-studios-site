




















import { TROPHIES, TROPHY_ARTS } from './trophies.js';
import { LOCKED_COLOUR, LOCKED_INK, laurelSvg } from '../account/badgeArt.js';


export const TROPHY_COLOUR = Object.freeze({
  cup: '#f2b33d',
  laurel: '#7cc76a',
  globe: '#59a6ff',
  pennant: '#ff6b5a',
});
const DARK = '#2a1d06';

const BY_ID = new Map(TROPHIES.map((t) => [t.id, t]));


export function trophyFamily(id) {
  const t = BY_ID.get(id);
  if (t && TROPHY_ARTS.includes(t.art)) return t.art;
  if (typeof id === 'string' && id.startsWith('season')) return 'pennant';
  return 'cup';
}


export function trophyLabel(id) {
  const s = typeof id === 'string' ? id : '';
  let m = s.match(/^level-(\d{1,3})$/);
  if (m) return m[1];
  m = s.match(/^elo-(\d{3,4})$/);
  if (m) return m[1];
  if (s === 'first-rated-win') return '1';
  m = s.match(/^season-(\d{1,4})$/);
  if (m) return m[1];
  return '';
}

const label = (text, { x = 32, y, sizePx, fill }) => (text
  ? `<text x="${x}" y="${y}" text-anchor="middle" font-size="${sizePx}" font-weight="700" fill="${fill}" `
    + `font-family="system-ui,Segoe UI,sans-serif">${text}</text>`
  : '');

function cup({ face, edge, ink, text }) {
  return `<path d="M12 14h-4c0 9 4 14 10 15M52 14h4c0 9-4 14-10 15" fill="none" stroke="${edge}" stroke-width="3.5" stroke-linecap="round"/>`
    + `<path d="M16 7h32v10c0 12-7 20-16 20S16 29 16 17z" fill="${face}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M28 37h8v9h-8z" fill="${face}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M21 46h22v5H21zM16 51h32v7H16z" fill="${face}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>`
    + label(text, { y: 25, sizePx: text.length > 1 ? 13 : 15, fill: ink });
}

function laurel({ face, edge, ink, text, unlocked }) {
  return laurelSvg({ fill: face, stroke: unlocked ? DARK : edge, strokeWidth: unlocked ? 1 : 1.6, radius: 24, cy: 29 })
    + `<path d="M32 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L32 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="${face}" stroke="${unlocked ? DARK : edge}" stroke-width="1.2" stroke-linejoin="round"/>`
    
    
    
    + `<path d="M32 15a14 14 0 1 1 0 28a14 14 0 1 1 0-28z" fill="${face}" stroke="${unlocked ? DARK : edge}" stroke-width="2"/>`
    + label(text, { y: text.length > 2 ? 32.5 : 35, sizePx: text.length > 2 ? 10 : 16, fill: ink });
}

function globe({ face, edge, ink }) {
  return `<path d="M32 6a18 18 0 1 1 0 36a18 18 0 1 1 0-36z" fill="${face}" stroke="${edge}" stroke-width="2.5"/>`
    + `<path d="M14 24h36M17 15h30M17 33h30M32 6c-8 9-8 27 0 36M32 6c8 9 8 27 0 36M32 6v36" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M10 24a22 22 0 0 0 44 0" fill="none" stroke="${edge}" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M29 46h6v6h-6zM20 52h24v6H20z" fill="${face}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>`;
}

function pennant({ face, edge, ink, text }) {
  return `<path d="M14 5v54" fill="none" stroke="${edge}" stroke-width="3.5" stroke-linecap="round"/>`
    + `<circle cx="14" cy="4.5" r="3" fill="${edge}"/>`
    + `<path d="M16 9L56 21 16 33z" fill="${face}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M8 59h14" fill="none" stroke="${edge}" stroke-width="3.5" stroke-linecap="round"/>`
    + label(text, { x: 29, y: 26, sizePx: text.length > 2 ? 9 : 12, fill: ink });
}

const DRAW = { cup, laurel, globe, pennant };





export function trophySvg(row, { size = 64 } = {}) {
  const r = row && typeof row === 'object' ? row : {};
  const unlocked = !!r.unlocked;
  const family = trophyFamily(r.id);
  const hue = TROPHY_COLOUR[family];
  const px = Math.max(16, Math.round(Number(size) || 64));
  const body = DRAW[family]({
    face: unlocked ? hue : 'none',
    edge: unlocked ? DARK : LOCKED_COLOUR,
    ink: unlocked ? DARK : LOCKED_INK,
    text: trophyLabel(r.id),
    unlocked,
  });
  return `<svg class="trophy-art" data-family="${family}" width="${px}" height="${px}" viewBox="0 0 64 64" `
    + 'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + body + '</svg>';
}
