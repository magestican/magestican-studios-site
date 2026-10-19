




import { overlaps, registerKind } from './entities.js';

registerKind('intel', {
  create(e) {
    e.w = 0.5;
    e.h = 0.5;
  },
  step(e, ctx) {
    if (overlaps(e, ctx.player)) {
      e.alive = false;
      ctx.events.push({ type: 'secret', secret: e.secret, id: e.id, name: e.name });
    }
  },
});

registerKind('finish', {
  create(e) {
    e.w = 0.6;
    e.h = 3;
  },
  step(e, ctx) {
    if (!ctx.session.cleared && ctx.player.x >= e.x) {
      ctx.session.cleared = true;
      ctx.events.push({ type: 'clear', time: ctx.session.time });
    }
  },
});
