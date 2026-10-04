








import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { CELL } from '../slide.js';

export const ID = 'frost-glacier';
export const SIZE = 96;
export const SECTIONS = addSections([
  
  { id: 'glacier-field', name: 'Frostspine Peaks - The Glacier Field', rect: { u: [-10, 10], v: [24, 62] }, zoom: 18, wall: 2.0, region: ID, chapter: 6 },
  { id: 'aurora-hollow', name: 'Frostspine Peaks - Aurora Hollow', rect: { u: [-20, 20], v: [62, 96] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 6, wildTypes: ['Frost', 'Gale', 'Light'] },
  { id: 'steam-vents', name: 'Frostspine Peaks - The Steam Vents', rect: { u: [20, 44], v: [68, 92] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 6, train: true, wildTypes: ['Ember', 'Ember', 'Spark'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const xy = ([u, v]) => fromUV(u, v);




export const ICE = { u0: -8, v0: 30, grid: [
  '.#..#..#', '#.#..#..', '..#...#.', '........', '...##.#.', '.#o.....', '....#...',
  '........', '#..#..##', '..o..#..', '......o.', '........', '..#o#.#.', '..#..#..',
] };
export const iceCell = (u, v) => [Math.floor((u - ICE.u0) / CELL), Math.floor((v - ICE.v0) / CELL)];
export const cellAt = (u, v) => { const [c, r] = iceCell(u, v); return r < 0 || r >= ICE.grid.length || c < 0 || c >= ICE.grid[0].length ? null : ICE.grid[r][c]; };
export const cellCentre = (c, r) => [ICE.u0 + (c + 0.5) * CELL, ICE.v0 + (r + 0.5) * CELL];

export const ENTRY = at(0, 26.4);      
export const SPRING = at(-5.0, 59.6);  
export const LANDING = at(-2.4, 60.0); 
export const VENT_SPRING = at(36.0, 84.0); 
export const NORTH = at(0, 92.6);      
export const NORTH_BACK = at(0, 90.4); 
export const VENTS = [[27, 74], [31, 87], [38, 74], [41, 81], [33, 78]]; 
export const LANE = [[0, 26.4], [0, 29.2]];
export const TRACK = [[0, 58.6], [0, 62.0], [-8, 68], [-4, 76], [8, 81], [4, 89], [0, 92.6]];
export const SPUR = [[8, 81], [18, 80], [26, 80], [32, 81]];
export const DWELLERS = [
  { id: 'glacier-v0', home: { ...at(4.6, 27.6), r: 1.4 }, lines: [
    'Glare ice. Once your feet are on it, it decides where you go, not you. Pick your line before you step. Then pray to whichever rock is in the way.',
    'Forty years I cut blocks out there. The blocks I left are the only brakes on that field. You are welcome. Fall off the end and you start again from here.'] },
  { id: 'vents-v0', home: { ...at(31.0, 82.0), r: 2.0 }, lines: [
    'The fire kinds come up to the vents to sleep. Warm bellies, bad tempers. If you want something that melts the big one\'s ice, this is where it naps.',
    'Ice and iron, the Rex. Fire goes through both like a hot spoon through butter. Not that I have had butter in eleven years.'] },
];

const inG = (u, v) => edgeDepth({ u: [-10, 10], v: [24, 64] }, u, v).depth > 2.0;   
const inA = (u, v) => edgeDepth({ u: [-20, 20], v: [60, 96] }, u, v).depth > 2.0;   
const inB = (u, v) => edgeDepth({ u: [20, 44], v: [68, 92] }, u, v).depth > 2.0;   
const gap = (u, v) => u > 15 && u < 25 && v > 77.6 && v < 82.6;
const inside = (u, v) => inG(u, v) || inA(u, v) || inB(u, v) || gap(u, v);
const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};
const lineD = (pts, u, v) => pts.reduce((m, p, k) => (k ? Math.min(m, segD(pts[k - 1], p, u, v)) : m), Infinity);
export const onTrack = (u, v) => lineD(TRACK, u, v) < 1.3 || lineD(SPUR, u, v) < 1.3;
const ventD = (u, v) => Math.min(...VENTS.map(([a, b]) => Math.hypot(u - a, v - b)));

function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return 2.6 + U.fbm(x * 0.2, y * 0.2, 1901) * 1.2;
  if (cellAt(u, v) && cellAt(u, v) !== 'o') return 0.12;
  if (u > 20 || gap(u, v)) return 0.2 + U.fbm(x * 0.2, y * 0.2, 1903) * 0.16;
  return 0.26 + U.fbm(x * 0.15, y * 0.15, 1905) * 0.12;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  const k = cellAt(u, v);
  if (k === '.' || k === '#') return T.PLAZA;          
  if (k === 'o') return T.GRASS;                       
  if (u > 20 || (gap(u, v) && u > 19)) return ventD(u, v) < 3.2 ? T.MOSS : U.fbm(x * 0.25, y * 0.25, 1907) > 0.55 ? T.RUIN : T.ROCK; 
  if (v > 62 && !onTrack(u, v)) return T.TALL;         
  return T.GRASS;
}

export function generateGlacierField() { const it = glacierFieldSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* glacierFieldSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const lane = LANE.map(xy), track = TRACK.map(xy), spur = SPUR.map(xy), before = W.type.slice();
  for (const pts of [lane, track, spur]) carvePath(W, W.type, pts);
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH && before[k] === T.CLIFF) W.type[k] = T.CLIFF;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: lane, half: 0.5 }, { pts: track, half: 0.6 }, { pts: spur, half: 0.6 }];
  W.slide = { ...ICE, cell: CELL };                     
  W.slowAt = (x, y) => (W.type[W.idx(Math.floor(x), Math.floor(y))] === T.TALL ? 0.45 : 1); 
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && !cellAt(...toUV(x, y)) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8;
  
  const rr = U.rng(1919);
  ICE.grid.forEach((row, r) => [...row].forEach((k, c) => {
    if (k !== '#') return;
    const [u, v] = cellCentre(c, r), p = at(u + (rr() - 0.5) * 0.3, v + (rr() - 0.5) * 0.3);
    if (rr() < 0.5) addObj(W, { kind: 'iceblock', x: p.x, y: p.y, solid: 0.75, s: 1.3 + rr() * 0.3, rot: rr() * 6.28 });
    else addObj(W, { kind: 'rock', x: p.x, y: p.y, solid: 0.75, s: 1.2 + rr() * 0.3, rot: rr() * 3, dark: true });
  }));
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  addObj(W, { kind: 'spring', x: VENT_SPRING.x, y: VENT_SPRING.y, solid: 0.8, heal: true });
  for (const [u, v] of VENTS) { const p = at(u, v); addObj(W, { kind: 'spring', x: p.x, y: p.y, solid: 0.8 }); }
  for (const [u, v] of [[-3.4, 28.6], [3.4, 28.6], [-6.8, 59.0], [6.8, 59.0], [2.0, 92.4], [-2.0, 92.4], [21, 82.8]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  for (const [u, v, rot] of [[-5.0, 26.6, 0.2], [-14.0, 66.0, 1.4]]) { const p = at(u, v); addObj(W, { kind: 'prayerline', x: p.x, y: p.y, solid: 0, rot }); }
  yield 'buildings';
  const r = U.rng(2020);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 2.2) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) { if (k < 0.15) addObj(W, { kind: 'fir', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); else if (k < 0.3) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 13) % 4 }); continue; }
    if (t === T.PLAZA || t === T.PATH || cellAt(u, v)) continue;
    if (W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.4)) continue;
    if (Math.hypot(x - NORTH.x, y - NORTH.y) < 2.4 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2 || Math.hypot(x - LANDING.x, y - LANDING.y) < 1.6) continue;
    if (t === T.MOSS) { if (k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.4, rot, flavor: 'moss' }); continue; }
    if (t === T.ROCK || t === T.RUIN) { if (k < 0.05) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.5 + s * 0.5, rot, dark: true }); continue; }
    if (t === T.TALL) { if (k < 0.025) addObj(W, { kind: 'fir', x, y, solid: 0.35, s: 0.7 + s * 0.6, rot }); else if (k < 0.06) addObj(W, { kind: 'drift', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); continue; }
    if (k < 0.03) addObj(W, { kind: 'drift', x, y, solid: 0, s: 0.6 + s * 0.5, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [u, v] = toUV(i + 0.5, j + 0.5);
    if (v > 62 && u < 18 && W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]); 
    if (u > 20 && W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)] && W.walkable(i + 0.5, j + 0.5, 0.3)) W.wildTiles.push([i + 0.5, j + 0.5]);
  }
  yield 'grid';
  const rs = U.rng(2121);
  for (let t = 0; W.spots.length < 6 && t < 6000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4), [u, v] = toUV(x, y);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || cellAt(u, v)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3) continue;
    W.spots.push({ id: 'gf' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
