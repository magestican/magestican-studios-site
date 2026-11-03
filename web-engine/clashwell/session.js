









import { createMatch, step, hashMatch } from './match.js';

const clone = (value) => structuredClone(value);
const NO_KEYS = Object.freeze([]);


export const HASH_EVERY = 120;
const HASHES_KEPT = 16;







export function createSession({ seed = 1, match = null, local = [0, 1] } = {}) {
  let confirmed = match ? clone(match) : createMatch({ seed });
  let present = confirmed.tick;
  const known = [confirmed.tick, confirmed.tick];
  const frames = [new Map(), new Map()];
  const hashes = new Map();

  const keysAt = (seat, tick) => frames[seat].get(tick) ?? NO_KEYS;

  function confirm(events) {
    const reach = Math.min(known[0], known[1]);
    while (confirmed.tick < reach) {
      const tick = confirmed.tick + 1;
      events.push(...step(confirmed, [keysAt(0, tick), keysAt(1, tick)]));
      frames[0].delete(tick);
      frames[1].delete(tick);
      if (tick % HASH_EVERY === 0) {
        hashes.set(tick, hashMatch(confirmed));
        hashes.delete(tick - HASH_EVERY * HASHES_KEPT);
      }
    }
  }

  return {
    get tick() { return present; },
    get confirmedTick() { return confirmed.tick; },
    
    get lead() { return present - Math.min(known[0], known[1]); },
    get confirmed() { return clone(confirmed); },
    known: (seat) => known[seat],

    
    press(seat, keys) {
      if (keys.length) frames[seat].set(present + 1, [...keys]);
    },

    
    receive(seat, upTo, keyFrames = []) {
      for (const [tick, keys] of keyFrames) {
        if (tick > confirmed.tick) frames[seat].set(tick, [...keys]);
      }
      known[seat] = Math.max(known[seat], upTo);
    },

    



    advance() {
      present += 1;
      for (const seat of local) known[seat] = present;
      const events = [];
      confirm(events);
      if (!local.length) {
        present = confirmed.tick;
        return { view: clone(confirmed), events };
      }
      const view = clone(confirmed);
      for (let tick = confirmed.tick + 1; tick <= present; tick += 1) {
        step(view, [keysAt(0, tick), keysAt(1, tick)]);
      }
      return { view, events };
    },

    
    outgoing(seat, after) {
      const out = [];
      for (const [tick, keys] of frames[seat]) if (tick > after) out.push([tick, keys]);
      return out.sort((a, b) => a[0] - b[0]);
    },

    
    check(tick, hash) {
      if (!hashes.has(tick)) return 'unknown';
      return hashes.get(tick) === hash ? 'same' : 'differs';
    },
    hashAt: (tick) => hashes.get(tick) ?? null,

    
    adopt(snapshot) {
      confirmed = clone(snapshot);
      for (const seat of [0, 1]) {
        known[seat] = Math.max(known[seat], confirmed.tick);
        for (const tick of frames[seat].keys()) if (tick <= confirmed.tick) frames[seat].delete(tick);
      }
      hashes.clear();
      present = Math.max(present, confirmed.tick);
    },
  };
}
