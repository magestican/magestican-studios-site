















































































import { WALK_EDGE_M } from '../world/collision.mjs';
import { PARCELS, insideOutline, parcelAt } from '../world/parcels.mjs';

export const LAND_EDGE = Object.freeze({
  
  
  
  stepM: 1.3,
  probeM: 0.12,
});

export const LAND_MASK = Object.freeze({
  
  
  texelM: 0.25,
  halfSpanM: 44,
  
  
  
  reachM: 3,
  
  
  
  
  
  edgeM: 0.9,
  whoseLo: 0.5,
  whoseHi: 0.9,
  
  
  nearM: 5,
  nearLo: 0.5,
  nearHi: 1,
  
  
  
  sideM: 0.15,
  
  
  
  fullM: 0.85,
  fadeM: 2,
  
  
  coastM: 2.6,
  coastEdgeM: 0.4,
  
  
  strength: 1,
  whisper: 0.34,
  
  
  
  
  
  
  
  
  
  
  
  shadeMul: Object.freeze([0.60, 0.645, 0.775]),
});






export function notMine(owned, parcels = PARCELS) {
  const mine = owned instanceof Set ? owned : new Set(owned || []);
  return parcels.map((p) => p.id).filter((id) => !mine.has(id)).sort((a, b) => a - b);
}

const hyp = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);















export function edgeBand(outline, cfg = LAND_EDGE) {
  if (!Array.isArray(outline) || outline.length < 3) return [];
  const M = outline.length;
  let perimeter = 0;
  for (let k = 0; k < M; k++) perimeter += hyp(outline[k][0], outline[k][1], outline[(k + 1) % M][0], outline[(k + 1) % M][1]);
  if (!(perimeter > 0)) return [];
  const count = Math.max(8, Math.round(perimeter / cfg.stepM));
  const step = perimeter / count;
  
  
  
  
  
  let mx = 0, mz = 0;
  for (const [px, pz] of outline) { mx += px; mz += pz; }
  mx /= M;
  mz /= M;
  const out = [];
  let k = 0, along = 0;
  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (k < M - 1) {
      const seg = hyp(outline[k][0], outline[k][1], outline[(k + 1) % M][0], outline[(k + 1) % M][1]);
      if (along + seg >= target) break;
      along += seg;
      k++;
    }
    const a = outline[k], b = outline[(k + 1) % M];
    const len = hyp(a[0], a[1], b[0], b[1]) || 1;
    const t = Math.min(1, Math.max(0, (target - along) / len));
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    
    let nx = -(b[1] - a[1]) / len;
    let nz = (b[0] - a[0]) / len;
    const toMiddle = Math.hypot(mx - x, mz - z) || 1;
    if (!(Math.abs(Math.hypot(nx, nz) - 1) < 1e-9)) {
      
      
      nx = (mx - x) / toMiddle;
      nz = (mz - z) / toMiddle;
    } else if (!insideOutline(outline, x + nx * cfg.probeM, z + nz * cfg.probeM)) {
      if (insideOutline(outline, x - nx * cfg.probeM, z - nz * cfg.probeM)) { nx = -nx; nz = -nz; }
      else if ((mx - x) * nx + (mz - z) * nz < 0) { nx = -nx; nz = -nz; }
    }
    out.push({ x, z, nx, nz });
  }
  return out;
}




const SIZE = Math.round((LAND_MASK.halfSpanM * 2) / LAND_MASK.texelM);
const ORIGIN = -LAND_MASK.halfSpanM;
const centre = (i) => ORIGIN + (i + 0.5) * LAND_MASK.texelM;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, t) => { const s = clamp01((t - a) / (b - a)); return s * s * (3 - 2 * s); };












function splat(out, segments, reach) {
  out.fill(reach);
  const { texelM } = LAND_MASK;
  for (const [ax, az, bx, bz] of segments) {
    const vx = bx - ax, vz = bz - az, len2 = vx * vx + vz * vz;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach - ORIGIN) / texelM));
    const i1 = Math.min(SIZE - 1, Math.ceil((Math.max(ax, bx) + reach - ORIGIN) / texelM));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz) - reach - ORIGIN) / texelM));
    const j1 = Math.min(SIZE - 1, Math.ceil((Math.max(az, bz) + reach - ORIGIN) / texelM));
    for (let j = j0; j <= j1; j++) {
      const z = centre(j), row = j * SIZE;
      for (let i = i0; i <= i1; i++) {
        const x = centre(i);
        const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / len2)) : 0;
        const dx = x - (ax + vx * t), dz = z - (az + vz * t);
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < out[row + i]) out[row + i] = d;
      }
    }
  }
  return out;
}


function segmentsOf(ids) {
  const out = [];
  for (const id of ids) {
    const o = PARCELS[id].outline;
    for (let k = 0; k < o.length; k++) {
      const a = o[k], b = o[(k + 1) % o.length];
      out.push([a[0], a[1], b[0], b[1]]);
    }
  }
  return out;
}

let baked = null;












export function landField() {
  if (baked) return baked;
  const n = SIZE * SIZE;
  const dist = splat(new Float32Array(n), segmentsOf(PARCELS.map((p) => p.id)), LAND_MASK.reachM);
  const pid = new Int16Array(n);
  const coast = new Float32Array(n);
  for (let j = 0; j < SIZE; j++) {
    const z = centre(j), row = j * SIZE;
    for (let i = 0; i < SIZE; i++) {
      const x = centre(i);
      const id = parcelAt(x, z);
      pid[row + i] = id === null ? -1 : id;
      coast[row + i] = 1 - smooth(WALK_EDGE_M - LAND_MASK.coastM, WALK_EDGE_M - LAND_MASK.coastEdgeM, Math.hypot(x, z));
    }
  }
  baked = {
    size: SIZE, texelM: LAND_MASK.texelM, originM: ORIGIN, spanM: SIZE * LAND_MASK.texelM,
    reachM: LAND_MASK.reachM, dist, pid, coast,
  };
  return baked;
}












export function ownBorderSegments(owned) {
  const mine = owned instanceof Set ? owned : new Set(owned || []);
  const out = [];
  for (const id of mine) {
    if (!PARCELS[id]) continue;
    const o = PARCELS[id].outline;
    for (let k = 0; k < o.length; k++) {
      const a = o[k], b = o[(k + 1) % o.length];
      const len = hyp(a[0], a[1], b[0], b[1]);
      if (!(len > 0)) continue;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
      const one = parcelAt(mx + nx * LAND_MASK.sideM, mz + nz * LAND_MASK.sideM);
      const two = parcelAt(mx - nx * LAND_MASK.sideM, mz - nz * LAND_MASK.sideM);
      if (one === null || two === null) continue;
      if (mine.has(one) === mine.has(two)) continue;
      out.push([a[0], a[1], b[0], b[1]]);
    }
  }
  return out;
}





















export function landMask(owned) {
  const field = landField();
  const mine = owned instanceof Set ? owned : new Set(owned || []);
  const n = field.size * field.size;
  const near = splat(new Float32Array(n), ownBorderSegments(mine), LAND_MASK.nearM);
  const data = new Uint8Array(n * 4);
  for (let k = 0; k < n; k++) {
    const theirs = field.pid[k] >= 0 && !mine.has(field.pid[k]);
    const signed = theirs ? near[k] : -near[k];
    data[k * 4] = Math.round(clamp01(field.dist[k] / field.reachM) * 255);
    data[k * 4 + 1] = Math.round(clamp01(0.5 + (0.5 * signed) / LAND_MASK.edgeM) * field.coast[k] * 255);
    data[k * 4 + 2] = Math.round(clamp01(near[k] / LAND_MASK.nearM) * 255);
    data[k * 4 + 3] = 255;
  }
  return { size: field.size, texelM: field.texelM, originM: field.originM, spanM: field.spanM, reachM: field.reachM, data };
}






export function sampleMask(mask, channel, x, z) {
  const u = (x - mask.originM) / mask.texelM - 0.5;
  const v = (z - mask.originM) / mask.texelM - 0.5;
  const i0 = Math.max(0, Math.min(mask.size - 1, Math.floor(u)));
  const j0 = Math.max(0, Math.min(mask.size - 1, Math.floor(v)));
  const i1 = Math.min(mask.size - 1, i0 + 1);
  const j1 = Math.min(mask.size - 1, j0 + 1);
  const fx = clamp01(u - i0);
  const fz = clamp01(v - j0);
  const at = (i, j) => mask.data[(j * mask.size + i) * 4 + channel] / 255;
  const top = at(i0, j0) * (1 - fx) + at(i1, j0) * fx;
  const bottom = at(i0, j1) * (1 - fx) + at(i1, j1) * fx;
  const value = top * (1 - fz) + bottom * fz;
  return channel === 0 ? value * mask.reachM : value;
}









export function markAt(mask, x, z) {
  const verge = 1 - smooth(LAND_MASK.fullM, LAND_MASK.fadeM, sampleMask(mask, 0, x, z));
  const whose = smooth(LAND_MASK.whoseLo, LAND_MASK.whoseHi, sampleMask(mask, 1, x, z));
  const emphasis = LAND_MASK.whisper + (1 - LAND_MASK.whisper) * (1 - smooth(LAND_MASK.nearLo, LAND_MASK.nearHi, sampleMask(mask, 2, x, z)));
  return verge * whose * emphasis * LAND_MASK.strength;
}
