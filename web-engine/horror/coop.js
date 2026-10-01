































export const COOP = Object.freeze({
  
  seats: 2,
  
  
  
  
  
  spawnGap: 1.2,
  
  
  
  
  
  
  liftGrace: 12,
  
  
  
  
  downedFor: 20,
  
  reviveReach: 1.2,
  reviveHold: 2.5,
  
  
  
  
  revivePress: 0.25,
  
  reviveHp: 30,
  
  
  
  budgetScale: 1.4,
});


export const SEATS = Object.freeze(['host', 'guest']);

export const WATCH = 'watch';


export const CHARACTERS = Object.freeze({
  
  
  
  host: Object.freeze({ name: 'Xander', shirt: 0x9c4436 }),
  
  
  
  guest: Object.freeze({ name: 'Doyle', shirt: 0x4a7a9a }),
});










export const OBSERVER_CAN = Object.freeze({
  watch: true,          
  haveBody: false,      
  shoot: false,
  beGrabbed: false,
  board: false,         
  revive: false,
  beRevived: false,
  takeSeatMidDeck: false,
});


export const PHASES = Object.freeze(['lobby', 'deck', 'lift', 'over']);








export const SEATING_PHASES = Object.freeze(['lobby', 'lift']);










export function createCoop({ hostId = null, level = 1, seed = null, seats = COOP.seats } = {}) {
  return {
    max: seats,
    
    peers: hostId ? { [hostId]: 'host' } : {},
    
    
    wants: hostId ? { [hostId]: 'seat' } : {},
    
    order: hostId ? [hostId] : [],
    phase: 'lobby',
    level,
    seed: seed ?? level,
    
    down: {},
    
    over: null,
  };
}

export const seatOf = (coop, peerId) => coop.peers[peerId] ?? null;
export const isSeated = (coop, peerId) => SEATS.includes(seatOf(coop, peerId));
export const isObserver = (coop, peerId) => seatOf(coop, peerId) === WATCH;
export const isDown = (coop, peerId) => !!coop.down[peerId];


export function seated(coop) {
  const out = [];
  for (const s of SEATS) {
    for (const [id, seat] of Object.entries(coop.peers)) if (seat === s) out.push(id);
  }
  return out;
}

export function observers(coop) {
  return Object.entries(coop.peers).filter(([, s]) => s === WATCH).map(([id]) => id);
}


export function freeSeats(coop) {
  const held = new Set(Object.values(coop.peers));
  return SEATS.slice(0, coop.max).filter((s) => !held.has(s));
}


export function canTakeSeat(coop, peerId) {
  if (isSeated(coop, peerId)) return false;
  if (!SEATING_PHASES.includes(coop.phase)) return false;
  return freeSeats(coop).length > 0;
}









export function assignSeat(coop, peerId, wants = 'seat') {
  const want = wants === 'seat' ? 'seat' : 'watch';
  const order = coop.order.includes(peerId) ? coop.order : [...coop.order, peerId];
  const base = { ...coop, order, wants: { ...coop.wants, [peerId]: want } };
  const current = seatOf(coop, peerId);
  if (SEATS.includes(current)) return { coop: base, seat: current };
  if (want === 'watch' || !SEATING_PHASES.includes(coop.phase)) {
    return { coop: { ...base, peers: { ...coop.peers, [peerId]: WATCH } }, seat: WATCH };
  }
  const free = freeSeats(coop);
  const seat = free.length ? free[0] : WATCH;
  return { coop: { ...base, peers: { ...coop.peers, [peerId]: seat } }, seat };
}






export function releaseSeat(coop, peerId) {
  if (!(peerId in coop.peers)) return coop;
  const peers = { ...coop.peers };
  delete peers[peerId];
  const wants = { ...coop.wants };
  delete wants[peerId];
  const down = { ...coop.down };
  delete down[peerId];
  return { ...coop, peers, wants, down, order: coop.order.filter((id) => id !== peerId) };
}


export function seatWaiting(coop) {
  return coop.order.filter((id) => isObserver(coop, id) && coop.wants[id] === 'seat');
}






export function promoteWaiting(coop) {
  let next = coop;
  const promoted = [];
  if (!SEATING_PHASES.includes(coop.phase)) return { coop, promoted };
  for (const id of seatWaiting(coop)) {
    const free = freeSeats(next);
    if (!free.length) break;
    next = { ...next, peers: { ...next.peers, [id]: free[0] } };
    promoted.push([id, free[0]]);
  }
  return { coop: next, promoted };
}

export function setPhase(coop, phase) {
  if (!PHASES.includes(phase)) throw new Error(`unknown co-op phase: ${phase}`);
  return { ...coop, phase };
}











export function crossAxis(yaw) {
  return { x: Math.cos(yaw), z: Math.sin(yaw) };
}








export function spawnFor(coop, start) {
  const { x, z, yaw = 0 } = start;
  const both = seated(coop).length >= 2;
  if (!both) return { host: { x, z, yaw }, guest: null, gap: 0 };
  const c = crossAxis(yaw);
  const half = COOP.spawnGap / 2;
  return {
    host: { x: x - c.x * half, z: z - c.z * half, yaw },
    guest: { x: x + c.x * half, z: z + c.z * half, yaw },
    gap: COOP.spawnGap,
  };
}















export function liftMayDepart(coop, { inside = [], openedFor = 0 } = {}) {
  return liftDeparture(coop, { inside, openedFor }).depart;
}


export function liftDeparture(coop, { inside = [], openedFor = 0 } = {}) {
  const players = seated(coop);
  const aboard = players.filter((id) => inside.includes(id));
  const stranded = players.filter((id) => !inside.includes(id));
  if (players.length === 0 || aboard.length === 0) return { depart: false, aboard, stranded };
  if (aboard.length === players.length) return { depart: true, aboard, stranded };
  return { depart: openedFor >= COOP.liftGrace, aboard, stranded };
}






export function runOver(coop, reason, who = null) {
  return {
    ...coop,
    phase: 'over',
    over: { reason, who, level: coop.level, checkpoint: { level: coop.level } },
  };
}









export function downPlayer(coop, peerId) {
  if (!isSeated(coop, peerId) || isDown(coop, peerId) || coop.phase === 'over') return coop;
  const others = seated(coop).filter((id) => id !== peerId);
  if (others.length === 0) return runOver(coop, 'alone', peerId);
  const next = { ...coop, down: { ...coop.down, [peerId]: { left: COOP.downedFor, revive: 0 } } };
  if (others.every((id) => isDown(coop, id))) return runOver(next, 'bothDown', peerId);
  return next;
}


export function stepDowned(coop, dt) {
  const ids = Object.keys(coop.down);
  if (!ids.length || coop.phase === 'over') return coop;
  const down = {};
  for (const id of ids) down[id] = { ...coop.down[id], left: coop.down[id].left - dt };
  const next = { ...coop, down };
  const gone = ids.find((id) => down[id].left <= 0);
  return gone ? runOver(next, 'bledOut', gone) : next;
}














export function stepRevive(coop, dt, { who, by, dist = Infinity, holding = false, presses = 0 } = {}) {
  const d = coop.down[who];
  if (!d || coop.phase === 'over') return { coop, revived: null, progress: 0 };
  const able = isSeated(coop, by) && by !== who && !isDown(coop, by) && dist <= COOP.reviveReach;
  if (!able) return { coop, revived: null, progress: d.revive / COOP.reviveHold };
  const gained = (holding ? dt : 0) + Math.max(0, presses) * COOP.revivePress;
  const revive = Math.min(COOP.reviveHold, d.revive + gained);
  if (revive >= COOP.reviveHold) {
    const down = { ...coop.down };
    delete down[who];
    return { coop: { ...coop, down }, revived: { who, hp: COOP.reviveHp, by }, progress: 1 };
  }
  return {
    coop: { ...coop, down: { ...coop.down, [who]: { ...d, revive } } },
    revived: null,
    progress: revive / COOP.reviveHold,
  };
}






export function directorBudget(coop, base) {
  return seated(coop).length >= 2 ? Math.round(base * COOP.budgetScale) : base;
}






export function creatureDamageFor(latchedTo, peerId, amount) {
  return latchedTo != null && latchedTo === peerId ? amount : 0;
}
