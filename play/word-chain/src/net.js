
















import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { WMSG, sanitiseMatch } from '../../../web-engine/wordchain/wordchainMatch.js';
import { exchangeCards } from '../../../web-engine/progress/peerCards.js';

const MY_PREFIX = GAME_PREFIX.wordchain;


const CODE_TRIES = 5;











export function createNet({ snapshot, onMatch, onProposal, onPeers, onStatus, onArrival = () => {} }) {
  let mesh = null;
  let myId = null;
  let hosting = false;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };

  function sendMatch() {
    if (!mesh || !hosting) return;
    const m = snapshot();
    mesh.broadcast({ t: WMSG.LOG, seats: m.seats, lang: m.lang, link: m.link, timer: m.timer, log: m.log });
  }

  function wire() {
    exchangeCards(mesh, 'word-chain');
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      say(hosting ? 'open' : 'joining');
    });
    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      onPeers(peers(), myId);
      if (hosting && who) onArrival(who);
      if (hosting) sendMatch();
      say('joined');
    });
    mesh.addEventListener('peer-left', () => {
      onPeers(peers(), myId);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (message.t === WMSG.HELLO) {
        if (hosting) sendMatch();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === WMSG.LOG) {
        
        
        if (hosting) return;
        onMatch(sanitiseMatch(message));
        return;
      }
      if (message.t === WMSG.ACT) {
        if (!hosting) return;
        onProposal({ ...message.action, by: message.by });
      }
    });
    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      say('host');
      onPeers(peers(), myId);
      if (hosting) sendMatch();
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
    peers,

    
    host(attempt = 0) {
      if (mesh) return;
      const hint = attempt < CODE_TRIES ? roomCode(Math.random, MY_PREFIX) : null;
      const mine = new PeerMesh(hint ? { hostIdHint: hint } : {});
      mesh = mine;
      hosting = true;
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

    



    join(typed) {
      const hostId = normaliseCode(typed, MY_PREFIX);
      if (!hostId) return { error: 'code' };
      if (mesh) return {};
      mesh = new PeerMesh({});
      hosting = false;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
        setTimeout(() => { mesh?.broadcast({ t: WMSG.HELLO, by: myId }); }, 400);
      }, { once: true });
      say('joining');
      return {};
    },

    
    propose(action) {
      if (!mesh) return;
      mesh.broadcast({ t: WMSG.ACT, action, by: myId });
    },

    publish: sendMatch,

    leave() {
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      hosting = false;
      onPeers([], null);
      say('left');
    },
  };
}


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';
