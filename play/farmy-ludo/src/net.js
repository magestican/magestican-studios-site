


































import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { GAME_ID, MSG } from '../../../web-engine/board/ludoRoom.js';
import { normaliseCode, roomCode } from '../../../web-engine/words/coop.js';












const CODE_TRIES = 5;








export function createNet({
  onPeers = () => {}, onSetup = () => {}, onRoll = () => {}, onReady = () => {},
  onMove = () => {}, onSay = () => {}, onStatus = () => {}, onHostChange = () => {},
  hello = () => null,
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const safely = (fn, arg) => { try { fn(arg); } catch {  } };
  const announce = (s) => safely(onStatus, s);

  
  const stamp = (m) => ({ ...m, g: GAME_ID, by: myId });

  function sendHello() {
    if (!mesh || !hosting) return;
    const payload = hello();
    
    
    
    
    
    if (payload) mesh.broadcast(stamp({ t: MSG.SETUP, ...payload }));
  }

  function wire() {
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      safely(onPeers, { peers: peers(), me: myId });
      announce(hosting ? 'Room open. Read out the code, or send the link.' : 'Connecting...');
    });

    mesh.addEventListener('peer-joined', () => {
      safely(onPeers, { peers: peers(), me: myId });
      sendHello();
      announce('Somebody joined.');
    });

    mesh.addEventListener('peer-left', () => {
      safely(onPeers, { peers: peers(), me: myId });
      
      
      
      announce('Somebody left. The computer will play their pieces.');
    });

    mesh.addEventListener('message', (e) => {
      const { message } = e.detail;
      if (!message || typeof message !== 'object') return;
      
      
      
      
      if (message.g !== GAME_ID) return;
      if (message.t === MSG.SETUP) safely(onSetup, message);
      else if (message.t === MSG.READY) safely(onReady, message);
      else if (message.t === MSG.ROLL) safely(onRoll, message);
      else if (message.t === MSG.MOVE) safely(onMove, message);
      else if (message.t === MSG.SAY) safely(onSay, message);
    });

    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      
      
      
      
      
      safely(onHostChange, { hosting, hostId: e.detail.hostId });
      announce(hosting ? 'You are hosting now. The die carries on from here.' : 'The room has a new host.');
      safely(onPeers, { peers: peers(), me: myId });
    });

    mesh.addEventListener('join-failed', (e) => {
      announce(`Could not join: ${e.detail?.reason ?? 'no answer'}. The code or link may have expired.`);
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
      if (mesh) return;
      const hostId = normaliseCode(typed) ?? typed;
      mesh = new PeerMesh({});
      hosting = false;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
      }, { once: true });
      announce('Joining...');
    },

    
    setup: sendHello,

    
    ready(n) {
      if (!mesh) return;
      mesh.broadcast(stamp({ t: MSG.READY, n }));
    },

    
    roll(n, link) {
      if (!mesh) return;
      mesh.broadcast(stamp({ t: MSG.ROLL, n, link }));
    },

    
    move(n, token) {
      if (!mesh) return;
      mesh.broadcast(stamp({ t: MSG.MOVE, n, token }));
    },

    
    say(id) {
      if (!mesh) return;
      mesh.broadcast(stamp({ t: MSG.SAY, say: id }));
    },

    leave() {
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      hosting = false;
      safely(onPeers, { peers: [], me: null });
      announce('You left the room.');
    },
  };
}


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';
