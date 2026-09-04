




























































import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, sayingText } from '../../../web-engine/words/coop.js';
import { CMSG } from '../../../web-engine/chess/chessMatch.js';












const CODE_TRIES = 5;












export function createNet({
  snapshot, onMatch, onProposal, onPeers, onStatus,
  onArrival = () => {}, onSay = () => {},
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const announce = (s) => { try { onStatus(s); } catch {  } };

  
  function sendMatch() {
    if (!mesh || !hosting) return;
    const now = snapshot();
    mesh.broadcast({ t: CMSG.LOG, match: now });
  }

  function wire() {
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      announce(hosting ? 'Room open. Share the link or read out the code.' : 'Connecting...');
    });

    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      onPeers(peers(), myId);
      
      
      
      if (hosting && who) onArrival(who);
      if (hosting) sendMatch();
      announce('Somebody joined.');
    });

    mesh.addEventListener('peer-left', () => {
      onPeers(peers(), myId);
      announce('Somebody left the room.');
    });

    mesh.addEventListener('message', (e) => {
      const { message } = e.detail;
      if (!message || typeof message !== 'object') return;

      if (message.t === CMSG.HELLO) {
        
        
        
        if (hosting) sendMatch();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === CMSG.LOG) {
        
        
        if (hosting) return;
        onMatch(message.match);
        return;
      }
      if (message.t === CMSG.ACT) {
        if (!hosting) return;
        onProposal(message.action, message.by);
        return;
      }
      if (message.t === CMSG.SAY) {
        
        
        if (!sayingText(message.say)) return;
        onSay({ say: message.say, by: message.by });
      }
    });

    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      announce(hosting ? 'You are hosting the room now.' : 'The room has a new host.');
      onPeers(peers(), myId);
      
      
      
      if (hosting) sendMatch();
    });

    mesh.addEventListener('join-failed', (e) => {
      announce(`Could not join: ${e.detail?.reason ?? 'no answer'}. The link may have expired.`);
    });

    mesh.addEventListener('error', (e) => {
      
      
      const message = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(message)) return;
      announce(`Connection trouble: ${message}.`);
    });
  }

  return {
    get id() { return myId; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    peers,

    
    host(attempt = 0) {
      if (mesh) return;
      const hint = attempt < CODE_TRIES ? roomCode() : null;
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
      if (attempt === 0) announce('Opening a room...');
    },

    
    join(typed) {
      const hostId = normaliseCode(typed) ?? typed;
      if (mesh) return;
      mesh = new PeerMesh({});
      hosting = false;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
        
        
        
        setTimeout(() => { mesh?.broadcast({ t: CMSG.HELLO, by: myId }); }, 400);
      }, { once: true });
      announce('Joining...');
    },

    





    propose(action) {
      if (!mesh) return;
      mesh.broadcast({ t: CMSG.ACT, action, by: myId });
    },

    
    publish: sendMatch,

    
    say(id) {
      if (!mesh) return;
      mesh.broadcast({ t: CMSG.SAY, say: id, by: myId });
    },

    leave() {
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      hosting = false;
      onPeers([], null);
      announce('You left the room.');
    },
  };
}


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';
