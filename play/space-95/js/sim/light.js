

























import { LANTERN } from './abilities.js';
import { STEP } from './constants.js';

export const LIGHT = Object.freeze({
  PERCH_R: 3.5, 
  BURST_TIME: 1.5, 
  IVY_NEAR: 1.5, 
});





export const LIGHT_COLOURS = Object.freeze({
  firefly: 0xc8f560, 
  lantern: 0xfff4d0, 
  moon: 0xc8c0ff, 
  solarLamp: 0xe8f0ff, 
  security: 0xfff8e8,
  specimen: 0x3d8bff, 
  navLamp: 0x39e07a, 
});

const mod = (a, n) => ((a % n) + n) % n;


export function createLight(level) {
  if (!level.dark) return null;
  return {
    cloudT0: null, 
    moon: 'out', 
    security: { on: false, t: 0, cool: 0 },
    lampsOn: Object.fromEntries((level.lamps ?? []).filter((l) => !l.security).map((l) => [l.id, true])),
    ivyShown: {},
    ivyIn: {},
    
    sources: [],
  };
}


export function moonPhase(level, t0, t) {
  const c = level.moon?.clouds;
  if (!c || t0 === null) return 'out';
  const tau = mod(t - t0, c.every);
  if (tau >= c.every - c.cover) return 'cover';
  return tau >= c.every - c.cover - c.warn ? 'warn' : 'out';
}


export function moonLeft(s) {
  const c = s.level.moon?.clouds;
  const L = s.light;
  if (!c || !L || L.cloudT0 === null) return Number.POSITIVE_INFINITY;
  const tau = mod(s.time - L.cloudT0, c.every);
  return tau >= c.every - c.cover ? 0 : c.every - c.cover - tau;
}


function lampOn(lamp, t) {
  const f = lamp.flicker;
  if (!f) return true;
  return mod(t + (f.phase ?? 0), f.on + f.off) < f.on;
}


export function lampLeft(lamp, t) {
  const f = lamp.flicker;
  if (!f) return Number.POSITIVE_INFINITY;
  const tau = mod(t + (f.phase ?? 0), f.on + f.off);
  return tau < f.on ? f.on - tau : 0;
}

const SKY = new WeakMap(); 


function skyOpen(level, x, y) {
  let cache = SKY.get(level);
  if (!cache) {
    cache = new Map();
    SKY.set(level, cache);
  }
  const w = level.world;
  const T = w.tile;
  const c = Math.floor(x / T);
  const r0 = Math.floor((y + 0.01) / T);
  const key = c * 100000 + r0;
  let open = cache.get(key);
  if (open === undefined) {
    open = true;
    for (let r = Math.max(0, r0); r < w.height && open; r++) if (w.solid(c, r)) open = false;
    cache.set(key, open);
  }
  return open;
}


export function lightAt(s, x, y) {
  const L = s.light;
  if (!L) return false;
  for (const q of L.sources) {
    if (q.r === undefined) {
      if (x >= q.x0 && x < q.x1 && (q.kind !== 'moon' || skyOpen(s.level, x, y))) return true;
    } else if (Math.hypot(x - q.x, y - q.y) <= q.r) return true;
  }
  return false;
}


export function stepLight(s) {
  const L = s.light;
  const lv = s.level;
  const p = s.player;
  const t = s.time;
  const ev = s.events;
  const clouds = lv.moon?.clouds;
  if (clouds && L.cloudT0 === null && p.x >= clouds.fromX) L.cloudT0 = t;
  const was = L.moon;
  L.moon = moonPhase(lv, L.cloudT0, t);
  if (L.moon !== was) {
    if (L.moon === 'warn') ev.push({ type: 'cloudWarn', seconds: clouds.warn, signals: ['visual:moon-dim', 'audio:wind-whoosh'] });
    else if (L.moon === 'cover') ev.push({ type: 'cloudCover', seconds: clouds.cover });
    else ev.push({ type: 'moonOut' });
  }
  const src = [];
  if (L.moon !== 'cover') for (const m of lv.moons ?? []) src.push({ kind: 'moon', x0: m.x0, x1: m.x1 });
  for (const lamp of lv.lamps ?? []) {
    if (lamp.security) {
      const S = L.security;
      if (S.cool > 0) S.cool -= STEP;
      if (S.on) {
        S.t += STEP;
        if (S.t >= lamp.on - 1e-9) {
          S.on = false;
          S.cool = lamp.cooldown ?? 10;
          ev.push({ type: 'securityOff', id: lamp.id });
        }
      } else if (S.cool <= 0 && p.x >= lamp.sensor[0] && p.x <= lamp.sensor[1] && Math.abs(p.vx) > 0.5) {
        S.on = true;
        S.t = 0;
        ev.push({ type: 'securityOn', id: lamp.id, x0: lamp.cover[0], x1: lamp.cover[1], seconds: lamp.on });
      }
      if (S.on) src.push({ kind: 'security', id: lamp.id, x0: lamp.cover[0], x1: lamp.cover[1] });
      continue;
    }
    const on = lampOn(lamp, t);
    if (on !== L.lampsOn[lamp.id]) {
      L.lampsOn[lamp.id] = on;
      ev.push({ type: on ? 'lampOn' : 'lampOff', id: lamp.id, x: lamp.x, y: lamp.y });
    }
    if (on) src.push({ kind: 'lamp', id: lamp.id, x: lamp.x, y: lamp.y, r: lamp.r });
  }
  const F = s.flock;
  if (F) {
    for (const sw of F.swarms)
      if (sw.state !== 'lifted')
        for (let k = 0; k < sw.perches.length; k++)
          if (sw.perched[k]) src.push({ kind: 'perch', id: `${sw.id}:${k}`, x: sw.perches[k][0], y: sw.perches[k][1], r: LIGHT.PERCH_R });
    for (const b of F.bursts) if (b.t < LIGHT.BURST_TIME) src.push({ kind: 'burst', id: b.id, x: b.x, y: b.cy, r: b.r });
  }
  const lan = p.lantern;
  if (lan && lan.r > LANTERN.GLOW + 1e-9) src.push({ kind: 'lantern', x: p.x, y: p.y + p.h / 2 + LANTERN.RAISE_Y, r: lan.r });
  L.sources = src;
  for (const v of lv.ivy ?? []) stepIvy(s, v);
}

function stepIvy(s, v) {
  const L = s.light;
  const p = s.player;
  const dx = Math.max(v.x0 - (p.x + p.w / 2), 0, p.x - p.w / 2 - v.x1);
  const dy = Math.max(v.y0 - (p.y + p.h), 0, p.y - v.y1);
  const near = Math.hypot(dx, dy) <= LIGHT.IVY_NEAR;
  if (!L.ivyShown[v.id] && (near || lightAt(s, (v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2))) {
    L.ivyShown[v.id] = true;
    s.events.push({ type: 'ivyShown', id: v.id, x: (v.x0 + v.x1) / 2, y: v.y0 });
  }
  const inside = dx === 0 && dy === 0;
  if (inside && !L.ivyIn[v.id]) s.events.push({ type: 'ivyRustle', id: v.id, x: p.x, y: p.y, signals: ['audio:ivy-rustle'] });
  L.ivyIn[v.id] = inside;
  for (const e of s.entities) if (e.ivy === v.id) e.hidden = !L.ivyShown[v.id];
}
