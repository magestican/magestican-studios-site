





import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';

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
    'You walked in from the reef? Dry? The bubble likes you, then. It does not let in just anyone.',
    'Breathe slow near the edge. Out there the water is heavy enough to fold you up like a letter.'] },
  { id: 'shell-v1', home: { ...at(4.0, 41.0), r: 2.6 }, lines: [
    'The clam has kept this pool warm since before the city drowned. Rest by it - it heals your friends.',
    'Leviathrum swims past at night. We used to wave. Now we hide under the kelp.'] },
  { id: 'shell-v2', home: { ...at(-2.6, 39.0), r: 2.4 }, lines: [
    'The kelp gardens north and east are full of wild ones. Most are only scared. The red-eyed ones are not.',
    'My grandmother said the city above us waited a hundred years for its people to come back. They never did.'] },
  { id: 'shell-v3', home: { ...at(2.6, 45.4), r: 2.4 }, lines: [
    'Memory Stones wash up in the gardens sometimes. Hold one to your ear and you hear the city as it was.',
    'Your shoes squeak. Nobody here has shoes. Can I touch one?'] },
];



export const ELDER = { name: 'Grandmother Conch', at: POSTS.elder };
export const ELDER_LINES = {
  before: [
    'A dry child, walking in from the reef. The bubble has not opened for a human in a hundred years.',
    'This was the market square of a city, once. When the sea came, we fish folk stayed. The people left.',
    'The great one in the plaza up there, Leviathrum, was the city\'s guardian. He waited for them to come back.',
    'He waited so long the waiting went sour. Now he says the tide erases every footprint. He wants it to erase us too.',
    'Rest at the clam before you go up to him. And listen to the Memory Stones - they remember what he forgot.',
  ],
  after: [
    'You did it. The water up there is clear again - I can see the sun on the bubble for the first time in years.',
    'Leviathrum was not cruel, child. He was lonely. A guardian with no one left to guard.',
    'The Memory Stones sing differently now. Hold one to your ear: the city is laughing in them.',
    'Go on, then. Footprints in sand wash away. Footprints in a friend do not.',
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
  
  for (const side of [-1, 1]) { const p = at(-12.2, 42.6 + side * 1.4); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.4, s: 1.5, rot: side * 1.3, v: side > 0 ? 1 : 2, flavor: 'coral' }); }
  
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.9, p = { x: PLAZA.x + Math.cos(a) * (PLAZA.r + 0.9), y: PLAZA.y + Math.sin(a) * (PLAZA.r + 0.9) }; if (laneDist(spokes, p.x, p.y) > 1.0) addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.3, s: 0.9 + (k % 2) * 0.2, rot: a, v: k % 3 }); }
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
