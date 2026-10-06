









import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { CELL } from '../ventRules.js';
import * as magmaGalleries from './magmaGalleries.js';

export const ID = 'kazan-pyre';
export const SIZE = 88;


const GRIDS = [
  { grid: ['.b.', '.aa', 'ab#', '.ac'], entry: 0, exit: 2, valves: [{ at: [0, 1], flips: 'a' }, { at: [2, 0], flips: 'c' }] },
  { grid: ['..c.', '..a.', 'a##.', 'aba.', 'b#ba'], entry: 1, exit: 0, valves: [{ at: [3, 0], flips: 'c' }, { at: [3, 3], flips: 'ab' }, { at: [1, 1], flips: 'a' }] },
  { grid: ['.bcb', '.bbc', '#.b.', 'ac.a', '...#', '#aac'], entry: 0, exit: 3, valves: [{ at: [1, 4], flips: 'ab' }, { at: [0, 1], flips: 'b' }, { at: [0, 4], flips: 'bc' }] },
];
export const ROOMS = [];
{
  let v = 26;
  GRIDS.forEach((g, i) => {
    const C = g.grid[0].length, R = g.grid.length, u0 = -C * CELL / 2, vest = [v, v + 4], v0 = v + 4;
    v = v0 + R * CELL;
    ROOMS.push({ id: 'pyre-' + (i + 1), ...g, u0, v0, vest, door: [v, v + CELL], halfW: C * CELL / 2 });
    v += CELL;
  });
}
export const NEST_V = ROOMS[2].door[1];
export const NEST = { u: 0, v: NEST_V + 12, r: 12.5 };
const DOOR_U = ROOMS[2].u0 + (ROOMS[2].exit + 0.5) * CELL;
export const SECTIONS = addSections([
  ...ROOMS.map((rm, i) => ({ id: rm.id, name: `The Heart of Kazan - The Pyre Vault (${['I', 'II', 'III'][i]})`, rect: { u: [-12, 12], v: [rm.vest[0] - (i ? 0 : 2), rm.door[1]] }, zoom: 15, wall: 1.0, region: ID, chapter: 7, interior: true })),
  { id: 'pyre-nest', name: 'The Heart of Kazan - Pyrecrown\'s Nest', rect: { u: [-16, 16], v: [NEST_V, NEST_V + 26] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 7, interior: true },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const ENTRY = at(0, 26.8);                 
export const SPRING = at(-7.2, NEST_V + 5.8);     
export const LANDING = at(-6.0, NEST_V + 4.0);    
export const LAIR = { u: 0, v: NEST.v + 1 };      

export function roomAt(u, v) {
  for (const rm of ROOMS) {
    if (v < rm.vest[0] || v >= rm.door[1]) continue;
    return { room: rm, c: Math.floor((u - rm.u0) / CELL), r: Math.floor((v - rm.v0) / CELL) };
  }
  return null;
}

export function ground(u, v) {
  const q = roomAt(u, v);
  if (q) {
    const rm = q.room, R = rm.grid.length;
    if (v < rm.v0) return Math.abs(u) < rm.halfW + 1.8 ? 'floor' : 'wall';
    if (q.r < R) { if (q.c < 0 || q.c >= rm.grid[0].length) return 'wall'; const k = rm.grid[q.r][q.c]; return k === '.' ? 'floor' : k === '#' ? 'pillar' : 'channel'; }
    return q.c === rm.exit ? 'floor' : 'wall';
  }
  if (v >= NEST_V && v < NEST_V + 26) {
    const d = Math.hypot(u - NEST.u, (v - NEST.v) * 1.05);
    if (Math.abs(u - DOOR_U) < 1.4 && v < NEST_V + 3) return 'floor'; 
    return d < NEST.r - 1.6 ? 'floor' : d < NEST.r + 2.2 ? 'lava' : 'wall';
  }
  if (v >= 24 && v < 26) return Math.abs(u) < 1.4 ? 'floor' : 'wall';
  return 'wall';
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return v < NEST_V ? 0.95 + U.fbm(x * 0.25, y * 0.25, 2401) * 0.3 : 2.6 + U.fbm(x * 0.25, y * 0.25, 2401) * 1.0;
  if (g === 'lava') return 0.08;
  if (g === 'channel') return 0.16;
  if (v >= NEST_V) return 0.45 + U.fbm(x * 0.12, y * 0.12, 2403) * 0.06;
  return 0.3;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall' || g === 'pillar') return T.CLIFF;
  if (g === 'lava' || g === 'channel') return T.LAVA;
  if (v >= NEST_V) return U.fbm(x * 0.2, y * 0.2, 2405) > 0.62 ? T.SAND : T.RUIN; 
  return T.ROCK;                                                                 
}

export function generatePyreVault() { const it = pyreVaultSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* pyreVaultSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  mapQueries(W);
  const walk = W.type.slice();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (ground(...toUV(i + 0.5, j + 0.5)) === 'channel') walk[W.idx(i, j)] = T.ROCK;
  W.reach = floodReach(W, walk, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [];
  W.hazard = { vents: ROOMS.map((rm) => ({ ...rm, h: 0.32 })) };
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && toUV(x, y)[1] > NEST_V + 2;
  
  ROOMS.forEach((rm) => rm.valves.forEach((vl, i) => { const p = at(rm.u0 + (vl.at[0] + 0.5) * CELL, rm.v0 + (vl.at[1] + 0.5) * CELL); addObj(W, { kind: 'valve', x: p.x, y: p.y, solid: 0.3, rot: 0.4 + i, room: rm.id, valve: i }); }));
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  for (const rm of ROOMS) for (const side of [-1, 1]) { const p = at(side * (rm.halfW + 1.2), rm.vest[0] + 2.4); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  for (const [u, dv] of [[-9.4, 3], [9.4, 3], [-10.6, 18], [10.6, 18]]) { const p = at(u, NEST_V + dv); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  yield 'buildings';
  const r = U.rng(2424);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    const [u, v] = toUV(x, y);
    if (t === T.CLIFF) {
      if (v < NEST_V) { if (ground(u, v) === 'pillar') { if (k < 0.5) addObj(W, { kind: 'basalt', x, y, solid: 0, s: 0.8 + s * 0.3, rot }); } else if (k < 0.1) addObj(W, { kind: 'obsidian', x, y, solid: 0, s: 0.6 + s * 0.5, rot }); }
      else if (k < 0.12) addObj(W, { kind: 'basalt', x, y, solid: 0, s: 1.0 + s * 0.8, rot }); else if (k < 0.3) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 13) % 4 });
      continue;
    }
    if (v < NEST_V || t === T.LAVA || W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.4)) continue;
    if (Math.hypot(u - LAIR.u, v - LAIR.v) < 6.2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2) continue; 
    if (k < 0.05) addObj(W, { kind: 'obsidian', x, y, solid: 0.3, s: 0.5 + s * 0.5, rot }); else if (k < 0.065) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot, dark: true });
  }
  yield 'props';
  buildGrid(W);
  yield 'grid';
  return W;
}


export const MANIFEST = {
  order: 28,
  
  region: {
    id: ID, name: 'The Pyre Vault', chapters: [7], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: LANDING,
    pack: 'assets/scenery-kazan-pyre.bin',
    transit: false, objective: 'Turn the valves and reach the nest',
  },
  generate: generatePyreVault, steps: pyreVaultSteps,
  doors: [
    { id: 'vault-in', region: magmaGalleries.ID, at: magmaGalleries.SOUTH, to: ID, toAt: ENTRY, label: 'Down to the vault', after: null },
    { id: 'vault-out', region: ID, at: ENTRY, to: magmaGalleries.ID, toAt: magmaGalleries.SOUTH_BACK, label: 'Out to the rivers', after: null },
  ],
  perches: [
    { id: 'kazan-pyre', region: ID, name: 'Pyrecrown\'s Nest', at: LANDING, opens: 'boss_pyrecrown', respawn: null },
  ],
  place: { name: 'The Pyre Vault', at: [0.83, 0.05], r: 0.035, glyph: 'volcano' },
  kind: 'ruin',
  ground: { 'pyre-1': 'magma', 'pyre-2': 'magma', 'pyre-3': 'magma', 'pyre-nest': 'magma' },
  caves: ['pyre-1', 'pyre-2', 'pyre-3'],
  ambience: { 'pyre-1': { rumble: 0.5, wind: 0.3 }, 'pyre-2': { rumble: 0.55, wind: 0.35 }, 'pyre-3': { rumble: 0.6, wind: 0.4 }, 'pyre-nest': { rumble: 0.9, wind: 0.3 } },
  beats: {
    'pyre-1': [
      ['narr', 'The Pyre Vault. Channels of lava cut the floor into islands, and iron wheels stand up out of the stone, their pipes running down into the dark.'],
      ['narr', 'Somebody turns nothing, and nothing happens. You turn one: cold air screams up through the floor, a channel goes black - and across the room another one starts to glow.'],
      ['kid', '(It\'s Grandma\'s radiators. You turn one knob, the kitchen freezes and the bathroom turns into a sauna.)'],
    ],
    'pyre-nest': [
      ['narr', 'A ring of old flagstones over a lake of fire, ash lying on it like snow. In the middle, on a perch of bone, something with burning wings sits very straight. Beside it there is a second seat. Nobody is in it.'],
    ],
  },
};
