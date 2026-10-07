











import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { CELL } from '../basaltRules.js';
import { clearOfLanes } from '../functional.js';
import * as heartOfKazan from './heartOfKazan.js';

export const ID = 'kazan-galleries';
export const SIZE = 96;
const WT = ['Ember', 'Stone', 'Shadow'];
export const SECTIONS = addSections([
  { id: 'magma-galleries', name: 'The Heart of Kazan - The Magma Galleries', rect: { u: [-20, 20], v: [24, 62] }, zoom: 12, wall: 2.0, region: ID, chapter: 7, wildTypes: WT },
  { id: 'obsidian-rivers', name: 'The Heart of Kazan - The Obsidian Rivers', rect: { u: [-20, 20], v: [62, 98] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 7, wildTypes: WT },
  { id: 'cinder-cistern', name: 'The Heart of Kazan - The Cinder Cistern', rect: { u: [20, 44], v: [62, 86] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 7, train: true, wildTypes: ['Tide', 'Tide', 'Stone'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const xy = ([u, v]) => fromUV(u, v);


export const ISLANDS = {
  west: { u: -12, v: 31.5, ru: 6.2, rv: 5.6 },   
  across: { u: 11, v: 31.5, ru: 5.6, rv: 5.0 },  
  dead: { u: -11.5, v: 53.5, ru: 5.2, rv: 4.6 }, 
  far: { u: 11.5, v: 54.5, ru: 5.6, rv: 5.2 },   
};
export const NET = {
  nodes: {
    w1: { kind: 'dock', at: [-6.6, 34.4], island: 'west' },
    a1: { kind: 'dock', at: [6.0, 34.0], island: 'across' },
    d1: { kind: 'dock', at: [-6.8, 51.0], island: 'dead' },
    e1: { kind: 'dock', at: [6.8, 51.6], island: 'far' },
    j1: { kind: 'junction', at: [-0.4, 39.0], trunk: 'w1', branches: ['a1', 'j2'], lever: 'west' },
    j2: { kind: 'junction', at: [0.4, 46.0], trunk: 'j1', branches: ['d1', 'e1'], lever: 'across' },
  },
  rails: [
    { a: 'w1', b: 'j1', pts: [[-6.6, 34.4], [-3.4, 37.0], [-0.4, 39.0]] },
    { a: 'j1', b: 'a1', pts: [[-0.4, 39.0], [3.0, 36.8], [6.0, 34.0]] },
    { a: 'j1', b: 'j2', pts: [[-0.4, 39.0], [0.0, 42.6], [0.4, 46.0]] },
    { a: 'j2', b: 'd1', pts: [[0.4, 46.0], [-3.4, 48.4], [-6.8, 51.0]] },
    { a: 'j2', b: 'e1', pts: [[0.4, 46.0], [3.8, 48.8], [6.8, 51.6]] },
  ],
};
export const LEVERS = { j1: [-9.0, 35.6], j2: [8.6, 35.4] }; 

export const dockLand = (id) => { const [u, v] = NET.nodes[id].at, isl = ISLANDS[NET.nodes[id].island], du = isl.u - u, dv = isl.v - v, d = Math.hypot(du, dv); return [u + du / d * 1.3, v + dv / d * 1.3]; };


export const RIVERS = [
  { v: [68, 74], field: { id: 'field-1', u0: -10, v0: 68, grid: ['.#.#', '..#.', '#..#'] } },
  { v: [78, 84], field: { id: 'field-2', u0: 2, v0: 78, grid: ['.##.', '...#', '#.#.'] } },
  { v: [88, 92], field: { id: 'field-3', u0: -6, v0: 88, grid: ['.#..', '...#'] } },
];
export const fieldAt = (u, v) => {
  for (const r of RIVERS) {
    const f = r.field, c = Math.floor((u - f.u0) / CELL), q = Math.floor((v - f.v0) / CELL);
    if (q >= 0 && q < f.grid.length && c >= 0 && c < f.grid[0].length) return { field: f, c, r: q };
  }
  return null;
};
const riverAt = (u, v) => RIVERS.some((r) => v >= r.v[0] && v < r.v[1]);

export const ENTRY = at(-12.0, 26.4);     
export const SPRING = at(14.6, 57.2);     
export const LANDING = at(12.4, 58.8);    
export const POCKET_SPRING = at(38.0, 66.6); 
export const SOUTH = at(-1.0, 95.6);      
export const SOUTH_BACK = at(-1.0, 93.8); 
export const CISTERN = [[28, 70, 2.4], [34, 78, 2.8], [40, 72, 1.8], [26, 80, 1.6]]; 
export const LANE = [[-12.0, 26.4], [-12.0, 30.0]];
export const TRACK = [[11.5, 54.5], [11.0, 60.0], [6.0, 64.0], [-6.0, 66.0], [-6.0, 75.0], [6.0, 76.0], [6.0, 85.4], [-2.0, 86.0], [-2.0, 93.0], [-1.0, 95.6]];
export const SPUR = [[6.0, 64.0], [16.0, 64.8], [26.0, 66.0], [32.0, 72.0]];
export const DWELLERS = [
  { id: 'gall-v0', home: { ...at(-14.0, 28.6), r: 1.6 }, lines: [
    'Carts go where the points tell \'em. Points do what the levers tell \'em. And the levers do whatever the last idiot left them on. Today the last idiot was me. Sorry.',
    'I ride out to the far island every morning to check the trestles. Well. I ride out to SOME island. Then I fix the levers and ride out again. It\'s a living.'] },
  { id: 'cist-v0', home: { ...at(33.0, 66.0), r: 2.0 }, lines: [
    'The forge used to quench in here. Big hiss, cloud to the roof, the whole cistern boiling. Now it\'s just warm, and the water kinds moved in, and honestly they\'re nicer than the smiths.',
    'You\'re going up against the herald? Bring water. I mean bring a water kind. Fire hates water. Not exactly news, but you\'d be amazed who forgets.'] },
];

const inG = (u, v) => edgeDepth({ u: [-20, 20], v: [24, 64] }, u, v).depth > 2.0;
const inR2 = (u, v) => edgeDepth({ u: [-20, 20], v: [60, 98] }, u, v).depth > 2.0;
const inB = (u, v) => edgeDepth({ u: [20, 44], v: [62, 86] }, u, v).depth > 2.0;
const gap = (u, v) => u > 15 && u < 25 && v > 64.2 && v < 67.6;
const inside = (u, v) => inG(u, v) || inR2(u, v) || inB(u, v) || gap(u, v);
const islandIn = (u, v) => Object.values(ISLANDS).some((i) => Math.hypot((u - i.u) / i.ru, (v - i.v) / i.rv) < 1 + (U.fbm(u * 0.4, v * 0.4, 1811) - 0.5) * 0.18);
const causeway = (u, v) => v > 57 && v < 64 && Math.abs(u - (11.5 - (v - 57) * 0.8)) < 2.6; 
const pool = (u, v) => CISTERN.some(([a, b, r]) => Math.hypot(u - a, v - b) < r);

export function ground(u, v) {
  if (!inside(u, v)) return 'wall';
  if (v < 57.2 && u < 20) return islandIn(u, v) || v < 26 ? 'land' : 'lava';
  if (v < 64 && u < 15) return causeway(u, v) || islandIn(u, v) ? 'land' : 'lava';
  if (u > 19 || gap(u, v)) return pool(u, v) ? 'pool' : 'land';
  if (riverAt(u, v)) { const q = fieldAt(u, v); return q ? 'column' : 'lava'; }
  return 'land';
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return 2.4 + U.fbm(x * 0.2, y * 0.2, 1801) * 1.4;
  if (g === 'lava' || g === 'column') return 0.12;
  if (g === 'pool') return 0.0;
  return 0.42 + U.fbm(x * 0.16, y * 0.16, 1803) * 0.1;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return T.CLIFF;
  if (g === 'lava' || g === 'column') return T.LAVA;
  if (g === 'pool') return T.DEEP;
  const n = U.fbm(x * 0.22, y * 0.22, 1805);
  if (u > 19 || gap(u, v)) return CISTERN.some(([a, b, r]) => Math.hypot(u - a, v - b) < r + 1.6) ? T.MOSS : n > 0.6 ? T.RUIN : T.ROCK; 
  if (v < 26.8) return T.ROCK;
  return n > 0.58 ? T.THICKET : n < 0.3 ? T.SAND : T.ROCK; 
}









const ISLAND_DRESS = {
  west: [['crates', 2.2, 0.55], ['cookfire', 3.4, 0.5], ['pots', 3.9, 0.62], ['basalt', 0.4, 0.86], ['basalt', 4.9, 0.84], ['obsidian', 1.3, 0.82], ['vent', 5.6, 0.6]],
  across: [['anvil', 1.0, 0.5], ['crates', 2.6, 0.55], ['basalt', 4.0, 0.85], ['basalt', 5.4, 0.84], ['obsidian', 0.2, 0.8], ['flow', 3.3, 0.9]],
  dead: [['tools', 1.2, 0.55], ['flow', 4.6, 0.88], ['flow', 5.2, 0.86], ['basalt', 2.6, 0.84], ['obsidian', 3.6, 0.78], ['vent', 0.2, 0.55], ['crates', 2.0, 0.5]],
  far: [['vent', 0.9, 0.5], ['vent', 2.3, 0.62], ['crates', 4.2, 0.5], ['basalt', 3.2, 0.86], ['basalt', 5.6, 0.84], ['obsidian', 0.1, 0.8]],
};
const DRESS_FORM = {
  crates: { solid: 0.4 }, cookfire: { solid: 0.4 }, pots: { solid: 0.3 }, anvil: { solid: 0.35 }, tools: { solid: 0.3 },
  basalt: { solid: 0.4, s: 0.8 }, obsidian: { solid: 0.3, s: 0.7 }, vent: { solid: 0, s: 0.85 }, flow: { solid: 0, s: 1.2 },
};


const FINDS_UV = [[-14.6, 55.6]];
function dressIslands(W) {
  const keepOff = [ENTRY, SPRING, POCKET_SPRING, LANDING, ...Object.values(W.rails.land), ...Object.values(W.rails.levers), ...FINDS_UV.map(([u, v]) => at(u, v))];
  const isLand = (u, v) => ground(u, v) === 'land';
  for (const [id, list] of Object.entries(ISLAND_DRESS)) {
    const isl = ISLANDS[id];
    for (const [kind, a0, f, extra] of list) {
      const form = DRESS_FORM[kind], r = form.solid > 0 ? form.solid + 0.3 : 0.6;
      
      for (let k = 0; k < 12; k++) {
        const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.22, u = isl.u + Math.cos(a) * isl.ru * f, v = isl.v + Math.sin(a) * isl.rv * f;
        if (kind !== 'flow' && ![0, 1, 2, 3].every((q) => isLand(u + Math.cos(q * 1.57) * r, v + Math.sin(q * 1.57) * r))) continue;
        const p = at(u, v);
        if (keepOff.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < 2)) continue;
        if (W.objects.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < (kind === 'flow' ? 1.6 : 1.3))) continue;
        const out = clearOfLanes(W.paths, p.x, p.y, r);
        if (Math.hypot(out.x - p.x, out.y - p.y) > 0.01) continue; 
        const c = at(isl.u, isl.v);
        const rot = kind === 'flow' ? Math.atan2(c.x - p.x, c.y - p.y) : (a * 2.3) % 6.28; 
        addObj(W, { kind, x: p.x, y: p.y, rot, ...form, ...extra });
        break;
      }
    }
  }
}

export function generateMagmaGalleries() { const it = magmaGalleriesSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* magmaGalleriesSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const lane = LANE.map(xy), track = TRACK.map(xy), spur = SPUR.map(xy), before = W.type.slice();
  for (const pts of [lane, track, spur]) carvePath(W, W.type, pts);
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH && [T.CLIFF, T.LAVA, T.DEEP].includes(before[k])) W.type[k] = before[k];
  mapQueries(W);
  
  
  const walk = W.type.slice();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (ground(...toUV(i + 0.5, j + 0.5)) === 'column') walk[W.idx(i, j)] = T.ROCK;
  W.reach = floodReach(W, walk, ENTRY);
  for (const id of ['a1', 'd1', 'e1']) { const p = at(...dockLand(id)), more = floodReach(W, walk, p); for (let k = 0; k < more.length; k++) if (more[k]) W.reach[k] = 1; }
  yield 'reach';
  
  const seen = W.reach.slice();
  for (const r of NET.rails) for (let k = 1; k < r.pts.length; k++) {
    const [au, av] = r.pts[k - 1], [bu, bv] = r.pts[k];
    for (let t = 0; t <= 1; t += 0.05) { const [x, y] = fromUV(au + (bu - au) * t, av + (bv - av) * t); seen[W.idx(Math.floor(x), Math.floor(y))] = 1; }
  }
  W.windows = sectionWindows(Object.assign(Object.create(W), { reach: seen }), SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: lane, half: 0.5 }, { pts: track, half: 0.55 }, { pts: spur, half: 0.55 }];
  
  W.rails = { net: NET, levers: Object.fromEntries(Object.entries(LEVERS).map(([j, p]) => [j, at(...p)])), land: Object.fromEntries(['w1', 'a1', 'd1', 'e1'].map((d) => [d, at(...dockLand(d))])) };
  W.hazard = { basalt: RIVERS.map((r) => ({ ...r.field, h: 0.46 })) };
  W.npcOk = (x, y, rad) => { const [u, v] = toUV(x, y); return W.walkable(x, y, rad) && (v < 30 || u > 22) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8; };
  
  for (const r of NET.rails) for (let k = 1; k < r.pts.length; k++) {
    const [au, av] = r.pts[k - 1], [bu, bv] = r.pts[k], L = Math.hypot(bu - au, bv - av), n = Math.max(1, Math.round(L));
    const [x0, y0] = fromUV(au, av), [x1, y1] = fromUV(bu, bv), rot = Math.atan2(x1 - x0, y1 - y0);
    for (let q = 0; q < n; q++) { const t = (q + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; addObj(W, { kind: 'rail', x, y, solid: 0, rot, s: L / n, h: 0.5 }); }
  }
  for (const [j, [u, v]] of Object.entries(LEVERS)) { const p = at(u, v); addObj(W, { kind: 'lever', x: p.x, y: p.y, solid: 0.3, rot: 0.6, junction: j }); }
  for (const id of Object.keys(NET.nodes)) if (NET.nodes[id].kind === 'junction') { const p = at(...NET.nodes[id].at); addObj(W, { kind: 'basalt', x: p.x, y: p.y, solid: 0, s: 1.1, rot: 0.3, pier: true }); } 
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  addObj(W, { kind: 'spring', x: POCKET_SPRING.x, y: POCKET_SPRING.y, solid: 0.8, heal: true });
  for (const [u, v] of [[-15.6, 27.0], [-8.4, 27.0], [-8.4, 34.6], [9.0, 33.4], [-9.0, 51.6], [9.0, 52.6], [2.2, 95.0], [-4.2, 95.0], [21.0, 67.0], [5.0, 66.4], [-7.6, 76.4], [8.0, 86.0]]) {
    const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 });
  }
  for (const [u, v, rot] of [[-14.4, 33.4, 0.7], [13.4, 52.0, 2.2], [-13.6, 56.2, 1.1]]) { const p = at(u, v); addObj(W, { kind: 'cart', x: p.x, y: p.y, solid: 0.45, rot, wreck: true }); } 
  dressIslands(W);
  
  
  
  
  { const n = at(-12.0, 26.2); addObj(W, { kind: 'tubemouth', x: n.x, y: n.y, solid: 0, rot: Math.PI / 4 }); }
  for (const side of [-1, 1]) {
    const c = at(-1.0 + side * 1.5, 95.4);
    addObj(W, { kind: 'basalt', x: c.x, y: c.y, solid: 0.3, rot: side, s: 0.9 });
  }
  yield 'buildings';
  const r = U.rng(1812);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 2.2) continue;
    const [, v] = toUV(x, y);
    if (t === T.CLIFF) {
      if (Math.hypot(x - SOUTH.x, y - SOUTH.y) < 2.6) continue;
      if (k < 0.12) addObj(W, { kind: 'basalt', x, y, solid: 0, s: 0.9 + s * 0.8, rot });
      else if (k < 0.28) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 13) % 4 });
      else if (k < 0.32) addObj(W, { kind: 'obsidian', x, y, solid: 0, s: 0.8 + s * 0.6, rot });
      continue;
    }
    if (t === T.LAVA) continue; 
    if (t === T.PATH || t === T.DEEP) continue;
    if (W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.3)) continue;
    if (Math.hypot(x - SOUTH.x, y - SOUTH.y) < 2.4 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2 || Math.hypot(x - LANDING.x, y - LANDING.y) < 1.6 || Math.hypot(x - POCKET_SPRING.x, y - POCKET_SPRING.y) < 2) continue;
    if (Object.keys(W.rails.land).some((d) => Math.hypot(x - W.rails.land[d].x, y - W.rails.land[d].y) < 2)) continue;
    if (Object.values(W.rails.levers).some((p) => Math.hypot(x - p.x, y - p.y) < 1.8)) continue;
    if (RIVERS.some((rv) => v > rv.v[0] - 1.4 && v < rv.v[1] + 1.4)) continue; 
    if (t === T.MOSS) { if (k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.4, rot, flavor: 'moss' }); continue; }
    if (t === T.THICKET) { if (k < 0.09) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.3, rot, flavor: 'cinder' }); continue; }
    if (k < 0.025) addObj(W, { kind: 'obsidian', x, y, solid: 0.3, s: 0.5 + s * 0.5, rot });
    else if (k < 0.045) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.5, rot, dark: true });
    else if (k < 0.055) addObj(W, { kind: 'basalt', x, y, solid: 0.4, s: 0.5 + s * 0.3, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [u, v] = toUV(i + 0.5, j + 0.5), t = W.type[W.idx(i, j)];
    if (!W.reach[W.idx(i, j)] || !W.walkable(i + 0.5, j + 0.5, 0.3)) continue;
    if (u < 18 && t === T.THICKET && (v > 30 || u > 0)) W.wildTiles.push([i + 0.5, j + 0.5]);
    if (u > 20 && t === T.MOSS) W.wildTiles.push([i + 0.5, j + 0.5]);
  }
  yield 'grid';
  const rs = U.rng(1813);
  for (let t = 0; W.spots.length < 7 && t < 8000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3) continue;
    W.spots.push({ id: 'mg' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


export const MANIFEST = {
  order: 27,
  
  region: {
    id: ID, name: 'The Magma Galleries', chapters: [7], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: LANDING,
    pack: 'assets/scenery-kazan-galleries.bin',
    transit: false, objective: 'Ride the ore carts across the lava',
    
    objectives: { 'obsidian-rivers': "Keep movin' - the black rocks sink", 'cinder-cistern': 'Train in the hot water' },
  },
  generate: generateMagmaGalleries, steps: magmaGalleriesSteps,
  doors: [
    { id: 'galleries-in', region: heartOfKazan.ID, at: heartOfKazan.EXIT, to: ID, toAt: ENTRY, label: 'Into the galleries', after: null },
    { id: 'galleries-out', region: ID, at: ENTRY, to: heartOfKazan.ID, toAt: heartOfKazan.BACK, label: 'Back to the forge', after: null },
  ],
  perches: [
    { id: 'kazan-galleries', region: ID, name: 'The Magma Galleries', at: LANDING, opens: 'boss_glacius', respawn: null },
  ],
  place: { name: 'The Magma Galleries', at: [0.74, 0.07], r: 0.04, glyph: 'volcano' },
  kind: 'cave',
  ground: { 'magma-galleries': 'magma', 'obsidian-rivers': 'magma', 'cinder-cistern': 'magma' },
  caves: ['magma-galleries'],
  ambience: { 'magma-galleries': { rumble: 0.7, wind: 0.2 }, 'obsidian-rivers': { rumble: 0.6, wind: 0.25 }, 'cinder-cistern': { surf: 0.25, rumble: 0.3 } },
  beats: {
    'magma-galleries': [
      ['narr', 'A lake of lava under a roof held up by black columns. Old ore rails run out over it on stilts, island to island, and at the end of each one a cart is waiting.'],
      ['kid', '(It\'s the Cyclone. At Coney Island. ...If the Cyclone was on fire and had no seatbelts and nobody to yell at.)'],
    ],
    'obsidian-rivers': [
      ['narr', 'Three rivers of lava cross the cavern floor. Where they narrow, the tops of stone columns stand up out of them, packed tight like cobbles. One near the bank shudders, sinks, and comes slowly back up.'],
    ],
    'cinder-cistern': [
      ['narr','Steps go down into an old stone tank brimming with steaming water. Water-kind dachis float in it with their eyes shut, not moving at all.'],
    ],
  },
  
  people: { rng: 201, kinds: { stage: 2, types: ['Stone', 'Tide'] }, gap: 0.8, dwellers: DWELLERS },
};
