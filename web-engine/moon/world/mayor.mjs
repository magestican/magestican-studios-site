























import { PATHS, PATH_HALF_WIDTH, PLAZA, pathDistance } from './moonLayout.mjs';
import { WALK_EDGE_M, homeDoor, penetration } from './collision.mjs';
import { SPAWN } from '../play/spawn.mjs';

export const MAYOR = Object.freeze({
  
  squarePadM: 1.0,
  
  standingPadM: 1.0,
  
  landing: Object.freeze({ x: SPAWN.x, z: SPAWN.z, r: 3.0 }),
  
  
  
  minPathM: 1.5,
  maxPathM: 24,
  sampleM: 0.25,
  
  
  pathClearM: 0.55,
  maxLaid: 32,
  
  
  
  
  
  
  maxLights: 24,
  
  lampClearM: 0.6,
  lampRadiusM: 0.25,
  
  edgeM: 1.5,
});

const isNum = Number.isFinite;
const pt = (p) => Array.isArray(p) && p.length === 2 && isNum(p[0]) && isNum(p[1]);
const round3 = (v) => Math.round(v * 1000) / 1000;


export function pathsOf(world) {
  const raw = world && Array.isArray(world.paths) ? world.paths : [];
  return raw
    .filter((p) => p && Number.isInteger(p.id) && (p.kind === 'laid' || p.kind === 'spur') && Array.isArray(p.pts) && p.pts.length >= 2 && p.pts.every(pt))
    .map((p) => (p.kind === 'spur' ? { id: p.id, kind: 'spur', home: p.home, pts: p.pts.map((q) => [q[0], q[1]]) } : { id: p.id, kind: 'laid', pts: p.pts.map((q) => [q[0], q[1]]) }));
}


export function lightsOf(world) {
  const raw = world && Array.isArray(world.lights) ? world.lights : [];
  return raw.filter((l) => l && Number.isInteger(l.id) && isNum(l.x) && isNum(l.z)).map((l) => ({ id: l.id, x: l.x, z: l.z }));
}


export function clearedOf(world) {
  const raw = world && Array.isArray(world.cleared) ? world.cleared : [];
  return [...new Set(raw.filter((s) => typeof s === 'string' && s.length > 0))];
}


export const layoutLampId = (p) => `lamp@${p.x.toFixed(2)},${p.z.toFixed(2)}`;


export const pathLines = (world) => pathsOf(world).map((p) => p.pts);

export const nextId = (list) => list.reduce((m, e) => Math.max(m, e.id), 0) + 1;







export function mayorExclusion(x, z, { pad = 0, pathDist = pathDistance, cfg = MAYOR } = {}) {
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.radius + cfg.squarePadM + pad) return 'The town square stays as the town built it.';
  if (Math.hypot(x - cfg.landing.x, z - cfg.landing.z) < cfg.landing.r + pad) return 'The landing spot stays clear for the ship.';
  if (pathDist(x, z) < PATH_HALF_WIDTH + pad) return 'Paths stay level - shape the ground beside them.';
  return null;
}


export const mayorShaping = (opts = {}) => Object.freeze({ exclude: (x, z, pad = 0) => mayorExclusion(x, z, { ...opts, pad }) });



const nameOf = (ob) => (ob && ob.module ? String(ob.module).split('/').pop().replace(/([A-Z])/g, ' $1').toLowerCase() : 'something');





export function whyNotPath(a, b, { obstacles = [], world = null, cfg = MAYOR } = {}) {
  if (!pt(a) || !pt(b)) return 'Choose where the path starts and ends.';
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < cfg.minPathM) return 'That is too short for a path - pick an end further off.';
  if (len > cfg.maxPathM) return `One stretch at a time - a path runs at most ${cfg.maxPathM} m.`;
  if (pathsOf(world).filter((p) => p.kind === 'laid').length >= cfg.maxLaid) return 'The town has all the paths it can keep up - erase one first.';
  const n = Math.ceil(len / cfg.sampleM);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    if (Math.hypot(x, z) > WALK_EDGE_M - cfg.edgeM) return 'That runs off the edge of the moon.';
    for (const ob of obstacles) {
      const dx = x - ob.x, dz = z - ob.z, reach = (ob.reach || 0) + cfg.pathClearM;
      if (dx * dx + dz * dz >= reach * reach) continue;
      if (penetration(ob, x, z, cfg.pathClearM).depth > 0) return `That would run through the ${nameOf(ob)} - go round it.`;
    }
  }
  return null;
}


export function whyNotErase(world, id, { nameOfHome = (h) => `villager ${h}` } = {}) {
  const p = pathsOf(world).find((q) => q.id === id);
  if (!p) return 'There is no path of yours there.';
  if (p.kind === 'spur') return `${nameOfHome(p.home)}'s home would be cut off - that path stays.`;
  return null;
}


export function pathNear(world, x, z, reachM = PATH_HALF_WIDTH + 0.5) {
  let best = null;
  for (const p of pathsOf(world)) {
    for (let i = 0; i < p.pts.length - 1; i++) {
      const d = segDistance(x, z, p.pts[i], p.pts[i + 1]);
      if (d <= reachM && (!best || d < best.d)) best = { d, path: p };
    }
  }
  return best ? best.path : null;
}

function nearestOnSeg(x, z, a, b) {
  const vx = b[0] - a[0], vz = b[1] - a[1];
  const l2 = vx * vx + vz * vz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / l2)) : 0;
  return [a[0] + vx * t, a[1] + vz * t];
}
const segDistance = (x, z, a, b) => { const q = nearestOnSeg(x, z, a, b); return Math.hypot(x - q[0], z - q[1]); };


export function nearestLayoutPoint(x, z, lines = PATHS) {
  let best = null, bd = Infinity;
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const q = nearestOnSeg(x, z, line[i], line[i + 1]);
      const d = Math.hypot(x - q[0], z - q[1]);
      if (d < bd) { bd = d; best = q; }
    }
  }
  return best;
}





export function homeSpur(home) {
  if (!home || !isNum(home.x) || !isNum(home.z)) return null;
  const door = homeDoor(home);
  const end = nearestLayoutPoint(door.x, door.z);
  if (!end || Math.hypot(end[0] - door.x, end[1] - door.z) <= PATH_HALF_WIDTH + 1.0) return null;
  return [[round3(door.x), round3(door.z)], [round3(end[0]), round3(end[1])]];
}






export function withSpurs(paths, homes) {
  const out = paths.map((p) => ({ ...p, pts: p.pts.map((q) => [q[0], q[1]]) }));
  const have = new Set(out.filter((p) => p.kind === 'spur').map((p) => String(p.home)));
  const ids = Object.keys(homes || {}).sort((a, b) => Number(a) - Number(b));
  for (const id of ids) {
    if (have.has(String(id))) continue;
    const pts = homeSpur(homes[id]);
    if (!pts) continue;
    out.push({ id: nextId(out), kind: 'spur', home: Number.isInteger(Number(id)) ? Number(id) : id, pts });
  }
  return out;
}







export function whyNotLight(x, z, { obstacles = [], world = null, pathDist = pathDistance, cfg = MAYOR } = {}) {
  if (!isNum(x) || !isNum(z)) return 'There is no ground there.';
  if (lightsOf(world).length >= cfg.maxLights) return `The town keeps ${cfg.maxLights} lamps of yours at most - take one away first.`;
  if (Math.hypot(x, z) > WALK_EDGE_M - cfg.edgeM) return 'That is too near the edge of the moon.';
  if (pathDist(x, z) < PATH_HALF_WIDTH + cfg.lampRadiusM) return 'A lamp stands beside the path, not on it.';
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < 2.6) return 'The fountain needs its room.';
  for (const ob of obstacles) {
    const dx = x - ob.x, dz = z - ob.z, reach = (ob.reach || 0) + cfg.lampClearM;
    if (dx * dx + dz * dz >= reach * reach) continue;
    if (penetration(ob, x, z, cfg.lampClearM).depth > 0) return `There is a ${nameOf(ob)} in the way.`;
  }
  return null;
}


export function lampNear(world, layoutLamps, x, z, reachM = 1.6) {
  const gone = new Set(clearedOf(world));
  let best = null;
  for (const l of lightsOf(world)) {
    const d = Math.hypot(l.x - x, l.z - z);
    if (d <= reachM && (!best || d < best.d)) best = { d, own: l.id, x: l.x, z: l.z };
  }
  for (const p of layoutLamps) {
    const id = layoutLampId(p);
    if (gone.has(id)) continue;
    const d = Math.hypot(p.x - x, p.z - z);
    if (d <= reachM && (!best || d < best.d)) best = { d, layout: id, x: p.x, z: p.z };
  }
  return best;
}
