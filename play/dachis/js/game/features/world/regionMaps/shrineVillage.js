








import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard, fruitGrove } from '../dressing.js';

export const ID = 'shrine-village';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'shrine-village', name: 'Shrine Village — Temple of the Priest Dachis', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const TEMPLE = { ...at(0, 33.0), s: 1.25 };
export const YARD = at(0, 39.4);          
export const SHRINE_AT = at(0, 37.4);     
export const CEREMONY_R = 2.6;
export const GATE = at(-0.6, 50.0);       
export const ENTRY = GATE;
export const TORII = { ...at(-0.3, 47.8), s: 1.2 }; 
export const SPRING = at(4.0, 40.8);
export const LANDING = at(2.6, 42.2);     

export const POSTS = { priest: at(0, 36.4), acolytes: [at(-1.7, 37.2), at(1.7, 37.2)] };
export const HOME_DISC = { ...at(0, 41.2), r: 6.5 };

export const LANE = [[-0.6, 51.4], [-0.1, 48.8], [0.6, 46.2], [-0.2, 43.4], [0, 39.4]].map(([u, v]) => { const p = at(u, v); return [p.x, p.y]; });
const LANTERNS = [46.0, 44.0, 42.0].flatMap((v, k) => [[-1.5 + (k % 2) * 0.1, v], [1.5 - (k % 2) * 0.1, v]]);


const HUTS = [
  [-4.3, 47.6, 1.4], [4.4, 46.0, 1.5], [-5.8, 41.6, 1.45], [6.9, 37.6, 1.4],
  [-7.6, 35.8, 1.55], [9.4, 43.0, 1.4], [-10.4, 45.2, 1.5], [11.2, 36.6, 1.35],
];
const ROOFS = ['#8a5ac8', '#5a8ac8', '#c85a8a', '#7a62c0', '#4f7fc0', '#b85a90', '#6a6ad0', '#c86a9a'];
const BEDS = [[-3.0, 35.4], [3.0, 35.4], [-3.6, 43.6], [3.2, 37.8]];
export const HUT_SPOTS = HUTS.map(([u, v, sc]) => ({ ...at(u, v), s: sc, face: YARD }));

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const templeD = (x, y) => Math.hypot(x - TEMPLE.x, y - TEMPLE.y);
export const BASE_H = 0.4;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), depth = Math.max(...SECTIONS.map((s) => edgeDepth(s.rect, u, v).depth));
  
  const terrace = U.clamp((35.6 - v) / 1.0, 0, 1) * 0.3 * (Math.abs(u) < 6 ? 1 : U.clamp((8 - Math.abs(u)) / 2, 0, 1));
  return BASE_H + U.fbm(x * 0.08, y * 0.08, 61) * 0.3 + terrace + Math.max(0, 2 - depth) * 0.7;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (Math.abs(u) < 4.2 && v > 30.4 && v < 36.0) return T.PLAZA; 
  if (Math.hypot(x - YARD.x, y - YARD.y) < 3.6 + U.fbm(x * 0.4, y * 0.4, 9) * 1.2) return T.PLAZA;
  return U.fbm(x * 0.12, y * 0.12, 23) > 0.66 ? T.ROCK : T.GRASS;
}

export function generateShrineVillage() { const it = shrineVillageSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* shrineVillageSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const spokes = [{ pts: LANE.map((p) => [...p]), half: 0.5 }];
  const huts = HUT_SPOTS.map((p, i) => {
    const F = p.face, rot = Math.atan2(F.x - p.x, F.y - p.y), out = 1.15 * p.s, door = [p.x + Math.sin(rot) * out, p.y + Math.cos(rot) * out];
    
    const ux = door[0] - YARD.x, uy = door[1] - YARD.y, ul = Math.hypot(ux, uy), edge = [YARD.x + ux / ul * 3.4, YARD.y + uy / ul * 3.4];
    const lane = nearestOn(LANE, door[0], door[1]);
    const from = Math.hypot(lane[0] - door[0], lane[1] - door[1]) < Math.hypot(edge[0] - door[0], edge[1] - door[1]) ? lane : edge;
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
  
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && toUV(x, y)[1] > 38.6 && Math.hypot(x - GATE.x, y - GATE.y) > 1.8;
  
  addObj(W, { kind: 'temple', x: TEMPLE.x, y: TEMPLE.y, solid: 1.9 * TEMPLE.s, rot: Math.PI / 4, s: TEMPLE.s });
  {
    const [ax, ay] = LANE[0], [bx, by] = LANE[1], L = Math.hypot(bx - ax, by - ay);
    addObj(W, { kind: 'gate', x: TORII.x, y: TORII.y, solid: 0, rot: Math.atan2((bx - ax) / L, (by - ay) / L), s: TORII.s });
  }
  for (const [u, v] of LANTERNS) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  for (const h of huts) {
    addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
    const a = h.rot - 0.55; addObj(W, { kind: 'torch', x: h.x + Math.sin(a) * 2.0, y: h.y + Math.cos(a) * 2.0, solid: 0.15 });
  }
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  BEDS.forEach(([u, v], k) => { const p = at(u, v); addObj(W, { kind: 'bed', x: p.x, y: p.y, solid: 0.45, rot: k * 1.3, seed: 40 + k }); });
  
  for (const side of [-1, 1]) {
    for (const [u, v] of [[side * 2.4, 35.9], [side * 1.6, 50.2]]) { const p = at(u, v); addObj(W, { kind: 'torch', x: p.x, y: p.y, solid: 0.15 }); }
    const q = at(side * 2.4, 51.6); addObj(W, { kind: 'rimstone', x: q.x, y: q.y, solid: 0.4, s: 1.6, rot: side * 1.3, v: side > 0 ? 1 : 2 });
  }
  
  
  {
    const dr = U.rng(6363), segOk = (x, y, r) => spokes.every((sp) => sp.pts.every((p, k) => k === 0 || segDist(sp.pts[k - 1], p, x, y) > sp.half + 0.3 + r));
    const dclear = (x, y, r) => segOk(x, y, r) && Math.hypot(x - YARD.x, y - YARD.y) > 4.2 + r && Math.hypot(x - GATE.x, y - GATE.y) > 2.6 + r
      && templeD(x, y) > 3.0 * TEMPLE.s + r && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r && Math.hypot(x - TORII.x, y - TORII.y) > 1.8 + r
      && Math.hypot(x - LANDING.x, y - LANDING.y) > 1.2 + r && huts.every((h) => Math.hypot(x - h.door[0], y - h.door[1]) > 0.9 + r);
    guardHuts(W, huts);
    placeYard(W, 'well', at(-7.4, 44.8), { clear: dclear });
    placeYard(W, 'cookfire', at(7.6, 41.2), { clear: dclear });
    placeYard(W, 'washline', at(-8.8, 39.4), { rot: 0.3, clear: dclear });
    placeYard(W, 'bowl', at(-2.8, 36.4), { clear: dclear, extra: { c: '#fff8ec' } });
    placeYard(W, 'bowl', at(2.8, 36.4), { clear: dclear, extra: { c: '#fff8ec' } });
    dressHuts(W, huts, { rng: dr, kinds: ['pots', 'bowl', 'basket', 'tools', 'strawbed', 'crates', 'toys'], food: ['#fff8ec', '#e03a3a', '#f0b030'], clear: dclear });
    fruitGrove(W, at(-12.0, 41.0), 'appletree', { rng: dr, clear: dclear, falls: 3 });
    fruitGrove(W, at(12.4, 41.4), 'mango', { rng: dr, clear: dclear });
    fruitGrove(W, at(6.6, 49.0), 'appletree', { rng: dr, clear: dclear });
  }
  yield 'buildings';
  const r = U.rng(6161);
  const clear = (x, y, d) => Math.hypot(x - YARD.x, y - YARD.y) > 5.0 && Math.hypot(x - GATE.x, y - GATE.y) > 2.5 && templeD(x, y) > 3.4 * TEMPLE.s
    && Math.hypot(x - SPRING.x, y - SPRING.y) > 2.2 && Math.hypot(x - TORII.x, y - TORII.y) > 2.0
    && huts.every((h) => Math.hypot(x - h.x, y - h.y) > 2.4 && Math.hypot(x - h.door[0], y - h.door[1]) > 1.6)
    && spokes.every((s) => s.pts.every((p, k) => k === 0 || segDist(s.pts[k - 1], p, x, y) > s.half + d));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { if (k < 0.45) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (!clear(x, y, 0.6)) continue;
    const [u, v] = toUV(x, y), edge = edgeDepth(SECTIONS[0].rect, u, v).depth;
    if (edge < 3.4) { if (k < 0.32) addObj(W, { kind: k < 0.14 ? 'blossom' : 'bush', x, y, solid: k < 0.14 ? 0.35 : 0.3, s: 0.9 + s * 0.6, rot }); continue; }
    if (k < 0.045) addObj(W, { kind: 'blossom', x, y, solid: 0.35, s: 1.0 + s * 0.45, rot });
    else if (k < 0.09) addObj(W, { kind: 'bush', x, y, solid: 0.3, s: 0.7 + s * 0.5, rot });
    else if (k < 0.15) addObj(W, { kind: 'flower', x, y, solid: 0, s: 0.8 + s * 0.4, rot, c: ['#ffffff', '#ff9fd0', '#ffd1e8', '#b9a0ff'][Math.floor(s * 4)] });
    else if (t === T.ROCK && k < 0.19) addObj(W, { kind: 'rock', x, y, solid: 0.35, s: 0.5 + s * 0.6, rot });
  }
  yield 'props';
  buildGrid(W);
  yield 'grid';
  const rs = U.rng(6262);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || !clear(x, y, 0.3)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'sv' + W.spots.length, x, y, item: rs() < 0.6 ? 'tonic' : 'candy' });
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
