







import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import * as minehead from './minehead.js';

export const ID = 'geode-galleries';
export const SIZE = 112;
const WT = ['Stone', 'Light', 'Metal'];
const ROOM_V = [30, 48, 66, 84, 102];
export const SECTIONS = addSections([
  { id: 'geode-mouth', name: 'The Geode Galleries - The Mouth', rect: { u: [-15, 15], v: [30, 48] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, wildTypes: WT },
  { id: 'geode-prism', name: 'The Geode Galleries - The Prism Hall', rect: { u: [-15, 15], v: [48, 66] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, wildTypes: WT },
  { id: 'geode-heart', name: 'The Geode Galleries - The Heart', rect: { u: [-15, 15], v: [66, 84] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, wildTypes: WT },
  { id: 'geode-vault', name: 'The Geode Vault', rect: { u: [-15, 15], v: [84, 102] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 5, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const roomOf = (v) => (v < 48 ? 0 : v < 66 ? 1 : v < 84 ? 2 : 3);

export const DOORWAYS = [{ u: 0, v: 48 }, { u: 0, v: 66 }, { u: 0, v: 84 }];




export const HALLS = [
  { room: 0, source: { u: -12.4, v: 36, du: 1, dv: 0 }, lock: { u: 0, v: 46.4 },
    mirrors: [{ id: 'm0a', u: 0, v: 36, start: 1 }] },
  { room: 1, source: { u: 12.4, v: 52, du: -1, dv: 0 }, lock: { u: 0, v: 64.4 },
    mirrors: [{ id: 'm1a', u: 6, v: 52, start: 0 }, { id: 'm1b', u: 6, v: 60, start: 0 }, { id: 'm1c', u: 0, v: 60, start: 0 }, { id: 'm1d', u: -7, v: 56, start: 1 }] },
  { room: 2, source: { u: -12.4, v: 70, du: 1, dv: 0 }, lock: { u: 0, v: 82.4 },
    mirrors: [{ id: 'm2a', u: -4, v: 70, start: 1 }, { id: 'm2b', u: -4, v: 79, start: 1 }, { id: 'm2c', u: 8, v: 79, start: 0 }, { id: 'm2d', u: 8, v: 74, start: 1 }, { id: 'm2e', u: 0, v: 74, start: 0 }, { id: 'm2f', u: -9, v: 76, start: 0 }] },
];
export const MIRRORS = HALLS.flatMap((h) => h.mirrors.map((m) => ({ ...m, room: h.room, ...at(m.u, m.v) })));
export const LOCKS = HALLS.map((h) => ({ room: h.room, ...h.lock, ...at(h.lock.u, h.lock.v) }));
export const mirrorState = (m, flags = {}) => (flags[m.id] != null ? flags[m.id] : m.start);

export const reflect = (state, du, dv) => (state === 0 ? [dv, du] : [-dv, -du]);


export function traceBeam(hall, flags = {}) {
  const lo = ROOM_V[hall.room] + 0.6, hi = ROOM_V[hall.room + 1] - 0.6;
  let u = hall.source.u, v = hall.source.v, du = hall.source.du, dv = hall.source.dv;
  const pts = [[u, v]], seen = new Set();
  for (let bounce = 0; bounce < 16; bounce++) {
    
    let best = null, bd = Infinity;
    for (const m of hall.mirrors) {
      const t = (m.u - u) * du + (m.v - v) * dv, off = Math.abs((m.u - u) * dv - (m.v - v) * du);
      if (t > 0.05 && off < 0.05 && t < bd) { bd = t; best = m; }
    }
    const L = hall.lock, tl = (L.u - u) * du + (L.v - v) * dv, offl = Math.abs((L.u - u) * dv - (L.v - v) * du);
    
    let wall = 0; while (wall < 40 && floor(u + du * (wall + 0.1), v + dv * (wall + 0.1), true) && v + dv * (wall + 0.1) > lo && v + dv * (wall + 0.1) < hi) wall += 0.1;
    if (tl > 0.05 && offl < 0.05 && tl < bd && tl <= wall + 0.6) { pts.push([L.u, L.v]); return { pts, lit: true }; }
    if (!best || bd > wall + 0.3) { pts.push([u + du * wall, v + dv * wall]); return { pts, lit: false }; }
    u = best.u; v = best.v; pts.push([u, v]);
    if (seen.has(best.id + du + dv)) return { pts, lit: false }; 
    seen.add(best.id + du + dv);
    [du, dv] = reflect(mirrorState(best, flags), du, dv);
  }
  return { pts, lit: false };
}
export const hallOpen = (k, open = {}) => !!open[k];

export const ENTRY = at(0, 32.4);      
export const POOL = at(3.6, 92.8);      
export const POOL_LANDING = at(1.4, 94.6);
export const VAULT = { u: 0, v: 93, r: 7.4 };
export const ECHO_DOOR = at(0, 98.6);   
export const ECHO_BACK = at(0, 96.8);   
export const DWELLERS = [ 
  { id: 'geode-v0', home: { ...at(-3.0, 40.6), r: 0.8 }, lines: [
    'Don\'t touch the mirrors. ...You touched the mirror. Fine. Go on, turn it again. See where the light goes. That\'s all I do all day, you know. Watch where the light goes.',
    'I polish them every morning. Nobody asked me to. The light was here first, and honestly? It looked bored.'] },
  { id: 'geode-v1', home: { ...at(5.0, 88.6), r: 2.0 }, lines: [
    'You came through all three halls? With the mirrors and everything? I came in through a crack in the floor. Nobody told me there was a puzzle.',
    'The pool hums if you put your ear to it. The miners say it\'s just water moving underneath. I think it\'s singing. Quietly. Just to itself.'] },
];

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
const inDoorway = (u, v) => DOORWAYS.some((d) => Math.abs(v - d.v) < 2.4 && Math.abs(u - d.u) < 1.6) || (Math.abs(u) < 1.4 && v > 30.3 && v < 32.4);

export const CLUSTERS = [
  [-9, 41.6, 1.6], [9.6, 41.0, 1.8], [-6.4, 33.6, 1.2], [9, 33.4, 1.3],
  [-10.6, 61.6, 1.6], [10.6, 63.2, 1.3], [-11, 50.6, 1.2], [1.6, 55.4, 1.1],
  [-10.4, 81.6, 1.4], [11.2, 70.6, 1.3], [4, 68.4, 1.0], [-1.4, 76.6, 0.9], [12, 82, 1.2],
].map(([u, v, r]) => ({ u, v, r }));

export function floor(u, v, light = false) {
  if (inDoorway(u, v)) return true;
  if (!inside(u, v)) return false;
  const room = roomOf(v);
  if (room === 3) return Math.hypot(u - VAULT.u, (v - VAULT.v) * 1.15) < VAULT.r || (v < 87 && Math.abs(u) < 1.6);
  return !CLUSTERS.some((c) => Math.hypot(u - c.u, v - c.v) < c.r);
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y);
  return floor(u, v) ? 0.25 + U.fbm(x * 0.2, y * 0.2, 1101) * 0.12 : 1.6 + U.fbm(x * 0.2, y * 0.2, 1103) * 0.7;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!floor(u, v)) return T.CLIFF;
  if (inDoorway(u, v)) return T.RUIN;
  if (roomOf(v) === 3) return Math.hypot(u - VAULT.u, v - VAULT.v) < 3.4 ? T.RUIN : T.ROCK;
  return U.fbm(x * 0.22, y * 0.22, 1105) > 0.6 ? T.MOSS : T.ROCK;
}

export const beamLines = () => HALLS.flatMap((h) => {
  const all = [h.source, ...h.mirrors, h.lock];
  const out = [];
  for (const a of all) for (const b of all) if (a !== b && (Math.abs(a.u - b.u) < 0.01 || Math.abs(a.v - b.v) < 0.01)) out.push([a, b]);
  return out;
});
const segD = (a, b, u, v) => {
  const du = b.u - a.u, dv = b.v - a.v, L = du * du + dv * dv, t = U.clamp(((u - a.u) * du + (v - a.v) * dv) / L, 0, 1);
  return Math.hypot(a.u + du * t - u, a.v + dv * t - v);
};

export function generateGeodeGalleries() { const it = geodeGalleriesSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* geodeGalleriesSteps() {
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
  
  W.light = { halls: HALLS, mirrors: MIRRORS, locks: LOCKS, flags: {}, open: {} };
  addObj(W, { kind: 'spring', x: POOL.x, y: POOL.y, solid: 0.8, heal: true });
  for (const m of MIRRORS) addObj(W, { kind: 'mirrorstand', x: m.x, y: m.y, solid: 0.35, rot: 0 });
  for (const h of HALLS) { const p = at(h.source.u - h.source.du * 0.9, h.source.v - h.source.dv * 0.9); addObj(W, { kind: 'suncrack', x: p.x, y: p.y, solid: 0, rot: Math.atan2(h.source.du, h.source.dv) }); }
  for (const g of DOORWAYS) for (const du of [-1.9, 1.9]) { const p = at(g.u + du, g.v); addObj(W, { kind: 'crystal', x: p.x, y: p.y, solid: 0.45, s: 1.3, rot: du, c: '#c8a0ff' }); } 
  const lines = beamLines();
  const offBeam = (u, v, d) => lines.every(([a, b]) => segD(a, b, u, v) > d);
  yield 'buildings';
  const r = U.rng(1111), CRY = ['#c8a0ff', '#8ad8ff', '#ff9ad8', '#a0ffe0', '#fff0a0'];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 1.8) continue;
    const [u, v] = toUV(x, y);
    
    if (t === T.CLIFF) { if (k < 0.32) addObj(W, { kind: 'crystal', x, y, solid: 0, s: 0.9 + s * 1.1, rot, c: CRY[Math.floor(s * 5)] }); else if (k < 0.7) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    if (!offBeam(u, v, 0.9) || MIRRORS.some((m) => Math.hypot(m.x - x, m.y - y) < 1.4) || inDoorway(u, v)) continue;
    if (t === T.MOSS && k < 0.05) addObj(W, { kind: 'crystal', x, y, solid: 0.25, s: 0.4 + s * 0.3, rot, c: CRY[Math.floor(s * 5)] });
    else if (t === T.ROCK && k < 0.03) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [u, v] = toUV(i + 0.5, j + 0.5);
    if (W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)] && offBeam(u, v, 1.0)) W.wildTiles.push([i + 0.5, j + 0.5]);
  }
  
  const walk = W.walkable;
  W.walkable = (x, y, rad = 0) => walk(x, y, rad) && !DOORWAYS.some((g, k) => !hallOpen(k, W.light.open) && Math.hypot(x - at(g.u, g.v).x, y - at(g.u, g.v).y) < 1.8 + rad);
  yield 'grid';
  const rs = U.rng(1212);
  for (let t = 0; W.spots.length < 5 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4), [u, v] = toUV(x, y);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !walk(x, y, 0.4) || !offBeam(u, v, 0.9) || inDoorway(u, v)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3 || MIRRORS.some((m) => Math.hypot(m.x - x, m.y - y) < 1.6)) continue;
    W.spots.push({ id: 'gg' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


export const MANIFEST = {
  order: 21,
  
  region: {
    id: ID, name: 'The Geode Galleries', chapters: [5], size: SIZE, interior: true, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: POOL_LANDING, home: ENTRY,
    pack: 'assets/scenery-geode-galleries.bin', 
    transit: false, objective: 'Turn the mirrors - bring the light to the crystal',
  },
  generate: generateGeodeGalleries, steps: geodeGalleriesSteps,
  doors: [
    { id: 'geode-in', region: minehead.ID, at: minehead.GEODE_DOOR, to: ID, toAt: ENTRY, label: 'Into the crystal', after: null },
    { id: 'geode-out', region: ID, at: ENTRY, to: minehead.ID, toAt: minehead.GEODE_BACK, label: 'Back to the camp', after: null },
  ],
  perches: [
    { id: 'geode-galleries', region: ID, name: 'The Crystal Pool', at: POOL_LANDING, opens: 'boss_kingshade', respawn: null },
  ],
  place: { name: 'The Geode Galleries', at: [0.31, 0.83], r: 0.04, glyph: 'meadow' },
  kind: 'cave',
  ground: { 'geode-mouth': 'ember', 'geode-prism': 'ember', 'geode-heart': 'ember', 'geode-vault': 'ember' },
  caves: ['geode-mouth', 'geode-prism', 'geode-heart', 'geode-vault'],
  ambience: { 'geode-mouth': { wind: 0.25, chimes: 0.45 }, 'geode-prism': { chimes: 0.6, rumble: 0.2 }, 'geode-heart': { chimes: 0.7, rumble: 0.3 }, 'geode-vault': { chimes: 0.5, wind: 0.15 } },
  beats: {
    'geode-mouth': [
      ['narr', 'The crack opens into a hall of crystal. Every wall throws your torchlight back at you in pieces.'],
      ['narr', 'Across the floor a single bar of daylight runs from a split in the rock to a mirror on a brass stand - and stops dead against the wall.'],
      ['kid', 'This is the fun house at Coney Island. I got lost in there for like twenty minutes. Mom bought me a hot dog after so I\'d stop crying.'],
      ['kid', '(The mirror turns. Maybe if the light went the other way...)'],
    ],
    'geode-vault': [
      ['narr', 'The last wall falls in a rain of violet glass. Beyond it the geode opens round a pool so clear it looks empty.'],
      ['kid', 'Okay. That was worth it. That was way worth it.'],
    ],
  },
  
  people: { rng: 113, kinds: { stage: 2, types: ['Light'], match: 'any' }, gap: 0.3, dwellers: DWELLERS },
};
