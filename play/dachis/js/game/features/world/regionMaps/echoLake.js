







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard, fruitGrove } from '../dressing.js';

export const ID = 'echo-lake';
export const SIZE = 112;
const WT = ['Tide', 'Frost', 'Shadow'];
export const SECTIONS = addSections([
  { id: 'echo-hamlet', name: 'Echo Lake - Driftwick', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 5 },
  { id: 'echo-river', name: 'Echo Lake - The Black River', rect: { u: [-18, 18], v: [54, 80] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 5, wildTypes: WT },
  { id: 'echo-isles', name: 'Echo Lake - The Still Water', rect: { u: [-18, 18], v: [80, 108] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 5, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const xy = ([u, v]) => fromUV(u, v);


export const shore = (v) => 3.0 + Math.sin(v * 0.28) * 1.4 + Math.sin(v * 0.7 + 2) * 0.5;
export const ENTRY = at(-14.0, 31.0);      
export const SPRING = at(-6.6, 36.4);      
export const LANDING = at(-5.0, 37.8);     

export const ISLES = [{ id: 'a', u: -6, v: 86.5, r: 4.4 }, { id: 'b', u: 7.5, v: 94.5, r: 4.6 }, { id: 'c', u: -5.5, v: 103.5, r: 3.6 }];

export const RAFTS = [
  { id: 'r1', route: [[4.4, 48.6], [7.6, 53.0], [6.6, 58.0], [-2.6, 62.0], [-4.0, 68.0], [3.4, 72.4], [2.4, 77.4], [-3.4, 81.4]], land: [[1.6, 49.6], [-4.6, 83.6]] },
  { id: 'r2', route: [[-1.4, 88.8], [0.8, 90.8], [2.4, 92.0]], land: [[-3.0, 87.8], [4.0, 93.0]] },
  { id: 'r3', route: [[6.4, 99.4], [3.0, 102.6], [-1.6, 103.4]], land: [[6.8, 97.4], [-3.2, 103.4]] },
];
export const RIVER_HALF = 2.4;
export const DOCKS = RAFTS.flatMap((r) => [0, 1].map((end) => ({ raft: r.id, end, ...at(...(end ? r.route[r.route.length - 1] : r.route[0])), land: at(...r.land[end]) })));

const HUTS = [[-10.6, 33.6, 1.35], [-11.6, 44.0, 1.4], [shore(38.6) + 0.2, 38.6, 1.3], [shore(44.6) + 0.2, 44.6, 1.3], [-4.2, 49.6, 1.35]];
const ROOFS = ['#5a8ab0', '#6a9a88', '#8a7ab0', '#b08a5a', '#5aa0a0'];
export const HUT_SPOTS = HUTS.map(([u, v, s]) => ({ ...at(u, v), s }));
export const LANE = [[-15.0, 31.0], [-11.0, 36.6], [-7.6, 40.4], [-3.0, 43.6], [0.6, 47.6], [1.6, 49.6]];
export const DWELLERS = [
  { id: 'echo-v0', home: { ...at(-8.6, 41.6), r: 2.2 }, lines: [
    'Shout across the water and it shouts back. Three times. Grandma says the third one isn\'t yours. Whose is it, then? She won\'t say. She just does the knitting faster.',
    'We fish by ear down here. You listen for the splash, then you count. If you get past nine, that wasn\'t a fish. Pull your line in.'] },
  { id: 'echo-v1', home: { ...at(-2.4, 45.4), r: 2.2 }, lines: [
    'Take the raft, pole it slow. Go fast and the river takes the pole. Then the river takes you. Then my dad has to go looking, and he hates going looking.',
    'The islands have the good shells. The ones that hum. I traded a hum shell for a whole basket of eels once. Worst trade of my life. Don\'t trade for eels.'] },
  { id: 'echo-v2', home: { ...at(-12.6, 39.0), r: 2.0 }, lines: [
    'You came DOWN from the crystal? Nobody comes down from the crystal. We go up. To sell fish to the mirror polishers. They never haggle, they\'re too tired.',
    'Don\'t eat the white fish. Or the black fish. Eat the brown ones, those are just bread. My mom bakes them fish-shaped. It\'s a long story.'] },
];

const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};
export const routeD = (r, u, v) => r.route.reduce((m, p, k) => (k ? Math.min(m, segD(r.route[k - 1], p, u, v)) : m), Infinity);
const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const isleIn = (u, v) => Math.max(...ISLES.map((i) => i.r - Math.hypot(u - i.u, (v - i.v) * 1.1)));

export function ground(u, v) {
  if (v < 32.4 && u < -12 && Math.abs(v - 31) < 1.6) return 'land'; 
  if (Math.abs(u) < 15.5 && v > 46 && v < 84 && routeD(RAFTS[0], u, v) < RIVER_HALF) return 'water'; 
  if (!inside(u, v)) return 'wall';
  if (v < 54) return u < shore(v) ? 'land' : 'water';
  if (v < 80) return routeD(RAFTS[0], u, v) < RIVER_HALF ? 'water' : 'wall';
  if (v < 82.2) return routeD(RAFTS[0], u, v) < RIVER_HALF || isleIn(u, v) > -1.2 ? (isleIn(u, v) > 0 ? 'land' : 'water') : 'wall';
  return isleIn(u, v) > 0 ? 'land' : 'water';
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return 1.8 + U.fbm(x * 0.2, y * 0.2, 1301) * 0.8;
  if (g === 'water') return -0.3;
  const edge = v < 54 ? U.clamp((shore(v) - u) / 3, 0, 1) : U.clamp(isleIn(u, v) / 2.2, 0, 1);
  return 0.05 + edge * 0.28 + U.fbm(x * 0.15, y * 0.15, 1303) * 0.1 * edge;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return T.CLIFF;
  if (g === 'water') return v < 54 && u - shore(v) < 1.2 ? T.SHALLOW : T.DEEP;
  if (v < 54) return u > shore(v) - 2.4 ? T.SAND : T.GRASS;
  return U.fbm(x * 0.2, y * 0.2, 1305) > 0.55 ? T.MOSS : T.SAND;
}

export function generateEchoLake() { const it = echoLakeSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* echoLakeSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const lane = LANE.map(xy);
  const huts = HUT_SPOTS.map((h, i) => {
    let best = lane[0], bd = Infinity; for (const p of lane) { const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d < bd) { bd = d; best = p; } }
    const rot = Math.atan2(best[0] - h.x, best[1] - h.y);
    return { ...h, i, rot, door: [h.x + Math.sin(rot) * 1.15 * h.s, h.y + Math.cos(rot) * 1.15 * h.s] };
  });
  carvePath(W, W.type, lane);
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.SAND;
  mapQueries(W);
  
  W.reach = floodReach(W, W.type, ENTRY);
  for (const r of RAFTS) for (const l of r.land) { const p = at(...l), more = floodReach(W, W.type, p); for (let k = 0; k < more.length; k++) if (more[k]) W.reach[k] = 1; }
  yield 'reach';
  
  
  const seen = W.reach.slice();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const [u, v] = toUV(i + 0.5, j + 0.5); if (RAFTS.some((r) => routeD(r, u, v) < 1.6)) seen[W.idx(i, j)] = 1; }
  W.windows = sectionWindows(Object.assign(Object.create(W), { reach: seen }), SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: lane, half: 0.5 }];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && toUV(x, y)[1] < 54 && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4;
  W.rafts = { rafts: RAFTS, docks: DOCKS, at: {} }; 
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  for (const d of DOCKS) addObj(W, { kind: 'jetty', x: (d.x + d.land.x) / 2, y: (d.y + d.land.y) / 2, solid: 0, h: 0.12, rot: Math.atan2(d.x - d.land.x, d.y - d.land.y), s: Math.hypot(d.x - d.land.x, d.y - d.land.y) / 1.6 });
  for (const [u, v] of [[-13.4, 29.6], [-13.4, 32.4], [0.6, 46.0], [-8.4, 36.0]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  {
    const dr = U.rng(1313), dclear = (x, y, r) => {
      const [u, v] = toUV(x, y);
      return lane.every((p, k) => k === 0 || segD(toUV(...lane[k - 1]), toUV(...p), u, v) > 0.9 + r) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 2.4 + r
        && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r && Math.hypot(x - LANDING.x, y - LANDING.y) > 1.2 + r && DOCKS.every((d) => Math.hypot(x - d.land.x, y - d.land.y) > 1.6 + r)
        && huts.every((h) => Math.hypot(x - h.door[0], y - h.door[1]) > 0.9 + r) && v < 54;
    };
    guardHuts(W, huts);
    for (const [k, u, v] of [['fishrack', -6.0, 46.6], ['fishrack', -1.0, 40.0], ['cookfire', -7.6, 43.0], ['well', -13.0, 41.6], ['washline', -8.8, 47.4], ['crates', 0.4, 51.6], ['basket', -0.6, 50.6]]) {
      placeYard(W, k, at(u, v), { rot: dr() * 6.28, clear: dclear, extra: k === 'basket' ? { c: '#8ab4cc' } : {} });
    }
    dressHuts(W, huts, { rng: dr, kinds: ['basket', 'pots', 'fishrack', 'strawbed', 'toys', 'tools', 'bowl', 'crates'], food: ['#8ab4cc', '#e8eef2', '#f0b030'], clear: dclear, perHut: [3, 4] });
    fruitGrove(W, at(-14.0, 37.4), 'banana', { rng: dr, clear: dclear });
    fruitGrove(W, at(-14.4, 47.0), 'mango', { rng: dr, clear: dclear });
  }
  yield 'buildings';
  const r = U.rng(1414), CRY = ['#8ad8ff', '#a0ffe0', '#c8a0ff'];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 1.8) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) { if (k < 0.12) addObj(W, { kind: 'crystal', x, y, solid: 0, s: 0.8 + s * 0.9, rot, c: CRY[Math.floor(s * 3)] }); else if (k < 0.6) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (t === T.DEEP || t === T.SHALLOW) continue;
    if (W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.2) || DOCKS.some((d) => Math.hypot(x - d.land.x, y - d.land.y) < 1.8 || Math.hypot(x - d.x, y - d.y) < 1.6)) continue;
    if (v < 54) { if (t === T.GRASS && k < 0.05) addObj(W, { kind: 'flower', x, y, solid: 0, s: 0.8, rot, c: ['#c8e0ff', '#ffffff', '#a0d8ff'][Math.floor(s * 3)] }); continue; }
    if (t === T.MOSS && k < 0.06) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot, flavor: 'kelp' });
    else if (k < 0.03) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot, flavor: 'coral' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [u, v] = toUV(i + 0.5, j + 0.5);
    if (v > 82 && W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)] && DOCKS.every((d) => Math.hypot(i + 0.5 - d.land.x, j + 0.5 - d.land.y) > 2.2)) W.wildTiles.push([i + 0.5, j + 0.5]);
  }
  yield 'grid';
  const rs = U.rng(1515);
  for (let t = 0; W.spots.length < 5 && t < 6000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3 || DOCKS.some((d) => Math.hypot(x - d.land.x, y - d.land.y) < 2)) continue;
    if (huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.2)) continue;
    W.spots.push({ id: 'el' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
