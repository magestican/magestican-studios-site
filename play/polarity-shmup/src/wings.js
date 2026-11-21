














import { FIELD_H, TILE_PX, groundOf } from './field.js';


export const WING_DIM = 0.45;

export const WING_BLUR_PX = 1.5;

export const WING_MIN_PX = 48;


export const wingsShown = (vw, fieldW) => vw - fieldW >= WING_MIN_PX * 2;






export const wingBrightness = (n) => Math.pow(groundOf(n).tint * WING_DIM, 1 / 2.2);


export const wingImage = (n) => `assets/${groundOf(n).dir}/tiles/${groundOf(n).base}.png`;







export function wingLayout({ left, top, fs, scrollPx }) {
  const size = TILE_PX * fs;
  const mod = (a, m) => ((a % m) + m) % m;
  const x = mod(left, size);
  const y = mod(top + mod(FIELD_H + scrollPx, TILE_PX) * fs, size);
  return { size, x, y };
}
