// Pure math for a bot's per-frame path step. Zero three.js dependency so
// it's node-testable. See docs/features/bot-pathing.md.
//
// stepBot(state, dt, grid, goal) -> void   (mutates state)
//   state.pos       {x, y, z}    -- world position (y is anchored below)
//   state.wanderDir {x, z}       -- current heading in xz
//   state.wanderT   number       -- seconds until we re-align to goal
//   state.yaw       number       -- facing angle
// grid.isSolid(x, y, z) -> bool
//
// The KEY LESSONS locked by tests:
//   * Collision samples y=2.5 (walkable air ABOVE the barn floor voxel)
//     not y=1.5 (which is INSIDE the floor voxel — the old bug).
//   * On a wall bounce we commit to the new heading for 1.4-2.2s so we
//     escape the wall before snapping back toward the goal.

export const WALK_Y     = 2.5;   // sample height above the barn floor
export const MOVE_SPEED = 4.8;   // m/s
export const TURN_RATE  = 3.5;   // rad/s
export const COMMIT_MIN = 1.4;   // sec, min wander commit after a bounce
export const COMMIT_MAX = 2.2;   // sec, max wander commit after a bounce

export function stepBot(state, dt, grid, goal, rng = Math.random) {
  const toGoalX = goal.x - state.pos.x;
  const toGoalZ = goal.z - state.pos.z;

  // Wander timer: when it expires, re-align to goal with tiny jitter.
  state.wanderT = (state.wanderT ?? 0) - dt;
  if (state.wanderT <= 0) {
    state.wanderT = 0.6 + rng() * 0.7;
    const ang = (rng() - 0.5) * 0.8;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const dx = toGoalX * cos - toGoalZ * sin;
    const dz = toGoalX * sin + toGoalZ * cos;
    const len = Math.hypot(dx, dz);
    if (len > 0) {
      state.wanderDir = { x: dx / len, z: dz / len };
    }
  }
  const wd = state.wanderDir;
  const nextX = state.pos.x + wd.x * MOVE_SPEED * dt;
  const nextZ = state.pos.z + wd.z * MOVE_SPEED * dt;

  if (!grid.isSolid(nextX, WALK_Y, nextZ)) {
    state.pos.x = nextX;
    state.pos.z = nextZ;
  } else {
    // Bounce: rotate wander by up to ±90° and COMMIT for 1.4-2.2s so we
    // don't tick straight back into the same wall.
    const angRand = (rng() - 0.5) * Math.PI;
    const s = Math.sin(angRand), c = Math.cos(angRand);
    state.wanderDir = {
      x: wd.x * c - wd.z * s,
      z: wd.x * s + wd.z * c,
    };
    const l = Math.hypot(state.wanderDir.x, state.wanderDir.z);
    if (l > 0) { state.wanderDir.x /= l; state.wanderDir.z /= l; }
    state.wanderT = COMMIT_MIN + rng() * (COMMIT_MAX - COMMIT_MIN);
  }
  state.pos.y = WALK_Y;

  // Smooth turn.
  const targetYaw = Math.atan2(state.wanderDir.x, state.wanderDir.z);
  let d = (targetYaw - state.yaw) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  state.yaw += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt);
}
