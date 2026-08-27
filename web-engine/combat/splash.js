






























export const PUSH_RADIUS_SCALE = 1.6;


















export const PUSH_SPEED = 22.0;











export const SELF_DAMAGE = 0.45;









export const UP_BIAS = 0.55;



export const MIN_PUSH = 0.6;      








export function falloff(distance, radius) {
  if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0) return 0;
  if (distance >= radius) return 0;
  const t = 1 - distance / radius;
  return t * t;
}
















export function resolveSplash({ centre, bodies = [], damage = 0, radius = 0, shooterId = null } = {}) {
  const out = [];
  if (!centre || !Number.isFinite(radius) || radius <= 0) return out;
  const pushRadius = radius * PUSH_RADIUS_SCALE;

  for (const b of bodies) {
    if (!b || b.id == null) continue;
    const dx = b.x - centre.x;
    const dy = b.y - centre.y;
    const dz = b.z - centre.z;
    const dist = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(dist)) continue;

    const self = shooterId != null && b.id === shooterId;
    const hurtK = falloff(dist, radius);
    const pushK = falloff(dist, pushRadius);
    if (hurtK <= 0 && pushK <= 0) continue;

    const dmg = damage * hurtK * (self ? SELF_DAMAGE : 1);

    
    
    
    let nx = 0, ny = 1, nz = 0;
    if (dist > 1e-4) {
      nx = dx / dist; ny = dy / dist; nz = dz / dist;
    }
    ny += UP_BIAS;
    const n = Math.hypot(nx, ny, nz) || 1;
    const speed = PUSH_SPEED * pushK;
    const push = speed >= MIN_PUSH
      ? { x: (nx / n) * speed, y: (ny / n) * speed, z: (nz / n) * speed }
      : { x: 0, y: 0, z: 0 };

    if (dmg <= 0 && push.x === 0 && push.y === 0 && push.z === 0) continue;
    out.push({ id: b.id, damage: dmg, push, self });
  }
  return out;
}




export function hasSplash(shot) {
  return !!shot
    && Number.isFinite(shot.splash) && shot.splash > 0
    && Number.isFinite(shot.splashRadius) && shot.splashRadius > 0;
}
