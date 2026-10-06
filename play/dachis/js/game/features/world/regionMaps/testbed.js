







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'testbed';
export const SIZE = 80;
export const SECTIONS = addSections([
  { id: 'testbed-a', name: 'Testbed - The Long Meadow', rect: { u: [-18, 18], v: [30, 56] }, zoom: 8.5, wall: 2.0, region: ID },
  { id: 'testbed-b', name: 'Testbed - The Far Field', rect: { u: [-18, 18], v: [56, 82] }, zoom: 8.5, wall: 2.0, region: ID },
]);
const uvPts = (list) => list.map(([u, v]) => fromUV(u, v));
export const PATH = uvPts([[0, 31], [-6, 38], [4, 46], [-3, 55], [6, 63], [-5, 71], [0, 80]]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const ENTRY = at(0, 33.2);
export const SPRING = at(3.4, 34.6);

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
function heightAtPoint(x, y) {
  
  const [u, v] = toUV(x, y), depth = Math.max(...SECTIONS.map((s) => edgeDepth(s.rect, u, v).depth));
  return 0.35 + U.fbm(x * 0.07, y * 0.07, 31) * 1.3 + Math.max(0, 2 - depth) * 0.25;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.WOOD;
  const n = U.fbm(x * 0.11, y * 0.11, 77);
  if (n > 0.62) return T.TALL;
  if (n < 0.24) return T.ROCK;
  return T.GRASS;
}




export function generateTestbed() { const it = testbedSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16; 
export function* testbedSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  carvePath(W, W.type, PATH);
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: PATH.map((p) => [...p]), half: 0.75 }];
  
  const r = U.rng(8080);
  const road = (x, y) => { let d = Infinity; for (let k = 0; k < PATH.length - 1; k++) d = Math.min(d, segDist(PATH[k], PATH[k + 1], x, y)); return d; };
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (U.dist(x, y, SPRING.x, SPRING.y) < 2.2 || U.dist(x, y, ENTRY.x, ENTRY.y) < 1.6) continue;
    if (t === T.WOOD) {
      if (k < 0.62) addObj(W, { kind: 'tree', x, y, solid: 0, s: 0.95 + s * 0.45, rot });
      else if (k < 0.9) addObj(W, { kind: 'bush', x, y, solid: 0, s: 0.9 + s * 0.5, rot, flavor: 'road' });
      continue;
    }
    const rd = road(x, y);
    if (t === T.GRASS && k < 0.025 && rd > 2) addObj(W, { kind: 'tree', x, y, solid: 0.35, s: 0.8 + s * 0.35, rot });
    else if (t === T.ROCK && k < 0.06) addObj(W, { kind: 'rock', x, y, solid: 0.35, s: 0.7 + s * 0.7, rot, dark: true });
    else if (t === T.GRASS && k < 0.04 && rd > 1) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.5 + s * 0.4, rot });
    else if ((t === T.GRASS || t === T.TALL) && k < 0.12) addObj(W, { kind: 'flower', x, y, solid: 0, c: U.pick(r, ['#fff7a8', '#ff9fd0', '#ffffff', '#b9a0ff']) });
  }
  yield 'props';
  buildGrid(W);
  yield 'grid';
  
  const rs = U.rng(8181);
  for (let t = 0; W.spots.length < 8 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5)) continue;
    W.spots.push({ id: 'tb' + W.spots.length, x, y, item: rs() < 0.6 ? 'tonic' : 'candy' });
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  return W;
}
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}


export const MANIFEST = {
  order: 1,
  region: {
    id: ID, name: 'Testbed', chapters: [], size: SIZE, interior: false, reachable: false,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: SPRING, home: ENTRY,
    pack: null,
    transit: false, objective: 'Walk the Long Meadow to the Far Field',
  },
  generate: generateTestbed, steps: testbedSteps,
  perches: [
    
    { id: 'testbed', region: ID, name: 'Testbed Meadow', at: ENTRY, opens: null, respawn: null },
  ],
  
  place: { name: 'Testbed', at: [0.93, 0.42], r: 0.06, glyph: 'meadow' },
  kind: 'field',
};
