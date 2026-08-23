













const IS_PEER_AVAILABLE = () => typeof window !== 'undefined' && !!window.Peer;

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
    this._peers = new Set();  

    this.peer.on('open', (id) => {
      this.myId = id;
      this._peers.add(id);
      this._dispatch('open', { id });
    });
    this.peer.on('error', (err) => {
      this._dispatch('error', { message: String(err.type || err) });
    });
    this.peer.on('connection', (conn) => this._onIncoming(conn));
  }

  host() {
    this.isHost = true;
    this._dispatch('role', { role: 'host' });
  }

  connectTo(hostId) {
    this.isHost = false;
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
      this._dispatch('peer-joined', { id: conn.peer });
      
      
      if (this.isHost) {
        const existing = [...this._peers].filter(id => id !== conn.peer);
        conn.send({ t: 'peer-list', peers: existing });
      }
    });
    conn.on('data', (msg) => this._onData(conn.peer, msg));
    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this._peers.delete(conn.peer);
      this._dispatch('peer-left', { id: conn.peer });
    });
    conn.on('error', (err) => {
      this._dispatch('error', { message: `conn ${conn.peer}: ${err}` });
    });
  }

  _onData(fromId, msg) {
    if (msg && msg.t === 'peer-list') {
      
      for (const pid of msg.peers) {
        if (pid === this.myId || this.connections.has(pid)) continue;
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

  _dispatch(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
