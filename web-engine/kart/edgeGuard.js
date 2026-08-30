























































import { nearestOnBranch } from './trackPath.js';
import { inSpan, RESPAWNS } from './trackHazards.js';















export const GUARD_FLAT = 3.0;


export const GUARD_RISE = 4.5;


export const GUARD_CAP = 2.5;


export const GUARD_WIDTH = GUARD_FLAT + GUARD_RISE + GUARD_CAP;











export const GUARD_PROBE = 11;







export const GUARD_MIN_DROP = 2.5;














export const GUARD_TIERS = [
  { id: 'kerb', minDrop: GUARD_MIN_DROP, height: 0.70, dress: 'stones' },
  { id: 'bank', minDrop: 7, height: 1.40, dress: 'barrels' },
  { id: 'rampart', minDrop: 16, height: 2.20, dress: 'wall' },
];






































export const GUARD_DRESS_TOP = Object.freeze({
  stones: 0.46,
  barrels: 1.045,
  wall: 0.92,
});














export const GUARD_DRESS_MIN = 0.75;







export function dressTop(tier, height = Infinity) {
  if (!tier || !(height > tier.height * GUARD_DRESS_MIN)) return 0;
  return GUARD_DRESS_TOP[tier.dress] ?? 0;
}





























export const FATAL_OFFSETS = [4, 7, 16];










export const FATAL_DROP = GUARD_TIERS[1].minDrop;



















export const GUARD_MAX_SLOPE = 0.22;


export function guardHeightFor(tierHeight, reach = GUARD_WIDTH) {
  return Math.min(tierHeight, GUARD_MAX_SLOPE * Math.max(0, reach));
}


export function tierForDrop(d) {
  let found = null;
  for (const t of GUARD_TIERS) if (d >= t.minDrop) found = t;
  return found;
}





















export function guardSection(reach = GUARD_WIDTH) {
  const width = Math.max(1.2, Math.min(reach, GUARD_WIDTH));
  const flat = Math.min(GUARD_FLAT, width * 0.45);
  const crest = flat + (width - flat) * (GUARD_RISE / (GUARD_RISE + GUARD_CAP));
  return { width, flat, crest };
}

















export function guardLift(out, height, reach = GUARD_WIDTH) {
  if (!(height > 0)) return null;
  const { width, flat, crest } = guardSection(reach);
  if (out < 0) return 0;
  if (out > width) return null;
  if (out <= flat) return 0;
  if (out >= crest) return height;
  const u = (out - flat) / (crest - flat);
  return height * u * u * (3 - 2 * u);
}







export const LIP_CLEAR = 32;



const MIN_RUN = 26;
const MAX_GAP = 20;


const RAMP = 12;


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
















function reachAt(zones, { frac, side, width }) {
  let reach = GUARD_WIDTH;
  for (const zone of zones ?? []) {
    if (!RESPAWNS.has(zone.kind)) continue;
    if (!inSpan(frac, zone.from, zone.to)) continue;
    if (zone.side && zone.side !== 'both' && zone.side !== side) continue;
    
    
    const lip = ((zone.beyond ?? 1.18) - 1) * (width / 2);
    reach = Math.min(reach, Math.max(0, lip - 0.4));
  }
  return reach;
}























export function planEdgeGuards(path, track, groundAt, {
  probe = GUARD_PROBE, minDrop = GUARD_MIN_DROP, lipClear = LIP_CLEAR,
} = {}) {
  const n = path.count;
  const drop = new Float64Array(n * 2);
  const height = new Float64Array(n * 2);
  const reach = new Float64Array(n * 2).fill(GUARD_WIDTH);
  const tier = new Array(n * 2).fill(null);
  const fatal = new Float64Array(n * 2);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const blockedLip = new Uint8Array(n * 2);
  const blockedHard = new Uint8Array(n * 2);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const jumps = track.jumps ?? [];
  const glides = track.glides ?? [];
  const fatalOffsets = [...FATAL_OFFSETS, probe];
  for (let i = 0; i < n; i += 1) {
    const p = path.pts[i];
    const t = path.tangents[i];
    const frac = path.s[i] / path.length;

    
    let toLip = Infinity;
    for (const j of jumps) toLip = Math.min(toLip, Math.abs(wrapFrac(j.at - frac)) * path.length);
    for (const g of glides) toLip = Math.min(toLip, Math.abs(wrapFrac(g.from - frac)) * path.length);

    for (let s = 0; s < 2; s += 1) {
      const side = s === 0 ? 1 : -1;
      const k = i * 2 + s;
      const off = (p.width / 2 + probe) * side;
      const x = p.x + t.z * off;
      const z = p.z - t.x * off;
      drop[k] = (p.y ?? 0) - groundAt(x, z);
      
      
      
      let worstFatal = drop[k];
      for (const o of fatalOffsets) {
        const fo = (p.width / 2 + o) * side;
        worstFatal = Math.max(
          worstFatal,
          (p.y ?? 0) - groundAt(p.x + t.z * fo, p.z - t.x * fo),
        );
      }
      fatal[k] = worstFatal;
      reach[k] = reachAt(track.hazards, {
        frac, side: side > 0 ? 'left' : 'right', width: p.width,
      });
      if (toLip < lipClear) blockedLip[k] = 1;
      
      
      
      
      
      
      
      
      
      for (let o = 0; o <= GUARD_WIDTH + 1; o += 2) {
        const bx = p.x + t.z * ((p.width / 2 + o) * side);
        const bz = p.z - t.x * ((p.width / 2 + o) * side);
        if (onAnyBranch(path, bx, bz, 2)) { blockedHard[k] = 1; break; }
      }
      
      if (reach[k] < 1.2) blockedHard[k] = 1;
    }
  }

  
  
  
  
  
  
  
  const perM = n / path.length;
  const win = Math.max(1, Math.round(6 * perM));
  const smoothRing = (src) => {
    const out = new Float64Array(n * 2);
    for (let s = 0; s < 2; s += 1) {
      for (let i = 0; i < n; i += 1) {
        let sum = 0; let cnt = 0;
        for (let d = -win; d <= win; d += 1) {
          const j = ((i + d) % n + n) % n;
          sum += src[j * 2 + s]; cnt += 1;
        }
        out[i * 2 + s] = sum / cnt;
      }
    }
    return out;
  };
  const smooth = smoothRing(drop);
  
  
  
  
  const smoothFatal = smoothRing(fatal);

  
  const spans = [];
  for (let s = 0; s < 2; s += 1) {
    const want = new Uint8Array(n);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const openable = (k) => !blockedLip[k] || smoothFatal[k] >= FATAL_DROP;
    for (let i = 0; i < n; i += 1) {
      const k = i * 2 + s;
      want[i] = (!blockedHard[k] && openable(k)
        && Math.max(smooth[k], smoothFatal[k]) >= minDrop) ? 1 : 0;
    }
    
    
    
    const gapN = Math.round(MAX_GAP * perM);
    for (let i = 0; i < n; i += 1) {
      if (want[i]) continue;
      let run = 0;
      while (run < gapN && !want[(i + run) % n]) run += 1;
      if (run >= gapN || run === 0) continue;
      if (!want[((i - 1) % n + n) % n] || !want[(i + run) % n]) continue;
      let free = true;
      for (let d = 0; d < run; d += 1) {
        const k = ((i + d) % n) * 2 + s;
        if (blockedHard[k] || !openable(k)) free = false;
      }
      if (free) for (let d = 0; d < run; d += 1) want[(i + d) % n] = 1;
    }
    
    let i0 = 0;
    while (i0 < n && want[i0]) i0 += 1;         
    if (i0 === n) i0 = 0;                        
    let i = 0;
    while (i < n) {
      const at = (i0 + i) % n;
      if (!want[at]) { i += 1; continue; }
      let len = 0;
      while (len < n && want[(i0 + i + len) % n]) len += 1;
      const metres = (len / perM);
      if (metres >= MIN_RUN) {
        
        
        
        
        
        
        
        
        
        
        
        let worst = 0;
        for (let d = 0; d < len; d += 1) worst = Math.max(worst, smooth[((i0 + i + d) % n) * 2 + s]);
        const t = tierForDrop(worst);
        if (t) {
          for (let d = 0; d < len; d += 1) {
            const j = (i0 + i + d) % n;
            
            
            
            const fromStart = d / perM;
            const fromEnd = (len - 1 - d) / perM;
            const e = Math.min(1, Math.min(fromStart, fromEnd) / RAMP);
            const ease = e * e * (3 - 2 * e);
            height[j * 2 + s] = guardHeightFor(t.height, reach[j * 2 + s]) * ease;
            tier[j * 2 + s] = t;
          }
          spans.push({
            side: s === 0 ? 'left' : 'right',
            from: path.s[(i0 + i) % n] / path.length,
            to: path.s[(i0 + i + len - 1) % n] / path.length,
            metres, drop: worst, tier: t.id, height: t.height, dress: t.dress,
          });
        }
      }
      i += len;
    }
  }

  return {
    count: n,
    drop,
    smooth,
    fatal,
    smoothFatal,
    height,
    reach,
    tier,
    spans,
    probe,
    minDrop,
    
    
    
    
    blockedLip,
    blockedHard,
  };
}
































export function guardGroundY(guards, surf, baseY = null) {
  if (!guards || !surf || surf.onRoad) return null;
  const s = (surf.lateral ?? 0) > 0 ? 0 : 1;
  const k = (surf.index % guards.count) * 2 + s;
  const h = guards.height[k];
  if (!(h > 0)) return null;
  const lift = guardLift(surf.overBy ?? 0, h, guards.reach[k]);
  if (lift === null) return null;
  return (baseY ?? surf.y ?? 0) + lift;
}
