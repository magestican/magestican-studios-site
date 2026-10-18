




















import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { RMSG, sanitiseRoom } from '../../../web-engine/mines/raceRules.js';
import { exchangeCards } from '../../../web-engine/progress/peerCards.js';
import {
  ROLE, createWatchers, helloFor, roleOf, sanitiseWatchers,
} from '../../../web-engine/net/watchers.js';

const MY_PREFIX = GAME_PREFIX.minesweeper;


const CODE_TRIES = 5;














export function createNet({
  snapshot, onMatch, onProposal, onPeers, onStatus,
  onArrival = () => {}, onUnseat = () => {}, onProgress = () => {}, onNeed = () => {}, onChannel = () => {},
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;
  
  let myRole = ROLE.PLAY;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };

  const book = createWatchers({
    onSeat: (id) => { if (!hosting) return; onArrival(id); sendRoom(); onPeers(peers(), myId); say('joined'); },
    onUnseat: (id) => { if (!hosting) return; onUnseat(id); sendRoom(); onPeers(peers(), myId); },
    onChange: () => { if (hosting) sendRoom(); onPeers(peers(), myId); },
  });
  const hello = () => helloFor(RMSG.HELLO, myId, myRole);

  function sendRoom() {
    if (!mesh || !hosting) return;
    const m = snapshot();
    mesh.broadcast({ t: RMSG.LOG, seats: m.seats, level: m.level, race: m.race, result: m.result, watchers: book.list() });
  }

  function wire() {
    exchangeCards(mesh, 'minesweeper');
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      say(hosting ? 'open' : 'joining');
    });
    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      onPeers(peers(), myId);
      
      if (hosting && who) book.arrived(who);
      if (!hosting && who) mesh.send(who, hello());
      if (hosting) sendRoom();
      else say('joined');
      
      if (who && myRole === ROLE.PLAY) { try { onChannel(who); } catch {  } }
    });
    mesh.addEventListener('peer-left', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      if (who) book.left(who);
      onPeers(peers(), myId);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (message.t === RMSG.HELLO) {
        const who = from || (typeof message.by === 'string' ? message.by : null);
        if (who) book.hello(who, roleOf(message));
        if (hosting) sendRoom();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === RMSG.LOG) {
        if (hosting) return;
        book.adopt(sanitiseWatchers(message.watchers));
        onMatch(sanitiseRoom(message));
        return;
      }
      if (message.t === RMSG.PROG) {
        
        if (book.isWatcher(from)) return;
        onProgress(message, from);
        return;
      }
      if (message.t === RMSG.NEED) {
        if (myRole === ROLE.WATCH) return;
        onNeed(from);
        return;
      }
      if (message.t === RMSG.ACT) {
        if (!hosting) return;
        
        if (book.isWatcher(from) || book.isWatcher(message.by)) return;
        onProposal({ ...message.action, by: from || message.by });
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

    
    propose(action) {
      if (!mesh || myRole === ROLE.WATCH) return;
      mesh.broadcast({ t: RMSG.ACT, action, by: myId });
    },

    
    progress(msg) {
      if (!mesh || myRole === ROLE.WATCH || !msg) return;
      mesh.broadcast(msg);
    },

    
    need(peerId, round) {
      if (!mesh || !peerId) return;
      mesh.send(peerId, { t: RMSG.NEED, by: myId, r: round });
    },

    publish: sendRoom,

    leave() {
      try { mesh?.destroy(); } catch {  }
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
