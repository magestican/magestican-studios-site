





import { STEP } from './constants.js';
import { overlaps, registerKind } from './entities.js';

registerKind('readArm', {
  create(e) {
    e.w = e.w ?? 0.8;
    e.h = e.h ?? 0.6;
    e.dir = Math.sign(e.x1 - e.x0) || -1;
    e.x = e.x0;
    e.cool = 0;
  },
  step(e, ctx) {
    const span = Math.abs(e.x1 - e.x0);
    const speed = e.speed ?? 8;
    const u = (e.t * speed) % (2 * span);
    const k = u <= span ? u : 2 * span - u; 
    e.dir = (u <= span ? 1 : -1) * Math.sign(e.x1 - e.x0);
    e.x = e.x0 + Math.sign(e.x1 - e.x0) * k;
    e.vx = e.dir * speed;
    if (e.cool > 0) e.cool -= STEP;
    const p = ctx.player;
    if (e.cool <= 0 && overlaps(p, e)) {
      p.vx = e.dir * (e.shove ?? 6);
      e.cool = 0.3;
      ctx.events.push({ type: 'armShove', id: e.id, x: p.x, y: p.y, dir: e.dir });
    }
  },
});
