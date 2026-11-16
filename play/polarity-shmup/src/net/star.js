











import { MAX_PLAYERS } from '../sim/sim.js';

export class StarHub {
  




  constructor({ session, sendTo }) {
    this.session = session;
    this.sendTo = sendTo;
    
    this.links = new Map();
    
    this.log = Array.from({ length: MAX_PLAYERS }, () => []);
    const own = session.send;
    
    session.send = (msg) => { this._log(msg); this.broadcast(msg); own?.(msg); };
  }

  addLink(linkId, seat = null) {
    this.links.set(linkId, { seat });
    if (seat === null) this._catchUp(linkId);
  }

  
  removeLink(linkId) {
    const l = this.links.get(linkId);
    this.links.delete(linkId);
    if (!l || l.seat === null) return;
    const k = this.session.known[l.seat];
    if (Number.isFinite(k)) this.session.dropSeat(l.seat, k + 1);
  }

  broadcast(msg, exceptId = null) {
    for (const id of this.links.keys()) if (id !== exceptId) this.sendTo(id, msg);
  }

  
  receive(linkId, msg) {
    const l = this.links.get(linkId);
    if (!l || !msg || typeof msg !== 'object') return;
    if (msg.t === 'in' || msg.t === 'h') {
      if (l.seat === null || (msg.s | 0) !== l.seat) return;
      this.session.receive(msg);
      this._log(msg);
      this.broadcast(msg, linkId);
    }
  }

  _log(msg) {
    if (!msg || msg.t !== 'in') return;
    const row = this.log[msg.s | 0];
    for (let i = 0; i < msg.v.length; i++) {
      const k = (msg.k | 0) + i;
      if (row[k] === undefined) row[k] = msg.v[i] >>> 0;
    }
  }

  _catchUp(linkId) {
    for (let s = 0; s < MAX_PLAYERS; s++) {
      const row = this.log[s];
      let from = -1;
      for (let k = 0; k <= row.length; k++) {
        const have = row[k] !== undefined;
        if (have && from < 0) from = k;
        if ((!have || k - from >= 600) && from >= 0) {
          this.sendTo(linkId, { t: 'in', s, k: from, v: row.slice(from, k) });
          from = have ? k : -1;
        }
      }
    }
    for (let s = 0; s < MAX_PLAYERS; s++) {
      const d = this.session.dropAt[s];
      if (Number.isFinite(d)) this.sendTo(linkId, { t: 'drop', s, k: d });
    }
  }
}
