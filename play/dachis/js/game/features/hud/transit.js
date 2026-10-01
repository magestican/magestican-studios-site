



import { SECTIONS, sectionById, fromUV } from '../world/sections.js';
import { VOLC, SHRINE } from '../world/mapgen.js';
import { nextLair } from '../world/lairs.js';


export const MINI = 190;
export const miniXY = (x, y) => [MINI / 2 + (x - y) * 1.4, 6 + (x + y - 34) * 1.4];


const SHORT = { kazan: 'KAZAN', slope: 'PATH', jungle: 'JUNGLE', road: 'ROAD', coast: 'COAST', shrine: 'SHRINE', coral: 'CORAL', verdant: 'GROVE' };
const centre = (s) => fromUV((s.rect.u[0] + s.rect.u[1]) / 2, (s.rect.v[0] + s.rect.v[1]) / 2);
const AT = { kazan: [VOLC.x, VOLC.y], shrine: [SHRINE.x, SHRINE.y] };
export const STATIONS = SECTIONS.map((s) => ({ id: s.id, short: SHORT[s.id] || s.id.toUpperCase(), xy: AT[s.id] || centre(s) }));
export const stationById = (id) => STATIONS.find((s) => s.id === id) || null;


export const LINES = [
  { id: 'red', color: '#ee352e', stops: ['kazan', 'slope', 'jungle', 'road', 'shrine'] },
  { id: 'blue', color: '#0039a6', stops: ['road', 'coast', 'coral'] },
  { id: 'green', color: '#00933c', stops: ['jungle', 'verdant'] },
];



export function visitedSet(flags = {}) {
  const v = new Set(['kazan', ...Object.keys(flags.seen || {})]);
  if (flags.starter || flags.initiated) for (const id of ['slope', 'jungle', 'road', 'shrine']) v.add(id);
  if (flags.boss_ashlo) v.add('coast');
  if (flags.boss_leviathrum) { v.add('coast'); v.add('coral'); }
  if (flags.boss_bramble) v.add('verdant');
  return v;
}



export function objectiveXY(flags = {}) {
  if (!flags.starter || !flags.initiated) return { sec: 'shrine', xy: AT.shrine };
  if (!flags.kumabo) return { sec: 'kazan', xy: AT.kazan };
  const l = nextLair(flags);
  return l ? { sec: l.sec, xy: fromUV(l.uv[0], l.uv[1]) } : null;
}


export function octi([ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, d = Math.min(Math.abs(dx), Math.abs(dy));
  const mid = [ax + Math.sign(dx) * d, ay + Math.sign(dy) * d];
  return [[ax, ay], mid, [bx, by]];
}



export function transitPlan(flags = {}) {
  const seen = visitedSet(flags);
  const px = (id) => miniXY(...stationById(id).xy);
  const segs = [];
  for (const L of LINES) for (let i = 1; i < L.stops.length; i++) {
    const a = L.stops[i - 1], b = L.stops[i];
    if (!sectionById(a) || !sectionById(b)) continue;
    segs.push({ line: L.id, color: L.color, a, b, open: seen.has(a) && seen.has(b), pts: octi(px(a), px(b)) });
  }
  const stations = STATIONS.map((s) => ({ ...s, px: px(s.id), visited: seen.has(s.id) }));
  const o = objectiveXY(flags);
  return { segs, stations, x: o ? { sec: o.sec, px: miniXY(...o.xy) } : null };
}
