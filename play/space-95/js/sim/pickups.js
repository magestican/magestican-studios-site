




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


registerKind('seed', {
  create(e) {
    e.w = 0.4;
    e.h = 0.4;
  },
  step(e, ctx) {
    if (overlaps(e, ctx.player)) {
      e.alive = false;
      ctx.session.seeds = (ctx.session.seeds ?? 0) + 1;
      ctx.events.push({ type: 'seed', id: e.id, x: e.x, y: e.y });
    }
  },
});


registerKind('ability', {
  create(e) {
    e.w = 0.8;
    e.h = 1;
  },
  step(e, ctx) {
    if (overlaps(e, ctx.player)) {
      e.alive = false;
      ctx.session.abilities.add(e.grant);
      ctx.events.push({ type: 'ability', grant: e.grant, id: e.id, x: e.x, y: e.y });
    }
  },
});

registerKind('finish', {
  create(e) {
    e.w = 0.6;
    e.h = 3;
  },
  step(e, ctx) {
    const reached = e.axis === 'y' ? ctx.player.y >= e.y && Math.abs(ctx.player.x - e.x) < 3 : ctx.player.x >= e.x;
    if (!ctx.session.cleared && reached) {
      ctx.session.cleared = true;
      ctx.events.push({ type: 'clear', time: ctx.session.time });
    }
  },
});
