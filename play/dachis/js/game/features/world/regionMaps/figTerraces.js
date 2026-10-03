






import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'fig-terraces';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'fig-terraces', name: 'The Fig Terraces — Flooded Paddies', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: ['Beast', 'Leaf', 'Gale'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const LIPS = [50.2, 45.8, 41.4, 37.0, 32.6];
export const lipV = (k, u) => LIPS[k] + Math.sin(u * 0.32 + k * 1.7) * 0.55;
export const TOP_H = 1.6, STEP = 0.32;

export const CROSS = [[-8.5, 1.5, 10.0], [-3.5, 6.0], [-10.0, -0.5, 9.0], [-5.0, 5.5], [-1.0, 8.5]];
export const DIKE_HALF = 0.8;
export const BANK_U = 13.6;   
export const ENTRY = at(-0.6, 51.0);      
export const GATE = ENTRY;
export const EXIT = at(2.0, 28.6);        
export const EXIT_BACK = at(2.0, 30.4);
export const SPRING = at(6.0, 51.3);      
export const LANDING = at(3.2, 51.0);

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);

const terraceOf = (u, v) => { let k = -1; for (let i = 0; i < LIPS.length; i++) if (v < lipV(i, u)) k = i; return k; };
const terraceN = (k) => (k + 1 < LIPS.length ? (u) => lipV(k + 1, u) : () => 31.0);

export const dikeD = (u, v) => {
  let d = Infinity;
  for (let k = 0; k < LIPS.length; k++) d = Math.min(d, Math.abs(v - lipV(k, u)) * 0.95);
  const k = terraceOf(u, v);
  if (k >= 0) { const top = lipV(k, u), bot = terraceN(k)(u); if (v <= top + 0.4 && v >= bot - 0.4) for (const cu of CROSS[k]) d = Math.min(d, Math.abs(u - cu)); }
  return d;
};


const paddyWild = (u, v) => {
  const k = terraceOf(u, v); if (k < 0) return false;
  const cell = CROSS[k].filter((cu) => u > cu).length;
  return (k * 5 + cell * 3) % 3 === 1;
};
const landing = (u, v) => terraceOf(u, v) < 0 || v < 31.0;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), k = terraceOf(u, v);
  if (Math.abs(u) > BANK_U + 1) return TOP_H - 0.5 + U.fbm(x * 0.12, y * 0.12, 801) * 0.5 + (Math.abs(u) - BANK_U) * 0.12; 
  if (k < 0) return TOP_H + 0.1;
  const h = TOP_H - (k + 1) * STEP, onLip = Math.abs(v - lipV(k, u));
  if (onLip < DIKE_HALF) return h + STEP; 
  if (dikeD(u, v) < DIKE_HALF || v < 31.0) return h;
  return h - 0.18; 
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (Math.abs(u) > BANK_U) return U.fbm(x * 0.2, y * 0.2, 803) > 0.5 ? T.TALL : T.JUNGLE;
  if (landing(u, v)) return T.GRASS;
  if (dikeD(u, v) < DIKE_HALF) return T.PATH;
  return paddyWild(u, v) ? T.TALL : T.SHALLOW;
}

export function generateFigTerraces() { const it = figTerracesSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* figTerracesSteps() {
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - GATE.x, y - GATE.y) > 1.8;
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  const figs = [];
  CROSS.forEach((us, k) => us.forEach((cu, i) => { if ((k + i) % 2) return; const v = lipV(k, cu) - 1.5; const p = at(cu + 1.3, v); figs.push(p); }));
  for (const p of figs) addObj(W, { kind: 'jtree', x: p.x, y: p.y, solid: 0.5, s: 1.5, rot: p.x });
  
  for (const [u, v] of [[-2.6, 51.6], [1.4, 51.6], [0.0, 29.0], [4.0, 29.0]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  yield 'buildings';
  const r = U.rng(8181), busy = (x, y) => Math.hypot(x - GATE.x, y - GATE.y) < 2.2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - EXIT.x, y - EXIT.y) < 1.8 || figs.some((f) => Math.hypot(x - f.x, y - f.y) < 1.6);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    if (t === T.CLIFF) { if (k < 0.14) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 1.2 + s * 0.6, rot }); continue; }
    if (t === T.SHALLOW) { if (k < 0.05) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.4 + s * 0.3, rot }); continue; } 
    if (t === T.PATH) continue;
    if (t === T.TALL) { if (k < 0.07) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.7 + s * 0.5, rot }); continue; }
    if (t === T.JUNGLE && k < 0.06) addObj(W, { kind: 'jtree', x, y, solid: 0.45, s: 1 + s * 0.4, rot });
    else if (t === T.GRASS && k < 0.06) addObj(W, { kind: 'flower', x, y, solid: 0, c: s < 0.5 ? '#ffd23a' : '#ff8a5a' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(8282);
  for (let t = 0; W.spots.length < 3 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'ft' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
