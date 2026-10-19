



import { JUMP_VELOCITY } from '../constants.js';
import { overlaps, registerKind } from '../entities.js';

const BOUNCE_V = JUMP_VELOCITY * 1.35; 
const BOUNCE_V_HELD = JUMP_VELOCITY * 1.5; 
const WOBBLE = 0.4; 

registerKind('dew', {
  create(e) {
    e.w = e.w ?? 1.5;
    e.h = 0.4;
    e.wobble = 0;
    e.bounces = 0;
  },
  step(e, ctx) {
    if (e.wobble > 0) {
      e.wobble -= 1 / 120;
      return;
    }
    const p = ctx.player;
    const landed = p.grounded && p.py > p.y; 
    const coming = p.vy < 0 || landed || p.py > p.y;
    if (!coming || !overlaps(p, e) || p.py < e.y + e.h * 0.3) return;
    p.vy = p.prevJump ? BOUNCE_V_HELD : BOUNCE_V;
    p.y = Math.max(p.y, e.y + e.h * 0.5);
    p.grounded = false;
    p.jumpedThisAir = true;
    p.rising = true;
    p.jumpTime = 0;
    p.cut = true; 
    p.climbing = false;
    e.wobble = WOBBLE;
    e.bounces += 1;
    ctx.events.push({ type: 'dewBounce', id: e.id, x: e.x, y: e.y, held: p.prevJump, bounces: e.bounces });
  },
});
