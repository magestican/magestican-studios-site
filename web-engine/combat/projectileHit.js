
























export function closestOnSegment(ax, ay, az, bx, by, bz, px, py, pz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const len2 = dx * dx + dy * dy + dz * dz;
  if (len2 < 1e-12) {
    return { t: 0, dist: Math.hypot(px - ax, py - ay, pz - az) };
  }
  let t = ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t, cy = ay + dy * t, cz = az + dz * t;
  return { t, dist: Math.hypot(px - cx, py - cy, pz - cz) };
}












export function sweepHitTarget(from, to, targets) {
  let best = null;
  for (const tgt of targets) {
    const r = tgt.radius ?? 0.9;
    const { t, dist } = closestOnSegment(
      from.x, from.y, from.z, to.x, to.y, to.z, tgt.x, tgt.y, tgt.z);
    if (dist > r) continue;
    if (!best || t < best.t) best = { id: tgt.id, t, dist };
  }
  return best;
}






export function sweepHitWorld(from, to, isSolid, step = 0.34) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-9) return null;
  const steps = Math.max(1, Math.ceil(len / step));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t, y = from.y + dy * t, z = from.z + dz * t;
    if (isSolid(x, y, z)) return t;
  }
  return null;
}












export function stepProjectile({ from, to, targets = [], isSolid = null,
                                 age, maxAge = 4, travelled = 0, maxRange = 120 }) {
  const player = sweepHitTarget(from, to, targets);
  const world = isSolid ? sweepHitWorld(from, to, isSolid) : null;

  if (player && (world === null || player.t <= world)) {
    return {
      kind: 'player', id: player.id,
      point: lerp(from, to, player.t),
    };
  }
  if (world !== null) return { kind: 'world', point: lerp(from, to, world) };
  if (age >= maxAge || travelled >= maxRange) return { kind: 'expire' };
  return null;
}

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}
