
















import { ROLE, helloFor, roleOf } from '../../../../web-engine/net/watchers.js';
import { Session } from './lockstep.js';
import { StarHub } from './star.js';
import { MAX_PLAYERS } from '../sim/sim.js';

export const ROOM_MSG = Object.freeze({ HELLO: 'fw-hello', SEAT: 'fw-seat', START: 'fw-start' });
const SIM_TYPES = new Set(['in', 'h', 'drop']);









export function createRoom({ mesh, role, hostId = null, onEvent = () => {}, seedFor = () => 1 }) {
  const room = {
    role, mesh, seat: role === 'host' ? 0 : null, session: null, hub: null, started: false, ended: false,
    
    guests: new Map(),
  };
  const emit = (type, detail = {}) => onEvent({ type, ...detail });

  const freeSeat = () => {
    const taken = new Set([0, ...[...room.guests.values()].map((g) => g.seat).filter((s) => s !== null)]);
    for (let s = 1; s < MAX_PLAYERS; s++) if (!taken.has(s)) return s;
    return null;
  };

  function start() {
    if (role !== 'host' || room.started) return;
    room.started = true;
    const seats = [0, ...[...room.guests.values()].map((g) => g.seat).filter((s) => s !== null)].sort();
    const seed = seedFor() | 0;
    room.session = new Session({ seed, seats, seat: 0, onDesync: (d) => emit('desync', d) });
    room.hub = new StarHub({ session: room.session, sendTo: (id, msg) => mesh.send(id, msg) });
    for (const [id, g] of room.guests) room.hub.addLink(id, g.seat);
    
    
    mesh.broadcast({ t: ROOM_MSG.START, seed, seats });
    emit('start', { seed, seats, seat: 0 });
  }

  function onMessage(from, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (role === 'host') {
      if (msg.t === ROOM_MSG.HELLO) {
        if (room.guests.has(from)) return;
        const wantsPlay = roleOf(msg) === ROLE.PLAY;
        const seat = wantsPlay && !room.started ? freeSeat() : null;
        room.guests.set(from, { seat, role: seat === null ? ROLE.WATCH : ROLE.PLAY });
        mesh.send(from, { t: ROOM_MSG.SEAT, seat });
        if (room.started) {
          mesh.send(from, { t: ROOM_MSG.START, seed: room.session.seed, seats: room.session.seats });
          room.hub.addLink(from, null);
        }
        emit('lobby', { guests: [...room.guests.values()] });
        return;
      }
      if (room.hub && SIM_TYPES.has(msg.t)) room.hub.receive(from, msg);
      return;
    }
    
    if (from !== hostId) return;
    if (msg.t === ROOM_MSG.SEAT) { room.seat = msg.seat ?? null; emit('seat', { seat: room.seat }); return; }
    if (msg.t === ROOM_MSG.START) {
      if (room.session) return;
      room.started = true;
      room.session = new Session({
        seed: msg.seed, seats: msg.seats, seat: room.seat,
        send: room.seat === null ? () => {} : (m) => mesh.send(hostId, m),
        onDesync: (d) => emit('desync', d),
      });
      emit('start', { seed: msg.seed, seats: msg.seats, seat: room.seat });
      return;
    }
    if (room.session && SIM_TYPES.has(msg.t)) room.session.receive(msg);
  }

  mesh.addEventListener('message', (e) => onMessage(e.detail.from, e.detail.message));
  mesh.addEventListener('peer-joined', (e) => {
    if (role !== 'host' && e.detail.id === hostId) mesh.send(hostId, helloFor(ROOM_MSG.HELLO, mesh.myId, role === 'watch' ? ROLE.WATCH : ROLE.PLAY));
  });
  mesh.addEventListener('peer-left', (e) => {
    const id = e.detail.id;
    if (role === 'host') {
      room.hub?.removeLink(id);
      room.guests.delete(id);
      emit('lobby', { guests: [...room.guests.values()] });
    } else if (id === hostId) {
      room.ended = true;
      emit('ended', { reason: 'the host left' });
    }
  });

  room.start = start;
  return room;
}
