


























import { GAME_PREFIX, roomCode, normaliseCode } from '../../words/coop.js';

export const PHASE = Object.freeze({
  OPEN: 'open',           
  STARTING: 'starting',   
  PLAYING: 'playing',
  CLOSED: 'closed',
});


export const FACTIONS = Object.freeze(['herd', 'yield']);

export const MAX_PLAYERS = 4;


















export const GAME_ID = 'uprising';
export const ROOM_PREFIX = GAME_PREFIX[GAME_ID];


export function makeRoomCode(random = Math.random) {
  return roomCode(random, ROOM_PREFIX);
}







export function readRoomCode(text) {
  const code = normaliseCode(text, ROOM_PREFIX);
  return code || null;
}










export function createLobby({ code, hostId, mapId, seed }) {
  return {
    code,
    hostId,
    mapId,
    seed: seed | 0,
    phase: PHASE.OPEN,
    
    members: Object.create(null),
    startedAt: null,
  };
}


export function roster(lobby) {
  return Object.keys(lobby.members).sort();
}


export function players(lobby) {
  return roster(lobby).filter((id) => !lobby.members[id].observer);
}

export function observers(lobby) {
  return roster(lobby).filter((id) => lobby.members[id].observer);
}









export function join(lobby, { id, name, observer = false }) {
  if (lobby.phase === PHASE.CLOSED) return { ok: false, why: 'the room has closed' };
  const existing = lobby.members[id];
  if (!existing && !observer && players(lobby).length >= MAX_PLAYERS) {
    
    
    return join(lobby, { id, name, observer: true });
  }
  if (!existing && lobby.phase !== PHASE.OPEN && !observer) {
    
    
    return join(lobby, { id, name, observer: true });
  }
  lobby.members[id] = {
    id,
    name: String(name || id).slice(0, 24),
    faction: existing ? existing.faction : null,
    ready: existing ? existing.ready : false,
    observer,
  };
  return { ok: true, member: lobby.members[id] };
}

export function leave(lobby, id) {
  delete lobby.members[id];
  
  
  
  
  if (id === lobby.hostId) {
    const rest = roster(lobby);
    lobby.hostId = rest.length ? rest[0] : null;
    if (!lobby.hostId) lobby.phase = PHASE.CLOSED;
  }
  return lobby;
}








export function setFaction(lobby, id, faction) {
  const m = lobby.members[id];
  if (!m) return { ok: false, why: 'not in this room' };
  if (!FACTIONS.includes(faction)) return { ok: false, why: 'no such faction' };
  if (m.observer) return { ok: false, why: 'observers do not pick a side' };
  const ps = players(lobby);
  if (ps.length === 2) {
    const other = ps.find((p) => p !== id);
    if (other && lobby.members[other].faction === faction) {
      return { ok: false, why: 'the other player has that side' };
    }
  }
  m.faction = faction;
  
  
  m.ready = false;
  return { ok: true };
}

export function setReady(lobby, id, ready) {
  const m = lobby.members[id];
  if (!m) return { ok: false, why: 'not in this room' };
  if (!m.observer && !m.faction) return { ok: false, why: 'pick a side first' };
  m.ready = !!ready;
  return { ok: true };
}


export function setMap(lobby, id, mapId) {
  if (id !== lobby.hostId) return { ok: false, why: 'only the host chooses the map' };
  lobby.mapId = mapId;
  for (const m of Object.values(lobby.members)) m.ready = false;
  return { ok: true };
}






export function canStart(lobby) {
  if (lobby.phase !== PHASE.OPEN) return { ok: false, why: 'already starting' };
  const ps = players(lobby);
  if (ps.length < 2) return { ok: false, why: 'waiting for another player' };
  if (ps.length > MAX_PLAYERS) return { ok: false, why: 'too many players' };
  for (const id of ps) {
    const m = lobby.members[id];
    if (!m.faction) return { ok: false, why: `${m.name} has not picked a side` };
    if (!m.ready) return { ok: false, why: `${m.name} is not ready` };
  }
  
  
  return { ok: true };
}









export function startPayload(lobby) {
  const ps = players(lobby);
  return {
    code: lobby.code,
    mapId: lobby.mapId,
    seed: lobby.seed | 0,
    
    seats: ps.map((id) => ({ id, faction: lobby.members[id].faction })),
    observers: observers(lobby),
  };
}








export function applyStart(lobby, payload) {
  lobby.mapId = payload.mapId;
  lobby.seed = payload.seed | 0;
  lobby.phase = PHASE.STARTING;
  lobby.startedAt = payload;
  return lobby;
}








export function seatOf(payload, id) {
  const i = payload.seats.findIndex((s) => s.id === id);
  return i;
}


export function playingSeatsOf(payload) {
  return payload.seats.map((_, i) => i);
}
