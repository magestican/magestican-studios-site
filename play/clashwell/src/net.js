











import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import {
  CMSG, keysMessage, readKeys, readSnapshot, readHash, readAction, keysAllowedFrom,
} from '../../../web-engine/clashwell/wire.js';
import {
  ROLE, createWatchers, helloFor, roleOf, sanitiseWatchers,
} from '../../../web-engine/net/watchers.js';

const MY_PREFIX = GAME_PREFIX.clashwell;
const CODE_TRIES = 5;
const BYE = 'cw-bye';
const BYE_FLUSH_MS = 150;
const BEAT = 'cw-beat';
const BEAT_MS = 2000;
const GUEST_SILENT_MS = 15000;


















export function createNet({
  snapshot, onMatch, onProposal, onPeers, onStatus,
  onStart = () => {}, onKeys = () => {}, onHash = () => {}, onSync = () => {}, onWantSync = () => {}, onCheer = () => {},
  onArrival = () => {}, onUnseat = () => {}, onGone = () => {},
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;
  let myRole = ROLE.PLAY;
  let beatTimer = null;
  const heard = new Map();
  const departed = new Set();

  const peers = () => (mesh ? [...mesh._peers].filter((id) => !departed.has(id)) : []);
  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };

  const book = createWatchers({
    onSeat: (id) => { if (!hosting) return; onArrival(id); sendRoom(); onPeers(peers(), myId); say('joined'); },
    onUnseat: (id) => { if (!hosting) return; onUnseat(id); sendRoom(); onPeers(peers(), myId); },
    onChange: () => { if (hosting) sendRoom(); onPeers(peers(), myId); },
  });
  const hello = () => helloFor(CMSG.HELLO, myId, myRole);
  globalThis.addEventListener?.('pagehide', () => { try { mesh?.broadcast({ t: BYE }); } catch {  } });

  function sendRoom() {
    if (!mesh || !hosting) return;
    mesh.broadcast({ ...snapshot(), t: CMSG.ROOM, watchers: book.list() });
  }

  function takeKeys(message, from) {
    const keys = readKeys(message);
    if (!keys) return;
    if (!hosting) { onKeys(keys); return; }
    
    if (!from || book.isWatcher(from) || !keysAllowedFrom(snapshot().seats, keys.seat, from)) return;
    onKeys(keys);
    mesh.broadcast(keysMessage(keys.seat, keys.upTo, keys.frames));
  }

  function wire() {
    clearInterval(beatTimer);
    beatTimer = setInterval(() => {
      if (!mesh) return;
      mesh.broadcast({ t: BEAT });
      const now = Date.now();
      for (const [id, at] of heard) {
        if (now - at <= GUEST_SILENT_MS) continue;
        heard.delete(id);
        mesh._onConnectionGone(id, 'silent');
      }
    }, BEAT_MS);
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      say(hosting ? 'open' : 'joining');
    });
    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      if (who) { departed.delete(who); heard.set(who, Date.now()); }
      onPeers(peers(), myId);
      if (hosting && who) book.arrived(who); 
      if (!hosting && who) mesh.send(who, hello());
      if (hosting) sendRoom();
      else say('joined');
    });
    mesh.addEventListener('peer-left', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      if (who) { departed.add(who); heard.delete(who); book.left(who); onGone(who); }
      onPeers(peers(), myId);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (from && heard.has(from)) heard.set(from, Date.now());
      switch (message.t) {
        case BEAT: return;
        case BYE:
          if (from) { heard.delete(from); mesh._onConnectionGone(from, 'left'); }
          return;
        case CMSG.HELLO: {
          const who = from || (typeof message.by === 'string' ? message.by : null);
          if (who) book.hello(who, roleOf(message));
          if (hosting) sendRoom();
          onPeers(peers(), myId);
          return;
        }
        case CMSG.ROOM:
          if (hosting) return;
          book.adopt(sanitiseWatchers(message.watchers));
          if (Array.isArray(message.seats)) onMatch(message);
          return;
        case CMSG.START: {
          if (hosting || !Array.isArray(message.seats)) return;
          const start = readSnapshot(message.snapshot);
          if (start) onStart({ snapshot: start, seats: message.seats });
          return;
        }
        case CMSG.KEYS: takeKeys(message, from); return;
        case CMSG.HASH: {
          const hash = hosting ? null : readHash(message);
          if (hash) onHash(hash);
          return;
        }
        case CMSG.SYNC: {
          const synced = hosting ? null : readSnapshot(message.snapshot);
          if (synced) onSync(synced);
          return;
        }
        case CMSG.WANT_SYNC:
          if (hosting && from && !book.isWatcher(from)) onWantSync(from);
          return;
        case CMSG.ACT: {
          if (!hosting || book.isWatcher(from)) return;
          const action = readAction(message);
          if (action) onProposal(action, from);
          return;
        }
        
        case CMSG.CHEER:
          onCheer();
          if (hosting) mesh.broadcast({ t: CMSG.CHEER });
          return;
        default:
      }
    });
    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      say('host');
      onPeers(peers(), myId);
      if (hosting) sendRoom();
    });
    mesh.addEventListener('join-failed', (e) => say('failed', e.detail?.reason ?? ''));
    mesh.addEventListener('error', (e) => {
      const message = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(message)) return; 
      say('trouble', message);
    });
  }

  return {
    get id() { return myId; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    get watching() { return myRole === ROLE.WATCH; },
    get watchers() { return book.count; },
    isWatcher: (id) => book.isWatcher(id),
    peers,

    host(attempt = 0) {
      if (mesh) return;
      const hint = attempt < CODE_TRIES ? roomCode(Math.random, MY_PREFIX) : null;
      const mine = new PeerMesh(hint ? { hostIdHint: hint } : {});
      mesh = mine;
      hosting = true;
      myRole = ROLE.PLAY;
      wire();
      mine.addEventListener('error', (e) => {
        if (!/unavailable-id/.test(e.detail?.message ?? '')) return;
        if (mesh !== mine) return;
        try { mine.destroy(); } catch {  }
        mesh = null;
        this.host(attempt + 1);
      });
      mine.addEventListener('open', () => mine.host(), { once: true });
      if (attempt === 0) say('opening');
    },

    join(typed, { watch = false } = {}) {
      const hostId = normaliseCode(typed, MY_PREFIX);
      if (!hostId) return { error: 'code' };
      if (mesh) return {};
      mesh = new PeerMesh({});
      hosting = false;
      myRole = watch ? ROLE.WATCH : ROLE.PLAY;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
        if (myRole === ROLE.WATCH) book.hello(myId, ROLE.WATCH);
        setTimeout(() => { mesh?.broadcast(hello()); }, 400);
      }, { once: true });
      say('joining');
      return {};
    },

    
    sendKeys(seat, upTo, frames) {
      if (!mesh || myRole === ROLE.WATCH) return;
      const message = keysMessage(seat, upTo, frames);
      if (hosting) mesh.broadcast(message);
      else if (mesh.hostId) mesh.send(mesh.hostId, message);
    },
    
    sendStart(snapshotOfMatch, seats, to = null) {
      if (!mesh || !hosting) return;
      const message = { t: CMSG.START, snapshot: snapshotOfMatch, seats };
      if (to) mesh.send(to, message);
      else mesh.broadcast(message);
    },
    sendHash(tick, hash) { if (mesh && hosting) mesh.broadcast({ t: CMSG.HASH, tick, hash }); },
    sendSync(to, snapshotOfMatch) { if (mesh && hosting) mesh.send(to, { t: CMSG.SYNC, snapshot: snapshotOfMatch }); },
    wantSync() { if (mesh && !hosting && mesh.hostId && myRole !== ROLE.WATCH) mesh.send(mesh.hostId, { t: CMSG.WANT_SYNC }); },
    propose(action) { if (mesh && myRole !== ROLE.WATCH && !hosting && mesh.hostId) mesh.send(mesh.hostId, { t: CMSG.ACT, action }); },
    cheer() {
      if (!mesh) return;
      if (hosting) mesh.broadcast({ t: CMSG.CHEER });
      else if (mesh.hostId) mesh.send(mesh.hostId, { t: CMSG.CHEER });
    },
    publish: sendRoom,

    leave() {
      const closing = mesh;
      try { closing?.broadcast({ t: BYE }); } catch {  }
      setTimeout(() => { try { closing?.destroy(); } catch {  } }, BYE_FLUSH_MS);
      clearInterval(beatTimer);
      heard.clear();
      departed.clear();
      mesh = null;
      myId = null;
      hosting = false;
      myRole = ROLE.PLAY;
      book.reset();
      onPeers([], null);
      say('left');
    },
  };
}

export const canPlayTogether = () => typeof window !== 'undefined' && !!window.Peer && typeof RTCPeerConnection !== 'undefined';
