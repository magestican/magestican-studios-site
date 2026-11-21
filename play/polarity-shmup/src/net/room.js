






































import { ROLE, helloFor, roleOf } from '../../../../web-engine/net/watchers.js';
import { Session } from './lockstep.js';
import { StarHub } from './star.js';
import { MAX_PLAYERS } from '../sim/sim.js';
import { emptyPilots, freePilot, pickPilot, pilotsFromWire, seatPilot } from './seatPilots.js';

export const ROOM_MSG = Object.freeze({
  HELLO: 'fw-hello', SEAT: 'fw-seat', START: 'fw-start', AWAY: 'fw-away', PAUSE: 'fw-pause',
  JOIN: 'fw-join', NEED: 'fw-need', DELAY: 'fw-delay',
  
  PICK: 'fw-pick', PILOTS: 'fw-pilots',
});
const SIM_TYPES = new Set(['in', 'h', 'drop', 'join']);

export const JOIN_LEAD = 20;

const CAUGHT_UP = 3;

const ASK_AGAIN_MS = 3000;

const NEED_EVERY_MS = 1000;

const DELAY_DOWN_AFTER = 3;









export function createRoom({ mesh, role, hostId = null, onEvent = () => {}, seedFor = () => 1 }) {
  const room = {
    role, mesh, seat: role === 'host' ? 0 : null, session: null, hub: null, started: false, ended: false,
    gentle: true, hard: false, hostPaused: false,
    
    guests: new Map(),
    
    wantSeat: role === 'play',
    hidden: false,
    askAt: 0, needAt: 0, lowRuns: 0,
    
    run: null,
    
    pilots: emptyPilots(),
  };
  if (role === 'host') seatPilot(room.pilots, 0);
  const emit = (type, detail = {}) => onEvent({ type, ...detail });
  const lobby = () => emit('lobby', { guests: [...room.guests.values()] });

  const freeSeat = () => {
    const taken = new Set([0, ...[...room.guests.values()].map((g) => g.seat).filter((s) => s !== null)]);
    for (let s = 1; s < MAX_PLAYERS; s++) if (!taken.has(s)) return s;
    return null;
  };

  
  const sessionFor = (run, seat, send) => new Session({
    seed: run.seed, seats: run.seats, seat, gentle: run.gentle, hard: run.hard, stage: run.stage, base: run.base,
    send, onDesync: (d) => emit('desync', d),
  });
  const startMsg = () => ({ t: ROOM_MSG.START, ...room.run, pilots: room.pilots });

  
  function sharePilots() {
    mesh.broadcast({ t: ROOM_MSG.PILOTS, pilots: room.pilots });
    emit('pilots', { pilots: room.pilots });
  }

  



  function pick(id) {
    if (room.started || room.seat === null) return false;
    if (role === 'host') { const ok = pickPilot(room.pilots, 0, id); if (ok) sharePilots(); return ok; }
    mesh.send(hostId, { t: ROOM_MSG.PICK, id });
    return true;
  }

  




  function start({ gentle = true, hard = false, stage = 0, base = null } = {}) {
    if (role !== 'host' || room.started) return;
    room.started = true;
    room.gentle = !!gentle && !hard;
    room.hard = !!hard;
    const seats = [0, ...[...room.guests.values()].map((g) => g.seat).filter((s) => s !== null)].sort();
    room.run = { seed: base ? base.seed : seedFor() | 0, seats, gentle: room.gentle, hard: room.hard, stage: stage | 0, base };
    room.run.pilots = room.pilots;
    room.session = sessionFor(room.run, 0, undefined);
    room.hub = new StarHub({ session: room.session, sendTo: (id, msg) => mesh.send(id, msg) });
    for (const [id, g] of room.guests) room.hub.addLink(id, g.seat);
    
    
    mesh.broadcast(startMsg());
    emit('start', { ...room.run, seat: 0 });
  }

  
  function grantSeat(id) {
    const g = room.guests.get(id);
    if (!g || g.seat !== null || !g.wants) return;
    const se = room.session;
    const taken = new Set([0, ...[...room.guests.values()].map((x) => x.seat).filter((s) => s !== null)]);
    let seat = null;
    for (let s = 1; s < MAX_PLAYERS; s++) if (!taken.has(s) && !se.openSpan(s)) { seat = s; break; }
    if (seat === null) { mesh.send(id, { t: ROOM_MSG.SEAT, seat: null, why: 'full' }); return; }
    
    
    const k = se.joinSeat(seat, se.tick + se.inputDelay + JOIN_LEAD);
    room.hub.seatLink(id, seat);
    g.seat = seat; g.role = ROLE.PLAY;
    seatPilot(room.pilots, seat);
    mesh.send(id, { t: ROOM_MSG.SEAT, seat, k });
    sharePilots();
    emit('joined', { seat });
    lobby();
  }

  
  function decideDelay() {
    const se = room.session;
    let need = se.takeNeed() ?? 0;
    for (const g of room.guests.values()) if (g.seat !== null && g.need) need = Math.max(need, g.need);
    if (!need) return;
    let d = se.inputDelay;
    if (need > d) { d = need; room.lowRuns = 0; }
    else if (need < d) { if (++room.lowRuns >= DELAY_DOWN_AFTER) { d--; room.lowRuns = 0; } }
    else room.lowRuns = 0;
    if (d !== se.inputDelay) {
      se.setInputDelay(d);
      mesh.broadcast({ t: ROOM_MSG.DELAY, d: se.inputDelay });
      emit('delay', { d: se.inputDelay });
    }
  }

  
  function unseatGuest(id, why) {
    const g = room.guests.get(id);
    if (!g || g.seat === null) return;
    const seat = room.hub ? room.hub.unseat(id) : g.seat;
    g.seat = null; g.role = ROLE.WATCH;
    freePilot(room.pilots, seat);
    mesh.send(id, { t: ROOM_MSG.SEAT, seat: null, why });
    sharePilots();
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
        room.guests.set(from, { seat, role: seat === null ? ROLE.WATCH : ROLE.PLAY, wants: wantsPlay, need: 0 });
        seatPilot(room.pilots, seat);
        mesh.send(from, { t: ROOM_MSG.SEAT, seat, why: wantsPlay && room.started ? 'late' : wantsPlay && seat === null ? 'full' : undefined });
        if (!room.started) sharePilots();
        if (room.started) {
          mesh.send(from, startMsg());
          mesh.send(from, { t: ROOM_MSG.DELAY, d: room.session.inputDelay });
          room.hub.addLink(from, null);
          if (room.hostPaused) mesh.send(from, { t: ROOM_MSG.PAUSE, on: true });
        }
        lobby();
        return;
      }
      if (msg.t === ROOM_MSG.PICK) {
        const g = room.guests.get(from);
        if (!g || room.started) return;
        if (pickPilot(room.pilots, g.seat, msg.id)) sharePilots();
        else mesh.send(from, { t: ROOM_MSG.PILOTS, pilots: room.pilots, refused: msg.id }); 
        return;
      }
      if (msg.t === ROOM_MSG.AWAY) { if (room.started) unseatGuest(from, 'away'); return; }
      if (msg.t === ROOM_MSG.JOIN) { if (room.started && !room.ended) grantSeat(from); return; }
      if (msg.t === ROOM_MSG.NEED) { const g = room.guests.get(from); if (g) g.need = Math.max(0, Math.min(99, msg.n | 0)); return; }
      if (room.hub && SIM_TYPES.has(msg.t)) room.hub.receive(from, msg);
      return;
    }
    
    if (from !== hostId) return;
    if (msg.t === ROOM_MSG.SEAT) {
      if (room.started && msg.seat === null && room.seat !== null) { becomeWatcher(msg.why ?? 'host'); return; }
      if (room.started && msg.seat !== null && msg.seat !== undefined && room.seat === null && room.session) {
        
        room.seat = msg.seat | 0;
        room.session.takeSeat(room.seat, (m) => mesh.send(hostId, m));
        emit('seat', { seat: room.seat, why: 'joined' });
        return;
      }
      room.seat = msg.seat ?? null;
      emit('seat', { seat: room.seat, why: msg.why });
      return;
    }
    if (msg.t === ROOM_MSG.START) {
      if (room.session) return;
      room.started = true;
      room.gentle = msg.gentle !== false && !msg.hard;
      room.hard = !!msg.hard;
      room.run = { seed: msg.seed, seats: msg.seats, gentle: room.gentle, hard: room.hard, stage: msg.stage | 0, base: msg.base ?? null };
      room.pilots = pilotsFromWire(msg.pilots);
      room.run.pilots = room.pilots;
      room.session = sessionFor(room.run, room.seat, room.seat === null ? () => {} : (m) => mesh.send(hostId, m));
      emit('start', { ...room.run, seat: room.seat });
      return;
    }
    if (msg.t === ROOM_MSG.PILOTS) {
      room.pilots = pilotsFromWire(msg.pilots);
      if (room.run) room.run.pilots = room.pilots;
      emit('pilots', { pilots: room.pilots, refused: msg.refused ?? null });
      return;
    }
    if (msg.t === ROOM_MSG.DELAY) { room.session?.setInputDelay(msg.d | 0); return; }
    if (msg.t === ROOM_MSG.PAUSE) { room.hostPaused = !!msg.on; emit('pause', { on: room.hostPaused }); return; }
    if (room.session && SIM_TYPES.has(msg.t)) room.session.receive(msg);
  }

  



  function setHidden(hidden) {
    room.hidden = !!hidden;
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
    if (!room.started || room.ended || !room.session) return;
    if (role === 'host') {
      if (!room.hub) return;
      for (const id of room.hub.checkLag(nowMs)) {
        const g = room.guests.get(id);
        if (!g) continue;
        freePilot(room.pilots, g.seat);
        g.seat = null; g.role = ROLE.WATCH;
        mesh.send(id, { t: ROOM_MSG.SEAT, seat: null, why: 'lag' });
        sharePilots();
        emit('unseated', { why: 'lag' });
        lobby();
      }
      if (nowMs >= room.needAt) { room.needAt = nowMs + NEED_EVERY_MS; decideDelay(); }
      return;
    }
    const se = room.session;
    if (room.seat !== null) {
      if (nowMs >= room.needAt) {
        room.needAt = nowMs + NEED_EVERY_MS;
        const n = se.takeNeed();
        if (n !== null) mesh.send(hostId, { t: ROOM_MSG.NEED, n });
      }
      return;
    }
    if (!room.wantSeat || room.hidden || room.hostPaused || nowMs < room.askAt) return;
    const through = se.confirmedThrough();
    if (!Number.isFinite(through) || through < se.first) return; 
    if (se.cs.tick < through + 1 - CAUGHT_UP) return; 
    mesh.send(hostId, { t: ROOM_MSG.JOIN });
    room.askAt = nowMs + ASK_AGAIN_MS;
  }

  mesh.addEventListener('message', (e) => onMessage(e.detail.from, e.detail.message));
  mesh.addEventListener('peer-joined', (e) => {
    if (role !== 'host' && e.detail.id === hostId) mesh.send(hostId, helloFor(ROOM_MSG.HELLO, mesh.myId, role === 'watch' ? ROLE.WATCH : ROLE.PLAY));
  });
  mesh.addEventListener('peer-left', (e) => {
    const id = e.detail.id;
    if (role === 'host') {
      room.hub?.removeLink(id);
      const g = room.guests.get(id);
      if (g && g.seat !== null) { freePilot(room.pilots, g.seat); sharePilots(); }
      room.guests.delete(id);
      lobby();
    } else if (id === hostId) {
      room.ended = true;
      emit('ended', { reason: 'the host left' });
    }
  });

  Object.assign(room, { start, setHidden, poll, pick });
  return room;
}
