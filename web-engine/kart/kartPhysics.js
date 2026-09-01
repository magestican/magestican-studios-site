
































import { chargeRate, boostForCharge, applyBoost, driftTier } from './driftBoost.js';
import { glideFields, glideStep, glideSink, glideCruise } from './glide.js';
import { CAMBER_GRIP } from './trackCamber.js';
import {
  grindFields, grindStep, grindHeight, canGrind, GRIND_LAUNCH_GRACE,
} from './railGrind.js';
import { waterFields, boatStep, boatFloat, impactKeep } from './water.js';





export const GRAVITY = 26;








export const LAUNCH_MAX = 14;






export const JUMP_SPEED = 7.9;



export const JUMP_COOLDOWN = 0.28;









export const HOP_TIME = 0.18;




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
    
    
    ...glideFields(),
    
    
    ...grindFields(),
    ...waterFields(),
    
    
    speed: 0,
    slip: 0,
    
    
    
    
    
    
    bankRoll: 0,
    steerVisual: 0,
    yawRate: 0,
    launched: 0,
    landed: false,
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
  const s = { ...state, justBoosted: null, respawned: false, launched: 0, landed: false };
  const throttle = clamp(input.throttle ?? 0, -1, 1);

  
  s.spinTime = Math.max(0, s.spinTime - dt);
  s.squashTime = Math.max(0, s.squashTime - dt);
  s.shielded = Math.max(0, s.shielded - dt);
  s.invuln = Math.max(0, s.invuln - dt);
  s.hopTime = Math.max(0, s.hopTime - dt);
  s.jumpCooldown = Math.max(0, s.jumpCooldown - dt);
  
  
  
  s.railLaunch = Math.max(0, (s.railLaunch ?? 0) - dt);
  s.jumped = false;
  if (s.boost) {
    s.boost = { ...s.boost, time: s.boost.time - dt };
    if (s.boost.time <= 0) s.boost = null;
  }

  const spinning = s.spinTime > 0;
  const boostPower = s.boost ? s.boost.power : 1;

  
  
  
  
  
  
  
  
  
  
  
  
  
  const groundY = surface.groundY ?? surface.y ?? 0;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const grind = grindStep(s, input, {
    rail: surface.rail ?? null,
    dt,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    enabled: canGrind(s),
  });
  const boat = boatStep(s, input, {
    water: surface.water ?? null,
    dt,
    enabled: !grind.grinding,
  });
  s.grinding = grind.grinding;
  s.grindTime = grind.grindTime;
  s.grindSide = grind.grinding ? grind.side : 0;
  s.grindCharge = grind.charge;
  s.grindMount = grind.mount;
  s.wheelie = grind.wheelie;
  s.grindArmed = grind.armed;
  s.grindStarted = grind.started;
  s.grindEnded = grind.ended;
  if (grind.ended && grind.boost) {
    s.boost = applyBoost(s.boost, grind.boost);
    s.justBoosted = grind.boost;
  }
  
  
  
  
  
  if (grind.ended === 'jump') s.railLaunch = GRIND_LAUNCH_GRACE;
  
  
  if (grind.started && s.drifting) { s.drifting = 0; s.driftCharge = 0; }

  const wasBoating = s.boating;
  s.boating = boat.boating;
  s.boatTime = boat.boatTime;
  
  
  
  
  
  s.boatPlaneY = boat.boating ? boat.planeY : 0;
  s.splashed = boat.started;
  s.beached = boat.ended && wasBoating;
  s.splashVy = boat.started ? s.vy : 0;
  
  
  s.adriftTime = boat.boating && boat.chasm ? (s.adriftTime ?? 0) + dt : 0;
  if (boat.started) {
    
    
    
    
    
    const keep = impactKeep(s.vy);
    s.vx *= keep;
    s.vz *= keep;
    
    
    
    s.drifting = 0;
    s.driftCharge = 0;
  }

  s.airTime = s.grounded ? 0 : s.airTime + dt;
  
  
  
  s.airHeight = s.grounded ? 0 : Math.max(s.airHeight, s.y - groundY);
  const glide = glideStep(s, input, {
    
    
    
    height: s.grinding ? 0 : s.airHeight,
    dt,
    
    
    
    
    
    
    
    
    enabled: !s.grinding && !s.boating,
    
    
    
    
    declared: surface.glide === true,
  });
  s.gliding = glide.gliding;
  s.glideTime = glide.glideTime;
  s.glideDive = glide.dive;
  s.glideStarted = glide.started;
  s.glideLanded = false;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (input.jump && s.grounded && !spinning && !s.grinding && !s.boating && s.jumpCooldown <= 0) {
    s.vy = JUMP_SPEED;
    s.grounded = false;
    s.jumpCooldown = JUMP_COOLDOWN;
    s.jumped = true;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  if (!spinning && !s.grinding && !s.boating && (s.grounded || s.hopTime > 0)) {
    if (!s.drifting && s.hopTime <= 0 && s.grounded && !s.jumped && driftEntry(input, s)) {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      s.hopTime = HOP_TIME;
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
  } else if (s.grinding) {
    
    
    
    s.yawRate = 0;
    s.heading = grind.heading;
  } else {
    const authority = steerAuthority(s.speed, t);
    
    
    const dirSign = s.speed < -0.5 ? -1 : 1;
    
    
    
    const driftGain = s.drifting ? 1.32 : 1;
    
    
    
    
    
    
    
    const air = s.boating
      ? boat.steer
      : (s.grounded ? 1 : (s.gliding ? glide.steer : 0.35));
    
    
    
    
    
    
    
    
    
    s.yawRate = -steer * t.turnRate * authority * driftGain * dirSign * air;
    s.heading += s.yawRate * dt;
  }

  
  const fwd = forwardOf(s.heading);
  const offRoad = !surface.onRoad;
  const squashed = s.squashTime > 0;
  
  
  
  
  
  const capBase = t.topSpeed * boostPower * (squashed ? 0.62 : 1);
  
  
  
  
  const surfaceScale = s.boating ? boat.speedScale : (offRoad ? t.offRoadSpeed : 1);
  const speedCap = capBase * surfaceScale;

  
  
  
  let vf = s.vx * fwd.x + s.vz * fwd.z;

  let along = 0;   
  if (s.grinding) {
    
    
    
    
    
    along = 0;
  } else if (s.gliding) {
    
    
    
    
    
    along = 0;
  } else if (spinning) {
    along = -vf * 3.2;
  } else if (throttle > 0.02) {
    
    
    
    
    
    
    
    
    const head = clamp((speedCap - vf) / (speedCap * 0.35), 0, 1);
    along = t.accel * throttle * head * (s.boost ? 2.1 : 1) * (s.boating ? boat.accelScale : 1);
  } else if (throttle < -0.02) {
    along = vf > 0.4
      ? t.brake * throttle
      : (vf > -t.reverseSpeed ? t.brake * 0.42 * throttle : 0);
  } else if (s.boating) {
    
    
    
    along = -Math.sign(vf) * boat.drag;
    if (Math.abs(vf) < 0.2) along = 0;
  } else {
    
    
    along = -Math.sign(vf) * t.drag * (t.topSpeed / 30) * 4;
    if (Math.abs(vf) < 0.2) along = 0;
  }
  
  
  
  if (offRoad && !spinning && !s.boating && !s.grinding) along -= Math.sign(vf) * t.offRoadDrag;

  s.vx += fwd.x * along * dt;
  s.vz += fwd.z * along * dt;

  
  
  
  
  
  
  
  
  
  
  
  
  
  vf = s.vx * fwd.x + s.vz * fwd.z;
  const ground = Math.hypot(s.vx, s.vz);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const launchCap = s.railLaunch > 0 ? capBase * (s.boating ? surfaceScale : 1) : speedCap;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (!s.boost && !s.gliding && !s.grinding && ground > launchCap && vf > 0) {
    const reachable = Math.max(launchCap, ground - t.brake * dt);
    const scale = reachable / ground;
    s.vx *= scale;
    s.vz *= scale;
  }
  if (vf < -t.reverseSpeed) {
    const excess = vf + t.reverseSpeed;
    s.vx -= fwd.x * excess;
    s.vz -= fwd.z * excess;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const crossSlope = surface.crossSlope ?? 0;
  s.bankRoll = Math.atan(crossSlope);
  if (crossSlope !== 0 && s.grounded && !s.gliding && !s.grinding && !s.boating) {
    const a = -GRAVITY * crossSlope * CAMBER_GRIP * dt;
    
    
    s.vx += (surface.nx ?? 0) * a;
    s.vz += (surface.nz ?? 0) * a;
  }

  
  
  
  
  
  const speedNow = Math.hypot(s.vx, s.vz);
  if (s.grinding) {
    
    
    
    
    
    s.vx = Math.sin(grind.heading) * grind.speed;
    s.vz = Math.cos(grind.heading) * grind.speed;
    s.slip = 0;
  } else if (speedNow > 0.05) {
    const drifting = !!s.drifting;
    const surfaceGrip = surface.gripScale ?? 1;
    
    
    
    
    
    
    const air = s.grounded ? 1 : (s.gliding ? glide.grip : 0.06);
    
    
    
    
    
    
    
    
    
    const gripTurn = s.boating
      ? boat.gripTurn
      : (drifting ? t.driftGripTurn : t.gripTurn) * surfaceGrip * air;
    const maxSlip = s.boating
      ? boat.maxSlip
      : (drifting ? t.driftMaxSlip : t.maxSlip) / Math.max(surfaceGrip, 0.35);

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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (s.drifting && s.hopTime > 0 && speedNow > 1) {
    
    
    
    
    const kick = s.drifting * t.driftMaxSlip * Math.min(dt, s.hopTime) / HOP_TIME;
    const dir = Math.atan2(s.vx, s.vz) + kick;
    const mag = Math.hypot(s.vx, s.vz);
    s.vx = Math.sin(dir) * mag;
    s.vz = Math.cos(dir) * mag;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (grind.ended === 'jump' && grind.exitSpeed > 0) {
    const was = Math.hypot(s.vx, s.vz);
    if (was > 1e-6) {
      if (grind.exitSpeed > was) {
        const scale = grind.exitSpeed / was;
        s.vx *= scale;
        s.vz *= scale;
      }
    } else {
      
      
      
      
      s.vx = fwd.x * grind.exitSpeed;
      s.vz = fwd.z * grind.exitSpeed;
    }
  }

  
  
  
  
  
  if (s.gliding) {
    const was = Math.hypot(s.vx, s.vz);
    const want = glideCruise(was, glide.cruise, dt);
    if (was > 1e-6) {
      const scale = want / was;
      s.vx *= scale;
      s.vz *= scale;
    } else {
      
      
      s.vx = fwd.x * want;
      s.vz = fwd.z * want;
    }
  }

  s.speed = s.vx * fwd.x + s.vz * fwd.z;
  s.groundSpeed = Math.hypot(s.vx, s.vz);

  
  
  
  
  
  
  
  
  if (s.grinding) {
    
    
    
    
    
    s.y = grindHeight(s.y, grind.y, grind.mount);
    s.vy = 0;
    s.grounded = false;
  } else if (grind.ended === 'jump') {
    
    
    
    s.vy = JUMP_SPEED;
    s.grounded = false;
    s.jumped = true;
    s.jumpCooldown = JUMP_COOLDOWN;
    const inward = -(grind.side || 1);
    s.vx += (surface.nx ?? 0) * inward * grind.push;
    s.vz += (surface.nz ?? 0) * inward * grind.push;
  } else if (s.boating) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const f = boatFloat(s.y, s.vy, boat.planeY, dt, GRAVITY, groundY);
    s.y = f.y;
    s.vy = f.vy;
    s.grounded = true;
    s.airTime = 0;
    s.airHeight = 0;
    if (s.gliding) {
      s.gliding = false;
      s.glideTime = 0;
      s.glideDive = false;
      s.glideLanded = true;
    }
  } else if (!s.grounded || s.y > groundY + 1e-4) {
    
    
    
    s.vy = s.gliding ? glideSink(s.vy, glide.sink, GRAVITY, dt) : s.vy - GRAVITY * dt;
    s.y += s.vy * dt;
    if (s.y <= groundY) {
      s.y = groundY; s.vy = 0; s.grounded = true; s.landed = true;
      
      
      
      
      
      
      
      
      
      
      s.airTime = 0;
      s.airHeight = 0;
      if (s.gliding) {
        s.gliding = false;
        s.glideTime = 0;
        s.glideDive = false;
        s.glideLanded = true;
      }
    } else s.grounded = false;
  } else {
    s.y = groundY;
    s.vy = 0;
    s.grounded = true;
  }

  
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (s.gliding || s.grinding) {
    
    
    
    
    
    
    
    
    
    
    
  } else if (s.glideLanded) {
    s.lostTime = 0;
  } else {
    s.lostTime = surface.lost ? s.lostTime + dt : 0;
  }

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



















export function launchKart(kart, vy) {
  if (!kart.grounded) return kart;          
  const v = Math.max(0, Math.min(LAUNCH_MAX, vy));
  if (v <= 0) return kart;
  kart.vy = v;
  kart.grounded = false;
  kart.launched = v;
  return kart;
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
    
    
    
    airTime: 0,
    airHeight: 0,
    gliding: false,
    glideTime: 0,
    glideDive: false,
    glideStarted: false,
    glideLanded: false,
    
    
    
    
    ...grindFields(),
    ...waterFields(),
    drifting: 0,
    driftCharge: 0,
    spinTime: 0,
    squashTime: 0,
    lostTime: 0,
    invuln: Math.max(state.invuln, 1.2),
    respawned: true,
  };
}
