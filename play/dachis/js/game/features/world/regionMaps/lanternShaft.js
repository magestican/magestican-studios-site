







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'lantern-shaft';
export const SIZE = 80;
export const SECTIONS = addSections([
  { id: 'shaft-a', name: 'The Lantern Shaft - The Upper Shaft', rect: { u: [-18, 18], v: [30, 56] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, dark: true, wildTypes: ['Stone', 'Metal', 'Shadow'] },
  { id: 'shaft-b', name: 'The Lantern Shaft - The Lower Seam', rect: { u: [-18, 18], v: [56, 82] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, dark: true, wildTypes: ['Stone', 'Metal', 'Shadow'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const TUNNEL = [[0, 32.5], [-6, 37], [-9, 43], [-3, 48], [6, 51], [10, 57], [5, 63], [-4, 66], [-10, 71], [-6, 77], [1, 79.5]];
export const TUNNEL_HALF = 1.15;

const POCKET_HINTS = [{ u: -12.5, v: 38.5, r: 2.4 }, { u: 3.5, v: 44.5, r: 2.2 }, { u: 12.5, v: 50, r: 2.4 }, { u: 13, v: 63.5, r: 2.6 }, { u: -2.5, v: 60, r: 2.4 }, { u: -13.5, v: 66, r: 2.6 }, { u: 3.5, v: 73.5, r: 2.4 }];
export const ENTRY = at(0, 33.4);     
export const SPRING = at(-2.6, 34.6); 
export const LANDING = at(-4.2, 35.6); 
export const END = at(1, 79.5);       
export const END_BACK = at(-2.6, 77.6); 

export const LIGHT = { kid: 1.9, lamp: 4.4, catch: 1.6 }; 
export function lanternSpots() {
  const out = [];
  for (let k = 0; k < TUNNEL.length - 1; k++) {
    const [au, av] = TUNNEL[k], [bu, bv] = TUNNEL[k + 1], L = Math.hypot(bu - au, bv - av), nu = -(bv - av) / L, nv = (bu - au) / L;
    for (let t = 2.5; t < L - 0.5; t += 5.5) {
      const side = (out.length % 2 ? 1 : -1) * (TUNNEL_HALF + 0.25);
      out.push({ id: 'ls' + out.length, u: au + (bu - au) * t / L + nu * side, v: av + (bv - av) * t / L + nv * side });
    }
  }
  return out.map((l) => ({ ...l, ...at(l.u, l.v) }));
}

export const lampsToLight = (lamps, lit, x, y, reach) => lamps.filter((l) => !lit[l.id] && Math.hypot(l.x - x, l.y - y) < reach).map((l) => l.id);
export const DWELLERS = [
  { id: 'shaft-v0', home: { ...at(-1.4, 47.2), r: 1.0 }, lines: [
    'Leave them out. Please. I only just stopped shaking. You light one and I can hear the camp again - all of it, all at once.',
    'The Hermit sat with me in the dark the first night. Didn\'t say a word. Nobody\'s ever just... sat with me. ...Go on, then. Light it. You\'re going to anyway.'] },
  { id: 'shaft-v1', home: { ...at(2.0, 78.0), r: 1.0 }, lines: [
    'The crack goes right through to the Hush\'s workings. Tunn says the ceiling has to settle. Tunn says that about everything. His knees, his soup, his wife.',
    'I\'m not one of the Hush, okay? I came down to get my sister out. She told me to go home. Then she put my lamp out with her thumb. Like a birthday candle.'] },
];

function nearestOnTunnel(u, v) {
  let best = null;
  for (let k = 1; k < TUNNEL.length; k++) {
    const [au, av] = TUNNEL[k - 1], [bu, bv] = TUNNEL[k], du = bu - au, dv = bv - av, L = du * du + dv * dv;
    const t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1), pu = au + du * t, pv = av + dv * t, d = Math.hypot(pu - u, pv - v);
    if (!best || d < best.d) best = { u: pu, v: pv, d };
  }
  return best;
}
export const POCKETS = POCKET_HINTS.map((p) => {
  const n = nearestOnTunnel(p.u, p.v), want = TUNNEL_HALF + p.r - 0.7; 
  return { u: n.u + (p.u - n.u) * want / n.d, v: n.v + (p.v - n.v) * want / n.d, r: p.r };
});
const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};

export const inTunnel = (u, v) => TUNNEL_HALF - TUNNEL.reduce((m, p, k) => (k ? Math.min(m, segD(TUNNEL[k - 1], p, u, v)) : m), Infinity);
export const inPocket = (u, v) => Math.max(...POCKETS.map((p) => p.r - Math.hypot(u - p.u, v - p.v)));
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), open = Math.max(inTunnel(u, v), inPocket(u, v));
  return open > -0.3 ? 0.2 + U.fbm(x * 0.15, y * 0.15, 801) * 0.25 - (v - 30) * 0.012 : 1.6 + U.fbm(x * 0.2, y * 0.2, 803) * 0.8;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (inTunnel(u, v) > 0) return T.ROCK; 
  if (!inside(u, v)) return T.CLIFF;
  
  if (inPocket(u, v) > 0) return inPocket(u, v) > 0.6 ? T.MOSS : T.ROCK;
  return T.CLIFF;
}

export function generateLanternShaft() { const it = lanternShaftSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* lanternShaftSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && U.dist(x, y, ENTRY.x, ENTRY.y) > 1.8;
  
  const lamps = lanternSpots();
  W.dark = { lamps, ...LIGHT };
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  for (const l of lamps) addObj(W, { kind: 'lantern', x: l.x, y: l.y, solid: 0.2, rot: Math.PI / 4 });
  
  for (const [du, dv, s] of [[-2.2, 1.0, 1.1], [2.4, 1.0, 1.3], [2.8, -0.6, 0.9], [-2.6, -0.4, 1.0]]) { const p = at(1 + du, 79.5 + dv); addObj(W, { kind: 'rock', x: p.x, y: p.y, solid: 0.5, s, rot: 0.4 + Math.abs(du) * 2, dark: true }); }
  yield 'buildings';
  const r = U.rng(8181);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 1.6 || U.dist(x, y, SPRING.x, SPRING.y) < 2) continue;
    if (t === T.CLIFF) { if (k < 0.75) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.9, rot, v: Math.floor(k * 8) % 4 }); continue; } 
    if (t === T.MOSS && k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot, flavor: 'shrine' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(8282);
  
  for (const p of POCKETS) {
    if (W.spots.length >= 5) break;
    const q = at(p.u + (rs() - 0.5), p.v + (rs() - 0.5));
    if (!W.reach[W.idx(Math.floor(q.x), Math.floor(q.y))] || !W.walkable(q.x, q.y, 0.4)) continue;
    W.spots.push({ id: 'ls' + W.spots.length, x: q.x, y: q.y, item: rs() < 0.5 ? 'tonic' : rs() < 0.8 ? 'candy' : 'seal' });
  }
  return W;
}
