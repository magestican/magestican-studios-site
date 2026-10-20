




import { abilityAfterMove, abilityGravity, abilityHorizontal, abilityJumps, abilityState, lanternStep } from './abilities.js';
import { bufferOk, cornerCorrect, coyoteOk, ledgeAssist } from './assists.js';
import { onGround, sweepX, sweepY, touchingWall } from './body.js';
import { climbStep, onBark } from './climb.js';
import * as K from './constants.js';
import { snareStep } from './enemies/aunt.js';
import { LAUNCH_GAIN, MAX_BOOST } from './heave.js';
import { spinUnder } from './pins.js';
import { raftById } from './raft.js';
import { rideStep, wakeStep } from './slipstream.js';
import { tetherAfterMove, tetherStep } from './tether.js';
import { WEB } from './web.js';
import { gustDx, windCushion } from './wind.js';






export const NO_INPUT = Object.freeze({ x: 0, down: false, jump: false });


export function createPlayer(x, y, facing = 1) {
  return {
    x,
    y,
    w: K.BODY_W,
    h: K.BODY_H,
    vx: 0,
    vy: 0,
    px: x, 
    py: y,
    facing,
    grounded: false,
    sinceGrounded: Number.POSITIVE_INFINITY,
    sincePressed: Number.POSITIVE_INFINITY,
    jumpedThisAir: false,
    rising: false, 
    jumpTime: 0,
    cut: false,
    skid: 0, 
    skidRate: 0,
    prevJump: false,
    airPeak: y, 
    takeoffY: y,
    climbing: false, 
    abilities: new Set(), 
    ab: abilityState(),
    vyLanding: 0, 
    gliding: false, 
    wasGliding: false,
    
    ride: null,
    
    wake: null,
    wakeCool: 0, 
    
    raft: null,
    carryVx: 0, 
    
    carryFrom: null,
    
    tether: null,
    prevTether: false,
    tetherCool: 0, 
    tetherBuf: 0, 
    
    tetherAim: null,
    
    events: [],
  };
}



const approach = (v, target, delta) => (v < target ? Math.min(v + delta, target) : Math.max(v - delta, target));





export function stepPlayer(p, held, world) {
  const S = K.STEP;
  p.events.length = 0;
  
  const glooped = p.ab?.gloop > 0;
  if (glooped) p.ab.gloop -= S;
  
  const snared = p.snared > 0 && snareStep(p, held);
  const input = glooped || snared ? NO_INPUT : held;
  if (p.flingT > 0) p.flingT -= S; 
  p.px = p.x;
  p.py = p.y;
  const dir = input.x > 0.25 ? 1 : input.x < -0.25 ? -1 : 0;
  const pressed = input.jump && !p.prevJump;
  p.prevJump = input.jump;
  p.sincePressed = pressed ? 0 : p.sincePressed + S;
  if (!p.grounded) p.sinceGrounded += S;

  p.wasGliding = p.gliding;
  p.gliding = false;
  if (p.wakeCool > 0) p.wakeCool -= S;
  
  const roped = world.hooks ? tetherStep(p, input, pressed, dir, world) : false;
  
  const carried = roped || (p.ride ? rideStep(p) : p.wake ? wakeStep(p, input, pressed) : false);
  
  const top = p.abilities?.has('lantern') ? lanternStep(p, input, onBark(world, p)) : K.RUN_SPEED;
  if (carried) {
    
  } else if (!climbStep(p, input, world, dir, pressed)) {
    horizontal(p, dir, input, top);
    abilityHorizontal(p, input, dir);
    if (p.webOn) webPress(p, input, pressed); 
    tryJump(p);
    abilityJumps(p, input, world);
    variableHeight(p, input);
    if (!abilityGravity(p, input, dir, world)) gravity(p, input);
    if (world.updrafts) windCushion(world, p);
  } else p.ab.glideArm = false;

  
  const vxBefore = p.vx;
  if (p.grounded && p.raft !== null) {
    p.carryVx = raftById(world.raftState, p.raft)?.vx ?? 0;
    p.carryFrom = p.raft;
  } else if (world.spins && p.grounded) {
    p.carryVx = spinUnder(world, p)?.vx ?? 0; 
  }
  const dx0 = p.vx * S + (world.gusts && !carried ? gustDx(world, p) : 0);
  const mx = sweepX(world, p, p.carryVx ? dx0 + p.carryVx * S : dx0);
  p.x = mx.x;
  if (mx.hit) {
    p.vx = 0;
    p.carryVx = 0; 
    p.carryFrom = null;
  }
  let dy = p.vy * S;
  let my = sweepY(world, p, dy);
  if (my.hit && dy > 0) {
    const shift = cornerCorrect(world, p, dy);
    if (shift !== null) {
      p.x += shift;
      my = sweepY(world, p, dy);
      p.events.push({ type: 'corner', shift });
    }
  }
  p.y = my.y;
  p.floor = my.floor ?? null; 
  
  if (my.floor) p.floorVs = Math.max(0, my.floor.vs);
  else if (my.hit) p.floorVs = 0;
  if (my.hit) {
    if (dy > 0) {
      p.events.push({ type: 'bonk' });
      p.rising = false;
    }
    if (dy < 0) dy = 0;
    p.vy = 0;
  }
  if (p.tether) tetherAfterMove(p, mx.hit || my.hit);

  
  if (!my.hit || dy > 0) {
    if (dir !== 0 && p.vy <= K.APEX_HANG_SPEED && touchingWall(world, p, dir)) {
      const to = ledgeAssist(world, p, dir);
      if (to) {
        p.x = to.x;
        p.y = to.y;
        p.vy = 0;
        p.vx = vxBefore || dir * K.RUN_SPEED * 0.5;
        p.events.push({ type: 'mantle' });
      }
    }
  }

  
  const wasGrounded = p.grounded;
  p.grounded = p.vy <= 0 && onGround(world, p);
  if (world.raftState) {
    const deck = p.grounded && my.floor?.raft ? my.floor : null;
    if (p.grounded && !deck) {
      p.carryVx = 0; 
      p.carryFrom = null;
    }
    if (deck && !wasGrounded)
      p.events.push({ type: 'raftLand', id: deck.id, x: p.x, y: p.y, speed: -p.vyLanding || 0, floats: deck.floats });
    p.raft = deck ? deck.id : null;
  }
  if (p.grounded) {
    if (!wasGrounded) {
      
      p.events.push({ type: 'land', fall: p.airPeak - p.y, speed: -p.vyLanding || 0, ...(p.floor?.web ? { web: p.floor.web } : {}) });
    }
    p.sinceGrounded = 0;
    p.jumpedThisAir = false;
    p.rising = false;
    p.cut = false;
    p.airPeak = p.y;
    
    if (!wasGrounded && my.floor?.web && -p.vyLanding >= WEB.TAKE) {
      if (bufferOk(p.sincePressed)) pumpPress(p);
    } else if (!wasGrounded) tryJump(p);
  } else {
    if (wasGrounded && !p.jumpedThisAir) {
      p.events.push({ type: 'leave' });
      if (p.floorVs > 0) p.vy = Math.max(p.vy, p.floorVs); 
    }
    if (p.y > p.airPeak) p.airPeak = p.y;
  }
  abilityAfterMove(p, world, dir, p.grounded && !wasGrounded);
  if (p.grounded) p.gliding = false;
  if (p.gliding !== p.wasGliding) p.events.push({ type: p.gliding ? 'glideStart' : 'glideEnd', x: p.x, y: p.y });
  p.vyLanding = p.vy;
  if (dir !== 0) p.facing = dir;
  return p;
}


function horizontal(p, dir, input, top) {
  const S = K.STEP;
  if (p.grounded) {
    const moving = Math.sign(p.vx);
    if (dir !== 0 && moving !== 0 && dir !== moving && p.skid <= 0) {
      if (Math.abs(p.vx) <= K.RUN_SPEED * K.TURN_FLIP_FRACTION) {
        p.vx = -p.vx; 
        p.events.push({ type: 'turn' });
      } else {
        p.skid = K.TURN_SKID_TIME;
        p.skidRate = Math.abs(p.vx) / K.TURN_SKID_TIME;
        p.events.push({ type: 'skid' });
      }
    }
    if (p.skid > 0) {
      p.skid -= S;
      p.vx = approach(p.vx, 0, p.skidRate * S);
      if (p.vx === 0 || p.skid <= 0) p.skid = 0;
      return;
    }
    if (dir !== 0) p.vx = approach(p.vx, dir * top, (Math.sign(p.vx) === -dir ? K.GROUND_DECEL : K.GROUND_ACCEL) * S);
    else p.vx = approach(p.vx, 0, K.GROUND_DECEL * S);
    return;
  }
  p.skid = 0;
  if (p.flingT > 0 && dir !== -Math.sign(p.vx)) return; 
  const cap = top * (input.jump ? K.AIR_CARRY_HELD : K.AIR_CARRY_RELEASED);
  if (dir !== 0) {
    const target = dir * cap;
    const speeding = Math.sign(p.vx) === dir && Math.abs(p.vx) > cap;
    const rate = speeding || Math.sign(p.vx) === -dir ? K.GROUND_DECEL : K.GROUND_ACCEL;
    p.vx = approach(p.vx, target, rate * K.AIR_CONTROL * S);
  } else {
    p.vx = approach(p.vx, 0, K.GROUND_DECEL * K.AIR_CONTROL * S);
  }
}


function webPress(p, input, pressed) {
  if (input.down && pressed && p.grounded) {
    p.dropWeb = p.webOn;
    p.sincePressed = Number.POSITIVE_INFINITY;
    p.grounded = false;
    p.events.push({ type: 'webDrop', id: p.webOn, x: p.x, y: p.y });
  } else if (p.webStretch && bufferOk(p.sincePressed)) pumpPress(p);
}

function pumpPress(p) {
  p.pumpPress = true;
  p.sincePressed = Number.POSITIVE_INFINITY; 
  p.events.push({ type: 'pumpPress', x: p.x, y: p.y });
}


function tryJump(p) {
  if (!bufferOk(p.sincePressed)) return;
  const fromCoyote = !p.grounded && coyoteOk(p.sinceGrounded, p.jumpedThisAir);
  if (!p.grounded && !fromCoyote) return;
  const buffered = p.sincePressed > 0;
  
  const boost = p.grounded || fromCoyote ? Math.min(MAX_BOOST, (p.floorVs ?? 0) * LAUNCH_GAIN) : 0;
  p.vy = K.JUMP_VELOCITY + boost;
  if (boost >= 2) p.events.push({ type: 'heaveLaunch', vs: boost });
  p.grounded = false;
  p.jumpedThisAir = true;
  p.rising = true;
  p.jumpTime = 0;
  p.cut = false;
  p.skid = 0;
  p.sincePressed = Number.POSITIVE_INFINITY; 
  p.takeoffY = p.y;
  p.airPeak = p.y;
  p.events.push({ type: 'jump', coyote: fromCoyote, buffered });
}


function variableHeight(p, input) {
  if (!p.rising) return;
  if (p.vy <= 0) {
    p.rising = false;
    return;
  }
  p.jumpTime += K.STEP;
  if (!input.jump && !p.cut && p.jumpTime >= K.JUMP_MIN_HOLD - 1e-9) {
    p.vy *= K.JUMP_RELEASE_CUT;
    p.cut = true;
  }
}


function gravity(p, input) {
  if (p.grounded) return;
  let g = K.GRAVITY;
  if (p.vy < 0) g *= K.FALL_GRAVITY;
  if (input.jump && p.jumpedThisAir && !p.cut && Math.abs(p.vy) < K.APEX_HANG_SPEED) g = K.GRAVITY * K.APEX_HANG_GRAVITY;
  p.vy -= g * K.STEP;
  const maxFall = input.down ? K.MAX_FAST_FALL : K.MAX_FALL;
  if (p.vy < -maxFall) p.vy = -maxFall;
}
