












































import { TIER_COLOUR, PROOF } from './achievements.js';


export const LOCKED_COLOUR = '#4a5261';
export const LOCKED_INK = '#7b8494';




const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');








export const SHIELD_PATH =
  'M32 3 L58 12 L58 34 C58 48 46 57 32 61 C18 57 6 48 6 34 L6 12 Z';








export function badgeSvg(row, { size = 44 } = {}) {
  const r = row ?? {};
  const unlocked = !!r.unlocked;
  const tier = TIER_COLOUR[r.tier] ?? TIER_COLOUR.common;
  const face = unlocked ? tier : 'none';
  const edge = unlocked ? tier : LOCKED_COLOUR;
  const ink = unlocked ? '#101418' : LOCKED_INK;
  const glyph = esc(r.glyph ?? '?');
  const px = Math.max(16, Math.round(Number(size) || 44));
  const verified = r.proof === PROOF.VERIFIED && unlocked;

  
  
  
  return [
    `<svg class="badge-art" width="${px}" height="${px}" viewBox="0 0 64 64" `
      + 'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">',
    
    
    `<path d="${SHIELD_PATH}" fill="${face}" stroke="${edge}" stroke-width="3" `
      + 'stroke-linejoin="round"/>',
    
    
    unlocked
      ? `<path d="${SHIELD_PATH}" fill="none" stroke="${ink}" stroke-width="1.5" `
        + 'stroke-linejoin="round" transform="translate(32 32) scale(0.82) translate(-32 -32)" '
        + 'opacity="0.35"/>'
      : '',
    
    
    
    `<text x="32" y="40" text-anchor="middle" font-size="26" fill="${ink}" `
      + `font-family="system-ui,Segoe UI Symbol,sans-serif">${glyph}</text>`,
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
