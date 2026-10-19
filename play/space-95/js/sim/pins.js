










import { STEP } from './constants.js';
import { onFanBand } from './fan.js';

const PINS = Object.freeze({
  WARN: 0.3, 
  NEAR: 1, 
});

const mod = (a, n) => ((a % n) + n) % n;


export function sparkState(sp, t) {
  const q = sp.pulse;
  if (!q) return 'live';
  const tau = mod(t + (q.phase ?? 0), q.on + q.off);
  if (tau >= q.off) return 'live';
  return tau >= q.off - PINS.WARN ? 'warn' : 'dark';
}

const overlapsRect = (b, r, pad = 0) =>
  b.x + b.w / 2 > r.x0 - pad && b.x - b.w / 2 < r.x1 + pad && b.y < r.y1 + pad && b.y + b.h > r.y0 - pad;


export function touchPins(s) {
  const p = s.player;
  let hit = null;
  for (const sp of s.level.sparks) {
    const now = sparkState(sp, s.time);
    if (sp.pulse && now === 'warn' && sparkState(sp, s.time - STEP) === 'dark')
      s.events.push({
        type: 'sparkWarn',
        x: (sp.x0 + sp.x1) / 2,
        y: (sp.y0 + sp.y1) / 2,
        seconds: PINS.WARN,
        signals: ['visual:pink-glow', 'audio:tick'],
      });
    if (!hit && now === 'live' && overlapsRect(p, sp)) hit = sp;
  }
  return hit;
}


export function spinUnder(level, b) {
  for (const sp of level.spins ?? []) if (Math.abs(b.y - sp.y) < 1e-6 && b.x > sp.x0 && b.x < sp.x1) return sp;
  return null;
}


export function unsafeFooting(s) {
  const p = s.player;
  for (const sp of s.level.sparks ?? []) if (overlapsRect(p, sp, PINS.NEAR)) return true;
  if (spinUnder(s.level, p)) return true;
  const band = onFanBand(s.level, p);
  return !!band && Math.abs(p.y - band.y1) < 1e-6;
}
