






















import { MAX_PLAYERS, TICK_HZ, createSim, snapshot, stateHash, step } from '../sim/sim.js';
import { IDLE } from '../sim/input.js';

export const DELAY = 2;
export const MAX_ROLLBACK = 6;
export const HASH_EVERY = 60;
const REDUNDANCY = 8;
export const WATCH_CATCHUP = 16;
const TICK_MS = 1000 / TICK_HZ;

export class Session {
  







  constructor({ seed, seats, seat = null, gentle = true, send = () => {}, onDesync = () => {}, delay = DELAY, maxRollback = MAX_ROLLBACK }) {
    this.gentle = !!gentle;
    this.seed = seed;
    this.seat = seat;
    this.seats = seats.slice().sort();
    this.send = send;
    this.onDesync = onDesync;
    this.delay = delay;
    this.maxRollback = maxRollback;
    
    this.inputs = Array.from({ length: MAX_PLAYERS }, () => new Map());
    
    this.known = Array.from({ length: MAX_PLAYERS }, (_, s) => (this.seats.includes(s) ? this.delay - 1 : Infinity));
    
    this.dropAt = new Array(MAX_PLAYERS).fill(Infinity);
    this.cs = createSim({ seed, gentle: this.gentle });
    this.ps = snapshot(this.cs);
    this.tick = 0;             
    this.dirty = false;        
    this.hashes = new Map();   
    this.remoteHashes = new Map(); 
    this.desyncs = 0;
    this.stalls = 0;
    this.rollbacks = 0;
    this._acc = 0;
    this._last = null;
  }

  
  inputAt(seat, k) {
    if (k >= this.dropAt[seat]) return IDLE;
    if (!this.seats.includes(seat) || k < this.delay) return IDLE;
    return this.inputs[seat].get(k);
  }

  
  guessAt(seat, k) {
    const v = this.inputAt(seat, k);
    if (v !== undefined) return v;
    const last = Math.min(this.known[seat], k - 1);
    const p = last >= this.delay ? this.inputs[seat].get(last) : undefined;
    return p === undefined ? IDLE : p;
  }

  _advanceKnown(seat) {
    while (this.inputs[seat].has(this.known[seat] + 1) || this.known[seat] + 1 >= this.dropAt[seat]) {
      if (this.known[seat] + 1 >= this.dropAt[seat]) { this.known[seat] = Infinity; break; }
      this.known[seat]++;
    }
  }

  
  confirmedThrough() {
    let m = Infinity;
    for (let s = 0; s < MAX_PLAYERS; s++) m = Math.min(m, this.known[s]);
    return m;
  }

  
  setLocalInput(packed) {
    if (this.seat === null) return null;
    const k = this.tick + this.delay;
    if (this.inputs[this.seat].has(k)) return k; 
    this.inputs[this.seat].set(k, packed >>> 0);
    this._advanceKnown(this.seat);
    const from = Math.max(this.delay, k - REDUNDANCY + 1);
    const v = [];
    for (let t = from; t <= k; t++) v.push(this.inputs[this.seat].get(t) ?? IDLE);
    this.send({ t: 'in', s: this.seat, k: from, v });
    return k;
  }

  receive(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'in') {
      const s = msg.s | 0;
      if (s === this.seat || !this.seats.includes(s) || !Array.isArray(msg.v)) return;
      for (let i = 0; i < msg.v.length; i++) {
        const k = (msg.k | 0) + i;
        if (k < this.delay || k >= this.dropAt[s] || this.inputs[s].has(k)) continue;
        this.inputs[s].set(k, msg.v[i] >>> 0);
        if (k < this.tick) this.dirty = true;
      }
      this._advanceKnown(s);
    } else if (msg.t === 'h') {
      const k = msg.k | 0;
      if (!this.remoteHashes.has(k)) this.remoteHashes.set(k, new Map());
      this.remoteHashes.get(k).set(msg.s, msg.h >>> 0);
      this._checkHash(k);
    } else if (msg.t === 'drop') {
      this.dropSeat(msg.s | 0, msg.k | 0, false);
    }
  }

  
  dropSeat(seat, k, announce = true) {
    if (this.dropAt[seat] <= k) return;
    this.dropAt[seat] = Math.max(k, this.delay);
    for (const t of [...this.inputs[seat].keys()]) if (t >= this.dropAt[seat]) this.inputs[seat].delete(t);
    if (this.known[seat] >= this.dropAt[seat] - 1) this.known[seat] = Infinity; else this._advanceKnown(seat);
    if (this.dropAt[seat] < this.tick) this.dirty = true;
    if (announce) this.send({ t: 'drop', s: seat, k: this.dropAt[seat] });
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


export function watcherSession({ seed, seats }) {
  return new Session({ seed, seats, seat: null, send: () => {} });
}
