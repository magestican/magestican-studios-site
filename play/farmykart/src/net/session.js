



























import { PeerMesh } from 'arbelo/net';
import {
  KART_MSG, buildSeats, seatOf, releaseSeat, claimSeat, reassignBots,
} from 'arbelo/netRace';
import {
  createLobby, joinLobby, leaveLobby, claimCharacter, setReady, setSettings,
  serializeLobby, applyLobby, startLobby, reopenLobby, migrateLobbyHost,
  lobbyPlayers, botCharacterOrder, canStart, LOBBY_PHASE,
} from 'arbelo/kartLobby';


export function joinIdFromLocation(href) {
  try {
    return new URL(href).searchParams.get('join');
  } catch {
    return null;
  }
}


export function shareLinkFor(href, myId) {
  const url = new URL(href);
  url.searchParams.set('join', myId);
  
  
  url.hash = '';
  return url.toString();
}












export async function createSession({ mode, hostId, name, characterId, settings = {} }) {
  
  
  
  
  const hostIdHint = mode === 'host' ? `fk-${Math.random().toString(36).slice(2, 8)}` : undefined;
  const mesh = new PeerMesh({ hostIdHint });

  const myId = await new Promise((resolve, reject) => {
    mesh.addEventListener('open', (e) => resolve(e.detail.id), { once: true });
    mesh.addEventListener('error', (e) => {
      
      
      if (String(e.detail.message).includes('unavailable-id')) return;
      reject(new Error(e.detail.message));
    });
  });

  const session = new KartSession({ mesh, myId, mode, hostId, name, characterId, settings });
  if (mode === 'host') mesh.host();
  else mesh.connectTo(hostId);
  return session;
}

export class KartSession extends EventTarget {
  constructor({ mesh, myId, mode, hostId, name, characterId, settings }) {
    super();
    this.mesh = mesh;
    this.myId = myId;
    this.isHost = mode === 'host';
    this.hostId = this.isHost ? myId : hostId;
    this.name = name;
    this.characterId = characterId;
    this.seats = [];
    this.seed = null;
    
    
    
    
    this.race = null;
    
    this._raceState = null;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    this._sink = null;
    this._queue = [];

    this.lobby = createLobby({ hostId: this.hostId, settings });
    if (this.isHost) {
      this.lobby = joinLobby(this.lobby, { peerId: myId, name, characterId }).lobby;
      this._emitLobby();
    }

    mesh.addEventListener('peer-joined', (e) => this._onPeerJoined(e.detail.id));
    mesh.addEventListener('peer-left', (e) => this._onPeerLeft(e.detail.id));
    mesh.addEventListener('host-changed', (e) => this._onHostChanged(e.detail));
    mesh.addEventListener('message', (e) => this._onMessage(e.detail.from, e.detail.message));
    mesh.addEventListener('error', (e) => this._fire('net-error', { message: e.detail.message }));
  }

  

  broadcast(msg) { this.mesh.broadcast(msg); }

  send(peerId, msg) { this.mesh.send(peerId, msg); }

  
  hello() {
    this.broadcast({ t: KART_MSG.HELLO, name: this.name, characterId: this.characterId });
  }

  claim(characterId) {
    this.characterId = characterId;
    if (this.isHost) this._hostApply(() => claimCharacter(this.lobby, this.myId, characterId).lobby);
    else this.broadcast({ t: KART_MSG.CLAIM, by: this.myId, characterId });
  }

  ready(flag) {
    if (this.isHost) this._hostApply(() => setReady(this.lobby, this.myId, flag));
    else this.broadcast({ t: KART_MSG.READY, by: this.myId, ready: flag });
  }

  
  settings(patch) {
    if (!this.isHost) return;
    this._hostApply(() => setSettings(this.lobby, this.myId, patch).lobby);
  }

  canStart() { return canStart(this.lobby); }

  










  start() {
    if (!this.isHost) return null;
    const seed = (Date.now() & 0x7fffffff) || 1;
    const players = lobbyPlayers(this.lobby);
    const settings = { ...this.lobby.settings };
    const seats = buildSeats({
      players,
      fieldSize: settings.fieldSize,
      botCharacters: botCharacterOrder(this.lobby, Math.max(0, settings.fieldSize - players.length)),
      hostId: this.myId,
    });
    this.seats = seats;
    this.seed = seed;
    this.race = { seed, settings };
    this.lobby = startLobby(this.lobby);
    this.broadcast({ t: KART_MSG.START, seed, settings, seats });
    this._emitLobby();
    this._fire('start', { seed, settings, seats });
    return { seed, settings, seats };
  }

  
  reopen() {
    if (!this.isHost) return;
    this.seats = [];
    this.race = null;
    this._hostApply(() => reopenLobby(this.lobby));
  }

  







  bye() {
    try { this.broadcast({ t: KART_MSG.BYE, by: this.myId }); } catch {  }
  }

  destroy() {
    this.bye();
    this.mesh.destroy();
  }

  

  



  attachRace(sink) {
    this._sink = sink;
    const queued = this._queue;
    this._queue = [];
    for (const { from, msg } of queued) sink(from, msg);
  }

  detachRace() { this._sink = null; }

  

  _onPeerJoined(id) {
    
    
    
    
    
    if (this.isHost) this.send(id, { t: KART_MSG.LOBBY, lobby: serializeLobby(this.lobby) });
    else this.send(id, { t: KART_MSG.HELLO, name: this.name, characterId: this.characterId });
    this._fire('peer-joined', { id });
  }

  _onPeerLeft(id) {
    if (this.isHost) {
      this._hostApply(() => leaveLobby(this.lobby, id));
      this._releaseRacingSeat(id);
    }
    this._fire('peer-left', { id });
  }

  _onHostChanged({ hostId, iAmHost, previousHost }) {
    this.isHost = !!iAmHost;
    this.hostId = hostId;
    this.lobby = migrateLobbyHost(this.lobby, hostId);
    if (previousHost) this.lobby = leaveLobby(this.lobby, previousHost);
    
    
    
    
    this.seats = reassignBots(this.seats, hostId);
    if (this.isHost) {
      this._emitLobby();
      if (this.seats.length) this.broadcast({ t: KART_MSG.SEATS, seats: this.seats });
    }
    this._fire('host-changed', { hostId, iAmHost: this.isHost, previousHost });
    this._fire('seats', { seats: this.seats });
  }

  _onMessage(from, msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.t) {
      case KART_MSG.HELLO:
        if (!this.isHost) return;
        this._hostApply(() => joinLobby(this.lobby, {
          peerId: from, name: msg.name, characterId: msg.characterId,
        }).lobby);
        
        
        
        this._claimRacingSeat(from, msg);
        
        this._catchUp(from);
        return;

      case KART_MSG.CLAIM:
        if (!this.isHost) return;
        this._hostApply(() => claimCharacter(this.lobby, from, msg.characterId).lobby);
        return;

      case KART_MSG.READY:
        if (!this.isHost) return;
        this._hostApply(() => setReady(this.lobby, from, msg.ready));
        return;

      case KART_MSG.LOBBY: {
        
        
        
        if (from !== this.hostId) return;
        const next = applyLobby(this.lobby, msg.lobby);
        if (next === this.lobby) return;
        this.lobby = next;
        
        
        
        
        
        
        if (next.phase === LOBBY_PHASE.OPEN) this.race = null;
        this._emitLobby();
        return;
      }

      case KART_MSG.START: {
        if (from !== this.hostId) return;
        
        
        
        
        if (this.race) return;
        this.seed = msg.seed;
        this.seats = msg.seats ?? [];
        this.race = { seed: msg.seed, settings: msg.settings };
        this.lobby = startLobby(this.lobby);
        this._fire('start', {
          seed: msg.seed, settings: msg.settings, seats: this.seats, resume: msg.resume ?? null,
        });
        return;
      }

      case KART_MSG.SEATS:
        if (from !== this.hostId) return;
        this.seats = msg.seats ?? [];
        this._fire('seats', { seats: this.seats });
        return;

      case KART_MSG.BYE:
        
        
        this._onPeerLeft(msg.by ?? from);
        return;

      default:
        break;
    }
    
    if (this._sink) this._sink(from, msg);
    else {
      this._queue.push({ from, msg });
      
      
      if (this._queue.length > 400) this._queue.shift();
    }
  }

  

  _claimRacingSeat(peerId, hello) {
    if (!this.isHost || !this.seats.length) return;
    if (seatOf(this.seats, peerId)) return;
    const rank = (s) => this._positionOf?.(s.id) ?? s.seat;
    const out = claimSeat(this.seats, peerId, {
      characterId: hello?.characterId ?? null, name: hello?.name ?? null, rank,
    });
    if (!out.seat) return;
    this.seats = out.seats;
    this.broadcast({ t: KART_MSG.SEATS, seats: this.seats });
    this._fire('seats', { seats: this.seats, joined: out.seat, reclaimed: out.reclaimed });
  }

  _releaseRacingSeat(peerId) {
    if (!this.isHost || !this.seats.length) return;
    const out = releaseSeat(this.seats, peerId, { hostId: this.myId });
    if (!out.seat) return;
    this.seats = out.seats;
    this.broadcast({ t: KART_MSG.SEATS, seats: this.seats });
    this._fire('seats', { seats: this.seats, left: out.seat });
  }

  






































  _catchUp(peerId) {
    if (!this.isHost || !this.race) return;
    this.send(peerId, {
      t: KART_MSG.START,
      seed: this.race.seed,
      settings: this.race.settings,
      seats: this.seats,
      resume: this._raceState ? this._raceState() : null,
    });
  }

  







  setRaceStateSource(fn) { this._raceState = fn; }

  






  releaseSeatOf(peerId) { this._releaseRacingSeat(peerId); }

  






  setPositionSource(fn) { this._positionOf = fn; }

  

  
  
  
  _hostApply(fn) {
    const next = fn();
    if (!next || next === this.lobby) return;
    this.lobby = next;
    this.broadcast({ t: KART_MSG.LOBBY, lobby: serializeLobby(this.lobby) });
    this._emitLobby();
  }

  _emitLobby() { this._fire('lobby', { lobby: this.lobby }); }

  _fire(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
}
