









import { FALL_GRAVITY, GRAVITY, STEP } from './constants.js';

const LIFT = 7; 
const LIFT_ACCEL = 40; 
const TOP_FADE = 2; 
const CUSHION_FALL = 6; 
const GLIDE_SINK = 2.5; 
const GLIDE_CATCH = 30; 
const WARN = 0.6; 
const WARN_RANGE = 14; 


export function zoneOn(z, t) {
  if (!z.pulse) return true;
  const P = z.pulse.on + z.pulse.off;
  const tau = (((t + (z.pulse.phase ?? 0)) % P) + P) % P;
  return tau < z.pulse.on;
}

const inZone = (z, p) => {
  const cx = p.x;
  const cy = p.y + p.h / 2;
  return cx >= z.x0 && cx < z.x1 && cy >= z.y0 && cy < z.y1;
};


function updraftAt(world, p) {
  if (!world.updrafts) return null;
  for (const z of world.updrafts) if (inZone(z, p) && zoneOn(z, world.time ?? 0)) return z;
  return null;
}





export function glideVy(world, p) {
  const z = updraftAt(world, p);
  if (z) {
    const lift = z.lift ?? LIFT;
    const k = Math.max(0, Math.min(1, (z.y1 - (p.y + p.h / 2)) / TOP_FADE));
    const target = -GLIDE_SINK + (lift + GLIDE_SINK) * k;
    const d = LIFT_ACCEL * STEP;
    return p.vy < target ? Math.min(p.vy + d, target) : Math.max(p.vy - d, target);
  }
  if (p.vy > -GLIDE_SINK) return Math.max(-GLIDE_SINK, p.vy - GRAVITY * FALL_GRAVITY * STEP);
  return Math.min(-GLIDE_SINK, p.vy + GLIDE_CATCH * STEP);
}


export function windCushion(world, p) {
  if (p.grounded || p.gliding || p.ab?.pound || p.vy >= -CUSHION_FALL) return;
  if (updraftAt(world, p)) p.vy = -CUSHION_FALL;
}


export function gustDx(world, p) {
  if (!world.gusts || p.grounded) return 0;
  const k = p.gliding ? 1 : 0.5;
  let dx = 0;
  for (const z of world.gusts) if (inZone(z, p) && zoneOn(z, world.time ?? 0)) dx += z.vx * k * STEP;
  return dx;
}


export function attachWind(world, level) {
  if (level.updrafts?.length) world.updrafts = level.updrafts;
  if (level.gusts?.length) world.gusts = level.gusts;
  world.time = world.time ?? 0;
  return world;
}

const SIGNALS = {
  updraft: ['visual:mote-flare', 'audio:rising-whistle'],
  gust: ['visual:streak-thicken', 'audio:whoosh-swell'],
};


export function stepWind(s) {
  const w = s.world;
  if (!w.updrafts && !w.gusts) return;
  const prev = s.time - STEP;
  w.time = s.time;
  const p = s.player;
  for (const [zone, list] of [
    ['updraft', w.updrafts],
    ['gust', w.gusts],
  ]) {
    for (const z of list ?? []) {
      if (!z.pulse) continue;
      if (p.x < z.x0 - WARN_RANGE || p.x > z.x1 + WARN_RANGE) continue;
      const P = z.pulse.on + z.pulse.off;
      const warn = (((-WARN - (z.pulse.phase ?? 0)) % P) + P) % P; 
      const a = ((prev % P) + P) % P;
      const b = ((w.time % P) + P) % P;
      const crossed = a <= b ? warn > a && warn <= b : warn > a || warn <= b;
      if (crossed)
        s.events.push({
          type: 'windWarn',
          zone,
          id: z.id,
          x: (z.x0 + z.x1) / 2,
          y: (z.y0 + z.y1) / 2,
          seconds: WARN,
          signals: SIGNALS[zone],
        });
    }
  }
}
