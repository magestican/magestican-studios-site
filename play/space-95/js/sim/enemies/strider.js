










import { standardContact, stepDefeated } from '../combat.js';
import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';
import { waterAt } from '../water.js';

const WINDUP = 0.6; 
const SKATE = 9; 
const SWING = 6; 
const SWING_RATE = 0.5; 


export function clampToWater(e, level) {
  e.strip ??= waterAt(level, e.x) ?? { x0: e.x - 1e3, x1: e.x + 1e3 };
  e.x = Math.max(e.strip.x0 + e.w / 2, Math.min(e.strip.x1 - e.w / 2, e.x));
}

registerKind('strider', {
  create(e) {
    e.w = 1.4;
    e.h = 0.6;
    e.floats = true;
    e.home = e.x;
    if (e.commodore) e.state = 'circle';
    else {
      e.flee = true;
      if (e.wakeWhen) e.dozing = true;
    }
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    if (e.commodore) {
      e.swing = (e.swing ?? 0) + STEP; 
      e.x = e.home + SWING * Math.sin(SWING_RATE * e.swing);
      e.facing = Math.cos(SWING_RATE * e.swing) >= 0 ? 1 : -1;
      return; 
    }
    const p = ctx.player;
    if (e.state === 'idle') {
      e.state = 'windup';
      e.t = 0;
      e.facing = Math.sign(p.x - e.x) || e.facing;
      ctx.events.push({ type: 'striderWindup', id: e.id, x: e.x, y: e.y, signals: ['visual:leg-glint', 'audio:skitter'] });
    }
    if (e.state === 'windup') {
      if (e.t >= WINDUP - 1e-9) {
        e.state = 'skate';
        e.t = 0;
      }
    } else if (e.state === 'skate') {
      e.facing = Math.sign(p.x - e.x) || e.facing;
      e.vx = e.facing * SKATE;
      e.x += e.vx * STEP;
      clampToWater(e, ctx.session.level);
    }
    standardContact(e, ctx);
  },
});
