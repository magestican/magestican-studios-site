




import { defeat, stepDefeated } from '../combat.js';
import { groundAhead, moveBody, overlaps, registerKind, spawnEntities } from '../entities.js';

const CRAWL = 0.6; 
const STOMP_BOUNCE_V = 10;
const PUSH_V = 3;


export function popShell(e, ctx, how) {
  defeat(e, ctx, how);
  ctx.events.push({ type: 'shellPop', id: e.id, x: e.x, y: e.y });
  const [shield] = spawnEntities([{ id: `${e.id}-shield`, kind: 'shellShield', x: e.x, y: e.y }]);
  ctx.session.entities.push(shield);
}

registerKind('snailknight', {
  sleeps: true,
  create(e) {
    e.w = 1.5;
    e.h = 1.5;
    e.state = 'crawl';
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    const p = ctx.player;
    e.facing = Math.sign(p.x - e.x) || e.facing;
    e.vx = e.facing * CRAWL;
    const hit = moveBody(e, ctx.world);
    if (hit.wall || (e.grounded && !groundAhead(e, ctx.world, e.facing))) e.vx = 0;
    if (!overlaps(p, e)) return;
    if (p.ab?.dashT > 0) {
      popShell(e, ctx, 'dash');
      return;
    }
    const fromAbove = p.py >= e.y + e.h * 0.6;
    if (fromAbove && p.vy <= 0) {
      p.vy = STOMP_BOUNCE_V;
      p.grounded = false;
      ctx.events.push({ type: 'ping', id: e.id });
      return;
    }
    
    const dir = Math.sign(p.x - e.x) || 1;
    p.x = e.x + dir * (e.w / 2 + p.w / 2 + 0.001);
    p.vx = dir * PUSH_V;
  },
});
