





















































import { guardSection, GUARD_TIERS } from './edgeGuard.js';










export const SOLID_MIN_DROP = GUARD_TIERS[1].minDrop;










export const WALL_RESTITUTION = 0.25;









export const WALL_DRAG = 0.55;










export const BANK_PUSH = 9.0;


function slotAt(guards, surf) {
  if (!guards || !surf || surf.onRoad) return null;
  const s = (surf.lateral ?? 0) > 0 ? 0 : 1;
  const k = (surf.index % guards.count) * 2 + s;
  const height = guards.height[k];
  if (!(height > 0)) return null;
  return {
    k,
    side: s === 0 ? 1 : -1,        
    height,
    reach: guards.reach[k],
    drop: guards.smooth ? guards.smooth[k] : 0,
    tier: guards.tier ? guards.tier[k] : null,
  };
}


export function slotIsSolid(slot) {
  if (!slot) return false;
  if (slot.tier && typeof slot.tier.minDrop === 'number') return slot.tier.minDrop >= SOLID_MIN_DROP;
  return (slot.drop ?? 0) >= SOLID_MIN_DROP;
}












export function bankPush(guards, surf) {
  const slot = slotAt(guards, surf);
  if (!slot) return 0;
  const { flat, crest, width } = guardSection(slot.reach);
  const out = surf.overBy ?? 0;
  if (out <= flat || out > width) return 0;
  
  
  
  const u = Math.min(1, (out - flat) / Math.max(1e-6, crest - flat));
  
  
  const tallest = GUARD_TIERS[GUARD_TIERS.length - 1].height;
  const scale = slot.height / Math.max(1e-6, tallest);
  return BANK_PUSH * u * Math.min(1, scale);
}
















export function guardBlock(guards, surf, kart) {
  const slot = slotAt(guards, surf);
  if (!slot || !slotIsSolid(slot)) return null;
  const { crest } = guardSection(slot.reach);
  const out = surf.overBy ?? 0;
  if (out <= crest) return null;

  
  
  const nx = (surf.nx ?? 0) * slot.side;
  const nz = (surf.nz ?? 0) * slot.side;

  
  const back = out - crest;
  const x = kart.x - nx * back;
  const z = kart.z - nz * back;

  
  const vx = kart.vx ?? 0;
  const vz = kart.vz ?? 0;
  const into = vx * nx + vz * nz;              
  let outVx = vx;
  let outVz = vz;
  let scrub = 0;
  if (into > 0) {
    
    
    const keep = -into * WALL_RESTITUTION;
    outVx = vx - nx * into + nx * keep;
    outVz = vz - nz * into + nz * keep;
    scrub = Math.min(1, into / 18);
  }
  return { x, z, vx: outVx, vz: outVz, scrub };
}
