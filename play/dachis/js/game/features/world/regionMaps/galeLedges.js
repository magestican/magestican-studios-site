






import { U } from '../../../../engine/core/util.js';
import { uvRot, addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'gale-ledges';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'gale-ledges', name: 'The Gale Ledges — Kong Sea Cliff', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, train: true, wildTypes: ['Gale', 'Beast', 'Stone'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const LEDGES = [49.6, 43.6, 37.6, 31.6];
export const LEDGE_HALF = 1.7, LEDGE_U = 14.0;
export const RAMP_U = [12.0, -12.0, 12.0], RAMP_HALF = 1.3;
export const LEDGE_H = (k) => 0.4 + k * 1.3;

export const CRAGS = [[-5.0, 0], [4.5, 0], [0.0, 1], [-7.5, 2], [6.0, 2], [1.6, 3]];

export const GRASS = [[-13.5, -8.0, 0], [7.5, 11.0, 0], [-11.0, -4.0, 1], [4.0, 10.5, 1], [-3.5, 3.5, 2], [8.5, 13.5, 2], [-13.5, -6.5, 3], [3.0, 9.0, 3]];
export const ENTRY = at(-6.0, 50.4);      
export const GATE = ENTRY;
export const SPRING = at(-6.0, 31.0);     
export const LANDING = at(-3.8, 31.6);    



export const CALM = 3.6, WARN = 0.9, GUST = 1.8, PUSH = 2.8, LEE = 1.9;
export const GUST_PERIOD = CALM + WARN + GUST;
export function gustAt(t) {
  const n = Math.floor(t / GUST_PERIOD), ph = t - n * GUST_PERIOD, dir = n % 2 ? -1 : 1;
  return { phase: ph < CALM ? 'calm' : ph < CALM + WARN ? 'warn' : 'gust', dir };
}
const ledgeOf = (v) => LEDGES.findIndex((lv) => Math.abs(v - lv) <= LEDGE_HALF + 0.3);

export const sheltered = (u, v, dir) => {
  const k = ledgeOf(v);
  return k >= 0 && CRAGS.some(([cu, ck]) => ck === k && (u - cu) * dir > 0 && Math.abs(u - cu) < LEE);
};

const [ox, oy] = fromUV(0, 40), [ux, uy] = fromUV(1, 40), DU = [ux - ox, uy - oy];

export const windDir = (dir) => [DU[0] * dir, DU[1] * dir];
export function windPush(t, x, y) {
  const g = gustAt(t);
  if (g.phase !== 'gust') return [0, 0];
  const [u, v] = toUV(x, y);
  if (ledgeOf(v) < 0 || sheltered(u, v, g.dir)) return [0, 0];
  return [DU[0] * PUSH * g.dir, DU[1] * PUSH * g.dir];
}

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);

const onRamp = (u, v) => RAMP_U.findIndex((ru, k) => Math.abs(u - ru) < RAMP_HALF && v <= LEDGES[k] && v >= LEDGES[k + 1]);
const onLedge = (u, v) => Math.abs(u) < LEDGE_U ? ledgeOf(v) : -1;
const inGrass = (u, k) => GRASS.some(([a, b, gk]) => gk === k && u >= a && u <= b);
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), r = onRamp(u, v);
  if (r >= 0) { const f = (LEDGES[r] - v) / (LEDGES[r] - LEDGES[r + 1]); return LEDGE_H(r) + f * (LEDGE_H(r + 1) - LEDGE_H(r)); }
  const k = onLedge(u, v);
  if (k >= 0) return LEDGE_H(k);
  
  return Math.max(0, 0.2 + (54 - v) * 0.2) + U.fbm(x * 0.15, y * 0.15, 911) * 0.4;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (onRamp(u, v) >= 0) return T.PATH;
  const k = onLedge(u, v);
  if (k < 0) return T.CLIFF;
  return inGrass(u, k) ? T.TALL : (Math.floor(u * 0.5) + k) % 2 ? T.ROCK : T.GRASS; 
}

export function generateGaleLedges() { const it = galeLedgesSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* galeLedgesSteps() {
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
  W.wind = windPush; W.gustAt = gustAt; W.windDir = windDir; 
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - GATE.x, y - GATE.y) > 1.8;
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  { const p = at(-6.0, 51.1); addObj(W, { kind: 'ladder', x: p.x, y: p.y, solid: 0, rot: uvRot(0, 1) }); } 
  const crags = CRAGS.map(([u, k]) => at(u, LEDGES[k] - 0.6)); 
  for (const p of crags) addObj(W, { kind: 'crag', x: p.x, y: p.y, solid: 0.55, s: 1.1, rot: p.x, v: Math.floor(p.x) % 4 });
  for (const [u, v] of [[-7.6, 51.0], [-4.4, 51.0], [-1.4, 32.9], [0.8, 32.9]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  yield 'buildings';
  const r = U.rng(9191), busy = (x, y) => Math.hypot(x - GATE.x, y - GATE.y) < 2.2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - LANDING.x, y - LANDING.y) < 1.8 || crags.some((c) => Math.hypot(x - c.x, y - c.y) < 1.4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    if (t === T.CLIFF) { if (k < 0.05) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); continue; }
    if (t === T.TALL) { if (k < 0.05) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; }
    if (t === T.GRASS && k < 0.05) addObj(W, { kind: 'flower', x, y, solid: 0, c: s < 0.5 ? '#ffffff' : '#a8d8ff' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(9292);
  for (let t = 0; W.spots.length < 3 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'gl' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
