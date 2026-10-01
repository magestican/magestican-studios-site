











































export const GAME_ID = 'feh';

export const WIRE_VERSION = 1;


export const STATE_HZ = 20;
export const STATE_MS = 1000 / STATE_HZ;
export const CREATURE_HZ = 10;
export const CREATURE_MS = 1000 / CREATURE_HZ;
export const CHECKSUM_MS = 2000;

export const MSG = Object.freeze({
  HELLO: 'hello',
  SEAT: 'seat',
  STATE: 'state',
  SHOT: 'shot',
  HIT: 'hit',
  GRAB: 'grab',
  FREE: 'free',
  CRE: 'cre',
  ENT: 'ent',
  LIFT: 'lift',
  DOWN: 'down',
  REVIVE: 'revive',
  BEAT: 'beat',
  OVER: 'over',
  SYNC: 'sync',
  SUM: 'sum',
  RESYNC: 'resync',
});


export const HOST_ONLY = Object.freeze(new Set([
  MSG.SEAT, MSG.HIT, MSG.GRAB, MSG.FREE, MSG.CRE, MSG.ENT, MSG.LIFT,
  MSG.DOWN, MSG.REVIVE, MSG.BEAT, MSG.OVER, MSG.SYNC, MSG.SUM,
]));







export const BODY_STATES = Object.freeze([
  'idle', 'walk', 'sprint', 'aim', 'fire', 'struggle', 'stumble', 'hide',
  'downed', 'dead', 'board', 'ride', 'revive',
]);
export const stateId = (name) => Math.max(0, BODY_STATES.indexOf(name));
export const stateName = (id) => BODY_STATES[id] ?? 'idle';


export const FLAG = Object.freeze({
  DEAD: 1,
  HIDDEN: 2,
  DOWNED: 4,
  LATCHED: 8,
  SPRINT: 16,
  AIM: 32,
  
  HOLD_E: 64,
});

export function packFlags(o = {}) {
  let f = 0;
  if (o.dead) f |= FLAG.DEAD;
  if (o.hidden) f |= FLAG.HIDDEN;
  if (o.downed) f |= FLAG.DOWNED;
  if (o.latched) f |= FLAG.LATCHED;
  if (o.sprint) f |= FLAG.SPRINT;
  if (o.aim) f |= FLAG.AIM;
  if (o.holdE) f |= FLAG.HOLD_E;
  return f;
}

export function unpackFlags(f = 0) {
  return {
    dead: !!(f & FLAG.DEAD),
    hidden: !!(f & FLAG.HIDDEN),
    downed: !!(f & FLAG.DOWNED),
    latched: !!(f & FLAG.LATCHED),
    sprint: !!(f & FLAG.SPRINT),
    aim: !!(f & FLAG.AIM),
    holdE: !!(f & FLAG.HOLD_E),
  };
}



const q2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const q3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;






export const stamp = (m) => ({ g: GAME_ID, ...m });

export const helloMsg = ({ name = '', wants = 'seat', build = '' } = {}) =>
  stamp({ t: MSG.HELLO, name: String(name).slice(0, 14), wants: wants === 'watch' ? 'watch' : 'seat', build, v: WIRE_VERSION });

export const seatMsg = ({ seats, level, seed, phase }) =>
  stamp({ t: MSG.SEAT, seats: { ...seats }, level, seed, phase });






export function stateMsg(body, { holdE = false, presses = 0 } = {}) {
  return stamp({
    t: MSG.STATE,
    p: [q2(body.x), q2(body.z)],
    y: q3(body.yaw),
    h: Math.round(Number(body.hp) || 0),
    s: stateId(body.state),
    w: body.weapon ?? null,
    a: body.ammo === Infinity ? -1 : Math.round(Number(body.ammo) || 0),
    f: packFlags({ ...body, holdE }),
    k: Math.max(0, Math.round(presses)),
  });
}

export const shotMsg = ({ by, from, yaw, wid }) =>
  stamp({ t: MSG.SHOT, by, from: [q2(from[0] ?? from.x), q2(from[1] ?? from.z)], yaw: q3(yaw), wid });

export const hitMsg = ({ target, limb = null, dmg = 0, by, killed = false }) =>
  stamp({ t: MSG.HIT, target, limb, dmg, by, killed: !!killed });

export const grabMsg = ({ victim, creature }) => stamp({ t: MSG.GRAB, victim, creature });
export const freeMsg = ({ victim, creature }) => stamp({ t: MSG.FREE, victim, creature });






export function creMsg(i, c) {
  return stamp({
    t: MSG.CRE,
    i,
    k: c.kind,
    p: [q2(c.x), q2(c.z)],
    s: c.state ?? 'dormant',
    alive: !!c.alive,
    latched: c.latched ?? null,
    d: Array.isArray(c.severed) ? [...c.severed] : [],
  });
}

export const entMsg = ({ gate, species }) => stamp({ t: MSG.ENT, gate, species });
export const liftMsg = ({ phase, level }) => stamp({ t: MSG.LIFT, phase, level });
export const downMsg = ({ who }) => stamp({ t: MSG.DOWN, who });
export const reviveMsg = ({ who, hp }) => stamp({ t: MSG.REVIVE, who, hp });
export const beatMsg = ({ id }) => stamp({ t: MSG.BEAT, id });
export const overMsg = ({ reason, who = null, level }) => stamp({ t: MSG.OVER, reason, who, level });


export function syncMsg({ level, seed, seats, phase, creatures = [], pickups = [], ride = null, down = {} }) {
  return stamp({
    t: MSG.SYNC,
    level,
    seed,
    seats: { ...seats },
    phase,
    
    
    creatures: creatures.map((c, i) => ({ ...creatureFacts(c, i), x: q2(c.x), z: q2(c.z) })),
    pickups: pickups.map((p) => ({ ...p })),
    ride: ride ? { ...ride } : null,
    down: { ...down },
  });
}

export const sumMsg = ({ level, n }) => stamp({ t: MSG.SUM, level, n });
export const resyncMsg = () => stamp({ t: MSG.RESYNC });






export function isForeign(msg) {
  return !msg || typeof msg !== 'object' || msg.g !== GAME_ID || typeof msg.t !== 'string';
}






export function createWorld() {
  return {
    
    bodies: {},
    
    creatures: [],
    pickups: [],
    ride: null,
    level: null,
    seed: null,
    
    
    desync: null,
  };
}


export function shortestAngle(a, b) {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
}


export function lerpBody(prev, next, alpha) {
  const a = Math.max(0, Math.min(1, Number(alpha) || 0));
  return {
    x: prev.x + (next.x - prev.x) * a,
    z: prev.z + (next.z - prev.z) * a,
    yaw: prev.yaw + shortestAngle(prev.yaw, next.yaw) * a,
  };
}


export function bodyAt(body, nowMs) {
  if (!body) return null;
  const span = body.t1 - body.t0;
  const alpha = span <= 0 ? 1 : (nowMs - body.t0) / span;
  return lerpBody(body.from, body.to, alpha);
}











export function applyState(world, msg, from, nowMs) {
  if (!from || msg?.t !== MSG.STATE) return world;
  const pose = { x: msg.p?.[0] ?? 0, z: msg.p?.[1] ?? 0, yaw: msg.y ?? 0 };
  const prev = world.bodies[from];
  const shown = prev ? bodyAt(prev, nowMs) : pose;
  const body = {
    from: shown,
    to: pose,
    t0: nowMs,
    t1: prev ? nowMs + STATE_MS : nowMs,
    hp: msg.h ?? 0,
    state: stateName(msg.s),
    weapon: msg.w ?? null,
    ammo: msg.a === -1 ? Infinity : (msg.a ?? 0),
    flags: unpackFlags(msg.f),
    
    
    presses: (prev?.presses ?? 0) + (msg.k ?? 0),
    seen: nowMs,
  };
  return { ...world, bodies: { ...world.bodies, [from]: body } };
}


export function dropBody(world, peerId) {
  if (!(peerId in world.bodies)) return world;
  const bodies = { ...world.bodies };
  delete bodies[peerId];
  return { ...world, bodies };
}


export function creatureFacts(c, i) {
  return {
    i,
    kind: c.kind ?? c.k ?? null,
    alive: !!c.alive,
    latched: c.latched ?? null,
    state: c.state ?? c.s ?? 'dormant',
    severed: Array.isArray(c.severed) ? [...c.severed] : (Array.isArray(c.d) ? [...c.d] : []),
  };
}


export function applyCreatures(world, msg) {
  if (msg?.t !== MSG.CRE || !Number.isInteger(msg.i) || msg.i < 0) return world;
  const creatures = world.creatures.slice();
  creatures[msg.i] = {
    ...creatureFacts(msg, msg.i),
    x: msg.p?.[0] ?? 0,
    z: msg.p?.[1] ?? 0,
  };
  return { ...world, creatures };
}

export function applyGrab(world, msg) {
  if (msg?.t !== MSG.GRAB) return world;
  const creatures = world.creatures.slice();
  if (creatures[msg.creature]) creatures[msg.creature] = { ...creatures[msg.creature], latched: msg.victim };
  return { ...world, creatures };
}

export function applyFree(world, msg) {
  if (msg?.t !== MSG.FREE) return world;
  const creatures = world.creatures.slice();
  if (creatures[msg.creature]) creatures[msg.creature] = { ...creatures[msg.creature], latched: null };
  return { ...world, creatures };
}


export function applySync(world, msg) {
  if (msg?.t !== MSG.SYNC) return world;
  return {
    ...world,
    level: msg.level,
    seed: msg.seed,
    creatures: (msg.creatures ?? []).map((c, i) => ({ ...creatureFacts(c, c.i ?? i), x: c.x ?? 0, z: c.z ?? 0 })),
    pickups: (msg.pickups ?? []).map((p) => ({ ...p })),
    ride: msg.ride ? { ...msg.ride } : null,
    desync: null,
  };
}


export function adoptSeats(coop, msg) {
  if (msg?.t !== MSG.SEAT && msg?.t !== MSG.SYNC) return coop;
  return {
    ...coop,
    peers: { ...(msg.seats ?? {}) },
    level: msg.level ?? coop.level,
    seed: msg.seed ?? coop.seed,
    phase: msg.phase ?? coop.phase,
    ...(msg.t === MSG.SYNC ? { down: { ...(msg.down ?? {}) } } : {}),
  };
}





const FNV_OFFSET = 0x811c9dc5;
function mixStr(h, s) {
  let x = h >>> 0;
  const str = String(s);
  for (let i = 0; i < str.length; i += 1) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 0x01000193) >>> 0;
  }
  
  x ^= 0x1f;
  return Math.imul(x, 0x01000193) >>> 0;
}









export function rosterChecksum(creatures = []) {
  let h = mixStr(FNV_OFFSET, creatures.length);
  creatures.forEach((c, i) => {
    if (!c) { h = mixStr(h, `${i}:-`); return; }
    const f = creatureFacts(c, i);
    h = mixStr(h, `${i}:${f.kind}:${f.alive ? 1 : 0}:${f.latched ?? ''}:${f.state}:${f.severed.slice().sort().join(',')}`);
  });
  return h >>> 0;
}


export function checkSum(world, msg) {
  const ours = rosterChecksum(world.creatures);
  const theirs = msg?.n >>> 0;
  return { ok: ours === theirs, ours, theirs, level: msg?.level ?? null };
}













export function pickTarget(creatures = [], shot, { range = 12, halfAngle = 0.35 } = {}) {
  const fx = -Math.sin(shot.yaw);
  const fz = Math.cos(shot.yaw);
  const ox = shot.from[0] ?? shot.from.x;
  const oz = shot.from[1] ?? shot.from.z;
  let best = -1;
  let bestDist = Infinity;
  creatures.forEach((c, i) => {
    if (!c || !c.alive) return;
    const dx = c.x - ox;
    const dz = c.z - oz;
    const dist = Math.hypot(dx, dz);
    if (dist > range || dist < 1e-6) return;
    const cos = (dx * fx + dz * fz) / dist;
    if (cos < Math.cos(halfAngle)) return;
    if (dist < bestDist) { best = i; bestDist = dist; }
  });
  return best;
}
