



import { overlaps, registerKind } from './entities.js';

registerKind('hatch', {
  create(e) {
    e.w ??= 2;
    e.h ??= 2;
  },
  step(e, ctx) {
    if (e.done || !overlaps(ctx.player, e)) return;
    e.done = true;
    const s = ctx.session;
    s.boxes = Math.max(s.boxes ?? 0, e.box ?? 0);
    ctx.events.push({ type: 'hatch', id: e.id, x: e.x, y: e.y });
    if (e.box) ctx.events.push({ type: 'box', n: e.box, id: e.id });
  },
});
