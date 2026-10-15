














import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { TMSG, sanitiseView, sanitiseAction } from '../../../web-engine/truco/trucoMatch.js';
import { exchangeCards } from '../../../web-engine/progress/peerCards.js';

const MY_PREFIX = GAME_PREFIX.truco;
const CODE_TRIES = 5;












export function createNet({ viewFor, onView, onProposal, onPeers, onStatus, onArrival = () => {}, onDeparture = () => {} }) {
  let mesh = null;
  let myId = null;
  let hosting = false;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };

  
  function sendViews() {
    if (!mesh || !hosting) return;
    for (const p of peers()) {
      const v = viewFor(p);
      if (v) mesh.send(p, { t: TMSG.VIEW, view: v });
    }
  }

  function wire() {
    exchangeCards(mesh, 'truco');
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      say(hosting ? 'open' : 'joining');
    });
    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      onPeers(peers(), myId);
      if (hosting && who) onArrival(who);
      if (hosting) sendViews();
      say('joined');
    });
    mesh.addEventListener('peer-left', (e) => {
      const who = e.detail?.id;
      onPeers(peers(), myId);
      if (hosting && who) onDeparture(who);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (message.t === TMSG.HELLO) {
        if (hosting) sendViews();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === TMSG.VIEW) {
        if (hosting) return;
        const v = sanitiseView(message.view);
        if (v) onView(v);
        return;
      }
      if (message.t === TMSG.ACT) {
        if (!hosting) return;
        
        if (message.rematch) { onProposal({ type: 'rematch' }, from); return; }
        const a = sanitiseAction(message.action);
        if (a) onProposal(a, from);
      }
    });
    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      say('host', { iAmHost: hosting, previousHost: e.detail.previousHost });
      onPeers(peers(), myId);
    });
    mesh.addEventListener('join-failed', (e) => say('failed', { reason: e.detail?.reason ?? '' }));
    mesh.addEventListener('error', (e) => {
      const message = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(message)) return;
      say('trouble', { message });
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
        setTimeout(() => { mesh?.broadcast({ t: TMSG.HELLO, by: myId }); }, 400);
      }, { once: true });
      say('joining');
      return {};
    },

    
    propose(action) {
      if (!mesh) return;
      if (action && action.type === 'rematch') mesh.broadcast({ t: TMSG.ACT, rematch: true });
      else mesh.broadcast({ t: TMSG.ACT, action });
    },

    publish: sendViews,

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
