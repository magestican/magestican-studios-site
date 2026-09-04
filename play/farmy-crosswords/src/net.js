

























import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import {
  MSG, mergeMoves, puzzleKey, roomCode, normaliseCode,
} from '../../../web-engine/words/coop.js';












const CODE_TRIES = 5;













export function createNet({ snapshot, onMoves, onPeers, onPuzzle, onStatus }) {
  let mesh = null;
  let myId = null;
  let hosting = false;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const announce = (s) => { try { onStatus(s); } catch {  } };

  function wire() {
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      announce(hosting ? 'Room open. Share the link.' : 'Connecting...');
    });

    mesh.addEventListener('peer-joined', (e) => {
      onPeers(peers(), myId);
      
      
      
      
      
      sendHello();
      announce('Somebody joined.');
      void e;
    });

    mesh.addEventListener('peer-left', () => {
      onPeers(peers(), myId);
      announce('Somebody left the room.');
    });

    mesh.addEventListener('message', (e) => {
      const { message } = e.detail;
      if (!message || typeof message !== 'object') return;

      if (message.t === MSG.HELLO) {
        
        
        
        
        if (!hosting && message.game) onPuzzle(message.game, message.index);
        mergeIn(message.moves, message.game, message.index);
        onPeers(peers(), myId);
        return;
      }
      if (message.t === MSG.MOVE) {
        const now = snapshot();
        mergeIn([message.move], now.game, now.index);
      }
    });

    mesh.addEventListener('host-changed', (e) => {
      
      
      
      hosting = !!e.detail.iAmHost;
      announce(hosting ? 'You are hosting the room now.' : 'The room has a new host.');
      onPeers(peers(), myId);
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

  function mergeIn(incoming, game, index) {
    const now = snapshot();
    const key = puzzleKey(game ?? now.game, index ?? now.index);
    if (key !== puzzleKey(now.game, now.index)) return;
    onMoves(mergeMoves(now.moves, incoming ?? [], key));
  }

  function sendHello() {
    if (!mesh) return;
    const now = snapshot();
    mesh.broadcast({ t: MSG.HELLO, game: now.game, index: now.index, moves: now.moves });
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
        
        
        
        setTimeout(sendHello, 400);
      }, { once: true });
      announce('Joining...');
    },

    
    share(move) {
      if (!mesh) return;
      mesh.broadcast({ t: MSG.MOVE, move });
    },

    
    resync: sendHello,

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
