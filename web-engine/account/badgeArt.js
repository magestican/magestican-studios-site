













































import { TIER_COLOUR, PROOF } from './achievements.js';
import { hasGlyph, glyphNameFor, glyphGroup } from '../brand/glyphs.js';
import { TOKENS } from '../brand/tokens.js';


export const LOCKED_COLOUR = TOKENS.colour.locked;
export const LOCKED_INK = '#7b8494';














export const SHIELD_PATH =
  'M32 3 L58 12 L58 34 C58 48 46 57 32 61 C18 57 6 48 6 34 L6 12 Z';

























export const TIER_SHAPE = Object.freeze({
  common: 'coin', uncommon: 'shield', rare: 'star', legendary: 'laurel',
});

const COIN_PATH = 'M32 5a27 27 0 1 1 0 54a27 27 0 1 1 0-54z';
const MEDAL_PATH = 'M32 11a20 20 0 1 1 0 40a20 20 0 1 1 0-40z';


function starPath(points, outer, inner, cx = 32, cy = 32) {
  const pts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const a = (Math.PI / points) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
export const STAR_PATH = starPath(8, 30, 23.5);






export function laurelSvg({ fill, stroke, strokeWidth = 1.2, radius = 25, cx = 32, cy = 32, leaves = 7 } = {}) {
  const parts = [];
  
  const pt = (deg, r = radius) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [lx0, ly0] = pt(100); const [lx1, ly1] = pt(235);
  const [rx0, ry0] = pt(80); const [rx1, ry1] = pt(-55);
  parts.push(`<path d="M${lx0.toFixed(2)} ${ly0.toFixed(2)} A${radius} ${radius} 0 0 1 ${lx1.toFixed(2)} ${ly1.toFixed(2)}`
    + `M${rx0.toFixed(2)} ${ry0.toFixed(2)} A${radius} ${radius} 0 0 0 ${rx1.toFixed(2)} ${ry1.toFixed(2)}" `
    + `fill="none" stroke="${stroke}" stroke-width="${strokeWidth * 1.4}" stroke-linecap="round"/>`);
  const step = (235 - 105) / (leaves - 1);
  for (let i = 0; i < leaves; i += 1) {
    for (const side of [-1, 1]) {
      
      const deg = side < 0 ? 105 + step * i : 75 - step * i;
      const [x, y] = pt(deg, radius + 1);
      
      const rot = side < 0 ? deg + 90 + 25 : deg - 90 - 25;
      parts.push(`<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="5.6" ry="2.5" `
        + `transform="rotate(${rot.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})" `
        + `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`);
    }
  }
  
  
  parts.push(`<path d="M${cx - 2} ${cy + 22} L${cx - 9} ${cy + 29.5} L${cx - 5} ${cy + 28.5} L${cx - 3} ${cy + 31.5} L${cx + 3} ${cy + 24} Z`
    + `M${cx + 2} ${cy + 22} L${cx + 9} ${cy + 29.5} L${cx + 5} ${cy + 28.5} L${cx + 3} ${cy + 31.5} L${cx - 3} ${cy + 24} Z" `
    + `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`);
  return parts.join('');
}










export function badgeSvg(row, { size = 44, glyph = null } = {}) {
  const r = row && typeof row === 'object' ? row : {};
  const unlocked = !!r.unlocked;
  const tierName = TIER_COLOUR[r.tier] ? r.tier : 'common';
  const tier = TIER_COLOUR[tierName];
  const shape = TIER_SHAPE[tierName];
  const face = unlocked ? tier : 'none';
  const edge = unlocked ? tier : LOCKED_COLOUR;
  const ink = unlocked ? '#101418' : LOCKED_INK;
  const glyphName = hasGlyph(glyph) ? glyph : glyphNameFor(r);
  const px = Math.max(16, Math.round(Number(size) || 44));
  const verified = r.proof === PROOF.VERIFIED && unlocked;

  
  
  
  
  const rule = (d, k) => (unlocked
    ? `<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round" `
      + `transform="translate(32 32) scale(${k}) translate(-32 -32)" opacity="0.35"/>`
    : '');
  let plate;
  let glyphBox;
  let glyphCy = 32;
  if (shape === 'coin') {
    plate = `<path d="${COIN_PATH}" fill="${face}" stroke="${edge}" stroke-width="3"/>` + rule(COIN_PATH, 0.8);
    glyphBox = 30;
  } else if (shape === 'shield') {
    plate = `<path d="${SHIELD_PATH}" fill="${face}" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>`
      + rule(SHIELD_PATH, 0.82);
    glyphBox = 30; glyphCy = 30;
  } else if (shape === 'star') {
    plate = `<path d="${STAR_PATH}" fill="${face}" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>`
      + (unlocked
        ? `<circle cx="32" cy="32" r="18.5" fill="none" stroke="${ink}" stroke-width="1.5" opacity="0.35"/>`
        : '');
    glyphBox = 27;
  } else {
    
    plate = `<path d="${MEDAL_PATH}" fill="${face}" stroke="${edge}" stroke-width="3"/>`
      + rule(MEDAL_PATH, 0.82)
      + laurelSvg({ fill: unlocked ? tier : 'none', stroke: unlocked ? '#5a3d07' : LOCKED_COLOUR, strokeWidth: unlocked ? 1 : 1.6 });
    glyphBox = 24; glyphCy = 31;
  }

  
  
  
  return [
    `<svg class="badge-art" data-shape="${shape}" width="${px}" height="${px}" viewBox="0 0 64 64" `
      + 'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">',
    plate,
    
    
    glyphGroup(glyphName, { cx: 32, cy: glyphCy, box: glyphBox, ink, opacity: unlocked ? null : '0.4' }),
    verified
      ? '<g transform="translate(46 46)">'
        + '<circle r="12" fill="#0f1216" stroke="#5fd08a" stroke-width="2.5"/>'
        + '<path d="M-5 0 L-1.5 4 L5.5 -4" fill="none" stroke="#5fd08a" '
        + 'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        + '</g>'
      : '',
    '</svg>',
  ].join('');
}







export function verifiedTickSvg({ size = 14, colour = '#5fd08a' } = {}) {
  const px = Math.max(8, Math.round(Number(size) || 14));
  return `<svg width="${px}" height="${px}" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" `
    + 'aria-hidden="true" focusable="false">'
    + `<circle cx="8" cy="8" r="7" fill="none" stroke="${colour}" stroke-width="1.6"/>`
    + `<path d="M4.6 8.2 L7 10.6 L11.4 5.6" fill="none" stroke="${colour}" stroke-width="2" `
    + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';
}







export function progressArcSvg(fraction, { size = 44, colour = '#59a6ff' } = {}) {
  const f = Math.max(0, Math.min(1, Number(fraction) || 0));
  if (f < 0.05) return '';
  const px = Math.max(16, Math.round(Number(size) || 44));
  const r = 29;
  const c = 2 * Math.PI * r;
  return `<svg class="badge-arc" width="${px}" height="${px}" viewBox="0 0 64 64" `
    + 'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${colour}" stroke-width="2.5" `
    + `stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" `
    + 'transform="rotate(-90 32 32)" opacity="0.85"/></svg>';
}
