







import { U } from '../../../../engine/core/util.js';
import { uvRot, addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard, fruitGrove } from '../dressing.js';

export const ID = 'hollowroot';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'hollowroot', name: 'Hollowroot — The Treetop Village', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 3, wildTypes: ['Leaf', 'Spirit'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const PLATFORMS = [
  { id: 'ladder', u: -11.4, v: 42.0, r: 3.6, kind: 'huts' },   
  { id: 'hub', u: 0.0, v: 40.0, r: 5.2, kind: 'hub' },         
  { id: 'north', u: -3.6, v: 31.0, r: 4.0, kind: 'leaves' },
  { id: 'east', u: 11.0, v: 37.4, r: 4.0, kind: 'huts' },
  { id: 'lookout', u: 10.6, v: 29.6, r: 3.0, kind: 'leaves' },
  { id: 'south', u: 2.4, v: 49.6, r: 3.8, kind: 'leaves' },
  { id: 'nest', u: -11.6, v: 31.6, r: 3.4, kind: 'leaves' },   
  { id: 'southeast', u: 11.8, v: 48.0, r: 3.6, kind: 'leaves' },
];
const P = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export const BOUGHS = [
  [[-11.4, 42.0], [-8.0, 41.0], [-4.6, 41.4], [0.0, 40.0]],
  [[0.0, 40.0], [-1.0, 36.6], [-2.8, 33.4], [-3.6, 30.6]],
  [[0.0, 40.0], [4.0, 39.6], [7.6, 38.0], [11.0, 37.4]],
  [[0.0, 40.0], [1.6, 43.8], [1.4, 47.0], [2.4, 50.0]],
  [[11.0, 37.4], [11.6, 33.6], [10.4, 29.2]],
  [[-3.6, 30.6], [0.8, 29.0], [5.6, 29.8], [10.4, 29.2]],
  [[-11.4, 42.0], [-12.4, 38.4], [-11.6, 34.6], [-11.6, 31.6]],
  [[-11.6, 31.6], [-8.0, 30.4], [-3.6, 31.0]],
  [[11.0, 37.4], [12.2, 41.0], [11.4, 44.6], [11.8, 48.0]],
  [[2.4, 49.6], [6.0, 50.6], [9.0, 49.4], [11.8, 48.0]],
];
export const BOUGH_HALF = 1.05; 
export const SLIDE = at(13.4, 49.6);        
export const SLIDE_BACK = at(11.4, 47.6);   
export const KNOT = at(0.6, 36.0);          
export const KNOT_BACK = at(-0.4, 38.0);    
export const ENTRY = at(-12.4, 42.6);       
export const GATE = ENTRY;
export const SPRING = at(1.6, 38.8);        
export const LANDING = at(-0.6, 41.4);      
export const POSTS = { elder: at(-1.6, 38.4) };
export const HOME_DISC = { ...at(0, 40.4), r: 6.0 };
const HUTS = [[-10.6, 39.8, 1.35, 'ladder'], [-12.2, 44.4, 1.35, 'ladder'], [12.4, 35.6, 1.4, 'east'], [9.8, 39.8, 1.4, 'east'], [2.6, 42.6, 1.35, 'hub']];
const ROOFS = ['#8cc65a', '#f0a050', '#d0805a', '#b0d870', '#e8c860']; 
export const HUT_SPOTS = HUTS.map(([u, v, s, on]) => ({ ...at(u, v), s, on }));
const LANTERNS = [[-9.2, 42.6], [-6.4, 40.4], [-3.2, 42.2], [5.6, 38.2], [1.0, 45.2], [-1.8, 35.0]]; 

export const DWELLERS = [
  { id: 'hollow-v0', home: { ...at(-10.4, 42.4), r: 1.8 }, lines: [
    'You did the whole ladder? Huh. I had a fig on you turning back at the first wobble. Now I owe Tamsin a fig, and she\'s going to be smug about it.',
    'Don\'t look down. Or do, I\'m not your mother. Just don\'t do it standing on one foot.'] },
  { id: 'hollow-v1', home: { ...at(10.6, 37.0), r: 2.0 }, lines: [
    'Mother Bramble grew our huts for us. Bough by bough, she did. Then she started taking the boughs back. Didn\'t ask. She always used to ask.',
    'When her grove smells sweet - like fruit that\'s gone off - get your friends out of there. That rot gets into them and it stays. Bring something to clean it out, is all I\'m saying.'] },
  { id: 'hollow-v2', home: { ...at(1.4, 49.4), r: 2.0 }, lines: [
    'Burn it. There. I said it. Everybody up here\'s thinking it. Fire or frost - that\'s all the thorns are scared of, nothing else.',
    'She tended every flower down there with her own hands. Then the red came and she started on the tree. And don\'t tell me she can\'t help it. Don\'t.'] },
  { id: 'hollow-v3', home: { ...at(-3.2, 31.2), r: 2.0 }, lines: [
    'Shh. Stand still. Hear that? The tree\'s breathing. Slower since spring. I count it every night.',
    'Her roots grab whatever stands still. My dachi stood still. ...When the ground goes quiet, you keep moving. Okay? You keep moving.'] },
];


export const ELDER = { name: 'Grandfather Burl', at: POSTS.elder };
export const ELDER_LINES = {
  before: [
    'Hm? Oh. A ground walker. Up here. ...Forgive me, I was halfway through a thought. It was a long one. It may have been about moss.',
    'Bramble planted this tree. Did they tell you? One seed, on a bare hill. I was there. I told her it would never take. Three hundred summers I have been wrong.',
    'She sang to every bed a different song. The beans liked marching songs, she said, and the lilies did not. I never could hear the difference. She never stopped trying to teach me.',
    'Last spring she began to talk about soil. Old worlds for soil, new gardens on top. I nodded. I nod at everything she says. I have done it for three hundred years.',
    'I should have said something. I did not. ...If you go down to her, tell her Burl says the violets came up. She will know.',
  ],
  after: [
    'The thorns are going back into the ground. I watched from the lookout half the night. My knees are not pleased.',
    'Bramble came by the ladder this morning. She did not climb it. She put her hand on the trunk and listened, and went away again.',
    'She is planting again, down in the grove. She has not come up here. I have not gone down. We are both very busy.',
  ],
};

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};
const boughD = (u, v) => Math.min(...BOUGHS.map((b) => b.reduce((m, p, k) => (k ? Math.min(m, segD(b[k - 1], p, u, v)) : m), Infinity)));

const platformIn = (x, y) => {
  const [u, v] = toUV(x, y), w = U.fbm(x * 0.3, y * 0.3, 301) * 0.8 - 0.4;
  return Math.max(...PLATFORMS.map((p) => p.r - Math.hypot(u - p.u, v - p.v) + w));
};
const platformOf = (u, v) => PLATFORMS.find((p) => Math.hypot(u - p.u, v - p.v) < p.r + 0.6) || null;

export const onTree = (x, y) => { const [u, v] = toUV(x, y); return Math.max(platformIn(x, y), BOUGH_HALF - boughD(u, v)); };
export const DECK_H = 1.1;   
const FLOOR_H = -1.8;        
function heightAtPoint(x, y) {
  const d = onTree(x, y);
  if (d > 0) return DECK_H + U.fbm(x * 0.12, y * 0.12, 303) * 0.12;
  return FLOOR_H + U.fbm(x * 0.2, y * 0.2, 305) * 0.5; 
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  const d = onTree(x, y);
  if (d <= 0) return T.CLIFF; 
  const p = platformOf(u, v);
  if (p && p.kind === 'leaves' && d > 0.5 && U.fbm(x * 0.22, y * 0.22, 307) > 0.3) return T.THICKET; 
  return d < 0.55 ? T.MOSS : T.GLADE; 
}

export function generateHollowroot() { const it = hollowrootSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* hollowrootSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % 16 === 15) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  
  const lanes = BOUGHS.map((b) => ({ pts: b.map(([u, v]) => fromUV(u, v)), half: 0.55 }));
  for (const l of lanes) carvePath(W, W.type, l.pts.map(([x, y]) => [x, y]));
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.MOSS;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  
  { const p = at(-13.3, 42.6), q = at(14.1, 50.3); addObj(W, { kind: 'ladder', x: p.x, y: p.y, solid: 0, rot: uvRot(-1, 0) }); addObj(W, { kind: 'ropeslide', x: q.x, y: q.y, solid: 0, rot: uvRot(1, 0.6) }); addObj(W, { kind: 'knothole', x: KNOT.x, y: KNOT.y, solid: 0, s: 1.1 }); }
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = lanes.map((l) => ({ pts: l.pts.map((p) => [...p]), half: l.half }));
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && onTree(x, y) > 0.6 && Math.hypot(x - GATE.x, y - GATE.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4;
  const huts = HUT_SPOTS.map((h, i) => {
    const c = P[h.on], cp = at(c.u, c.v), rot = Math.atan2(cp.x - h.x, cp.y - h.y); 
    return { ...h, i, rot, door: [h.x + Math.sin(rot) * 1.15 * h.s, h.y + Math.cos(rot) * 1.15 * h.s] };
  });
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  for (const [u, v] of LANTERNS) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  for (const side of [-1, 1]) { const p = at(-12.8, 42.6 + side * 1.1); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.35, s: 1.2, rot: side * 1.3, v: side > 0 ? 1 : 2, flavor: 'moss' }); }
  
  
  
  {
    const dr = U.rng(9393);
    const dclear = (x, y, r) => boughD(...toUV(x, y)) > 0.5 + r && Math.hypot(x - GATE.x, y - GATE.y) > 2.4 + r && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r
      && Math.hypot(x - KNOT.x, y - KNOT.y) > 1.6 + r && Math.hypot(x - LANDING.x, y - LANDING.y) > 1.3 + r && onTree(x, y) > 0.4 + r && huts.every((h) => Math.hypot(x - h.door[0], y - h.door[1]) > 0.9 + r);
    guardHuts(W, huts);
    placeYard(W, 'washline', at(10.4, 34.8), { rot: 0.9, clear: dclear });
    placeYard(W, 'cookfire', at(0.4, 40.2), { clear: dclear });
    placeYard(W, 'tools', at(-9.2, 42.6), { clear: dclear });
    
    for (const [k, u, v, c] of [['pots', -3.0, 42.0], ['toys', 2.6, 37.2], ['basket', -2.8, 37.6, '#e8d040'], ['strawbed', 3.6, 43.4],
      ['crates', -12.6, 40.4], ['basket', -10.0, 43.6, '#f0b030'], ['pots', 12.6, 38.6], ['toys', 9.6, 36.0], ['strawbed', 11.4, 39.8]]) {
      placeYard(W, k, at(u, v), { rot: dr() * 6.28, clear: dclear, extra: c ? { c } : {} });
    }
    dressHuts(W, huts, { rng: dr, kinds: ['strawbed', 'basket', 'pots', 'toys', 'bowl', 'tools'], food: ['#e8d040', '#f0b030', '#8a3a6a'], clear: dclear, perHut: [3, 5] });
    fruitGrove(W, at(4.4, 44.8), 'banana', { rng: dr, clear: dclear });
    fruitGrove(W, at(-2.0, 44.0), 'mango', { rng: dr, clear: dclear });
  }
  yield 'buildings';
  const r = U.rng(9191);
  const busy = (x, y, d) => Math.hypot(x - GATE.x, y - GATE.y) < 2.4 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2.0
    || huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.3 || Math.hypot(x - h.door[0], y - h.door[1]) < 1.6)
    || boughD(...toUV(x, y)) < 0.6 + d;
  const FLOWERS = ['#ffd6f0', '#fff3a0', '#c8a0ff', '#ffb070'];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    
    if (t === T.CLIFF) { if (k < 0.16 && onTree(x, y) < -1.1) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 1.2 + s * 0.7, rot, flavor: 'verdant' }); continue; }
    if (busy(x, y, 0.4)) continue;
    if (t === T.THICKET) { if (k < 0.14) addObj(W, { kind: 'bramble', x, y, solid: 0, s: 0.5 + s * 0.3, rot }); continue; }
    if (t === T.MOSS) { if (k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; }
    if (k < 0.12) addObj(W, { kind: 'flower', x, y, solid: 0, c: FLOWERS[Math.floor(s * 4)] });
    else if (k < 0.15) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.35 + s * 0.3, rot, flavor: 'moss' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.THICKET && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(9292);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y, 0.1)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'hr' + W.spots.length, x, y, item: rs() < 0.6 ? 'tonic' : 'candy' });
  }
  return W;
}
