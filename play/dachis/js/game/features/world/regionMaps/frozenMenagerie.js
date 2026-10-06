










import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { CELL } from '../thinIceRules.js';
import * as glacierField from './glacierField.js';

export const ID = 'frost-summit';
export const SIZE = 84;

const GRIDS = [
  
  { grid: ['...', '...', '...', '#..'], entry: 0, exit: 1 },                               
  { grid: ['....', '.#..', '...#', '....', '....'], entry: 3, exit: 2 },                   
  { grid: ['....', '.#..', '....', '....', '....', '#..#'], entry: 1, exit: 2 },           
];

export const ROOMS = [];
{
  let v = 26;
  GRIDS.forEach((g, i) => {
    const C = g.grid[0].length, R = g.grid.length, u0 = -C * CELL / 2, vest = [v, v + 4], v0 = v + 4;
    v = v0 + R * CELL;
    ROOMS.push({ id: 'menagerie-' + (i + 1), ...g, u0, v0, vest, door: [v, v + CELL], halfW: C * CELL / 2 });
    v += CELL;
  });
}
export const SUMMIT_V = ROOMS[2].door[1]; 
export const SUMMIT = { u: 0, v: SUMMIT_V + 12, r: 13 };
export const SECTIONS = addSections([
  ...ROOMS.map((rm, i) => ({ id: rm.id, name: `Frostspine Peaks - The Frozen Menagerie (${['I', 'II', 'III'][i]})`, rect: { u: [-12, 12], v: [rm.vest[0] - (i ? 0 : 2), rm.door[1]] }, zoom: 15, wall: 1.0, region: ID, chapter: 6, interior: true })),
  { id: 'summit-lair', name: 'Frostspine Peaks - The Summit', rect: { u: [-16, 16], v: [SUMMIT_V, SUMMIT_V + 26] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 6 },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const ENTRY = at(0, 26.8);                    
export const SPRING = at(-8.6, SUMMIT_V + 5.0);      
export const LANDING = at(-6.0, SUMMIT_V + 4.2);     
export const LAIR = { u: 0, v: SUMMIT.v + 1 };        
export const FAMILY = [[-5.2, -3.2], [5.2, -3.2], [-5.6, 3.6], [5.6, 3.6]].map(([du, dv], i) => ({ id: 'frost-fam' + i, ...at(LAIR.u + du, LAIR.v + dv), u: LAIR.u + du, v: LAIR.v + dv }));
export const FAMILY_LINES = [
  ['...Is it still spring? It\'s not spring, is it. Oh no. Oh, my sister\'s gonna KILL me.',
    'We just came up to see the lights. The big one kept saying stay, stay, they\'re prettier if you stay. And I said okay. Why\'d I say okay?'],
  ['I was a block! A block of ICE! Did you see? Again! Do it again! ...No, don\'t do it again.'],
  ['My legs are asleep. All four of \'em. From the inside, somehow.'],
  ['He brought us moss. Every morning, the old Rex did. Even when we were ice, I think. I think I heard him putting it down.'],
];
const FAM_C = ['#7ab8e8', '#e8a87a', '#a8e07a', '#c8a8e8'];
export const familyColor = (i) => FAM_C[i % FAM_C.length];


export function roomAt(u, v) {
  for (const rm of ROOMS) {
    if (v < rm.vest[0] || v >= rm.door[1]) continue;
    const c = Math.floor((u - rm.u0) / CELL), r = Math.floor((v - rm.v0) / CELL);
    return { room: rm, c, r };
  }
  return null;
}

export function ground(u, v) {
  const q = roomAt(u, v);
  if (q) {
    const rm = q.room, R = rm.grid.length;
    if (v < rm.v0) return Math.abs(u) < rm.halfW + 1.8 ? 'floor' : 'wall';
    if (q.r < R) return q.c >= 0 && q.c < rm.grid[0].length ? (rm.grid[q.r][q.c] === '#' ? 'block' : 'thin') : 'wall';
    return q.c === rm.exit ? 'door' : 'wall';
  }
  if (v >= SUMMIT_V && v < SUMMIT_V + 26) return Math.hypot(u - SUMMIT.u, (v - SUMMIT.v) * 1.05) < SUMMIT.r || (Math.abs(u) < 1.2 && v < SUMMIT_V + 3) ? 'floor' : 'wall';
  if (v >= 24 && v < 26) return Math.abs(u) < 1.4 ? 'floor' : 'wall'; 
  return 'wall';
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  
  if (g === 'wall') return v < SUMMIT_V ? 0.95 + U.fbm(x * 0.25, y * 0.25, 2201) * 0.3 : 2.4 + U.fbm(x * 0.25, y * 0.25, 2201) * 0.8;
  if (v >= SUMMIT_V) return 0.4 + U.fbm(x * 0.12, y * 0.12, 2203) * 0.1;
  return g === 'thin' || g === 'block' ? 0.22 : 0.3;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return T.CLIFF;
  if (g === 'thin' || g === 'block') return T.PLAZA;            
  if (v >= SUMMIT_V && g === 'floor') return U.fbm(x * 0.2, y * 0.2, 2205) > 0.62 ? T.GLADE : T.GRASS; 
  return T.ROCK;                                                
}

export function generateFrozenMenagerie() { const it = frozenMenagerieSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* frozenMenagerieSteps() {
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
  
  W.thin = { rooms: ROOMS, cell: CELL, roomAt: (x, y) => roomAt(...toUV(x, y)) };
  W.frozen = [
    ...ROOMS.flatMap((rm, k) => rm.grid.flatMap((row, r) => [...row].map((ch, c) => (ch === '#' ? { ...at(rm.u0 + (c + 0.5) * CELL, rm.v0 + (r + 0.5) * CELL), c: FAM_C[(c + r + k) % 4], rot: (c * 1.7 + r) % 6.28, s: 1.3 } : null)).filter(Boolean))),
    ...FAMILY.map((f, i) => ({ x: f.x, y: f.y, c: FAM_C[i], rot: Math.atan2(LAIR.u - f.u, LAIR.v - f.v), s: 1.15 })),
  ];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && toUV(x, y)[1] > SUMMIT_V + 2;
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  for (const rm of ROOMS) for (const side of [-1, 1]) { const p = at(side * (rm.halfW + 1.2), rm.vest[0] + 2.4); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  for (const [u, v, rot] of [[-7, SUMMIT_V + 4, 0.3], [8, SUMMIT_V + 22, 1.2]]) { const p = at(u, v); addObj(W, { kind: 'prayerline', x: p.x, y: p.y, solid: 0, rot }); }
  yield 'buildings';
  const r = U.rng(2323);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) {
      if (v < SUMMIT_V) { if (k < 0.1) addObj(W, { kind: 'crystal', x, y, solid: 0, s: 0.7 + s * 0.6, rot, c: ['#bfe6ff', '#e8f6ff', '#9ad0f0'][Math.floor(s * 3)] }); }
      else if (k < 0.12) addObj(W, { kind: 'fir', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); else if (k < 0.3) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 13) % 4 });
      continue;
    }
    if (v < SUMMIT_V || W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.4)) continue;
    if (Math.hypot(u - LAIR.u, v - LAIR.v) < 8.5 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2) continue; 
    if (k < 0.04) addObj(W, { kind: 'drift', x, y, solid: 0, s: 0.6 + s * 0.6, rot }); else if (k < 0.055) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot });
  }
  yield 'props';
  buildGrid(W);
  yield 'grid';
  return W;
}


export const MANIFEST = {
  order: 25,
  
  region: {
    id: ID, name: 'The Frozen Menagerie', chapters: [6], size: SIZE, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: LANDING,
    pack: 'assets/scenery-frost-summit.bin',
    transit: false, objective: 'Cross the thin ice to the summit',
  },
  generate: generateFrozenMenagerie, steps: frozenMenagerieSteps,
  doors: [
    { id: 'menagerie-in', region: glacierField.ID, at: glacierField.NORTH, to: ID, toAt: ENTRY, label: 'Into the Menagerie', after: null },
    { id: 'menagerie-out', region: ID, at: ENTRY, to: glacierField.ID, toAt: glacierField.NORTH_BACK, label: 'Out to the hollow', after: null },
  ],
  perches: [
    { id: 'frost-summit', region: ID, name: 'The Summit', at: LANDING, opens: 'boss_glacius', respawn: null },
  ],
  place: { name: 'The Frozen Menagerie', at: [0.2, 0.06], r: 0.04, glyph: 'peak' },
  kind: 'cave',
  ground: { 'menagerie-1': 'frost', 'menagerie-2': 'frost', 'menagerie-3': 'frost', 'summit-lair': 'frost' },
  caves: ['menagerie-1', 'menagerie-2', 'menagerie-3'],
  ambience: { 'menagerie-1': { chimes: 0.4, wind: 0.1 }, 'menagerie-2': { chimes: 0.45, wind: 0.1 }, 'menagerie-3': { chimes: 0.5, wind: 0.15 }, 'summit-lair': { wind: 1.0 } },
  beats: {
    'menagerie-1': [
      ['narr', 'A long hall of blue ice. Dachis stand frozen along the walls, caught halfway through whatever they were doing. One\'s in the middle of a sneeze.'],
      ['narr', 'The floor\'s ice too, thin as a window. Every step leaves a star of cracks behind you, and the cracked bits won\'t hold you twice. The far door is iced shut.'],
      ['kid', '(Okay, every square once, no going back. ...It\'s the snake game on Danny\'s calculator. I\'m the snake. I always lose at the snake.)'],
    ],
    'summit-lair': [
      ['narr', 'The top of the mountain. The wind won\'t quit. There\'s a ring of ice blocks with something small and blue curled up in each one, and in the middle, something huge that doesn\'t move at all.'],
    ],
  },
  
  people: { rng: 181, kinds: { stage: 1, types: ['Frost'] },
    custom: ({ add, G, kinds, rng }) => {
      if (!G.flags.boss_glacius) return;
      FAMILY.forEach((f, i) => add({ kind: 'villager', id: f.id, sp: kinds[Math.floor(rng() * kinds.length)].id, x: f.x, y: f.y, home: { x: f.x, y: f.y }, radius: 1.2, lines: FAMILY_LINES[i], tx: f.x, ty: f.y, wait: rng() * 3 }));
    } },
};
