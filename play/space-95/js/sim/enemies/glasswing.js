









import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';

const R = 1.5; 
const PERIOD = 2.0; 
const DART_RANGE = 8;
const DART_CONE = (15 * Math.PI) / 180;
const DART_DIST = 6;
const DART_T = 0.4;
const FLEE_T = 4.0;
const FLEE_SPEED = 14;
const RETURN_SPEED = 6;
const SCAN_RANGE = 6;
const SCAN_T = 1.1;


export function glasswingWake(e, ctx, how) {
  if (e.mode === 'scan' || e.mode === 'flee' || e.scanned) return;
  e.mode = 'flee';
  e.mt = 0;
  const p = ctx.session.plane;
  const dx = e.x - p.x;
  const dy = e.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  e.vx = (dx / d) * FLEE_SPEED;
  e.vy = Math.abs(dy / d) * FLEE_SPEED + 4;
  ctx.events.push({ type: 'glasswingFlee', id: e.id, how, x: e.x, y: e.y });
}

registerKind('glasswing', {
  create(e) {
    e.w = 1.0;
    e.h = 0.5;
    e.post = { x: e.x, y: e.y };
    e.mode = 'loop';
    e.mt = 0;
    e.phase = 0; 
  },
  step(e, ctx) {
    const pl = ctx.session.plane;
    e.mt += STEP;
    if (e.mode === 'scan') {
      
      e.x = pl.x + Math.cos(pl.heading + Math.PI / 2) * 1.6;
      e.y = pl.y + Math.sin(pl.heading + Math.PI / 2) * 1.6 - e.h / 2;
      if (e.mt >= SCAN_T - 1e-9) {
        e.mode = 'return';
        e.scanned = true;
        ctx.events.push({ type: 'secret', secret: 'specimen', id: e.id, name: e.name });
      }
      return;
    }
    if (e.mode === 'flee' || e.mode === 'dart') {
      e.x += e.vx * STEP;
      e.y += e.vy * STEP;
      if (e.mt >= (e.mode === 'flee' ? FLEE_T : DART_T)) {
        e.mode = 'return';
        e.mt = 0;
      }
      return;
    }
    if (e.mode === 'return') {
      const tx = e.post.x + R;
      const ty = e.post.y;
      const d = Math.hypot(tx - e.x, ty - e.y);
      if (d <= RETURN_SPEED * STEP) {
        e.mode = 'loop';
        e.phase = 0;
      } else {
        e.x += ((tx - e.x) / d) * RETURN_SPEED * STEP;
        e.y += ((ty - e.y) / d) * RETURN_SPEED * STEP;
      }
      return;
    }
    
    e.phase += ((2 * Math.PI) / PERIOD) * STEP;
    e.x = e.post.x + Math.cos(e.phase) * R;
    e.y = e.post.y + Math.sin(e.phase) * R;
    if (pl?.stage !== 'fly') return;
    const dx = e.x - pl.x;
    const dy = e.y + e.h / 2 - pl.y;
    const d = Math.hypot(dx, dy);
    if (!e.scanned && d <= SCAN_RANGE && ctx.events.some((x) => x.type === 'loop')) {
      e.mode = 'scan';
      e.mt = 0;
      ctx.events.push({ type: 'glasswingScan', id: e.id, x: e.x, y: e.y, seconds: SCAN_T });
      return;
    }
    let a = Math.atan2(dy, dx) - pl.heading;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    if (d <= DART_RANGE && Math.abs(a) <= DART_CONE && pl.loopT <= 0 && pl.rollT <= 0) {
      
      e.mode = 'dart';
      e.mt = 0;
      const side = Math.sign(a) || 1;
      const nx = Math.cos(pl.heading + side * Math.PI * 0.4);
      const ny = Math.sin(pl.heading + side * Math.PI * 0.4);
      e.vx = (nx * DART_DIST) / DART_T;
      e.vy = (ny * DART_DIST) / DART_T;
      ctx.events.push({ type: 'glasswingDart', id: e.id, x: e.x, y: e.y });
    }
  },
});
