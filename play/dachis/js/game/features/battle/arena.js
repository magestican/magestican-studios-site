








import { toUV, fromUV, SIN_E } from '../world/sections.js';

export const ARENA_MAX = 8.5, ARENA_MIN = 4.2;   
export const FIGHTER_H = 1.5;        

export const bandsFor = aspect => (aspect >= 1 ? { top: 0.13, bottom: 0.18, side: 0.8 } : { top: 0.11, bottom: 0.3, side: 0.4 });


export function maxBattleVh(win, zoom, aspect) {
  const bw = win.u[1] - win.u[0], bh = win.s[1] - win.s[0];
  return Math.min(bh, bw / aspect, (aspect >= 1 ? zoom : zoom / aspect) * 1.5);
}


export function arenaRadii(maxVh, aspect, bands = bandsFor(aspect)) {
  const hs = maxVh * (1 - bands.top - bands.bottom) - FIGHTER_H;
  const ws = maxVh * aspect - 2 * bands.side;
  const clamp = r => Math.max(ARENA_MIN, Math.min(ARENA_MAX, r));
  return { ru: clamp(ws / 2), rv: clamp(hs / (2 * SIN_E)) };
}



export function arenaCentre(px, py, wx, wy, ru, rv, edge = 0.78) {
  const [pu, pv] = toUV(px, py), [wu, wv] = toUV(wx, wy);
  let du = wu - pu, dv = wv - pv; const l = Math.hypot(du, dv) || 1; du /= l; dv /= l;
  
  const r = 1 / Math.hypot(du / ru, dv / rv);
  return fromUV(pu + du * r * edge, pv + dv * r * edge);
}


export function clampToArena(x, y, a, margin = 0.45) {
  const [u, v] = toUV(x, y), [cu, cv] = toUV(a.cx, a.cy);
  const du = u - cu, dv = v - cv, ru = Math.max(0.5, a.ru - margin), rv = Math.max(0.5, a.rv - margin);
  const q = Math.hypot(du / ru, dv / rv);
  if (q <= 1) return [x, y];
  return fromUV(cu + du / q, cv + dv / q);
}
export const inArena = (x, y, a, margin = 0) => {
  const [u, v] = toUV(x, y), [cu, cv] = toUV(a.cx, a.cy);
  return Math.hypot((u - cu) / (a.ru - margin), (v - cv) / (a.rv - margin)) <= 1;
};




export function frameView(points, aspect, minVh, maxVh, bands = bandsFor(aspect)) {
  let u0 = Infinity, u1 = -Infinity, s0 = Infinity, s1 = -Infinity;
  for (const p of points) { u0 = Math.min(u0, p.u); u1 = Math.max(u1, p.u); s0 = Math.min(s0, p.s); s1 = Math.max(s1, p.s); }
  const need = Math.max((s1 - s0) / (1 - bands.top - bands.bottom), (u1 - u0 + 2 * bands.side) / aspect);
  const vh = Math.max(minVh, Math.min(maxVh, need));
  return { u: (u0 + u1) / 2, s: (s0 + s1) / 2 - (bands.top - bands.bottom) / 2 * vh, vh };
}
