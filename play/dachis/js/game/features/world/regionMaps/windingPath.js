















import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid, HOME } from '../mapgen.js';
import { fenceGuards } from '../functional.js';
import * as village from './kazanVillage.js';

export const ID = 'winding-path';
export const SIZE = 80;
export const SECTIONS = addSections([
  
  { id: 'winding-top', name: 'Mt. Kazan — The Winding Path', rect: { u: [-18, 18], v: [26, 61.2] }, zoom: 8.5, wall: 2.0, region: ID },
  { id: 'winding-foot', name: 'Mt. Kazan — The Lower Slopes', rect: { u: [-18, 18], v: [61.2, 82] }, zoom: 8.5, wall: 2.0, region: ID },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const smooth = (t) => t * t * (3 - 2 * t);
const DOWNHILL = Math.atan2(...fromUV(0, 1)); 




export const EDGE = [36, 47, 60];
export const BANK = 2.5, BANK_H = 1.6, SHELF_FALL = 0.05;
export const SHELF_TOP = [26, 38.5, 49.5, 62.5]; 
const SHELF_H = [7.4, 5.8, 4.2, 2.6];

export const edgeV = (k, u) => EDGE[k] + 0.55 * Math.sin(u * 0.21 + k * 2.1) + (U.fbm(u * 0.15, k * 7.3, 601) - 0.5) * 0.5;

export const STAIR_U = [11.5, -12, 12];
const STAIR_HALF = 1.25;

export function shelfOf(u, v) {
  for (let k = 0; k < EDGE.length; k++) {
    const e = edgeV(k, u);
    if (v < e) return k;
    if (v < e + BANK) return -1 - k;
  }
  return EDGE.length;
}
const shelfH = (k, v) => SHELF_H[k] - Math.max(0, v - SHELF_TOP[k]) * SHELF_FALL;


export const TOP = at(-10, 28.6);        
export const TOP_ARRIVE = at(-8.6, 30.8); 
export const BOTTOM = at(1.0, 80.3);     
export const BOTTOM_ARRIVE = at(0.2, 78.0);
const stairHead = (k) => [STAIR_U[k], edgeV(k, STAIR_U[k]) - 0.9];
const stairFoot = (k) => [STAIR_U[k], edgeV(k, STAIR_U[k]) + BANK + 0.9];


export const ROAD_UV = [
  [-10, 28.6], [-6.5, 30.6], [0, 32.0], [6.5, 33.0], [9.6, 33.9], stairHead(0), stairFoot(0),
  [6.4, 40.6], [1, 42.3], [-5, 43.3], [-9.6, 44.6], stairHead(1), stairFoot(1),
  [-7, 52.6], [0, 54.8], [6.5, 56.6], [9.8, 57.6], stairHead(2), stairFoot(2),
  [7, 65.4], [0, 67.4], [-5, 69.6], [-5.5, 72.6], [-2, 75.8], [0.2, 78.0], [1.0, 80.3],
];
export const ROAD = ROAD_UV.map(([u, v]) => fromUV(u, v));
export const ROAD_HALF = 0.6;
function segD(ax, ay, bx, by, x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}
const lineD = (pts, x, y) => { let m = Infinity; for (let k = 1; k < pts.length; k++) m = Math.min(m, segD(...pts[k - 1], ...pts[k], x, y)); return m; };
const roadD = (x, y) => lineD(ROAD, x, y);




export const RILL_UV = [[2.6, 36.9], [2.1, 39.0], [1.2, 41.6], [0.6, 44.0], [0.0, 46.4], [-0.4, 48.4], [-0.7, 50.0], [-0.9, 51.2]];
export const RILL = RILL_UV.map(([u, v]) => fromUV(u, v));
export const POOL = { ...at(-0.9, 51.4), r: 1.5 };
const RILL_HALF = 0.6, ROAD_DRY = 0.8; 
const lavaAt = (x, y) => roadD(x, y) >= ROAD_DRY && (lineD(RILL, x, y) < RILL_HALF || Math.hypot(x - POOL.x, y - POOL.y) < POOL.r);

export const CROSSING = (() => {
  let best = null;
  for (let k = 1; k < ROAD.length; k++) {
    const [ax, ay] = ROAD[k - 1], [bx, by] = ROAD[k], L = Math.hypot(bx - ax, by - ay);
    for (let t = 0; t <= L; t += 0.05) {
      const x = ax + (bx - ax) * t / L, y = ay + (by - ay) * t / L, d = lineD(RILL, x, y);
      if (!best || d < best.d) best = { d, x, y, rot: Math.atan2(bx - ax, by - ay) };
    }
  }
  return best;
})();


export const VENTS = [[-12.5, 31.4], [-3.0, 34.2], [8.6, 29.8], [14.6, 32.0], [-14.6, 40.6], [8.8, 44.6], [-4.2, 45.6],
  [4.8, 51.6], [14.0, 54.2], [-15.0, 58.0], [12.4, 68.0]].map(([u, v]) => at(u, v));
const ventD = (x, y) => Math.min(...VENTS.map((p) => Math.hypot(x - p.x, y - p.y)));
const MOUTH_U = -5;
export const MOUTH = at(MOUTH_U, edgeV(1, MOUTH_U) + BANK + 0.45);  
export const MOUTH_ARRIVE = at(MOUTH_U, edgeV(1, MOUTH_U) + BANK + 2.3); 
const MOUTH_PATH = [fromUV(MOUTH_U, edgeV(1, MOUTH_U) + BANK + 0.2), fromUV(MOUTH_U + 0.4, 53.3)];

export const DWELLERS = [
  { id: 'winding-v0', home: { ...at(7.4, 45.0), r: 2.0 }, lines: [
    "Breathe through your nose, kid. It's worse through the nose, but at least you don't TASTE it.",
    "I scrape the yellow off the vents. The potters on the coast pay for it in fish. Mostly fish. One time a hat. Don't ask about the hat."] },
  { id: 'winding-v1', home: { ...at(-8.6, 55.2), r: 2.0 }, lines: [
    'That hole in the bank breathes warm air all night. My husband swore it goes under the whole mountain. My husband swore a lot of things.',
    "The lava moved last spring. Used to come down the other side. Now we've got a bridge. The mountain doesn't ask, you just build."] },
];
export const SPRING = at(-13.6, 54.2);   
export const LANDING = at(-12.2, 55.4);


const RECT = { u: [-18, 18], v: [26, 82] };
const WALL = 2.0;

const depthIn = (u, v) => Math.min(u - RECT.u[0], RECT.u[1] - u, v - RECT.v[0], RECT.v[1] - v);
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), s = shelfOf(u, v);
  let h;
  if (s >= 0) h = shelfH(s, v);
  else { 
    const k = -1 - s, e = edgeV(k, u), t = U.clamp((v - e) / BANK, 0, 1);
    h = U.lerp(shelfH(k, e), shelfH(k + 1, e + BANK), smooth(smooth(t)));
  }
  h += (U.fbm(x * 0.2, y * 0.2, 603) - 0.5) * 0.14;
  
  const dr = Math.min(lineD(RILL, x, y), Math.max(0, Math.hypot(x - POOL.x, y - POOL.y) - POOL.r + 0.6));
  if (dr < 1.1 && roadD(x, y) > 0.9) h -= 0.3 * smooth(U.clamp(1 - dr / 1.1, 0, 1));
  
  const back = Math.min(v - RECT.v[0], u - RECT.u[0], RECT.u[1] - u);
  if (back < 3) h += (3 - back) * 0.9 * (v < 66 ? 1 : 0.4);
  return h;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), rd = roadD(x, y);
  if (depthIn(u, v) < WALL + (U.fbm(x * 0.25, y * 0.25, 605) - 0.5) * 1.2 && rd > 1.5) return v > 66 ? T.WOOD : T.CLIFF;
  if (lavaAt(x, y)) return T.LAVA;
  const s = shelfOf(u, v);
  if (s < 0) return Math.abs(u - STAIR_U[-1 - s]) < STAIR_HALF ? T.ROCK : T.CLIFF;
  if (ventD(x, y) < 1.0) return T.SAND; 
  const n = U.fbm(x * 0.3, y * 0.3, 607);
  if (s === 0) return n > 0.72 ? T.SAND : T.ROCK;
  if (s === 1) return n > 0.76 ? T.SAND : n < 0.3 ? T.GRASS : T.ROCK;
  if (s === 2) return n < 0.42 ? T.GRASS : T.ROCK;
  const g = n + (v - SHELF_TOP[3]) / 19.5 * 0.55; 
  return g > 0.9 ? T.JUNGLE : g > 0.62 ? T.GLADE : g > 0.36 ? T.GRASS : T.ROCK;
}

export function generateWindingPath() { const it = windingPathSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* windingPathSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  carvePath(W, W.type, ROAD);
  carvePath(W, W.type, MOUTH_PATH);
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.ROCK; 
  mapQueries(W);
  buildGrid(W); 
  W.reach = floodReach(W, W.type, TOP_ARRIVE);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: ROAD.map((p) => [...p]), half: ROAD_HALF }, { pts: MOUTH_PATH.map((p) => [...p]), half: 0.45 }];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad);
  W.lavaCrossing = { x: CROSSING.x, y: CROSSING.y };
  placeBuilt(W);
  yield 'buildings';
  placeNature(W);
  yield 'props';
  buildGrid(W);
  yield 'grid';
  const rs = U.rng(6262);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || roadD(x, y) < 1.4 || !W.onScreen(x, y, -1)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 7) || Math.hypot(x - TOP.x, y - TOP.y) < 3 || Math.hypot(x - MOUTH.x, y - MOUTH.y) < 3) continue;
    W.spots.push({ id: 'wp' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


function placeBuilt(W) {
  
  STAIR_U.forEach((su, k) => {
    const e = edgeV(k, su);
    let i = 0;
    for (let v = e - 0.15; v <= e + BANK + 0.15; v += 0.5) { const p = at(su, v); addObj(W, { kind: 'step', x: p.x, y: p.y, solid: 0, rot: DOWNHILL, i: i++, flavor: 'basalt' }); }
    
    for (const side of [-1, 1]) { const p = at(su + side * (STAIR_HALF + 0.35), e - 0.2); addObj(W, { kind: 'basalt', x: p.x, y: p.y, solid: 0.3, rot: k + side, s: 0.75 }); }
  });
  
  addObj(W, { kind: 'bridge', x: CROSSING.x, y: CROSSING.y, solid: 0, rot: CROSSING.rot });
  
  
  
  
  let ring = 0;
  const CLEAR = ROAD_HALF + 0.65;
  const run = [], flush = () => { if (run.length >= 3) { ring++; run.forEach((p, n) => addObj(W, { kind: 'fence', x: p.x, y: p.y, solid: 0.12, ring: 'rail-' + ring, k: n, n: 0, open: true })); } run.length = 0; };
  const postOk = (x, y) => roadD(x, y) >= CLEAR && W.walkable(x, y, 0.15) && fenceGuards(W, { kind: 'fence', x, y }) && Math.hypot(x - MOUTH.x, y - MOUTH.y) > 2.2;
  for (let k = 0; k < EDGE.length; k++) {
    for (let u = -15.5; u <= 15.5; u += 0.9) {
      const v = edgeV(k, u) - 0.45, p = at(u, v);
      const keep = Math.abs(u - STAIR_U[k]) > STAIR_HALF + 0.9 && roadD(p.x, p.y) < 3.2 && postOk(p.x, p.y);
      if (keep) run.push(p); else flush();
    }
    flush();
  }
  
  for (const side of [-1, 1]) {
    for (let k = 1; k < ROAD.length; k++) {
      const [ax, ay] = ROAD[k - 1], [bx, by] = ROAD[k], L = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / L, dy = (by - ay) / L;
      for (let t = 0.3; t < L - 0.3; t += 0.6) {
        const x = ax + dx * t - dy * side * CLEAR, y = ay + dy * t + dx * side * CLEAR;
        const hot = [0.5, 0.9, 1.3].some((q) => lavaAt(x - dy * side * q, y + dx * side * q));
        const nearBridge = Math.hypot(x - CROSSING.x, y - CROSSING.y) < 1.25; 
        if (hot && !nearBridge && postOk(x, y)) run.push({ x, y }); else flush();
      }
      flush();
    }
  }
  
  for (const [g, du] of [[ROAD_UV[0], 1.5], [ROAD_UV[ROAD_UV.length - 1], 1.6]]) for (const side of [-1, 1]) {
    const c = at(g[0] + side * du, g[1]), t = at(g[0] + side * (du + 0.7), g[1] + 0.5);
    addObj(W, { kind: 'basalt', x: c.x, y: c.y, solid: 0.3, rot: side, s: 0.9 });
    addObj(W, { kind: 'torch', x: t.x, y: t.y, solid: 0.15 });
  }
  
  const mo = at(MOUTH_U, edgeV(1, MOUTH_U) + BANK - 0.35);
  addObj(W, { kind: 'tubemouth', x: mo.x, y: mo.y, solid: 0, rot: Math.PI / 4 });
  for (const side of [-1, 1]) { const p = at(MOUTH_U + side * 1.3, edgeV(1, MOUTH_U) + BANK + 0.5); addObj(W, { kind: 'torch', x: p.x, y: p.y, solid: 0.15 }); }
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
}



function shadesKid(W, x, y) {
  const [u, v] = toUV(x, y);
  for (let back = 1.0; back <= 2.2; back += 0.4) for (const side of [-0.4, 0, 0.4]) {
    const [bx, by] = fromUV(u + side, v - back), i = Math.floor(bx), j = Math.floor(by);
    if (W.inMap(i, j) && W.reach[W.idx(i, j)] && W.walkable(bx, by, 0)) return true;
  }
  return false;
}
const SCRUB_FLOWERS = ['#e8c45a', '#d88a4a', '#c8d070'];
function placeNature(W) {
  const r = U.rng(6161), N = W.N;
  const near = (x, y, kinds, d) => W.objects.some((o) => kinds.includes(o.kind) && Math.hypot(x - o.x, y - o.y) < d);
  const free = (x, y, d = 1.3) => roadD(x, y) > d && Math.hypot(x - MOUTH.x, y - MOUTH.y) > 2.0 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.6 &&
    lineD(W.paths[1].pts, x, y) > 1.0 && !near(x, y, ['step', 'fence', 'bridge', 'basalt', 'torch'], 0.9) && !lavaAt(x, y);
  
  for (const p of VENTS) {
    addObj(W, { kind: 'vent', x: p.x, y: p.y, solid: 0, rot: r() * 6.28, s: 0.9 + r() * 0.35 });
    for (let q = 0; q < 3; q++) { const a = r() * 6.28, x = p.x + Math.cos(a) * 0.7, y = p.y + Math.sin(a) * 0.7; if (free(x, y, 1.0)) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.25 + r() * 0.15, rot: r() * 6.28, flavor: 'sulfur' }); }
  }
  
  const flowAt = (u, v, rot, s) => { const p = at(u, v); if (free(p.x, p.y, 1.1)) addObj(W, { kind: 'flow', x: p.x, y: p.y, solid: 0, rot, s }); };
  const downhill = DOWNHILL;
  flowAt(3.6, 37.4, downhill + 0.3, 1.1); flowAt(1.6, 37.6, downhill - 0.4, 0.9);
  flowAt(-2.9, 51.2, downhill - 1.0, 1.2); flowAt(1.3, 52.2, downhill + 0.9, 1.0); flowAt(-0.6, 53.1, downhill, 0.9);
  
  for (let got = 0, t = 0; got < 6 && t < 3000; t++) {
    const u = -15 + r() * 30, v = 28 + r() * 36, p = at(u, v), s = shelfOf(u, v);
    if (s < 0 || s > 2 || !free(p.x, p.y, 2.0) || W.tileType(p.x, p.y) === T.LAVA || near(p.x, p.y, ['flow', 'vent'], 2.6)) continue;
    addObj(W, { kind: 'flow', x: p.x, y: p.y, solid: 0, rot: downhill + (r() - 0.5) * 0.6, s: 0.9 + r() * 0.5 }); got++;
  }
  
  
  for (let k = 0; k < EDGE.length; k++) for (let u = -16 + r(); u < 16; u += 0.9 + r() * 0.9) {
    const p = at(u, edgeV(k, u) + BANK - 0.3 - r() * 0.3);
    if (r() < 0.3 || Math.abs(u - STAIR_U[k]) < STAIR_HALF + 1.2 || (k === 1 && Math.abs(u - MOUTH_U) < 2.4)) continue;
    if (roadD(p.x, p.y) < 1.6 || [0, 0.8, 1.6].some((q) => lavaAt(...fromUV(u + q - 0.8, toUV(p.x, p.y)[1]))) || !W.onScreen(p.x, p.y, 1.2, 2.6)) continue;
    addObj(W, { kind: 'basalt', x: p.x, y: p.y, solid: 0.3, rot: r() * 6.28, s: 0.6 + r() * 0.5 });
  }
  
  
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.2 + r() * 0.6, y = j + 0.2 + r() * 0.6, k = r(), s = r(), rot = r() * 6.28;
    if (!W.onScreen(x, y, 1.2, 2.6)) continue;
    const [u, v] = toUV(x, y), sh = shelfOf(u, v), low = U.clamp((v - 30) / 48, 0, 1); 
    if (t === T.LAVA) continue;
    if (t === T.WOOD) { if (k < 0.3 && free(x, y, 2.4) && !shadesKid(W, x, y)) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 1.1 + s * 0.5, rot }); else if (k < 0.5 && free(x, y, 1.6)) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.8 + s * 0.4, rot }); continue; }
    if (t === T.CLIFF && depthIn(u, v) < WALL + 0.6) { if (k < 0.3 && free(x, y, 1.8)) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.2 + s * 1.2, rot, v: Math.floor(r() * 4) }); continue; }
    if (t === T.CLIFF) { 
      if (!free(x, y, 1.4)) continue;
      const foot = sh < 0 && v > edgeV(-1 - sh, u) + BANK - 0.7;
      if (foot && k < 0.16 && !shadesKid(W, x, y)) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.8 + s * 0.5, rot, dark: true });
      else if (k < 0.12) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.3 + s * 0.25, rot, dark: true, flavor: s < 0.2 ? 'sulfur' : undefined });
      else if (k < 0.12 + 0.12 * low) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.45 + s * 0.3, rot, flavor: 'scrub' });
      continue;
    }
    if (!free(x, y, 1.35)) continue;
    const tall = !shadesKid(W, x, y);
    if (t === T.SAND) { if (k < 0.1) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.25 + s * 0.2, rot, flavor: 'sulfur' }); continue; }
    if (t === T.ROCK) {
      if (k < 0.03 && tall && sh <= 2 && !near(x, y, ['basalt', 'obsidian'], 3)) { addObj(W, { kind: k < 0.015 ? 'basalt' : 'obsidian', x, y, solid: 0.3, rot, s: 0.7 + s * 0.4 }); continue; }
      if (k < 0.12) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.25 + s * 0.25, rot, dark: true }); 
      else if (k < 0.12 + 0.1 * low) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.45 + s * 0.3, rot, flavor: 'scrub' });
      continue;
    }
    if (t === T.GRASS) {
      if (k < 0.1) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.3, rot, flavor: 'scrub' });
      else if (k < 0.16) addObj(W, { kind: 'bush', x, y, solid: 0, s: 0.6 + s * 0.3, rot, flavor: 'slope' });
      else if (k < 0.19) addObj(W, { kind: 'flower', x, y, solid: 0, c: SCRUB_FLOWERS[Math.floor(s * 3)] });
      else if (k < 0.23) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.3 + s * 0.3, rot, dark: s < 0.5 });
      continue;
    }
    if (t === T.GLADE || t === T.JUNGLE) {
      if (k < 0.05 && tall && free(x, y, 2.2)) addObj(W, { kind: 'jtree', x, y, solid: 0.4, s: 0.9 + s * 0.4, rot });
      else if (k < 0.2) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot });
      else if (k < 0.26) addObj(W, { kind: 'bush', x, y, solid: 0, s: 0.6 + s * 0.35, rot });
      else if (k < 0.29) addObj(W, { kind: 'flower', x, y, solid: 0, c: SCRUB_FLOWERS[Math.floor(s * 3)] });
    }
  }
}


export const MANIFEST = {
  order: 3.5,
  
  region: {
    id: ID, name: 'The Winding Path', chapters: [1], size: SIZE, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: TOP_ARRIVE, spring: LANDING, home: TOP_ARRIVE,
    pack: 'assets/scenery-winding-path.bin', 
    transit: false, objective: null,
  },
  generate: generateWindingPath, steps: windingPathSteps,
  doors: [
    
    { id: 'village-out', region: village.ID, at: village.GATE, to: ID, toAt: TOP_ARRIVE, label: 'Down the mountain', after: null },
    { id: 'winding-village', region: ID, at: TOP, to: village.ID, toAt: village.ARRIVE_FROM_PATH, label: 'Up to Kazan Village', after: null },
    { id: 'winding-down', region: ID, at: BOTTOM, to: HOME, toAt: fromUVxy(1.9, 58.3), label: 'Into the jungle', after: null },
    
    
    { id: 'winding-up', region: HOME, at: fromUVxy(-0.68, 56.0), r: 1.9, auto: true, to: ID, toAt: BOTTOM_ARRIVE, label: 'Up the mountain', after: null },
  ],
  perches: [
    { id: 'winding-path', region: ID, name: 'Sulfur Spring', at: LANDING, opens: 'boss_ashlo', respawn: null },
  ],
  place: { name: 'The Winding Path', at: [0.69, 0.21], r: 0.04, glyph: 'volcano' }, 
  kind: 'peak',
  ground: { 'winding-top': 'descent', 'winding-foot': 'descent' },
  
  palettes: {
    descent: { rock: ['#6e625c', '#8a7c72'], cliff: ['#3a3034', '#54484a'], sand: ['#b8a040', '#d4c05a'], grass: ['#7c7e40', '#9a9852'],
      glade: ['#4c7a3c', '#66944a'], jungle: ['#2e6e36', '#3f8a40'], wood: ['#2a6a30', '#3a843a'], path: ['#b8a088', '#ecdcc4'] },
  },
  ambience: { 'winding-top': { wind: 0.7, rumble: 0.6 }, 'winding-foot': { wind: 0.4, birds: 0.4, bugs: 0.3 } },
  people: { rng: 515, kinds: { stage: 1, types: ['Ember', 'Stone'] }, gap: 1.2, dwellers: DWELLERS },
  beats: {
    'winding-top': [
      ['narr', "Past the gate the road just drops off the mountain, ledge after ledge, and there's a smell coming up it like a carton of eggs somebody forgot about."],
      ['kid', "(Eww. Okay. That's the volcano. That's the VOLCANO, breathing. And I'm walking down it. Cool. Totally cool.)"],
    ],
  },
};
function fromUVxy(u, v) { const [x, y] = fromUV(u, v); return { x, y }; }
