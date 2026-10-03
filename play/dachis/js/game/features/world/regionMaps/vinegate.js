





import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'vinegate';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'vinegate', name: 'Vinegate Landing — The River Village', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 4, wildTypes: ['Beast', 'Leaf', 'Gale'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const riverV = (u) => 40 + Math.sin(u * 0.22) * 1.6;
export const RIVER_HALF = 7.0;

export const WALKS = [
  { pts: [[-1.0, 50.5], [-1.6, 46.0], [0.4, 41.0], [-0.6, 36.0], [0.8, 31.5]], half: 0.95 },   
  { pts: [[-0.8, 43.6], [-5.0, 42.6], [-9.0, 40.6]], half: 0.75 },                               
  { pts: [[0.2, 39.0], [4.6, 40.2], [9.0, 41.6]], half: 0.75 },                                  
  { pts: [[-0.4, 36.6], [5.0, 35.4], [11.0, 35.2]], half: 0.75 },                                
  { pts: [[-1.2, 47.2], [-6.4, 46.6]], half: 0.7 },                                               
];
export const DECKS = [
  { u: -9.6, v: 40.6, r: 2.3 }, { u: 9.6, v: 41.8, r: 2.3 }, { u: 11.6, v: 35.0, r: 2.1 }, { u: 0.4, v: 41.0, r: 2.6 }, { u: -6.8, v: 46.6, r: 1.5 },
];
export const ENTRY = at(-1.0, 50.2);        
export const GATE = ENTRY;
export const SPRING = at(2.4, 50.8);        
export const LANDING = at(1.0, 49.6);       
export const POSTS = { elder: at(1.6, 41.6) }; 
export const HOME_DISC = { ...at(0.4, 41.0), r: 7.0 };
const HUTS = [[-10.0, 40.0, 1.35], [10.0, 42.4, 1.4], [12.0, 34.4, 1.35], [-1.4, 41.4, 1.35]];
const ROOFS = ['#7cb848', '#d8a050', '#c86a3a', '#e0c060'];
export const HUT_SPOTS = HUTS.map(([u, v, s]) => ({ ...at(u, v), s }));
export const DWELLERS = [
  { id: 'vine-v0', home: { ...at(-0.6, 48.2), r: 1.6 }, lines: [
    'You came on the big bird? Hoo! Hold on to the rails, the boards get slippery when it rains. It always rains.',
    'The river goes all the way to the old temple steps. Nobody fishes past the bend any more.'] },
  { id: 'vine-v1', home: { ...at(9.2, 41.0), r: 1.4 }, lines: [
    'King Kingshade lives up in the canopy. He used to swing down every morning to see us. Now he sends guards.',
    'His guards are scared, not mean. You can tell by their tails.'] },
  { id: 'vine-v2', home: { ...at(-8.8, 41.4), r: 1.4 }, lines: [
    'We built the village on stilts because the river floods. The river floods because it is the river. That is the deal.',
    'Throw a fig in the water for luck. Not that fig. That is my fig.'] },
];
export const ELDER = { name: 'Old Banyan', at: POSTS.elder };
export const ELDER_LINES = {
  before: [
    'A child from the other world, standing on my boards. Sit. Watch the river with me for a moment.',
    'Kingshade was the best of kings. When the floods came he carried every one of us up into the canopy himself.',
    'Now he says he will lead us OUT - out of the jungle, through the spirals, to a better world. Some of us believe him.',
    'Go up the vines to his throne, if you must. But listen to him first. He still means it kindly. That is the frightening part.',
  ],
  after: ['The canopy is singing again. Whatever you said to him, child, he heard it.'],
};

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};

export const onPlanks = (u, v) => Math.max(
  ...WALKS.map((w) => w.half - w.pts.reduce((m, p, k) => (k ? Math.min(m, segD(w.pts[k - 1], p, u, v)) : m), Infinity)),
  ...DECKS.map((d) => d.r - Math.hypot(u - d.u, v - d.v)));

const inRiver = (x, y) => { const [u, v] = toUV(x, y); return RIVER_HALF - Math.abs(v - riverV(u)) + U.fbm(x * 0.3, y * 0.3, 601) * 0.8 - 0.4; };
export const DECK_H = 0.45;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), r = inRiver(x, y);
  if (onPlanks(u, v) > 0) return DECK_H;
  if (r > 0) return -0.15 - Math.min(r, 4) * 0.2; 
  return 0.3 + U.fbm(x * 0.1, y * 0.1, 603) * 0.25 + Math.min(1.2, -r * 0.08);
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (onPlanks(u, v) > 0) return T.ROCK; 
  const r = inRiver(x, y);
  if (r > 1.2) return T.DEEP;
  if (r > 0) return T.SHALLOW;
  if (r > -1.4) return T.SAND; 
  
  return U.fbm(x * 0.18, y * 0.18, 605) > (v < 40 ? 0.42 : 0.55) ? T.TALL : T.JUNGLE;
}

export function generateVinegate() { const it = vinegateSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* vinegateSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - GATE.x, y - GATE.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4;
  const huts = HUT_SPOTS.map((h, i) => ({ ...h, i, rot: Math.atan2(at(0.4, 41).x - h.x, at(0.4, 41).y - h.y) }));
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  { const w = WALKS[0];
    for (let k = 1; k < w.pts.length; k++) {
      const [a, b] = [w.pts[k - 1], w.pts[k]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nu = -(b[1] - a[1]) / L, nv = (b[0] - a[0]) / L;
      for (const side of [-1, 1]) { let n = 0; for (let t = 0.5; t < L; t += 1.1) {
        const u = a[0] + (b[0] - a[0]) * t / L + nu * side * (w.half + 0.1), v = a[1] + (b[1] - a[1]) * t / L + nv * side * (w.half + 0.1);
        if (DECKS.some((d) => Math.hypot(u - d.u, v - d.v) < d.r + 0.2) || WALKS.slice(1).some((s) => s.pts.some((p) => Math.hypot(u - p[0], v - p[1]) < 1.4))) continue;
        const p = at(u, v); addObj(W, { kind: 'fence', x: p.x, y: p.y, solid: 0.15, ring: `pier-${k}-${side}`, k: n++, n: 0 });
      } } 
    } }
  for (const [u, v] of [[-2.4, 49.4], [0.6, 48.6], [-1.8, 39.6], [2.2, 42.8], [-0.2, 32.6]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  yield 'buildings';
  const r = U.rng(6161), busy = (x, y) => huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.2) || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - GATE.x, y - GATE.y) < 2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    const [u, v] = toUV(x, y); if (onPlanks(u, v) > -0.4) continue; 
    if (t === T.CLIFF) { if (k < 0.12) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 1.2 + s * 0.6, rot }); continue; }
    if (t === T.SHALLOW) { if (k < 0.04) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; } 
    if (t === T.DEEP || t === T.SAND) continue;
    if (t === T.TALL) { if (k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); continue; }
    if (k < 0.05) addObj(W, { kind: 'jtree', x, y, solid: 0.45, s: 1 + s * 0.4, rot });
    else if (k < 0.1) addObj(W, { kind: 'bush', x, y, solid: 0.3, s: 0.6 + s * 0.4, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(6262);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'vg' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
