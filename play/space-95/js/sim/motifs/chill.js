












import { sweepY } from '../body.js';
import { STEP } from '../constants.js';
import { ENTITY_GRAVITY, overlaps, registerKind } from '../entities.js';
import { coldAt, heatAt, litHobUnder } from '../temperature.js';

export const CHILL = 0.4; 
export const BLOCK = 1.5; 
const THAW_NEUTRAL = 6; 
const HEAT_RATE = 6; 
const THAW_WARN = 4; 
const SPECIMEN_THAW = 2; 
const LADDER = 1.5; 
const MAX_FALL = 18; 
const FAST_FREEZE = 2.0; 
const BUTTON_COOL = 4; 
const SLOT_FLIGHT = 0.6; 
const ICE_TOUCH = 0.1; 
const CHILLABLE = new Set(['weevil', 'wasp']);

const snap = (v, T) => Math.round(v / T) * T;

function cellsOf(world, e) {
  const T = world.tile;
  const out = [];
  for (let r = Math.round(e.y / T); r < Math.round((e.y + e.h) / T); r++)
    for (let c = Math.round((e.x - e.w / 2) / T); c < Math.round((e.x + e.w / 2) / T); c++) out.push([c, r]);
  return out;
}


function place(s, e) {
  const w = s.world;
  const p = s.player;
  const T = w.tile;
  const fits = (b) => cellsOf(w, b).every(([c, r]) => w.code(c, r) === 0) && !(s.dead === 0 && overlaps(b, p));
  const at = { x: e.x, y: e.y, w: e.w, h: e.h };
  
  
  
  const away = Math.sign(e.x - p.x) || 1;
  const tries = [0, away * T, -away * T, away * 2 * T, -away * 2 * T, away * BLOCK, -away * BLOCK];
  const b = tries.map((dx) => ({ ...at, x: at.x + dx })).find(fits);
  if (!b) {
    e.pending = true;
    return false;
  }
  e.x = b.x;
  e.pending = false;
  e.cells = cellsOf(w, e);
  for (const [c, r] of e.cells) w.setSolid(c, r, true);
  s.events.push({ type: 'blockLand', id: e.id, x: e.x, y: e.y });
  return true;
}

function unplace(s, e) {
  for (const [c, r] of e.cells ?? []) s.world.setSolid(c, r, false);
  e.cells = null;
}


function supported(s, e) {
  const T = s.world.tile;
  const r = Math.round(e.y / T) - 1;
  for (let c = Math.round((e.x - e.w / 2) / T); c < Math.round((e.x + e.w / 2) / T); c++)
    if (s.world.solid(c, r) || s.world.oneWay(c, r)) return true;
  return false;
}


function freeze(s, e, { preset = false } = {}) {
  const T = s.world.tile;
  e.frozen = true;
  e.chill = 0;
  e.warm = 0;
  e.warned = false;
  e.w0 ??= e.w;
  e.h0 ??= e.h;
  e.w = BLOCK;
  e.h = BLOCK;
  e.x = snap(e.x - BLOCK / 2, T) + BLOCK / 2;
  e.y = snap(e.y, T);
  e.vx = 0;
  e.vy = 0;
  e.cells = null;
  const fast = s.extraCold && s.time < s.extraCold.until && s.freezeSlots?.length;
  if (fast) {
    e.slot = s.freezeSlots.shift();
    e.slotFrom = { x: e.x, y: e.y };
    e.slotT = 0;
  } else if (!supported(s, e)) e.falling = true;
  else place(s, e); 
  if (preset) return;
  s.chilled = (s.chilled ?? 0) + 1;
  s.freezeN = s.time - (s.lastFreeze ?? -99) <= LADDER ? (s.freezeN ?? 0) + 1 : 1;
  s.lastFreeze = s.time;
  s.events.push({ type: 'freeze', id: e.id, kind: e.kind, use: e.use ?? null, n: s.freezeN, x: e.x, y: e.y });
  if (e.specimen && !e.scanned) {
    e.scanned = true;
    s.events.push({ type: 'secret', secret: 'specimen', id: e.id });
  }
}

function thaw(s, e) {
  unplace(s, e);
  e.frozen = false;
  e.falling = false;
  e.pending = false;
  e.slot = null;
  e.w = e.w0;
  e.h = e.h0;
  e.chill = 0;
  s.events.push({ type: 'thaw', id: e.id, x: e.x, y: e.y });
  if (e.specimen) {
    e.thawed = true; 
    return;
  }
  e.state = 'dazed';
  e.t = 0;
  e.vx = 0;
  s.events.push({ type: 'defeat', id: e.id, kind: e.kind, how: 'chill', x: e.x, y: e.y });
}

function stepFrozen(s, e) {
  const w = s.world;
  if (e.slot) {
    e.slotT += STEP;
    const k = Math.min(1, e.slotT / SLOT_FLIGHT);
    e.x = e.slotFrom.x + (e.slot[0] - e.slotFrom.x) * k;
    e.y = e.slotFrom.y + (e.slot[1] - e.slotFrom.y) * k;
    if (k < 1) return;
    e.slot = null;
    if (!supported(s, e)) e.falling = true;
    else place(s, e);
  }
  if (e.pending && !e.falling) place(s, e);
  if (e.cells && !supported(s, e)) {
    
    unplace(s, e);
    e.falling = true;
  }
  if (e.falling) {
    e.vy = Math.max(-MAX_FALL, e.vy - ENTITY_GRAVITY * STEP);
    const my = sweepY(w, e, e.vy * STEP);
    e.y = my.y;
    if (e.y < -3) {
      e.alive = false;
      return;
    }
    if (my.hit) {
      e.vy = 0;
      e.falling = false;
      e.y = snap(e.y, w.tile);
      place(s, e);
    }
  }
  const cx = e.x;
  const cy = e.y + e.h / 2;
  let rate = 0;
  if (e.specimen) rate = THAW_NEUTRAL / SPECIMEN_THAW;
  else if (heatAt(s, cx, cy) || (e.cells && litHobUnder(s, e))) {
    rate = HEAT_RATE;
    if (!e.hissing) s.events.push({ type: 'thawWarn', id: e.id, heat: true, x: e.x, y: e.y, signals: ['audio:hiss', 'visual:steam'] });
    e.hissing = true;
  } else if (!coldAt(s, cx, cy) && !s.coldIce?.has(e)) rate = 1;
  if (rate !== HEAT_RATE) e.hissing = false;
  e.warm += rate * STEP;
  if (!e.warned && rate === 1 && e.warm >= THAW_WARN) {
    e.warned = true;
    s.events.push({ type: 'thawWarn', id: e.id, heat: false, x: e.x, y: e.y, signals: ['audio:drip', 'visual:drip'] });
  }
  if (e.warm >= THAW_NEUTRAL) thaw(s, e);
}






function touchingIce(s, e) {
  for (const o of s.entities) if (o !== e && o.alive && o.frozen && o.cells && overlaps(e, o, ICE_TOUCH)) return true;
  return false;
}







function coldIce(s) {
  const ice = s.entities.filter((o) => o.alive && o.frozen && o.cells);
  const cold = new Set(ice.filter((o) => coldAt(s, o.x, o.y + o.h / 2)));
  for (let grew = true; grew; ) {
    grew = false;
    for (const o of ice)
      if (!cold.has(o) && [...cold].some((c) => overlaps(o, c, ICE_TOUCH))) {
        cold.add(o);
        grew = true;
      }
  }
  return cold;
}


export function stepChill(s) {
  if (!s.level.colds) return;
  s.coldIce = coldIce(s);
  for (const e of s.entities) {
    if (!e.alive || !CHILLABLE.has(e.kind)) continue;
    if (e.frozen && !e.w0) {
      freeze(s, e, { preset: true }); 
      continue;
    }
    if (e.frozen) {
      stepFrozen(s, e);
      continue;
    }
    if (e.state === 'dazed' || e.state === 'scurry') continue;
    
    
    const ec = s.extraCold;
    const blasted = ec && s.time < ec.until && e.x >= ec.x0 && e.x < ec.x1 && e.y + e.h / 2 >= ec.y0 && e.y + e.h / 2 < ec.y1;
    if (!e.awake && !blasted) continue;
    if (coldAt(s, e.x, e.y + e.h / 2) || touchingIce(s, e)) {
      e.chill = (e.chill ?? 0) + STEP;
      if (e.chill >= CHILL - 1e-9) freeze(s, e);
    } else e.chill = 0;
  }
  const gate = s.entities.find((e) => e.kind === 'finish' && e.gate === 'freezer' && !e.alive && !e.opened);
  if (gate) {
    const crew = s.entities.filter((e) => e.use === 'M5' && CHILLABLE.has(e.kind));
    if (crew.length && crew.every((e) => !e.alive || e.frozen || e.state === 'dazed' || e.state === 'scurry')) {
      gate.alive = true;
      gate.opened = true;
      s.events.push({ type: 'gateOpen', id: gate.id, gate: 'freezer', x: gate.x, y: gate.y });
    }
  }
}



registerKind('freezeButton', {
  create(e) {
    e.w = 2;
    e.h = 0.5;
    e.cool = 0;
  },
  step(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    if (e.cool > 0) e.cool -= STEP;
    
    
    const vent = e.openAt !== undefined;
    if (vent) {
      if (e.vented || p.x < e.openAt) return;
      e.vented = true;
    } else {
      const pound = p.events.find((ev) => ev.type === 'pound');
      if (!pound || e.cool > 0 || Math.abs(pound.x - e.x) > e.w / 2 + 0.5 || Math.abs(pound.y - e.y) > 0.6) return;
      e.cool = BUTTON_COOL;
    }
    const z = e.zone;
    s.extraCold = { x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, until: s.time + (e.seconds ?? FAST_FREEZE) };
    if (!s.freezeSlots) s.freezeSlots = (e.slots ?? []).map((v) => [...v]);
    ctx.events.push({
      type: 'fastFreeze',
      id: e.id,
      x: e.x,
      y: e.y,
      seconds: e.seconds ?? FAST_FREEZE,
      vent,
      signals: ['visual:white-flash', 'audio:whoomph'],
    });
  },
});
