









import { U } from '../../../engine/core/util.js';
import { SECTIONS, toUV, fromUV, sectionAtUV, sectionById, edgeDepth, nearestSection, sectionWindows, screenS, BASE_SECTIONS } from './sections.js';

export const MAP = 96;


export const HOME = 'kazan-isle';
export const T = { DEEP: 0, SHALLOW: 1, SAND: 2, GRASS: 3, TALL: 4, PATH: 5, ROCK: 6, LAVA: 7, PLAZA: 8, WOOD: 9, CLIFF: 10, JUNGLE: 11, REEF: 12, KELP: 13, RUIN: 14, GLADE: 15, THICKET: 16, MOSS: 17 };

export const BLOCKED = new Set([T.DEEP, T.SHALLOW, T.LAVA, T.WOOD, T.CLIFF]);



const STEP_OF = { [T.GRASS]: 'stepGrass', [T.GLADE]: 'stepGrass', [T.TALL]: 'stepGrass', [T.THICKET]: 'stepGrass', [T.KELP]: 'stepGrass', [T.JUNGLE]: 'stepGrass', [T.SAND]: 'stepSand',
  [T.PATH]: 'stepDirt', [T.ROCK]: 'stepStone', [T.PLAZA]: 'stepStone', [T.RUIN]: 'stepStone', [T.REEF]: 'stepStone' };
export const stepSound = (type) => STEP_OF[type] || 'stepSoft';
const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const uvPts = (list) => list.map(([u, v]) => fromUV(u, v));

export const VOLC = at(0, 40);
export const SHRINE = at(0, 94);
export const CRATER = { x: VOLC.x - 1.5, y: VOLC.y - 2.2 };
export const PLATEAU_H = 4.0;
export const SPAWN = { x: VOLC.x + 0.2, y: VOLC.y + 1.9 };


export const RESPAWN = { kazan: SPAWN, shrine: { x: SHRINE.x + 0.6, y: SHRINE.y + 1.4 } };
export const ISLAND = { u: 0, v: 67.9, r: 44 };

export const BAY = { u: 30, v: 78.5, r: 12 };


export const PATH_POINTS = uvPts([[0, 44.2], [0, 48.8], [-2.4, 50.4], [2.2, 52.3], [-1.3, 54.3], [0.6, 56.8], [3.2, 59.8],
  [-1.6, 63.6], [1.8, 67.2], [0.3, 70.8], [-2, 74.8], [1.5, 79], [-1, 83.4], [-2.6, 87.6], [-1.4, 91], [0, 93.2]]);

export const COAST_PATH = uvPts([[1.5, 79], [6, 78.4], [10.5, 78], [15, 77.6]]);



export const CORAL_PATH = uvPts([[15, 77.6], [16.6, 81.5], [16.4, 86], [17.4, 90.5], [18.2, 92.6]]);
export const CORAL = { plaza: at(19.4, 95.4), plazaR: 3.2, temple: at(13.4, 90.4) };




export const VERDANT_PATH = uvPts([[-1.6, 63.6], [-5, 65.4], [-9.5, 66], [-13, 65.4], [-16.2, 66.2]]);
export const VERDANT = { grove: at(-19.6, 66.6), groveR: 3.2, tree: at(-20.2, 61.8) };

const A = (u, v) => { const p = fromUV(u, v); return p; };
export const AMBUSH = { ...at(-1.2, 75.6), rocks: [A(1.2, 75.0), A(1.9, 75.7), A(0.9, 76.2)], from: at(2.5, 75.3) };

const CORAL_RECT = sectionById('coral').rect, VERDANT_RECT = sectionById('verdant').rect;
const smooth = (t) => t * t * (3 - 2 * t);
function landValue(x, y, u, v) {
  const d = U.dist(u, v, ISLAND.u, ISLAND.v), n = U.fbm(x * 0.07, y * 0.07, 7);
  let land = 1 - d / ISLAND.r + (n - 0.5) * 0.3;
  land = Math.min(land, (U.dist(u, v, BAY.u, BAY.v) - BAY.r) / 8);
  if (U.dist(x, y, VOLC.x, VOLC.y) < 16) land = Math.max(land, 0.5);
  if (U.dist(x, y, SHRINE.x, SHRINE.y) < 9) land = Math.max(land, 0.4);
  
  
  const cr = CORAL_RECT;
  if (u > cr.u[0] - 2.5 && u < cr.u[1] + 2.5 && v > cr.v[0] - 5 && v < cr.v[1] + 2.5) land = Math.max(land, U.clamp((v - cr.v[0] + 5) / 3, 0, 1) * 0.3);
  
  const vr = VERDANT_RECT;
  if (u > vr.u[0] - 3 && u < vr.u[1] + 1 && v > vr.v[0] - 3 && v < vr.v[1] + 3) land = Math.max(land, 0.3);
  return land;
}








export const TERRACE_R0 = 8.8, TERRACE_H = 0.9, TERRACE_RUN = TERRACE_H / 0.42;
const terrace = (d) => { const q = d / TERRACE_H, k = Math.floor(q); return (k + smooth(U.clamp((q - k - 0.72) / 0.28, 0, 1))) * TERRACE_H; };
export const terraceTop = (k) => PLATEAU_H - (TERRACE_R0 - 5) * 0.42 - k * TERRACE_H; 
function volcanoAt(x, y) {
  const [u, v] = toUV(x, y), [vu, vv] = toUV(VOLC.x, VOLC.y);
  const dv = U.dist(x, y, VOLC.x, VOLC.y);
  const cone = dv < 5 ? PLATEAU_H : dv < TERRACE_R0 ? PLATEAU_H - (dv - 5) * 0.42 : terraceTop(0) - terrace((dv - TERRACE_R0) * 0.42);
  const fwd = dv > 0.01 ? (v - vv) / dv : 1;              
  const w = smooth(U.clamp((0.8 - fwd) / 0.35, 0, 1));
  const rise = dv < 5.6 ? 0 : dv < 8.5 ? (dv - 5.6) * 1.6 : 4.64 - (dv - 8.5) * 0.9;
  const crag = dv > 6 ? (U.fbm(x * 0.45, y * 0.45, 41) - 0.5) * 1.6 : 0;
  const ridge = PLATEAU_H + rise + crag;
  return U.lerp(cone, ridge, w);
}
function heightAtPoint(x, y) {
  const [u, v] = toUV(x, y), land = landValue(x, y, u, v);
  if (land <= 0) return Math.max(-2.6, -0.2 + land * 4);
  const ds = U.dist(x, y, SHRINE.x, SHRINE.y);
  let h = 0.12 + Math.min(land, 0.5) * 0.5;
  h += (U.fbm(x * 0.12, y * 0.12, 3) - 0.35) * 0.55 * U.clamp((land - 0.1) * 5, 0, 1);
  h = Math.max(h, volcanoAt(x, y));
  if (U.dist(x, y, CRATER.x, CRATER.y) < 1.8) h = PLATEAU_H - 0.35;
  
  if (ds < 5) h = 0.85; else if (ds < 6.5) h = U.lerp(0.85, h, (ds - 5) / 1.5);
  
  const dp = U.dist(x, y, CORAL.plaza.x, CORAL.plaza.y);
  if (dp < 4.6) h = 0.3; else if (dp < 6) h = U.lerp(0.3, h, (dp - 4.6) / 1.4);
  
  const dg = U.dist(x, y, VERDANT.grove.x, VERDANT.grove.y);
  if (dg < 4.6) h = 0.4; else if (dg < 6) h = U.lerp(0.4, h, (dg - 4.6) / 1.4);
  return h;
}


function distToLine(pts, x, y) {
  let best = Infinity;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = U.clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1);
    best = Math.min(best, U.dist(x, y, ax + dx * t, ay + dy * t));
  }
  return best;
}


export const LATE_PATHS = [VERDANT_PATH];
const distToBaseRoads = (x, y) => Math.min(distToLine(PATH_POINTS, x, y), distToLine(COAST_PATH, x, y), distToLine(CORAL_PATH, x, y));
const distToLate = (x, y) => Math.min(...LATE_PATHS.map((p) => distToLine(p, x, y)));
export const distToRoads = (x, y) => Math.min(distToBaseRoads(x, y), distToLate(x, y));


function tileTypeFor(x, y, base = false) {
  const [u, v] = toUV(x, y), land = landValue(x, y, u, v);
  const dv = U.dist(x, y, VOLC.x, VOLC.y), ds = U.dist(x, y, SHRINE.x, SHRINE.y);
  if (land <= 0) return land < -0.1 ? T.DEEP : T.SHALLOW;
  if (U.dist(x, y, CRATER.x, CRATER.y) < 1.6) return T.LAVA;
  if (dv < 5) return T.PLAZA;
  const sec = sectionAtUV(u, v, base ? BASE_SECTIONS : SECTIONS), road = base ? distToBaseRoads(x, y) : distToRoads(x, y);
  if (!sec) return dv < 18 ? T.CLIFF : T.WOOD;
  if (sec.id === 'kazan') return dv < 5.3 || road < 1.2 ? T.ROCK : T.CLIFF;
  if (sec.id === 'slope') return road < 1.5 ? T.ROCK : T.CLIFF;
  const inset = sec.wall + (U.fbm(x * 0.25, y * 0.25, 5) - 0.5) * 1.6;
  if (edgeDepth(sec.rect, u, v).depth < inset && road > 1.9) return sec.id === 'coral' ? T.CLIFF : T.WOOD; 
  if (sec.id === 'coral') {
    const dp = U.dist(x, y, CORAL.plaza.x, CORAL.plaza.y);
    if (dp < CORAL.plazaR || U.dist(x, y, CORAL.temple.x, CORAL.temple.y) < 2.6) return T.RUIN;
    return dp > CORAL.plazaR + 1.2 && U.fbm(x * 0.2, y * 0.2, 23) > 0.44 ? T.KELP : T.REEF;
  }
  if (sec.id === 'verdant') { 
    const dg = U.dist(x, y, VERDANT.grove.x, VERDANT.grove.y);
    if (dg < VERDANT.groveR) return T.MOSS;
    return dg > VERDANT.groveR + 1.2 && U.fbm(x * 0.2, y * 0.2, 27) > 0.5 ? T.THICKET : T.GLADE;
  }
  if (sec.id === 'jungle') return U.fbm(x * 0.2, y * 0.2, 21) > 0.56 ? T.TALL : T.JUNGLE;
  if (sec.id === 'road') return U.fbm(x * 0.16, y * 0.16, 21) > 0.47 ? T.TALL : T.GRASS;
  if (sec.id === 'coast') return U.dist(u, v, BAY.u, BAY.v) < BAY.r + 4.5 || land < 0.1 ? T.SAND : T.GRASS;
  if (sec.id === 'shrine') return ds < 4.8 ? T.PLAZA : T.GRASS;
  return T.GRASS;
}




export function newMap(N, region, sections) {
  const V = N + 1;
  const W = { N, region, sections, type: new Uint8Array(N * N), vh: new Float32Array(V * V), reach: new Uint8Array(N * N), objects: [], grid: [], spots: [], wildTiles: [] };
  W.idx = (i, j) => j * N + i;
  W.inMap = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  return W;
}

export function floodReach(W, type, spawn) {
  const { N, idx, inMap } = W, reach = new Uint8Array(N * N), q = [[Math.floor(spawn.x), Math.floor(spawn.y)]];
  reach[idx(...q[0])] = 1;
  while (q.length) {
    const [i, j] = q.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (!inMap(a, b) || reach[idx(a, b)] || BLOCKED.has(type[idx(a, b)])) continue;
      reach[idx(a, b)] = 1; q.push([a, b]);
    }
  }
  return reach;
}

export function carvePath(W, type, pts) {
  const { idx, inMap } = W;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
    const steps = Math.ceil(U.dist(ax, ay, bx, by) * 3);
    for (let s = 0; s <= steps; s++) {
      const px = U.lerp(ax, bx, s / steps), py = U.lerp(ay, by, s / steps);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const i = Math.floor(px + di * 0.6), j = Math.floor(py + dj * 0.6);
        if (!inMap(i, j)) continue;
        const t = type[idx(i, j)];
        if (t !== T.PLAZA && t !== T.LAVA && t > T.SAND) type[idx(i, j)] = T.PATH;
      }
    }
  }
}

export function mapQueries(W) {
  const { N, idx, inMap } = W, V = N + 1;
  W.tileType = (x, y) => { const i = Math.floor(x), j = Math.floor(y); return inMap(i, j) ? W.type[idx(i, j)] : T.DEEP; };
  
  W.heightAt = (x, y) => {
    x = U.clamp(x, 0, N - 0.001); y = U.clamp(y, 0, N - 0.001);
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const a = W.vh[j * V + i], b = W.vh[j * V + i + 1], c = W.vh[(j + 1) * V + i], d = W.vh[(j + 1) * V + i + 1];
    return U.lerp(U.lerp(a, b, fx), U.lerp(c, d, fx), fy);
  };
  
  W.groundAt = (x, y) => Math.max(0, W.heightAt(x, y));
  W.sectionAt = (x, y) => { const s = sectionAtUV(...toUV(x, y), W.sections); return s ? s.id : null; };
  W.walkable = (x, y, rad = 0.28) => {
    const i = Math.floor(x), j = Math.floor(y);
    if (!inMap(i, j)) return false;
    if (BLOCKED.has(W.type[idx(i, j)])) return false;
    for (const o of W.grid[idx(i, j)]) if (U.dist(x, y, o.x, o.y) < o.solid + rad) return false;
    return true;
  };
  return W;
}


export const lookIn = (W, wins) => (x, y, pad = 1, padBelow = pad) => {
  const [u, v] = toUV(x, y), s = screenS(v, W.groundAt(x, y)), out = [];
  for (const id in wins) {
    const w = wins[id];
    if (u > w.u[0] - pad && u < w.u[1] + pad && s > w.s[0] - pad && s < w.s[1] + padBelow) out.push(id);
  }
  return out;
};

export function buildGrid(W) {
  W.grid = Array.from({ length: W.N * W.N }, () => []);
  for (const o of W.objects) {
    if (!o.solid) continue;
    for (let j = Math.floor(o.y - o.solid - 1); j <= Math.floor(o.y + o.solid + 1); j++)
      for (let i = Math.floor(o.x - o.solid - 1); i <= Math.floor(o.x + o.solid + 1); i++)
        if (W.inMap(i, j)) W.grid[W.idx(i, j)].push(o);
  }
}

export function generateMap() {
  const N = MAP, V = N + 1;
  const W = newMap(N, 'kazan-isle', SECTIONS);
  const { idx, inMap } = W;

  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) W.vh[j * V + i] = heightAtPoint(i, j);
  const carve = (type, pts) => carvePath(W, type, pts);
  const flood = (type) => floodReach(W, type, SPAWN);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.type[idx(i, j)] = tileTypeFor(i + 0.5, j + 0.5);
  for (const pts of [PATH_POINTS, COAST_PATH, CORAL_PATH, ...LATE_PATHS]) carve(W.type, pts);
  
  
  
  W.baseType = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) W.baseType[idx(i, j)] = tileTypeFor(i + 0.5, j + 0.5, true);
  for (const pts of [PATH_POINTS, COAST_PATH, CORAL_PATH]) carve(W.baseType, pts);

  mapQueries(W);

  
  W.reach = flood(W.type);
  W.baseReach = flood(W.baseType);
  W.windows = sectionWindows(W);
  W.baseWindows = sectionWindows({ N, reach: W.baseReach, groundAt: W.groundAt }, BASE_SECTIONS);
  W.windowsOf = lookIn(W, W.windows);
  W.baseWindowsOf = lookIn(W, W.baseWindows);
  W.onScreen = (x, y, pad = 1, padBelow = pad) => W.windowsOf(x, y, pad, padBelow).length > 0;

  placeObjects(W);
  placeSpots(W);
  
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const t = W.type[idx(i, j)]; if ((t === T.TALL || t === T.KELP || t === T.THICKET) && W.reach[idx(i, j)]) W.wildTiles.push([i + 0.5, j + 0.5]); }
  return W;
}






function placeTerraces(W, r) {
  const V = VOLC;
  for (let k = 0; terraceTop(k) > 0.8; k++) {
    const rr = TERRACE_R0 + (k + 0.72) * TERRACE_RUN, top = terraceTop(k);
    
    for (let a = 0; a < Math.PI * 2; a += 1.45 / rr) {
      const ox = Math.cos(a), oy = Math.sin(a), x = V.x + ox * rr, y = V.y + oy * rr;
      if (!W.inMap(Math.floor(x), Math.floor(y)) || !W.baseWindowsOf(x, y, 1.4, 2.8).length) continue;
      if (Math.abs(W.heightAt(x - ox * 0.5, y - oy * 0.5) - top) > 0.25) continue; 
      const tx = -oy * 0.85, ty = ox * 0.85;
      if (Math.min(distToBaseRoads(x, y), distToBaseRoads(x + tx, y + ty), distToBaseRoads(x - tx, y - ty)) < 1.3) continue;
      addObj(W, { kind: 'ledge', x, y, h: top + 0.02, solid: 0.45, rot: Math.atan2(ox, oy), s: 0.9 + r() * 0.25, v: Math.floor(r() * 3) });
    }
    
    
    const mid = rr + (1 - 0.72) * TERRACE_RUN / 2;
    for (let p = 1; p < PATH_POINTS.length - 1; p++) {
      const [ax, ay] = PATH_POINTS[p], [bx, by] = PATH_POINTS[p + 1], da = U.dist(ax, ay, V.x, V.y), db = U.dist(bx, by, V.x, V.y);
      if ((da - mid) * (db - mid) > 0) continue;
      const f = (mid - da) / (db - da), cx = U.lerp(ax, bx, f), cy = U.lerp(ay, by, f), cd = U.dist(cx, cy, V.x, V.y);
      const ox = (cx - V.x) / cd, oy = (cy - V.y) / cd;
      for (let d = rr - 0.25; d <= TERRACE_R0 + (k + 1) * TERRACE_RUN + 0.2; d += 0.34)
        addObj(W, { kind: 'step', x: V.x + ox * d, y: V.y + oy * d, solid: 0, rot: Math.atan2(ox, oy), i: W.objects.length });
    }
  }
}

export function addObj(W, o) {
  o.id = W.objects.length;
  o.secs = W.windowsOf(o.x, o.y, 1.4, 2.8);
  if (!o.secs.length) o.secs = [nearestSection(o.x, o.y, W.sections).section.id];
  W.objects.push(o);
}

const faceTo = (x, y, cx, cy) => Math.atan2(cx - x, cy - y);
const polar = (c, a, d) => [c.x + Math.cos(a) * d, c.y + Math.sin(a) * d];
const DEG = Math.PI / 180;





const KAZAN_HUTS = [290, 330, 10, 120, 160];
const KAZAN_SPRING = [0.57, 3.25];
const KAZAN_TORCHES = [[1.88, 4.2], [3.42, 3.08], [0.71, -1.4], [-2.3, 0]];
export const RIM = { r: 5.3, gap: 1.2, step: 0.55 };
export const CRATER_FENCE = 2.05;

function placeKazan(W, r) {
  const V = VOLC, roofs = ['#d8a24a', '#c98a3e', '#e0b460', '#c49040', '#d89a52'];
  const hub = [V.x + 0.6, V.y + 1.5];
  const spokes = [];
  KAZAN_HUTS.forEach((deg, i) => {
    const [x, y] = polar(V, deg * DEG, 3.6);
    r();
    const rot = faceTo(x, y, V.x, V.y);
    addObj(W, { kind: 'hut', x, y, solid: 0.9, roof: roofs[i], rot, s: 0.9 });
    const door = [x + Math.sin(rot) * 1.05, y + Math.cos(rot) * 1.05];
    spokes.push({ pts: [hub, [U.lerp(hub[0], door[0], 0.55) + Math.cos(rot) * 0.25, U.lerp(hub[1], door[1], 0.55) - Math.sin(rot) * 0.25], door], half: 0.34 });
    
    if (i % 2 === 0) {
      const a = rot + 0.9;
      addObj(W, { kind: 'bed', x: x + Math.sin(a) * 1.35, y: y + Math.cos(a) * 1.35, solid: 0.45, rot, seed: i });
    }
  });
  const [sx, sy] = [V.x + KAZAN_SPRING[0], V.y + KAZAN_SPRING[1]];
  addObj(W, { kind: 'spring', x: sx, y: sy, solid: 0.8, heal: true });
  spokes.push({ pts: [hub, [sx + 0.2, sy - 0.9]], half: 0.3 });
  KAZAN_TORCHES.forEach(([dx, dy]) => addObj(W, { kind: 'torch', x: V.x + dx, y: V.y + dy, solid: 0.15 }));

  
  const [ax, ay] = PATH_POINTS[0], [bx, by] = PATH_POINTS[1];
  const L = U.dist(ax, ay, bx, by), dx = (bx - ax) / L, dy = (by - ay) / L;
  const offAxis = (x, y) => Math.abs((x - ax) * dy - (y - ay) * dx);
  const steps = [];
  for (let t = 0; t < L + 3; t += 0.5) {
    const x = ax + dx * t, y = ay + dy * t, dv = U.dist(x, y, V.x, V.y);
    if (dv < 5.0 || dv > 8.6) continue;
    steps.push({ x, y });
  }
  steps.forEach((s, i) => addObj(W, { kind: 'step', x: s.x, y: s.y, solid: 0, rot: Math.atan2(dx, dy), i, last: i === steps.length - 1 }));
  spokes.push({ pts: [[ax, ay], hub], half: 0.5 });
  
  for (const t of [0.2, 0.55]) for (const side of [-1, 1]) {
    const s = steps[Math.floor(t * (steps.length - 1))];
    addObj(W, { kind: 'rimstone', x: s.x - dy * side * 1.35, y: s.y + dx * side * 1.35, solid: 0.35, s: 1.25, rot: r() * 6.28, v: Math.floor(r() * 4) });
  }
  
  const n = Math.round(2 * Math.PI * RIM.r / RIM.step);
  for (let k = 0; k < n; k++) {
    const a = k / n * 2 * Math.PI, [x, y] = polar(V, a, RIM.r + (r() - 0.5) * 0.12);
    const s = 0.85 + r() * 0.35, rot = r() * 6.28, v = Math.floor(r() * 4);
    if (offAxis(x, y) < RIM.gap && (x - ax) * dx + (y - ay) * dy > 0) continue;
    addObj(W, { kind: 'rimstone', x, y, solid: 0.33, s, rot, v });
  }
  
  const fn = Math.round(2 * Math.PI * CRATER_FENCE / 0.5);
  for (let k = 0; k < fn; k++) {
    const [x, y] = polar(CRATER, k / fn * 2 * Math.PI, CRATER_FENCE);
    addObj(W, { kind: 'fence', x, y, solid: 0.2, ring: 'crater', k, n: fn });
  }
  return spokes;
}



function placeShrine(W, r) {
  const S = SHRINE;
  addObj(W, { kind: 'temple', x: S.x - 0.4, y: S.y - 2.4, solid: 1.9, rot: Math.PI / 4 });
  const paths = [];
  [[-3.2, 1.2], [2.4, 2.8], [3.2, -1.2]].forEach(([dx, dy], i) => {
    const x = S.x + dx, y = S.y + dy; r();
    const rot = faceTo(x, y, S.x, S.y + 0.8);
    addObj(W, { kind: 'hut', x, y, solid: 0.9, roof: ['#8a5ac8', '#5a8ac8', '#c85a8a'][i], rot, s: 0.9 });
    paths.push({ pts: [[S.x, S.y + 0.8], [x + Math.sin(rot) * 1.05, y + Math.cos(rot) * 1.05]], half: 0.32 });
  });
  addObj(W, { kind: 'spring', x: S.x + 0.2, y: S.y + 2.6, solid: 0.8, heal: true });
  [[-1.4, 0.2], [1.4, 0.2], [-1.2, 3.8], [1.8, 4.2]].forEach(([dx, dy]) => addObj(W, { kind: 'torch', x: S.x + dx, y: S.y + dy, solid: 0.15 }));
  
  const k = PATH_POINTS.length;
  {
    const [ax, ay] = PATH_POINTS[k - 4], [bx, by] = PATH_POINTS[k - 3], L = U.dist(ax, ay, bx, by);
    addObj(W, { kind: 'gate', x: U.lerp(ax, bx, 0.82), y: U.lerp(ay, by, 0.82), solid: 0, rot: Math.atan2((bx - ax) / L, (by - ay) / L) });
  }
  for (const t of [0.25, 0.75]) {
    const [ax, ay] = PATH_POINTS[k - 3], [bx, by] = PATH_POINTS[k - 2];
    const L = U.dist(ax, ay, bx, by), dx = (bx - ax) / L, dy = (by - ay) / L, x = U.lerp(ax, bx, t), y = U.lerp(ay, by, t);
    for (const side of [-1, 1]) addObj(W, { kind: 'lantern', x: x - dy * side * 1.25, y: y + dx * side * 1.25, solid: 0.25, rot: Math.atan2(dx, dy) });
  }
  return paths;
}





function shadesKid(W, x, y, reach = W.reach) {
  const reachAt = (a, b) => { const i = Math.floor(a), j = Math.floor(b); return W.inMap(i, j) && reach[W.idx(i, j)] === 1; };
  for (let back = 1.0; back <= 2.2; back += 0.4) for (const side of [-0.4, 0, 0.4]) {
    const [u, v] = toUV(x, y), [bx, by] = fromUV(u + side, v - back);
    if (reachAt(bx, by)) return true;
  }
  return false;
}

function lateGround(W, x, y) {
  const i = Math.floor(x), j = Math.floor(y), k = W.idx(i, j);
  return W.type[k] !== W.baseType[k] || distToLate(x, y) < 1.1 || (nearestSection(x, y).section.chapter || 0) >= 3;
}

const coralGrown = (x, y) => { const [u, v] = toUV(x, y); return u > 26 && v > 83; };
function placeGrowth(W, r) {
  const N = W.N, V = VOLC, S = SHRINE;
  const shades = (x, y) => shadesKid(W, x, y, W.baseReach); 
  
  
  
  const put = (o) => { if (!lateGround(W, o.x, o.y) && !coralGrown(o.x, o.y)) addObj(W, o); };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = W.baseType[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28;
    if (!W.baseWindowsOf(x, y, 1.2, 2.6).length) continue;
    const near = nearestSection(x, y, BASE_SECTIONS).section.id;
    if (near === 'coral') continue; 
    if (t === T.WOOD) {
      if (shades(x, y)) { if (k < 0.75) put({ kind: 'bush', x, y, solid: 0, s: 0.8 + s * 0.5, rot, flavor: near }); continue; }
      if (near === 'coast') { if (k < 0.45) put({ kind: 'palm', x, y, solid: 0, s: 0.9 + s * 0.4, rot }); else if (k < 0.8) put({ kind: 'bush', x, y, solid: 0, s: 0.9 + s * 0.4, rot, flavor: near }); continue; }
      const kind = near === 'jungle' ? 'jtree' : near === 'shrine' ? 'blossom' : 'tree';
      if (k < 0.62) put({ kind, x, y, solid: 0, s: 0.95 + s * 0.45, rot });
      else if (k < 0.9) put({ kind: 'bush', x, y, solid: 0, s: 0.9 + s * 0.5, rot, flavor: near });
      continue;
    }
    if (t === T.CLIFF) {
      if (k < 0.42) put({ kind: 'crag', x, y, solid: 0, s: 1.3 + s * 1.3, rot, v: Math.floor(r() * 4) });
      continue;
    }
    
    if (U.dist(x, y, V.x, V.y) < 6 || U.dist(x, y, S.x, S.y) < 6.5 || U.dist(x, y, AMBUSH.x, AMBUSH.y) < 3) continue;
    const road = distToBaseRoads(x, y);
    if (t === T.SAND && k < 0.05 && road > 1.5) put({ kind: 'palm', x, y, solid: 0.25, s: 0.9 + s * 0.35, rot });
    else if (t === T.SAND && k < 0.075 && road > 1) put({ kind: 'rock', x, y, solid: 0.3, s: 0.5 + s * 0.5, rot });
    else if (t === T.JUNGLE && k < 0.025 && road > 2) put({ kind: 'jtree', x, y, solid: 0.45, s: 0.9 + s * 0.3, rot });
    else if ((t === T.JUNGLE || t === T.TALL && W.sectionAt(x, y) === 'jungle') && k < 0.3 && road > 1.1) put({ kind: 'fern', x, y, solid: 0, s: 0.8 + s * 0.6, rot });
    else if (t === T.GRASS && k < 0.025 && road > 2) put({ kind: W.sectionAt(x, y) === 'shrine' ? 'blossom' : 'tree', x, y, solid: 0.35, s: 0.8 + s * 0.35, rot });
    else if (t === T.ROCK && k < 0.06) put({ kind: 'rock', x, y, solid: 0.35, s: 0.7 + s * 0.7, rot, dark: true });
    else if (t === T.GRASS && k < 0.045 && road > 1) put({ kind: 'rock', x, y, solid: 0.3, s: 0.5 + s * 0.4, rot });
    else if ((t === T.GRASS || t === T.TALL) && k < 0.13) put({ kind: 'flower', x, y, solid: 0, c: U.pick(r, ['#fff7a8', '#ff9fd0', '#ffffff', '#b9a0ff']) });
  }
}



const CORAL_COLORS = ['#ff7a8a', '#ff9a5a', '#c78cff', '#ffc2d8', '#5fe0d0'];
function placeCoral(W) {
  const r = U.rng(2215), C = CORAL, P = C.plaza;
  const inCoral = (x, y) => nearestSection(x, y).section.id === 'coral' || coralGrown(x, y);
  
  {
    const [ax, ay] = CORAL_PATH[2], [bx, by] = CORAL_PATH[3], L = U.dist(ax, ay, bx, by), dx = (bx - ax) / L, dy = (by - ay) / L;
    addObj(W, { kind: 'gate', x: U.lerp(ax, bx, 0.2), y: U.lerp(ay, by, 0.2), solid: 0, rot: Math.atan2(dx, dy), flavor: 'coral' });
    const x = U.lerp(ax, bx, 0.62), y = U.lerp(ay, by, 0.62);
    for (const side of [-1, 1]) addObj(W, { kind: 'lantern', x: x - dy * side * 1.25, y: y + dx * side * 1.25, solid: 0.25, rot: Math.atan2(dx, dy), flavor: 'coral' });
  }
  
  addObj(W, { kind: 'temple', x: C.temple.x, y: C.temple.y, solid: 1.9, rot: Math.PI / 4, flavor: 'coral' });
  for (let k = 0; k < 11; k++) {
    const a = k / 11 * Math.PI * 2 + 0.2, x = P.x + Math.cos(a) * (C.plazaR + 0.35), y = P.y + Math.sin(a) * (C.plazaR + 0.35);
    if (distToRoads(x, y) < 1.5 || U.dist(x, y, C.temple.x, C.temple.y) < 2.6 || BLOCKED.has(W.tileType(x, y))) continue;
    addObj(W, { kind: 'pillar', x, y, solid: 0.3, rot: r() * 6.28, v: k % 3, s: 0.9 + r() * 0.2 });
    if (r() < 0.5) addObj(W, { kind: 'rimstone', x: x + (r() - 0.5) * 1.2, y: y + (r() - 0.5) * 1.2, solid: 0, s: 0.45 + r() * 0.3, rot: r() * 6.28, v: Math.floor(r() * 4), flavor: 'coral' });
  }
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28, c = CORAL_COLORS[Math.floor(r() * CORAL_COLORS.length)];
    if (!inCoral(x, y) || !W.onScreen(x, y, 1.2, 2.6)) continue;
    if (t === T.WOOD || t === T.CLIFF) { 
      if (shadesKid(W, x, y)) { if (k < 0.7) addObj(W, { kind: 'coral', x, y, solid: 0, s: 0.8 + s * 0.4, rot, c }); continue; }
      if (k < 0.45) addObj(W, { kind: 'crag', x, y, solid: 0, s: 1.2 + s * 1.2, rot, v: Math.floor(s * 4), flavor: 'coral' });
      else if (k < 0.85) addObj(W, { kind: 'coral', x, y, solid: 0, s: 1.3 + s * 0.8, rot, c });
      continue;
    }
    const road = distToRoads(x, y);
    if (t === T.RUIN || road < 1.1 || U.dist(x, y, P.x, P.y) < C.plazaR + 1) continue;
    if (t === T.REEF && k < 0.06) addObj(W, { kind: 'coral', x, y, solid: 0.3, s: 0.7 + s * 0.4, rot, c });
    else if (t === T.REEF && k < 0.085) addObj(W, { kind: 'rock', x, y, solid: 0.3, s: 0.5 + s * 0.4, rot, flavor: 'coral' });
    else if (t === T.KELP && k < 0.28) addObj(W, { kind: 'fern', x, y, solid: 0, s: 0.9 + s * 0.7, rot, flavor: 'kelp' });
  }
}





const VERDANT_FLOWERS = ['#ffe45a', '#ff8ac8', '#ffffff', '#c9a0ff', '#ff9a5a'];
function placeVerdant(W) {
  const r = U.rng(3316), V = VERDANT, P = V.grove;
  const add = (o) => { o.region = 'verdant'; addObj(W, o); }; 
  
  const mine = (x, y) => (nearestSection(x, y).section.id === 'verdant' || lateGround(W, x, y) || !W.baseWindowsOf(x, y, 1.2, 2.6).length) &&
    nearestSection(x, y).section.id !== 'coral' && !coralGrown(x, y); 
  
  
  {
    const n = VERDANT_PATH.length, [ax, ay] = VERDANT_PATH[n - 2], [bx, by] = VERDANT_PATH[n - 1], L = U.dist(ax, ay, bx, by), dx = (bx - ax) / L, dy = (by - ay) / L;
    for (const t of [0.3, 0.8]) for (const side of [-1, 1]) add({ kind: 'lantern', x: U.lerp(ax, bx, t) - dy * side * 1.25, y: U.lerp(ay, by, t) + dx * side * 1.25, solid: 0.25, rot: Math.atan2(dx, dy), flavor: 'moss' });
  }
  
  
  { const [lx, ly] = fromUV(-17.6, 60.1); add({ kind: 'ladder', x: lx, y: ly, solid: 0, rot: Math.atan2(...(([ax, ay], [bx, by]) => [bx - ax, by - ay])(fromUV(0, 0), fromUV(0, -1))) }); }
  
  add({ kind: 'jtree', x: V.tree.x, y: V.tree.y, solid: 0.9, s: 1.75, rot: 0.6, flavor: 'verdant' });
  
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2 + 0.1, x = P.x + Math.cos(a) * (V.groveR + 0.4), y = P.y + Math.sin(a) * (V.groveR + 0.4);
    if (distToRoads(x, y) < 1.5 || U.dist(x, y, V.tree.x, V.tree.y) < 1.8 || BLOCKED.has(W.tileType(x, y))) continue;
    add({ kind: 'pillar', x, y, solid: 0.3, rot: r() * 6.28, v: k % 3, s: 0.9 + r() * 0.2, flavor: 'moss' });
    if (r() < 0.45) add({ kind: 'bramble', x: x + (r() - 0.5) * 0.9, y: y + (r() - 0.5) * 0.9, solid: 0, s: 0.6 + r() * 0.25, rot: r() * 6.28 });
    else if (r() < 0.5) add({ kind: 'rimstone', x: x + (r() - 0.5) * 1.2, y: y + (r() - 0.5) * 1.2, solid: 0, s: 0.45 + r() * 0.3, rot: r() * 6.28, v: Math.floor(r() * 4), flavor: 'moss' });
  }
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    const t = W.type[W.idx(i, j)];
    const x = i + 0.25 + r() * 0.5, y = j + 0.25 + r() * 0.5, k = r(), s = r(), rot = r() * 6.28, c = VERDANT_FLOWERS[Math.floor(r() * VERDANT_FLOWERS.length)];
    if (!W.onScreen(x, y, 1.2, 2.6) || !mine(x, y)) continue;
    if (U.dist(x, y, V.tree.x, V.tree.y) < 2.2) continue; 
    if (t === T.WOOD || t === T.CLIFF) { 
      if (shadesKid(W, x, y)) { if (k < 0.45) add({ kind: 'bush', x, y, solid: 0, s: 0.8 + s * 0.5, rot, flavor: 'verdant' }); else if (k < 0.75) add({ kind: 'bramble', x, y, solid: 0, s: 0.8 + s * 0.4, rot }); continue; }
      if (k < 0.3) add({ kind: 'jtree', x, y, solid: 0, s: 1.1 + s * 0.5, rot, flavor: 'verdant' });
      else if (k < 0.5) add({ kind: 'bramble', x, y, solid: 0, s: 1.1 + s * 0.5, rot });
      else if (k < 0.7) add({ kind: 'bush', x, y, solid: 0, s: 1 + s * 0.5, rot, flavor: 'verdant' }); 
      continue;
    }
    const road = distToRoads(x, y);
    if (t === T.MOSS || road < 1.1 || U.dist(x, y, P.x, P.y) < V.groveR + 1) continue;
    if (t === T.GLADE && k < 0.035 && road > 2) add({ kind: 'jtree', x, y, solid: 0.45, s: 1 + s * 0.35, rot, flavor: 'verdant' });
    else if (t === T.GLADE && k < 0.06 && road > 1.4) add({ kind: 'rock', x, y, solid: 0.3, s: 0.5 + s * 0.5, rot, flavor: 'moss' });
    else if (t === T.THICKET && k < 0.16) add({ kind: 'bramble', x, y, solid: 0, s: 0.55 + s * 0.35, rot });
    else if (k < 0.3) add({ kind: 'fern', x, y, solid: 0, s: 0.9 + s * 0.7, rot, flavor: 'verdant' });
    else if (k < (t === T.GLADE ? 0.55 : 0.38)) add({ kind: 'flower', x, y, solid: 0, c });
  }
}

function placeObjects(W) {
  const r = U.rng(4242), N = W.N;
  const kazanPaths = placeKazan(W, r);
  const shrinePaths = placeShrine(W, r);
  
  W.paths = [{ pts: PATH_POINTS.map(p => [...p]), half: 0.75 }, { pts: COAST_PATH.map(p => [...p]), half: 0.6 }, { pts: CORAL_PATH.map(p => [...p]), half: 0.6 }, { pts: VERDANT_PATH.map(p => [...p]), half: 0.6 }, ...kazanPaths, ...shrinePaths];
  AMBUSH.rocks.forEach(([x, y], i) => addObj(W, { kind: 'rock', x, y, solid: 0.35, s: 1.2 + i * 0.25, rot: i * 2 }));
  
  
  for (let k = 1; k < PATH_POINTS.length - 1; k++) {
    const [ax, ay] = PATH_POINTS[k], [bx, by] = PATH_POINTS[k + 1], L = U.dist(ax, ay, bx, by), dx = (bx - ax) / L, dy = (by - ay) / L;
    for (let t = 0.3; t < L; t += 0.62) for (const side of [-1, 1]) {
      const x = ax + dx * t - dy * side * 1.05, y = ay + dy * t + dx * side * 1.05;
      if (W.sectionAt(x, y) !== 'slope' || distToRoads(x, y) < 0.98) continue;
      addObj(W, { kind: 'rimstone', x, y, solid: 0.25, s: 0.62 + r() * 0.25, rot: r() * 6.28, v: Math.floor(r() * 4) });
    }
  }
  placeTerraces(W, r);
  placeGrowth(W, r);
  placeCoral(W);
  placeVerdant(W);
  buildGrid(W);
}


export const SPOT_ITEMS = [['tonic', 0.5], ['candy', 0.3], ['seal', 0.2]];
function placeSpots(W) {
  const r = U.rng(555);
  let tries = 0;
  while (W.spots.length < 40 && tries++ < 12000) {
    const x = 2 + r() * (W.N - 4), y = 2 + r() * (W.N - 4);
    if (!W.baseReach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue; 
    if (U.dist(x, y, VOLC.x, VOLC.y) < 5.5 || U.dist(x, y, SHRINE.x, SHRINE.y) < 5.5) continue;
    if (W.spots.some(s => U.dist(s.x, s.y, x, y) < 3.4)) continue;
    let k = r(), item = 'tonic';
    for (const [name, p] of SPOT_ITEMS) { if (k < p) { item = name; break; } k -= p; }
    W.spots.push({ id: 's' + W.spots.length, x, y, item });
  }
  
  for (const sec of SECTIONS.filter((q) => q.chapter >= 3)) {
    const rs = U.rng(7000 + SECTIONS.indexOf(sec)), [u0, u1] = sec.rect.u, [v0, v1] = sec.rect.v;
    let n = 0;
    for (let t = 0; n < LATE_SPOTS && t < 3000; t++) {
      const [x, y] = fromUV(u0 + rs() * (u1 - u0), v0 + rs() * (v1 - v0)), k = rs();
      if (!W.inMap(Math.floor(x), Math.floor(y)) || !W.reach[W.idx(Math.floor(x), Math.floor(y))] || !W.walkable(x, y, 0.4)) continue;
      if (W.spots.some(s => U.dist(s.x, s.y, x, y) < 3.4)) continue;
      W.spots.push({ id: 's' + W.spots.length, x, y, item: k < 0.45 ? 'tonic' : k < 0.75 ? 'candy' : 'seal' });
      n++;
    }
  }
}
const LATE_SPOTS = 5;

export function locationName(W, x, y, region = 'Kazan Isle') {
  const id = W.sectionAt(x, y);
  return id ? sectionById(id).name : region; 
}





export const NPC_CLEAR = { body: 0.45, crater: CRATER_FENCE + 0.45, rimIn: RIM.r - 0.75 };
export function npcSpotOk(W, x, y, rad = NPC_CLEAR.body) {
  if (W.npcOk) return W.npcOk(x, y, rad); 
  if (!W.walkable(x, y, rad)) return false;
  if (U.dist(x, y, CRATER.x, CRATER.y) < NPC_CLEAR.crater - (NPC_CLEAR.body - rad)) return false;
  const dv = U.dist(x, y, VOLC.x, VOLC.y);
  if (dv < RIM.r + 1 && dv > NPC_CLEAR.rimIn) return false;
  return true;
}


export function pickNpcSpot(W, r, home, maxR, minR = 0.6, avoid = [], gap = 1.1) {
  for (let k = 0; k < 60; k++) {
    const a = r() * Math.PI * 2, d = minR + r() * (maxR - minR);
    const x = home.x + Math.cos(a) * d, y = home.y + Math.sin(a) * d;
    if (npcSpotOk(W, x, y) && avoid.every((o) => U.dist(x, y, o.x, o.y) >= gap)) return { x, y };
  }
  return null;
}




export function npcStepClear(x, y, nx, ny, avoid, gap = 0.75) {
  return avoid.every((o) => { const d1 = U.dist(nx, ny, o.x, o.y); return d1 >= gap || d1 >= U.dist(x, y, o.x, o.y); });
}

export const NPC_POSTS = {
  elder: { x: VOLC.x - 0.3, y: VOLC.y + 0.2 },
  kumabo: { x: VOLC.x + 0.9, y: VOLC.y + 0.9 },
  
  priest: { x: SHRINE.x - 0.3, y: SHRINE.y + 0.1 },
  acolytes: [{ x: SHRINE.x - 1.5, y: SHRINE.y + 0.9 }, { x: SHRINE.x + 1.1, y: SHRINE.y + 0.9 }],
};

export const NPC_HOMES = { kazan: { x: VOLC.x + 0.3, y: VOLC.y + 0.9, r: 3.6 }, shrine: { x: SHRINE.x, y: SHRINE.y + 1.5, r: 2.6 } };
