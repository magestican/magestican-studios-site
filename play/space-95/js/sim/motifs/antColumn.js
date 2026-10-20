





import { sweepX } from '../body.js';
import { defeat } from '../combat.js';
import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';

const LURCH_SPEED = 14; 
const LURCH_TIME = 0.5; 
const FOES = new Set(['pillbug', 'ladybot', 'aphid']); 
const RUSH_HOUR = 4; 


const onColumn = (col, b) => Math.abs(b.y - col.y) < 1e-6 && b.x + b.w / 2 > col.x0 && b.x - b.w / 2 < col.x1;

registerKind('antColumn', {
  create(e) {
    e.speed = e.speed ?? 4;
    e.lurch = 0;
    e.sweeps = 0;
  },
  step(e, ctx) {
    const p = ctx.player;
    const dir = Math.sign(e.speed) || 1;
    const landed = p.events.some((ev) => ev.type === 'land') && onColumn(e, p);
    if (landed && e.lurch <= 0) {
      e.lurch = LURCH_TIME;
      e.sweeps += 1;
      e.sweptNow = 0; 
      ctx.events.push({ type: 'lurch', id: e.id, x: p.x, y: e.y, sweeps: e.sweeps });
    }
    
    if (e.lurch > 0) {
      for (const en of ctx.session.entities) {
        if (
          en.alive &&
          (FOES.has(en.kind) || e.foes?.includes(en.kind)) &&
          !en.swept &&
          en.state !== 'dazed' &&
          en.state !== 'scurry' &&
          onColumn(e, en)
        ) {
          en.swept = e.id;
          e.sweptNow += 1;
          if (e.sweptNow === RUSH_HOUR) ctx.events.push({ type: 'rushHour', id: e.id, x: en.x, y: en.y });
        }
      }
    }
    const v = e.lurch > 0 ? dir * LURCH_SPEED : e.speed;
    if (e.lurch > 0) e.lurch -= STEP;
    
    if (p.grounded && onColumn(e, p)) {
      p.x = sweepX(ctx.world, p, v * STEP).x;
      
      
      if (e.lurch > 0) p.x = Math.max(e.x0 + p.w / 2, Math.min(e.x1 - p.w / 2, p.x));
    }
    
    for (const en of ctx.session.entities) {
      if (en.swept !== e.id) continue;
      en.px = en.x;
      en.x += dir * LURCH_SPEED * STEP;
      const off = dir > 0 ? en.x - en.w / 2 > e.x1 : en.x + en.w / 2 < e.x0;
      if (off) {
        en.swept = null;
        en.facing = dir;
        defeat(en, ctx, 'sweep');
      }
    }
  },
});
