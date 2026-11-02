















import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { LMSG, fillMessage, readFill } from '../../../web-engine/lamps/lampsWire.js';
import { roomMessage, sanitiseRoom } from '../../../web-engine/lamps/lampsRoom.js';
import { exchangeCards } from '../../../web-engine/progress/peerCards.js';
import {
  ROLE, createWatchers, helloFor, roleOf, sanitiseWatchers,
} from '../../../web-engine/net/watchers.js';

const MY_PREFIX = GAME_PREFIX.lamplighters;
const CELLS_MAX = 15 * 15;


const CODE_TRIES = 5;













const BYE = 'll-bye';
const BYE_FLUSH_MS = 150;
const BEAT = 'll-beat';
const BEAT_MS = 2000;
const GUEST_SILENT_MS = 15000;











export function createNet({
  snapshot, onMatch, onProposal, onPeers, onStatus,
  onArrival = () => {}, onUnseat = () => {},
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
  const hello = () => helloFor(LMSG.HELLO, myId, myRole);
  
  
  
  globalThis.addEventListener?.('pagehide', () => { try { mesh?.broadcast({ t: BYE }); } catch {  } });

  function sendRoom() {
    if (!mesh || !hosting) return;
    const m = snapshot();
    mesh.broadcast(roomMessage(m, { view: m.view, now: Date.now(), startsIn: m.startsIn ?? 0, watchers: book.list() }));
  }

  function wire() {
    exchangeCards(mesh, 'lamplighters');
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
      if (who) { departed.add(who); heard.delete(who); book.left(who); }
      onPeers(peers(), myId);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (from && heard.has(from)) heard.set(from, Date.now());
      if (message.t === BEAT) return;
      if (message.t === BYE) {
        if (from) { heard.delete(from); mesh._onConnectionGone(from, 'left'); }
        return;
      }
      if (message.t === LMSG.HELLO) {
        const who = from || (typeof message.by === 'string' ? message.by : null);
        if (who) book.hello(who, roleOf(message));
        if (hosting) sendRoom();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === LMSG.ROOM) {
        if (hosting) return;
        book.adopt(sanitiseWatchers(message.watchers));
        const room = sanitiseRoom(message, Date.now());
        if (room) onMatch(room);
        return;
      }
      if (message.t === LMSG.FILL) {
        if (!hosting || !from) return;
        
        if (book.isWatcher(from)) return;
        const tap = readFill(message, CELLS_MAX);
        if (tap) onProposal({ kind: 'fill', round: tap.round, cell: tap.cell }, from);
        return;
      }
      if (message.t === LMSG.ACT) {
        if (!hosting) return;
        
        if (book.isWatcher(from) || book.isWatcher(message.by)) return;
        onProposal({ ...message.action, by: from || message.by }, from);
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

    
    fill(round, cell) {
      if (!mesh || hosting || myRole === ROLE.WATCH || !mesh.hostId) return;
      mesh.send(mesh.hostId, fillMessage(round, cell));
    },

    
    propose(action) {
      if (!mesh || myRole === ROLE.WATCH) return;
      mesh.broadcast({ t: LMSG.ACT, action, by: myId });
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


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';
