





























































export const HOST_HEARTBEAT_MS = 1000;
export const HOST_TIMEOUT_MS = 6000;












export function comparePeerIds(a, b) {
  const x = String(a), y = String(b);
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}













export function electHost(candidates) {
  let best = null;
  for (const raw of candidates || []) {
    if (raw == null) continue;
    const id = String(raw);
    if (!id) continue;
    if (best === null || comparePeerIds(id, best) < 0) best = id;
  }
  return best;
}
















export function nextHostAfter({ peers, departed = [], self = null } = {}) {
  const gone = new Set();
  for (const d of departed || []) if (d != null && String(d)) gone.add(String(d));
  const survivors = [];
  const seen = new Set();
  for (const raw of peers || []) {
    if (raw == null) continue;
    const id = String(raw);
    if (!id || gone.has(id) || seen.has(id)) continue;
    seen.add(id);
    survivors.push(id);
  }
  survivors.sort(comparePeerIds);
  const hostId = electHost(survivors);
  return { hostId, iAmHost: hostId != null && self != null && hostId === String(self), survivors };
}
















export class HostWatch {
  






  constructor({ self, hostId, timeoutMs = HOST_TIMEOUT_MS } = {}) {
    this.self = self == null ? null : String(self);
    this.hostId = hostId == null ? null : String(hostId);
    this.timeoutMs = timeoutMs;
    
    this.peers = new Set();
    if (this.self) this.peers.add(this.self);
    if (this.hostId) this.peers.add(this.hostId);
    
    this.lastSeen = new Map();
  }

  
  get iAmHost() { return this.hostId != null && this.hostId === this.self; }

  
  addPeer(id, now = 0) {
    if (id == null || !String(id)) return;
    this.peers.add(String(id));
    this.lastSeen.set(String(id), now);
  }

  





  see(id, now = 0) {
    if (id == null || !String(id)) return;
    const key = String(id);
    if (!this.peers.has(key)) this.peers.add(key);
    this.lastSeen.set(key, now);
  }

  





  removePeer(id, now = 0, reason = 'closed') {
    if (id == null || !String(id)) return null;
    const key = String(id);
    this.peers.delete(key);
    this.lastSeen.delete(key);
    if (key !== this.hostId) return null;   
    return this._settle(reason, now);
  }

  
  hostSilenceMs(now) {
    if (this.hostId == null || this.iAmHost) return 0;
    const at = this.lastSeen.get(this.hostId);
    if (at == null) return Infinity;
    return now - at;
  }

  







  poll(now) {
    if (this.hostId == null) return null;
    if (this.iAmHost) return null;          
    if (!this.peers.has(this.hostId)) return this._settle('timeout', now);
    if (this.hostSilenceMs(now) <= this.timeoutMs) return null;
    this.peers.delete(this.hostId);
    this.lastSeen.delete(this.hostId);
    return this._settle('timeout', now);
  }

  





  _settle(reason, now) {
    const previousHost = this.hostId;
    const { hostId } = nextHostAfter({ peers: this.peers, self: this.self });
    this.hostId = hostId;
    if (hostId != null) this.lastSeen.set(hostId, now);
    
    
    
    return { hostId, iAmHost: this.iAmHost, reason, previousHost };
  }
}
