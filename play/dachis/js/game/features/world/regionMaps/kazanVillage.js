







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'kazan-village';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'village', name: 'Kazan Village — Atop Mt. Kazan', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };


export const PLAZA = at(0, 41);
export const CRATER = { ...at(0, 31.5), r: 3.2 }; 
export const CRATER_FENCE = CRATER.r + 0.9;
export const GATE = at(-0.6, 50.0); 
export const ENTRY = GATE;
export const SPRING = at(3.4, 38.4); 
export const SPAWN = at(0.6, 44.6);  
export const LANDING = at(2.0, 40.0); 

export const POSTS = { elder: at(-0.6, 41.6), kumabo: at(1.4, 42.4) };
export const HOME_DISC = { ...PLAZA, r: 7.5 };


export const LANE = [[0, 51.4], [-1.3, 49.2], [0.9, 46.6], [-0.5, 44.0], [0, 41]].map(([u, v]) => { const p = at(u, v); return [p.x, p.y]; });





const HUTS = [
  [-4.0, 49.8, 1.4], [3.7, 48.1, 1.55], [-4.1, 45.3, 1.5], [4.5, 43.8, 1.4],
  [-4.6, 38.6, 1.45], [7.0, 39.4, 1.45], [-8.4, 41.8, 1.4], [9.9, 44.8, 1.5], [-9.0, 36.4, 1.6], [12.2, 40.0, 1.35], [-12.4, 44.6, 1.4],
];
const ROOFS = ['#d8a24a', '#c98a3e', '#e0b460', '#c49040', '#d89a52', '#c8783a', '#e0a848', '#b88a40', '#d0964a', '#c48444', '#dcae58'];

const BEDS = [[-2.6, 36.9], [2.0, 36.6], [-3.4, 42.6], [5.4, 41.6], [-1.2, 35.9]];
export const HUT_SPOTS = HUTS.map(([u, v, sc], i) => ({ ...at(u, v), s: sc, face: i < 4 ? at(u * 0.15, v - 2.2) : PLAZA }));

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const craterD = (x, y) => Math.hypot(x - CRATER.x, y - CRATER.y);
export const BASE_H = 0.4;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), depth = Math.max(...SECTIONS.map((s) => edgeDepth(s.rect, u, v).depth));
  const c = craterD(x, y);
  
  const lip = c < CRATER.r ? -0.5 : Math.max(0, 1 - Math.abs(c - CRATER.r - 0.4) / 0.9) * 0.35;
  return BASE_H + U.fbm(x * 0.08, y * 0.08, 53) * 0.35 + lip + Math.max(0, 2 - depth) * 0.7;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (craterD(x, y) < CRATER.r) return T.LAVA;
  if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < 3.4 + U.fbm(x * 0.4, y * 0.4, 7) * 1.4) return T.PLAZA; 
  return U.fbm(x * 0.12, y * 0.12, 19) > 0.64 ? T.ROCK : T.GRASS;
}

export function generateKazanVillage() { const it = kazanVillageSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* kazanVillageSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  
  const spokes = [{ pts: LANE.map((p) => [...p]), half: 0.5 }];
  const huts = HUT_SPOTS.map((p, i) => {
    const F = p.face, rot = Math.atan2(F.x - p.x, F.y - p.y), out = 1.15 * p.s, door = [p.x + Math.sin(rot) * out, p.y + Math.cos(rot) * out];
    
    let from;
    if (F === PLAZA) { const ux = door[0] - PLAZA.x, uy = door[1] - PLAZA.y, ul = Math.hypot(ux, uy); from = [PLAZA.x + ux / ul * 3.4, PLAZA.y + uy / ul * 3.4]; }
    else from = nearestOn(LANE, door[0], door[1]);
    const bow = (i % 2 ? 1 : -1) * 0.5, dx = door[0] - from[0], dy = door[1] - from[1], dl = Math.hypot(dx, dy) || 1;
    const mid = [(from[0] + door[0]) / 2 - dy / dl * bow, (from[1] + door[1]) / 2 + dx / dl * bow];
    spokes.push({ pts: [from, mid, door], half: 0.28 });
    return { ...p, rot, i, door };
  });
  for (const s of spokes) carvePath(W, W.type, s.pts.map(([x, y]) => [x, y]));
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.PLAZA;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = spokes.map((s) => ({ pts: s.pts.map((p) => [...p]), half: s.half }));
  
  W.crater = { x: CRATER.x, y: CRATER.y, r: CRATER.r, h: BASE_H - 0.12, section: 'village' };
  
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && craterD(x, y) > CRATER_FENCE + 0.5 && Math.hypot(x - GATE.x, y - GATE.y) > 1.8;
  const r = U.rng(5151);
  for (const h of huts) {
    addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
    if (h.i % 2 === 0) { const a = h.rot + 0.8; addObj(W, { kind: 'bed', x: h.x + Math.sin(a) * 2.3, y: h.y + Math.cos(a) * 2.3, solid: 0.45, rot: h.rot, seed: h.i }); }
    
    const a = h.rot - 0.55; addObj(W, { kind: 'torch', x: h.x + Math.sin(a) * 2.0, y: h.y + Math.cos(a) * 2.0, solid: 0.15 });
  }
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  BEDS.forEach(([u, v], k) => { const p = at(u, v); addObj(W, { kind: 'bed', x: p.x, y: p.y, solid: 0.45, rot: k * 1.3, seed: 20 + k }); });
  for (const side of [-1, 1]) {
    const p = at(side * 1.6, 50.2); addObj(W, { kind: 'torch', x: p.x, y: p.y, solid: 0.15 });
    const q = at(side * 2.4, 51.6); addObj(W, { kind: 'rimstone', x: q.x, y: q.y, solid: 0.4, s: 1.6, rot: side * 1.3, v: side > 0 ? 1 : 2 });
  }
  
  const fn = Math.round(2 * Math.PI * CRATER_FENCE / 0.5);
  for (let k = 0; k < fn; k++) {
    const a = k / fn * 2 * Math.PI;
    addObj(W, { kind: 'fence', x: CRATER.x + Math.cos(a) * CRATER_FENCE, y: CRATER.y + Math.sin(a) * CRATER_FENCE, solid: 0.2, ring: 'crater', k, n: fn });
  }
  yield 'buildings';
  const clear = (x, y, d) => Math.hypot(x - PLAZA.x, y - PLAZA.y) > 5.2 && Math.hypot(x - GATE.x, y - GATE.y) > 2.5 && craterD(x, y) > CRATER_FENCE + 0.8
    && Math.hypot(x - SPRING.x, y - SPRING.y) > 2.2 && huts.every((h) => Math.hypot(x - h.x, y - h.y) > 2.4 && Math.hypot(x - h.door[0], y - h.door[1]) > 1.6) && spokes.every((s) => s.pts.every((p, k) => k === 0 || segDist(s.pts[k - 1], p, x, y) > s.half + d));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { if (k < 0.45) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (t === T.LAVA || !clear(x, y, 0.6)) continue;
    const [u, v] = toUV(x, y), edge = edgeDepth(SECTIONS[0].rect, u, v).depth;
    if (edge < 3.4) { if (k < 0.3) addObj(W, { kind: k < 0.12 ? 'palm' : 'bush', x, y, solid: k < 0.12 ? 0.35 : 0.3, s: 0.9 + s * 0.6, rot }); continue; }
    if (k < 0.035) addObj(W, { kind: 'tree', x, y, solid: 0.4, s: 1.0 + s * 0.5, rot });
    else if (k < 0.09) addObj(W, { kind: 'bush', x, y, solid: 0.3, s: 0.7 + s * 0.5, rot });
    else if (k < 0.16) addObj(W, { kind: 'flower', x, y, solid: 0, s: 0.8 + s * 0.4, rot, c: ['#fff7a8', '#ff9fd0', '#ffffff', '#b9a0ff'][Math.floor(s * 4)] });
    else if (t === T.ROCK && k < 0.2) addObj(W, { kind: 'rock', x, y, solid: 0.35, s: 0.5 + s * 0.6, rot });
  }
  yield 'props';
  buildGrid(W);
  yield 'grid';
  const rs = U.rng(5252);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || !clear(x, y, 0.3)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'kv' + W.spots.length, x, y, item: rs() < 0.6 ? 'tonic' : 'candy' });
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
