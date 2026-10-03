









import { U } from '../../../../engine/core/util.js';
import { uvRot, addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'canopy-walk';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'canopy-walk', name: 'The Canopy Walk — Rope Bridges', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: ['Beast', 'Leaf', 'Gale'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const LOW_H = 0.9, HIGH_H = 2.3;
const FLOOR_H = -4.4; 

export const PLATFORMS = [
  { id: 'foot', u: -1.6, v: 49.8, r: 3.4, tier: 0 },               
  { id: 'mid', u: 0.2, v: 40.4, r: 3.8, tier: 0, beds: false },   
  { id: 'sw', u: -11.4, v: 45.0, r: 3.0, tier: 1, beds: true },
  { id: 'east', u: 10.6, v: 46.4, r: 3.0, tier: 1, beds: false },
  { id: 'nw', u: -10.6, v: 33.6, r: 3.2, tier: 0, beds: true },
  { id: 'ne', u: 11.0, v: 34.6, r: 3.2, tier: 0, beds: true },
  { id: 'crown', u: 0.8, v: 31.8, r: 3.4, tier: 1, beds: false },  
];
const P = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
export const BRIDGES = [['foot', 'mid'], ['foot', 'sw'], ['foot', 'east'], ['sw', 'nw'], ['mid', 'nw'], ['mid', 'ne'], ['east', 'ne'], ['nw', 'crown'], ['ne', 'crown']]
  .map(([a, b]) => ({ a: P[a], b: P[b], sag: P[a].tier === P[b].tier ? 0.4 : 0.15 }));
export const BRIDGE_HALF = 0.55;  
export const tierH = (p) => (p.tier ? HIGH_H : LOW_H);
export const ENTRY = at(-2.4, 51.4);        
export const GATE = ENTRY;
export const EXIT = at(0.8, 29.0);          
export const EXIT_BACK = at(0.8, 31.4);     
export const SPRING = at(1.6, 39.2);        
export const LANDING = at(-0.8, 41.2);

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);

const along = (br, u, v) => {
  const du = br.b.u - br.a.u, dv = br.b.v - br.a.v, L = du * du + dv * dv, t = U.clamp(((u - br.a.u) * du + (v - br.a.v) * dv) / L, 0, 1);
  return { d: Math.hypot(br.a.u + du * t - u, br.a.v + dv * t - v), t };
};
const platformIn = (x, y) => {
  const [u, v] = toUV(x, y), w = U.fbm(x * 0.3, y * 0.3, 701) * 0.6 - 0.3;
  let best = null, m = -Infinity;
  for (const p of PLATFORMS) { const k = p.r - Math.hypot(u - p.u, v - p.v) + w; if (k > m) { m = k; best = p; } }
  return { d: m, p: best };
};

const bridgeAt = (u, v, pad) => {
  let best = null;
  for (const br of BRIDGES) { const a = along(br, u, v); if (a.d < pad && (!best || a.d < best.d)) best = { ...a, br }; }
  return best;
};
export const bridgeH = (br, t) => U.lerp(tierH(br.a), tierH(br.b), t) - br.sag * Math.sin(Math.PI * t);
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), pl = platformIn(x, y);
  if (pl.d > 0) return tierH(pl.p) + U.fbm(x * 0.12, y * 0.12, 703) * 0.1;
  const b = bridgeAt(u, v, BRIDGE_HALF + 0.9); 
  if (b) return bridgeH(b.br, b.t);
  return FLOOR_H + U.fbm(x * 0.2, y * 0.2, 705) * 0.6;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  const pl = platformIn(x, y);
  if (pl.d > 0) {
    if (pl.p.beds && pl.d > 0.6 && U.fbm(x * 0.24, y * 0.24, 707) > 0.32) return T.THICKET; 
    return pl.p.tier ? T.GLADE : T.MOSS; 
  }
  return bridgeAt(u, v, BRIDGE_HALF) ? T.ROCK : T.CLIFF; 
}

export function generateCanopyWalk() { const it = canopyWalkSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* canopyWalkSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  
  
  const before = W.type.slice(), lanes = BRIDGES.map((br) => ({ pts: [fromUV(br.a.u, br.a.v), fromUV(br.b.u, br.b.v)], half: 0.5 }));
  for (const l of lanes) carvePath(W, W.type, l.pts);
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = before[k] === T.CLIFF ? T.ROCK : before[k];
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  { const p = at(-2.4, 52.3); addObj(W, { kind: 'ladder', x: p.x, y: p.y, solid: 0, rot: uvRot(0, 1) }); } 
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = lanes.map((l) => ({ pts: l.pts.map((p) => [...p]), half: l.half }));
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && platformIn(x, y).d > 0.6;
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  BRIDGES.forEach((br, bi) => {
    const L = Math.hypot(br.b.u - br.a.u, br.b.v - br.a.v), nu = -(br.b.v - br.a.v) / L, nv = (br.b.u - br.a.u) / L;
    for (const side of [-1, 1]) { let n = 0; for (let t = 0; t <= L; t += 1.0) {
      const u = br.a.u + (br.b.u - br.a.u) * t / L + nu * side * (BRIDGE_HALF + 0.35), v = br.a.v + (br.b.v - br.a.v) * t / L + nv * side * (BRIDGE_HALF + 0.35);
      const p = at(u, v); if (platformIn(p.x, p.y).d > -0.3) continue;
      addObj(W, { kind: 'fence', x: p.x, y: p.y, solid: 0, ring: `rope-${bi}-${side}`, k: n++, n: 0 });
    } }
  });
  
  BRIDGES.forEach((br) => { for (const [p, q] of [[br.a, br.b], [br.b, br.a]]) {
    const L = Math.hypot(q.u - p.u, q.v - p.v), f = (p.r - 0.5) / L, nu = -(q.v - p.v) / L, nv = (q.u - p.u) / L;
    const s = at(p.u + (q.u - p.u) * f + nu * 1.0, p.v + (q.v - p.v) * f + nv * 1.0);
    addObj(W, { kind: 'lantern', x: s.x, y: s.y, solid: 0.25, rot: Math.PI / 4 });
  } });
  
  for (const side of [-1, 1]) { const p = at(-3.6, 51.4 + side * 1.1); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.35, s: 1.1, rot: side * 1.3, v: side > 0 ? 1 : 2, flavor: 'moss' }); }
  yield 'buildings';
  const r = U.rng(7171), busy = (x, y) => Math.hypot(x - GATE.x, y - GATE.y) < 2.2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - EXIT.x, y - EXIT.y) < 1.8;
  const FLOWERS = ['#ff7a5a', '#ffd23a', '#e85aa0'];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    const [u, v] = toUV(x, y);
    
    if (t === T.CLIFF) { if (k < 0.12 && platformIn(x, y).d < -2.6 && !bridgeAt(u, v, 3.2)) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 0.9 + s * 0.4, rot }); continue; }
    if (t === T.ROCK || busy(x, y) || bridgeAt(u, v, 1.0)) continue;
    if (t === T.THICKET) { if (k < 0.12) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; }
    if (t === T.GLADE) { if (k < 0.1) addObj(W, { kind: 'flower', x, y, solid: 0, c: FLOWERS[Math.floor(s * 3)] }); continue; }
    if (k < 0.07) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.4, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.THICKET && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(7272);
  for (let t = 0; W.spots.length < 3 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y) || platformIn(x, y).d < 0.8) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'cw' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
