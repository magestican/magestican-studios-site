



import { pictureById } from './pictures.js';
import { LMSG, packView, unpackView } from './lampsWire.js';

export const HOST = 'host';
export const GUEST = 'guest';


export const COUNTDOWN_MS = 3000;

const PLACEHOLDERS = new Set([HOST, GUEST]);
const MAX_ID = 64;


export const isRealSeat = (s) => typeof s === 'string' && !PLACEHOLDERS.has(s);

export const createRoom = ({ picture = null, seats = [HOST, GUEST] } = {}) => ({
  seats: [...seats], picture, round: 0, result: null,
});


export const setHostSeat = (room, id) => (room.seats[0] === HOST ? { ...room, seats: [id, ...room.seats.slice(1)] } : room);


export function seatsWith(seats, id, started) {
  if (!id || started || seats.includes(id)) return seats;
  const free = seats.findIndex((s) => !isRealSeat(s));
  return free < 0 ? seats : seats.map((s, i) => (i === free ? id : s));
}


export const seatOf = (room, id) => (isRealSeat(id) ? room.seats.indexOf(id) : -1);


export const freeSeatsOf = (seats, gone) => seats.map((s, i) => (gone.includes(s) ? (i === 0 ? HOST : GUEST) : s));


export const matchRunning = (room) => room.round > 0 && !room.result && !room.done;

export const canStart = (room) => room.seats.every(isRealSeat) && !matchRunning(room) && !!pictureById(room.picture);

export const startRound = (room) => ({ ...room, round: room.round + 1, result: null, done: false });


export function leftResult(room, goneId) {
  const seat = room.seats.indexOf(goneId);
  return { round: room.round, winner: seat === 0 ? 1 : seat === 1 ? 0 : null, why: 'left' };
}


export function roomMessage(room, { view, now, startsIn = 0, watchers = [] }) {
  return {
    t: LMSG.ROOM,
    seats: room.seats,
    picture: room.picture,
    round: room.round,
    result: room.result,
    startsIn,
    view: view ? packView(view, now) : null,
    watchers,
  };
}





export function sanitiseRoom(m, now) {
  if (!m || typeof m !== 'object') return null;
  const picture = typeof m.picture === 'string' ? pictureById(m.picture) : null;
  if (!picture && m.picture !== null) return null;
  const seats = Array.isArray(m.seats)
    ? m.seats.filter((s) => typeof s === 'string' && s.length <= MAX_ID).slice(0, 2)
    : [];
  const round = Number.isInteger(m.round) && m.round >= 0 ? m.round : 0;
  const view = picture && round > 0 ? unpackView(m.view, picture.lines, now) : null;
  const r = m.result;
  const result = r && r.round === round && round > 0 && r.why === 'left' && (r.winner === null || r.winner === 0 || r.winner === 1)
    ? { round: r.round, winner: r.winner, why: r.why }
    : null;
  const startsIn = Number.isFinite(m.startsIn) && m.startsIn > 0 && m.startsIn <= COUNTDOWN_MS ? m.startsIn : 0;
  return { seats, picture: picture ? picture.id : null, round, result, startsIn, view };
}
