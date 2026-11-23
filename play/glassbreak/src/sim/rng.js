







export function mix32(h) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}


export function hash32(seed, a = 0, b = 0, c = 0) {
  let h = mix32((seed | 0) ^ 0x9e3779b9);
  h = mix32(h ^ Math.imul(a | 0, 0x27d4eb2d));
  h = mix32(h ^ Math.imul(b | 0, 0x165667b1));
  return mix32(h ^ Math.imul(c | 0, 0x61c88647));
}


export function next(state) {
  const s = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [s, (t ^ (t >>> 14)) >>> 0];
}


export const below = (u, n) => u % n;
