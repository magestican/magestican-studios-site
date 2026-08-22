// Projectile flight + contact resolution — PURE. No THREE, no DOM.
//
// Bryan 2026-08-22: "bullets seem to insta hit enemies instead of hitting on
// contact."
//
// He is describing a real inconsistency, not a glitch. The shovel and shotgun
// were `kind: 'hitscan'`: the damage was resolved by a raycast on the frame you
// pulled the trigger, at infinite speed. But the game also SPAWNED a poo pellet
// that flew at 30 m/s and a tracer line — so at 25 m the victim's health bar
// dropped roughly three quarters of a second before the thing that supposedly
// hit them arrived. The visual promised a projectile and the mechanic delivered
// a laser.
//
// A lump of dung flung off a shovel is not a laser, so the fix is to make the
// mechanic honest rather than to delete the visual: the pellet travels, and it
// damages what it touches, when it touches it.
//
// The one thing that must not be got wrong is TUNNELLING. A pellet at 60 m/s
// moves a metre per frame at 60 fps and far more on a slow frame, so testing
// "is the pellet inside someone" only at each frame's end would shoot straight
// through a body. Every test below is done against the SEGMENT the pellet swept
// this frame, not against its final point.

// Closest distance between a point and a segment, and where along the segment
// that closest approach happens (0..1).
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

// Which target this frame's sweep hits FIRST, if any.
//
//   from/to   the segment the pellet swept this frame
//   targets   [{ id, x, y, z, radius }] — aim points, already filtered to
//             things this pellet is allowed to hurt
//
// Returns { id, t, dist } for the earliest contact along the sweep, or null.
// "Earliest" matters: firing down a corridor with two enemies in line must hit
// the near one, and taking the smallest distance instead of the smallest t
// would sometimes pick the far one because the pellet passed closer to its
// centre.
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

// Does the sweep run into solid world geometry, and if so how far along?
//
// Stepped rather than exact: a voxel grid has no cheap analytic ray test here,
// and a step of a third of a voxel is finer than any wall in the game is thin.
// Returns the fraction along the segment where it stopped, or null.
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

// One frame of one projectile. Pure: it does not mutate anything, it reports.
//
// Returns:
//   { kind: 'player', id, point }  — hit somebody
//   { kind: 'world',  point }      — hit the map
//   { kind: 'expire' }             — ran out of life or range
//   null                           — still flying
//
// A player hit BEATS a world hit at the same instant only when it happens
// earlier along the sweep, which is what stops a pellet killing someone
// through the wall they are standing behind.
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
