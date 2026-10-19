




import { sweepX } from './body.js';
import { defeat } from './combat.js';
import { STEP } from './constants.js';
import { overlaps, registerKind, spawnEntities } from './entities.js';

const FLING_SPEED = 14;
const FOES = new Set(['pillbug', 'ladybot', 'aphid', 'bandit', 'antPorter']);

registerKind('shellShield', {
  create(e) {
    e.w = 0.8;
    e.h = 0.8;
  },
  step(e, ctx) {
    if (!overlaps(e, ctx.player)) return;
    e.alive = false;
    const had = ctx.session.shield;
    ctx.session.shield = true;
    ctx.events.push({ type: had ? 'shieldRefresh' : 'shieldOn', id: e.id, x: e.x, y: e.y });
  },
});

registerKind('shellShot', {
  create(e) {
    e.w = 0.7;
    e.h = 0.6;
    e.hits = 0;
  },
  step(e, ctx) {
    const mx = sweepX(ctx.world, e, e.vx * STEP);
    e.x = mx.x;
    for (const en of ctx.session.entities) {
      if (!en.alive || !FOES.has(en.kind) || en.state === 'dazed' || en.state === 'scurry' || !overlaps(e, en)) continue;
      defeat(en, ctx, 'shell');
      e.hits += 1;
      ctx.events.push({ type: 'pebbleHit', id: e.id, target: en.id, hits: e.hits, x: en.x, y: en.y });
      if (e.hits === 3) ctx.events.push({ type: 'strike', id: e.id, x: en.x, y: en.y });
    }
    if (mx.hit || e.t > 4) {
      e.alive = false;
      ctx.events.push({ type: 'shellBreak', id: e.id, x: e.x, y: e.y });
    }
  },
});


export function stepShield(s) {
  const p = s.player;
  if (!s.shield || !p.events.some((e) => e.type === 'dash')) return;
  s.shield = false;
  s.shots = (s.shots ?? 0) + 1;
  const [shot] = spawnEntities([
    { id: `shot-${s.shots}`, kind: 'shellShot', x: p.x + p.facing * 0.6, y: p.y + 0.2, vx: p.facing * FLING_SPEED },
  ]);
  s.entities.push(shot);
  s.events.push({ type: 'fling', id: shot.id, x: p.x, y: p.y });
}
