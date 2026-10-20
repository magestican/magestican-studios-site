













import { JUMP_VELOCITY, STEP } from './constants.js';
import { crossesBox, cutAunt, lineOf } from './enemies/aunt.js';
import { overlaps } from './entities.js';
import { launch } from './launch.js';

export const WEB = Object.freeze({
  W: 10.5, 
  Z: 0.17, 
  SAG: 0.4, 
  TAKE: 2, 
  E: 0.6, 
  PUMP: 0.9 * JUMP_VELOCITY, 
  CAP: 1.85 * JUMP_VELOCITY, 
  HUB_CAP: 2.0 * JUMP_VELOCITY, 
  V_MIN: 6, 
  V_SLING: 12, 
  REACH: 6, 
  REACH_POUND: 10, 
  POUND_D: 2.2, 
  D_CAP: 3, 
  D_CAP_HUB: 4, 
  UP: 0.25, 
  FLING_VY: 20, 
  FLING_VX: 4, 
  FLING_G: 30, 
  FLING_T: 1.2, 
  FLING_AIR: 0.5, 
  HARP_W: 6, 
  HARP_Z: 0.05,
  HUB_RING: 0.6, 
  VIEW_X: 11.5, 
  VIEW_Y: 8,
});
const HALF = Math.PI / WEB.W; 
const FLINGABLE = new Set(['bandit', 'aunt', 'goldAunt']);


export function restAt(w, x) {
  return w.y0 + ((w.y1 - w.y0) * (x - w.x0)) / (w.x1 - w.x0);
}


export function harpOff(w, harps, t) {
  if (!w.harp) return { y: 0, v: 0 };
  const h = harps?.find((x) => x.id === w.harp);
  if (!h) return { y: 0, v: 0 };
  const every = h.every ?? 1.6;
  const tau = (((t - (w.phase ?? 0)) % every) + every) % every;
  const k = Math.exp(-WEB.HARP_Z * WEB.HARP_W * tau);
  const s = Math.sin(WEB.HARP_W * tau);
  const c = Math.cos(WEB.HARP_W * tau);
  const amp = h.amp ?? 1;
  return { y: amp * k * s, v: amp * k * (WEB.HARP_W * c - WEB.HARP_Z * WEB.HARP_W * s) };
}




const ANCHOR_RAMP = 4;

function tri(w, st, x) {
  const u = Math.min(w.x1 - 0.01, Math.max(w.x0 + 0.01, st?.u ?? (w.x0 + w.x1) / 2));
  const k = Math.max(0, Math.min(1, (u - w.x0 - 0.5) / ANCHOR_RAMP, (w.x1 - u - 0.5) / ANCHOR_RAMP));
  return k * (x <= u ? (x - w.x0) / (u - w.x0) : (w.x1 - x) / (w.x1 - u));
}


export function surfaceAt(w, st, x, t, harps) {
  return restAt(w, x) + harpOff(w, harps, t).y - (st?.d ?? 0) * Math.max(0, tri(w, st, x));
}


function normalOf(w) {
  const dx = w.x1 - w.x0;
  const dy = w.y1 - w.y0;
  const L = Math.hypot(dx, dy);
  return { x: -dy / L, y: dx / L };
}


export function createWebs(level) {
  if (!level.webs?.length) return null;
  return level.webs.map((w, i) => ({ i, id: w.id, d: 0, dv: 0, u: (w.x0 + w.x1) / 2, ride: null, t: 0, base: 0, A: 0, vIn: 0, vRel: 0 }));
}







export function attachWebs(world, level) {
  const webs = level.webs;
  const harps = level.harps ?? [];
  const prev = world.floorAt;
  const clone = world.clone;
  if (clone && !clone.withWebs) {
    world.clone = () => attachWebs(clone(), level);
    world.clone.withWebs = true;
  }
  world.floorAt = (b, x = b.x) => {
    let best = prev ? prev(b, x) : null;
    const st = world.webState;
    for (let i = 0; i < webs.length; i++) {
      const w = webs[i];
      if (x < w.x0 || x > w.x1 || b.dropWeb === w.id) continue;
      const y = surfaceAt(w, st?.[i], x, world.webT ?? 0, harps);
      if (y > b.y + WEB.UP + 1e-9) continue; 
      if (!best || y > best.y) best = { y, vs: 0, id: w.id, noWall: true, web: w.id, up: WEB.UP };
    }
    return best;
  };
  return world;
}


export function trackFallSafe(s) {
  const p = s.player;
  if (!p.grounded) return;
  const f = p.floor;
  if (f?.web) {
    const w = s.level.webs.find((x) => x.id === f.web);
    if (w.harp) return; 
    const x = Math.min(w.x1 - 0.5, Math.max(w.x0 + 0.5, p.x));
    s.safe = { x, y: restAt(w, x) };
    return;
  }
  const T = s.world.tile;
  const row = Math.round(p.y / T) - 1;
  if (Math.abs((row + 1) * T - p.y) > 1e-6) return;
  const under = (x) => s.world.solid(Math.floor(x / T), row) || s.world.oneWay(Math.floor(x / T), row);
  if (under(p.x - p.w / 2 - 0.5) && under(p.x + p.w / 2 + 0.5)) s.safe = { x: p.x, y: p.y };
}


export function stepWebs(s) {
  const defs = s.level.webs;
  const harps = s.level.harps ?? [];
  const p = s.player;
  const t = s.time;
  
  for (const st of s.webs) {
    const w = defs[st.i];
    if (!st.ride) {
      st.dv += (-WEB.W * WEB.W * st.d - 2 * WEB.Z * WEB.W * st.dv) * STEP;
      st.d += st.dv * STEP;
      if (Math.abs(st.d) < 1e-4 && Math.abs(st.dv) < 1e-3) {
        st.d = 0;
        st.dv = 0;
      }
    }
    if (w.harp) {
      const h = harps.find((x) => x.id === w.harp);
      const every = h?.every ?? 1.6;
      const a = (((t - STEP - (w.phase ?? 0)) % every) + every) % every;
      const b = (((t - (w.phase ?? 0)) % every) + every) % every;
      if (b < a && Math.abs(p.y - w.y0) < 30)
        s.events.push({ type: 'pluck', id: w.harp, web: w.id, by: h?.aunt ?? null, x: (w.x0 + w.x1) / 2, y: w.y0 });
    }
  }
  if (p.dropWeb) {
    const w = defs.find((x) => x.id === p.dropWeb);
    if (!w || p.grounded || p.x < w.x0 || p.x > w.x1 || p.y < restAt(w, p.x) - 1.5) p.dropWeb = null;
  }
  const on = p.grounded && p.floor?.web ? defs.findIndex((x) => x.id === p.floor.web) : -1;
  for (const st of s.webs)
    if (st.ride && st.i !== on) {
      st.ride = null; 
      p.webStretch = false;
      p.pumpPress = false;
    }
  if (on < 0) {
    p.webOn = null;
    p.webStretch = false;
  } else ride(s, on, harps);
  if (p.webLaunch && (p.vy <= 0 || p.grounded)) p.webLaunch = false; 
  stepFlung(s);
  for (const v of s.level.ivy ?? [])
    if (v.skin === 'silk') {
      
      const inside = p.x > v.x0 && p.x < v.x1 && p.y >= v.y0 - 0.5 && p.y < v.y1;
      s.webIn ??= {};
      if (inside && !s.webIn[v.id]) s.events.push({ type: 'silkRustle', id: v.id, x: p.x, y: p.y, signals: ['audio:silk-rustle'] });
      s.webIn[v.id] = inside;
    }
}

function ride(s, i, harps) {
  const p = s.player;
  const w = s.level.webs[i];
  const st = s.webs[i];
  st.u = Math.min(w.x1 - 0.05, Math.max(w.x0 + 0.05, p.x));
  if (!st.ride) {
    const land = p.events.find((e) => e.type === 'land');
    const v = land ? land.speed : 0;
    if (w.rigid || v < WEB.TAKE) {
      st.ride = 'stand';
      p.pumpPress = false;
    } else startStretch(s, i, v, harps);
  }
  if (st.ride === 'stretch') {
    st.t += STEP;
    if (st.t >= HALF - 1e-9) {
      release(s, i, harps);
      return;
    }
    st.d = st.base + st.A * Math.sin(WEB.W * st.t);
    st.dv = st.A * WEB.W * Math.cos(WEB.W * st.t);
  } else if (w.rigid) st.d = 0;
  else {
    st.d += (WEB.SAG - st.d) * (1 - Math.exp(-12 * STEP)); 
    st.dv = 0;
  }
  p.y = surfaceAt(w, st, p.x, s.time, harps);
  p.vy = 0;
  p.webOn = w.id;
  p.webStretch = st.ride === 'stretch';
}

function startStretch(s, i, v, harps) {
  const p = s.player;
  const w = s.level.webs[i];
  const st = s.webs[i];
  const vUp = harpOff(w, harps, s.time).v; 
  st.ride = 'stretch';
  st.t = 0;
  st.base = Math.max(0, st.d);
  st.vIn = v;
  st.vRel = Math.max(0, v + vUp);
  st.A = Math.min(w.hub ? WEB.D_CAP_HUB : WEB.D_CAP, st.vRel / WEB.W);
  s.webLandN = (s.webLandN ?? 0) + 1;
  st.key = `${w.id}#${s.webLandN}`;
  s.events.push({ type: 'webLand', id: w.id, v, vRel: st.vRel, d: st.A, x: p.x, y: p.y, hub: !!w.hub });
  if (w.hub)
    s.level.webs.forEach((o, j) => {
      if (j !== i && o.orb === w.orb && !s.webs[j].ride) s.webs[j].dv += WEB.HUB_RING * v; 
    });
  if (v >= WEB.V_SLING) sling(s, i, p.x, st);
}

function release(s, i, harps) {
  const p = s.player;
  const w = s.level.webs[i];
  const st = s.webs[i];
  const pumped = !!p.pumpPress;
  let v = Math.min(WEB.E * st.vRel + (pumped ? WEB.PUMP : 0), w.hub ? WEB.HUB_CAP : WEB.CAP);
  if (w.hub && pumped) v = WEB.HUB_CAP; 
  st.d = st.base;
  st.dv = -st.A * WEB.W * WEB.E; 
  p.pumpPress = false;
  if (v < WEB.V_MIN && !pumped) {
    st.ride = 'stand';
    p.y = surfaceAt(w, st, p.x, s.time, harps);
    p.vy = 0;
    p.webOn = w.id;
    p.webStretch = false;
    s.events.push({ type: 'webSettle', id: w.id, x: p.x, y: p.y });
    return;
  }
  st.ride = null;
  const n = normalOf(w);
  p.y = surfaceAt(w, st, p.x, s.time, harps);
  launch(p, v * n.y, { cut: !pumped }); 
  if (w.slant) {
    p.vx = v * n.x;
    p.flingT = WEB.FLING_AIR;
  }
  p.ab.usedDouble = false; 
  p.ab.dashUsed = false;
  p.takeoffY = p.y;
  p.airPeak = p.y;
  p.webOn = null;
  p.webStretch = false;
  p.webLaunch = true;
  s.events.push({ type: 'webLaunch', id: w.id, v, pumped, slant: !!w.slant, hub: !!w.hub, x: p.x, y: p.y });
}


function sling(s, i, x, st) {
  const defs = s.level.webs;
  const w = defs[i];
  const reach = w.hub ? Number.POSITIVE_INFINITY : st.A >= WEB.POUND_D - 1e-9 ? WEB.REACH_POUND : WEB.REACH;
  const group = w.hub ? defs.map((o, j) => (o.orb === w.orb ? j : -1)).filter((j) => j >= 0) : [i];
  const scale = Math.hypot(w.x1 - w.x0, w.y1 - w.y0) / (w.x1 - w.x0); 
  for (const e of s.entities) {
    if (!standingOn(s, e, group)) continue;
    if (!w.hub && Math.abs(e.x - x) * scale > reach) continue;
    fling(s, e, Math.sign(e.x - x) || awayFromWall(s, e), st.key);
  }
}


function standingOn(s, e, group) {
  if (!e.alive || e.webFlung || !FLINGABLE.has(e.kind) || e.state === 'dazed' || e.state === 'scurry' || e.mode === 'cut') return false;
  if (e.kind === 'aunt' && e.mode !== 'sit') return false; 
  const defs = s.level.webs;
  for (const j of group) {
    const w = defs[j];
    if (e.x < w.x0 || e.x > w.x1) continue;
    if (Math.abs(e.y - surfaceAt(w, s.webs[j], e.x, s.time, s.level.harps)) <= 0.6) return true;
  }
  return false;
}

const awayFromWall = (s, e) => (e.x < (s.world.width * s.world.tile) / 2 ? 1 : -1);


function fling(s, e, dir, key) {
  e.webFlung = { t: 0, key };
  e.vx = WEB.FLING_VX * dir;
  e.vy = WEB.FLING_VY;
  e.grounded = false;
  const n = (s.bowls[key] ?? 0) + 1;
  s.bowls[key] = n;
  s.events.push({ type: 'fling', id: e.id, kind: e.kind, use: e.use ?? null, n, x: e.x, y: e.y, sling: true });
}


function stepFlung(s) {
  const p = s.player;
  for (const e of s.entities) {
    if (!e.alive || !e.webFlung) continue;
    e.px = e.x;
    e.py = e.y;
    e.webFlung.t += STEP;
    e.vy -= WEB.FLING_G * STEP;
    e.x += e.vx * STEP;
    e.y += e.vy * STEP;
    for (const o of s.entities) {
      if (o === e || !o.alive || o.webFlung) continue;
      if (o.kind === 'aunt' && o.mode !== 'cut' && o.mode !== 'hidden') {
        const L = lineOf(o); 
        if (L && (crossesBox(e, L) || overlaps(e, o))) {
          cutAunt(o, s, e.id);
          continue;
        }
      }
      if (FLINGABLE.has(o.kind) && o.mode !== 'cut' && o.state !== 'dazed' && o.state !== 'scurry' && o.mode !== 'hidden' && overlaps(e, o))
        fling(s, o, Math.sign(o.x - e.x) || Math.sign(e.vx) || 1, e.webFlung.key);
    }
    const gone = e.webFlung.t >= WEB.FLING_T - 1e-9 || Math.abs(e.x - p.x) > WEB.VIEW_X || Math.abs(e.y - p.y) > WEB.VIEW_Y;
    if (!gone) continue;
    if (e.kind === 'goldAunt') {
      
      if (!e.scanned) {
        e.scanned = true;
        s.events.push({ type: 'scan', id: e.id, x: e.x, y: e.y });
        s.events.push({ type: 'secret', secret: 'specimen', id: e.id });
      }
      e.webFlung = null;
      e.x = e.homeX;
      e.y = e.homeY;
      e.vx = 0;
      e.vy = 0;
      continue;
    }
    e.alive = false; 
    s.events.push({ type: 'defeat', id: e.id, kind: e.kind, how: 'fling', x: e.x, y: e.y });
  }
}
