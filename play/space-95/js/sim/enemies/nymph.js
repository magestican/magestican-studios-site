








import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';

export const NYMPH = Object.freeze({ CHIRP: 1.2, DIVE: 3, NEAR: 8 });

registerKind('nymph', {
  create(e) {
    e.w = 1;
    e.h = 0.7;
    e.state = 'sing';
    e.chirpT = 0;
    e.diveT = 0;
    e.scanned = false;
    e.pocket ??= [e.x - 2.5, e.x + 2.5, e.y - 1, e.y + 2];
  },
  step(e, ctx) {
    const p = ctx.player;
    if (e.state === 'dive') {
      e.diveT += STEP;
      if (e.diveT >= NYMPH.DIVE) {
        e.state = 'sing';
        e.chirpT = 0;
        ctx.events.push({ type: 'nymphSurface', id: e.id, x: e.x, y: e.y });
      }
      return;
    }
    const pound = p.events.find((ev) => ev.type === 'pound');
    const above = p.grounded && Math.abs(p.x - e.x) <= 2 && p.y - e.y > 0 && p.y - e.y <= 6;
    if ((pound && Math.hypot(pound.x - e.x, pound.y - e.y) <= NYMPH.NEAR) || above) {
      e.state = 'dive';
      e.diveT = 0;
      ctx.events.push({ type: 'nymphDive', id: e.id, why: pound ? 'pound' : 'above', x: e.x, y: e.y });
      return;
    }
    e.chirpT += STEP;
    if (e.chirpT >= NYMPH.CHIRP) {
      e.chirpT = 0;
      ctx.events.push({ type: 'nymphChirp', id: e.id, x: e.x, y: e.y, signals: ['audio:nymph-chirp'] });
    }
    const [x0, x1, y0, y1] = e.pocket;
    if (!e.scanned && p.x + p.w / 2 > x0 && p.x - p.w / 2 < x1 && p.y < y1 && p.y + p.h > y0) {
      e.scanned = true;
      ctx.events.push({ type: 'scan', id: e.id, name: e.name, x: e.x, y: e.y });
      ctx.events.push({ type: 'secret', secret: 'specimen', id: e.id });
    }
  },
});
