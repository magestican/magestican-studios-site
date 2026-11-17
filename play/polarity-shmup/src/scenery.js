

















import { FIELD_H, FIELD_W, TILE_PX } from './field.js';


export const BAND_EVERY = 6, BAND_ROW = 2;

export const LIGHT_GAP = 26, CHASE_HZ = 9, CHASE_LEN = 3;

export const PARALLAX = 1.45;

const BAND_X0 = -FIELD_W / 2 + TILE_PX, BAND_X1 = BAND_X0 + 2 * TILE_PX; 


const rowTopZ = (row, scrollPx) => FIELD_H / 2 - TILE_PX * (row + 1) + scrollPx;


export function bandsOnScreen(scrollPx) {
  const out = [];
  const first = Math.floor((scrollPx - TILE_PX) / TILE_PX / BAND_EVERY) - 1;
  for (let m = first; m < first + 4; m++) {
    const row = m * BAND_EVERY + BAND_ROW;
    const z0 = rowTopZ(row + 1, scrollPx), z1 = rowTopZ(row - 1, scrollPx);
    if (z1 < -FIELD_H / 2 - 40 || z0 > FIELD_H / 2 + 40) continue;
    out.push({ m, z0, z1 });
  }
  return out;
}





export function runwayLights(scrollPx, t) {
  const out = [];
  for (const { m, z0, z1 } of bandsOnScreen(scrollPx)) {
    const pol = ((m % 2) + 2) % 2;
    const n = Math.floor((z1 - z0) / LIGHT_GAP);  
    const head = (t * CHASE_HZ + m * 5) % (n + CHASE_LEN * 2);
    for (let i = 0; i < n; i++) {
      const z = z1 - LIGHT_GAP / 2 - i * LIGHT_GAP; 
      const d = head - i;
      const lit = d >= 0 && d < CHASE_LEN ? 1 - d / CHASE_LEN : 0;
      
      const a = 0.5 + 0.5 * lit, size = 20 + 16 * lit;
      out.push([BAND_X0 + 6, z, pol, size, a], [BAND_X1 - 6, z, pol, size, a]);
      if (i % 2 === 0) out.push([(BAND_X0 + BAND_X1) / 2, z, pol, 10 + 10 * lit, 0.3 + 0.7 * lit]);
    }
  }
  return out;
}






export function propLayout(stage, count = 14) {
  let seed = 1729 + stage * 97;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296); 
  const out = [];
  for (let k = 0; k < count; k++) {
    const m = Math.floor(k / 3), slot = k % 3;
    const bandZ = FIELD_H / 2 - TILE_PX * (m * BAND_EVERY + BAND_ROW + 1); 
    
    const x = slot === 2 ? -20 + rnd() * 160 : -FIELD_W / 2 + 30 + rnd() * 50;
    const z0 = bandZ + (slot === 0 ? -TILE_PX * 0.6 : slot === 1 ? TILE_PX * 0.6 : (rnd() < 0.5 ? -1 : 1) * TILE_PX * 1.6);
    out.push({ x, z0, model: k, rot: Math.floor(rnd() * 4) });
  }
  return out;
}

export const propSpan = (count = 14) => Math.ceil(count / 3) * BAND_EVERY * TILE_PX;


export function highLayout(stage, count = 4) {
  let seed = 4099 + stage * 31;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const out = [];
  for (let k = 0; k < count; k++) {
    const side = k % 2 ? 1 : -1;
    out.push({ x: side * (FIELD_W / 2 - 18 - rnd() * 24), z0: -k * 420 - rnd() * 120, model: k, rot: Math.floor(rnd() * 4) });
  }
  return out;
}
export const HIGH_SPAN = 4 * 420 + 300;
