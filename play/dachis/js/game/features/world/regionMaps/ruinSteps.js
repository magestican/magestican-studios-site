






import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

export const ID = 'ruin-steps';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'ruin-steps', name: 'The Ruin Steps — The Temple Climb', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: ['Beast', 'Leaf', 'Gale'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const RAMP_U = 13.0, RAMP_HALF = 1.2, RISE = 1.0;
export const RAMPS = [47.6, 42.8, 38.0, 33.2].map((v, k) => ({ k, v, up: k % 2 ? -1 : 1 }));

export const LANDINGS = [{ u: -RAMP_U, v: 48.9, r: 2.4, h: 0 }, ...RAMPS.map((r) => ({ u: r.up * RAMP_U, v: r.v - 2.4, r: 2.6, h: (r.k + 1) * RISE }))];
export const FORECOURT_V = 50.2;  
export const TERRACE_V = 30.6;    
export const TOP_H = RAMPS.length * RISE;
export const ENTRY = at(0.0, 51.2);       
export const GATE = ENTRY;
export const EXIT = at(0.0, 28.6);        
export const EXIT_BACK = at(0.0, 30.0);   
export const SPRING = at(5.0, 51.3);      
export const LANDING = at(3.0, 51.0);

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const landingIn = (u, v) => Math.max(...LANDINGS.map((l) => l.r - Math.hypot(u - l.u, v - l.v)));
const landingOf = (u, v) => LANDINGS.find((l) => Math.hypot(u - l.u, v - l.v) < l.r) || null;

const rampAt = (u, v) => {
  for (const r of RAMPS) if (Math.abs(v - r.v) < RAMP_HALF && Math.abs(u) < RAMP_U + 0.5) return { r, t: U.clamp((u * r.up + RAMP_U) / (2 * RAMP_U), 0, 1) };
  return null;
};
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y);
  if (v > FORECOURT_V) return 0;
  if (v < TERRACE_V) return TOP_H;
  const l = landingOf(u, v); if (l) return l.h;
  const ra = rampAt(u, v); if (ra) return (ra.r.k + ra.t) * RISE;
  
  return U.clamp((FORECOURT_V - v) / (FORECOURT_V - TERRACE_V), 0, 1) * TOP_H - 0.3 + U.fbm(x * 0.4, y * 0.4, 901) * 0.5;
}

const overgrown = (u, v, x, y) => {
  const l = landingOf(u, v); if (l) return l !== LANDINGS[0] && U.fbm(x * 0.3, y * 0.3, 903) > 0.36;
  const ra = rampAt(u, v); return !!ra && ra.r.k % 2 === 1 && Math.abs(u) < 4.5 && U.fbm(x * 0.3, y * 0.3, 905) > 0.3;
};
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (v > FORECOURT_V || v < TERRACE_V) return Math.abs(u) < 7 ? T.PLAZA : T.RUIN;
  if (landingIn(u, v) > 0 || rampAt(u, v)) return overgrown(u, v, x, y) ? T.TALL : T.RUIN;
  return T.CLIFF; 
}

export function generateRuinSteps() { const it = ruinStepsSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* ruinStepsSteps() {
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - GATE.x, y - GATE.y) > 1.8;
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  for (const r of RAMPS) for (let u = -RAMP_U + 2.6; u <= RAMP_U - 2.6; u += 3.2) {
    const p = at(u, r.v + RAMP_HALF + 0.45); if (landingIn(u, r.v + RAMP_HALF + 0.45) > -0.6) continue;
    addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.4, v: Math.floor(Math.abs(u * 7 + r.k * 3)) % 3, s: 1.0, rot: 0 });
  }
  
  for (const side of [-1, 1]) { const p = at(side * 1.8, 28.4); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.5, v: 2, s: 1.5, rot: 0 }); }
  for (const l of LANDINGS) { const p = at(l.u - Math.sign(l.u) * 1.4, l.v + 1.0); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  yield 'buildings';
  const r = U.rng(9393), busy = (x, y) => Math.hypot(x - GATE.x, y - GATE.y) < 2.2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - EXIT.x, y - EXIT.y) < 2.4;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) {
      if (Math.abs(u) > RAMP_U + 2.6) { if (k < 0.14) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 1.1 + s * 0.5, rot }); continue; } 
      if (k < 0.1 && !rampAt(u, v + 0.9) && !rampAt(u, v - 0.9)) addObj(W, { kind: 'rock', x, y, solid: 0, s: 0.4 + s * 0.4, rot }); 
      continue;
    }
    if (t === T.TALL) { if (k < 0.07) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; }
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(9494);
  for (let t = 0; W.spots.length < 3 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'rs' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
