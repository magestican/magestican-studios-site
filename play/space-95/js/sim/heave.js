












import { STEP } from './constants.js';

const TAU = Math.PI * 2;
const sagEase = (u) => u * u * (3 - 2 * u);


export const LAUNCH_GAIN = 2;


export const MAX_BOOST = 6.5;
const SAG_EASE = 0.3; 
const SAG_DEAD = 0.06; 


function taperW(h, x) {
  const [tin, tout] = h.taper ?? [0, 0];
  let w = 1;
  if (tin > 0 && x < h.x0 + tin) w = Math.min(w, 0.5 - 0.5 * Math.cos((Math.PI * Math.max(0, x - h.x0)) / tin));
  if (tout > 0 && x > h.x1 - tout) w = Math.min(w, 0.5 - 0.5 * Math.cos((Math.PI * Math.max(0, h.x1 - x)) / tout));
  return w;
}


function sighY(h, ts) {
  const rest = h.base;
  const low = h.base - (h.sink ?? 1);
  const top = h.top ?? h.base + h.amp;
  const seg = [
    [2.0, rest, low], 
    [0.5, low, low], 
    [1.5, low, top], 
    [3.0, top, top], 
    [3.0, top, rest], 
  ];
  let t = ts;
  for (const [d, a, b] of seg) {
    if (t < d) {
      const k = 0.5 - 0.5 * Math.cos((Math.PI * t) / d);
      const dk = ((0.5 * Math.PI) / d) * Math.sin((Math.PI * t) / d);
      return { y: a + (b - a) * k, vs: (b - a) * dk };
    }
    t -= d;
  }
  return { y: rest, vs: 0 };
}


export function heaveAt(h, x, t, sighStart = null, sagK = 0) {
  if (x < h.x0 || x >= h.x1) return null;
  const w = taperW(h, x);
  if (h.group === 'sag') {
    
    
    const d = h.amp * sagK * w;
    return { y: Math.abs(d) < (h.dead ?? SAG_DEAD) ? h.base : h.base + d, vs: 0 };
  }
  if (h.group === 'sigh') {
    if (sighStart === null) return { y: h.base, vs: 0 };
    const s = sighY(h, t - sighStart);
    return { y: h.base + (s.y - h.base) * w, vs: s.vs * w };
  }
  const P = h.period ?? 4;
  const tau = (((t + (h.phase ?? 0)) % P) + P) % P;
  const b = 0.5 - 0.5 * Math.cos((TAU * tau) / P);
  const db = ((0.5 * TAU) / P) * Math.sin((TAU * tau) / P);
  return { y: h.base + h.amp * b * w, vs: h.amp * db * w };
}





export function attachHeaves(world, heaves) {
  if (!heaves?.length) return world;
  world.heaves = heaves;
  world.time = world.time ?? 0;
  world.sighStart = world.sighStart ?? null;
  const clone = world.clone;
  if (clone && !clone.withHeaves) {
    world.clone = () => {
      const c = attachHeaves(clone(), heaves);
      c.time = world.time;
      c.sighStart = world.sighStart;
      if (world.sagU) c.sagU = { ...world.sagU };
      if (world.sag) c.sag = { ...world.sag };
      return c;
    };
    world.clone.withHeaves = true;
  }
  world.floorAt = (b, x = b.x) => {
    let best = null;
    for (const h of heaves) {
      if (h.phases && !h.phases.includes(world.arenaPhase ?? 0)) continue;
      const k = h.group === 'sag' ? sagEase(world.sagU?.[h.id] ?? 0) : 0;
      for (const sx of [x - b.w / 2 + 0.01, x, x + b.w / 2 - 0.01]) {
        const s = heaveAt(h, sx, world.time, world.sighStart, k);
        if (s && (!best || s.y > best.y)) best = h.group === 'sag' ? { ...s, id: h.id, noWall: true } : { ...s, id: h.id };
      }
    }
    return best;
  };
  return world;
}


export function stepHeaves(s) {
  const w = s.world;
  if (!w.heaves) return;
  const prev = w.time;
  w.time = s.time;
  const p = s.player;
  for (const h of w.heaves) {
    if (h.group === 'sag') {
      
      w.sagU ??= {};
      const u = w.sagU[h.id] ?? 0;
      const target = w.sag?.[h.id] ? 1 : 0;
      const d = STEP / SAG_EASE;
      w.sagU[h.id] = target > u ? Math.min(target, u + d) : Math.max(target, u - d);
      continue;
    }
    if (h.group === 'sigh' && w.sighStart === null && h.trigger !== undefined && p.x >= h.trigger) {
      w.sighStart = s.time;
      s.events.push({ type: 'sigh', id: h.id, x: p.x, y: h.base });
    }
    if (h.group === 'sigh' || Math.abs((h.x0 + h.x1) / 2 - p.x) > (h.x1 - h.x0) / 2 + 14) continue;
    const P = h.period ?? 4;
    const warn = (((-0.6 - (h.phase ?? 0)) % P) + P) % P; 
    const a = ((prev % P) + P) % P;
    const b = ((w.time % P) + P) % P;
    const crossed = a <= b ? warn > a && warn <= b : warn > a || warn <= b;
    if (crossed)
      s.events.push({ type: 'inhale', id: h.id, x: (h.x0 + h.x1) / 2, y: h.base + h.amp, signals: ['visual:fur-ripple', 'audio:inhale'] });
  }
}
