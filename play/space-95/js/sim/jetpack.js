




import { STEP } from './constants.js';
import { overlaps, registerKind } from './entities.js';

const FUEL = 4; 
const RISE = 7; 
const ACCEL = 40; 
const START_VY = 1; 

registerKind('jetpack', {
  create(e) {
    e.w = 0.8;
    e.h = 0.8;
  },
  step(e, ctx) {
    if (!overlaps(e, ctx.player)) return;
    e.alive = false;
    ctx.player.jetFuel = FUEL;
    ctx.events.push({ type: 'jetpackOn', id: e.id, x: e.x, y: e.y });
  },
});





export function jetStep(p, input) {
  if (!(p.jetFuel > 0)) return false;
  const on = !p.grounded && input.jump && (p.jetOn || p.vy <= START_VY);
  if (!on) {
    if (p.jetOn) p.events.push({ type: 'jetEnd', x: p.x, y: p.y });
    p.jetOn = false;
    return false;
  }
  if (!p.jetOn) p.events.push({ type: 'jetStart', x: p.x, y: p.y });
  p.jetOn = true;
  p.vy = Math.min(RISE, p.vy + ACCEL * STEP);
  p.jetFuel = Math.max(0, p.jetFuel - STEP);
  if (p.jetFuel === 0) {
    p.jetOn = false;
    p.events.push({ type: 'jetEmpty', x: p.x, y: p.y });
  }
  return true;
}
