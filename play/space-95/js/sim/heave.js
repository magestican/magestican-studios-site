








const TAU = Math.PI * 2;


export const LAUNCH_GAIN = 2;


export const MAX_BOOST = 6.5;


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


export function heaveAt(h, x, t, sighStart = null) {
  if (x < h.x0 || x >= h.x1) return null;
  const w = taperW(h, x);
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
      return c;
    };
    world.clone.withHeaves = true;
  }
  world.floorAt = (b, x = b.x) => {
    let best = null;
    for (const h of heaves) {
      for (const sx of [x - b.w / 2 + 0.01, x, x + b.w / 2 - 0.01]) {
        const s = heaveAt(h, sx, world.time, world.sighStart);
        if (s && (!best || s.y > best.y)) best = { ...s, id: h.id };
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
