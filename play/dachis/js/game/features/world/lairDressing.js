






import { U } from '../../../engine/core/util.js';
import { addObj } from './mapgen.js';
import { LAIRS } from './lairs.js';
import { fromUV, toUV } from './sections.js';
import { spreadAt, dryAt, freeAt } from './dressing.js';


export const LAIR_DRESS = {
  ashlo: [['hearth', 1], ['clapper', 1], ['offering', 3], ['feather', 1]],                 
  leviathrum: [['namestone', 3], ['broom', 2], ['sweepings', 5]],                           
  bramble: [['violets', 2], ['stump', 5], ['shears', 1]],                                   
  kingshade: [['floodpost', 2], ['spears', 3], ['redpool', 1], ['feather', 1]],              
  quartz: [['lampout', 1, { lit: true }], ['lampout', 6], ['redpool', 1]],                   
  glacius: [['moss', 6], ['feather', 1]],                                                   
};
export const TRACES = new Set(['feather', 'redpool']);

export const LAIR_KINDS = ['clapper', 'hearth', 'offering', 'broom', 'namestone', 'sweepings', 'stump', 'shears', 'violets', 'floodpost', 'spears', 'lampout', 'moss', 'feather', 'redpool'];
const SOLID = { namestone: 0.22, floodpost: 0.12, lampout: 0.18, hearth: 0.5, offering: 0.3, broom: 0.2, stump: 0.4 };
const FOOT = { hearth: 0.62, clapper: 0.4, offering: 0.4, broom: 0.4, namestone: 0.36, sweepings: 0.36, stump: 0.5, shears: 0.2, violets: 0.62,
  floodpost: 0.2, spears: 0.78, lampout: 0.22, moss: 0.3, feather: 0.36, redpool: 0.5 };
export const RING = [3.3, 5.6]; 


export function lairCentre(lair, regionId, HOME) {
  if ((lair.region || HOME) !== regionId) return null;
  
  
  const uv = (lair.dress && lair.dress.uv) || lair.uv, [x, y] = fromUV(uv[0], uv[1]);
  return { x, y };
}


export function dressLair(W, boss, c, { seed = 1, off = null } = {}) {
  const list = LAIR_DRESS[boss];
  if (!list || !c) return [];
  const rng = U.rng(9100 + seed), placed = [];
  const tries = [];
  for (let d = RING[0]; d <= RING[1]; d += 0.3) for (let k = 0; k < 28; k++) tries.push([d, (k + (d * 7) % 1) / 28 * Math.PI * 2]);
  
  for (let i = tries.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tries[i], tries[j]] = [tries[j], tries[i]]; }
  const inOff = (x, y) => !!off && off.some((R) => { const [u, v] = toUV(x, y); return u >= R.u[0] && u <= R.u[1] && v >= R.v[0] && v <= R.v[1]; });
  const ok = (x, y, r, flat) => !inOff(x, y) && spreadAt(W, x, y, Math.max(r, 0.1)) < flat && dryAt(W, x, y, r) && freeAt(W, x, y, r)
    && placed.every((o) => Math.hypot(o.x - x, o.y - y) > (FOOT[o.kind] || 0.3) + r + 0.15);
  for (const [kind, n, extra = {}] of list) for (let m = 0; m < n; m++) {
    const r = FOOT[kind] || 0.3;
    let at = null;
    for (const flat of [0.1, 0.22]) { at = tries.find(([d, a]) => ok(c.x + Math.sin(a) * d, c.y + Math.cos(a) * d, r, flat)); if (at) break; }
    if (!at) continue;
    const [d, a] = at, o = { kind, x: c.x + Math.sin(a) * d, y: c.y + Math.cos(a) * d, solid: SOLID[kind] || 0, rot: rng() * 6.28, lair: boss, ...extra };
    if (kind === 'stump') o.s = 0.8 + rng() * 0.5;
    addObj(W, o);
    placed.push(o);
  }
  return placed;
}


export function dressLairs(W, regionId, HOME) {
  let n = 0;
  LAIRS.forEach((l, i) => { n += dressLair(W, l.boss, lairCentre(l, regionId, HOME), { seed: i + 1, off: l.dress && l.dress.off }).length; });
  return n;
}
