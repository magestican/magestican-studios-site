


















export const CAMERA = Object.freeze({
  
  yawRad: 0,
  pitchDeg: 35,
  landscape: Object.freeze({ fovDeg: 38, distanceM: 12 }),
  portrait: Object.freeze({ fovDeg: 50, distanceM: 10 }),
  
  
  aimHeightM: 0.6,
  
  
  followPerS: 7,
  
  
  
  leadS: 0.36,
  leadMaxM: 1.5,
});


export function framing(aspect, cfg = CAMERA) {
  const portrait = aspect < 1;
  const f = portrait ? cfg.portrait : cfg.landscape;
  return { portrait, fovDeg: f.fovDeg, distanceM: f.distanceM };
}


export function aimPoint(player, groundY, cfg = CAMERA) {
  let lx = (player.vx || 0) * cfg.leadS;
  let lz = (player.vz || 0) * cfg.leadS;
  const len = Math.hypot(lx, lz);
  if (len > cfg.leadMaxM) {
    lx *= cfg.leadMaxM / len;
    lz *= cfg.leadMaxM / len;
  }
  return { x: player.x + lx, y: groundY + cfg.aimHeightM, z: player.z + lz };
}


export function createFollow(goal) {
  return { x: goal.x, y: goal.y, z: goal.z, vx: 0, vy: 0, vz: 0, gx: goal.x, gy: goal.y, gz: goal.z };
}

const AXES = [['x', 'vx', 'gx'], ['y', 'vy', 'gy'], ['z', 'vz', 'gz']];








export function followStep(s, goal, dt, cfg = CAMERA) {
  if (!(dt > 0)) return { ...s };
  const w = cfg.followPerS;
  const decay = Math.exp(-w * dt);
  const out = {};
  for (const [p, v, g] of AXES) {
    const gv = (goal[p] - s[g]) / dt;
    const u0 = s[p] - s[g] + (2 * gv) / w;
    const du0 = s[v] - gv;
    const temp = (du0 + w * u0) * dt;
    out[p] = goal[p] + (u0 + temp) * decay - (2 * gv) / w;
    out[v] = (du0 - w * temp) * decay + gv;
    out[g] = goal[p];
  }
  return out;
}


export function cameraPose(focus, frame, cfg = CAMERA) {
  const pitch = (cfg.pitchDeg * Math.PI) / 180;
  const flat = Math.cos(pitch) * frame.distanceM;
  return {
    position: {
      x: focus.x + Math.sin(cfg.yawRad) * flat,
      y: focus.y + Math.sin(pitch) * frame.distanceM,
      z: focus.z + Math.cos(cfg.yawRad) * flat,
    },
    target: { x: focus.x, y: focus.y, z: focus.z },
  };
}
