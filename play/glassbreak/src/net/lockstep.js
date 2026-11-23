








































import { MAX_PLAYERS, TICK_HZ, createSim, deserialize, snapshot, stateHash, step } from '../sim/sim.js';
import { IDLE, pack } from '../sim/input.js';

export const DELAY = 2;
export const MAX_DELAY = 9;
export const MAX_ROLLBACK = 8;
export const HASH_EVERY = 60;

const PRESENT_IDLE = pack({});
const REDUNDANCY = 8;
export const WATCH_CATCHUP = 16;
const TICK_MS = 1000 / TICK_HZ;

export class Session {
  











  constructor({ seed, seats, seat = null, gentle = true, hard = false, stage = 0, base = null, send = () => {}, onDesync = () => {}, delay = DELAY, maxRollback = MAX_ROLLBACK }) {
    this.gentle = !!gentle && !hard;
    this.hard = !!hard;
    this.seed = seed;
    this.seat = seat;
    this.seats = seats.slice().sort();
    
    this.startSeats = this.seats.slice();
    this.send = send;
    this.onDesync = onDesync;
    this.delay = delay;
    
    this.inputDelay = delay;
    this.maxRollback = maxRollback;
    this.cs = base ? deserialize(base) : createSim({ seed, gentle: this.gentle, hard: this.hard, stage });
    
    this.t0 = this.cs.tick;
    
    this.first = this.t0 + delay;
    
    
    
    const openAt = base ? this.t0 : this.first;
    
    this.spans = Array.from({ length: MAX_PLAYERS }, (_, s) => (this.seats.includes(s) ? [[openAt, Infinity]] : []));
    this._late = -Infinity; 
    
    this.inputs = Array.from({ length: MAX_PLAYERS }, () => new Map());
    
    this.known = Array.from({ length: MAX_PLAYERS }, (_, s) => (this.seats.includes(s) ? this.first - 1 : Infinity));
    if (base) for (const s of this.seats) for (let t = this.t0; t < this.first; t++) this.inputs[s].set(t, PRESENT_IDLE);
    this.ps = snapshot(this.cs);
    this.tick = this.t0;       
    this.dirty = false;        
    this.hashes = new Map();   
    this.remoteHashes = new Map(); 
    this.desyncs = 0;
    this.stalls = 0;
    this.rollbacks = 0;
    this._acc = 0;
    this._last = null;
  }

  
  spanAt(seat, k) {
    for (const sp of this.spans[seat]) if (k >= sp[0] && k < sp[1]) return sp;
    return null;
  }

  
  openSpan(seat) {
    const sp = this.spans[seat].at(-1);
    return sp && sp[1] === Infinity ? sp : null;
  }

  
  get dropAt() {
    return this.spans.map((list) => { const sp = list.at(-1); return sp ? sp[1] : Infinity; });
  }

  
  inputAt(seat, k) {
    if (!this.spanAt(seat, k)) return IDLE;
    return this.inputs[seat].get(k);
  }

  
  guessAt(seat, k) {
    const v = this.inputAt(seat, k);
    if (v !== undefined) return v;
    const last = Math.min(this.known[seat], k - 1);
    const p = this.inputs[seat].get(last);
    return p === undefined ? PRESENT_IDLE : p;
  }

  _advanceKnown(seat) {
    for (;;) {
      const k = this.known[seat] + 1;
      if (!Number.isFinite(k)) return;
      if (this.spanAt(seat, k)) {
        if (!this.inputs[seat].has(k)) return;
        this.known[seat] = k;
        continue;
      }
      
      let next = Infinity;
      for (const sp of this.spans[seat]) if (sp[0] >= k && sp[0] < next) next = sp[0];
      this.known[seat] = next === Infinity ? Infinity : next - 1;
      if (next === Infinity) return;
    }
  }

  
  confirmedThrough() {
    let m = Infinity;
    for (let s = 0; s < MAX_PLAYERS; s++) m = Math.min(m, this.known[s]);
    return m;
  }

  
  setLocalInput(packed) {
    if (this.seat === null) return null;
    const sp = this.openSpan(this.seat);
    if (!sp) return null;
    const k = this.tick + this.inputDelay;
    if (k < sp[0]) return null; 
    const row = this.inputs[this.seat];
    if (row.has(k)) return k; 
    
    
    const v0 = packed >>> 0;
    const fillFrom = Math.max(sp[0], this.known[this.seat] + 1);
    for (let t = fillFrom; t < k; t++) row.set(t, row.get(t - 1) ?? v0);
    row.set(k, v0);
    this._advanceKnown(this.seat);
    const from = Math.max(sp[0], k - REDUNDANCY + 1);
    const v = [];
    for (let t = from; t <= k; t++) v.push(row.get(t) ?? IDLE);
    this.send({ t: 'in', s: this.seat, k: from, v, d: this.inputDelay });
    return k;
  }

  
  setInputDelay(d) {
    this.inputDelay = Math.max(DELAY, Math.min(MAX_DELAY, d | 0));
  }

  



  takeNeed() {
    const late = this._late;
    this._late = -Infinity;
    if (late === -Infinity) return null;
    return Math.max(DELAY, Math.min(MAX_DELAY, Math.ceil(late) + 1));
  }

  receive(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'in') {
      const s = msg.s | 0;
      if (s === this.seat || s < 0 || s >= MAX_PLAYERS || !Array.isArray(msg.v)) return;
      for (let i = 0; i < msg.v.length; i++) {
        const k = (msg.k | 0) + i;
        if (!this.spanAt(s, k) || this.inputs[s].has(k)) continue;
        this.inputs[s].set(k, msg.v[i] >>> 0);
        if (k < this.tick) this.dirty = true;
      }
      this._advanceKnown(s);
      
      
      if (this.seat !== null && Number.isFinite(msg.d) && msg.v.length) {
        const late = this.tick - ((msg.k | 0) + msg.v.length - 1 - (msg.d | 0));
        if (late > this._late) this._late = late;
      }
    } else if (msg.t === 'h') {
      const k = msg.k | 0;
      if (!this.remoteHashes.has(k)) this.remoteHashes.set(k, new Map());
      this.remoteHashes.get(k).set(msg.s, msg.h >>> 0);
      this._checkHash(k);
    } else if (msg.t === 'drop') {
      this.dropSeat(msg.s | 0, msg.k | 0, false);
    } else if (msg.t === 'join') {
      this.joinSeat(msg.s | 0, msg.k | 0, false);
    }
  }

  
  dropSeat(seat, k, announce = true) {
    const sp = this.openSpan(seat);
    if (!sp) return;
    sp[1] = Math.max(k, sp[0]);
    for (const t of [...this.inputs[seat].keys()]) if (t >= sp[1]) this.inputs[seat].delete(t);
    this.known[seat] = Math.min(this.known[seat], sp[1] - 1);
    this._advanceKnown(seat);
    if (sp[1] < this.tick) this.dirty = true;
    if (announce) this.send({ t: 'drop', s: seat, k: sp[1] });
  }

  



  joinSeat(seat, k, announce = true) {
    if (seat < 0 || seat >= MAX_PLAYERS || this.openSpan(seat)) return null;
    const list = this.spans[seat];
    const at = Math.max(k, this.first, list.length ? list.at(-1)[1] : 0);
    list.push([at, Infinity]);
    if (!this.seats.includes(seat)) { this.seats.push(seat); this.seats.sort(); }
    this.known[seat] = Math.min(this.known[seat], at - 1);
    this._advanceKnown(seat);
    if (at < this.tick) this.dirty = true;
    if (announce) this.send({ t: 'join', s: seat, k: at });
    return at;
  }

  



  takeSeat(seat, send) {
    this.seat = seat;
    this.send = send;
    this.tick = this.cs.tick;
    this.ps = snapshot(this.cs);
    this.dirty = false;
    this._acc = 0;
    this._last = null;
  }

  _frame(k, guess) {
    const f = new Array(MAX_PLAYERS);
    for (let s = 0; s < MAX_PLAYERS; s++) f[s] = guess ? this.guessAt(s, k) : this.inputAt(s, k);
    return f;
  }

  _stepConfirmed() {
    const through = this.confirmedThrough();
    let moved = false;
    while (this.cs.tick <= through && this.cs.tick < this.tick) {
      step(this.cs, this._frame(this.cs.tick, false));
      moved = true;
      const k = this.cs.tick;
      if (k % HASH_EVERY === 0) {
        const h = stateHash(this.cs);
        this.hashes.set(k, h);
        if (this.seat !== null) this.send({ t: 'h', s: this.seat, k, h });
        this._checkHash(k);
        this._prune(k);
      }
    }
    return moved;
  }

  
  _prune(k) {
    const before = k - REDUNDANCY * 4;
    for (const m of this.inputs) for (const t of m.keys()) { if (t < before) m.delete(t); else break; }
    for (const t of this.hashes.keys()) { if (t < k - HASH_EVERY * 60) this.hashes.delete(t); else break; }
    for (const t of this.remoteHashes.keys()) { if (t < k - HASH_EVERY * 60) this.remoteHashes.delete(t); else break; }
  }

  _checkHash(k) {
    const mine = this.hashes.get(k);
    const theirs = this.remoteHashes.get(k);
    if (mine === undefined || !theirs) return;
    for (const [s, h] of theirs) {
      if (h !== mine) { this.desyncs++; this.onDesync({ tick: k, seat: s, mine, theirs: h }); }
    }
    theirs.clear();
  }

  
  canAdvance() {
    return this.tick - this.cs.tick < this.maxRollback;
  }

  



  advance() {
    if (this.seat === null) {
      
      
      this.tick = Math.min(this.cs.tick + WATCH_CATCHUP, this.confirmedThrough() + 1);
      this._stepConfirmed();
      return true;
    }
    const movedCs = this._stepConfirmed();
    if (!this.canAdvance()) { this.stalls++; return false; }
    if (this.dirty || movedCs) {
      
      if (this.dirty) this.rollbacks++;
      this.ps = snapshot(this.cs);
      while (this.ps.tick < this.tick) step(this.ps, this._frame(this.ps.tick, true));
      this.dirty = false;
    }
    step(this.ps, this._frame(this.tick, true));
    this.tick++;
    this._stepConfirmed();
    return true;
  }

  



  update(nowMs, readInput) {
    if (this._last === null) this._last = nowMs;
    this._acc = Math.min(this._acc + (nowMs - this._last), TICK_MS * 4);
    this._last = nowMs;
    while (this._acc >= TICK_MS) {
      if (this.seat !== null) this.setLocalInput(readInput());
      if (!this.advance()) { this._acc = 0; break; }
      this._acc -= TICK_MS;
    }
  }

  
  view() {
    return this.seat === null ? this.cs : this.ps;
  }
}


export function watcherSession({ seed, seats, gentle = true, hard = false, stage = 0, base = null }) {
  return new Session({ seed, seats, seat: null, gentle, hard, stage, base, send: () => {} });
}
