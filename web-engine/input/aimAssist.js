// Aim assist — PURE MATH, no THREE, no DOM, so the whole thing is testable.
//
// Bryan 2026-08-21: "an aim help system that can be turned off, an auto aim
// sort of, which only slightly moves the cursor in the direction of the
// closest enemy, so long as the enemy is only a few pixels from the x or y
// axis of my current aim".
//
// The design constraint in that sentence is "only slightly" and "only a few
// pixels". This is assist, not aimbot: it must be impossible to notice as a
// takeover, and it must never point the camera at somebody you were not
// already very nearly pointing at. Three rules follow:
//
//   1. A HARD CONE. Outside `maxAngle` the assist contributes exactly zero —
//      not a small amount, zero. This is what stops it sweeping across a
//      crowded map.
//   2. FALLOFF INSIDE THE CONE. Strength is highest dead centre and eases to
//      nothing at the cone edge, so there is no step you can feel as a snap
//      when a target crosses the boundary.
//   3. A RATE CAP. The correction is a maximum of `maxRate` radians per
//      second regardless of how far off you are, so it always reads as drift
//      rather than as the game moving your hands.
//
// Everything is expressed in yaw/pitch radians because that is what the player
// controller actually stores; "a few pixels" is converted to an angle by the
// caller's FOV, which is the only honest way to keep it resolution-independent.

export const AIM_ASSIST = Object.freeze({
  // Half-angle of the assist cone, radians. ~3.2 deg — at a 75 deg vertical
  // FOV on a 1080-tall screen that is roughly 45 px from the crosshair, which
  // is the "few pixels" the ask describes, generously read.
  maxAngle: 0.056,
  // Peak correction rate, radians/second, at the centre of the cone.
  maxRate: 1.15,
  // Beyond this many metres a target is ignored: assist is for the fight in
  // front of you, not for picking someone off across the map.
  maxDistance: 42,
  // Below this angular error the assist stops entirely, so a target you are
  // already on does not jitter under a correction that can never settle.
  deadZone: 0.004,
});

// Shortest signed difference between two angles, in (-PI, PI].
export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Convert a world position into the yaw/pitch a viewer at `eye` would need.
// Matches the player controller's convention: yaw 0 looks +Z, and
// dir = (cos(pitch)sin(yaw), sin(pitch), cos(pitch)cos(yaw)).
export function aimAnglesTo(eye, target) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dz = target.z - eye.z;
  const flat = Math.hypot(dx, dz);
  return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, flat), dist: Math.hypot(flat, dy) };
}

// The whole feature. Returns the yaw/pitch NUDGE to add this frame.
//
//   eye      {x,y,z}      camera position
//   yaw,pitch             where the player is currently looking
//   targets  [{x,y,z}]    candidate enemy AIM POINTS (already filtered to
//                         living enemies by the caller — this module has no
//                         opinion about teams)
//   dt                    seconds since last frame
//   cfg                   override AIM_ASSIST for tests/tuning
//
// Returns { yaw: 0, pitch: 0 } when disabled, when nothing is in the cone, or
// when the best target is already centred.
export function computeAimAssist({ eye, yaw, pitch, targets, dt, enabled = true,
                                   cfg = AIM_ASSIST }) {
  const none = { yaw: 0, pitch: 0 };
  if (!enabled || !targets || !targets.length || !dt) return none;

  // Pick the target with the smallest ANGULAR error, not the nearest one. The
  // enemy you are closest to pointing at is the one you meant; the physically
  // nearest may be off to your side and dragging toward them would be the
  // assist fighting you.
  let best = null, bestErr = Infinity;
  for (const t of targets) {
    const a = aimAnglesTo(eye, t);
    if (a.dist > cfg.maxDistance) continue;
    const dYaw = angleDelta(yaw, a.yaw);
    const dPitch = angleDelta(pitch, a.pitch);
    // Yaw error is compressed toward the poles; scale it by cos(pitch) so the
    // cone is a cone rather than a lune when looking up or down.
    const err = Math.hypot(dYaw * Math.cos(pitch), dPitch);
    if (err < bestErr) { bestErr = err; best = { dYaw, dPitch }; }
  }
  if (!best || bestErr > cfg.maxAngle || bestErr < cfg.deadZone) return none;

  // Falloff: 1 at the centre, 0 at the cone edge, smooth in between so there
  // is no perceptible step as a target enters or leaves the cone.
  const f = 1 - (bestErr / cfg.maxAngle);
  const strength = f * f;               // ease-out; weak at the rim by design
  const maxStep = cfg.maxRate * strength * dt;
  const scale = Math.min(1, maxStep / bestErr);
  return { yaw: best.dYaw * scale, pitch: best.dPitch * scale };
}
