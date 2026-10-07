






import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import * as hollowroot from './hollowroot.js';
import { fenceGuards, clearOfLanes } from '../functional.js';

export const ID = 'thornfield';
export const SIZE = 80;
const WT = ['Leaf', 'Spirit', 'Beast']; 
export const SECTIONS = addSections([
  { id: 'thorn-upper', name: 'Thornfield — The Old Garden', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 3, wildTypes: WT },
  { id: 'thorn-lower', name: 'Thornfield — The Wild Meadow', rect: { u: [-18, 18], v: [54, 82] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 3, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };


export const EDGES = [42, 54, 66];
export const RAMP_U = [10, -10, 10];
export const TERRACE_H = [1.7, 1.2, 0.7, 0.15];
const RAMP_HALF = 1.8;
export const ENTRY = at(-12.0, 31.0);       
export const SPRING = at(0.6, 76.0);        
export const LANDING = at(-0.8, 74.6);      

export const PATH = [[-12.0, 31.0], [-4.0, 34.6], [6.0, 37.4], [10.0, 40.0], [10.0, 44.0], [2.0, 47.6], [-8.0, 50.6], [-10.0, 53.0],
  [-10.0, 57.0], [-2.0, 59.6], [7.0, 62.6], [10.0, 64.4], [10.0, 68.0], [4.0, 71.6], [0.6, 74.4]];

export const terraceOf = (v) => EDGES.filter((e) => v >= e).length;
const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const nearRamp = (u, v) => EDGES.findIndex((e, k) => Math.abs(v - e) < 2.4 && Math.abs(u - RAMP_U[k]) < RAMP_HALF);
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), k = nearRamp(u, v);
  
  if (k >= 0) { const t = U.clamp((v - EDGES[k] + 2.4) / 4.8, 0, 1); return TERRACE_H[k] + (TERRACE_H[k + 1] - TERRACE_H[k]) * t * t * (3 - 2 * t); }
  return TERRACE_H[terraceOf(v)] + U.fbm(x * 0.15, y * 0.15, 401) * 0.08;
}

export const bedAt = (u, v) => {
  const k = terraceOf(v); if (k > 1) return false;
  const top = k === 0 ? 30 : EDGES[k - 1], row = (v - top - 2.6) / 3.6, f = row - Math.round(row);
  if (row < -0.3 || row > 2.3 || Math.abs(f) > 0.17) return false;
  return Math.abs(((u + 18) % 7.2) - 3.6) < 2.6; 
};
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v) && !(Math.abs(v - 54) < 2.6 && Math.abs(u - RAMP_U[1]) < RAMP_HALF)) return T.CLIFF; 
  const k = nearRamp(u, v);
  if (k < 0 && EDGES.some((e) => Math.abs(v - e) < 0.6)) return T.CLIFF; 
  if (k >= 0) return T.GLADE;
  const t = terraceOf(v);
  if (t <= 1) return bedAt(u, v) ? T.THICKET : U.fbm(x * 0.3, y * 0.3, 403) > 0.62 ? T.MOSS : T.GLADE; 
  
  const wild = U.fbm(x * 0.14, y * 0.14, 405) + (t === 3 ? 0.08 : 0);
  if (Math.hypot(x - SPRING.x, y - SPRING.y) < 3.4) return T.GLADE;
  return wild > 0.55 ? T.THICKET : wild > 0.42 ? T.GRASS : T.GLADE;
}

export function generateThornfield() { const it = thornfieldSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* thornfieldSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const lane = { pts: PATH.map(([u, v]) => fromUV(u, v)), half: 0.55 };
  carvePath(W, W.type, lane.pts.map(([x, y]) => [x, y]));
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.GLADE;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: lane.pts.map((p) => [...p]), half: lane.half }];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad);
  const pathD = (x, y) => lane.pts.reduce((m, p, k) => (k ? Math.min(m, segDist(lane.pts[k - 1], p, x, y)) : m), Infinity);
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  EDGES.forEach((e, k) => { for (const side of [-1, 1]) { const q = at(RAMP_U[k] + side * 1.7, e - 2.9), p = clearOfLanes(W.paths, q.x, q.y, 0.3); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.3, s: 0.8 + (side > 0 ? 0.15 : 0), rot: side, v: (k + (side > 0 ? 1 : 0)) % 3 }); } });
  
  for (const side of [-1, 1]) { const p = at(-13.0, 31.0 + side * 1.2); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.35, s: 1.1, rot: side * 1.3, v: side > 0 ? 1 : 2, flavor: 'moss' }); }
  
  
  
  const FLOWERS = ['#ff9ec8', '#ffe27a', '#b890ff', '#ff8a6a'];
  for (let k = 0; k <= 1; k++) for (let row = 0; row <= 2; row++) {
    const vc = (k === 0 ? 30 : EDGES[k - 1]) + 2.6 + row * 3.6;
    for (let n = 0; n < 5; n++) {
      const uc = -18 + 7.2 * n + 3.6; if (!bedAt(uc, vc)) continue;
      let i = 0; for (let u = uc - 2.3; u <= uc + 2.3; u += 0.75, i++) {
        const p = at(u, vc); if (!bedAt(u, vc) || pathD(p.x, p.y) < 1.0) continue;
        addObj(W, i % 2 ? { kind: 'flower', x: p.x, y: p.y, solid: 0, c: FLOWERS[(n + row) % 4] } : { kind: 'bramble', x: p.x, y: p.y, solid: 0, s: 0.42, rot: 0.6 });
      }
      for (const side of [-1, 1]) { let m = 0; for (let u = uc - 2.4; u <= uc + 2.4; u += 0.8) {
        const p = at(u, vc + side * 0.8); if (pathD(p.x, p.y) < 1.0) continue;
        if (!fenceGuards(W, { kind: 'fence', x: p.x, y: p.y, job: 'bed' })) continue; 
        addObj(W, { kind: 'fence', x: p.x, y: p.y, solid: 0, ring: `bed-${k}-${row}-${n}-${side}`, k: m++, n: 0, job: 'bed' });
      } }
    }
  }
  yield 'buildings';
  const r = U.rng(4141);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { const [, v] = toUV(x, y); if (EDGES.some((e) => Math.abs(v - e) < 0.7) && k < 0.12) addObj(W, { kind: 'bramble', x, y, solid: 0, s: 0.45 + s * 0.3, rot }); continue; }
    const pd = pathD(x, y);
    if (pd < 1.0 || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 2.2) continue;
    const [, v] = toUV(x, y), wild = terraceOf(v) >= 2;
    if (t === T.THICKET && !wild) continue; 
    if (t === T.THICKET) { if (k < (wild ? 0.2 : 0.13)) addObj(W, { kind: 'bramble', x, y, solid: 0, s: (wild ? 0.6 : 0.45) + s * 0.35, rot }); else if (!wild && k < 0.2) addObj(W, { kind: 'flower', x, y, solid: 0, c: FLOWERS[Math.floor(s * 4)] }); continue; }
    if (wild && t === T.GLADE && k < 0.03 && pd > 2.4) addObj(W, { kind: 'jtree', x, y, solid: 0.45, s: 1 + s * 0.4, rot, flavor: 'verdant' });
    else if (k < (wild ? 0.05 : 0.03)) addObj(W, { kind: 'flower', x, y, solid: 0, c: FLOWERS[Math.floor(s * 4)] });
    else if (k < 0.11) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.35 + s * 0.35, rot, flavor: 'moss' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.THICKET && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(4242);
  for (let t = 0; W.spots.length < 5 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || pathD(x, y) < 1.2) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6) || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 3) continue;
    W.spots.push({ id: 'tf' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}


export const MANIFEST = {
  order: 10,
  
  
  region: {
    id: ID, name: 'Thornfield', chapters: [3], size: SIZE, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: ENTRY,
    pack: null,
    transit: false, objective: 'Follow the garden path down the terraces to the meadow pool',
  },
  generate: generateThornfield, steps: thornfieldSteps,
  doors: [
    { id: 'thorn-in', region: hollowroot.ID, at: hollowroot.SLIDE, to: ID, toAt: ENTRY, label: 'Ride the rope slide', after: null },
    { id: 'thorn-out', region: ID, at: ENTRY, to: hollowroot.ID, toAt: hollowroot.SLIDE_BACK, label: 'Climb back up', after: null },
  ],
  perches: [
    
    { id: 'thornfield', region: ID, name: 'Meadow Pool', at: LANDING, opens: 'boss_leviathrum', respawn: null },
  ],
  place: { name: 'Thornfield', at: [0.1, 0.78], r: 0.06, glyph: 'meadow' },
  kind: 'forest',
  ground: { 'thorn-upper': 'verdant', 'thorn-lower': 'verdant' },
  ambience: { 'thorn-upper': { bugs: 0.6, birds: 0.5, wind: 0.3 }, 'thorn-lower': { bugs: 0.8, wind: 0.4, birds: 0.3 } },
  beats: {
    'thorn-upper': [
      ['narr', 'The rope slide hisses, the leaves whip past - and you land in a garden. Or what used to be one.'],
      ['narr', 'Long beds run along every terrace, planted in neat rows. Thorns have climbed over all of them.'],
      ['kid', 'Somebody used a ruler on this. My mom does the shelves at the store like that. You do NOT touch her shelves.'],
    ],
    'thorn-lower': [
      ['narr', 'Down here the rows give up. The garden has run wild, and the thorns grow as tall as you.'],
    ],
  },
};
