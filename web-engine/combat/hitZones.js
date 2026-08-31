












export const HEADSHOT_MULTIPLIER = 1.4;









export const BODY_CENTRE_Y = 1.0;











export const HEAD = Object.freeze({ centreY: 1.28, radius: 0.30 });











export function aimPointY(scale = 1) {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return BODY_CENTRE_Y * s;
}


export function headPoint(pos, scale = 1) {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return { x: pos.x, y: pos.y + HEAD.centreY * s, z: pos.z, radius: HEAD.radius * s };
}















export function closestApproach(from, to, p) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const len2 = dx * dx + dy * dy + dz * dz;
  if (len2 < 1e-12) return { distance: Math.hypot(p.x - from.x, p.y - from.y, p.z - from.z), t: 0 };
  let t = ((p.x - from.x) * dx + (p.y - from.y) * dy + (p.z - from.z) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = from.x + dx * t, cy = from.y + dy * t, cz = from.z + dz * t;
  return { distance: Math.hypot(p.x - cx, p.y - cy, p.z - cz), t };
}

export function segmentPointDistance(from, to, p) {
  return closestApproach(from, to, p).distance;
}









export function isHeadshot(from, to, targetPos, scale = 1) {
  if (!from || !to || !targetPos) return false;
  const h = headPoint(targetPos, scale);
  return segmentPointDistance(from, to, h) <= h.radius;
}




export function damageFor(baseDamage, headshot) {
  const base = Number.isFinite(baseDamage) ? baseDamage : 0;
  if (!headshot) return base;
  return Math.round(base * HEADSHOT_MULTIPLIER);
}
