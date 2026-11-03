



const KEYS = new Set(['left', 'right', 'cw', 'ccw', 'soft', 'hard']);
const MAX_FRAMES = 600;
const MAX_KEYS_PER_TICK = 8;

export const CMSG = Object.freeze({
  HELLO: 'cw-hello',
  ROOM: 'cw-room',
  START: 'cw-start',
  KEYS: 'cw-keys',
  HASH: 'cw-hash',
  SYNC: 'cw-sync',
  WANT_SYNC: 'cw-want-sync',
  ACT: 'cw-act',
  CHEER: 'cw-cheer',
});


export const SEAT_OPEN = Object.freeze(['host', 'guest']);
const isPerson = (id) => typeof id === 'string' && !SEAT_OPEN.includes(id);

export const seatOf = (seats, id) => (isPerson(id) ? seats.indexOf(id) : -1);


export function seatsWith(seats, id) {
  if (!isPerson(id) || seats.includes(id)) return seats;
  const free = seats.findIndex((s) => !isPerson(s));
  return free < 0 ? seats : seats.map((s, i) => (i === free ? id : s));
}

export const freeSeats = (seats, gone) => seats.map((s, i) => (gone.includes(s) ? SEAT_OPEN[i] : s));

const isTick = (n) => Number.isInteger(n) && n >= 0;

export const keysMessage = (seat, upTo, frames) => ({ t: CMSG.KEYS, seat, upTo, frames });

export function readKeys(message) {
  if (!message || (message.seat !== 0 && message.seat !== 1) || !isTick(message.upTo)) return null;
  if (!Array.isArray(message.frames) || message.frames.length > MAX_FRAMES) return null;
  for (const frame of message.frames) {
    if (!Array.isArray(frame) || !isTick(frame[0]) || frame[0] > message.upTo || !Array.isArray(frame[1])) return null;
    if (frame[1].length > MAX_KEYS_PER_TICK || !frame[1].every((k) => KEYS.has(k))) return null;
  }
  return { seat: message.seat, upTo: message.upTo, frames: message.frames };
}


export function readSnapshot(snapshot) {
  if (!snapshot || !isTick(snapshot.tick) || !Array.isArray(snapshot.players) || snapshot.players.length !== 2) return null;
  if (!Array.isArray(snapshot.wins) || !Array.isArray(snapshot.attacks)) return null;
  return snapshot;
}

export const readHash = (m) => (m && isTick(m.tick) && Number.isInteger(m.hash) ? { tick: m.tick, hash: m.hash } : null);


export const readAction = (m) => (m?.action?.kind === 'rematch' ? { kind: 'rematch' } : null);


export const keysAllowedFrom = (seats, seat, from) => isPerson(from) && seats[seat] === from;
