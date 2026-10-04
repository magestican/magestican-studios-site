





import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard } from '../dressing.js';

export const ID = 'shellhaven';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'shellhaven', name: 'Shellhaven — The Bubble Village', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 2, wildTypes: ['Tide', 'Frost', 'Metal'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };


export const BUBBLE = { u: 0, v: 40, ru: 15.2, rv: 11.4 };

export const skinD = (u, v) => (Math.hypot((u - BUBBLE.u) / BUBBLE.ru, (v - BUBBLE.v) / BUBBLE.rv) - 1) * BUBBLE.rv;
export const PLAZA = { ...at(0.6, 39.6), r: 3.0 };
export const GATE = at(-12.4, 42.6);       
export const ENTRY = GATE;
export const EAST_GATE = at(13.0, 40.2);   
export const EAST_BACK = at(10.8, 40.6);   
export const SPRING = at(2.2, 38.4);       
export const LANDING = at(0.8, 40.6);      
export const POSTS = { elder: at(-1.4, 37.6) };
export const HOME_DISC = { ...at(0.6, 40.4), r: 6.0 };


export const LANE = [[-13.4, 42.8], [-10.6, 41.8], [-8.0, 42.2], [-5.6, 43.0], [-3.2, 41.4], [-1.8, 40.6]].map(([u, v]) => { const p = at(u, v); return [p.x, p.y]; });
const HUTS = [[-6.4, 46.2, 1.4], [-5.6, 36.4, 1.45], [1.0, 33.0, 1.5], [7.4, 35.8, 1.4], [8.6, 43.8, 1.45], [1.6, 47.4, 1.35]];
const ROOFS = ['#f2a0b8', '#f4e2c8', '#5ec8c0', '#f0b080', '#9ad0f0', '#e890c0']; 


export const REEF_WAY = [[16.6, 89.6], [15.8, 92.0], [13.8, 94.2], [12.8, 97.2]].map(([u, v]) => fromUV(u, v));
export const HUT_SPOTS = HUTS.map(([u, v, sc]) => ({ ...at(u, v), s: sc }));
const LANTERNS = [[-7.6, 41.0], [-6.8, 44.0], [-3.6, 39.8], [-2.4, 42.8]];
export const DWELLERS = [
  { id: 'shell-v0', home: { ...at(-3.0, 43.6), r: 2.6 }, lines: [
    'You walked in dry. You are welcome. I patched that seam this morning. Nobody else would have, and nobody ever says so.',
    'Stay off the edge. Out there the water folds you up small. I saw it once. Do not make me see it again.'] },
  { id: 'shell-v1', home: { ...at(4.0, 41.0), r: 2.6 }, lines: [
    'Sit your friends in the clam\'s pool, it heals them. Then get them out. She pinches if they stay.',
    'Leviathrum pings before he drops. Ping, ping, ping, then the whole sea comes down on you. We used to count along with him. It was a game.'] },
  { id: 'shell-v2', home: { ...at(-2.6, 39.0), r: 2.4 }, lines: [
    'Lightning. That is what he cannot stand. A storm cracked his hull once and he sulked under the temple for a year. Grandmother says.',
    'The red-eyed ones in the kelp chewed every frond my sister planted. She cried. Then she bit one. We do not talk about it.'] },
  { id: 'shell-v3', home: { ...at(2.6, 45.4), r: 2.4 }, lines: [
    'I found a Memory Stone in the gardens and it talked. My brother says it was a shell. My brother is stupid.',
    'Your shoes squeak. Nobody here has shoes. Can I touch one? ...Can I keep one?'] },
];



export const ELDER = { name: 'Grandmother Conch', at: POSTS.elder };
export const ELDER_LINES = {
  before: [
    'You again. Good. Sit. No - not on that, that is the soup.',
    'This was the market square, once. When the sea came, the people took the boats. We fish folk stayed. Where is a fish going to go?',
    'Leviathrum, up in the plaza, was their guardian. He promised the children he would keep their houses for them. And he did. A hundred years he kept them.',
    'Now something has got into his head, and he goes on about the tide wiping out footprints. That is not his kind of talk. He used to tell jokes. Terrible ones.',
    'Go up if you must. Rest at the clam first, and pick up a Memory Stone on the way. They remember him better than he does now.',
  ],
  after: [
    'The water up top is clear. I keep looking up at it. My neck is killing me.',
    'He was never cruel, you know. Just alone too long. ...We could have swum up more. We did not. There, I have said it.',
    'The Memory Stones sound different now. Hold one up to your ear. There is laughing in it.',
    'Off you go, then. Come back for soup. That was not a question.',
  ],
};

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);

const seaD = (x, y) => skinD(...toUV(x, y)) + U.fbm(x * 0.25, y * 0.25, 83) * 0.9 - 0.45;
export const BASE_H = 0.2;
function heightAtPoint(x, y) {
  const d = seaD(x, y);
  if (d > 0) return -0.1 - Math.min(d, 4) * 0.18; 
  const rim = U.clamp(-d / 2.4, 0, 1); 
  return 0.04 + rim * (BASE_H - 0.04) + U.fbm(x * 0.1, y * 0.1, 87) * 0.2 * rim;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), d = seaD(x, y);
  if (d > 0) return d < 1.2 ? T.SHALLOW : T.DEEP;
  if (!inside(u, v)) return T.CLIFF;
  if (d > -1.6) return T.SAND; 
  if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + U.fbm(x * 0.4, y * 0.4, 89) * 1.0) return T.RUIN;
  
  const garden = (v < 38 || u > 3) && Math.hypot(x - PLAZA.x, y - PLAZA.y) > PLAZA.r + 2.2;
  return garden && U.fbm(x * 0.16, y * 0.16, 91) > 0.47 ? T.KELP : T.REEF;
}

export function generateShellhaven() { const it = shellhavenSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* shellhavenSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const spokes = [{ pts: LANE.map((p) => [...p]), half: 0.5 }];
  const huts = HUT_SPOTS.map((p, i) => {
    const rot = Math.atan2(PLAZA.x - p.x, PLAZA.y - p.y), out = 1.15 * p.s; 
    const door = [p.x + Math.sin(rot) * out, p.y + Math.cos(rot) * out];
    
    const dd = Math.hypot(PLAZA.x - door[0], PLAZA.y - door[1]), f = Math.max(0, (dd - PLAZA.r) / dd);
    spokes.push({ pts: [door, [door[0] + (PLAZA.x - door[0]) * f, door[1] + (PLAZA.y - door[1]) * f]], half: 0.3 });
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
  W.bubble = { ...BUBBLE };
  
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - GATE.x, y - GATE.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4;
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  for (const [u, v] of LANTERNS) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  for (const side of [-1, 1]) { const p = at(13.0, 40.2 + side * 1.3); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  for (const side of [-1, 1]) { const p = at(-12.2, 42.6 + side * 1.4); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.4, s: 1.5, rot: side * 1.3, v: side > 0 ? 1 : 2, flavor: 'coral' }); }
  
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.9, p = { x: PLAZA.x + Math.cos(a) * (PLAZA.r + 0.9), y: PLAZA.y + Math.sin(a) * (PLAZA.r + 0.9) }; if (laneDist(spokes, p.x, p.y) > 1.0) addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.3, s: 0.9 + (k % 2) * 0.2, rot: a, v: k % 3 }); }
  
  
  const dr = U.rng(8383), elder = POSTS.elder;
  const dclear = (x, y, r) => laneDist(spokes, x, y) > 0.45 + r && Math.hypot(x - GATE.x, y - GATE.y) > 2.2 + r
    && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.6 + r && Math.hypot(x - elder.x, y - elder.y) > 0.9 + r && Math.hypot(x - LANDING.x, y - LANDING.y) > 1.2 + r;
  guardHuts(W, huts);
  placeYard(W, 'cookfire', at(-3.2, 37.0), { clear: dclear });
  placeYard(W, 'bowl', at(-2.5, 36.1), { clear: dclear, extra: { c: '#f0c890' } });
  const yclear = (x, y, r) => dclear(x, y, r) && Math.hypot(x - PLAZA.x, y - PLAZA.y) > PLAZA.r + 0.4 + r;
  placeYard(W, 'fishrack', at(5.0, 47.2), { rot: 0.4, clear: yclear });
  placeYard(W, 'fishrack', at(-9.4, 38.4), { rot: -0.3, clear: yclear });
  placeYard(W, 'washline', at(4.6, 32.4), { rot: 0.2, clear: yclear });
  dressHuts(W, huts, { rng: dr, kinds: ['bowl', 'basket', 'pots', 'strawbed', 'crates', 'toys', 'tools', 'fishrack'], food: ['#e8f4f0', '#7ad0a0', '#f0a080', '#ffd0e0'], clear: yclear });
  yield 'buildings';
  const r = U.rng(8181);
  const clear = (x, y, d) => Math.hypot(x - GATE.x, y - GATE.y) > 2.4 && Math.hypot(x - SPRING.x, y - SPRING.y) > 2.0
    && Math.hypot(x - PLAZA.x, y - PLAZA.y) > PLAZA.r + 0.6
    && huts.every((h) => Math.hypot(x - h.x, y - h.y) > 2.3 && Math.hypot(x - h.door[0], y - h.door[1]) > 1.6) && laneDist(spokes, x, y) > 0.5 + d;
  const CORAL_C = ['#ff7a8a', '#ffb36b', '#c88aff', '#6fe0d0', '#ffe07a'];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (t === T.CLIFF) { if (k < 0.3) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 8) % 4, flavor: 'coral' }); continue; }
    if (t === T.DEEP) { if (k < 0.03) addObj(W, { kind: 'coral', x, y, solid: 0, s: 0.8 + s * 0.6, rot, c: CORAL_C[Math.floor(s * 5)] }); continue; }
    if (t === T.SHALLOW) { if (k < 0.08) addObj(W, { kind: 'coral', x, y, solid: 0, s: 0.6 + s * 0.5, rot, c: CORAL_C[Math.floor(s * 5)] }); continue; }
    if (t === T.RUIN || !clear(x, y, 0.5)) continue;
    if (t === T.SAND) { if (k < 0.05) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.35 + s * 0.4, rot, flavor: 'coral' }); continue; }
    if (t === T.KELP) { if (k < 0.1) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.9 + s * 0.6, rot, flavor: 'kelp' }); continue; }
    if (k < 0.07) addObj(W, { kind: 'coral', x, y, solid: 0.25, s: 0.6 + s * 0.6, rot, c: CORAL_C[Math.floor(s * 5)] });
    else if (k < 0.1) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.7 + s * 0.4, rot, flavor: 'kelp' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.KELP && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(8282);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || !clear(x, y, 0.3)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'sh' + W.spots.length, x, y, item: rs() < 0.6 ? 'tonic' : 'candy' });
  }
  return W;
}
function laneDist(spokes, x, y) { return Math.min(...spokes.map((s) => s.pts.reduce((m, p, k) => (k ? Math.min(m, segDist(s.pts[k - 1], p, x, y)) : m), Infinity))); }
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}
