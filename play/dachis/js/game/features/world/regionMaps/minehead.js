




import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard, fruitGrove } from '../dressing.js';

export const ID = 'minehead';
export const SIZE = 80; 
export const SECTIONS = addSections([
  { id: 'minehead', name: 'Minehead Camp - The Pit Rim', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 5, wildTypes: ['Stone', 'Metal', 'Shadow'] },
  
  
  { id: 'mine-workings', name: 'Minehead Camp - The Old Workings', train: true, rect: { u: [-18, 18], v: [54, 72] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, wildTypes: ['Shadow', 'Metal'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const PIT = { u: 0, v: 39.5, r: 10.2 };
export const TURNS = 1.5, R0 = 9.6, DROP = 3.8, LEDGE_HALF = 0.95; 
const A0 = Math.PI / 2; 
export const ledgeR = (th) => R0 - (th / (2 * Math.PI)) * DROP;
export const ledgeAt = (th) => ({ u: PIT.u + ledgeR(th) * Math.cos(A0 + th), v: PIT.v + ledgeR(th) * Math.sin(A0 + th) });
const TH_END = TURNS * 2 * Math.PI;

export function onLedge(u, v) {
  const du = u - PIT.u, dv = v - PIT.v, r = Math.hypot(du, dv);
  let a = Math.atan2(dv, du) - A0; a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let best = -Infinity, t = 0;
  for (let k = 0; k <= TURNS + 1; k++) {
    const th = a + k * 2 * Math.PI; if (th > TH_END + 0.4) break;
    const thc = Math.min(th, TH_END), d = LEDGE_HALF - Math.abs(r - ledgeR(thc)) - (th > TH_END ? (th - TH_END) * ledgeR(TH_END) : 0);
    if (d > best) { best = d; t = thc / TH_END; }
  }
  return { d: best, t };
}
const bottom = ledgeAt(TH_END);
export const SHAFT_DOOR = at(bottom.u, bottom.v);              
const backIn = ledgeAt(TH_END - 0.55);
export const SHAFT_BACK = at(backIn.u, backIn.v);              
export const ENTRY = at(0, 51.5);        
export const GATE = ENTRY;
export const SPRING = at(3.2, 51.0);     
export const LANDING = at(1.0, 51.4);    
export const POSTS = { elder: at(-4.6, 49.6) }; 
export const HOME_DISC = { ...at(0, 47), r: 7.0 };
export const GEODE_DOOR = at(-9, 28.2);  
export const GEODE_BACK = at(-9, 29.8);  
export const WORK_DOOR = { u: 10, v: 54 };  
export const PILLAR_GRID = [-12, -6, 0, 6, 12].flatMap((u) => [59.5, 65.5].map((v) => ({ u, v, h: 1.5 })));
const inPillar = (u, v) => PILLAR_GRID.some((p) => Math.abs(u - p.u) < p.h && Math.abs(v - p.v) < p.h);
const HUTS = [[-11.5, 47.5, 1.3], [11.5, 47.0, 1.35], [-12.5, 34.0, 1.3], [12.5, 33.0, 1.3]];
const ROOFS = ['#8a7a6a', '#a07050', '#6a6a7a', '#907a50', '#7a5a4a'];
export const HUT_SPOTS = HUTS.map(([u, v, s]) => ({ ...at(u, v), s }));


export const DWELLERS = [
  { id: 'mine-v0', home: { ...at(6.8, 50.4), r: 1.4 }, lines: [
    'You are the one off the big bird. Race me down the ledge. Loser trims the lamps. I always lose on purpose, I like trimming.',
    'My brother went down with the Hush. They walk with their lamps out. He took mine too. It was MINE, it had a dent shaped like a bean.'] },
  { id: 'mine-v1', home: { ...at(-8.4, 44.6), r: 1.6 }, lines: [
    'Put the lamp out once, down at the bottom. Just once. You stop hearing your own heart. Nobody shouts at you down there. It is... it is peaceful.',
    'The Hermit is not wicked. He was scared, like us. He says the true dark is kinder than the camp. He says it better than I do.'] },
  { id: 'mine-v2', home: { ...at(13.2, 42.0), r: 1.2 }, lines: [
    'Soup. Carry it down the shaft for the night shift and I will tell you about the Hermit. No? Then I will tell you anyway, I like an audience.',
    'When his lenses click round, he is aiming. Click, click - then the light comes out straight as a rail. Get off the rail. After, he cannot see a thing.'] },
];
export const ELDER = { name: 'Foreman Tunn', at: POSTS.elder };
export const ELDER_LINES = {
  before: [
    'Off the bird, on my rim. Fine. Visitors pay in shifts here. You owe me one shift of listening.',
    'The Hush put out the lamps on the lower seam. Eleven of my people went down after them. Four came back up. The four do not talk much.',
    'The Hermit sat at my table for nine years and jumped at every shadow. Now he tells my miners the dark is a friend. Funny, how fear turns its coat.',
    'The ledge is the only road down. Mind the edge on the second turn. That is not advice. I am counting how many I lose.',
  ],
  after: ['The lamps are back on the lower seam. Half my miners are cross about it. The other half are in the canteen. That is a normal shift.'],
};

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const pitDepth = (u, v) => PIT.r - Math.hypot(u - PIT.u, v - PIT.v); 
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), p = pitDepth(u, v), l = onLedge(u, v);
  if (v > 53) return inPillar(u, v) ? 1.6 : 0.3 + U.fbm(x * 0.15, y * 0.15, 707) * 0.2; 
  if (p > -0.3 && l.d > -0.15) return 0.55 - l.t * 0.4;              
  if (p > 0) return -2.4 - Math.min(p, 4) * 0.3;                      
  return 0.35 + U.fbm(x * 0.12, y * 0.12, 701) * 0.3 + Math.min(1, -p * 0.05);
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (Math.abs(u - WORK_DOOR.u) < 1.4 && Math.abs(v - WORK_DOOR.v) < 2.6) return T.ROCK; 
  if (!inside(u, v)) return T.CLIFF;
  if (v > 54) return inPillar(u, v) ? T.CLIFF : U.fbm(x * 0.2, y * 0.2, 709) > 0.4 ? T.MOSS : T.ROCK;
  const p = pitDepth(u, v), l = onLedge(u, v);
  
  if (p > -0.4 && l.d > 0) return Math.floor(l.t * TURNS * 4) % 2 ? T.RUIN : T.ROCK;
  if (p > 0) return T.DEEP;   
  if (p > -1.3) return T.ROCK;                                         
  
  return U.fbm(x * 0.17, y * 0.17, 705) > 0.6 ? T.MOSS : T.SAND;
}

export function generateMinehead() { const it = mineheadSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* mineheadSteps() {
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
  W.npcOk = (x, y, rad) => { const [u, v] = toUV(x, y); return W.walkable(x, y, rad) && pitDepth(u, v) < -1.5 && Math.hypot(x - GATE.x, y - GATE.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4; };
  const mid = at(PIT.u, PIT.v), huts = HUT_SPOTS.map((h, i) => ({ ...h, i, rot: Math.atan2(mid.x - h.x, mid.y - h.y) }));
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  { let run = 0, n = 0, gap = true;
    for (let a = 0; a < 2 * Math.PI; a += 0.13) {
      const u = PIT.u + Math.cos(A0 + a) * (PIT.r + 0.5), v = PIT.v + Math.sin(A0 + a) * (PIT.r + 0.5);
      if (onLedge(u, v).d > -1.2 || !inside(u, v)) { if (!gap) { run++; n = 0; } gap = true; continue; }
      gap = false; const p = at(u, v); addObj(W, { kind: 'fence', x: p.x, y: p.y, solid: 0.15, ring: 'rim-' + run, k: n++, n: 0 });
    } }
  
  for (let th = 0.6; th < TH_END - 0.3; th += 1.0) { const q = ledgeAt(th), r = ledgeR(th), p = at(PIT.u + (q.u - PIT.u) * (r + 0.7) / r, PIT.v + (q.v - PIT.v) * (r + 0.7) / r); addObj(W, { kind: 'torch', x: p.x, y: p.y, solid: 0 }); }
  for (const [u, v] of [[-3.0, 50.4], [5.0, 50.6], [-12.0, 40.0], [12.6, 40.4], [-6.0, 29.6], [6.0, 29.6]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  { const p = at(-6.2, 48.6); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.35, s: 1.0, rot: 0.6, v: 1 }); } 
  
  
  
  {
    const dr = U.rng(7474);
    const dclear = (x, y, r) => { const [u, v] = toUV(x, y); return pitDepth(u, v) < -1.9 - r && onLedge(u, v).d < -1.4 - r && Math.hypot(x - GATE.x, y - GATE.y) > 2.4 + r
      && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r && Math.hypot(x - LANDING.x, y - LANDING.y) > 1.2 + r && Math.hypot(x - POSTS.elder.x, y - POSTS.elder.y) > 1.0 + r
      && Math.hypot(u - WORK_DOOR.u, v - WORK_DOOR.v) > 2.6 + r && v < 54; };
    guardHuts(W, huts);
    for (const [k, u, v] of [['cookfire', -8.4, 51.0], ['washline', 8.2, 51.6], ['crates', -9.6, 44.0], ['crates', 9.8, 43.2], ['tools', -3.0, 52.6], ['pots', 6.4, 52.8]]) {
      placeYard(W, k, at(u, v), { rot: dr() * 6.28, clear: dclear });
    }
    dressHuts(W, huts, { rng: dr, kinds: ['tools', 'crates', 'pots', 'strawbed', 'bowl', 'basket', 'toys'], food: ['#d88a3a', '#e03a3a', '#c8c0b0'], clear: dclear, perHut: [3, 4] });
    fruitGrove(W, at(5.6, 49.0), 'appletree', { rng: dr, clear: dclear, falls: 2 });
  }
  yield 'buildings';
  const r = U.rng(7171), busy = (x, y) => huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.2) || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - GATE.x, y - GATE.y) < 2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    const [u, v] = toUV(x, y); if (pitDepth(u, v) > -1.6) continue; 
    if (t === T.CLIFF) { if (k < 0.4) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (t === T.MOSS) { if (k < 0.07) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot, flavor: 'shrine' }); continue; }
    if (k < 0.05) addObj(W, { kind: 'rock', x, y, solid: 0.35, s: 0.5 + s * 0.6, rot, dark: true });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(7272);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'mh' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
