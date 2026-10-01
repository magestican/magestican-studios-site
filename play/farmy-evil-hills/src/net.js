






































import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import {
  fehRoomCode, fehNormaliseCode, fehCodeError, fehShareLink, fehJoinIdFrom, GAME_KEY,
} from '../../../web-engine/horror/coopCode.js';
import { roomPresence } from '../../shared/net/roomPresence.js';












export const CODE_TRIES = 5;


export const canPlayTogether = () => typeof window !== 'undefined'
  && (!!window.__fehMeshFactory || (!!window.Peer && typeof RTCPeerConnection !== 'undefined'));


export const joinCodeInUrl = (href = (typeof location === 'undefined' ? '' : location.href)) => fehJoinIdFrom(href);











export function createNet({
  onMessage, onOpen, onPeerJoined = () => {}, onPeerLeft = () => {},
  onHostChanged = () => {}, onStatus = () => {}, onJoinFailed = () => {},
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const announce = (s) => { try { onStatus(s); } catch {  } };
  const newMesh = (opts) => {
    const factory = typeof window !== 'undefined' ? window.__fehMeshFactory : null;
    return factory ? factory(opts || {}) : new PeerMesh(opts || {});
  };

  function wire() {
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      announce(hosting ? 'Room open. Share the link or read out the code.' : 'Connecting...');
      try { onOpen(myId); } catch {  }
    });

    
    
    
    
    mesh.addEventListener('peer-joined', (e) => {
      announce('Somebody joined.');
      try { onPeerJoined(e.detail?.id); } catch {  }
    });

    mesh.addEventListener('peer-left', (e) => {
      announce('Somebody left the room.');
      try { onPeerLeft(e.detail?.id); } catch {  }
    });

    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      
      
      
      
      
      try { onMessage(message, from); } catch {  }
    });

    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail?.iAmHost;
      announce(hosting ? 'You are hosting the room now.' : 'The room has a new host.');
      try { onHostChanged(hosting, e.detail?.hostId ?? null); } catch {  }
    });

    mesh.addEventListener('join-failed', (e) => {
      const reason = e.detail?.reason ?? 'no answer';
      announce(`Could not join: ${reason}. The link may have expired.`);
      try { onJoinFailed(reason); } catch {  }
    });

    mesh.addEventListener('error', (e) => {
      
      
      const message = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(message)) return;
      announce(`Connection trouble: ${message}.`);
    });
  }

  const api = {
    get id() { return myId; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    get hostId() { return mesh?.hostId ?? null; },
    peers,

    



    transport() {
      return {
        broadcast: (m) => { try { mesh?.broadcast(m); } catch {  } },
        send: (peerId, m) => { try { mesh?.send(peerId, m); } catch {  } },
        
        
        
        onMessage() {},
      };
    },

    
    host(attempt = 0) {
      if (mesh) return null;
      const hint = attempt < CODE_TRIES ? fehRoomCode(Math.random) : null;
      const mine = newMesh(hint ? { hostIdHint: hint } : {});
      mesh = mine;
      hosting = true;
      wire();
      mine.addEventListener('error', (e) => {
        if (!/unavailable-id/.test(e.detail?.message ?? '')) return;
        if (mesh !== mine) return;           
        try { mine.destroy(); } catch {  }
        mesh = null;
        api.host(attempt + 1);
      });
      mine.addEventListener('open', () => mine.host(), { once: true });
      if (attempt === 0) announce('Opening a room...');
      return hint;
    },

    






    join(typed, { hello } = {}) {
      const hostId = fehNormaliseCode(typed);
      if (!hostId) return { error: fehCodeError(typed) };
      if (mesh) return { error: 'Already in a room.' };
      mesh = newMesh({});
      hosting = false;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
        
        
        
        
        setTimeout(() => { try { hello?.(); } catch {  } }, 400);
      }, { once: true });
      announce('Joining...');
      return { hostId };
    },

    
    shareLink(href) { return myId ? fehShareLink(href, myId) : null; },

    leave() {
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      hosting = false;
      announce('You left the room.');
    },
  };
  return api;
}









export function fehPresence({ net, players }) {
  return roomPresence({
    game: GAME_KEY,
    net,
    players,
    bots: () => 0,
  });
}
