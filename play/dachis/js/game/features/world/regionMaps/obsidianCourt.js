











import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import * as ruinSteps from './ruinSteps.js';

export const ID = 'obsidian-court';
export const SIZE = 96;
const WT = ['Beast', 'Shadow', 'Gale'];
export const SECTIONS = addSections([
  { id: 'court-stones', name: 'The Obsidian Court - The Glass Pool', rect: { u: [-12, 12], v: [30, 46] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: WT },
  { id: 'court-gallery', name: 'The Obsidian Court - The Well', rect: { u: [-12, 12], v: [46, 62] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: WT },
  { id: 'court-guards', name: 'The Obsidian Court - The Guard Hall', rect: { u: [-12, 12], v: [62, 78] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: WT },
  { id: 'court-throne', name: 'Kingshade\'s Throne', rect: { u: [-12, 12], v: [78, 94] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 4, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };

export const DOORWAYS = [{ u: 0, v: 46 }, { u: 0, v: 62 }, { u: 0, v: 78 }];

export const STONES = [[0, 32.6, 1.5], [1.4, 34.4, 1.2], [3.0, 35.8, 1.2], [3.6, 37.6, 1.2], [2.6, 39.2, 1.2], [0.8, 40.2, 1.2],
  [-1.0, 41.2, 1.2], [-2.0, 42.8, 1.2], [-1.2, 44.4, 1.2], [0, 45.6, 1.4], [5.4, 34.6, 1.2]].map(([u, v, r]) => ({ u, v, r }));
export const ISLANDS = [{ u: 7.6, v: 34.6, r: 2.3 }, { u: -5.6, v: 37.6, r: 2.5 }, { u: -3.8, v: 40.0, r: 1.2 }, { u: 6.4, v: 42.6, r: 2.2 }, { u: 4.8, v: 41.0, r: 1.2 }];

export const WELL = { u: 0, v: 54, rIn: 3.6, rOut: 6.2 };
export const FALLEN = { a0: -0.75, a1: 0.75 }; 

export const DAIS = { u: 0, v: 85.4, r: 6.8 };
export const THRONE = at(0, 90.6);
export const ENTRY = at(0, 33.0);        
export const POOL = at(-5.6, 37.0);      
export const POOL_LANDING = at(-4.6, 38.6);

export const GUARD_AFTER = [
  ['He asked us what we wanted. Then he made me say it twice, because he did not like it the first time. That is him. That is the king.', 'We are going down to the river. My grandmother has a list of weeds for me. It is a long list. She has been writing it for a year.'],
  ['I told him I like this jungle. Out loud. To the KING. I am going to be thinking about that for a week.', 'If you see the king by the terraces, say hi. He is learning to plant figs. He is bad at it.'],
  ['The armour comes off tonight. All of it. I have been itchy for a year.', 'My tail stopped shaking. Look. ...Okay, it is shaking again, but only because you are looking at it.'],
];


export const KING_SEAT = at(0, 88.4);
export const DOORWAY_UP = at(0, 79.2); 

export const GUARD_UP = [at(-1.9, 85.0), at(1.2, 86.6), at(1.9, 85.0)];
export const KING_LINES = [
  'A year on that chair, and I could not have told you the colour of my guards\' eyes. Brown, it turns out. All three.',
  'You may go. ...That was not permission. You do not need my permission. It is a habit. I am to be on the terraces tomorrow; Banyan says I will learn figs.',
];
export const GUARDS = [ 
  { id: 'court-g0', home: { ...at(-6.0, 66.6), r: 1.2 }, lines: ['We were told to stop anyone. You\'re anyone. ...Please don\'t tell him we let you by.', 'He carried my grandmother up the vines in the flood. She will not hear a word against him. Neither will I. ...Mostly.'] },
  { id: 'court-g1', home: { ...at(6.0, 70.0), r: 1.2 }, lines: ['He says the spirals lead to a better jungle. But I like this jungle. Is that wrong? Is that a wrong thing to say?', 'If you\'re going in, watch his fists. He hits like a falling tree. I\'d know.'] },
  { id: 'court-g2', home: { ...at(-6.0, 74.0), r: 1.2 }, lines: ['My tail is shaking. It does that. It does not mean anything. (It means everything.)', 'Old Banyan sent word you might come. She said you were small and loud. She was right about both.'] },
];
const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const inDoorway = (u, v) => DOORWAYS.some((d) => Math.abs(u - d.u) < 1.6 && Math.abs(v - d.v) < 2.6);
const discIn = (list, u, v) => Math.max(...list.map((d) => d.r - Math.hypot(u - d.u, v - d.v)));
const ringAt = (u, v) => {
  const d = Math.hypot(u - WELL.u, v - WELL.v), a = Math.atan2(v - WELL.v, u - WELL.u);
  return { d, a, fallen: a > FALLEN.a0 && a < FALLEN.a1 };
};

const STATUE_U = [-8.6, -3.2, 3.2, 8.6];
function roomOf(v) { return v < 46 ? 0 : v < 62 ? 1 : v < 78 ? 2 : 3; }
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), room = roomOf(v);
  if (room === 0) return discIn([...STONES, ...ISLANDS], u, v) > -0.2 || inDoorway(u, v) || v < 32 ? 0.3 : -0.25; 
  if (room === 1) { const g = ringAt(u, v); if (g.d < WELL.rIn || (g.fallen && g.d < WELL.rOut + 0.6)) return -3.2; return 0.3; }
  if (room === 3) { const d = Math.hypot(u - DAIS.u, v - DAIS.v); return 0.3 + (v > 89 ? Math.min(1.2, (v - 89) * 0.6) : 0) + U.clamp(d - DAIS.r, 0, 3) * 0.6; }
  return 0.3;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (inDoorway(u, v) && Math.abs(u) < 1.6) return T.RUIN;
  if (!inside(u, v)) return T.CLIFF;
  const room = roomOf(v);
  if (room === 0) {
    if (v < 32.4) return T.RUIN; 
    if (discIn(ISLANDS, u, v) > 0) return discIn(ISLANDS, u, v) > 0.7 && U.fbm(x * 0.3, y * 0.3, 951) > 0.3 ? T.TALL : T.GRASS;
    
    
    const k = STONES.findIndex((s) => Math.hypot(u - s.u, v - s.v) < s.r);
    if (k < 0) return T.DEEP; 
    let best = k; STONES.forEach((s, i) => { if (Math.hypot(u - s.u, v - s.v) - s.r < Math.hypot(u - STONES[best].u, v - STONES[best].v) - STONES[best].r) best = i; });
    return best % 2 ? T.ROCK : T.RUIN;
  }
  if (room === 1) {
    const g = ringAt(u, v);
    if (g.d < WELL.rIn || (g.fallen && g.d < WELL.rOut + 0.6)) return T.CLIFF; 
    if (g.d > WELL.rOut + 1.4 && U.fbm(x * 0.3, y * 0.3, 953) > 0.42) return T.TALL; 
    return T.RUIN;
  }
  if (room === 2) {
    if (Math.abs(u) > 4.4 && Math.abs(u) < 7.4 && U.fbm(x * 0.3, y * 0.3, 955) > 0.4) return T.TALL; 
    return T.PLAZA;
  }
  const d = Math.hypot(u - DAIS.u, v - DAIS.v);
  if (d < DAIS.r) return T.PLAZA;
  return v < 82 && Math.abs(u) < 2.0 ? T.PLAZA : (U.fbm(x * 0.3, y * 0.3, 957) > 0.4 ? T.TALL : T.GRASS); 
}

export function generateObsidianCourt() { const it = obsidianCourtSteps(); let s; while (!(s = it.next()).done); return s.value; }
export function* obsidianCourtSteps() {
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
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8;
  addObj(W, { kind: 'spring', x: POOL.x, y: POOL.y, solid: 0.8, heal: true });
  
  for (const d of DOORWAYS) for (const s of [-1, 1]) { const p = at(d.u + s * 2.2, d.v + 0.9); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.39; if (a > FALLEN.a0 - 0.2 && a < FALLEN.a1 + 0.2) continue;
    const p = at(WELL.u + Math.cos(a) * (WELL.rOut + 0.9), WELL.v + Math.sin(a) * (WELL.rOut + 0.9)); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.35, s: 1.0, rot: a, v: k % 3 }); }
  for (const u of STATUE_U) for (let v = 64.6; v < 77; v += 2.6) { const p = at(u, v); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.4, s: 1.2, rot: 0, v: 2 }); }
  addObj(W, { kind: 'rimstone', x: THRONE.x, y: THRONE.y, solid: 0.8, s: 2.0, rot: Math.PI, v: 1 }); 
  for (let k = 0; k < 6; k++) { const a = Math.PI * (0.15 + k * 0.14), p = at(DAIS.u + Math.cos(a) * (DAIS.r + 0.8), DAIS.v + Math.sin(a) * (DAIS.r + 0.8)); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.4, s: 1.4, rot: a, v: 2 }); }
  yield 'buildings';
  const r = U.rng(9595), busy = (x, y) => Math.hypot(x - ENTRY.x, y - ENTRY.y) < 2.2 || Math.hypot(x - POOL.x, y - POOL.y) < 1.8;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || busy(x, y)) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) { if (roomOf(v) !== 1 && k < 0.2) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 16) % 4 }); continue; }
    if (t === T.TALL) { if (k < 0.08) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.6 + s * 0.4, rot }); continue; }
    if (t === T.GRASS && roomOf(v) === 3 && k < 0.05) addObj(W, { kind: 'flower', x, y, solid: 0, c: s < 0.5 ? '#c8a0ff' : '#ffd23a' });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.TALL && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  yield 'grid';
  const rs = U.rng(9696);
  for (let t = 0; W.spots.length < 4 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4) || busy(x, y)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || toUV(x, y)[1] > 78) continue; 
    W.spots.push({ id: 'oc' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


export const MANIFEST = {
  order: 17,
  
  region: {
    id: ID, name: 'The Obsidian Court', chapters: [4], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: POOL_LANDING, home: ENTRY,
    pack: 'assets/scenery-obsidian-court.bin', 
    transit: false, objective: null,
  },
  generate: generateObsidianCourt, steps: obsidianCourtSteps,
  doors: [
    { id: 'court-in', region: ruinSteps.ID, at: ruinSteps.EXIT, to: ID, toAt: ENTRY, label: 'Through the black gate', after: null },
    { id: 'court-out', region: ID, at: ENTRY, to: ruinSteps.ID, toAt: ruinSteps.EXIT_BACK, label: 'Out to the steps', after: null },
  ],
  perches: [
    { id: 'obsidian-court', region: ID, name: 'The Glass Pool', at: POOL_LANDING, opens: 'boss_bramble', respawn: null },
  ],
  place: { name: 'The Obsidian Court', at: [0.08, 0.12], r: 0.05, glyph: 'meadow' },
  kind: 'ruin',
  ground: { 'court-stones': 'court', 'court-gallery': 'court', 'court-guards': 'court', 'court-throne': 'court' },
  caves: ['court-stones', 'court-gallery', 'court-guards'],
  ambience: { 'court-stones': { chimes: 0.4, rumble: 0.2 }, 'court-gallery': { wind: 0.6, rumble: 0.3 }, 'court-guards': { rumble: 0.2, chimes: 0.2 }, 'court-throne': { wind: 0.7, birds: 0.3 } },
  beats: {
    'court-stones': [
      ['narr', 'Inside the gate the floor is water - perfectly still and perfectly black, like a mirror nobody cleaned.'],
      ['narr', 'Pale stones lead across it, not in a straight line. Your reflection follows you, one step behind.'],
    ],
    'court-guards': [
      ['narr', 'A long hall of stone guards. Between them, real ones: big furry dachis in armour, kneeling, tails shaking.'],
      ['kid', '(Mom always says they\'re more scared of you than you are of them. ...That\'s a LOT of scared.)'],
    ],
    'court-throne': [
      ['narr', 'The last door opens onto the sky. A round floor at the top of the world, and at its far side, a throne of black stone.'],
      ['narr', 'Someone huge stands in front of it, very still, looking out over the jungle like he is counting every tree.'],
    ],
  },
  
  
  people: { rng: 81, kinds: { stage: 2, types: ['Beast'] },
    custom: ({ add, G, kinds, rng, bossSpecies }) => {
      GUARDS.forEach((d, i) => add({ kind: 'villager', id: d.id, sp: kinds[Math.floor(rng() * kinds.length)].id, ...d.home, still: true, lines: G.flags.boss_kingshade ? GUARD_AFTER[i] : d.lines }));
      
      if (G.flags.boss_kingshade && !(G.flags.beats || {})['kingshade-gone']) add({ kind: 'villager', id: 'court-king', name: 'Kingshade', sp: bossSpecies('kingshade').id, calm: true, ...KING_SEAT, still: true, lines: KING_LINES });
    } },
};
