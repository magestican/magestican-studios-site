

















































import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { GAME_PREFIX, roomCode, normaliseCode, gameOfCode, nameFor } from '../../../web-engine/words/coop.js';
import { createMeshTransport } from '../../../web-engine/rts/net/meshTransport.js';
import { seedFromString } from '../../../web-engine/rts/rng.js';
import { MAPS, DEFAULT_MAP } from '../../../web-engine/rts/maps/index.js';
import { createLobby, PHASE, applyStart, seatOf, playingSeatsOf, roster } from '../../../web-engine/rts/net/lobby.js';
import {
  LOB, SAY, isLobbyMessage, adopt, admit, dismiss, applyAsk, commit, view,
  helloMessage, wantMessage, readyMessage, roomMessage, goMessage, hostSetsMap,
} from '../../../web-engine/rts/net/lobbyWire.js';
import { roomPresence } from '../../shared/net/roomPresence.js';


const MY_PREFIX = GAME_PREFIX.uprising;


export const LIVE_GAME = 'uprising';












const CODE_TRIES = 5;


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';








function codeError(typed) {
  const other = gameOfCode(typed);
  if (other && GAME_PREFIX[other] !== MY_PREFIX) {
    const name = other.charAt(0).toUpperCase() + other.slice(1);
    return `That is a Farmy ${name} code. Open Farmy ${name} to use it.`;
  }
  return 'That code does not look right. Check it and try again.';
}








export function createNet({ onRoom, onStatus, onStart, onError = () => {} }) {
  let mesh = null;
  let myId = null;
  let hosting = false;
  let lobby = null;
  let started = false;
  let wantedMap = DEFAULT_MAP;

  const say = (s) => { try { onStatus(s); } catch {  } };
  const seats = () => (lobby && MAPS[lobby.mapId] ? MAPS[lobby.mapId].players : 2);

  
  function draw() {
    if (!lobby) return;
    try { onRoom(view(lobby, myId, seats())); } catch {  }
  }

  






  function publishRoomState() {
    if (!lobby || !hosting) return;
    if (mesh) mesh.broadcast(roomMessage(lobby));
    draw();
  }

  
  
  
  
  
  
  
  
  
  
  const presence = roomPresence({
    game: LIVE_GAME,
    net: () => (mesh && myId ? { hosting, id: myId } : null),
    
    
    
    players: () => (lobby ? Math.max(1, roster(lobby).length) : 1),
  });

  
  
  

  function wire() {
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      if (hosting) {
        
        
        
        
        
        lobby = createLobby({
          code: myId, hostId: myId, mapId: wantedMap, seed: seedFromString(myId),
        });
        admit(lobby, myId, nameFor(myId), seats());
        presence.sync();
        publishRoomState();
        say('Room open. Read the code out, or send the link.');
      } else {
        say('Connecting...');
      }
    });

    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.id;
      presence.sync();
      if (!hosting || !who || !lobby) return;
      if (started || lobby.phase !== PHASE.OPEN) {
        
        
        
        
        
        mesh.send(who, { k: LOB, v: SAY.ROOM, room: null, closed: 'the match has already started' });
        return;
      }
      admit(lobby, who, nameFor(who), seats());
      publishRoomState();
      say(`${nameFor(who)} joined.`);
    });

    mesh.addEventListener('peer-left', (e) => {
      const who = e.detail?.id;
      if (!hosting || !lobby || !who) return;
      
      
      
      
      
      if (started) return;
      dismiss(lobby, who);
      publishRoomState();
      say(`${nameFor(who)} left.`);
    });

    mesh.addEventListener('message', (e) => {
      const msg = e.detail?.message;
      const from = e.detail?.from;
      
      
      if (!isLobbyMessage(msg)) return;

      if (hosting) {
        const r = applyAsk(lobby, from, msg);
        if (r.publish) publishRoomState();
        return;
      }

      if (msg.v === SAY.ROOM) {
        if (msg.closed) { onError(msg.closed); say(msg.closed); return; }
        lobby = adopt(msg.room);
        draw();
        return;
      }
      if (msg.v === SAY.GO) {
        begin(msg.payload);
      }
    });

    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      
      
      
      
      if (hosting && lobby) { lobby.hostId = myId; presence.sync(); publishRoomState(); }
      say(hosting ? 'You are hosting this room now.' : 'The room has a new host.');
    });

    mesh.addEventListener('join-failed', (e) => {
      const why = e.detail?.reason ?? 'no answer';
      onError(`Could not join: ${why}`);
      say(`Could not join: ${why}`);
    });

    mesh.addEventListener('error', (e) => {
      const message = e.detail?.message ?? 'unknown';
      
      
      if (/unavailable-id/.test(message)) return;
      say(`Connection trouble: ${message}.`);
    });
  }

  






  function begin(payload) {
    if (started || !payload) return;
    started = true;
    applyStart(lobby, payload);
    
    
    
    
    
    
    presence.withdraw();
    const seat = seatOf(payload, myId);
    onStart({
      payload,
      
      
      seat,
      peers: playingSeatsOf(payload),
      transport: createMeshTransport(mesh),
      map: MAPS[payload.mapId],
    });
    draw();
  }

  







  function ask(msg) {
    if (!mesh || !myId) return;
    if (hosting) {
      const r = applyAsk(lobby, myId, msg);
      if (r.publish) publishRoomState();
      if (!r.ok && r.why) say(r.why);
      return;
    }
    mesh.broadcast(msg);
  }

  return {
    get id() { return myId; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    get started() { return started; },
    get lobby() { return lobby; },
    get view() { return lobby ? view(lobby, myId, seats()) : null; },

    
    host(mapId = DEFAULT_MAP, attempt = 0) {
      if (mesh) return;
      wantedMap = MAPS[mapId] ? mapId : DEFAULT_MAP;
      if (!canPlayTogether()) { onError('This browser cannot open a room.'); return; }
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
        this.host(wantedMap, attempt + 1);
      });
      mine.addEventListener('open', () => mine.host(), { once: true });
      if (attempt === 0) say('Opening a room...');
    },

    
    join(typed) {
      
      
      
      
      
      const hostId = normaliseCode(typed, MY_PREFIX);
      if (!hostId) return { error: codeError(typed) };
      if (mesh) return { error: 'You are already in a room.' };
      if (!canPlayTogether()) return { error: 'This browser cannot join a room.' };
      mesh = new PeerMesh({});
      hosting = false;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
        
        
        
        
        setTimeout(() => { mesh?.broadcast(helloMessage(nameFor(myId))); }, 400);
      }, { once: true });
      say('Joining...');
      return { ok: true };
    },

    
    chooseFaction(faction) { ask(wantMessage(faction)); },

    
    setReady(ready) { ask(readyMessage(ready)); },

    
    chooseMap(mapId) {
      wantedMap = MAPS[mapId] ? mapId : wantedMap;
      if (!lobby || !hosting) return;
      const r = hostSetsMap(lobby, myId, wantedMap);
      if (!r.ok) { say(r.why); return; }
      publishRoomState();
    },

    






    start() {
      if (!hosting || !lobby) return { error: 'Only the host can start.' };
      const r = commit(lobby, seats());
      if (!r.ok) { say(r.why); return { error: r.why }; }
      mesh.broadcast(goMessage(r.payload));
      begin(r.payload);
      return { ok: true };
    },

    leave() {
      
      
      
      presence.withdraw();
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      lobby = null;
      hosting = false;
      started = false;
      say('You left the room.');
    },
  };
}













export async function openRooms(mine = null) {
  try {
    const [{ fetchOpenRooms }, { liveRooms }] = await Promise.all([
      import('../../../web-engine/net/firebaseRooms.js'),
      import('../../../web-engine/net/presence.js'),
    ]);
    const all = await fetchOpenRooms();
    return liveRooms(all, { now: Date.now(), mine }).filter((r) => r.game === LIVE_GAME);
  } catch {
    return [];
  }
}


export async function lobbyAvailable() {
  try {
    const { isLobbyAvailable } = await import('../../../web-engine/net/firebaseRooms.js');
    return await isLobbyAvailable();
  } catch {
    return false;
  }
}
