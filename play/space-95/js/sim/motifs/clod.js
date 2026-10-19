







import { sweepY } from '../body.js';
import { defeat } from '../combat.js';
import { STEP } from '../constants.js';
import { ENTITY_GRAVITY, overlaps, registerKind } from '../entities.js';

const SHAKE_RANGE = 3; 
const CRUSH_DEPTH = 3; 
const FOES = new Set(['pillbug', 'ladybot', 'aphid', 'antPorter']);


function crush(world, e, dy) {
  const T = world.tile;
  const c0 = Math.floor((e.x - e.w / 2 + 1e-7) / T);
  const c1 = Math.floor((e.x + e.w / 2 - 1e-7) / T);
  const rNew = Math.floor((e.y + dy + 1e-7) / T);
  const rOld = Math.floor((e.y + 1e-7) / T);
  for (let r = rOld - 1; r >= rNew; r--) {
    if (e.crushLeft <= 0) return;
    let any = false;
    for (let c = c0; c <= c1; c++) if (world.breakSoil(c, r)) any = true;
    if (any) e.crushLeft -= T;
  }
}

registerKind('clod', {
  create(e) {
    e.w = 1;
    e.h = 1;
    e.state = 'rest';
    e.buried = 0;
    e.crushLeft = CRUSH_DEPTH;
  },
  step(e, ctx) {
    if (e.state === 'rest') {
      const dig = ctx.session.events.find((ev) => ev.type === 'dig' && Math.abs(ev.x - e.x) <= SHAKE_RANGE);
      if (!dig) return;
      e.state = 'fall';
      ctx.events.push({ type: 'caveIn', id: e.id, x: e.x, y: e.y });
    }
    if (e.state !== 'fall') return;
    e.vy -= ENTITY_GRAVITY * STEP;
    crush(ctx.world, e, e.vy * STEP);
    const my = sweepY(ctx.world, e, e.vy * STEP);
    e.y = my.y;
    for (const en of ctx.session.entities) {
      if (!en.alive || !FOES.has(en.kind) || en.state === 'dazed' || en.state === 'scurry' || !overlaps(e, en)) continue;
      defeat(en, ctx, 'cave-in');
      e.buried += 1;
      ctx.events.push({ type: 'buried', id: e.id, target: en.id, x: en.x, y: en.y });
    }
    if (my.hit && e.vy < 0) {
      e.vy = 0;
      e.state = 'settled';
      ctx.events.push({ type: 'clodLand', id: e.id, x: e.x, y: e.y });
    }
  },
});
