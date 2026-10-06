






import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid, HOME } from '../mapgen.js';

export const ID = 'drowned-temple';
export const SIZE = 80;
const WT = ['Tide', 'Frost', 'Metal'];
export const SECTIONS = addSections([
  { id: 'temple-porch', name: 'Drowned Temple - The Flooded Porch', rect: { u: [-12, 12], v: [30, 46] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 2, wildTypes: WT },
  { id: 'temple-nave', name: 'Drowned Temple - The Nave', rect: { u: [-12, 12], v: [46, 62] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 2, wildTypes: WT },
  { id: 'temple-sanctum', name: 'Drowned Temple - The Sanctum', rect: { u: [-12, 12], v: [62, 78] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 2, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };


export const AISLE = [[0, 32.2], [0.6, 38], [-0.4, 46], [0.4, 54], [-0.3, 62], [0, 70.6]].map(([u, v]) => fromUV(u, v));
export const ENTRY = at(0, 33.4);          
export const ALTAR = { ...at(0, 72.6), r: 2.2 }; 
export const POOL = at(4.2, 70.4);         
export const POOL_LANDING = at(3.0, 71.6);
const COLUMNS = [49.5, 53, 56.5, 60].flatMap((v) => [[-2.4, v], [2.4, v]]); 

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
export const BASE_H = 0.25;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), depth = Math.max(...SECTIONS.map((s) => edgeDepth(s.rect, u, v).depth));
  return BASE_H + U.fbm(x * 0.12, y * 0.12, 101) * 0.12 + Math.max(0, 2 - depth) * 0.6; 
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  const n = U.fbm(x * 0.16, y * 0.16, 103);
  if (v < 46 && n > 0.64 && Math.abs(u) > 1.6) return T.SHALLOW; 
  if (v >= 46 && v < 62 && Math.abs(u) > 5.0 && n > 0.45) return T.KELP; 
  if (v >= 62 && Math.hypot(...toUV(x, y).map((c, k) => c - [0, 72.6][k])) < 3.2) return T.REEF; 
  return T.RUIN;
}

export function generateDrownedTemple() { const it = drownedTempleSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* drownedTempleSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  carvePath(W, W.type, AISLE);
  
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.REEF;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: AISLE.map((p) => [...p]), half: 0.5 }];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8;
  
  COLUMNS.forEach(([u, v], k) => { const p = at(u, v); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.3, rot: k * 1.1, v: k % 3, s: 1.1 }); });
  { const p = at(0, 75.4); addObj(W, { kind: 'temple', x: p.x, y: p.y, solid: 1.9 * 0.7, rot: Math.PI / 4, s: 0.7, flavor: 'coral' }); }
  addObj(W, { kind: 'spring', x: POOL.x, y: POOL.y, solid: 0.8, heal: true });
  for (const [u, v] of [[-2.0, 70.4], [2.0, 70.4], [-1.6, 36], [1.6, 36]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  for (const v of [46, 62]) for (const side of [-1, 1]) { const p = at(side * 1.9, v); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.3, rot: side, v: 1, s: 1.25 }); }
  yield 'buildings';
  const r = U.rng(10101), CORAL_C = ['#ff7a8a', '#ffb36b', '#c88aff', '#6fe0d0', '#ffe07a'];
  const aisleD = (x, y) => AISLE.reduce((m, p, k) => (k ? Math.min(m, segDist(AISLE[k - 1], p, x, y)) : m), Infinity);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { if (k < 0.2) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.7, rot, v: Math.floor(k * 16) % 4, flavor: 'coral' }); continue; }
    if (t === T.SHALLOW || aisleD(x, y) < 1.2 || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 2) continue;
    if (Math.hypot(x - POOL.x, y - POOL.y) < 2 || Math.hypot(x - ALTAR.x, y - ALTAR.y) < 3.4) continue;
    if (t === T.KELP) { if (k < 0.12) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.8 + s * 0.5, rot, flavor: 'kelp' }); continue; }
    if (k < 0.03) addObj(W, { kind: 'coral', x, y, solid: 0, s: 0.4 + s * 0.4, rot, c: CORAL_C[Math.floor(s * 5)] });
    else if (k < 0.05) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.35 + s * 0.4, rot, flavor: 'coral' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.KELP && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(10202);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || aisleD(x, y) < 1.2) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 3) continue;
    W.spots.push({ id: 'dt' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}



const TEMPLE_DOOR = at(14.5, 92.8), TEMPLE_BACK = at(16.4, 90.4);

export const MANIFEST = {
  order: 8,
  
  region: {
    id: ID, name: 'The Drowned Temple', chapters: [2], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: POOL_LANDING, home: ENTRY,
    pack: null,
    transit: false, objective: 'Follow the aisle to the singing altar',
  },
  generate: generateDrownedTemple, steps: drownedTempleSteps,
  doors: [
    { id: 'temple-in', region: HOME, at: TEMPLE_DOOR, to: ID, toAt: ENTRY, label: 'Into the drowned temple', after: null },
    { id: 'temple-out', region: ID, at: ENTRY, to: HOME, toAt: TEMPLE_BACK, label: 'Back out to Coral Deep', after: null },
  ],
  perches: [
    
    { id: 'drowned-temple', region: ID, name: 'Temple Pool', at: POOL_LANDING, opens: 'boss_ashlo', respawn: null },
  ],
  place: { name: 'The Drowned Temple', at: [0.72, 0.95], r: 0.045, glyph: 'meadow' },
  kind: 'ruin',
  ground: { 'temple-porch': 'coral', 'temple-nave': 'coral', 'temple-sanctum': 'coral' },
  caves: ['temple-porch', 'temple-nave', 'temple-sanctum'],
  ambience: { 'temple-porch': { surf: 0.4, chimes: 0.2 }, 'temple-nave': { surf: 0.3, chimes: 0.3 }, 'temple-sanctum': { chimes: 0.6, surf: 0.2 } },
  beats: {
    'temple-porch': [
      ['narr', 'Inside the drowned temple it is quiet. Water drips. Your footsteps echo a long way off.'],
    ],
    'temple-sanctum': [
      ['narr', 'At the end of the aisle an old altar waits. When the tide moves, the whole room hums, like a choir far away.'],
      ['kid', 'Okay, that\'s creepy. That\'s creepy, right? Buildings don\'t sing. Not even in Manhattan.'],
    ],
  },
};
