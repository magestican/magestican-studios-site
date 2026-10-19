








import { hurtPlayer } from './combat.js';
import { overlaps, registerKind, spawnEntities } from './entities.js';

const RING_TIME = 0.5; 
const FALL_TIME = 0.3; 
const FALL_HEIGHT = 6; 
const TWIG_SIGNALS = ['visual:pink-ring', 'audio:twig-whistle'];


export function dropTwig(ctx, id, x, y, extra = {}) {
  const [t] = spawnEntities([{ id, kind: 'twig', x, y, ty: y, ...extra }]);
  ctx.session.entities.push(t);
  ctx.events.push({ type: 'twigRing', id, x, y, seconds: RING_TIME + FALL_TIME, signals: TWIG_SIGNALS, ...extra });
  return t;
}

registerKind('twig', {
  create(e) {
    e.w = 0.6;
    e.h = 0.8;
    e.state = 'ring';
    e.y = e.ty + FALL_HEIGHT;
  },
  step(e, ctx) {
    if (e.state === 'ring') {
      if (e.t < RING_TIME) return;
      e.state = 'fall';
    }
    const u = Math.min(1, (e.t - RING_TIME) / FALL_TIME);
    e.y = e.ty + FALL_HEIGHT * (1 - u * u);
    if (overlaps(e, ctx.player)) {
      hurtPlayer(ctx.session, e.x);
      e.alive = false;
      ctx.events.push({ type: 'twigLand', id: e.id, x: e.x, y: e.y, hit: true });
      return;
    }
    if (u >= 1) {
      e.alive = false;
      ctx.events.push({ type: 'twigLand', id: e.id, x: e.x, y: e.ty, hit: false });
    }
  },
});

registerKind('twigDrop', {
  create(e) {
    e.w = 0;
    e.h = 0;
  },
  step(e, ctx) {
    const p = ctx.player;
    const z = e.zone;
    if (p.x >= z.x0 && p.x <= z.x1 && Math.abs(p.y - e.y) <= 3) {
      e.alive = false;
      dropTwig(ctx, `${e.id}-twig`, p.x, e.y);
    }
  },
});
