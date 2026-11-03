









import { createSession } from '../../../web-engine/clashwell/session.js';
import { createCpu, cpuKeys, afterRound } from '../../../web-engine/clashwell/cpu.js';


export const HOLD_LEAD_TICKS = 300;

const SEND_EVERY = 2;











export function createDuel({
  seed = 1, match = null, local = [0, 1], human = null, cpus = {}, send = null, sendEvery = SEND_EVERY,
}) {
  const session = createSession({ seed, match, local });
  const brains = new Map(Object.entries(cpus).map(([seat, options]) => [Number(seat), createCpu(options)]));
  const who = human ?? (local.length === 1 && !brains.has(local[0]) ? local[0] : null);
  const outbox = new Map(local.map((seat) => [seat, []]));
  let view = match ? structuredClone(match) : session.confirmed;
  let sinceSent = 0;

  function flush() {
    if (!send) return;
    for (const [seat, frames] of outbox) {
      send(seat, session.tick, frames);
      outbox.set(seat, []);
    }
    sinceSent = 0;
  }

  function oneTick(keys) {
    const pressing = session.tick + 1;
    for (const seat of local) {
      let pressed = [];
      if (brains.has(seat)) pressed = cpuKeys(brains.get(seat), view, seat);
      else if (seat === who) pressed = keys;
      if (!pressed.length) continue;
      session.press(seat, pressed);
      if (send) outbox.get(seat).push([pressing, pressed]);
    }
    const { view: next, events } = session.advance();
    view = next;
    for (const event of events) {
      if (event.type !== 'round' || event.winner === null) continue;
      for (const [seat, brain] of brains) afterRound(brain, event.winner !== seat);
    }
    sinceSent += 1;
    if (sinceSent >= sendEvery) flush();
    return events;
  }

  return {
    get view() { return view; },
    get lead() { return session.lead; },
    get holding() { return local.length > 0 && !brains.size && session.lead >= HOLD_LEAD_TICKS; },
    get present() { return session.tick; },
    get confirmedTick() { return session.confirmedTick; },
    get confirmed() { return session.confirmed; },
    seatKnown: (seat) => session.known(seat),
    outgoing: (seat, after) => session.outgoing(seat, after),
    hashAt: (tick) => session.hashAt(tick),
    check: (tick, hash) => session.check(tick, hash),
    adopt: (snapshot) => session.adopt(snapshot),
    cpuSkill: (seat) => brains.get(seat)?.skill ?? null,
    receive: (seat, upTo, frames) => session.receive(seat, upTo, frames),

    
    tick(keys = []) {
      if (local.length && session.lead >= HOLD_LEAD_TICKS) return [];
      return oneTick(keys);
    },
    
    get behind() {
      if (!local.length) return 0;
      return Math.max(0, Math.max(session.known(0), session.known(1)) - session.tick);
    },
  };
}
