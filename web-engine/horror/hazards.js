







































import { actFor, isBossDeck, openingGate } from './acts.js';
import { archetypeFor } from './archetypes.js';
import { gatesFor } from './gates.js';
import {
  seededRng, insideLevel, progressAt, routeLength, routePointAt, wallPointAt, corners,
} from './level.js';

export const HAZARD_KINDS = Object.freeze(['fire', 'gas', 'electric', 'steam']);

export const HAZARD = Object.freeze({
  
  
  countByAct: { 1: 1, 2: 2, 3: 3 },
  
  
  
  
  minFromStart: 6,
  firstAt: 14,
  lastMargin: 6,
  minFromBay: 4,
  
  
  
  
  
  
  
  
  minFromDoor: 2.5,         
  fittingFromDoor: 1.5,     
  minFromCorner: 1.7,       
  minFromGate: 3,
  minFromOpening: 8,
  spacing: 12,
  attempts: 80,
  playerPad: 0.4,
  fire: {
    length: 3.0,          
    widthFrac: 0.5,       
    dps: 8,
    lightRadius: 6,
    burnsFor: 40,
    dieDown: 6,           
    edge: 0.35,           
    blockAbove: 0.35,     
    
    
    
    
    
    
    
    
    
    
    blockPast: 0.15,
    colour: 0xff7a1c,
  },
  gas: {
    band: 5,              
    visionCut: 0.6,
    coughEvery: 2,
    dps: 1.5,
    valveWithin: 3,       
    valveBeyond: 1.0,     
    useReach: 1.3,        
    clearSeconds: 4,
  },
  electric: {
    puddleR: 1.0,
    arcEvery: [1.2, 3.0],
    arcSeconds: 0.18,
    hit: 12,
    stagger: 0.6,
    boxR: 0.35,
    boxHeight: 1.4,
    cableTip: 1.2,        
  },
  steam: {
    on: 2,
    off: 3.5,
    dps: 6,
    hissLead: 0.4,
    width: 1.0,           
  },
});



export const EXTENT = Object.freeze({ fire: 1.5, gas: 2.5, electric: 1.0, steam: 0.5 });

function shuffle(list, r) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const distToRect = (rc, x, z) => {
  const dx = Math.max(rc.x0 - x, 0, x - rc.x1);
  const dz = Math.max(rc.z0 - z, 0, z - rc.z1);
  return Math.hypot(dx, dz);
};




function draw(rs) {
  let s = rs >>> 0 || 1;
  s ^= s << 13; s >>>= 0;
  s ^= s >> 17;
  s ^= s << 5; s >>>= 0;
  return { rs: s, v: s / 4294967296 };
}



export function localOf(h, x, z) {
  return {
    u: (x - h.x) * h.dir.x + (z - h.z) * h.dir.z,
    v: (x - h.x) * h.lat.x + (z - h.z) * h.lat.z,
  };
}





function initialState(kind, seed) {
  const r0 = draw((seed * 2654435761) >>> 0);
  switch (kind) {
    case 'fire': return { t: 0, phase: 'burning', intensity: 1 };
    case 'gas': return { t: 0, phase: 'leaking', density: 1, coughT: 0, closeT: 0 };
    case 'electric': {
      const [lo, hi] = HAZARD.electric.arcEvery;
      return {
        t: 0, phase: 'live', rs: r0.rs, nextArc: lo + r0.v * (hi - lo), arcT: 0,
        hitThisArc: false, arcs: 0,
      };
    }
    case 'steam': {
      const cycle = HAZARD.steam.on + HAZARD.steam.off;
      return { t: 0, phase: 'off', offset: HAZARD.steam.on + r0.v * (cycle - HAZARD.steam.on - 0.5) };
    }
    default: throw new Error(`unknown hazard kind: ${kind}`);
  }
}





export function makeHazard(kind, plan, level, progress, side, seed) {
  const p = routePointAt(plan, progress);
  const run = plan.runs[p.run];
  const ext = EXTENT[kind];
  const back = routePointAt(plan, progress - ext);
  const fwd = routePointAt(plan, progress + ext);
  if (back.run !== p.run || fwd.run !== p.run) return null;
  const s = side >= 0 ? 1 : -1;
  const lat = run.axis === 'z' ? { x: 1, z: 0 } : { x: 0, z: 1 };
  const h = {
    id: `${kind}-${level}-${Math.round(progress)}`,
    kind, level, run: p.run, axis: run.axis, progress, side: s,
    x: p.x, z: p.z, dir: p.dir, lat, half: run.w / 2,
    s: initialState(kind, seed),
  };
  const inFromWall = (w, d) => ({ x: w.x + w.nx * d, z: w.z + w.nz * d, nx: w.nx, nz: w.nz });
  if (kind === 'fire') {
    h.length = HAZARD.fire.length;
  } else if (kind === 'gas') {
    const vp = progress + HAZARD.gas.band / 2 + HAZARD.gas.valveBeyond;
    if (routePointAt(plan, vp).run !== p.run) return null;
    h.band = HAZARD.gas.band;
    h.valve = { ...inFromWall(wallPointAt(plan, vp, s), 0.25), y: 1.2, progress: vp };
  } else if (kind === 'electric') {
    h.puddleR = HAZARD.electric.puddleR;
    h.box = { ...inFromWall(wallPointAt(plan, progress, s), 0.08), y: HAZARD.electric.boxHeight };
    h.cable = { x: p.x, z: p.z, top: plan.height, tip: HAZARD.electric.cableTip };
  } else if (kind === 'steam') {
    h.width = HAZARD.steam.width;
    h.vent = { ...inFromWall(wallPointAt(plan, progress, s), 0.05), y: 1.1 };
  }
  return h;
}








export function wallPartsOf(h) {
  const parts = [h.valve, h.box, h.vent].filter(Boolean).map((w) => ({ x: w.x, z: w.z }));
  if (h.kind === 'fire') {
    parts.push({ x: h.x + h.lat.x * h.side * h.half, z: h.z + h.lat.z * h.side * h.half });
  }
  return parts;
}




export function fireInner(h) {
  return h.half - 2 * h.half * HAZARD.fire.widthFrac;
}



export function insideHazard(h, x, z) {
  const { u, v } = localOf(h, x, z);
  switch (h.kind) {
    case 'fire': {
      const e = HAZARD.fire.edge;
      const vs = v * h.side;
      return Math.abs(u) <= h.length / 2 + e && vs >= fireInner(h) - e && vs <= h.half + e;
    }
    case 'gas': return Math.abs(u) <= h.band / 2 && Math.abs(v) <= h.half;
    case 'electric': return Math.hypot(u, v) <= h.puddleR;
    case 'steam': return Math.abs(u) <= h.width / 2 && Math.abs(v) <= h.half;
    default: return false;
  }
}


export function footprint(h) {
  const rect = (u0, u1, v0, v1) => ({
    shape: 'rect',
    corners: [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => ({
      x: h.x + h.dir.x * u + h.lat.x * v,
      z: h.z + h.dir.z * u + h.lat.z * v,
    })),
  });
  switch (h.kind) {
    case 'fire': return h.side > 0
      ? rect(-h.length / 2, h.length / 2, fireInner(h), h.half)
      : rect(-h.length / 2, h.length / 2, -h.half, -fireInner(h));
    case 'gas': return rect(-h.band / 2, h.band / 2, -h.half, h.half);
    case 'steam': return rect(-h.width / 2, h.width / 2, -h.half, h.half);
    case 'electric': return { shape: 'circle', x: h.x, z: h.z, r: h.puddleR };
    default: return null;
  }
}











export function hazardBlockers(h) {
  if (h.kind !== 'fire') return [];
  if (h.s.intensity <= HAZARD.fire.blockAbove) return [];
  const out = [];
  
  
  
  const inner = fireInner(h);
  const v = h.side * ((h.half + inner) / 2);
  const r = (h.half - inner) / 2 + HAZARD.fire.blockPast;
  for (const u of [-1.2, -0.4, 0.4, 1.2]) {
    out.push({
      x: h.x + h.dir.x * u + h.lat.x * v,
      z: h.z + h.dir.z * u + h.lat.z * v,
      r,
    });
  }
  return out;
}











export function placeHazards(plan, level, seed = plan.seed) {
  if (isBossDeck(level)) return [];
  const act = actFor(level);
  const arch = archetypeFor(level);
  const count = HAZARD.countByAct[Math.min(3, Math.max(1, act))] || 1;
  const r = seededRng(seed * 15485863 + level * 4099 + 17);
  const kinds = shuffle(arch.hazards, r).slice(0, count);

  const gates = gatesFor(plan, seed, { act });
  const opening = openingGate(plan, level, seed);
  const doors = plan.rooms.map((m) => ({ ...m.door, progress: progressAt(plan, m.door.x, m.door.z) }));
  const bays = plan.bays || [];
  const cs = corners(plan);
  const startP = progressAt(plan, plan.start.x, plan.start.z);
  const total = routeLength(plan);
  const placed = [];

  const legal = (h) => {
    const ext = EXTENT[h.kind];
    if (h.progress - startP < HAZARD.minFromStart) return false;
    if (Math.hypot(h.x - plan.start.x, h.z - plan.start.z) < HAZARD.minFromStart) return false;
    if (!insideLevel(plan, h.x, h.z, HAZARD.playerPad)) return false;
    
    
    for (const c of cs) if (Math.abs(c.progress - h.progress) < HAZARD.minFromCorner + ext) return false;
    for (const d of doors) {
      if (Math.abs(d.progress - h.progress) < HAZARD.minFromDoor + ext) return false;
    }
    for (const b of bays) if (distToRect(b, h.x, h.z) < HAZARD.minFromBay + ext) return false;
    if (opening && Math.hypot(h.x - opening.x, h.z - opening.z) < HAZARD.minFromOpening) return false;
    for (const o of placed) if (Math.abs(o.progress - h.progress) < HAZARD.spacing) return false;
    
    
    
    
    
    
    
    
    const wallParts = wallPartsOf(h);
    for (const g of gates) {
      for (const w of wallParts) if (Math.hypot(w.x - g.x, w.z - g.z) < HAZARD.minFromGate) return false;
    }
    
    for (const w of [h.valve, h.box, h.vent]) {
      if (!w) continue;
      if (!insideLevel(plan, w.x + w.nx * 0.25, w.z + w.nz * 0.25, 0.2)) return false;
      if (insideLevel(plan, w.x - w.nx * 0.3, w.z - w.nz * 0.3, 0.05)) return false;   
      for (const d of doors) if (Math.hypot(w.x - d.x, w.z - d.z) < HAZARD.fittingFromDoor) return false;
    }
    return true;
  };

  kinds.forEach((kind, ki) => {
    const lo = startP + HAZARD.firstAt;
    const hi = total - HAZARD.lastMargin;
    for (let attempt = 0; attempt < HAZARD.attempts; attempt += 1) {
      const p = lo + r() * Math.max(0, hi - lo);
      const side = r() < 0.5 ? -1 : 1;
      const h = makeHazard(kind, plan, level, p, side, seed * 31 + ki * 7 + attempt + 1);
      if (!h || !legal(h)) continue;
      placed.push(h);
      break;
    }
  });
  return placed;
}





const frame = (h, extra = {}) => ({
  h, damage: 0, stagger: 0, cough: false, vision: 1, light: null,
  blockers: hazardBlockers(h), events: [], inside: false, ...extra,
});

function stepFire(h, dt, inside) {
  const c = HAZARD.fire;
  const t = h.s.t + dt;
  let phase = 'burning'; let intensity = 1;
  if (t >= c.burnsFor + c.dieDown) { phase = 'out'; intensity = 0; }
  else if (t >= c.burnsFor) { phase = 'dying'; intensity = 1 - (t - c.burnsFor) / c.dieDown; }
  const n = { ...h, s: { ...h.s, t, phase, intensity } };
  const events = [];
  if (phase !== h.s.phase) events.push(phase);
  const burning = inside && intensity > 0;
  return frame(n, {
    inside,
    damage: burning ? c.dps * intensity * dt : 0,
    light: intensity > 0
      ? { x: h.x, z: h.z, radius: c.lightRadius * (0.4 + 0.6 * intensity), intensity, colour: c.colour }
      : null,
    events,
  });
}

function stepGas(h, dt, inside) {
  const c = HAZARD.gas;
  const s = { ...h.s, t: h.s.t + dt };
  const events = [];
  if (s.phase === 'clearing') {
    s.closeT += dt;
    s.density = Math.max(0, 1 - s.closeT / c.clearSeconds);
    if (s.density <= 0) { s.phase = 'clear'; s.density = 0; events.push('clear'); }
  }
  let cough = false;
  if (inside && s.density > 0.3) {
    s.coughT += dt;
    if (s.coughT >= c.coughEvery) { s.coughT -= c.coughEvery; cough = true; }
  } else {
    s.coughT = 0;
  }
  const n = { ...h, s };
  return frame(n, {
    inside,
    damage: inside ? c.dps * s.density * dt : 0,
    cough,
    vision: inside ? 1 - c.visionCut * s.density : 1,
    events,
  });
}

function stepElectric(h, dt, inside) {
  const c = HAZARD.electric;
  if (h.s.phase === 'dead') return frame(h, { inside });
  const s = { ...h.s, t: h.s.t + dt };
  const events = [];
  let damage = 0; let stagger = 0;
  if (s.arcT > 0) s.arcT = Math.max(0, s.arcT - dt);
  if (s.arcT === 0 && s.t >= s.nextArc) {
    const d = draw(s.rs);
    s.rs = d.rs;
    s.nextArc = c.arcEvery[0] + d.v * (c.arcEvery[1] - c.arcEvery[0]);
    s.t = 0;
    s.arcT = c.arcSeconds;
    s.hitThisArc = false;
    s.arcs += 1;
    events.push('arc');
  }
  if (s.arcT > 0 && inside && !s.hitThisArc) {
    s.hitThisArc = true;
    damage = c.hit;
    stagger = c.stagger;
    events.push('shock');
  }
  const n = { ...h, s };
  return frame(n, { inside, damage, stagger, arc: s.arcT > 0, hum: true, events });
}

function stepSteam(h, dt, inside) {
  const c = HAZARD.steam;
  const cycle = c.on + c.off;
  const t = h.s.t + dt;
  const at = (h.s.offset + t) % cycle;
  const phase = at < c.on ? 'on' : (at >= cycle - c.hissLead ? 'hiss' : 'off');
  const events = [];
  if (phase !== h.s.phase) events.push(phase === 'on' ? 'blast' : phase === 'hiss' ? 'hiss' : 'stop');
  const n = { ...h, s: { ...h.s, t, phase } };
  return frame(n, {
    inside,
    damage: phase === 'on' && inside ? c.dps * dt : 0,
    blast: phase === 'on',
    
    k: phase === 'on' ? at / c.on : 0,
    events,
  });
}













export function stepHazard(h, dt, player = null) {
  const step = Math.max(0, dt || 0);
  const inside = player ? insideHazard(h, player.x, player.z) : false;
  switch (h.kind) {
    case 'fire': return stepFire(h, step, inside);
    case 'gas': return stepGas(h, step, inside);
    case 'electric': return stepElectric(h, step, inside);
    case 'steam': return stepSteam(h, step, inside);
    default: throw new Error(`unknown hazard kind: ${h.kind}`);
  }
}






export function interactHazard(h, player) {
  if (h.kind !== 'gas' || h.s.phase !== 'leaking' || !player) return { h, ok: false };
  const d = Math.hypot(player.x - h.valve.x, player.z - h.valve.z);
  if (d > HAZARD.gas.useReach) return { h, ok: false };
  return { h: { ...h, s: { ...h.s, phase: 'clearing', closeT: 0 } }, ok: true, event: 'valveClosed' };
}






export function shootHazard(h, hit) {
  if (h.kind !== 'electric' || h.s.phase !== 'live' || !hit) return { h, hit: false };
  const y = Number.isFinite(hit.y) ? hit.y : h.box.y;
  const d = Math.hypot(hit.x - h.box.x, hit.z - h.box.z, y - h.box.y);
  if (d > HAZARD.electric.boxR) return { h, hit: false };
  return { h: { ...h, s: { ...h.s, phase: 'dead', arcT: 0 } }, hit: true, event: 'boxShot' };
}



export function hazardLive(h) {
  switch (h.kind) {
    case 'fire': return h.s.phase !== 'out';
    case 'gas': return h.s.phase !== 'clear';
    case 'electric': return h.s.phase === 'live';
    default: return true;
  }
}
