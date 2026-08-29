




















import {
  KART_MSG, createRemote, receiveSnapshot, sampleRemote, makeSnapshot,
  createSendClock, shouldSend, isStalled, ownsSeat, seatOf,
  reconcileStandings,
} from 'arbelo/netRace';




const STANDINGS_MS = 250;















export function createRaceNet(session, { seats, onEvent, onStandings, onSeats, raceClock = null }) {
  let current = seats ?? [];
  const remotes = new Map();       
  const clock = createSendClock();
  let standingsAt = 0;
  let localRows = [];
  
  
  
  let lastRacers = null;

  const seatByRacerId = (id) => current.find((s) => s.id === id) ?? null;
  const remoteFor = (seat) => {
    if (!remotes.has(seat)) remotes.set(seat, createRemote(seat));
    return remotes.get(seat);
  };

  const onSeatsMsg = (e) => {
    current = e.detail.seats ?? [];
    
    
    
    
    const changed = e.detail.left ?? e.detail.joined;
    if (changed) remotes.delete(changed.seat);
    if (onSeats) onSeats(current, e.detail);
  };
  session.addEventListener('seats', onSeatsMsg);

  const sink = (from, msg) => {
    switch (msg.t) {
      case KART_MSG.SNAP:
        
        
        
        
        if (msg.i == null) return;
        if (current[msg.i] && current[msg.i].owner !== from) return;
        receiveSnapshot(remoteFor(msg.i), msg, now());
        return;

      case KART_MSG.BOTS: {
        if (from !== session.hostId) return;
        const t = now();
        for (const s of msg.r ?? []) receiveSnapshot(remoteFor(s.i), s, t);
        return;
      }

      case KART_MSG.STANDINGS: {
        if (from !== session.hostId) return;
        
        
        
        const { rows, corrections } = reconcileStandings(localRows, msg.rows ?? []);
        localRows = rows;
        if (corrections.length && onStandings) onStandings(rows);
        return;
      }

      case KART_MSG.EVENT:
        if (onEvent) onEvent({ ...msg, from });
        return;

      case KART_MSG.FINISH:
        if (onEvent) onEvent({ k: 'finish', seat: msg.seat, time: msg.time, bestLap: msg.bestLap, from });
        return;

      default:
        break;
    }
  };
  session.attachRace(sink);

  const api = {
    get seats() { return current; },

    
    owns(racerId) {
      return ownsSeat(seatByRacerId(racerId), { myId: session.myId, hostId: session.hostId });
    },

    
    seatFor: seatByRacerId,

    
    mySeatId() {
      const s = seatOf(current, session.myId);
      return s ? s.id : null;
    },

    









    applyRemote(racer, t = now()) {
      const seat = seatByRacerId(racer.id);
      if (!seat) return false;
      const f = sampleRemote(remoteFor(seat.seat), t);
      
      
      if (!f) return false;
      const k = racer.kart;
      k.x = f.x; k.y = f.y; k.z = f.z;
      k.heading = f.heading;
      k.speed = f.speed;
      k.vx = f.vx; k.vz = f.vz;
      k.driftTier = f.driftTier;
      k.drifting = f.driftTier > 0 ? 1 : 0;
      
      
      
      k.boost = f.boosting ? { time: 0.1, power: 1, name: 'remote' } : null;
      
      
      
      
      
      
      
      k.gliding = !!f.gliding;
      racer.netMode = f.mode;
      return true;
    },

    






    publish(racers, t = now()) {
      lastRacers = racers;
      if (!shouldSend(clock, t)) return;
      const seq = clock.seq;
      const mine = seatOf(current, session.myId);
      if (mine) {
        const r = racers.find((x) => x.id === mine.id);
        if (r) session.broadcast({ t: KART_MSG.SNAP, ...makeSnapshot(r.kart, { seat: mine.seat, seq }) });
      }
      if (session.isHost) {
        const bots = [];
        for (const s of current) {
          if (!s.bot) continue;
          const r = racers.find((x) => x.id === s.id);
          if (r) bots.push(makeSnapshot(r.kart, { seat: s.seat, seq }));
        }
        
        
        
        if (bots.length) session.broadcast({ t: KART_MSG.BOTS, r: bots });
      }
    },

    
    publishStandings(rows, t = now()) {
      if (!session.isHost) return;
      localRows = rows;
      if (t < standingsAt) return;
      standingsAt = t + STANDINGS_MS;
      session.broadcast({ t: KART_MSG.STANDINGS, rows });
    },

    








    sweepStalled(t = now()) {
      if (!session.isHost) return;
      for (const s of current) {
        if (s.bot || s.owner === session.myId) continue;
        const r = remotes.get(s.seat);
        if (r && isStalled(r, t)) session.releaseSeatOf(s.owner);
      }
    },

    
    event(ev) { session.broadcast({ t: KART_MSG.EVENT, ...ev }); },

    finished(seat, time, bestLap) {
      session.broadcast({ t: KART_MSG.FINISH, seat, time, bestLap });
    },

    dispose() {
      session.removeEventListener('seats', onSeatsMsg);
      session.detachRace();
      session.setPositionSource(null);
      
      
      session.setRaceStateSource(null);
    },
  };

  
  
  
  session.setPositionSource((racerId) => {
    const row = localRows.find((r) => r.id === racerId);
    return row?.position ?? 99;
  });

  













  session.setRaceStateSource(() => ({
    poses: (lastRacers ?? []).map((r) => ({
      id: r.id,
      p: [r.kart.x, r.kart.y, r.kart.z],
      h: r.kart.heading,
      s: r.kart.speed ?? 0,
    })),
    rows: localRows,
    clock: raceClock ? raceClock() : 0,
  }));

  return api;
}

const now = () => (typeof performance !== 'undefined' && performance.now
  ? performance.now() : Date.now());
