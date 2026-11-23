










export const MSG = Object.freeze({
  HELLO: 'tb-hi',   
  SEAT: 'tb-seat',  
  FULL: 'tb-full',  
  INPUT: 'i',       
  STATUS: 's',      
  EVENT: 'e',       
  PICK: 'tb-pick',  
  START: 'tb-go',   
  REWARD: 'tb-star', 
});

export const SILENT_MS = 2000;  
export const HOLD_MS = 30000;   
export const MAX_PHONES = 8;
export const INPUT_HZ = 60;
export const STATUS_HZ = 10;

const BIT = Object.freeze({ fire: 1, boost: 2, ability: 4, aim: 8 });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);


export const quantise = (v) => Math.round(clamp(num(v), -1, 1) * 127);
const unq = (q) => clamp(num(q), -127, 127) / 127;


export function encodeInput(input, seq) {
  const aim = Number.isFinite(input.ax) && Number.isFinite(input.ay);
  const bits = (input.fire ? BIT.fire : 0) | (input.boost ? BIT.boost : 0) | (input.ability ? BIT.ability : 0) | (aim ? BIT.aim : 0);
  const out = [MSG.INPUT, seq >>> 0, quantise(input.mx), quantise(input.my), bits];
  if (aim) out.push(quantise(input.ax), quantise(input.ay));
  return out;
}


export function decodeInput(msg) {
  if (!Array.isArray(msg) || msg.length < 5 || msg[0] !== MSG.INPUT) return null;
  const [, seq, x, y, bits] = msg;
  if (!Number.isInteger(seq) || seq < 0) return null;
  if (![x, y, bits].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  const b = bits | 0;
  const input = { mx: unq(x), my: unq(y), fire: !!(b & BIT.fire), boost: !!(b & BIT.boost), ability: !!(b & BIT.ability) };
  if (b & BIT.aim && msg.length >= 7) { input.ax = unq(msg[5]); input.ay = unq(msg[6]); }
  return { seq, input };
}


const STATES = ['title', 'play', 'end', 'warm'];

const bellsOf = (v) => clamp(Math.trunc(num(v)), -999, 999);


export function encodeStatus(s) {
  return [MSG.STATUS, Math.round(clamp(num(s.heat), 0, 100)), Math.round(clamp(num(s.armour), 0, 1) * 100),
    Math.round(clamp(num(s.cooldown), 0, 1) * 100), bellsOf(s.bells),
    String(s.house || ''), String(s.titan || ''), Math.max(0, STATES.indexOf(s.state)), s.stalled ? 1 : 0,
    
    Math.max(0, Math.trunc(num(s.ack))), Math.round(clamp(num(s.ackAge), 0, 60000)),
    
    (s.lit ? (s.lit.fire ? 1 : 0) | (s.lit.boost ? 2 : 0) | (s.lit.ability ? 4 : 0) : 7), String(s.hint || '').slice(0, 40)];
}

const litOf = (b) => ({ fire: !!(b & 1), boost: !!(b & 2), ability: !!(b & 4) });

export function decodeStatus(msg) {
  if (!Array.isArray(msg) || msg.length < 9 || msg[0] !== MSG.STATUS) return null;
  return {
    heat: clamp(num(msg[1]), 0, 100), armour: clamp(num(msg[2]), 0, 100) / 100, cooldown: clamp(num(msg[3]), 0, 100) / 100,
    bells: bellsOf(msg[4]), house: String(msg[5]), titan: String(msg[6]),
    state: STATES[clamp(Math.trunc(num(msg[7])), 0, STATES.length - 1)], stalled: msg[8] === 1,
    ack: msg.length >= 11 && num(msg[9]) > 0 ? Math.trunc(num(msg[9])) : null,
    ackAge: msg.length >= 11 ? clamp(num(msg[10]), 0, 60000) : 0,
    lit: litOf(msg.length >= 13 ? Math.trunc(num(msg[11])) : 7), hint: msg.length >= 13 ? String(msg[12]).slice(0, 40) : '',
  };
}







export function createLatencyLog({ now = () => performance.now(), keep = 600, window = 256 } = {}) {
  const sentAt = new Map(); const samples = []; let lastAck = 0;
  return {
    sent(seq) { sentAt.set(seq, now()); if (sentAt.size > window) sentAt.delete(sentAt.keys().next().value); },
    ack(seq, held = 0) {
      if (seq === null || seq <= lastAck || !sentAt.has(seq)) return null;
      lastAck = seq;
      const rtt = Math.max(0, now() - sentAt.get(seq) - held);
      samples.push(rtt); if (samples.length > keep) samples.shift();
      return rtt;
    },
    count: () => samples.length,
    p95() {
      if (!samples.length) return null;
      const s = [...samples].sort((a, b) => a - b);
      return s[Math.max(0, Math.ceil(s.length * 0.95) - 1)];
    },
  };
}





export function createPhoneSeats() {
  
  const seats = new Map(); 
  const find = (fn) => { for (const s of seats.values()) if (fn(s)) return s; return null; };
  return {
    hello(peer, client, now) {
      let s = find((x) => x.client === client);
      if (!s) {
        if (seats.size >= MAX_PHONES) return null;
        let n = 0; while (seats.has(`phone${n}`)) n += 1;
        s = { control: `phone${n}`, client, peer: null, seq: 0, input: null, heard: now };
        seats.set(s.control, s);
      }
      s.peer = peer; s.seq = 0; s.heard = now;
      return s;
    },
    byPeer: (peer) => find((x) => x.peer === peer),
    
    input(peer, seq, input, now) {
      const s = find((x) => x.peer === peer);
      if (!s || seq <= s.seq) return false;
      s.seq = seq; s.input = input; s.heard = now;
      return true;
    },
    
    inputRaw(peer, msg, now) {
      const d = decodeInput(msg);
      return d ? this.input(peer, d.seq, d.input, now) : false;
    },
    
    inputFor(control, now) {
      const s = seats.get(control);
      return s && s.peer && now - s.heard <= SILENT_MS ? s.input : null;
    },
    silent(control, now) { const s = seats.get(control); return !s || !s.peer || now - s.heard > SILENT_MS; },
    
    gone(peer, now) { const s = find((x) => x.peer === peer); if (s) { s.peer = null; s.heard = now; } },
    
    sweep(now) {
      const out = [];
      for (const [c, s] of seats) if (now - s.heard > HOLD_MS) { seats.delete(c); out.push(c); }
      return out;
    },
    list: () => [...seats.values()],
  };
}
