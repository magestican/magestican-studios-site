










import { contact, defeat, stompBounce } from './combat.js';
import { STEP } from './constants.js';
import { popShell } from './enemies/snailknight.js';
import { moveBody, overlaps } from './entities.js';

const FLIP_TIME = 4.0; 
const RIGHTING_TIME = 0.5; 





export function stepRing(ring, entities, canHit, onHit) {
  ring.r = Math.min(ring.radius, ring.r + ring.speed * STEP);
  for (const e of entities) {
    if (!e.alive || !canHit(e) || ring.hit.includes(e.id)) continue;
    
    
    const d = ring.cy === undefined ? Math.abs(e.x - ring.x) : Math.hypot(e.x - ring.x, e.y + e.h / 2 - ring.cy);
    if (d - e.w / 2 > ring.r) continue;
    if (ring.lo !== undefined && (e.x + e.w / 2 < ring.lo || e.x - e.w / 2 > ring.hi)) continue; 
    ring.hit.push(e.id);
    onHit(e);
  }
  return ring.r >= ring.radius;
}


export function flip(s, e, ring) {
  if (e.flip?.phase === 'flipped') {
    e.flip.t = 0;
    s.events.push({ type: 'flip', id: e.id, kind: e.kind, use: e.flip.use, x: e.x, y: e.y, again: true });
    return;
  }
  const prev = e.flip ? e.flip.prev : e.state;
  if (e.dozing) {
    e.dozing = false;
    e.awake = true;
  }
  e.awake = true; 
  e.flip = { t: 0, phase: 'flipped', prev, ring: ring.id, use: ring.use };
  e.state = 'flipped';
  e.vx = 0;
  s.events.push({ type: 'flip', id: e.id, kind: e.kind, use: ring.use, x: e.x, y: e.y });
}


export function stepFlipped(s, ctx) {
  const p = s.player;
  for (const e of s.entities) {
    if (!e.alive || !e.flip) continue;
    e.flip.t += STEP;
    e.vx = 0;
    if (!e.floats) moveBody(e, s.world); 
    if (e.flip.phase === 'flipped') {
      if (overlaps(p, e)) {
        bowl(s, e, ctx);
        continue;
      }
      if (e.flip.t >= FLIP_TIME - 1e-9) {
        e.flip.phase = 'righting';
        e.flip.t = 0;
        e.state = 'righting';
        s.events.push({ type: 'righting', id: e.id });
      }
    } else if (e.flip.t >= RIGHTING_TIME - 1e-9) {
      const prev = e.flip.prev;
      e.flip = null;
      e.t = 0;
      e.state = e.flee ? 'scurry' : prev;
      s.events.push({ type: e.flee ? 'flee' : 'righted', id: e.id });
    }
  }
}

function bowl(s, e, ctx) {
  const ring = e.flip.ring;
  const n = (s.bowls[ring] ?? 0) + 1;
  s.bowls[ring] = n;
  const use = e.flip.use;
  const p = s.player;
  if (contact(p, e) === 'stomp') stompBounce(p); 
  e.flip = null;
  s.events.push({ type: 'bowl', id: e.id, kind: e.kind, n, use, x: e.x, y: e.y });
  if (e.kind === 'snailknight') popShell(e, ctx, 'bowl');
  else if (e.kind === 'antPorter') {
    e.state = 'scurry'; 
    e.t = 0;
    s.hitstop = Math.max(s.hitstop, 0.06);
  } else defeat(e, ctx, 'bowl');
}
