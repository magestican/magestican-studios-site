









































import { PATHS, PATH_HALF_WIDTH, pathDistance, placements, plazaDistance } from './moonLayout.mjs';
import { FOOTPRINTS, WALK_EDGE_M, obstacleFor, obstaclesWithoutRuntime, penetration, roomObstacle, BUILDING_ROLES } from './collision.mjs';
import { valueNoise2 } from '../noise.mjs';
import { LAND } from '../economy/tables.mjs';
import { nextParcelPrice } from '../economy/land.mjs';

export const GRID_M = 0.5;
const BISECT_STEPS = 12;

export const NEIGHBOUR_MIN_BORDER_M = 1.5;



const EXTENSIONS = Object.freeze({
  west: Object.freeze([[-44, -8], [-32, -6.5]]),
  east: Object.freeze([[31, -11], [44, -14]]),
  south: Object.freeze([[-5.5, 30], [-9, 44]]),
});



const LANE_LINE = Object.freeze([...EXTENSIONS.west, ...PATHS[2].slice().reverse(), ...PATHS[0].slice(2), ...EXTENSIONS.east]);
const SOUTH_LINE = Object.freeze([...PATHS[1], ...EXTENSIONS.south]);
for (let i = 1; i < LANE_LINE.length; i++) {
  if (!(LANE_LINE[i][0] > LANE_LINE[i - 1][0])) throw new Error('parcels: the lane line must run west to east');
}
for (let i = 1; i < SOUTH_LINE.length; i++) {
  if (!(SOUTH_LINE[i][1] > SOUTH_LINE[i - 1][1])) throw new Error('parcels: the south lane must run north to south');
}

function interp(line, a, along, other) {
  if (a <= line[0][along]) return line[0][other];
  for (let i = 1; i < line.length; i++) {
    if (a <= line[i][along]) {
      const p = line[i - 1], q = line[i];
      return p[other] + ((a - p[along]) / (q[along] - p[along])) * (q[other] - p[other]);
    }
  }
  return line[line.length - 1][other];
}


export function zoneOf(x, z) {
  if (z < interp(LANE_LINE, x, 0, 1)) return 'north';
  
  const sx = z < SOUTH_LINE[0][1] ? SOUTH_LINE[0][0] : interp(SOUTH_LINE, z, 1, 0);
  return x < sx ? 'southWest' : 'southEast';
}



export const STARTER = Object.freeze({ minX: -13, maxX: 10.5, minZ: -18.5, cornerM: 3, wobbleM: 0.6, wobbleWaveM: 6 });

function starterDistance(x, z) {
  const s = STARTER, hz = 40;
  const cx = (s.minX + s.maxX) / 2, hx = (s.maxX - s.minX) / 2, cz = s.minZ + hz;
  const qx = Math.abs(x - cx) - (hx - s.cornerM), qz = Math.abs(z - cz) - (hz - s.cornerM);
  const box = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - s.cornerM;
  return box + (valueNoise2(x / s.wobbleWaveM, z / s.wobbleWaveM, 73) - 0.5) * 2 * s.wobbleM;
}




const WARP = Object.freeze({ amplitudeM: 1.1, waveM: 9.5 });
function warp(x, z) {
  const u = x / WARP.waveM, v = z / WARP.waveM;
  return [
    x + (valueNoise2(u, v, 71) - 0.5) * 2 * WARP.amplitudeM,
    z + (valueNoise2(u + 17.3, v - 5.1, 72) - 0.5) * 2 * WARP.amplitudeM,
  ];
}




const SITES = Object.freeze([
  { x: -6.5, z: 8, weight: 0, label: 'by the fire pit' },
  { x: 11, z: 11, weight: 0, label: 'in the crook of the lanes' },
  { x: 18, z: -11, weight: 2.5, label: 'by the peach trees' },
  { x: -18.5, z: -10, weight: 0.5, label: 'west of the cottage' },
  { x: -2, z: -25, weight: 1, label: 'behind the cottage' },
  { x: -19, z: 6, weight: 0, label: 'along the west lane' },
  { x: 22, z: 3, weight: 0, label: 'along the east lane' },
  { x: 9, z: -26, weight: 0, label: 'at the top of the orchard' },
  { x: -9, z: 21, weight: 0, label: 'down the south lane' },
  { x: 7, z: 24, weight: 0, label: 'across the south lane' },
  { x: -15, z: -27, weight: 0, label: 'by the old grey rock' },
  { x: 26, z: -18, weight: 0, label: 'past the orchard' },
  { x: -32, z: -15, weight: 0, label: 'in the west meadow' },
  { x: 33, z: -1, weight: 0, label: 'where the east lane ends' },
  { x: -32, z: 5, weight: 0, label: 'where the west lane ends' },
  { x: -22, z: 21, weight: 0, label: 'in the south-west dell' },
  { x: 23, z: 19, weight: 0, label: 'in the sunny south-east' },
  { x: -3, z: -37, weight: 0, label: 'at the north rim' },
  { x: 16, z: -35, weight: 0, label: 'on the north-east slope' },
  { x: -27, z: -30, weight: 0, label: 'in the north-west corner' },
  { x: -10, z: 35, weight: 0, label: 'at the south rim' },
  { x: 9, z: 37, weight: 0, label: 'on the south slope' },
  { x: 34, z: 14, weight: 0, label: 'at the far east rim' },
].map((s) => Object.freeze({ ...s, zone: zoneOf(s.x, s.z) })));

const STARTER_LABEL = 'around your cottage';
const WALK2 = WALK_EDGE_M * WALK_EDGE_M;


export function parcelAt(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || x * x + z * z > WALK2) return null;
  const zone = zoneOf(x, z);
  if (zone === 'north' && starterDistance(x, z) < 0) return 0;
  const [wx, wz] = warp(x, z);
  let best = null, bestD = Infinity;
  for (let i = 0; i < SITES.length; i++) {
    const s = SITES[i];
    if (s.zone !== zone) continue;
    const d = Math.hypot(wx - s.x, wz - s.z) - s.weight;
    if (d < bestD) { bestD = d; best = i + 1; }
  }
  return best;
}



const COUNT = SITES.length + 1;
const E = Math.ceil((WALK_EDGE_M + 2 * GRID_M) / GRID_M);
const N = 2 * E + 1;
const gx = (i) => (i - E) * GRID_M;
const node = (i, j) => i + j * N;

const labels = new Int8Array(N * N);
const members = Array.from({ length: COUNT }, () => []);
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    const id = parcelAt(gx(i), gx(j)) ?? -1;
    labels[node(i, j)] = id;
    if (id >= 0) members[id].push(node(i, j));
  }
}
for (let id = 0; id < COUNT; id++) {
  if (!members[id].length) throw new Error(`parcels: parcel ${id} covers no land`);
}

const crossings = new Map();
function crossing(i0, j0, i1, j1) {
  const key = (i0 * N + j0) * N * N + (i1 * N + j1);
  let p = crossings.get(key);
  if (!p) {
    const ax = gx(i0), az = gx(j0), bx = gx(i1), bz = gx(j1);
    const la = labels[node(i0, j0)];
    let lo = 0, hi = 1;
    for (let k = 0; k < BISECT_STEPS; k++) {
      const t = (lo + hi) / 2;
      if ((parcelAt(ax + (bx - ax) * t, az + (bz - az) * t) ?? -1) === la) lo = t; else hi = t;
    }
    const t = (lo + hi) / 2;
    p = [ax + (bx - ax) * t, az + (bz - az) * t];
    crossings.set(key, p);
  }
  return p;
}




const CASES = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], null, [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], null, [[1, 2]], [[1, 3]], [[0, 1]], [[0, 3]], []];
const segments = Array.from({ length: COUNT }, () => ({ list: [], byKey: new Map() }));
const edgeKey = (i, j, e) => (e === 0 ? `${i},${j},${i + 1},${j}` : e === 1 ? `${i + 1},${j},${i + 1},${j + 1}` : e === 2 ? `${i},${j + 1},${i + 1},${j + 1}` : `${i},${j},${i},${j + 1}`);
for (let j = 0; j < N - 1; j++) {
  for (let i = 0; i < N - 1; i++) {
    const c = [labels[node(i, j)], labels[node(i + 1, j)], labels[node(i + 1, j + 1)], labels[node(i, j + 1)]];
    if (c[0] === c[1] && c[1] === c[2] && c[2] === c[3]) continue;
    for (const id of new Set(c)) {
      if (id < 0) continue;
      const bits = (c[0] === id ? 1 : 0) | (c[1] === id ? 2 : 0) | (c[2] === id ? 4 : 0) | (c[3] === id ? 8 : 0);
      let list = CASES[bits];
      if (!list) {
        const centreIn = parcelAt(gx(i) + GRID_M / 2, gx(j) + GRID_M / 2) === id;
        list = bits === 5 ? (centreIn ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]]) : (centreIn ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]]);
      }
      const s = segments[id];
      for (const [ea, eb] of list) {
        const seg = { a: edgeKey(i, j, ea), b: edgeKey(i, j, eb), used: false };
        s.list.push(seg);
        for (const k of [seg.a, seg.b]) { if (!s.byKey.has(k)) s.byKey.set(k, []); s.byKey.get(k).push(seg); }
      }
    }
  }
}

const round3 = (v) => Math.round(v * 1000) / 1000;

function loopsOf(id) {
  const { list, byKey } = segments[id];
  const point = (key) => {
    const [i0, j0, i1, j1] = key.split(',').map(Number);
    
    return labels[node(i0, j0)] === id ? crossing(i0, j0, i1, j1) : crossing(i1, j1, i0, j0);
  };
  const loops = [];
  for (const start of list) {
    if (start.used) continue;
    start.used = true;
    const keys = [start.a];
    let at = start.b;
    while (at !== start.a) {
      keys.push(at);
      const next = byKey.get(at).find((s) => !s.used);
      if (!next) break;
      next.used = true;
      at = next.a === at ? next.b : next.a;
    }
    let pts = keys.map(point);
    pts = pts.filter((p, k) => k === 0 || Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) > 0.02);
    if (signedArea(pts) < 0) pts.reverse();
    loops.push(pts.map(([x, z]) => Object.freeze([round3(x), round3(z)])));
  }
  return loops;
}


export function signedArea(pts) {
  let a = 0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k], q = pts[(k + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}


export function outlineDistance(outline, x, z) {
  let d = Infinity;
  for (let k = 0; k < outline.length; k++) {
    const [ax, az] = outline[k], [bx, bz] = outline[(k + 1) % outline.length];
    const vx = bx - ax, vz = bz - az;
    const len2 = vx * vx + vz * vz;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / len2)) : 0;
    d = Math.min(d, Math.hypot(x - (ax + vx * t), z - (az + vz * t)));
  }
  return d;
}


export function insideOutline(outline, x, z) {
  let inside = false;
  for (let k = 0, m = outline.length - 1; k < outline.length; m = k++) {
    const [ax, az] = outline[k], [bx, bz] = outline[m];
    if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
  }
  return inside;
}

const loops = Array.from({ length: COUNT }, (_, id) => loopsOf(id));

const outlines = loops.map((ls) => ls.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a)));

const borderCount = Array.from({ length: COUNT }, () => new Map());
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    const a = labels[node(i, j)];
    if (a < 0) continue;
    for (const [di, dj] of [[1, 0], [0, 1]]) {
      if (i + di >= N || j + dj >= N) continue;
      const b = labels[node(i + di, j + dj)];
      if (b < 0 || b === a) continue;
      borderCount[a].set(b, (borderCount[a].get(b) || 0) + 1);
      borderCount[b].set(a, (borderCount[b].get(a) || 0) + 1);
    }
  }
}
const neighboursOf = (id) => [...borderCount[id].entries()].filter(([, n]) => n * GRID_M >= NEIGHBOUR_MIN_BORDER_M).map(([k]) => k).sort((a, b) => a - b);




const border = new Float32Array(N * N).fill(1e9);
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    const l = labels[node(i, j)];
    if (l < 0) continue;
    const other = (ii, jj) => ii < 0 || jj < 0 || ii >= N || jj >= N || labels[node(ii, jj)] !== l;
    if (other(i - 1, j) || other(i + 1, j) || other(i, j - 1) || other(i, j + 1)) border[node(i, j)] = GRID_M / 2;
  }
}
{
  const D = GRID_M * Math.SQRT2;
  const relax = (n, ii, jj, w) => {
    if (ii < 0 || jj < 0 || ii >= N || jj >= N) return;
    const m = node(ii, jj);
    if (labels[m] === labels[n] && border[m] + w < border[n]) border[n] = border[m] + w;
  };
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const n = node(i, j);
      if (labels[n] < 0) continue;
      relax(n, i - 1, j, GRID_M); relax(n, i - 1, j - 1, D); relax(n, i, j - 1, GRID_M); relax(n, i + 1, j - 1, D);
    }
  }
  for (let j = N - 1; j >= 0; j--) {
    for (let i = N - 1; i >= 0; i--) {
      const n = node(i, j);
      if (labels[n] < 0) continue;
      relax(n, i + 1, j, GRID_M); relax(n, i + 1, j + 1, D); relax(n, i, j + 1, GRID_M); relax(n, i - 1, j + 1, D);
    }
  }
}



function centreOf(id) {
  let best = members[id][0];
  for (const n of members[id]) if (border[n] > border[best]) best = n;
  return { x: gx(best % N), z: gx(Math.floor(best / N)) };
}



export const SIGN_RULES = Object.freeze({
  
  
  pathMinM: PATH_HALF_WIDTH + 0.75,
  pathMaxM: PATH_HALF_WIDTH + 1.6,
  
  clearM: 0.9,
  
  borderM: 0.9,
  edgeMarginM: 2.0,
  spacingM: 3.0,
  
  
  
  maxTurnRad: 0.45,
});


export function layoutObstacles(P = placements()) {
  const trees = P.filter((p) => p.role === 'tree').map(obstacleFor).filter(Boolean);
  const rooms = P.filter((p) => BUILDING_ROLES.includes(p.role)).map(roomObstacle);
  return [...obstaclesWithoutRuntime(P), ...trees, ...rooms];
}

function nearestPathPoint(x, z) {
  let best = null, bestD = Infinity;
  for (const line of PATHS) {
    for (let k = 0; k < line.length - 1; k++) {
      const [ax, az] = line[k], [bx, bz] = line[k + 1];
      const vx = bx - ax, vz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
      const px = ax + vx * t, pz = az + vz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < bestD) { bestD = d; best = { x: px, z: pz }; }
    }
  }
  return best;
}

const clampTurn = (a) => Math.max(-SIGN_RULES.maxTurnRad, Math.min(SIGN_RULES.maxTurnRad, a));

function placeSigns(centres) {
  const obstacles = layoutObstacles();
  const home = centres[0];
  const reach = SIGN_RULES.clearM + FOOTPRINTS.parcelSign.halfXM;
  const signs = [];
  for (let id = 0; id < COUNT; id++) {
    const pathSide = [], inland = [];
    for (const n of members[id]) {
      if (border[n] < SIGN_RULES.borderM) continue;
      const x = gx(n % N), z = gx(Math.floor(n / N));
      if (Math.hypot(x, z) > WALK_EDGE_M - SIGN_RULES.edgeMarginM) continue;
      const pd = pathDistance(x, z);
      if (pd < SIGN_RULES.pathMinM) continue;
      (pd <= SIGN_RULES.pathMaxM ? pathSide : inland).push({ x, z });
    }
    const ok = ({ x, z }) => !signs.some((s) => Math.hypot(s.x - x, s.z - z) < SIGN_RULES.spacingM)
      && !obstacles.some((ob) => penetration(ob, x, z, reach).depth > 0)
      && outlineDistance(outlines[id], x, z) >= SIGN_RULES.borderM;
    const byDistance = (list, to) => list.sort((a, b) => Math.hypot(a.x - to.x, a.z - to.z) - Math.hypot(b.x - to.x, b.z - to.z));
    let spot = byDistance(pathSide, centres[id]).find(ok);
    let facing = spot && nearestPathPoint(spot.x, spot.z);
    if (!spot) {
      spot = byDistance(inland, home).find(ok);
      facing = home;
    }
    if (!spot) throw new Error(`parcels: no spot for parcel ${id}'s sign`);
    signs.push(Object.freeze({ x: spot.x, z: spot.z, rotY: round3(clampTurn(Math.atan2(facing.x - spot.x, facing.z - spot.z))) }));
  }
  return signs;
}

const centres = Array.from({ length: COUNT }, (_, id) => centreOf(id));
const signs = placeSigns(centres);



const CIVIC = new Set();
for (const p of placements()) {
  if (p.role === 'town') CIVIC.add(parcelAt(p.x, p.z));
}

export const PARCELS = Object.freeze(Array.from({ length: COUNT }, (_, id) => Object.freeze({
  id,
  civic: CIVIC.has(id),
  label: id === 0 ? STARTER_LABEL : SITES[id - 1].label,
  zone: id === 0 ? 'north' : SITES[id - 1].zone,
  centre: Object.freeze(centres[id]),
  area_m2: Math.round(Math.abs(signedArea(outlines[id]))),
  sign: signs[id],
  neighbours: Object.freeze(neighboursOf(id)),
  outline: Object.freeze(outlines[id]),
})));


export const loopCount = (id) => loops[id].length;




export function ownedIds(world) {
  const land = Array.isArray(world.land) ? world.land : Array.from({ length: world.parcels }, (_, i) => i);
  return [...land].sort((a, b) => a - b);
}


export function forSale(owned) {
  const mine = new Set(owned);
  return PARCELS.filter((p) => !p.civic && !mine.has(p.id) && p.neighbours.some((n) => mine.has(n))).map((p) => p.id);
}


export const civicIds = () => PARCELS.filter((p) => p.civic).map((p) => p.id);


export function landView(world) {
  const ids = forSale(ownedIds(world));
  return {
    forSale: ids.map((id) => ({ id, label: PARCELS[id].label })),
    
    
    
    nextPrice: ids.length === 0 || world.parcels >= LAND.maxParcels ? null : nextParcelPrice(world),
  };
}


export function signPoint(id) {
  const p = PARCELS[id];
  if (!p) throw new Error(`no parcel ${id}`);
  return { x: p.sign.x, z: p.sign.z };
}
