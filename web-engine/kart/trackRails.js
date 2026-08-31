















































import { nearestOnBranch } from './trackPath.js';
import { smoothCurvature } from './trackCamber.js';
import { GUARD_FLAT, LIP_CLEAR } from './edgeGuard.js';










export const RAIL_AT = GUARD_FLAT;


































export const RAIL_HEIGHT = 0.95;


export const RAIL_RADIUS = 0.22;















export const RAIL_CATCH = 1.15;






































export const RAIL_BAND = RAIL_RADIUS + RAIL_CATCH;










export const RAIL_REF_SPEED = 56;
export const RAIL_V_FRAC = 0.95;
export const RAIL_LAT_ACCEL = 34;


export const RAIL_MIN_RUN = 30;
export const RAIL_MAX_GAP = 24;


export const RAIL_K_MIN = RAIL_LAT_ACCEL
  / ((RAIL_V_FRAC * RAIL_REF_SPEED) * (RAIL_V_FRAC * RAIL_REF_SPEED));


function wrapFrac(d) {
  let x = d;
  while (x > 0.5) x -= 1;
  while (x < -0.5) x += 1;
  return x;
}


function onAnyBranch(path, x, z, pad) {
  for (const br of path.branches ?? []) {
    if (nearestOnBranch(br, x, z).dist <= br.width / 2 + (br.shoulder ?? 0) + pad) return true;
  }
  return false;
}

























export function planRails(path, track = {}, { guards = null, minRun = RAIL_MIN_RUN } = {}) {
  const n = path.count;
  const on = new Uint8Array(n * 2);
  const endS = new Float64Array(n * 2);
  const blocked = new Uint8Array(n * 2);
  const k = smoothCurvature(path);
  const perM = n / Math.max(path.length, 1e-6);

  const jumps = track.jumps ?? [];
  const glides = track.glides ?? [];

  
  const want = new Uint8Array(n * 2);
  for (let i = 0; i < n; i += 1) {
    const p = path.pts[i];
    const t = path.tangents[i];
    const frac = path.s[i] / path.length;

    
    let toLip = Infinity;
    for (const j of jumps) toLip = Math.min(toLip, Math.abs(wrapFrac(j.at - frac)) * path.length);
    for (const g of glides) toLip = Math.min(toLip, Math.abs(wrapFrac(g.from - frac)) * path.length);

    
    
    
    
    
    
    const outIdx = k[i] > 0 ? 1 : 0;

    for (let s = 0; s < 2; s += 1) {
      const key = i * 2 + s;
      
      
      
      
      
      
      
      if (toLip < LIP_CLEAR) { blocked[key] = 1; continue; }
      
      
      
      
      let hitsBranch = false;
      for (let o = 0; o <= RAIL_AT + RAIL_CATCH; o += 1.5) {
        const off = (p.width / 2 + o) * (s === 0 ? 1 : -1);
        if (onAnyBranch(path, p.x + t.z * off, p.z - t.x * off, 2)) { hitsBranch = true; break; }
      }
      if (hitsBranch) { blocked[key] = 1; continue; }
      
      if (guards && guards.reach && guards.reach[key] < RAIL_AT + RAIL_RADIUS) {
        blocked[key] = 1;
        continue;
      }
      if (s !== outIdx) continue;                 
      if (Math.abs(k[i]) < RAIL_K_MIN) continue;  
      want[key] = 1;
    }
  }

  
  const gapN = Math.max(1, Math.round(RAIL_MAX_GAP * perM));
  for (let s = 0; s < 2; s += 1) {
    for (let i = 0; i < n; i += 1) {
      if (want[i * 2 + s]) continue;
      let run = 0;
      while (run < gapN && !want[((i + run) % n) * 2 + s]) run += 1;
      if (run >= gapN || run === 0) continue;
      if (!want[(((i - 1) % n + n) % n) * 2 + s] || !want[((i + run) % n) * 2 + s]) continue;
      let free = true;
      for (let d = 0; d < run; d += 1) if (blocked[((i + d) % n) * 2 + s]) free = false;
      if (free) for (let d = 0; d < run; d += 1) want[((i + d) % n) * 2 + s] = 1;
    }
  }

  
  
  
  
  
  
  const spans = [];
  for (let s = 0; s < 2; s += 1) {
    let i0 = 0;
    while (i0 < n && want[i0 * 2 + s]) i0 += 1;
    if (i0 === n) i0 = 0;
    let i = 0;
    while (i < n) {
      const at = (i0 + i) % n;
      if (!want[at * 2 + s]) { i += 1; continue; }
      let len = 0;
      while (len < n && want[((i0 + i + len) % n) * 2 + s]) len += 1;
      const metres = len / perM;
      if (metres >= minRun) {
        const last = (i0 + i + len - 1) % n;
        
        
        const startS = path.s[(i0 + i) % n];
        const stopS = startS + metres;
        let peak = 0;
        for (let d = 0; d < len; d += 1) {
          const j = (i0 + i + d) % n;
          on[j * 2 + s] = 1;
          endS[j * 2 + s] = stopS;
          peak = Math.max(peak, Math.abs(k[j]));
        }
        spans.push({
          side: s === 0 ? 'left' : 'right',
          from: startS / path.length,
          to: path.s[last] / path.length,
          metres,
          radius: peak > 0 ? 1 / peak : Infinity,
          limit: peak > 0 ? Math.sqrt(RAIL_LAT_ACCEL / peak) : Infinity,
        });
      }
      i += len;
    }
  }

  return { count: n, on, endS, spans, length: path.length };
}


































































































export function railContact(rails, surf, kart) {
  if (!rails || !surf) return null;
  if (surf.branch) return null;                 
  const s = (surf.lateral ?? 0) > 0 ? 0 : 1;
  const key = (surf.index % rails.count) * 2 + s;
  if (!rails.on[key]) return null;
  const over = surf.overBy ?? 0;
  if (Math.abs(over - RAIL_AT) > RAIL_BAND) return null;

  const tangent = surf.heading ?? 0;
  const vx = kart.vx ?? 0;
  const vz = kart.vz ?? 0;
  const speed = Math.hypot(vx, vz);
  let angle = 0;
  if (speed > 1e-6) {
    let d = Math.atan2(vx, vz) - tangent;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    
    
    
    
    if (Math.abs(d) > Math.PI / 2) d -= Math.sign(d) * Math.PI;
    angle = d;
  }
  let remaining = rails.endS[key] - (surf.s ?? 0);
  
  if (remaining < -rails.length / 2) remaining += rails.length;
  if (remaining > rails.length) remaining -= rails.length;

  return {
    
    
    
    
    
    
    side: s === 0 ? 1 : -1,
    
    
    
    
    y: (surf.roadY ?? surf.y ?? 0) + RAIL_HEIGHT,
    tangent,
    angle,
    remaining: Math.max(0, remaining),
    speed,
    
    
    
    
    
    
    
    
    
    
    toRail: RAIL_AT - over,
  };
}


export function railMetres(rails) {
  let m = 0;
  for (const sp of rails.spans) m += sp.metres;
  return m;
}
