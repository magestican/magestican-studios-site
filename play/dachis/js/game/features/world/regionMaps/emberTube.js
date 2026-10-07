





import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import * as winding from './windingPath.js';

export const ID = 'ember-tube';
export const SIZE = 80;
export const SECTIONS = addSections([
  { id: 'ember-a', name: 'Ember Tube - The Glow Gallery', rect: { u: [-18, 18], v: [30, 56] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 1, wildTypes: ['Ember', 'Stone', 'Metal'] },
  { id: 'ember-b', name: 'Ember Tube - The Magma Hall', train: true, rect: { u: [-18, 18], v: [56, 82] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 1, wildTypes: ['Ember', 'Stone', 'Metal'] },
]);
const uvPts = (list) => list.map(([u, v]) => fromUV(u, v));
export const PATH = uvPts([[0, 31], [5, 37], [-4, 44], [3, 52], [-6, 60], [4, 67], [-2, 74], [3, 80]]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
export const ENTRY = at(0, 33.2);    
export const SPRING = at(3.6, 34.8); 

export const DWELLERS = [
  { id: 'ember-v0', home: { ...at(-3.5, 37.5), r: 2.6 }, lines: [
    'Forty-one torches. I light \'em, trim \'em, light \'em again. You\'re standing in number nine\'s light, by the way. That\'s a stick of resin you owe me.',
    'Ashlo used to bring us coals down from the crater, you know. Scraped his foot twice, then came down the slope like a bull. Straight down. Once he started, he never turned. Not once.'] },
  { id: 'ember-v1', home: { ...at(5.5, 62), r: 2.6 }, lines: [
    'Don\'t lean over the pools. My boy did, on a bet. No eyebrows now. Says it\'s the best thing that ever happened to him. Kids.',
    'You want to put out something that burns, bring something wet. Or a rock. My mother used to say that. Only thing she ever got right, mind you.'] },
  { id: 'ember-v2', home: { ...at(-6, 70), r: 2.6 }, lines: [
    'A little one hatched in the warm stones and went off humming toward the Hall. Somebody up in the village keeps asking about her. Not me. I\'m not asking. I\'m not going near that Hall.',
    'Past the Hall the tube goes cold. And I\'m not scared of cold, okay? I\'m scared of whatever makes a fire tube go cold. That\'s a whole different thing.'] },
];

const inside = (u, v) => SECTIONS.some((s) => edgeDepth(s.rect, u, v).depth > s.wall);
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), depth = Math.max(...SECTIONS.map((s) => edgeDepth(s.rect, u, v).depth));
  
  return 0.25 + U.fbm(x * 0.09, y * 0.09, 41) * 0.8 + Math.max(0, 2 - depth) * 0.6;
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y);
  if (!inside(u, v)) return T.CLIFF;
  const n = U.fbm(x * 0.1, y * 0.1, 91), m = U.fbm(x * 0.13, y * 0.13, 17);
  if (v > 57 && n > 0.66) return T.LAVA;   
  if (v <= 57 && n > 0.74) return T.LAVA;  
  if (m > 0.6) return T.MOSS;              
  return T.ROCK;
}

export function generateEmberTube() { const it = emberTubeSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* emberTubeSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  carvePath(W, W.type, PATH);
  
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH) W.type[k] = T.ROCK;
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  W.windows = sectionWindows(W, SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: PATH.map((p) => [...p]), half: 0.5 }];
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && U.dist(x, y, ENTRY.x, ENTRY.y) > 1.8; 
  const r = U.rng(4242);
  const road = (x, y) => { let d = Infinity; for (let k = 0; k < PATH.length - 1; k++) d = Math.min(d, segDist(PATH[k], PATH[k + 1], x, y)); return d; };
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  
  for (let k = 0; k < PATH.length - 1; k++) {
    const [ax, ay] = PATH[k], [bx, by] = PATH[k + 1], L = Math.hypot(bx - ax, by - ay);
    for (let t = 2; t < L; t += 6) {
      const s = ((k + t) % 2 ? 1 : -1) * 1.6, x = ax + (bx - ax) * t / L - (by - ay) / L * s, y = ay + (by - ay) * t / L + (bx - ax) / L * s;
      if (W.type[W.idx(Math.floor(x), Math.floor(y))] === T.LAVA || U.dist(x, y, SPRING.x, SPRING.y) < 2) continue;
      addObj(W, { kind: 'torch', x, y, solid: 0.2 });
    }
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length) continue;
    if (U.dist(x, y, SPRING.x, SPRING.y) < 2.2 || U.dist(x, y, ENTRY.x, ENTRY.y) < 1.6) continue;
    if (t === T.CLIFF) { if (k < 0.5) addObj(W, { kind: 'crag', x, y, solid: 0, s: 0.9 + s * 0.8, rot, v: Math.floor(k * 8) % 4 }); continue; }
    const rd = road(x, y);
    if (t === T.ROCK && k < 0.07 && rd > 1.5) addObj(W, { kind: 'rock', x, y, solid: 0.35, s: 0.6 + s * 0.8, rot, dark: true });
    else if (t === T.MOSS && k < 0.06 && rd > 1) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.7 + s * 0.4, rot, flavor: 'shrine' });
  }
  yield 'props';
  buildGrid(W);
  yield 'grid';
  const rs = U.rng(4343);
  for (let t = 0; W.spots.length < 8 && t < 4000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3) continue;
    W.spots.push({ id: 'et' + W.spots.length, x, y, item: rs() < 0.55 ? 'tonic' : rs() < 0.75 ? 'candy' : 'seal' });
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (W.type[W.idx(i, j)] === T.MOSS && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  return W;
}
function segDist([ax, ay], [bx, by], x, y) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1);
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
}



const MOUTH = winding.MOUTH, MOUTH_ARRIVE = winding.MOUTH_ARRIVE;

export const MANIFEST = {
  order: 2,
  
  region: {
    id: ID, name: 'Ember Tube', chapters: [1], size: SIZE, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: SPRING, home: ENTRY,
    pack: null,
    transit: false, objective: 'Follow the torches through the Ember Tube',
  },
  generate: generateEmberTube, steps: emberTubeSteps,
  doors: [
    { id: 'ember-in', region: winding.ID, at: MOUTH, to: ID, toAt: ENTRY, label: 'Enter the Ember Tube', after: 'initiated' },
    { id: 'ember-out', region: ID, at: ENTRY, to: winding.ID, toAt: MOUTH_ARRIVE, label: 'Back to Mt. Kazan', after: null },
  ],
  perches: [
    { id: 'ember-tube', region: ID, name: 'Ember Tube Spring', at: ENTRY, opens: 'boss_ashlo', respawn: null },
  ],
  
  place: { name: 'Ember Tube', at: [0.86, 0.2], r: 0.1, glyph: 'volcano' },
  kind: 'cave',
  ground: { 'ember-a': 'ember', 'ember-b': 'ember' },
  caves: ['ember-a', 'ember-b'],
  ambience: { 'ember-a': { rumble: 0.8, wind: 0.25 }, 'ember-b': { rumble: 1, wind: 0.15 } },
  beats: {
    'ember-b': [
      ['narr', 'The Magma Hall. Heat rolls off the pools in slow waves, and the rock hums underfoot.'],
      ['narr', 'Somewhere past the pools, something small is crying.'],
    ],
  },
  
  people: { rng: 77, kinds: { stage: 1, types: ['Ember', 'Stone'] }, gap: 1.2, dwellers: DWELLERS },
};
