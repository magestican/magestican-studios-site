
















































export const SPRING_UP = 15.5;









export const SPRING_FORWARD = 1.35;









export const SPRING_COOLDOWN = 0.9;


export const SPRING_RADIUS = 1.6;









export const SPRING_OFFSET = 9;
















export function springSites(lanes) {
  const out = [];
  for (const lane of lanes) {
    const c = lane.choke;
    
    
    const px = -c.hz;
    const pz = c.hx;
    for (const side of [-1, 1]) {
      out.push({
        x: c.x + px * SPRING_OFFSET * side,
        z: c.z + pz * SPRING_OFFSET * side,
        laneId: lane.id,
        side: side > 0 ? 'left' : 'right',
      });
    }
  }
  return out;
}


export function newSpringState() {
  return { cooldown: 0 };
}







export function springUnder(sites, x, z, { grounded = true, state = null } = {}) {
  if (!grounded) return null;
  if (state && state.cooldown > 0) return null;
  for (const s of sites || []) {
    if (Math.hypot(x - s.x, z - s.z) <= SPRING_RADIUS) return s;
  }
  return null;
}










export function springLaunch({ vx = 0, vz = 0 }, { up = SPRING_UP, forward = SPRING_FORWARD } = {}) {
  return { vx: vx * forward, vy: up, vz: vz * forward };
}


export function stepSpring(state, dt) {
  if (!state) return;
  state.cooldown = Math.max(0, (state.cooldown || 0) - dt);
}


export function armCooldown(state, seconds = SPRING_COOLDOWN) {
  if (state) state.cooldown = seconds;
}
