










import { hurtPlayer } from './combat.js';
import { zoneOn } from './wind.js';

const HOB_WARN = 1.0; 
const WARN_RANGE = 14; 
const FEET = 0.05; 

const inBox = (z, x, y) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1;


export function coldAt(s, x, y) {
  const ec = s.extraCold;
  if (ec && s.time < ec.until && inBox(ec, x, y)) return true;
  for (const z of s.level.colds ?? []) if (inBox(z, x, y) && zoneOn(z, s.time)) return true;
  return false;
}


export function heatAt(s, x, y) {
  for (const z of s.level.heats ?? []) if (inBox(z, x, y) && zoneOn(z, s.time)) return true;
  return false;
}


export function hobState(h, t) {
  const P = h.period;
  const tau = (((t - h.at) % P) + P) % P;
  if (tau < h.on) return 'lit';
  return tau >= P - HOB_WARN ? 'warn' : 'dark';
}


export function litHobUnder(s, b) {
  for (const h of s.level.hobs ?? []) {
    if (Math.abs(b.y - h.y) > FEET) continue;
    if (b.x + b.w / 2 <= h.x0 || b.x - b.w / 2 >= h.x1) continue;
    if (hobState(h, s.time) === 'lit') return h;
  }
  return null;
}






export function stepTemperature(s) {
  const p = s.player;
  const ev = s.events;
  if (s.level.hobs) {
    s.hobWas ??= {};
    for (const h of s.level.hobs) {
      const st = hobState(h, s.time);
      const was = s.hobWas[h.id];
      s.hobWas[h.id] = st;
      if (st === was || Math.abs(p.x - (h.x0 + h.x1) / 2) > WARN_RANGE) continue;
      if (st === 'warn')
        ev.push({ type: 'hobWarn', id: h.id, skin: h.skin, seconds: HOB_WARN, signals: ['visual:dull-red', 'audio:sizzle-rise'] });
      else if (st === 'lit') ev.push({ type: 'hobLit', id: h.id, skin: h.skin });
    }
    if (s.dead === 0 && p.grounded && s.invuln <= 0) {
      const h = litHobUnder(s, p);
      if (h && hurtPlayer(s, p.x + (p.facing || 1))) ev.push({ type: 'burn', id: h.id, skin: h.skin, x: p.x, y: p.y });
    }
  }
  if (s.extraCold && s.time >= s.extraCold.until) s.extraCold = null;
  stepHobDeed(s);
}

function stepHobDeed(s) {
  const deed = s.entities.find((e) => e.kind === 'intel' && e.condition && !e.alive && !s.found.has(String(e.id)));
  if (!deed || s.deedDone) return;
  const p = s.player;
  const c = deed.condition;
  if (s.events.some((e) => e.type === 'respawn')) s.deedFrom = null; 
  if (s.deedFrom == null && p.x >= c.from && p.x < c.to) {
    s.deedFrom = s.time;
    s.deedTick = 0;
    s.events.push({ type: 'timerStart', id: deed.id });
  }
  if (s.deedFrom == null) return;
  const el = s.time - s.deedFrom;
  if (el >= (s.deedTick ?? 0) + 1) {
    s.deedTick = Math.floor(el);
    if (el < c.under) s.events.push({ type: 'timerTick', id: deed.id, seconds: s.deedTick });
  }
  if (el >= c.under && !s.deedRang) {
    s.deedRang = true;
    s.events.push({ type: 'timerDing', id: deed.id, earned: false });
  }
  if (p.x >= c.to) {
    if (el < c.under && !s.deedRang) {
      deed.alive = true;
      s.deedDone = true;
      s.events.push({ type: 'deedEarned', id: deed.id, seconds: el });
    } else {
      s.deedFrom = null; 
      s.deedRang = false;
    }
  }
}
