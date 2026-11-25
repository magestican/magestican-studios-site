














export const RACER_SEATS = 12;
export const MAX_WATCHERS = 64; 
export const ROLE = Object.freeze({ RACER: 'racer', WATCHER: 'watcher' });
const NAME_MAX = 16;

const cleanName = (name, fallback) => {
  const n = String(name ?? '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, NAME_MAX);
  return n || fallback;
};


export function createRoom({ hostId, hostName = 'Host', seats = RACER_SEATS } = {}) {
  if (!hostId) throw new Error('createRoom needs a hostId');
  const room = { hostId, size: seats, seats: Array.from({ length: seats }, () => null), watchers: [], racing: false, joinSeq: 0 };
  room.seats[0] = { peerId: hostId, name: cleanName(hostName, 'Host'), left: false };
  return room;
}

export const racerCount = (room) => room.seats.filter((s) => s && !s.left).length;
export const seatOf = (room, peerId) => room.seats.findIndex((s) => s && !s.left && s.peerId === peerId);
export const isWatcher = (room, peerId) => room.watchers.some((w) => w.peerId === peerId);
export const roleOf = (room, peerId) => (seatOf(room, peerId) >= 0 ? ROLE.RACER : isWatcher(room, peerId) ? ROLE.WATCHER : null);
export const carIdForSeat = (room, seat) => (room.seats[seat] ? `p${seat}` : `bot${seat}`);


export function carOf(room, peerId) {
  const seat = seatOf(room, peerId);
  return seat >= 0 ? `p${seat}` : null;
}





export function joinRoom(room, { peerId, name = null, watch = false } = {}) {
  if (!peerId) return null;
  const had = roleOf(room, peerId);
  if (had) return { role: had, seat: had === ROLE.RACER ? seatOf(room, peerId) : null };
  const free = room.seats.findIndex((s) => s === null);
  if (!watch && !room.racing && free >= 0) {
    room.seats[free] = { peerId, name: cleanName(name, `Driver ${free + 1}`), left: false };
    return { role: ROLE.RACER, seat: free };
  }
  if (room.watchers.length >= MAX_WATCHERS) return null;
  room.joinSeq += 1;
  
  room.watchers.push({ peerId, name: cleanName(name, `Watcher ${room.watchers.length + 1}`), since: room.joinSeq, wantsSeat: !watch });
  return { role: ROLE.WATCHER, seat: null };
}


export function leaveRoom(room, peerId) {
  room.watchers = room.watchers.filter((w) => w.peerId !== peerId);
  const seat = seatOf(room, peerId);
  if (seat < 0) return { botTakes: null };
  if (room.racing) {
    room.seats[seat].left = true;
    return { botTakes: `p${seat}` };
  }
  room.seats[seat] = null;
  return { botTakes: null };
}


export const acceptsInput = (room, peerId) => seatOf(room, peerId) >= 0;


export function startRace(room) {
  room.racing = true;
  return grid(room);
}





export function endRace(room) {
  room.racing = false;
  room.seats = room.seats.map((s) => (s && s.left ? null : s));
  const promoted = [];
  const queue = room.watchers.filter((w) => w.wantsSeat).sort((a, b) => a.since - b.since);
  for (const w of queue) {
    const free = room.seats.findIndex((s) => s === null);
    if (free < 0) break;
    room.seats[free] = { peerId: w.peerId, name: w.name, left: false };
    room.watchers = room.watchers.filter((x) => x.peerId !== w.peerId);
    promoted.push(w.peerId);
  }
  return promoted;
}


export function grid(room) {
  return room.seats.map((s, i) => (s
    ? { seat: i, carId: `p${i}`, name: s.name, human: !s.left, peerId: s.left ? null : s.peerId }
    : { seat: i, carId: `bot${i}`, name: `Car ${i + 1}`, human: false, peerId: null }));
}


export function migrateHost(room, newHostId) {
  room.hostId = newHostId;
  return room;
}


export function serializeRoom(room) {
  return {
    hostId: room.hostId,
    racing: room.racing,
    seats: room.seats.map((s) => (s ? { peerId: s.peerId, name: s.name, left: !!s.left } : null)),
    watchers: room.watchers.map((w) => ({ peerId: w.peerId, name: w.name })),
  };
}


export function applyRoom(wire) {
  const size = Array.isArray(wire?.seats) ? Math.min(wire.seats.length, RACER_SEATS) : RACER_SEATS;
  const seats = Array.from({ length: size }, (_, i) => {
    const s = wire?.seats?.[i];
    return s && typeof s.peerId === 'string' ? { peerId: s.peerId, name: cleanName(s.name, `Driver ${i + 1}`), left: !!s.left } : null;
  });
  const watchers = (Array.isArray(wire?.watchers) ? wire.watchers : []).slice(0, MAX_WATCHERS)
    .filter((w) => typeof w?.peerId === 'string')
    .map((w, i) => ({ peerId: w.peerId, name: cleanName(w.name, `Watcher ${i + 1}`), since: i, wantsSeat: true }));
  return { hostId: String(wire?.hostId ?? ''), size, seats, watchers, racing: !!wire?.racing, joinSeq: watchers.length };
}
