








import { toUV, fromUV, SIN_E, COS_E } from '../world/sections.js';

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



export function arenaOverflow(cu, cs, ru, rv, win, maxVh, aspect, bands = bandsFor(aspect)) {
  const u0 = cu - ru - bands.side, u1 = cu + ru + bands.side;
  const s0 = cs - rv * SIN_E - FIGHTER_H - bands.top * maxVh, s1 = cs + rv * SIN_E + bands.bottom * maxVh;
  return Math.max(0, win.u[0] - u0) + Math.max(0, u1 - win.u[1]) + Math.max(0, win.s[0] - s0) + Math.max(0, s1 - win.s[1]);
}








export const PLACE = { reach: 9, step: 1, wOverflow: 6, wOpen: 4, wRoad: 0.6, wDist: 0.12 };
export function placeArena(map, sec, px, py, wx, wy, ru, rv, win, maxVh, aspect) {
  const [c0x, c0y] = arenaCentre(px, py, wx, wy, ru, rv);
  const [pu, pv] = toUV(px, py), score = (x, y) => {
    const [u, v] = toUV(x, y), cs = v * SIN_E - map.groundAt(x, y) * COS_E;
    const over = arenaOverflow(u, cs, ru, rv, win, maxVh, aspect);
    let ok = 0, n = 0;
    for (const k of [0.45, 0.85]) for (let a = 0; a < 12; a++) {
      const [sx, sy] = fromUV(u + Math.cos(a * 0.5236) * ru * k, v + Math.sin(a * 0.5236) * rv * k);
      n++; if (map.walkable(sx, sy, 0.3) && map.sectionAt(sx, sy) === sec) ok++;
    }
    const open = ok / n;
    return { s: -over * PLACE.wOverflow + open * PLACE.wOpen + (map.road(x, y) ? PLACE.wRoad : 0) - Math.hypot(u - pu, v - pv) * PLACE.wDist, over, open };
  };
  let best = null;
  const consider = (x, y) => {
    if (!map.reachable(x, y) || !map.walkable(x, y, 0.3) || map.sectionAt(x, y) !== sec) return;
    const r = score(x, y);
    if (!best || r.s > best.s) best = { ...r, cx: x, cy: y };
  };
  consider(c0x, c0y);
  const R = PLACE.reach, st = PLACE.step;
  for (let du = -R; du <= R; du += st) for (let dv = -R; dv <= R; dv += st) { const [x, y] = fromUV(pu + du, pv + dv); consider(x, y); }
  if (!best) return { cx: c0x, cy: c0y, overflow: null, open: null };
  return { cx: best.cx, cy: best.cy, overflow: best.over, open: best.open };
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
