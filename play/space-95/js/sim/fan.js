
















import { STEP, TILE } from './constants.js';

export const FAN = Object.freeze({
  BAT: 6, 
  SPIN_DOWN: 1.0, 
  BAT_COOL: 0.15, 
  GRILLE: 1.5, 
});


export function createFans(level) {
  if (!level.fans?.length) return null;
  return { list: level.fans.map((d) => ({ id: d.id, def: d, stopAt: null, o0: 0, final: 0 })), lightsOut: false };
}

const period = (d) => d.blade + d.gap;
const mod = (a, n) => ((a % n) + n) % n;


function fanOffset(f, t) {
  const d = f.def;
  if (f.stopAt === null || t < f.stopAt) return d.speed * t + (d.phase ?? 0);
  const u = Math.min(1, (t - f.stopAt) / FAN.SPIN_DOWN);
  return f.o0 + (f.final - f.o0) * (1 - (1 - u) * (1 - u));
}


export function bladeAt(f, a, t) {
  const d = f.def;
  const lo = d.axis === 'y' ? d.y0 : d.x0;
  return mod(a - lo - fanOffset(f, t), period(d)) < d.blade;
}

const opens = (d) => d.gap >= FAN.GRILLE;


export function attachFans(world) {
  const base = world.solid;
  const T = world.tile;
  world.solid = (c, r) => {
    if (base(c, r)) return true;
    const F = world.fanState;
    if (!F) return false;
    for (const f of F.list) {
      const d = f.def;
      if (!opens(d)) continue;
      if (c < Math.round(d.x0 / T) || c >= Math.round(d.x1 / T) || r < Math.round(d.y0 / T) || r >= Math.round(d.y1 / T)) continue;
      if (d.hub && (c + 0.5) * T >= d.hub[0] && (c + 0.5) * T < d.hub[1]) return true;
      const a = d.axis === 'y' ? (r + 0.5) * T : (c + 0.5) * T;
      return bladeAt(f, a, world.fanT ?? 0);
    }
    return false;
  };
  return world;
}


export function stopFan(s, id) {
  const F = s.fans;
  if (!F) return;
  for (const f of F.list) {
    if ((id !== null && f.id !== id) || f.stopAt !== null) continue;
    const d = f.def;
    f.stopAt = s.time;
    f.o0 = fanOffset({ ...f, stopAt: null }, s.time);
    
    const lo = d.axis === 'y' ? d.y0 : d.x0;
    const mid = d.axis === 'y' ? (d.y0 + d.y1) / 2 : (d.x0 + d.x1) / 2;
    const want = mid - lo - d.blade - d.gap / 2; 
    const P = period(d);
    f.final = f.o0 + mod(want - f.o0, P) + (d.speed < 0 ? -P : 0);
    s.events.push({ type: 'fanStop', id: f.id, x: (d.x0 + d.x1) / 2, y: (d.y0 + d.y1) / 2 });
  }
}


function bladeTouch(F, b, t) {
  for (const f of F.list) {
    const d = f.def;
    if (d.axis === 'y') {
      if (b.y >= d.y1 || b.y + b.h <= d.y0) continue;
      const left = b.x - b.w / 2;
      const right = b.x + b.w / 2;
      if (right < d.x0 - 0.02 || left > d.x1 + 0.02) continue;
      
      for (let a = Math.max(b.y, d.y0) + 0.01; a < Math.min(b.y + b.h, d.y1); a += TILE / 2)
        if (bladeAt(f, a, t)) return { f, side: b.x < (d.x0 + d.x1) / 2 ? -1 : 1 };
      continue;
    }
    if (Math.abs(b.y - d.y1) > 1e-6) continue;
    const l = Math.max(b.x - b.w / 2, d.x0);
    const r = Math.min(b.x + b.w / 2, d.x1);
    if (r <= l) continue;
    if (d.hub && b.x >= d.hub[0] && b.x <= d.hub[1]) continue; 
    let blade = !opens(d);
    for (let a = l + 0.01; a < r && !blade; a += TILE / 2) if (bladeAt(f, a, t)) blade = true;
    if (!blade) continue;
    const dir = d.hub ? Math.sign((d.hub[0] + d.hub[1]) / 2 - b.x) : b.x - d.x0 < d.x1 - b.x ? -1 : 1; 
    return { f, side: dir || 1 };
  }
  return null;
}


export function stepFans(s) {
  const F = s.fans;
  if (!F) return null;
  const p = s.player;
  p.fanCool = Math.max(0, (p.fanCool ?? 0) - STEP);
  if (p.fanCool > 0) return null;
  const hit = bladeTouch(F, p, s.time);
  if (!hit) return null;
  const d = hit.f.def;
  if (d.axis === 'y') {
    p.vx = hit.side * FAN.BAT;
    p.x = hit.side < 0 ? Math.min(p.x, d.x0 - p.w / 2) : Math.max(p.x, d.x1 + p.w / 2);
  } else {
    if (!p.grounded) return null;
    p.vy = FAN.BAT;
    p.vx = hit.side * FAN.BAT;
    p.grounded = false;
    p.jumpedThisAir = true;
    p.rising = false;
  }
  p.fanCool = FAN.BAT_COOL;
  s.events.push({ type: 'fanBat', id: d.id, who: 'jo', x: p.x, y: p.y, signals: ['visual:blade-thwap', 'audio:thwap'] });
  return hit.f;
}


export function onFanBand(level, b) {
  for (const d of level.fans ?? []) {
    if (d.axis === 'y') continue;
    if (Math.abs(b.y - d.y1) > 0.6) continue;
    if (b.x + b.w / 2 > d.x0 && b.x - b.w / 2 < d.x1 && !(d.hub && b.x >= d.hub[0] && b.x <= d.hub[1])) return d;
  }
  return null;
}
