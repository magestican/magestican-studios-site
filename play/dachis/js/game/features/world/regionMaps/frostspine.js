











import { U } from '../../../../engine/core/util.js';
import { addSections, sectionWindows, fromUV, toUV, edgeDepth } from '../sections.js';
import { T, newMap, carvePath, floodReach, mapQueries, lookIn, addObj, buildGrid } from '../mapgen.js';
import { clearOfLanes } from '../functional.js';
import { guardHuts, dressHuts, placeYard, fruitGrove } from '../dressing.js';

export const ID = 'frostspine';
export const SIZE = 82;
const WT = ['Frost', 'Gale', 'Light'];
export const SECTIONS = addSections([
  { id: 'frost-camp', name: 'Frostspine Peaks - Base Camp', rect: { u: [-20, 20], v: [24, 56] }, zoom: 8.5, wall: 2.0, region: ID, chapter: 6 },
  { id: 'frost-pass', name: 'Frostspine Peaks - The Switchback Pass', rect: { u: [-20, 20], v: [56, 93] }, zoom: 8.5, wall: 2.0, region: ID, sea: true, chapter: 6, wildTypes: WT },
]);
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const smooth = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const xy = ([u, v]) => fromUV(u, v);

export const CAMP_H = 0.25, RIM_H = 2.8, LOW_H = 1.3;

export const LAKE = { u: 5.5, v: 41, ru: 9.5, rv: 8.2 };
export const lakeIn = (u, v) => 1 - Math.hypot((u - LAKE.u) / LAKE.ru, (v - LAKE.v) / LAKE.rv);

export const BANDS = { rimS: 63, ledgeS: [64.6, 67.6], ledgeN: [78.4, 81.4], rimN: 83 };
export const ARCH = { u: 10, half: 1.15 };              
export const RAMP_S = { u: [-17.6, -14.4], v: [61, 65.6] }; 
export const RAMP_N = { u: [-12.6, -9.4], v: [80, 84.6] };  

export const HIGH = { id: 'frost-high', a: [2, 60.6], b: [2, 85.2], half: 0.72, h: RIM_H, sag: 0.22, open: 'frost_bridge' };
export const WINCH = at(4.2, 86.4);
export const ENTRY = at(-10.0, 30.6);   
export const LANDING = ENTRY;
export const SPRING = at(-13.0, 33.2);  
export const EXIT = at(12.0, 89.0);     
export const BACK = at(12.0, 87.2);     



const inside = (u, v) => edgeDepth({ u: [-20, 20], v: [24, 93] }, u, v).depth > 2.0;
const inR = (r, u, v) => u >= r.u[0] && u <= r.u[1] && v >= r.v[0] && v <= r.v[1];
export function heightOf(u, v) {
  if (!inside(u, v)) return RIM_H + 1.6;
  if (v < 52) return CAMP_H;
  if (v < 60) return U.lerp(CAMP_H, RIM_H, smooth(52, 60, v));         
  if (inR(RAMP_S, u, v)) return U.lerp(RIM_H, LOW_H, smooth(RAMP_S.v[0] + 0.6, RAMP_S.v[1] - 0.6, v));
  if (inR(RAMP_N, u, v)) return U.lerp(LOW_H, RIM_H, smooth(RAMP_N.v[0] + 0.6, RAMP_N.v[1] - 0.6, v));
  if (v < BANDS.rimS) return RIM_H;
  if (v < BANDS.ledgeS[0]) return (RIM_H + LOW_H) / 2;
  if (v < BANDS.ledgeS[1]) return LOW_H;
  if (v < BANDS.ledgeN[0]) return Math.abs(u - ARCH.u) < ARCH.half ? LOW_H + 0.22 * Math.sin(Math.PI * (v - BANDS.ledgeS[1]) / (BANDS.ledgeN[0] - BANDS.ledgeS[1])) : -0.7;
  if (v < BANDS.ledgeN[1]) return LOW_H;
  if (v < BANDS.rimN) return (RIM_H + LOW_H) / 2;
  return RIM_H;
}
export function ground(u, v) {
  if (!inside(u, v)) return 'wall';
  if (v < 60 || inR(RAMP_S, u, v) || inR(RAMP_N, u, v)) return 'ground';
  if (v >= BANDS.rimS && v < BANDS.ledgeS[0]) return 'wall';
  if (v >= BANDS.ledgeN[1] && v < BANDS.rimN) return 'wall';
  if (v >= BANDS.ledgeS[1] && v < BANDS.ledgeN[0]) return Math.abs(u - ARCH.u) < ARCH.half ? 'arch' : 'chasm';
  return 'ground';
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v), h = heightOf(u, v);
  if (g === 'wall') return h + U.fbm(x * 0.2, y * 0.2, 1601) * 0.9;
  if (g === 'chasm') return h;
  return h + (lakeIn(u, v) > 0 ? -0.13 : U.fbm(x * 0.17, y * 0.17, 1603) * 0.06);
}
function tileFor(x, y) {
  const [u, v] = toUV(x, y), g = ground(u, v);
  if (g === 'wall') return T.CLIFF;
  if (g === 'chasm') return T.DEEP;
  if (g === 'arch') return T.RUIN;                      
  if (lakeIn(u, v) > 0) return T.PLAZA;                 
  if (inR(RAMP_S, u, v) || inR(RAMP_N, u, v)) return T.SAND; 
  const n = U.fbm(x * 0.21, y * 0.21, 1607);
  if (v >= 60 && n > 0.6) return T.THICKET;             
  return n < 0.3 ? T.GLADE : T.GRASS;                   
}


const HUTS = [[3.4, 36.6, 1.3, 1], [10.6, 38.4, 1.35, 1], [12.2, 45.0, 1.3, 1], [5.0, 46.6, 1.4, 1], [-9.0, 39.8, 1.35, 0], [-13.0, 46.6, 1.3, 0], [-5.0, 50.0, 1.3, 0]];
const ROOFS = ['#c84a3a', '#3a6ab0', '#d8a03a', '#4a8a6a', '#8a4ab0', '#b05a3a', '#3a8ab0'];
export const HUT_SPOTS = HUTS.map(([u, v, s, ice]) => ({ ...at(u, v), s, stilt: !!ice }));

export const LANE = [[-10.0, 30.6], [-7.0, 35.0], [-3.0, 39.6], [-1.0, 44.0], [0.6, 50.0], [0.6, 56.0], [0.0, 61.6], [-8.0, 61.8], [-16.0, 61.8],
  [-16.0, 66.0], [-6.0, 66.2], [4.0, 66.2], [10.0, 66.2], [10.0, 79.8], [0.0, 79.8], [-11.0, 79.8], [-11.0, 85.6], [-2.0, 87.0], [6.0, 88.0], [12.0, 89.0]];
export const DWELLERS = [
  { id: 'frost-v0', home: { ...at(1.0, 41.6), r: 2.2 }, lines: [
    'Nothing goes bad up here, you know? Fish, meat, whatever. My brother\'s been mad at me since the winter I was born, so. That too.',
    'Nine summers and that lake hasn\'t thawed once. The old folks swear it used to. My kids think thawing\'s made up. Like dragons.'] },
  { id: 'frost-v1', home: { ...at(-7.4, 45.0), r: 2.2 }, lines: [
    'My sister took her little ones up to the Menagerie to see the lights. In spring. ...They never came down. I keep thinking up there it\'s still that same morning.',
    'If you go up there, look for a blue one with a chipped ear. Don\'t tell her I\'m mad. I\'m not mad. Just... tell her there\'s soup.'] },
  { id: 'frost-v2', home: { ...at(-1.4, 52.4), r: 2.0 }, lines: [
    'The big bridge? Yeah, we cut it. Well, Grandpa did. The night the cold came down the pass after us. There\'s a winch on the other side that winds it back in, but, you know. Other side.',
    'You want the low way. Down the steps, then under the old bridge, then... over the ice arch? Or is the arch first. Grandpa calls it the Switchback. I call it the long way. You\'ll figure it out.'] },
];


export const ELDER = { name: 'Grandpa Hask', at: at(3.2, 53.0) };
export const ELDER_LINES = {
  before: ['I cut that bridge. Me, with my good knife. The cold came down the pass with his voice in it and I just... cut. It stopped at the edge. Don\'t look at me like that. I\'d do it again. Probably.',
    'The Rex used to look after the herds up top, all through the bad winters. Then he started keeping them. For good, I mean. Listen. His vents hiss, one, two, three - you back off. That\'s the roar coming. After the roar his own frost locks his legs up. That\'s your chance.'],
  after: ['Lake went grey this morning. Grey ice means it\'s going. Nine summers... Somebody get me a chair. And, uh. Somebody find out if we still have a boat.',
    'My grandson wants to wind the big bridge back in. Let him. Let the boy. The cold went home.'],
};

export function generateFrostspine() { const it = frostspineSteps(); let s; while (!(s = it.next()).done); return s.value; }
const BAND = 16;
export function* frostspineSteps() {
  const N = SIZE, V = N + 1, W = newMap(N, ID, SECTIONS);
  for (let j = 0; j < V; j++) { for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j); if (j % BAND === BAND - 1) yield 'heights'; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[W.idx(i, j)] = tileFor(i + 0.5, j + 0.5);
  yield 'tiles';
  const lane = LANE.map(xy), before = W.type.slice();
  carvePath(W, W.type, lane);
  
  for (let k = 0; k < W.type.length; k++) if (W.type[k] === T.PATH && (before[k] === T.CLIFF || before[k] === T.RUIN || before[k] === T.SAND)) W.type[k] = before[k];
  mapQueries(W);
  W.reach = floodReach(W, W.type, ENTRY);
  yield 'reach';
  
  const seen = W.reach.slice(), [hu0, hv0] = HIGH.a, [, hv1] = HIGH.b;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const [u, v] = toUV(i + 0.5, j + 0.5); if (Math.abs(u - hu0) < 1.4 && v > hv0 && v < hv1) seen[W.idx(i, j)] = 1; }
  W.windows = sectionWindows(Object.assign(Object.create(W), { reach: seen }), SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;
  W.baseType = W.type; W.baseReach = W.reach; W.baseWindows = W.windows; W.baseWindowsOf = W.windowsOf;
  W.paths = [{ pts: lane, half: 0.5 }];
  W.decks = [{ ...HIGH, a: xy(HIGH.a), b: xy(HIGH.b) }]; 
  W.winch = { ...WINCH, deck: HIGH.id, flag: HIGH.open };
  W.npcOk = (x, y, rad) => W.walkable(x, y, rad) && toUV(x, y)[1] < 54 && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 1.8 && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.4;
  const huts = HUT_SPOTS.map((h, i) => {
    let best = lane[0], bd = Infinity; for (const p of lane.slice(0, 6)) { const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d < bd) { bd = d; best = p; } }
    const rot = Math.atan2(best[0] - h.x, best[1] - h.y);
    return { ...h, i, rot, door: [h.x + Math.sin(rot) * 1.15 * h.s, h.y + Math.cos(rot) * 1.15 * h.s] };
  });
  for (const h of huts) addObj(W, { kind: 'hut', x: h.x, y: h.y, solid: 0.83 * h.s, roof: ROOFS[h.i], rot: h.rot, s: h.s });
  addObj(W, { kind: 'spring', x: SPRING.x, y: SPRING.y, solid: 0.8, heal: true });
  addObj(W, { kind: 'winch', x: WINCH.x, y: WINCH.y, solid: 0.5, rot: Math.PI / 2 });
  
  for (const [u, v] of [HIGH.a, HIGH.b]) for (const side of [-1, 1]) { const p = at(u + side * 0.85, v); addObj(W, { kind: 'pillar', x: p.x, y: p.y, solid: 0.2, s: 0.5, v: 1 }); }
  for (const [u, v] of [[-8.4, 32.6], [-2.4, 47.0], [0.6, 57.8], [-16.8, 60.6], [-10.0, 86.8], [11.0, 86.6]]) { const q = at(u, v), p = clearOfLanes(W.paths, q.x, q.y, 0.25); addObj(W, { kind: 'lantern', x: p.x, y: p.y, solid: 0.25, rot: Math.PI / 4 }); }
  
  
  {
    const dr = U.rng(1616), segD = ([au, av], [bu, bv], u, v) => {
      const du = bu - au, dv = bv - av, L = du * du + dv * dv, t = U.clamp(((u - au) * du + (v - av) * dv) / L, 0, 1);
      return Math.hypot(au + du * t - u, av + dv * t - v);
    };
    const dclear = (x, y, r) => {
      const [u, v] = toUV(x, y);
      return LANE.every((p, k) => k === 0 || segD(LANE[k - 1], p, u, v) > 0.9 + r) && Math.hypot(x - ENTRY.x, y - ENTRY.y) > 2.4 + r
        && Math.hypot(x - SPRING.x, y - SPRING.y) > 1.8 + r && huts.every((h) => Math.hypot(x - h.door[0], y - h.door[1]) > 0.9 + r) && v < 52;
    };
    guardHuts(W, huts);
    for (const [k, u, v] of [['cookfire', -5.4, 42.6], ['well', -11.6, 43.0], ['fishrack', 7.6, 42.2], ['fishrack', 1.0, 47.8], ['washline', -12.0, 36.6],
      ['tools', -3.0, 34.4], ['crates', 3.0, 51.4], ['strawbed', -15.0, 41.0], ['pots', -8.0, 48.6]]) {
      placeYard(W, k, at(u, v), { rot: dr() * 6.28, clear: dclear, extra: {} });
    }
    dressHuts(W, huts, { rng: dr, kinds: ['basket', 'pots', 'crates', 'strawbed', 'tools', 'bowl', 'toys'], food: ['#8ab4cc', '#e8eef2', '#d06a3a'], clear: dclear, perHut: [2, 4] });
    fruitGrove(W, at(-16.2, 37.0), 'appletree', { rng: dr, clear: dclear });
    for (const [u, v, rot] of [[-7.0, 32.0, 0.4], [6.0, 51.6, 1.2]]) { const p = at(u, v); if (dclear(p.x, p.y, 1.0)) addObj(W, { kind: 'prayerline', x: p.x, y: p.y, solid: 0, rot }); }
  }
  yield 'buildings';
  const r = U.rng(1717);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j && j % BAND === 0) yield 'props';
    const t = W.type[W.idx(i, j)], x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.windowsOf(x, y, 1.2, 2.6).length || U.dist(x, y, ENTRY.x, ENTRY.y) < 2.2) continue;
    const [u, v] = toUV(x, y);
    if (Math.abs(u - HIGH.a[0]) < 1.6 && v > HIGH.a[1] - 1 && v < HIGH.b[1] + 1) continue; 
    if (t === T.CLIFF) {
      const rimWall = v >= 60 && v < 90 && (v < BANDS.ledgeS[0] + 0.3 || v > BANDS.ledgeN[1] - 0.3) && inside(u, v);
      if (rimWall) { if (k < 0.18) addObj(W, { kind: 'iceblock', x, y, solid: 0, s: 0.7 + s * 0.6, rot }); continue; } 
      if (Math.hypot(x - WINCH.x, y - WINCH.y) < 3.2 || Math.hypot(x - EXIT.x, y - EXIT.y) < 3) continue; 
      if (k < 0.16) addObj(W, { kind: 'fir', x, y, solid: 0, s: 0.8 + s * 0.6, rot }); else if (k < 0.3) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.0 + s * 0.8, rot, v: Math.floor(k * 13) % 4 });
      continue;
    }
    if (t === T.DEEP || t === T.RUIN || t === T.PATH || t === T.SAND) continue;
    if (W.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 1.3)) continue;
    if (Math.hypot(x - WINCH.x, y - WINCH.y) < 2 || Math.hypot(x - EXIT.x, y - EXIT.y) < 2 || Math.hypot(x - SPRING.x, y - SPRING.y) < 2) continue;
    if (t === T.PLAZA) { if (lakeIn(u, v) < 0.12 && k < 0.05) addObj(W, { kind: 'iceblock', x, y, solid: 0.3, s: 0.5 + s * 0.4, rot }); continue; }
    if (v < 52) { 
      if (lane.some((p, q) => q && Math.hypot(p[0] - x, p[1] - y) < 2.2)) continue;
      if (k < 0.035) addObj(W, { kind: 'fir', x, y, solid: 0.35, s: 0.7 + s * 0.5, rot }); else if (k < 0.06) addObj(W, { kind: 'drift', x, y, solid: 0, s: 0.7 + s * 0.6, rot });
      continue;
    }
    if (t === T.THICKET) { if (k < 0.09) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.5 + s * 0.3, rot, flavor: 'frost' }); continue; }
    if (k < 0.03) addObj(W, { kind: 'fir', x, y, solid: 0.35, s: 0.6 + s * 0.5, rot });
    else if (k < 0.07) addObj(W, { kind: 'drift', x, y, solid: 0, s: 0.6 + s * 0.6, rot });
    else if (k < 0.085) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.4 + s * 0.4, rot });
  }
  yield 'props';
  buildGrid(W);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [u, v] = toUV(i + 0.5, j + 0.5);
    if (v > 60 && W.type[W.idx(i, j)] === T.THICKET && W.reach[W.idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]);
  }
  yield 'grid';
  const rs = U.rng(1818);
  for (let t = 0; W.spots.length < 6 && t < 6000; t++) {
    const x = 2 + rs() * (N - 4), y = 2 + rs() * (N - 4);
    if (!W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
    if (W.spots.some((q) => U.dist(q.x, q.y, x, y) < 5) || U.dist(x, y, ENTRY.x, ENTRY.y) < 3 || huts.some((h) => Math.hypot(x - h.x, y - h.y) < 2.2)) continue;
    W.spots.push({ id: 'fs' + W.spots.length, x, y, item: rs() < 0.5 ? 'tonic' : 'candy' });
  }
  return W;
}


export const MANIFEST = {
  order: 23,
  
  region: {
    id: ID, name: 'Frostspine Peaks', chapters: [6], size: SIZE, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: ENTRY, spring: LANDING, home: LANDING,
    pack: 'assets/scenery-frostspine.bin', 
    transit: false, objective: 'Cross the Switchback Pass',
  },
  generate: generateFrostspine, steps: frostspineSteps,
  perches: [
    { id: 'frostspine', region: ID, name: 'Base Camp', at: LANDING, opens: 'boss_quartz', respawn: null },
  ],
  place: { name: 'Frostspine Peaks', at: [0.31, 0.08], r: 0.06, glyph: 'peak' },
  kind: 'town',
  ground: { 'frost-camp': 'frost', 'frost-pass': 'frost' },
  water: ['#ffffff', '#d8eefa', '#a8d2ec', '#7aaed4'],
  towns: ['frost-camp'],
  ambience: { 'frost-camp': { wind: 0.55, chimes: 0.2 }, 'frost-pass': { wind: 0.85, rumble: 0.15 } },
  
  hands: { sp: 21, name: 'Rime', lines: [
    'I do the stilts. The ice moves, see? All night the lake shoves the huts around and every morning I\'m out there knocking the legs straight again. Nobody ever says thanks to a leg.',
    'The hot spring\'s mine too. Somebody\'s got to break the ice off it at dawn, and guess who. Go on, get in. Just wipe your feet after, the floor freezes.'] },
  beats: {
    'frost-camp': [
      ['narr', 'Aerowing drops you on snow so bright it hurts your eyes. Down below there\'s a frozen lake, with huts standing out on the ice on long skinny legs.'],
      ['kid', '(Snow! Real snow! ...And I\'m in a T-shirt. Great. Awesome. I can\'t feel my ears.)'],
    ],
    'frost-pass': [
      ['narr', 'The path goes up to the edge of a canyon. There used to be a rope bridge straight across. Now there\'s just the posts, with the ropes hanging cut. A skinny ledge zigzags down this side instead.'],
      ['kid', '(Okay. Nobody look down. ...I looked down. Why\'d I look down?)'],
    ],
  },
  
  
  
  palettes: {
    frost: { grass: ['#dce8f4', '#f6faff'], tall: ['#c4d6ea', '#e2ecf8'], sand: ['#c8c2b8', '#e6e0d6'], plaza: ['#8ccbec', '#c4e8fb'],
      ruin: ['#6aaedc', '#9cd2f2'], rock: ['#6a7488', '#8a94a8'], cliff: ['#3a4458', '#58637c'], thicket: ['#5a7a7a', '#7c9c98'],
      moss: ['#7a8a6a', '#9aaa84'], glade: ['#c4d6ea', '#e2ecf8'], path: ['#b8b0a4', '#ffffff'],
      deep: ['#7c94b0', '#9cb2ca'], shallow: ['#a8c0d8', '#c8dcee'] },
  },
  
  people: { rng: 161, kinds: { stage: 1, types: ['Frost', 'Gale'] }, gap: 0.8, dwellers: DWELLERS,
    elder: { id: 'frost-elder', name: ELDER.name, type: 'Frost', at: ELDER.at, lines: ELDER_LINES, boss: 'glacius' } },
};
