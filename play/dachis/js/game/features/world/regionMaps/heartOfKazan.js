












import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { guardHuts, dressHuts, placeYard } from '../dressing.js';
import { CELL } from '../crustRules.js';
import * as kazanVillage from './kazanVillage.js';

export const ID = 'kazan-heart';
export const SIZE = 84;
const WT = ['Ember', 'Stone', 'Shadow'];
export const SECTIONS = addSections([
  { id: 'crater-stair', name: 'The Heart of Kazan - The Crater Stair', rect: { u: [-10, 10], v: [24, 64] }, zoom: 18, wall: 2.0, region: ID, chapter: 7, wildTypes: WT },
  { id: 'ashen-forge', name: 'The Heart of Kazan - The Ashen Forge', rect: { u: [-20, 20], v: [64, 94] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 7 },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const xy = ([u, v]) => fromUV(u, v);



export const FLOWS = [
  { id: 'flow-1', v0: 31, strips: [{ phase: 0, black: 3.2, hot: 1.8 }, { phase: 1.7, black: 3.2, hot: 1.8 }] },
  { id: 'flow-2', v0: 40, strips: [{ phase: 0, black: 2.8, hot: 2.0 }, { phase: 3.6, black: 2.8, hot: 2.0 }, { phase: 2.4, black: 2.8, hot: 2.0 }] },
  { id: 'flow-3', v0: 50, strips: [{ phase: 0, black: 2.4, hot: 1.6 }, { phase: 0.9, black: 3.6, hot: 1.8 }, { phase: 2.2, black: 2.4, hot: 1.6 }] },
];
export const STAIR_U = 8;            
export const flowAt = (u, v) => {
  if (Math.abs(u) >= STAIR_U) return null;
  for (const f of FLOWS) { const k = Math.floor((v - f.v0) / CELL); if (k >= 0 && k < f.strips.length) return { flow: f, k }; }
  return null;
};
export const ENTRY = at(-2.0, 26.6);  
export const SPRING = at(-12.0, 69.4); 
export const LANDING = at(-9.6, 70.6); 
export const EXIT = at(0.0, 91.6);    
export const BACK = at(0.0, 89.6);    
export const FORGE = at(1.4, 73.4);   

export const LANE = [[-2.0, 26.6], [-1.0, 30.0], [1.0, 36.0], [-2.0, 39.2], [-1.0, 47.0], [2.0, 49.0], [1.0, 57.0], [0.0, 62.0],
  [-3.6, 67.0], [-5.0, 74.0], [-3.0, 80.0], [0.0, 86.0], [0.0, 91.6]];

const HUTS = [[-10.4, 76.0, 1.35], [-14.0, 81.6, 1.3], [-8.0, 86.0, 1.4], [7.4, 80.4, 1.35], [11.8, 85.6, 1.3], [8.6, 67.6, 1.3]];
const ROOFS = ['#5a3a34', '#6a2e2a', '#4a3a40', '#7a3a26', '#5a4a3a', '#6a3440'];
export const HUT_SPOTS = HUTS.map(([u, v, s]) => ({ ...at(u, v), s }));
export const RUN = { u: [15.2, 18.4], v: [64, 94] }; 
export const DWELLERS = [
  { id: 'forge-v0', home: { ...at(-6.4, 82.0), r: 2.0 }, lines: [
    'We came down out of the Vault with whatever we could carry. I carried a pot. Just a pot. Everybody else grabbed blankets, and I\'m standing there holding a pot.',
    'Up there, if you got slow, if your fire got low, he\'d send for you. "Your turn to pay the fare," that\'s what the bone birds said. My mom\'s fire was low. ...I don\'t wanna talk about the fare.'] },
  { id: 'forge-v1', home: { ...at(9.0, 76.0), r: 2.2 }, lines: [
    'You came down the stair? On your own? Okay, the trick is you don\'t look at the crust, you look at the cracks. When the cracks go bright, that bit\'s about to go. Or is it when they go dark. ...It\'s the bright, I\'m pretty sure.',
    'I\'m saving up for a hammer. A real one, from Ferro. He says when my fire\'s steady enough to hold a heat. That\'s what he says to everybody. I think it means no.'] },
  { id: 'forge-v2', home: { ...at(-1.0, 85.0), r: 2.0 }, lines: [
    'There\'s carts in the Galleries, on the old ore rails. They go where the points send \'em, and the points are levers on the islands. Not the island you\'re on, obviously. That would be too easy.',
    'My grandma ran those carts. She used to say you ride out to throw a lever and ride back to use it, and that\'s most of life. She said a lot of things. I miss \'em all, even the dumb ones.'] },
];


export const ELDER = { name: 'Old Ferro', at: at(4.6, 76.8) };
export const ELDER_LINES = {
  before: ['See your Elder\'s arm? Ojiji\'s? That\'s mine. Thirty-one plates, every one by hand. He walked into the first spiral with a stick and came out missing half of himself, and the half that was left was still giving orders. Never came back for a fitting. Typical.',
    'Pyrecrown. Used to be the brightest fire in the Vault. Now he\'s mostly bone and opinions. Watch his wings - when they beat twice, whump, whump, he\'s coming down on you from up top. Get out from under. When he lands, his fire\'s out for a second. That second\'s yours.'],
  after: ['The Vault\'s gone quiet. You can hear the run again, all the way down. I hadn\'t noticed I\'d stopped hearing it.',
    'Tell Ojiji his left elbow\'s due for oil. He won\'t come. Tell him anyway.'],
};

const inS = (u, v) => edgeDepth({ u: [-10, 10], v: [22, 68.5] }, u, v).depth > 2.0; 
const inF = (u, v) => edgeDepth({ u: [-20, 20], v: [64, 94] }, u, v).depth > 2.0;   
const inside = (u, v) => inS(u, v) || inF(u, v);
const inR = (r, u, v) => u >= r.u[0] && u <= r.u[1] && v >= r.v[0] && v <= r.v[1];
export const stairH = (v) => 3.2 - (Math.min(v, 62) - 24) * 0.073;
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return (v < 64 ? stairH(v) : 0.4) + 1.8 + U.fbm(x * 0.2, y * 0.2, 1701) * 1.2;
  if (flowAt(u, v)) return stairH(v) - 0.22;
  if (inR(RUN, u, v)) return 0.12;
  if (v < 64) return stairH(v) + U.fbm(x * 0.2, y * 0.2, 1703) * 0.05;
  return 0.4 + U.fbm(x * 0.15, y * 0.15, 1705) * 0.05;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  if (flowAt(u, v) || inR(RUN, u, v)) return T.LAVA;
  const n = U.fbm(x * 0.21, y * 0.21, 1707);
  if (v < 64) return v > 35 && n > 0.6 ? T.THICKET : n < 0.32 ? T.SAND : T.ROCK; 
  if (Math.hypot(...[x - FORGE.x, y - FORGE.y]) < 4.2) return T.RUIN;        
  return n < 0.34 ? T.SAND : T.PLAZA;                                         
}

export function generateHeartOfKazan() { const it = heartOfKazanSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* heartOfKazanSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const lane = LANE.map(xy), before = W.type.slice();
  carvePath(W, W.type, lane);
  
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH && (before[k] === T.CLIFF || before[k] === T.LAVA || before[k] === T.RUIN)) W.type[k] = before[k];
  mapQueries(W);
  
  const walk = W.type.slice();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (flowAt(...toUV(i + 0.5, j + 0.5))) walk[W.idx(i, j)] = T.ROCK;
  W.reach = floodReach(W, walk, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: lane.slice(7), half: 0.5 }]; 
  
  W.hazard = { crust: FLOWS.map((f) => ({ id: f.id, u: [-STAIR_U, STAIR_U], v0: f.v0, strips: f.strips, h: (k) => stairH(f.v0 + (k + 0.5) * CELL) - 0.1 })) };
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && toUV(x, y)[1] > 66 && !inR(RUN, ...toUV(x, y)) && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.6 && Math.hypot(x - FORGE.x, y - FORGE.y) > 2.6;
  
  const huts = HUT_SPOTS.map((h, i) => {
    let best = lane[0], bd = Infinity; for (const p of lane.slice(8)) { const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d < bd) { bd = d; best = p; } }
    const rot = Math.atan2(best[0] - h.x, best[1] - h.y);
    return { ...h, i, rot, door: [h.x + Math.sin(rot) * 1.15 * h.s, h.y + Math.cos(rot) * 1.15 * h.s] };
  });
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'forge', x: FORGE.x, y: FORGE.y, solid: 1.3, rot: Math.PI / 4 }); 
  for (const [u, v, r] of [[-2.2, 75.6, 0.4], [3.6, 70.2, 2.0], [4.8, 74.2, 1.2]]) { const p = at(u, v); addObj(W, { kind: 'anvil', x: p.x, y: p.y, solid: 0.35, rot: r }); }
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  for (const [u, v] of [[-3.4, 64.6], [3.4, 64.6], [-2.4, 90.4], [2.4, 90.4], [-12.6, 72.6], [13.4, 72.0], [13.4, 84.0], [-4.0, 27.6], [4.6, 37.6], [-5.6, 47.6], [5.6, 57.6]]) {
    const p = at(u, v); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 });
  }
  {
    const dr = U.rng(1771), segD = ([au, av], [bu, bv], u, v) => {
      const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
      return Math.hypot(au + du * t - u, av + dv * t - v);
    };
    const dclear = (x, y, r) => {
      const [u, v] = toUV(x, y);
      return LANE.every((p, k) => k === 0 || segD(LANE[k - 1], p, u, v) > 0.9 + r) && v > 65.5 && u < RUN.u[0] - 1 - r
        && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r && Math.hypot(x - FORGE.x, y - FORGE.y) > 2.4 + r && Math.hypot(x - EXIT.x, y - EXIT.y) > 2 + r
        && huts.every((h) => Math.hypot(x - h.door[0], y - h.door[1]) > 0.9 + r);
    };
    guardHuts(W, huts);
    for (const [k, u, v] of [['cookfire', -9.4, 80.6], ['well', -15.6, 74.0], ['washline', -12.6, 86.6], ['tools', 6.8, 72.6], ['crates', 10.0, 70.4],
      ['pots', -6.8, 77.6], ['strawbed', 4.2, 86.6], ['crates', 12.4, 79.6], ['tools', -5.6, 70.4]]) {
      placeYard(W, k, at(u, v), { rot: dr() * 6.28, clear: dclear, extra: {} });
    }
    dressHuts(W, huts, { rng: dr, kinds: ['pots', 'basket', 'crates', 'tools', 'bowl', 'strawbed', 'toys'], food: ['#ff8a3a', '#d8c070', '#b0503a'], clear: dclear, perHut: [2, 4], weeds: false });
  }
  yield 'buildings';
  const r = U.rng(1772);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 2.2) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) {
      if (Math.hypot(x - EXIT.x, y - EXIT.y) < 2.6) continue;
      if (k < 0.14) addObj(W, { kind: 'basalt', x, y, solid: 0, s: 0.8 + s * 0.7, rot });
      else if (k < 0.3) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 13) % 4 });
      else if (k < 0.34) addObj(W, { kind: 'obsidian', x, y, solid: 0, s: 0.7 + s * 0.5, rot });
      continue;
    }
    if (t === T.LAVA || t === T.PATH || t === T.RUIN) continue;
    if (W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.3)) continue;
    if (Math.hypot(x - EXIT.x, y - EXIT.y) < 2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2) continue;
    if (lane.some((p, q) => q && Math.hypot(p[0] - x, p[1] - y) < 1.2)) continue;
    if (v < 64) { 
      if (flowAt(u, v + 1.2) || flowAt(u, v - 1.2)) continue; 
      if (t === T.THICKET) { if (k < 0.09) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.3, rot, flavor: 'cinder' }); continue; }
      if (k < 0.03) addObj(W, { kind: 'obsidian', x, y, solid: 0.3, s: 0.5 + s * 0.4, rot });
      else if (k < 0.05) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot, dark: true });
      else if (k < 0.058) addObj(W, { kind: 'spring', x, y, solid: 0.8 }); 
      continue;
    }
    if (u > RUN.u[0] - 1.2) { if (k < 0.08) addObj(W, { kind: 'obsidian', x, y, solid: 0.3, s: 0.5 + s * 0.5, rot }); continue; } 
    if (k < 0.02) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot, dark: true });
    else if (k < 0.035) addObj(W, { kind: 'basalt', x, y, solid: 0.4, s: 0.5 + s * 0.3, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [u, v] = toUV(i + 0.5, j + 0.5);
    if (v > 35 && v < 63 && W.type[W.idx(i, j)] === T.THICKET && W.reach[W.idx(i, j)] && W.walkable(i + 0.5, j + 0.5, 0.3)) W.wildTiles.push([i + 0.5, j + 0.5]);
  }
  yield 'grid';
  const rs = U.rng(1773);
  for (let t = 0; W.spots.length < 6 && t < 6000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3 || huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.2)) continue;
    W.spots.push({ id: 'hk' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


export const MANIFEST = {
  order: 26,
  
  region: {
    id: ID, name: 'The Heart of Kazan', chapters: [7], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: LANDING,
    pack: 'assets/scenery-kazan-heart.bin', 
    transit: false, objective: 'Get down the Crater Stair',
  },
  generate: generateHeartOfKazan, steps: heartOfKazanSteps,
  doors: [
    
    { id: 'heart-in', region: kazanVillage.ID, at: at(-7.4, 33.0), to: ID, toAt: ENTRY, label: 'Down the crater', after: 'boss_glacius' },
    { id: 'heart-out', region: ID, at: ENTRY, to: kazanVillage.ID, toAt: at(-10.4, 33.2), label: 'Up to the village', after: null },
  ],
  perches: [
    { id: 'kazan-heart', region: ID, name: 'The Ashen Forge', at: LANDING, opens: 'boss_glacius', respawn: null },
  ],
  place: { name: 'The Heart of Kazan', at: [0.64, 0.07], r: 0.045, glyph: 'volcano' }, 
  kind: 'town',
  ground: { 'crater-stair': 'magma', 'ashen-forge': 'magma' },
  towns: ['ashen-forge'],
  caves: ['crater-stair'],
  ambience: { 'crater-stair': { rumble: 0.8, wind: 0.15 }, 'ashen-forge': { rumble: 0.45, chimes: 0.2 } },
  
  hands: { sp: 20, name: 'Bellows', lines: [
    'I\'m the bellows. Not the smith. The bellows. Ferro gets the hammer and the thank-yous, I get the pumping and the burnt eyebrows. Look. No eyebrows.',
    'Washing\'s mine too. Nothing dries down here, so I hang it over the run. Then it smells like a volcano. Everything smells like a volcano. You get used to it. ...No you don\'t.'] },
  beats: {
    'crater-stair': [
      ['narr', 'Past the crater fence a crack opens in the rock, and steps go down into the mountain. Three times a river of lava runs across them, skinned over in black that splits, and glows, and seals again.'],
      ['kid', '(Okay. It\'s like the hot grates on 42nd Street. You just don\'t step on the glowy part. ...Mom would have a heart attack.)'],
    ],
    'ashen-forge': [
      ['narr', 'The stair comes out into a cavern lit red from underneath. Huts of black stone, washing strung over a channel of lava, and in the middle a forge as big as a bus, roaring.'],
      ['kid', '(A town. Under the volcano. Under the village. Under the TOWN. How deep does this place even go?)'],
    ],
  },
  
  
  palettes: {
    magma: { rock: ['#3e3236', '#56464a'], plaza: ['#2a2230', '#3c3044'], sand: ['#7a7072', '#9a8e8c'], ruin: ['#6a4a3e', '#8a6450'],
      cliff: ['#1e1416', '#4a2018'], thicket: ['#6a2a20', '#8e3e2a'], moss: ['#4a6a4a', '#6a8a5a'], grass: ['#5a4e4a', '#76665e'],
      tall: ['#4a3e3a', '#62524a'], glade: ['#5a4e4a', '#76665e'], path: ['#a08a76', '#e8d0b0'] },
  },
  
  people: { rng: 191, kinds: { stage: 1, types: ['Ember'] }, gap: 0.8, dwellers: DWELLERS,
    elder: { id: 'heart-elder', name: ELDER.name, type: 'Metal', at: ELDER.at, lines: ELDER_LINES, boss: 'pyrecrown' } },
};
