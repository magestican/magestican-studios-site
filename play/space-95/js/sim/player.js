




import { abilityAfterMove, abilityGravity, abilityHorizontal, abilityJumps, abilityState } from './abilities.js';
import { bufferOk, cornerCorrect, coyoteOk, ledgeAssist } from './assists.js';
import { onGround, sweepX, sweepY, touchingWall } from './body.js';
import * as K from './constants.js';






export const NO_INPUT = Object.freeze({ x: 0, down: false, jump: false });


export function createPlayer(x, y) {
  return {
    x,
    y,
    w: K.BODY_W,
    h: K.BODY_H,
    vx: 0,
    vy: 0,
    px: x, 
    py: y,
    facing: 1,
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
    abilities: new Set(), 
    ab: abilityState(),
    vyLanding: 0, 
    
    events: [],
  };
}



const approach = (v, target, delta) => (v < target ? Math.min(v + delta, target) : Math.max(v - delta, target));





export function stepPlayer(p, input, world) {
  const S = K.STEP;
  p.events.length = 0;
  p.px = p.x;
  p.py = p.y;
  const dir = input.x > 0.25 ? 1 : input.x < -0.25 ? -1 : 0;
  const pressed = input.jump && !p.prevJump;
  p.prevJump = input.jump;
  p.sincePressed = pressed ? 0 : p.sincePressed + S;
  if (!p.grounded) p.sinceGrounded += S;

  horizontal(p, dir, input);
  abilityHorizontal(p, input, dir);
  tryJump(p);
  abilityJumps(p, input, world);
  variableHeight(p, input);
  if (!abilityGravity(p, input, dir)) gravity(p, input);

  
  const vxBefore = p.vx;
  const mx = sweepX(world, p, p.vx * S);
  p.x = mx.x;
  if (mx.hit) p.vx = 0;
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
  if (my.hit) {
    if (dy > 0) {
      p.events.push({ type: 'bonk' });
      p.rising = false;
    }
    if (dy < 0) dy = 0;
    p.vy = 0;
  }

  
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
  if (p.grounded) {
    if (!wasGrounded) {
      p.events.push({ type: 'land', fall: p.airPeak - p.y, speed: -p.vyLanding || 0 });
    }
    p.sinceGrounded = 0;
    p.jumpedThisAir = false;
    p.rising = false;
    p.cut = false;
    p.airPeak = p.y;
    if (!wasGrounded) tryJump(p); 
  } else {
    if (wasGrounded && !p.jumpedThisAir) p.events.push({ type: 'leave' });
    if (p.y > p.airPeak) p.airPeak = p.y;
  }
  abilityAfterMove(p, world, dir, p.grounded && !wasGrounded);
  p.vyLanding = p.vy;
  if (dir !== 0) p.facing = dir;
  return p;
}


function horizontal(p, dir, input) {
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
    if (dir !== 0) p.vx = approach(p.vx, dir * K.RUN_SPEED, (Math.sign(p.vx) === -dir ? K.GROUND_DECEL : K.GROUND_ACCEL) * S);
    else p.vx = approach(p.vx, 0, K.GROUND_DECEL * S);
    return;
  }
  p.skid = 0;
  const cap = K.RUN_SPEED * (input.jump ? K.AIR_CARRY_HELD : K.AIR_CARRY_RELEASED);
  if (dir !== 0) {
    const target = dir * cap;
    const speeding = Math.sign(p.vx) === dir && Math.abs(p.vx) > cap;
    const rate = speeding || Math.sign(p.vx) === -dir ? K.GROUND_DECEL : K.GROUND_ACCEL;
    p.vx = approach(p.vx, target, rate * K.AIR_CONTROL * S);
  } else {
    p.vx = approach(p.vx, 0, K.GROUND_DECEL * K.AIR_CONTROL * S);
  }
}


function tryJump(p) {
  if (!bufferOk(p.sincePressed)) return;
  const fromCoyote = !p.grounded && coyoteOk(p.sinceGrounded, p.jumpedThisAir);
  if (!p.grounded && !fromCoyote) return;
  const buffered = p.sincePressed > 0;
  p.vy = K.JUMP_VELOCITY;
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
