




import { toUV } from '../world/sections.js';
import { AMBUSH } from '../world/mapgen.js';


export const AMBUSH_GATE = { x: AMBUSH.x, y: AMBUSH.y, r: 2.4, line: toUV(AMBUSH.x, AMBUSH.y)[1] - 1 };


export function tripped(x, y, g) {
  if (Math.hypot(x - g.x, y - g.y) < g.r) return true;
  return toUV(x, y)[1] >= g.line;
}



export function burstFrom(x, y, g, from) {
  if (Math.hypot(x - g.x, y - g.y) < g.r + 1.5) return { x: from.x, y: from.y, staged: true };
  const [u, v] = toUV(x, y), du = u > 0 ? -3 : 3;
  const R2 = Math.SQRT1_2, nu = u + du, nv = v + 0.6;
  return { x: (nu + nv) * R2, y: (nv - nu) * R2, staged: false };
}
