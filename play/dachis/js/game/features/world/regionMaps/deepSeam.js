







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import * as lanternShaft from './lanternShaft.js';
const { LIGHT } = lanternShaft;

export const ID = 'deep-seam';
export const SIZE = 96;
const WT = ['Stone', 'Metal', 'Shadow'];
export const SECTIONS = addSections([
  { id: 'seam-hall', name: 'The Deep Seam - The Lamp Hall', rect: { u: [-12, 12], v: [30, 46] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, dark: true, wildTypes: WT },
  
  
  { id: 'seam-narrows', name: 'The Deep Seam - The Narrows', rect: { u: [-12, 12], v: [46, 70] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, dark: true, wildTypes: WT },
  { id: 'seam-stones', name: 'The Deep Seam - The Stepping Dark', rect: { u: [-12, 12], v: [70, 86] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, dark: true, wildTypes: WT },
  { id: 'seam-hollow', name: 'The Hermit\'s Hollow', rect: { u: [-12, 12], v: [86, 102] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, dark: true, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const DOORWAYS = [{ u: 0, v: 46 }, { u: 0, v: 70 }, { u: 0, v: 86 }];
const roomOf = (v) => (v < 46 ? 0 : v < 70 ? 1 : v < 86 ? 2 : 3);
const DV = 8; 

export const PILLARS = [[-6, 35, 1.2], [-1.8, 36.4, 1.1], [3, 35, 1.2], [7.2, 36.6, 1.0], [-7, 40, 1.1], [-3, 41.2, 1.2], [1.6, 39.6, 1.1], [6, 40.8, 1.2], [-4.6, 43.8, 0.9], [4.2, 43.6, 0.9]].map(([u, v, r]) => ({ u, v, r }));

export const CREVICE = [[0, 46], [-5, 50], [4, 54.5], [-5, 59], [4, 63.5], [-3, 67], [0, 70]];
export const SPURS = [[[-5, 50], [-9.2, 48.8]], [[4, 54.5], [9.2, 55.6]], [[-5, 59], [-9.4, 60.6]]];

export const POCKETS = [[-7.1, 49.4, 2.3], [6.6, 55.0, 2.3], [-7.2, 59.8, 2.3], [7.4, 64.4, 2.4], [-6.4, 66.6, 2.0]].map(([u, v, r]) => ({ u, v, r }));
export const CREVICE_HALF = 1.0;

export const STONES = [[0, 62.8, 1.3], [-1.2, 64.6, 1.0], [-2.8, 66.0, 1.0], [-2.4, 67.9, 1.0], [-0.6, 69.0, 1.0], [1.4, 70.0, 1.0], [2.6, 71.7, 1.0],
  [1.6, 73.4, 1.0], [0, 74.6, 1.0], [0, 76.4, 1.1], [0, 77.6, 1.2], [-4.6, 66.4, 0.9], [-6.4, 67.2, 1.1], [4.4, 70.6, 0.9], [6.2, 71.2, 1.1]].map(([u, v, r]) => ({ u, v: v + DV, r: r + 0.35 })); 

export const HOLLOW = { u: 0, v: 86 + DV, r: 6.6 };
export const HERMIT_SPOT = at(0, 89 + DV);

const LAMP_UV = [
  [[-9, 32.6], [9, 32.6], [-9.2, 44.2], [9.2, 44.2]],
  [[-9.6, 48.6], [9.6, 55.7], [-9.8, 60.7]],
  [[-6.8, 67.3 + DV], [6.6, 71.3 + DV]],
  [[-5.4, 82.6 + DV], [5.4, 82.6 + DV], [-5.4, 89.4 + DV], [5.4, 89.4 + DV]],
];
export const LAMPS = LAMP_UV.flatMap((list, room) => list.map(([u, v], i) => ({ id: `ds${room}-${i}`, room, u, v, ...at(u, v) })));

export const GATES = DOORWAYS.map((d, k) => ({ id: 'chain' + k, room: k, u: d.u, v: d.v, ...at(d.u, d.v), lamps: LAMPS.filter((l) => l.room === k).map((l) => l.id) }));
export const gateOpen = (g, lit = {}) => g.lamps.every((id) => lit[id]);
export const ENTRY = at(0, 33.4);     
export const POOL = at(-2.6, 33.4);   
export const POOL_LANDING = at(1.2, 34.0);
export const DWELLERS = [ 
  { id: 'seam-v0', home: { ...at(-1.4, 45.0), r: 0.6 }, lines: [
    'You can\'t go past. The chain\'s to keep the light out, not you. ...Well. You too, I suppose. You\'re mostly light, with that thing on your belt.',
    'Light all four and it drops. He built it that way on purpose. Said if you want the light that badly, you can walk around in the dark for it first.'] },
];

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const inDoorway = (u, v) => DOORWAYS.some((d) => Math.abs(v - d.v) < 2.4 && Math.abs(u - d.u) < 1.5);
const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};
const lineD = (pts, u, v) => pts.reduce((m, p, k) => (k ? Math.min(m, segD(pts[k - 1], p, u, v)) : m), Infinity);
const discIn = (list, u, v) => Math.max(...list.map((d) => d.r - Math.hypot(u - d.u, v - d.v)));

function floor(u, v) {
  if (inDoorway(u, v)) return true;
  if (!inside(u, v)) return false;
  const room = roomOf(v);
  if (room === 0) return discIn(PILLARS, u, v) < 0;
  if (room === 1) return lineD(CREVICE, u, v) < CREVICE_HALF || SPURS.some((s) => lineD(s, u, v) < 0.85) || discIn(POCKETS, u, v) > 0;
  if (room === 2) return discIn(STONES, u, v) > 0;
  return Math.hypot(u - HOLLOW.u, v - HOLLOW.v) < HOLLOW.r || (v < 80 + DV && Math.abs(u) < 1.4);
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y);
  return floor(u, v) ? 0.2 + U.fbm(x * 0.2, y * 0.2, 901) * 0.15 : roomOf(v) === 2 && inside(u, v) ? -2.6 : 1.4 + U.fbm(x * 0.2, y * 0.2, 903) * 0.6;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!floor(u, v)) return T.CLIFF;
  if (inDoorway(u, v)) return T.RUIN;
  const room = roomOf(v);
  if (room === 2) { const k = STONES.findIndex((s) => Math.hypot(u - s.u, v - s.v) < s.r); return k % 2 ? T.ROCK : T.RUIN; } 
  if (room === 3) return T.RUIN;
  if (room === 1) return discIn(POCKETS, u, v) > 0 ? T.MOSS : T.ROCK; 
  return U.fbm(x * 0.25, y * 0.25, 905) > 0.62 ? T.MOSS : T.ROCK;
}

export function generateDeepSeam() { const it = deepSeamSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* deepSeamSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && U.dist(x, y, ENTRY.x, ENTRY.y) > 1.8;
  W.dark = { lamps: LAMPS, gates: GATES, ...LIGHT, lit: {} }; 
  addObj(W, { kind: 'spring', x: POOL.x, y: POOL.y, solid: 0.8, heal: true });
  for (const l of LAMPS) addObj(W, { kind: 'lantern', x: l.x, y: l.y, solid: 0.2, rot: Math.PI / 4 });
  for (const g of GATES) for (const du of [-1.6, 1.6]) { const p = at(g.u + du, g.v); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.3, s: 0.9, rot: 0.3, v: 2 }); } 
  yield 'buildings';
  const r = U.rng(9191);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 1.6) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF && (roomOf(v) !== 2 || !inside(u, v))) { if (k < 0.75) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.9, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (t === T.MOSS && k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot, flavor: 'shrine' });
  }
  
  
  {
    const rp = U.rng(9393), GEMS = ['#c8a0ff', '#8fe8ff', '#b0ffd8'];
    for (const p of POCKETS) {
      for (let q = 0; q < 3; q++) { 
        const a = -Math.PI / 2 + (q - 1) * 0.55 + (rp() - 0.5) * 0.3, d = p.r - 0.35, c = at(p.u + Math.cos(a) * d, p.v + Math.sin(a) * d);
        addObj(W, { kind: 'crystal', x: c.x, y: c.y, solid: 0, s: 0.55 + rp() * 0.35, rot: rp() * 6.28, c: GEMS[Math.floor(rp() * GEMS.length)] });
      }
      for (let q = 0; q < 4; q++) { 
        const a = rp() * Math.PI * 2, d = p.r - 0.25, c = at(p.u + Math.cos(a) * d, p.v + Math.sin(a) * d);
        addObj(W, { kind: 'rock', x: c.x, y: c.y, solid: 0, s: 0.35 + rp() * 0.3, rot: rp() * 6.28, dark: true });
      }
      for (let q = 0; q < 4; q++) { 
        const a = rp() * Math.PI * 2, d = 0.7 + rp() * (p.r - 1.1), c = at(p.u + Math.cos(a) * d, p.v + Math.sin(a) * d);
        if (W.type[W.idx(Math.floor(c.x), Math.floor(c.y))] === T.MOSS) addObj(W, { kind: 'fern', x: c.x, y: c.y, solid: 0, s: 0.55 + rp() * 0.35, rot: rp() * 6.28, flavor: 'shrine' });
      }
    }
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  
  const walk = W.walkable;
  W.walkable = (x, y, rad = 0) => walk(x, y, rad) && !GATES.some((g) => !gateOpen(g, W.dark.lit) && Math.hypot(x - g.x, y - g.y) < 1.7 + rad);
  yield 'grid';
  const rs = U.rng(9292);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4), [, v] = toUV(x, y);
    if (roomOf(v) > 1 || !W.reach[W.idx(Math.floor(x), Math.floor(y))] || !walk(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3) continue;
    W.spots.push({ id: 'ds' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


export const MANIFEST = {
  order: 20,
  
  region: {
    id: ID, name: 'The Deep Seam', chapters: [5], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: POOL_LANDING, home: ENTRY,
    pack: 'assets/scenery-deep-seam.bin', 
    transit: false, objective: 'Light every lantern - the chains drop',
  },
  generate: generateDeepSeam, steps: deepSeamSteps,
  doors: [
    { id: 'seam-in', region: lanternShaft.ID, at: lanternShaft.END, to: ID, toAt: ENTRY, label: 'Through the crack', after: null },
    { id: 'seam-out', region: ID, at: ENTRY, to: lanternShaft.ID, toAt: lanternShaft.END_BACK, label: 'Back to the shaft', after: null },
  ],
  perches: [
    { id: 'deep-seam', region: ID, name: 'The Seam Pool', at: POOL_LANDING, opens: 'boss_kingshade', respawn: null },
  ],
  place: { name: 'The Deep Seam', at: [0.21, 0.82], r: 0.035, glyph: 'meadow' },
  kind: 'cave',
  ground: { 'seam-hall': 'ember', 'seam-narrows': 'ember', 'seam-stones': 'ember', 'seam-hollow': 'ember' },
  caves: ['seam-hall', 'seam-narrows', 'seam-stones', 'seam-hollow'],
  ambience: { 'seam-hall': { rumble: 0.7, chimes: 0.1 }, 'seam-narrows': { rumble: 0.8, wind: 0.2 }, 'seam-stones': { rumble: 0.9, wind: 0.3 }, 'seam-hollow': { rumble: 0.5, chimes: 0.3 } },
  beats: {
    'seam-hall': [
      ['narr', 'Through the crack the air goes still. Somewhere in the black there are pillars - you can hear your own steps come back off them.'],
      ['narr', 'Ahead, a chain hangs across the way on, heavy as a ship\'s.'],
      ['kid', 'Okay. Okay okay okay. It\'s just a basement. Every building\'s got a basement. ...Every building\'s got a light switch in the basement, too.'],
    ],
  },
  
  people: { rng: 83, kinds: { stage: 1, types: ['Shadow'] }, gap: 1.0, still: true, dwellers: DWELLERS },
};
