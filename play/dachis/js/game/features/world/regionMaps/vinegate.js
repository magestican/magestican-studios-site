





import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard, fruitGrove } from '../dressing.js';
import { fenceGuards } from '../functional.js';

export const ID = 'vinegate';
export const SIZE = 64;
export const SECTIONS = addSections([
  { id: 'vinegate', name: 'Vinegate Landing — The River Village', rect: { u: [-18, 18], v: [26, 54] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 4, wildTypes: ['Beast', 'Leaf', 'Gale'] },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const riverV = (u) => 40 + Math.sin(u * 0.22) * 1.6;
export const RIVER_HALF = 7.0;

export const WALKS = [
  { pts: [[-1.0, 50.5], [-1.6, 46.0], [0.4, 41.0], [-0.6, 36.0], [0.8, 31.5]], half: 0.95 },   
  { pts: [[-0.8, 43.6], [-5.0, 42.6], [-9.0, 40.6]], half: 0.75 },                               
  { pts: [[0.2, 39.0], [4.6, 40.2], [9.0, 41.6]], half: 0.75 },                                  
  { pts: [[-0.4, 36.6], [5.0, 35.4], [11.0, 35.2]], half: 0.75 },                                
  { pts: [[-1.2, 47.2], [-6.4, 46.6]], half: 0.7 },                                               
];
export const DECKS = [
  { u: -9.6, v: 40.6, r: 2.3 }, { u: 9.6, v: 41.8, r: 2.3 }, { u: 11.6, v: 35.0, r: 2.1 }, { u: 0.4, v: 41.0, r: 2.6 }, { u: -6.8, v: 46.6, r: 1.5 },
];
export const ENTRY = at(-1.0, 50.2);        
export const GATE = ENTRY;
export const SPRING = at(2.4, 50.8);        
export const LANDING = at(1.0, 49.6);       
export const POSTS = { elder: at(1.6, 41.6) }; 
export const HOME_DISC = { ...at(0.4, 41.0), r: 7.0 };
const HUTS = [[-10.0, 40.0, 1.35], [10.0, 42.4, 1.4], [12.0, 34.4, 1.35], [-1.4, 41.4, 1.35]];
const ROOFS = ['#7cb848', '#d8a050', '#c86a3a', '#e0c060'];
export const HUT_SPOTS = HUTS.map(([u, v, s]) => ({ ...at(u, v), s }));
export const DWELLERS = [
  { id: 'vine-v0', home: { ...at(-0.6, 48.2), r: 1.6 }, lines: [
    'You came on the big bird? Hoo! Hold the rails. It always rains here, and I\'m not fishing you out. I\'ve fished out three this week already.',
    'The river runs all the way up to the old temple steps. Nobody fishes past the bend, though. The fish up there have opinions.'] },
  { id: 'vine-v1', home: { ...at(9.2, 41.0), r: 1.4 }, lines: [
    'Kingshade used to swing down every morning. Now he sends guards. My son\'s a guard. My son used to swing down too. ...He doesn\'t swing anymore.',
    'When the king crosses his fists, don\'t hit him. It\'s like punching a mountain. He has to uncross them to bring them down. That\'s when. Then.'] },
  { id: 'vine-v2', home: { ...at(-8.8, 41.4), r: 1.4 }, lines: [
    'Stilts, because the river floods. Kingshade carried my mom up the vines in the last one. Don\'t tell him I told you. He gets embarrassed.',
    'Throw a fig in the water for luck. Not that fig. That\'s my fig. ...The canopy gales knocked him flat once, you know. Wind. He hates wind.'] },
];
export const ELDER = { name: 'Old Banyan', at: POSTS.elder };
export const ELDER_LINES = {
  before: [
    'Another one off the big bird. Smaller than I was told. Mind the third board, it bites.',
    'Kingshade carried half this village up the vines in the flood. Me included. Twenty years I have owed him for that, and he has never once sent the bill.',
    'Now he wants to walk us all out through a spiral to a jungle with no river. Half my people would follow him off a cliff. The other half fish. Fishers need a river.',
    'I am too old to climb to that throne. That is my excuse and I am keeping it. You go. Let him talk before you hit him - nobody has let him talk in a year.',
  ],
  after: ['He came down. Sat in my kitchen and ate four fish without a word. I am charging him for the fish.'],
};

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const segD = ([au, av], [bu, bv], u, v) => {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
  return Math.hypot(au + du * t - u, av + dv * t - v);
};

export const onPlanks = (u, v) => Math.max(
  ...WALKS.map((w) => w.half - w.pts.reduce((m, p, k) => (k ? Math.min(m, segD(w.pts[k - 1], p, u, v)) : m), Infinity)),
  ...DECKS.map((d) => d.r - Math.hypot(u - d.u, v - d.v)));

const inRiver = (x, y) => { const [u, v] = toUV(x, y); return RIVER_HALF - Math.abs(v - riverV(u)) + U.fbm(x * 0.3, y * 0.3, 601) * 0.8 - 0.4; };
export const DECK_H = 0.45;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), r = inRiver(x, y);
  if (onPlanks(u, v) > 0) return DECK_H;
  if (r > 0) return -0.15 - Math.min(r, 4) * 0.2; 
  return 0.3 + U.fbm(x * 0.1, y * 0.1, 603) * 0.25 + Math.min(1.2, -r * 0.08);
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (onPlanks(u, v) > 0) return T.ROCK; 
  const r = inRiver(x, y);
  if (r > 1.2) return T.DEEP;
  if (r > 0) return T.SHALLOW;
  if (r > -1.4) return T.SAND; 
  
  return U.fbm(x * 0.18, y * 0.18, 605) > (v < 40 ? 0.42 : 0.55) ? T.TALL : T.JUNGLE;
}

export function generateVinegate() { const it = vinegateSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* vinegateSteps() {
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - GATE.x, y - GATE.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4;
  const huts = HUT_SPOTS.map((h, i) => ({ ...h, i, rot: Math.atan2(at(0.4, 41).x - h.x, at(0.4, 41).y - h.y) }));
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  { const w = WALKS[0];
    for (let k = 1; k < w.pts.length; k++) {
      const [a, b] = [w.pts[k - 1], w.pts[k]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nu = -(b[1] - a[1]) / L, nv = (b[0] - a[0]) / L;
      for (const side of [-1, 1]) { let n = 0; for (let t = 0.5; t < L; t += 1.1) {
        const u = a[0] + (b[0] - a[0]) * t / L + nu * side * (w.half + 0.1), v = a[1] + (b[1] - a[1]) * t / L + nv * side * (w.half + 0.1);
        if (DECKS.some((d) => Math.hypot(u - d.u, v - d.v) < d.r + 0.2) || WALKS.slice(1).some((s) => s.pts.some((p) => Math.hypot(u - p[0], v - p[1]) < 1.4))) continue;
        
        const p = at(u, v); if (!fenceGuards(W, { kind: 'fence', x: p.x, y: p.y })) continue;
        addObj(W, { kind: 'fence', x: p.x, y: p.y, solid: 0.15, ring: `pier-${k}-${side}`, k: n++, n: 0 });
      } } 
    } }
  
  
  for (const side of [-1, 1]) { const p = at(0.8 + side * 1.6, 29.8); addObj(W, { kind: 'rimstone', x: p.x, y: p.y, solid: 0.35, s: 1.2, rot: side * 1.3, v: side > 0 ? 1 : 2, flavor: 'moss' }); }
  for (const [u, v] of [[-2.6, 30.4], [4.2, 30.4], [-2.4, 49.4], [0.6, 48.6], [-1.8, 39.6], [2.2, 42.8], [-0.2, 32.6]]) { const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  
  
  {
    const dr = U.rng(6464), walkD = (x, y) => Math.min(...WALKS.map((w) => w.pts.reduce((m, p, k) => (k ? Math.min(m, segDistUV(w.pts[k - 1], p, ...toUV(x, y))) : m), Infinity)));
    const dclear = (x, y, r) => walkD(x, y) > 0.7 + r && Math.hypot(x - GATE.x, y - GATE.y) > 2.2 + r && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r
      && Math.hypot(x - LANDING.x, y - LANDING.y) > 1.2 + r && Math.hypot(x - POSTS.elder.x, y - POSTS.elder.y) > 0.9 + r;
    guardHuts(W, huts);
    dressHuts(W, huts, { rng: dr, kinds: ['fishrack', 'basket', 'pots', 'crates', 'strawbed', 'toys', 'tools', 'bowl'], food: ['#e8d040', '#8ab4cc', '#f0b030'], clear: dclear, perHut: [3, 5] });
    for (const [k, u, v, c] of [['fishrack', 2.8, 42.6], ['cookfire', -1.8, 41.6], ['washline', 3.0, 37.4], ['basket', -2.4, 52.6, '#e8d040'], ['crates', 4.6, 49.4], ['pots', -3.6, 49.2]]) {
      placeYard(W, k, at(u, v), { rot: dr() * 6.28, clear: dclear, extra: c ? { c } : {} });
    }
    fruitGrove(W, at(-5.6, 52.0), 'banana', { rng: dr, clear: dclear });
    fruitGrove(W, at(6.6, 51.6), 'banana', { rng: dr, clear: dclear });
    fruitGrove(W, at(-6.0, 30.6), 'mango', { rng: dr, clear: dclear, falls: 3 });
  }
  yield 'buildings';
  const r = U.rng(6161), busy = (x, y) => huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.2) || Math.hypot(x - SPRING.x, y - SPRING.y) < 1.8 || Math.hypot(x - GATE.x, y - GATE.y) < 2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    const [u, v] = toUV(x, y); if (onPlanks(u, v) > -0.4) continue; 
    if (t === T.CLIFF) { if (k < 0.12) addObj(W, { kind: 'jtree', x, y, solid: 0, s: 1.2 + s * 0.6, rot }); continue; }
    if (t === T.SHALLOW) { if (k < 0.04) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; } 
    if (t === T.DEEP || t === T.SAND) continue;
    if (t === T.TALL) { if (k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); continue; }
    if (k < 0.05) addObj(W, { kind: 'jtree', x, y, solid: 0.45, s: 1 + s * 0.4, rot });
    else if (k < 0.1) addObj(W, { kind: 'bush', x, y, solid: 0.3, s: 0.6 + s * 0.4, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(6262);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 6)) continue;
    W.spots.push({ id: 'vg' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}
function segDistUV([au, av], [bu, bv], u, v) {
  const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = Math.max(0, Math.min(1, ((u - au) * du + (v - av) * dv) / L));
  return Math.hypot(au + du * t - u, av + dv * t - v);
}


export const MANIFEST = {
  order: 12,
  
  
  region: {
    id: ID, name: 'Vinegate Landing', chapters: [4], size: SIZE, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: LANDING,
    pack: 'assets/scenery-vinegate.bin', 
    transit: false, objective: null,
  },
  generate: generateVinegate, steps: vinegateSteps,
  perches: [
    
    { id: 'vinegate', region: ID, name: 'Vinegate Landing', at: LANDING, opens: 'boss_bramble', respawn: null },
  ],
  
  place: { name: 'Vinegate Landing', at: [0.1, 0.44], r: 0.07, glyph: 'meadow' },
  kind: 'town',
  ground: { vinegate: 'river' },
  towns: ['vinegate'],
  ambience: { vinegate: { surf: 0.35, bugs: 0.7, birds: 0.6 } },
  
  hands: { sp: 36, name: 'Pole', lines: [
    'Those stilts under the huts? I sank every one. The river comes up a hand a year. My hand. I measured.',
    'Walk on the planks, don\'t bounce on \'em. The little ones bounce. Guess who mends what they bounce.'] },
  beats: {
    
    vinegate: [
      ['narr', 'Aerowing drops you on a wooden landing over a wide brown river. The air is hot and loud with insects.'],
      ['narr', 'A whole village stands in the water on stilts, joined by boardwalks. Something with a long tail watches you from a roof.'],
      ['kid', 'This is like the South Street Seaport. Like, if the Seaport was in a jungle and the pretzel guy had a tail.'],
    ],
  },
  
  people: { rng: 80, kinds: { stage: 1, types: ['Beast', 'Leaf'] }, gap: 1.0, dwellers: DWELLERS,
    elder: { id: 'vine-elder', name: ELDER.name, type: 'Beast', at: ELDER.at, lines: ELDER_LINES, boss: 'kingshade' } },
};
