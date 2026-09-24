





























































import { PARCELS, outlineDistance, parcelAt, ownedIds } from './parcels.mjs';
import { heightAt } from './moonLayout.mjs';
import { PLAYER_RADIUS_M } from './collision.mjs';

export const TERRAFORM = Object.freeze({
  
  
  
  stepM: 1,
  
  riseM: 0.25,
  
  
  
  maxRiseM: 2,
  maxLowerM: 1.5,
  
  
  
  brushM: 2.2,
  
  
  keepM: 0.6,
  
  
  clearM: 0.35,
  
  
  pondDepthM: 0.85,
  pondRimM: 0.14,
  
  
  
  
  
  
  
  
  
  
  pondMinM: 0.9,
  pondMaxM: 1.7,
  
  
  
  minFall: 0.35,
});






export const REACH_M = TERRAFORM.stepM * Math.SQRT2;


export const POND_GAP_M = PLAYER_RADIUS_M * 4 + 0.2;

export const BRUSHES = Object.freeze(['raise', 'lower', 'pond']);
export const BRUSH_NAMES = Object.freeze({ raise: 'Raise', lower: 'Lower', pond: 'Pond' });

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);


export const nodeKey = (ix, iz) => `${ix},${iz}`;


export function nodeOf(key) {
  if (typeof key !== 'string') return null;
  const bits = key.split(',');
  if (bits.length !== 2) return null;
  const ix = Number(bits[0]), iz = Number(bits[1]);
  if (!Number.isInteger(ix) || !Number.isInteger(iz)) return null;
  return [ix, iz];
}


export const nodeAt = (ix, iz, cfg = TERRAFORM) => ({ x: ix * cfg.stepM, z: iz * cfg.stepM });











export const newParcelTerrain = () => ({ cells: {}, ponds: [] });


export function terrainOf(world) {
  const raw = world && typeof world.terrain === 'object' && world.terrain ? world.terrain : {};
  const out = {};
  for (const id of Object.keys(raw)) {
    const rec = raw[id] && typeof raw[id] === 'object' ? raw[id] : {};
    const cells = {};
    const from = rec.cells && typeof rec.cells === 'object' ? rec.cells : {};
    for (const key of Object.keys(from)) {
      const cm = Math.round(Number(from[key]));
      if (nodeOf(key) && Number.isFinite(cm) && cm !== 0) cells[key] = cm;
    }
    const ponds = (Array.isArray(rec.ponds) ? rec.ponds : [])
      .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.z) && Number.isFinite(p.r) && Number.isFinite(p.y))
      .map((p) => ({ x: p.x, z: p.z, r: p.r, y: p.y }));
    out[id] = { cells, ponds };
  }
  return out;
}


export function pondsOf(terrain) {
  const out = [];
  for (const id of Object.keys(terrain)) for (const p of terrain[id].ponds) out.push({ ...p, parcel: Number(id) });
  return out;
}


export const nodeCount = (terrain) => Object.keys(terrain).reduce((n, id) => n + Object.keys(terrain[id].cells).length, 0);













export function deltaField(terrain, cfg = TERRAFORM) {
  const nodes = new Map();
  for (const id of Object.keys(terrain)) {
    const cells = terrain[id].cells;
    for (const key of Object.keys(cells)) nodes.set(key, (nodes.get(key) || 0) + cells[key] / 100);
  }
  const ponds = pondsOf(terrain);
  const empty = nodes.size === 0;
  const s = cfg.stepM;
  const get = (ix, iz) => nodes.get(nodeKey(ix, iz)) || 0;
  const at = empty ? () => 0 : (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return 0;
    const fx = x / s, fz = z / s;
    const i0 = Math.floor(fx), j0 = Math.floor(fz);
    const a = get(i0, j0), b = get(i0 + 1, j0), c = get(i0, j0 + 1), d = get(i0 + 1, j0 + 1);
    if (a === 0 && b === 0 && c === 0 && d === 0) return 0;
    const tx = smooth(fx - i0), tz = smooth(fz - j0);
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  };
  return { at, ponds, empty, nodes, size: nodes.size };
}


export function pondAt(ponds, x, z) {
  for (const p of ponds) if (Math.hypot(p.x - x, p.z - z) <= p.r) return p;
  return null;
}


export const pondObstacle = (p) => Object.freeze({ shape: 'circle', module: 'pond', x: p.x, z: p.z, r: p.r, reach: p.r });








export function nodeEditable(parcel, ix, iz, { blockers = [], cfg = TERRAFORM, exclude = null } = {}) {
  const p = PARCELS[parcel];
  if (!p) return false;
  const { x, z } = nodeAt(ix, iz, cfg);
  if (parcelAt(x, z) !== parcel) return false;
  if (outlineDistance(p.outline, x, z) < REACH_M + cfg.keepM) return false;
  for (const b of blockers) {
    if (Math.hypot(b.x - x, b.z - z) < REACH_M + (b.r || 0) + cfg.clearM) return false;
  }
  
  
  if (exclude && exclude(x, z, REACH_M)) return false;
  return true;
}


export function brushNodes(x, z, cfg = TERRAFORM) {
  const s = cfg.stepM, R = cfg.brushM;
  const out = [];
  for (let ix = Math.ceil((x - R) / s); ix <= Math.floor((x + R) / s); ix++) {
    for (let iz = Math.ceil((z - R) / s); iz <= Math.floor((z + R) / s); iz++) {
      const n = nodeAt(ix, iz, cfg);
      const d = Math.hypot(n.x - x, n.z - z);
      if (d <= R) out.push({ ix, iz, x: n.x, z: n.z, fall: smooth(1 - clamp((d - R * 0.55) / (R * 0.45), 0, 1)) });
    }
  }
  return out;
}


export function editableNodes(parcel, { blockers = [], cfg = TERRAFORM, exclude = null } = {}) {
  const p = PARCELS[parcel];
  if (!p) return [];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of p.outline) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  const s = cfg.stepM, out = [];
  for (let ix = Math.ceil(minX / s); ix <= Math.floor(maxX / s); ix++) {
    for (let iz = Math.ceil(minZ / s); iz <= Math.floor(maxZ / s); iz++) {
      if (nodeEditable(parcel, ix, iz, { blockers, cfg, exclude })) out.push({ ix, iz, ...nodeAt(ix, iz, cfg) });
    }
  }
  return out;
}



const ownsParcel = (world, id) => id !== null && ownedIds(world).includes(id);










export function whyNotShape(kind, x, z, {
  world, terrain = {}, blockers = [], ground = heightAt, cfg = TERRAFORM, mayor = null,
} = {}) {
  if (!BRUSHES.includes(kind)) return `There is no '${kind}' to shape with.`;
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'There is no ground there.';
  const parcel = parcelAt(x, z);
  if (parcel === null) return 'That is off the edge of the moon.';
  
  
  
  
  
  
  
  const exclude = mayor && typeof mayor.exclude === 'function' ? mayor.exclude : null;
  if (!ownsParcel(world, parcel) && !exclude) return 'This is not your land yet - buy it from the cat first.';
  if (exclude) {
    const why = exclude(x, z, 0);
    if (why) return why;
  }
  const ponds = pondsOf(terrain);
  if (kind === 'pond') return pondFit(x, z, parcel, { ponds, blockers, ground, cfg, exclude }).why;
  
  
  for (const p of ponds) {
    if (Math.hypot(p.x - x, p.z - z) < p.r + REACH_M + cfg.brushM) return 'The pond is here - shape the ground away from the water.';
  }
  if (brushLift(x, z, parcel, { blockers, cfg, exclude }) < cfg.riseM * cfg.minFall) {
    return 'There is no room to shape here - move further inside your land, clear of the fences and the trees.';
  }
  return null;
}












export function brushLift(x, z, parcel = parcelAt(x, z), { blockers = [], cfg = TERRAFORM, exclude = null } = {}) {
  const cells = {};
  for (const n of brushNodes(x, z, cfg)) {
    if (nodeEditable(parcel, n.ix, n.iz, { blockers, cfg, exclude })) cells[nodeKey(n.ix, n.iz)] = n.fall * cfg.riseM * 100;
  }
  return deltaField({ brush: { cells, ponds: [] } }, cfg).at(x, z);
}












export function pondFit(x, z, parcel = parcelAt(x, z), {
  ponds = [], blockers = [], ground = heightAt, cfg = TERRAFORM, exclude = null,
} = {}) {
  const none = (why) => ({ r: 0, why });
  const p = PARCELS[parcel];
  if (!p) return none('That is off the edge of the moon.');
  let r = outlineDistance(p.outline, x, z) - 2 * REACH_M - cfg.keepM;
  let tight = 'A pond needs more room inside your land than there is here.';
  for (const b of blockers) {
    const room = Math.hypot(b.x - x, b.z - z) - 2 * REACH_M - (b.r || 0) - cfg.clearM;
    if (room < r) { r = room; tight = 'There is something in the way - dig the pond on clearer ground.'; }
  }
  for (const q of ponds) {
    const room = Math.hypot(q.x - x, q.z - z) - q.r - POND_GAP_M;
    if (room < r) { r = room; tight = 'That is too close to the other pond - leave a bank between them.'; }
  }
  r = Math.min(cfg.pondMaxM, Math.floor(r * 100) / 100);
  if (r < cfg.pondMinM) return none(tight);
  
  
  const nodes = pondNodes(x, z, r, cfg);
  for (const n of nodes) {
    if (!nodeEditable(parcel, n.ix, n.iz, { blockers, cfg, exclude })) return none('A pond needs more room inside your land than there is here.');
  }
  const basin = ground(x, z) - cfg.pondDepthM;
  for (const n of nodes) {
    if (basin - ground(n.x, n.z) < -cfg.maxLowerM) return none('The ground falls away too steeply here for a pond.');
  }
  return { r, why: null };
}


export function pondNodes(x, z, radius, cfg = TERRAFORM) {
  const s = cfg.stepM, R = radius + REACH_M;
  const out = [];
  for (let ix = Math.ceil((x - R) / s); ix <= Math.floor((x + R) / s); ix++) {
    for (let iz = Math.ceil((z - R) / s); iz <= Math.floor((z + R) / s); iz++) {
      const n = nodeAt(ix, iz, cfg);
      if (Math.hypot(n.x - x, n.z - z) <= R) out.push({ ix, iz, ...n });
    }
  }
  return out;
}







export function applyBrush(terrain, {
  kind, x, z, parcel = parcelAt(x, z), blockers = [], ground = heightAt, cfg = TERRAFORM, mayor = null,
}) {
  const exclude = mayor && typeof mayor.exclude === 'function' ? mayor.exclude : null;
  const next = {};
  for (const id of Object.keys(terrain)) next[id] = { cells: { ...terrain[id].cells }, ponds: terrain[id].ponds.map((p) => ({ ...p })) };
  const key = String(parcel);
  if (!next[key]) next[key] = newParcelTerrain();
  const rec = next[key];
  const put = (ix, iz, metres) => {
    const k = nodeKey(ix, iz);
    const cm = Math.round(clamp(metres, -cfg.maxLowerM, cfg.maxRiseM) * 100);
    if (cm === 0) delete rec.cells[k]; else rec.cells[k] = cm;
  };
  const now = (ix, iz) => (rec.cells[nodeKey(ix, iz)] || 0) / 100;

  if (kind === 'pond') {
    const fit = pondFit(x, z, parcel, { ponds: pondsOf(terrain), blockers, ground, cfg, exclude });
    if (fit.why) return next;
    const basin = ground(x, z) - cfg.pondDepthM;
    for (const n of pondNodes(x, z, fit.r, cfg)) put(n.ix, n.iz, basin - ground(n.x, n.z));
    rec.ponds.push({ x, z, r: fit.r, y: ground(x, z) - cfg.pondRimM });
    return next;
  }
  const sign = kind === 'raise' ? 1 : -1;
  for (const n of brushNodes(x, z, cfg)) {
    if (!nodeEditable(parcel, n.ix, n.iz, { blockers, cfg, exclude })) continue;
    put(n.ix, n.iz, now(n.ix, n.iz) + sign * cfg.riseM * n.fall);
  }
  return next;
}
