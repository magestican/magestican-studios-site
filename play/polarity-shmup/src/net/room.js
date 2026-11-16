

























import { ROLE, helloFor, roleOf } from '../../../../web-engine/net/watchers.js';
import { Session } from './lockstep.js';
import { StarHub } from './star.js';
import { MAX_PLAYERS } from '../sim/sim.js';

export const ROOM_MSG = Object.freeze({
  HELLO: 'fw-hello', SEAT: 'fw-seat', START: 'fw-start', AWAY: 'fw-away', PAUSE: 'fw-pause',
});
const SIM_TYPES = new Set(['in', 'h', 'drop']);









export function createRoom({ mesh, role, hostId = null, onEvent = () => {}, seedFor = () => 1 }) {
  const room = {
    role, mesh, seat: role === 'host' ? 0 : null, session: null, hub: null, started: false, ended: false,
    gentle: true, hostPaused: false,
    
    guests: new Map(),
  };
  const emit = (type, detail = {}) => onEvent({ type, ...detail });
  const lobby = () => emit('lobby', { guests: [...room.guests.values()] });

  const freeSeat = () => {
    const taken = new Set([0, ...[...room.guests.values()].map((g) => g.seat).filter((s) => s !== null)]);
    for (let s = 1; s < MAX_PLAYERS; s++) if (!taken.has(s)) return s;
    return null;
  };

  
  function start({ gentle = true } = {}) {
    if (role !== 'host' || room.started) return;
    room.started = true;
    room.gentle = !!gentle;
    const seats = [0, ...[...room.guests.values()].map((g) => g.seat).filter((s) => s !== null)].sort();
    const seed = seedFor() | 0;
    room.session = new Session({ seed, seats, seat: 0, gentle: room.gentle, onDesync: (d) => emit('desync', d) });
    room.hub = new StarHub({ session: room.session, sendTo: (id, msg) => mesh.send(id, msg) });
    for (const [id, g] of room.guests) room.hub.addLink(id, g.seat);
    
    
    mesh.broadcast({ t: ROOM_MSG.START, seed, seats, gentle: room.gentle });
    emit('start', { seed, seats, seat: 0, gentle: room.gentle });
  }

  
  function unseatGuest(id, why) {
    const g = room.guests.get(id);
    if (!g || g.seat === null) return;
    const seat = room.hub ? room.hub.unseat(id) : g.seat;
    g.seat = null; g.role = ROLE.WATCH;
    mesh.send(id, { t: ROOM_MSG.SEAT, seat: null, why });
    emit('unseated', { seat, why });
    lobby();
  }

  
  function becomeWatcher(why) {
    const seat = room.seat;
    room.seat = null;
    if (room.session) { room.session.seat = null; room.session.send = () => {}; }
    emit('unseated', { seat, why, me: true });
  }

  function onMessage(from, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (role === 'host') {
      if (msg.t === ROOM_MSG.HELLO) {
        if (room.guests.has(from)) return;
        const wantsPlay = roleOf(msg) === ROLE.PLAY;
        const seat = wantsPlay && !room.started ? freeSeat() : null;
        room.guests.set(from, { seat, role: seat === null ? ROLE.WATCH : ROLE.PLAY });
        mesh.send(from, { t: ROOM_MSG.SEAT, seat, why: wantsPlay && room.started ? 'late' : wantsPlay && seat === null ? 'full' : undefined });
        if (room.started) {
          mesh.send(from, { t: ROOM_MSG.START, seed: room.session.seed, seats: room.session.seats, gentle: room.gentle });
          room.hub.addLink(from, null);
          if (room.hostPaused) mesh.send(from, { t: ROOM_MSG.PAUSE, on: true });
        }
        lobby();
        return;
      }
      if (msg.t === ROOM_MSG.AWAY) { if (room.started) unseatGuest(from, 'away'); return; }
      if (room.hub && SIM_TYPES.has(msg.t)) room.hub.receive(from, msg);
      return;
    }
    
    if (from !== hostId) return;
    if (msg.t === ROOM_MSG.SEAT) {
      if (room.started && msg.seat === null && room.seat !== null) { becomeWatcher(msg.why ?? 'host'); return; }
      room.seat = msg.seat ?? null;
      emit('seat', { seat: room.seat, why: msg.why });
      return;
    }
    if (msg.t === ROOM_MSG.START) {
      if (room.session) return;
      room.started = true;
      room.gentle = msg.gentle !== false;
      room.session = new Session({
        seed: msg.seed, seats: msg.seats, seat: room.seat, gentle: room.gentle,
        send: room.seat === null ? () => {} : (m) => mesh.send(hostId, m),
        onDesync: (d) => emit('desync', d),
      });
      emit('start', { seed: msg.seed, seats: msg.seats, seat: room.seat, gentle: room.gentle });
      return;
    }
    if (msg.t === ROOM_MSG.PAUSE) { room.hostPaused = !!msg.on; emit('pause', { on: room.hostPaused }); return; }
    if (room.session && SIM_TYPES.has(msg.t)) room.session.receive(msg);
  }

  



  function setHidden(hidden) {
    if (!room.started || room.ended) return;
    if (role === 'host') {
      room.hostPaused = !!hidden;
      mesh.broadcast({ t: ROOM_MSG.PAUSE, on: room.hostPaused });
      return;
    }
    if (hidden && room.seat !== null) {
      mesh.send(hostId, { t: ROOM_MSG.AWAY });
      becomeWatcher('away');
    }
  }

  
  function poll(nowMs) {
    if (role !== 'host' || !room.hub || room.ended) return;
    for (const id of room.hub.checkLag(nowMs)) {
      const g = room.guests.get(id);
      if (!g) continue;
      g.seat = null; g.role = ROLE.WATCH;
      mesh.send(id, { t: ROOM_MSG.SEAT, seat: null, why: 'lag' });
      emit('unseated', { why: 'lag' });
      lobby();
    }
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
      lobby();
    } else if (id === hostId) {
      room.ended = true;
      emit('ended', { reason: 'the host left' });
    }
  });

  Object.assign(room, { start, setHidden, poll });
  return room;
}
