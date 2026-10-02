





import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'kelp-maze';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'kelp-maze', name: 'The Kelp Maze', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 2, wildTypes: ['Tide', 'Frost', 'Metal'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const GRID = { u0: -16.2, v0: 29.2, cols: 9, rows: 6, cell: 3.6, wall: 1.1 };
const G = GRID;
const cellCentre = (c, r) => at(G.u0 + (c + 0.5) * G.cell + G.wall / 2, G.v0 + (r + 0.5) * G.cell + G.wall / 2);
export const ENTRY_CELL = [0, 3], POOL_CELL = [8, 2];
export const ENTRY = cellCentre(...ENTRY_CELL);   
export const POOL = cellCentre(...POOL_CELL);     
export const POOL_LANDING = at(toUV(POOL.x, POOL.y)[0] - 0.4, toUV(POOL.x, POOL.y)[1] + 1.05); 

export const MAZE = carve(1931);
function carve(seed) {
  const r = U.rng(seed), open = Array.from({ length: G.rows }, () => Array.from({ length: G.cols }, () => ({ e: false, s: false })));
  const seen = new Set(), stack = [ENTRY_CELL];
  seen.add(ENTRY_CELL.join());
  while (stack.length) {
    const [c, w] = stack[stack.length - 1];
    const next = [[c + 1, w], [c - 1, w], [c, w + 1], [c, w - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < G.cols && b < G.rows && !seen.has(a + ',' + b));
    if (!next.length) { stack.pop(); continue; }
    const [a, b] = next[Math.floor(r() * next.length)];
    if (a > c) open[w][c].e = true; else if (a < c) open[b][a].e = true; else if (b > w) open[w][c].s = true; else open[b][a].s = true;
    seen.add(a + ',' + b); stack.push([a, b]);
  }
  
  for (let k = 0; k < 7; k++) { const c = Math.floor(r() * (G.cols - 1)), w = Math.floor(r() * (G.rows - 1)); if (r() < 0.5) open[w][c].e = true; else open[w][c].s = true; }
  return open;
}

export function wallAt(u, v) {
  const lu = u - G.u0, lv = v - G.v0, W2 = G.cols * G.cell + G.wall, H2 = G.rows * G.cell + G.wall;
  if (lu < 0 || lv < 0 || lu > W2 || lv > H2) return true;
  const c = Math.floor(lu / G.cell), w = Math.floor(lv / G.cell), fu = lu - c * G.cell, fv = lv - w * G.cell;
  const onV = fu < G.wall, onH = fv < G.wall;
  if (c >= G.cols || w >= G.rows) return true; 
  if (onV && onH) return true; 
  if (onV) return c === 0 ? true : !MAZE[w][c - 1].e; 
  if (onH) return w === 0 ? true : !MAZE[w - 1][c].s;
  return false;
}

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
export const BASE_H = 0.2;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y);
  return BASE_H + U.fbm(x * 0.1, y * 0.1, 93) * 0.18 + (wallAt(u, v) ? 0.35 : 0);
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v) || wallAt(u, v)) return T.CLIFF;
  
  return U.fbm(x * 0.18, y * 0.18, 97) > 0.6 ? T.KELP : T.REEF;
}

export function generateKelpMaze() { const it = kelpMazeSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* kelpMazeSteps() {
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.6;
  addObj(W, { kind: 'spring', x: POOL.x, y: POOL.y, solid: 0.8, heal: true });
  for (const side of [-1, 1]) { const [u, v] = toUV(ENTRY.x, ENTRY.y), p = at(u - 1.0, v + side * 1.0); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  yield 'buildings';
  
  const r = U.rng(9191), CORAL_C = ['#ff7a8a', '#ffb36b', '#c88aff', '#6fe0d0', '#ffe07a'];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) {
      if (k < 0.45) addObj(W, { kind: 'fern', x, y, solid: 0, s: 1.05 + s * 0.6, rot, flavor: 'kelp' }); 
      else if (k < 0.55) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.7 + s * 0.5, rot, v: Math.floor(k * 8) % 4, flavor: 'coral' });
      continue;
    }
    if (Math.hypot(x - ENTRY.x, y - ENTRY.y) < 1.6 || Math.hypot(x - POOL.x, y - POOL.y) < 1.8) continue;
    if (k < 0.035) addObj(W, { kind: 'coral', x, y, solid: 0, s: 0.5 + s * 0.4, rot, c: CORAL_C[Math.floor(s * 5)] });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.KELP && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(9292);
  for (let t = 0; W.spots.length < 5 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 3) continue;
    W.spots.push({ id: 'km' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
