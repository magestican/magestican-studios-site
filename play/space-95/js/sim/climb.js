



import { JUMP_VELOCITY } from './constants.js';

const CLIMB_UP = 4; 
const CLIMB_DOWN = 5; 
const CLIMB_SIDE = 3; 
const JUMP_OFF_V = JUMP_VELOCITY * 0.85;
const JUMP_OFF_VX = 4; 
const TOP_POP_V = 9; 


function onBark(world, b) {
  if (!world.bark) return false;
  const T = world.tile;
  const c0 = Math.floor((b.x - b.w / 2 + 1e-7) / T);
  const c1 = Math.floor((b.x + b.w / 2 - 1e-7) / T);
  const r0 = Math.floor((b.y + 1e-7) / T);
  const r1 = Math.floor((b.y + b.h * 0.6) / T); 
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (world.bark(c, r)) return true;
  return false;
}






export function climbStep(p, input, world, dir, pressed) {
  const touching = onBark(world, p);
  if (!p.climbing) {
    const grab = touching && (input.up || (!p.grounded && input.down && !p.ab?.pound));
    if (!grab || (p.rising && p.vy > JUMP_OFF_V * 0.7)) return false; 
    p.climbing = true;
    p.events.push({ type: 'grab' });
  }
  if (!touching) {
    p.climbing = false;
    if (input.up) {
      p.vy = TOP_POP_V;
      p.events.push({ type: 'climbTop' });
    }
    return false;
  }
  if (pressed) {
    p.climbing = false;
    p.vy = JUMP_OFF_V;
    p.vx = dir * JUMP_OFF_VX;
    p.jumpedThisAir = true;
    p.rising = true;
    p.jumpTime = 0;
    p.cut = false;
    p.sincePressed = Number.POSITIVE_INFINITY;
    p.events.push({ type: 'climbJump', dir });
    return true;
  }
  if (p.grounded && input.down) {
    p.climbing = false;
    return false;
  }
  p.vx = dir * CLIMB_SIDE;
  p.vy = input.up ? CLIMB_UP : input.down ? -CLIMB_DOWN : 0;
  p.jumpedThisAir = false; 
  if (p.ab) p.ab.usedDouble = false;
  return true;
}
