































import { chargeRate, boostForCharge, applyBoost, driftTier } from './driftBoost.js';





export const GRAVITY = 26;






export const JUMP_SPEED = 7.9;



export const JUMP_COOLDOWN = 0.28;




export const CONTACT_RADIUS = 1.55;

const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));









export function createKart({ x = 0, y = 0, z = 0, heading = 0, id = 'p1', tuning }) {
  return {
    id,
    tuning,
    x, y, z,
    heading,
    vx: 0, vz: 0, vy: 0,
    grounded: true,
    
    drifting: 0,          
    driftCharge: 0,       
    hopTime: 0,           
    jumpCooldown: 0,      
    jumped: false,        
                          
                          
    
    boost: null,          
    
    spinTime: 0,          
    squashTime: 0,        
    shielded: 0,          
    invuln: 0,            
                          
                          
    
    pathHint: null,       
    lostTime: 0,          
    
    
    speed: 0,
    slip: 0,
    steerVisual: 0,
    driftTier: 0,
    justBoosted: null,
    respawned: false,
  };
}


export const forwardOf = (h) => ({ x: Math.sin(h), z: Math.cos(h) });





















export const rightOf = (h) => ({ x: -Math.cos(h), z: Math.sin(h) });












export function steerAuthority(speed, tuning) {
  const v = Math.abs(speed);
  const wake = Math.min(1, v / 4.5);
  const half = tuning.topSpeed * 0.5;
  const fast = clamp((v - half) / Math.max(half, 1e-6), 0, 1);
  return wake * (1 - fast * (1 - tuning.handlingBias));
}










export function driftEntry(input, state) {
  if (!input.drift) return 0;
  if (state.drifting) return state.drifting;
  if (Math.abs(state.speed) < 9) return 0;
  if (!state.grounded && state.hopTime <= 0) return 0;
  if (Math.abs(input.steer) < 0.35) return 0;
  return input.steer > 0 ? 1 : -1;
}









export function effectiveSteer(input, drifting) {
  if (!drifting) return { steer: clamp(input.steer, -1, 1), steerLock: 0 };
  
  
  
  
  
  
  
  
  const bias = clamp(input.steer * drifting, -1, 1);
  const mag = clamp(0.66 + bias * 0.52, 0.12, 1.15);
  return { steer: drifting * mag, steerLock: clamp((mag - 0.12) / 1.03, 0, 1) };
}












export function stepKart(state, input, surface, dt) {
  const t = state.tuning;
  const s = { ...state, justBoosted: null, respawned: false };
  const throttle = clamp(input.throttle ?? 0, -1, 1);

  
  s.spinTime = Math.max(0, s.spinTime - dt);
  s.squashTime = Math.max(0, s.squashTime - dt);
  s.shielded = Math.max(0, s.shielded - dt);
  s.invuln = Math.max(0, s.invuln - dt);
  s.hopTime = Math.max(0, s.hopTime - dt);
  s.jumpCooldown = Math.max(0, s.jumpCooldown - dt);
  s.jumped = false;
  if (s.boost) {
    s.boost = { ...s.boost, time: s.boost.time - dt };
    if (s.boost.time <= 0) s.boost = null;
  }

  const spinning = s.spinTime > 0;
  const boostPower = s.boost ? s.boost.power : 1;

  
  
  
  
  if (input.jump && s.grounded && !spinning && s.jumpCooldown <= 0) {
    s.vy = JUMP_SPEED;
    s.grounded = false;
    s.jumpCooldown = JUMP_COOLDOWN;
    s.jumped = true;
  }

  
  
  
  
  
  
  
  
  
  if (!spinning && (s.grounded || s.hopTime > 0)) {
    if (input.drift && !s.drifting && s.hopTime <= 0 && s.grounded && !s.jumped && Math.abs(s.speed) >= 9) {
      
      
      
      
      s.hopTime = 0.18;
      s.vy = 3.4;
      s.grounded = false;
    }
    const dir = driftEntry(input, s);
    if (dir && !s.drifting) { s.drifting = dir; s.driftCharge = 0; }
  }

  if (s.drifting) {
    const holdingDrift = input.drift && !spinning;
    const tooSlow = Math.abs(s.speed) < 6.5;
    if (!holdingDrift || tooSlow) {
      
      
      const reward = boostForCharge(s.driftCharge);
      if (reward) {
        s.boost = applyBoost(s.boost, reward);
        s.justBoosted = reward;
      }
      s.drifting = 0;
      s.driftCharge = 0;
    }
  }

  const { steer, steerLock } = effectiveSteer(input, s.drifting);
  s.steerVisual = steer;

  if (s.drifting) {
    s.driftCharge += chargeRate({
      speed: s.speed, steerLock, onRoad: surface.onRoad, topSpeed: t.topSpeed,
    }) * dt;
  }
  s.driftTier = s.drifting ? driftTier(s.driftCharge) : 0;

  
  if (spinning) {
    
    
    
    
    s.heading += (Math.PI * 2 * 1.5) * (dt / 0.9);
  } else {
    const authority = steerAuthority(s.speed, t);
    
    
    const dirSign = s.speed < -0.5 ? -1 : 1;
    
    
    
    const driftGain = s.drifting ? 1.32 : 1;
    
    
    const air = s.grounded ? 1 : 0.35;
    
    
    
    
    s.heading -= steer * t.turnRate * authority * driftGain * dirSign * air * dt;
  }

  
  const fwd = forwardOf(s.heading);
  const offRoad = !surface.onRoad;
  const squashed = s.squashTime > 0;
  const speedCap = t.topSpeed
    * boostPower
    * (offRoad ? t.offRoadSpeed : 1)
    * (squashed ? 0.62 : 1);

  
  
  
  let vf = s.vx * fwd.x + s.vz * fwd.z;

  let along = 0;   
  if (spinning) {
    along = -vf * 3.2;
  } else if (throttle > 0.02) {
    
    
    
    
    
    
    
    
    const head = clamp((speedCap - vf) / (speedCap * 0.35), 0, 1);
    along = t.accel * throttle * head * (s.boost ? 2.1 : 1);
  } else if (throttle < -0.02) {
    along = vf > 0.4
      ? t.brake * throttle
      : (vf > -t.reverseSpeed ? t.brake * 0.42 * throttle : 0);
  } else {
    
    
    along = -Math.sign(vf) * t.drag * (t.topSpeed / 30) * 4;
    if (Math.abs(vf) < 0.2) along = 0;
  }
  if (offRoad && !spinning) along -= Math.sign(vf) * t.offRoadDrag;

  s.vx += fwd.x * along * dt;
  s.vz += fwd.z * along * dt;

  
  
  
  
  
  
  
  
  
  
  
  
  
  vf = s.vx * fwd.x + s.vz * fwd.z;
  const ground = Math.hypot(s.vx, s.vz);
  if (!s.boost && ground > speedCap && vf > 0) {
    const scale = speedCap / ground;
    s.vx *= scale;
    s.vz *= scale;
  }
  if (vf < -t.reverseSpeed) {
    const excess = vf + t.reverseSpeed;
    s.vx -= fwd.x * excess;
    s.vz -= fwd.z * excess;
  }

  
  
  
  
  
  const speedNow = Math.hypot(s.vx, s.vz);
  if (speedNow > 0.05) {
    const drifting = !!s.drifting;
    const surfaceGrip = surface.gripScale ?? 1;
    
    
    const air = s.grounded ? 1 : 0.06;
    const gripTurn = (drifting ? t.driftGripTurn : t.gripTurn) * surfaceGrip * air;
    const maxSlip = (drifting ? t.driftMaxSlip : t.maxSlip) / Math.max(surfaceGrip, 0.35);

    const vdir = Math.atan2(s.vx, s.vz);
    
    let slip = s.heading - vdir;
    while (slip > Math.PI) slip -= Math.PI * 2;
    while (slip < -Math.PI) slip += Math.PI * 2;

    
    
    
    const backwards = Math.abs(slip) > Math.PI / 2;
    if (backwards) slip -= Math.sign(slip) * Math.PI;

    const rot = clamp(slip, -gripTurn * dt, gripTurn * dt);
    let left = slip - rot;
    
    
    
    
    if (Math.abs(left) > maxSlip) left = Math.sign(left) * maxSlip;

    const newDir = s.heading - left - (backwards ? Math.sign(slip || 1) * Math.PI : 0);
    
    
    
    const scrubbed = speedNow * Math.exp(-t.scrub * Math.abs(left) * dt);
    s.vx = Math.sin(newDir) * scrubbed;
    s.vz = Math.cos(newDir) * scrubbed;
    s.slip = left;
  } else {
    s.slip = 0;
  }

  
  
  
  if (s.drifting && s.hopTime > 0.001 && speedNow > 1) {
    
    
    
    
    const kick = s.drifting * 0.5 * dt / 0.18;
    const dir = Math.atan2(s.vx, s.vz) + kick;
    const mag = Math.hypot(s.vx, s.vz);
    s.vx = Math.sin(dir) * mag;
    s.vz = Math.cos(dir) * mag;
  }

  s.speed = s.vx * fwd.x + s.vz * fwd.z;
  s.groundSpeed = Math.hypot(s.vx, s.vz);

  
  const groundY = surface.groundY ?? surface.y ?? 0;
  if (!s.grounded || s.y > groundY + 1e-4) {
    s.vy -= GRAVITY * dt;
    s.y += s.vy * dt;
    if (s.y <= groundY) { s.y = groundY; s.vy = 0; s.grounded = true; }
    else s.grounded = false;
  } else {
    
    
    s.y = groundY;
    s.vy = 0;
    s.grounded = true;
  }

  
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  
  s.lostTime = surface.lost ? s.lostTime + dt : 0;

  return s;
}










export function resolveKartContact(a, b, { restitution = 0.55 } = {}) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const d = Math.hypot(dx, dz);
  if (d >= CONTACT_RADIUS * 2 || d < 1e-6) return [a, b];

  const nx = dx / d;
  const nz = dz / d;
  const overlap = CONTACT_RADIUS * 2 - d;

  const ma = a.tuning.weight;
  const mb = b.tuning.weight;
  const total = ma + mb;
  
  const ax = { ...a, x: a.x - nx * overlap * (mb / total), z: a.z - nz * overlap * (mb / total) };
  const bx = { ...b, x: b.x + nx * overlap * (ma / total), z: b.z + nz * overlap * (ma / total) };

  
  
  
  const rvx = b.vx - a.vx;
  const rvz = b.vz - a.vz;
  const closing = rvx * nx + rvz * nz;
  if (closing > 0) return [ax, bx];

  const j = (-(1 + restitution) * closing) / (1 / ma + 1 / mb);
  ax.vx -= (j * nx) / ma;
  ax.vz -= (j * nz) / ma;
  bx.vx += (j * nx) / mb;
  bx.vz += (j * nz) / mb;

  
  
  const hard = Math.abs(closing) > 9;
  if (hard) {
    if (ax.drifting) { ax.drifting = 0; ax.driftCharge = 0; }
    if (bx.drifting) { bx.drifting = 0; bx.driftCharge = 0; }
  }
  return [ax, bx];
}









export function respawnKart(state, place, { after = 2.4, keepSpeed = 0.28 } = {}) {
  if (state.lostTime < after) return state;
  const fwd = forwardOf(place.heading);
  const v = Math.max(6, Math.abs(state.speed) * keepSpeed);
  return {
    ...state,
    x: place.x,
    y: place.y ?? 0,
    z: place.z,
    heading: place.heading,
    vx: fwd.x * v,
    vz: fwd.z * v,
    vy: 0,
    grounded: true,
    speed: v,
    slip: 0,
    drifting: 0,
    driftCharge: 0,
    spinTime: 0,
    squashTime: 0,
    lostTime: 0,
    invuln: Math.max(state.invuln, 1.2),
    respawned: true,
  };
}
