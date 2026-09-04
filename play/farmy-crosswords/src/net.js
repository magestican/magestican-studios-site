

























import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import {
  MSG, mergeMoves, puzzleKey, roomCode, normaliseCode, sayingText,
} from '../../../web-engine/words/coop.js';












const CODE_TRIES = 5;

















export function createNet({
  snapshot, onMoves, onPeers, onPuzzle, onStatus,
  onPresence = () => {}, onSay = () => {}, onStart = () => {}, onResume = () => {},
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;
  









  const presence = new Map();

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

    mesh.addEventListener('peer-left', (e) => {
      const gone = e.detail?.peerId ?? e.detail?.id;
      if (gone) presence.delete(gone);
      onPeers(peers(), myId);
      onPresence(everyone());
      announce('Somebody left the room.');
    });

    mesh.addEventListener('message', (e) => {
      const { message } = e.detail;
      if (!message || typeof message !== 'object') return;

      if (message.t === MSG.HELLO) {
        if (message.where?.by) { presence.set(message.where.by, message.where); onPresence(everyone()); }
        
        
        
        
        
        
        
        if (!hosting && message.game) onPuzzle(message.game, message.index, message.mode);
        mergeIn(message.moves, message.game, message.index);
        onPeers(peers(), myId);
        return;
      }
      if (message.t === MSG.MOVE) {
        const now = snapshot();
        mergeIn([message.move], now.game, now.index);
        return;
      }
      if (message.t === MSG.WHERE && message.where?.by) {
        presence.set(message.where.by, message.where);
        onPresence(everyone());
        return;
      }
      if (message.t === MSG.START && !hosting) {
        
        
        
        onStart(message.start);
        return;
      }
      if (message.t === MSG.RESUME && !hosting) { onResume(); return; }
      if (message.t === MSG.SAY) {
        
        
        
        
        if (!sayingText(message.say)) return;
        onSay({ say: message.say, by: message.by });
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
    mesh.broadcast({
      t: MSG.HELLO, game: now.game, index: now.index, moves: now.moves,
      where: mine(now), mode: now.mode,
    });
  }

  
  function mine(now = snapshot()) {
    return {
      by: myId, game: now.game, index: now.index, done: now.done ?? 0, total: now.total ?? 0,
    };
  }

  
  function everyone() {
    const rows = [];
    for (const id of peers()) {
      rows.push(id === myId ? mine() : (presence.get(id) ?? { by: id }));
    }
    return rows;
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

    
    start(spec) {
      if (!mesh) return;
      mesh.broadcast({ t: MSG.START, start: spec });
    },

    
    resume() {
      if (!mesh) return;
      mesh.broadcast({ t: MSG.RESUME });
    },

    
    say(id) {
      if (!mesh) return;
      mesh.broadcast({ t: MSG.SAY, say: id, by: myId });
    },

    






    here() {
      if (!mesh) return;
      const where = mine();
      presence.set(myId, where);
      mesh.broadcast({ t: MSG.WHERE, where });
      onPresence(everyone());
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
