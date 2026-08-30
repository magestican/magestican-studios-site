



































import { comparePeerIds } from '../net/hostElection.js';
import { desiredBots, hasRoom, pickBotToDisplaceTeamless } from '../scenarios/matchRoster.js';















export const KART_MSG = Object.freeze({
  HELLO:     'fkHello',   
  
  
  
  
  
  LOBBY:     'fkLobby',   
  CLAIM:     'fkClaim',   
  READY:     'fkReady',   
  START:     'fkStart',   
  SNAP:      'fkSnap',    
  BOTS:      'fkBots',    
  SEATS:     'fkSeats',   
  EVENT:     'fkEvent',   
  STANDINGS: 'fkStand',   
  FINISH:    'fkFin',     
  BYE:       'fkBye',     
});









export const SNAPSHOT_HZ = 20;
export const SNAPSHOT_MS = 1000 / SNAPSHOT_HZ;

















export const INTERP_DELAY_MS = 100;









export const EXTRAPOLATE_MS = 250;






export const STALL_MS = 2000;





export const SNAPSHOT_BUFFER = 4;
























export function makeSnapshot(kart, { seat, seq }) {
  return {
    i: seat,
    q: seq,
    p: [round2(kart.x), round2(kart.y), round2(kart.z)],
    h: round3(kart.heading),
    v: [round2(kart.vx), round2(kart.vz)],
    s: round2(kart.speed ?? 0),
    d: kart.driftTier ?? 0,
    b: kart.boost ? 1 : 0,
    
    
    
    
    
    
    
    
    
    
    
    
    
    g: kart.gliding ? 1 : 0,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    r: kart.grinding ? 1 : 0,
    w: kart.boating ? 1 : 0,
  };
}




const round2 = (n) => Math.round((n ?? 0) * 100) / 100;
const round3 = (n) => Math.round((n ?? 0) * 1000) / 1000;


export function createRemote(seat) {
  return {
    seat,
    
    buf: [],
    
    seq: -1,
    lastAt: null,
  };
}




















export function receiveSnapshot(remote, snap, now) {
  if (!remote || !snap) return false;
  
  
  
  
  
  if (snap.q != null && snap.q <= remote.seq) return false;
  if (snap.q != null) remote.seq = snap.q;
  remote.buf.push({ snap, rt: now });
  remote.lastAt = now;
  while (remote.buf.length > SNAPSHOT_BUFFER) remote.buf.shift();
  return true;
}









export function isStalled(remote, now, stallMs = STALL_MS) {
  if (!remote || remote.lastAt == null) return false;
  return now - remote.lastAt > stallMs;
}


export function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

const lerp = (a, b, t) => a + (b - a) * t;

















export function sampleRemote(remote, now, { delayMs = INTERP_DELAY_MS } = {}) {
  if (!remote || !remote.buf.length) return null;
  const target = now - delayMs;
  const buf = remote.buf;

  
  
  
  if (target <= buf[0].rt) return frame(buf[0].snap, 'hold', now - buf[0].rt);

  for (let i = 0; i < buf.length - 1; i += 1) {
    const a = buf[i];
    const b = buf[i + 1];
    if (target >= a.rt && target <= b.rt) {
      const span = b.rt - a.rt;
      
      const t = span > 0 ? (target - a.rt) / span : 1;
      const A = a.snap;
      const B = b.snap;
      return {
        x: lerp(A.p[0], B.p[0], t),
        y: lerp(A.p[1], B.p[1], t),
        z: lerp(A.p[2], B.p[2], t),
        heading: lerpAngle(A.h, B.h, t),
        speed: lerp(A.s ?? 0, B.s ?? 0, t),
        vx: lerp(A.v?.[0] ?? 0, B.v?.[0] ?? 0, t),
        vz: lerp(A.v?.[1] ?? 0, B.v?.[1] ?? 0, t),
        
        
        
        driftTier: B.d ?? 0,
        boosting: !!B.b,
        
        
        
        
        gliding: !!B.g,
        grinding: !!B.r,
        boating: !!B.w,
        mode: 'interp',
        ageMs: now - b.rt,
      };
    }
  }

  
  const last = buf[buf.length - 1];
  const ahead = target - last.rt;
  const dt = Math.min(ahead, EXTRAPOLATE_MS) / 1000;
  const f = frame(last.snap, ahead > EXTRAPOLATE_MS ? 'hold' : 'extrapolate', now - last.rt);
  f.x += (last.snap.v?.[0] ?? 0) * dt;
  f.z += (last.snap.v?.[1] ?? 0) * dt;
  return f;
}

function frame(snap, mode, ageMs) {
  return {
    x: snap.p[0],
    y: snap.p[1],
    z: snap.p[2],
    heading: snap.h,
    speed: snap.s ?? 0,
    vx: snap.v?.[0] ?? 0,
    vz: snap.v?.[1] ?? 0,
    driftTier: snap.d ?? 0,
    boosting: !!snap.b,
    gliding: !!snap.g,
    grinding: !!snap.r,
    boating: !!snap.w,
    mode,
    ageMs,
  };
}














export function createSendClock({ hz = SNAPSHOT_HZ } = {}) {
  return { period: 1000 / hz, next: 0, seq: 0 };
}

export function shouldSend(clock, now) {
  if (now < clock.next) return false;
  clock.next += clock.period;
  if (clock.next < now) clock.next = now + clock.period;
  clock.seq += 1;
  return true;
}





















export const seatId = (seat) => `r${seat}`;





























export function buildSeats({ players = [], fieldSize = 8, botCharacters = [], hostId = null } = {}) {
  const humans = [...players]
    .filter((p) => p && p.peerId != null)
    .sort((a, b) => comparePeerIds(a.peerId, b.peerId))
    .slice(0, Math.max(0, fieldSize));
  const bots = Math.max(0, fieldSize - humans.length);
  const seats = [];
  for (let i = 0; i < fieldSize; i += 1) {
    if (i < bots) {
      seats.push({
        seat: i,
        id: seatId(i),
        owner: hostId,
        bot: true,
        wasHuman: false,
        lastOwner: null,
        characterId: botCharacters.length ? botCharacters[i % botCharacters.length] : null,
        name: null,
      });
    } else {
      const p = humans[i - bots];
      seats.push({
        seat: i,
        id: seatId(i),
        owner: p.peerId,
        bot: false,
        wasHuman: false,
        lastOwner: null,
        characterId: p.characterId ?? null,
        name: p.name ?? null,
      });
    }
  }
  return seats;
}


export function seatOf(seats, peerId) {
  if (peerId == null) return null;
  return (seats || []).find((s) => !s.bot && s.owner === peerId) ?? null;
}


export const botSeats = (seats) => (seats || []).filter((s) => s.bot);


export const humanSeats = (seats) => (seats || []).filter((s) => !s.bot);


export function ownsSeat(seat, { myId, hostId }) {
  if (!seat) return false;
  if (seat.bot) return hostId != null && myId === hostId;
  return seat.owner === myId;
}






















export function releaseSeat(seats, peerId, { hostId = null } = {}) {
  const found = seatOf(seats, peerId);
  if (!found) return { seats: seats || [], seat: null };
  let released = null;
  const next = seats.map((s) => {
    if (s !== found) return s;
    released = {
      ...s, bot: true, wasHuman: true, lastOwner: peerId, owner: hostId,
    };
    return released;
  });
  return { seats: next, seat: released };
}
























export function claimSeat(seats, peerId, { characterId = null, rank = null, name = null } = {}) {
  if (!seats || !seats.length || peerId == null) {
    return { seats: seats || [], seat: null, reclaimed: false };
  }
  if (seatOf(seats, peerId)) {
    
    return { seats, seat: seatOf(seats, peerId), reclaimed: false };
  }

  const mine = seats.find((s) => s.bot && s.lastOwner === peerId);
  const target = mine ?? byId(seats, pickBotToDisplaceTeamless(botSeats(seats), { rank }));
  if (!target) return { seats, seat: null, reclaimed: false };

  
  
  
  
  
  
  const wanted = characterId
    && !seats.some((s) => s !== target && !s.bot && s.characterId === characterId)
    ? characterId : null;

  let claimed = null;
  const next = seats.map((s) => {
    if (s !== target) return s;
    claimed = {
      ...s,
      bot: false,
      owner: peerId,
      lastOwner: null,
      characterId: wanted ?? s.characterId,
      name: name ?? s.name,
    };
    return claimed;
  });
  return { seats: next, seat: claimed, reclaimed: !!mine };
}

const byId = (seats, id) => (id == null ? null : seats.find((s) => s.id === id) ?? null);











export function reassignBots(seats, hostId) {
  if (!seats) return [];
  return seats.map((s) => (s.bot && s.owner !== hostId ? { ...s, owner: hostId } : s));
}








export function botsForField(humans, fieldSize) {
  return desiredBots(humans, Math.max(0, fieldSize - humans), { cap: fieldSize });
}


export function gridHasRoom(humans, bots, fieldSize) {
  return hasRoom(humans, bots, { cap: fieldSize });
}




































export function reconcileStandings(localRows, hostRows) {
  const rows = new Map((localRows || []).map((r) => [r.id, { ...r }]));
  const corrections = [];
  for (const h of hostRows || []) {
    if (!h || h.id == null) continue;
    const mine = rows.get(h.id);
    if (!mine) {
      
      
      
      rows.set(h.id, { ...h });
      corrections.push({ id: h.id, field: 'row', from: null, to: 'added' });
      continue;
    }
    accept(mine, h, 'lap', corrections, (a, b) => b > a);
    accept(mine, h, 'distance', corrections, (a, b) => b > a);
    accept(mine, h, 'finished', corrections, (a, b) => !!b && !a);
    accept(mine, h, 'finishTime', corrections, (a, b) => b != null && a == null);
    
    
    
    
    accept(mine, h, 'bestLap', corrections, (a, b) => b != null && (a == null || b < a));
  }
  return { rows: [...rows.values()], corrections };
}

function accept(mine, host, field, corrections, better) {
  if (!(field in host)) return;
  const from = mine[field];
  const to = host[field];
  if (from === to) return;
  if (!better(from, to)) return;
  mine[field] = to;
  corrections.push({ id: mine.id, field, from, to });
}
