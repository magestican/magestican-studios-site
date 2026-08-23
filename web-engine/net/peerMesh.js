
































import { HostWatch, HOST_HEARTBEAT_MS, HOST_TIMEOUT_MS } from './hostElection.js';

const IS_PEER_AVAILABLE = () => typeof window !== 'undefined' && !!window.Peer;







const HEARTBEAT = '__hb';

export class PeerMesh extends EventTarget {
  constructor({ hostIdHint } = {}) {
    super();
    if (!IS_PEER_AVAILABLE()) throw new Error('window.Peer (PeerJS) not loaded');
    this.peer = new window.Peer(hostIdHint || undefined, {
      debug: 1,
    });
    
    this.connections = new Map();
    this.myId = null;
    this.isHost = false;
    
    this.hostId = null;
    this._peers = new Set();  
    
    this._watch = null;
    this._heartbeatTimer = null;
    this._pollTimer = null;

    this.peer.on('open', (id) => {
      this.myId = id;
      this._peers.add(id);
      this._startHostWatch();
      this._dispatch('open', { id });
    });
    this.peer.on('error', (err) => {
      this._dispatch('error', { message: String(err.type || err) });
    });
    this.peer.on('connection', (conn) => this._onIncoming(conn));
  }

  host() {
    this.isHost = true;
    this.hostId = this.myId;
    if (this._watch) this._watch.hostId = this.myId;
    this._dispatch('role', { role: 'host' });
  }

  connectTo(hostId) {
    this.isHost = false;
    this.hostId = hostId;
    if (this._watch) {
      this._watch.hostId = hostId;
      this._watch.addPeer(hostId, this._now());
    }
    this._dispatch('role', { role: 'joiner' });
    const conn = this.peer.connect(hostId, { reliable: true });
    this._wireConnection(conn);
  }

  
  
  
  _onIncoming(conn) {
    this._wireConnection(conn);
  }

  _wireConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this._peers.add(conn.peer);
      this._watch?.addPeer(conn.peer, this._now());
      this._dispatch('peer-joined', { id: conn.peer });
      
      
      if (this.isHost) {
        const existing = [...this._peers].filter(id => id !== conn.peer);
        conn.send({ t: 'peer-list', peers: existing });
      }
    });
    conn.on('data', (msg) => this._onData(conn.peer, msg));
    conn.on('close', () => this._onConnectionGone(conn.peer, 'closed'));
    conn.on('error', (err) => {
      this._dispatch('error', { message: `conn ${conn.peer}: ${err}` });
      
      
      
      
      
      
      this._onConnectionGone(conn.peer, 'error');
    });
  }

  
  
  
  _onConnectionGone(id, reason) {
    const known = this.connections.has(id) || this._peers.has(id);
    this.connections.delete(id);
    this._peers.delete(id);
    if (known) this._dispatch('peer-left', { id });
    
    
    
    
    const change = this._watch?.removePeer(id, this._now(), reason);
    if (change) this._applyHostChange(change);
  }

  _onData(fromId, msg) {
    
    
    
    this._watch?.see(fromId, this._now());
    if (msg && msg.t === HEARTBEAT) return;
    if (msg && msg.t === 'peer-list') {
      
      for (const pid of msg.peers) {
        if (pid === this.myId) continue;
        
        
        
        
        
        this._peers.add(pid);
        this._watch?.addPeer(pid, this._now());
        if (this.connections.has(pid)) continue;
        const c = this.peer.connect(pid, { reliable: true });
        this._wireConnection(c);
      }
      return;
    }
    this._dispatch('message', { from: fromId, message: msg });
  }

  broadcast(msg) {
    for (const conn of this.connections.values()) {
      try { conn.send(msg); } catch {  }
    }
  }

  send(peerId, msg) {
    const c = this.connections.get(peerId);
    if (c) try { c.send(msg); } catch {  }
  }

  

  _now() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now() : Date.now();
  }

  _startHostWatch() {
    if (this._watch) return;
    this._watch = new HostWatch({
      self: this.myId, hostId: this.hostId, timeoutMs: HOST_TIMEOUT_MS,
    });
    this._heartbeatTimer = setInterval(() => {
      
      
      
      
      this.broadcast({ t: HEARTBEAT });
    }, HOST_HEARTBEAT_MS);
    this._pollTimer = setInterval(() => {
      const change = this._watch?.poll(this._now());
      if (change) {
        
        
        if (change.previousHost) this._dispatch('peer-left', { id: change.previousHost });
        this._applyHostChange(change);
      }
    }, HOST_HEARTBEAT_MS);
  }

  _applyHostChange(change) {
    this.hostId = change.hostId;
    this.isHost = !!change.iAmHost;
    this._dispatch('host-changed', {
      hostId: change.hostId,
      iAmHost: !!change.iAmHost,
      previousHost: change.previousHost,
      reason: change.reason,
    });
  }

  
  
  
  destroy() {
    clearInterval(this._heartbeatTimer);
    clearInterval(this._pollTimer);
    this._heartbeatTimer = null;
    this._pollTimer = null;
  }

  _dispatch(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
