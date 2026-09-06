

























import { TICKS_PER_SECOND } from '../fixed.js';







export const INPUT_DELAY_TICKS = 2;


export const CHECKSUM_EVERY_TICKS = TICKS_PER_SECOND;







export const NAME_THE_STALLER_AFTER_MS = 400;








export const DROP_AFTER_MS = 6000;











export function createLockstep({ peers, localSeat }) {
  
  const inbox = new Map();
  
  const confirmedTo = Object.create(null);
  
  const checksums = new Map();
  
  const dropped = new Set();

  
  
  
  
  
  
  let stallSince = null;
  let lastDesync = null;

  for (const p of peers) confirmedTo[p] = -1;

  const active = () => peers.filter((p) => !dropped.has(p));

  
  function row(tick) {
    let r = inbox.get(tick);
    if (!r) { r = Object.create(null); inbox.set(tick, r); }
    return r;
  }

  return {
    get peers() { return [...peers]; },
    get dropped() { return [...dropped]; },
    get lastDesync() { return lastDesync; },
    get localSeat() { return localSeat; },

    






    issue(command, atTick) {
      const t = atTick + INPUT_DELAY_TICKS;
      const packet = { ...command, t, p: localSeat };
      this.receive(packet);
      return packet;
    },

    
    receive(packet) {
      if (typeof packet.t !== 'number' || typeof packet.p !== 'number') return false;
      if (dropped.has(packet.p)) return false;
      const r = row(packet.t);
      if (!r[packet.p]) r[packet.p] = [];
      r[packet.p].push(packet);
      if (packet.t > (confirmedTo[packet.p] ?? -1)) confirmedTo[packet.p] = packet.t;
      return true;
    },

    







    confirmEmpty(seat, tick) {
      if (dropped.has(seat)) return;
      if (tick > (confirmedTo[seat] ?? -1)) confirmedTo[seat] = tick;
    },

    





    canRun(tick) {
      for (const p of active()) {
        if ((confirmedTo[p] ?? -1) < tick) return false;
      }
      return true;
    },

    
    waitingOn(tick) {
      return active().filter((p) => (confirmedTo[p] ?? -1) < tick);
    },

    









    stallStatus(tick, nowMs) {
      const seats = this.waitingOn(tick);
      if (seats.length === 0) { stallSince = null; return { stalled: false, nameThem: false, seats: [], drop: [] }; }
      if (stallSince === null) stallSince = nowMs;
      const held = nowMs - stallSince;
      return {
        stalled: true,
        nameThem: held >= NAME_THE_STALLER_AFTER_MS,
        seats,
        drop: held >= DROP_AFTER_MS ? seats.slice() : [],
      };
    },

    







    drop(seat) {
      dropped.add(seat);
      stallSince = null;
      return [...dropped];
    },

    
    commandsFor(tick) {
      const r = inbox.get(tick);
      if (!r) return [];
      
      
      
      const out = [];
      for (const p of peers.slice().sort((a, b) => a - b)) {
        if (r[p]) out.push(...r[p]);
      }
      return out;
    },

    
    retire(tick) {
      inbox.delete(tick);
      checksums.delete(tick);
    },

    

    
    shouldChecksum(tick) {
      return tick % CHECKSUM_EVERY_TICKS === 0;
    },

    




    noteChecksum(seat, tick, value) {
      let m = checksums.get(tick);
      if (!m) { m = new Map(); checksums.set(tick, m); }
      m.set(seat, value >>> 0);

      
      
      const live = active();
      if (m.size < live.length) return null;

      const tally = new Map();
      for (const p of live) {
        const v = m.get(p);
        tally.set(v, (tally.get(v) || 0) + 1);
      }
      if (tally.size === 1) return null;

      let majority = null;
      let best = -1;
      for (const [v, n] of tally) if (n > best) { best = n; majority = v; }
      const odd = live.filter((p) => m.get(p) !== majority);
      
      
      const resyncFrom = live.filter((p) => m.get(p) === majority).sort((a, b) => a - b)[0];
      lastDesync = { tick, majority, odd, resyncFrom };
      return lastDesync;
    },

    
    get state() {
      return {
        confirmedTo: { ...confirmedTo },
        dropped: [...dropped],
        pendingTicks: inbox.size,
        lastDesync,
      };
    },
  };
}
