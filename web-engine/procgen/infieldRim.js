

















































































import { alongPolyline, LANE_HALF } from './laneSpec.js';
















export const RIM_RISE = 2;









export const RIM_HALF = 2;








export const RIM_BANK = 18;















export const RIM_GATE = 6;


export const RIM_PERIOD = RIM_BANK + RIM_GATE;












export const RIM_LANE_CLEAR = LANE_HALF + RIM_HALF + 1;












export const RIM_PERCH_CLEAR = 9;


















export function rimCurve(mid, flank, samples = 240) {
  const pts = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const a = alongPolyline(mid.points, t);
    const b = alongPolyline(flank.points, t);
    pts.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, t });
  }
  return pts;
}












export function rimSites(mid, flank, { bank = RIM_BANK, gate = RIM_GATE } = {}) {
  const curve = rimCurve(mid, flank);
  const period = bank + gate;
  const out = [];
  let along = 0;
  for (let i = 1; i < curve.length; i += 1) {
    const a = curve[i - 1];
    const b = curve[i];
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    
    
    
    const steps = Math.max(1, Math.ceil(seg * 2));
    for (let s = 0; s < steps; s += 1) {
      const f = s / steps;
      const d = along + seg * f;
      
      if (d % period >= bank) continue;
      out.push({
        x: a.x + (b.x - a.x) * f,
        z: a.z + (b.z - a.z) * f,
        flankId: flank.id,
        along: d,
      });
    }
    along += seg;
  }
  return out;
}


function d2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}




















export function placeRim(lanes, {
  surfaceAt, occupied = () => false, blocked = () => false,
  worldHeight, worldSize, perches = [], nearestLane,
}) {
  const mid = lanes.find((l) => l.id === 'mid');
  const flanks = lanes.filter((l) => l.role === 'flank');
  if (!mid || !flanks.length) return [];
  const perchClear2 = RIM_PERCH_CLEAR * RIM_PERCH_CLEAR;
  const seen = new Set();
  const out = [];
  for (const flank of flanks) {
    for (const site of rimSites(mid, flank)) {
      
      
      
      
      for (let dx = -RIM_HALF; dx <= RIM_HALF; dx += 1) {
        for (let dz = -RIM_HALF; dz <= RIM_HALF; dz += 1) {
          if (dx * dx + dz * dz > RIM_HALF * RIM_HALF + 1) continue;
          const x = Math.round(site.x) + dx;
          const z = Math.round(site.z) + dz;
          const key = x * 4096 + z;
          if (seen.has(key)) continue;
          if (x < 2 || z < 2 || x >= worldSize.x - 2 || z >= worldSize.z - 2) continue;
          
          
          
          const n = nearestLane(lanes, x, z);
          if (!n || n.dist < RIM_LANE_CLEAR) continue;
          if (blocked(x, z) || occupied(x, z)) continue;
          let nearPerch = false;
          for (const p of perches) {
            if (d2(x, z, p.x, p.z) < perchClear2) { nearPerch = true; break; }
          }
          if (nearPerch) continue;
          const base = surfaceAt(x, z);
          if (!Number.isFinite(base) || base < 1) continue;
          const top = base + RIM_RISE - 1;
          
          
          if (top + 3 >= worldHeight) continue;
          seen.add(key);
          out.push({ x, z, flankId: site.flankId, base, top });
        }
      }
    }
  }
  return out;
}
