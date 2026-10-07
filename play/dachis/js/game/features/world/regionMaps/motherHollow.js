







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import * as hollowroot from './hollowroot.js';

export const ID = 'mother-hollow';
export const SIZE = 80;
const WT = ['Leaf', 'Spirit'];
export const SECTIONS = addSections([
  { id: 'tree-vault', name: 'The Mother Tree - The Seed Vault', rect: { u: [-12, 12], v: [30, 46] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 3, wildTypes: WT },
  { id: 'tree-heart', name: 'The Mother Tree - The Heartwood', rect: { u: [-12, 12], v: [46, 62] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 3, wildTypes: WT },
  { id: 'tree-roots', name: 'The Mother Tree - The Roots', train: true, rect: { u: [-12, 12], v: [62, 78] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 3, wildTypes: [...WT, 'Shadow'] } 
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };




export const CHAMBERS = [{ id: 'tree-vault', u: 0, v: 38.4, r: 6.2, ru: 6.2, rv: 6.2 }, { id: 'tree-heart', u: 0, v: 54, r: 7.2, ru: 9.6, rv: 6.4 }, { id: 'tree-roots', u: 0, v: 70, r: 6.6, ru: 9.4, rv: 6.2 }];
const ovalD = (c, u, v) => (Math.hypot((u - c.u) / c.ru, (v - c.v) / c.rv) - 1) * Math.min(c.ru, c.rv); 
export const TANGLES = CHAMBERS.slice(1).flatMap((c) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ u: c.u + a * c.ru * 0.62, v: c.v + b * c.rv * 0.62, r: 2.2 })));

export const WAY = [[-1.6, 33.0], [1.2, 37.0], [-0.8, 41.6], [2.0, 46.0], [0.6, 50.4], [-2.4, 54.0], [0.4, 58.0], [2.4, 62.0], [0.6, 66.0], [-1.2, 70.0], [0, 72.4]].map(([u, v]) => fromUV(u, v));
export const ENTRY = at(-1.6, 33.4);        
export const SAP = at(3.6, 55.4);           
export const SAP_LANDING = at(2.0, 56.8);
export const SEED = { ...at(0, 73.4), r: 2.0 }; 
const inChamber = (u, v, pad = 0) => CHAMBERS.some((c) => ovalD(c, u, v) < pad + U.fbm(u * 0.5, v * 0.5, 501) * 0.8 - 0.4);
const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
export const BASE_H = 0.2;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), d = Math.min(...CHAMBERS.map((c) => ovalD(c, u, v)));
  return BASE_H + U.fbm(x * 0.14, y * 0.14, 503) * 0.1 + U.clamp(d + 0.8, 0, 2.5) * 0.7; 
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v) || !inChamber(u, v)) return T.CLIFF;
  const c = CHAMBERS.find((k) => ovalD(k, u, v) < 0.6) || CHAMBERS[1];
  const n = U.fbm(x * 0.2, y * 0.2, 505);
  if (c.id !== 'tree-vault' && TANGLES.some((t) => Math.hypot(u - t.u, v - t.v) < t.r + (n - 0.5) * 0.8)) return T.THICKET; 
  if (c.id === 'tree-vault') return n > 0.55 ? T.MOSS : T.GLADE;
  return n > 0.5 ? T.MOSS : T.GLADE;
}

export function generateMotherHollow() { const it = motherHollowSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* motherHollowSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  carvePath(W, W.type, WAY);
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.MOSS;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: WAY.map((p) => [...p]), half: 0.5 }];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8;
  addObj(W, { kind: 'spring', x: SAP.x, y: SAP.y, solid: 0.8, heal: true });
  
  for (const [u, v] of [[-3.0, 33.4], [0.2, 33.0], [3.4, 46.0], [0.6, 46.0], [3.8, 62.0], [1.0, 62.0], [-2.0, 73.0], [2.0, 73.0]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  { const p = at(0, 74.8); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.6, s: 1.6, rot: 0.4, v: 1, flavor: 'moss' }); }
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, p = at(Math.cos(a) * 3.6, 72.0 + Math.sin(a) * 3.0); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.3, s: 0.9, rot: a, v: k % 3 }); }
  yield 'buildings';
  const r = U.rng(5151), SEEDLING = ['#9ad870', '#c8f090', '#ffe090', '#ffb0d0'];
  const wayD = (x, y) => WAY.reduce((m, p, k) => (k ? Math.min(m, segDist(WAY[k - 1], p, x, y)) : m), Infinity);
  
  
  { const vault = CHAMBERS[0];
    for (let u = -10.4; u <= 10.4; u += 1.6) for (let v = 31.6; v < 45.6; v += 0.8) {
      const p = at(u, v), [cu, cv] = [u - vault.u, v - vault.v];
      if (Math.hypot(cu, cv) > vault.r - 1.0 || wayD(p.x, p.y) < 1.1 || Math.hypot(p.x - ENTRY.x, p.y - ENTRY.y) < 2) continue;
      if (W.type[W.idx(Math.floor(p.x), Math.floor(p.y))] === T.CLIFF) continue;
      addObj(W, { kind: 'flower', x: p.x, y: p.y, solid: 0, c: SEEDLING[Math.round((u + 10.4) / 1.6) % 4] });
    } }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { if (k < 0.22) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 16) % 4 }); continue; }
    if (wayD(x, y) < 1.1 || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 2 || Math.hypot(x - SAP.x, y - SAP.y) < 2) continue;
    const [u, v] = toUV(x, y);
    if (Math.hypot(u, v - 72.4) < 4.4) continue; 
    if (t === T.THICKET) { if (k < 0.16) addObj(W, { kind: 'bramble', x, y, solid: 0, s: 0.5 + s * 0.35, rot }); continue; }
    
    if (v < 46) continue; 
    if (k < 0.05) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot });
    else if (k < 0.08) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.35 + s * 0.35, rot, flavor: 'moss' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.THICKET && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(5252);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || wayD(x, y) < 1.2) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || Math.hypot(x - ENTRY.x, y - ENTRY.y) < 3) continue;
    W.spots.push({ id: 'mh' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}


export const MANIFEST = {
  order: 11,
  
  region: {
    id: ID, name: 'The Mother Tree', chapters: [3], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: SAP_LANDING, home: ENTRY,
    pack: null,
    transit: false, objective: 'Follow the way down through the tree to its first seed',
  },
  generate: generateMotherHollow, steps: motherHollowSteps,
  doors: [
    { id: 'hollow-in', region: hollowroot.ID, at: hollowroot.KNOT, to: ID, toAt: ENTRY, label: 'Down the knot-hole', after: null },
    { id: 'hollow-out', region: ID, at: ENTRY, to: hollowroot.ID, toAt: hollowroot.KNOT_BACK, label: 'Up to Hollowroot', after: null },
  ],
  perches: [
    
    { id: 'mother-hollow', region: ID, name: 'Sap Pool', at: SAP_LANDING, opens: 'boss_leviathrum', respawn: null },
  ],
  place: { name: 'The Mother Tree', at: [0.2, 0.7], r: 0.045, glyph: 'meadow' },
  kind: 'forest',
  ground: { 'tree-vault': 'verdant', 'tree-heart': 'verdant', 'tree-roots': 'verdant' },
  caves: ['tree-vault', 'tree-heart', 'tree-roots'],
  ambience: { 'tree-vault': { chimes: 0.3, wind: 0.2 }, 'tree-heart': { chimes: 0.4, bugs: 0.2 }, 'tree-roots': { wind: 0.15, chimes: 0.2 } },
  beats: {
    'tree-vault': [
      ['narr', 'You squeeze down through the knot-hole and drop onto soft moss. Inside, the tree is hollow, and it smells like rain.'],
      ['narr', 'Seedlings grow in neat rows across the floor, each one labelled with a scratch in the bark. Someone kept them here very carefully.'],
    ],
    'tree-heart': [
      ['narr', 'The heartwood. A pool of sap glows gold in the middle of the hall, and the walls creak slowly, like breathing.'],
    ],
    'tree-roots': [
      ['narr', 'At the very bottom the roots twist round one mossy stone, as if the whole tree were holding it.'],
      ['kid', 'All of this from one seed? We grew a bean in a cup in second grade. Mine died. It was in the window and everything.'],
    ],
  },
};
