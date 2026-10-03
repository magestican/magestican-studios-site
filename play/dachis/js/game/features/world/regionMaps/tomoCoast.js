






import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'tomo-coast';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'tomo-coast', name: 'Tomo Coast', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, sea: true },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const ENTRY = at(-14.6, 40.0);       
export const SOUTH_GATE = at(3.0, 51.0);    
export const SPRING = at(-3.4, 36.6);
export const LANDING = at(-2.2, 37.8);
export const SCORCH = { ...at(3.0, 40.6), r: 1.6 }; 


export const shore = (v) => 5.0 + Math.sin(v * 0.31) * 2.2 + Math.sin(v * 0.83 + 1) * 0.7;
const SAND_W = 4.2;

export const LANE = [[-15.6, 40.0], [-11, 38.4], [-6.4, 40.2], [-2.0, 42.6], [1.2, 45.6], [2.4, 48.8], [3.0, 52.2]].map(([u, v]) => { const p = at(u, v); return [p.x, p.y]; });
const HUTS = [[-7.6, 34.6, 1.4], [-10.2, 45.8, 1.45], [-5.0, 48.8, 1.35]];
const ROOFS = ['#4fa0c8', '#c8784f', '#5ab0a0'];
export const HUT_SPOTS = HUTS.map(([u, v, sc]) => ({ ...at(u, v), s: sc }));

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const seaD = (u, v) => u - shore(v) + U.fbm(u * 0.3, v * 0.3, 71) * 0.8 - 0.4; 
export const BASE_H = 0.3;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), depth = Math.max(...SECTIONS.map((s) => edgeDepth(s.rect, u, v).depth)), d = seaD(u, v);
  if (d > 0) return -0.1 - Math.min(d, 4) * 0.16; 
  const sand = U.clamp(-d / SAND_W, 0, 1); 
  const h = 0.06 + sand * (BASE_H - 0.06) + U.fbm(x * 0.09, y * 0.09, 73) * 0.22 * sand;
  return h + Math.max(0, 2 - depth) * 0.7 * U.clamp(-d / 2, 0, 1); 
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), d = seaD(u, v);
  if (d > 0) return d < 1.4 ? T.SHALLOW : T.DEEP;
  if (!inside(u, v)) return T.CLIFF;
  if (d > -SAND_W) return T.SAND;
  return U.fbm(x * 0.14, y * 0.14, 79) > 0.6 ? T.TALL : T.GRASS; 
}

export function generateTomoCoast() { const it = tomoCoastSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* tomoCoastSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const spokes = [{ pts: LANE.map((p) => [...p]), half: 0.5 }];
  const huts = HUT_SPOTS.map((p, i) => {
    const door0 = nearestOn(LANE, p.x, p.y), rot = Math.atan2(door0[0] - p.x, door0[1] - p.y), out = 1.15 * p.s;
    const door = [p.x + Math.sin(rot) * out, p.y + Math.cos(rot) * out];
    spokes.push({ pts: [door0, door], half: 0.28 });
    return { ...p, rot, i, door };
  });
  for (const s of spokes) carvePath(W, W.type, s.pts.map(([x, y]) => [x, y]));
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.SAND;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = spokes.map((s) => ({ pts: s.pts.map((p) => [...p]), half: s.half }));
  for (const h of huts) {
    addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
    const a = h.rot - 0.55; addObj(W, { kind: 'torch', x: h.x + Math.sin(a) * 2.0, y: h.y + Math.cos(a) * 2.0, solid: 0.15 });
  }
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.3; addObj(W, { kind: 'rock', x: SCORCH.x + Math.cos(a) * SCORCH.r, y: SCORCH.y + Math.sin(a) * SCORCH.r, solid: 0.25, s: 0.45 + (k % 3) * 0.12, rot: a }); }
  for (const [u, v] of [[-16.4, 38.8], [-16.4, 41.2], [2.0, 51.6], [4.0, 51.6]]) { const p = at(u, v); addObj(W, { kind: 'torch', x: p.x, y: p.y, solid: 0.15 }); }
  yield 'buildings';
  const r = U.rng(7171);
  const laneD = (x, y) => Math.min(...spokes.map((s) => s.pts.reduce((m, p, k) => (k ? Math.min(m, segDist(s.pts[k - 1], p, x, y)) : m), Infinity)));
  const clear = (x, y, d) => Math.hypot(x - ENTRY.x, y - ENTRY.y) > 2.4 && Math.hypot(x - SOUTH_GATE.x, y - SOUTH_GATE.y) > 2.4
    && Math.hypot(x - SPRING.x, y - SPRING.y) > 2.2 && Math.hypot(x - SCORCH.x, y - SCORCH.y) > SCORCH.r + 0.8
    && huts.every((h) => Math.hypot(x - h.x, y - h.y) > 2.4 && Math.hypot(x - h.door[0], y - h.door[1]) > 1.6) && laneD(x, y) > 0.5 + d;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { if (k < 0.4) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (t === T.DEEP) continue;
    if (t === T.SHALLOW) { if (k < 0.05) addObj(W, { kind: 'coral', x, y, solid: 0, s: 0.5 + s * 0.4, rot }); continue; }
    if (!clear(x, y, 0.5)) continue;
    if (t === T.SAND) {
      if (k < 0.035) addObj(W, { kind: 'palm', x, y, solid: 0.25, s: 0.95 + s * 0.4, rot });
      else if (k < 0.06) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.5, rot });
      continue;
    }
    const [u, v] = toUV(x, y), edge = edgeDepth(SECTIONS[0].rect, u, v).depth;
    if (edge < 3.4) { if (k < 0.3) addObj(W, { kind: k < 0.14 ? 'palm' : 'bush', x, y, solid: k < 0.14 ? 0.3 : 0.3, s: 0.9 + s * 0.6, rot }); continue; }
    if (k < 0.03) addObj(W, { kind: 'palm', x, y, solid: 0.3, s: 1.0 + s * 0.4, rot });
    else if (k < 0.07) addObj(W, { kind: 'bush', x, y, solid: 0.3, s: 0.7 + s * 0.5, rot });
    else if (k < 0.12) addObj(W, { kind: 'flower', x, y, solid: 0, s: 0.8 + s * 0.4, rot, c: ['#fff7a8', '#ff9fd0', '#ffffff', '#ffb36b'][Math.floor(s * 4)] });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(7272);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || !clear(x, y, 0.3)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'tc' + W.spots.length, x, y, item: rs() < 0.6 ? 'tonic' : 'candy' });
  }
  return W;
}
function nearestOn(pts, x, y) {
  let best = null, bd = Infinity;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], dx = bx - ax, dy = by - ay, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    const p = [ax + dx * t, ay + dy * t], d = Math.hypot(p[0] - x, p[1] - y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}
