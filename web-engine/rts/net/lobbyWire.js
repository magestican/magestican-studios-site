








































import {
  PHASE, FACTIONS, MAX_PLAYERS, players, join, leave, setFaction, setReady,
  setMap, canStart, startPayload,
} from './lobby.js';












export const LOB = 'lob';


export const SAY = Object.freeze({
  
  HELLO: 'hello',   
  WANT: 'want',     
  READY: 'ready',   
  
  ROOM: 'room',     
  GO: 'go',         
});


const ASKS = new Set([SAY.HELLO, SAY.WANT, SAY.READY]);


export function isLobbyMessage(msg) {
  return !!msg && typeof msg === 'object' && msg.k === LOB && typeof msg.v === 'string';
}






export const helloMessage = (name) => ({ k: LOB, v: SAY.HELLO, name: String(name || '').slice(0, 24) });


export const wantMessage = (faction) => ({ k: LOB, v: SAY.WANT, faction });


export const readyMessage = (ready) => ({ k: LOB, v: SAY.READY, ready: !!ready });


export const roomMessage = (lobby) => ({ k: LOB, v: SAY.ROOM, room: snapshot(lobby) });


export const goMessage = (payload) => ({ k: LOB, v: SAY.GO, payload });














export function snapshot(lobby) {
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    mapId: lobby.mapId,
    seed: lobby.seed | 0,
    phase: lobby.phase,
    members: Object.keys(lobby.members).sort().map((id) => {
      const m = lobby.members[id];
      return {
        id: m.id, name: m.name, faction: m.faction, ready: !!m.ready, observer: !!m.observer,
      };
    }),
  };
}











export function adopt(snap) {
  const members = Object.create(null);
  for (const m of (snap?.members ?? [])) {
    if (!m || typeof m.id !== 'string') continue;
    members[m.id] = {
      id: m.id,
      name: String(m.name || m.id).slice(0, 24),
      faction: FACTIONS.includes(m.faction) ? m.faction : null,
      ready: !!m.ready,
      observer: !!m.observer,
    };
  }
  return {
    code: snap?.code ?? null,
    hostId: snap?.hostId ?? null,
    mapId: snap?.mapId ?? null,
    seed: snap?.seed | 0,
    phase: Object.values(PHASE).includes(snap?.phase) ? snap.phase : PHASE.OPEN,
    members,
    startedAt: null,
  };
}


















export function firstFreeFaction(lobby, exceptId = null) {
  const held = Object.create(null);
  for (const f of FACTIONS) held[f] = 0;
  for (const id of players(lobby)) {
    if (id === exceptId) continue;
    const f = lobby.members[id].faction;
    if (f && held[f] !== undefined) held[f] += 1;
  }
  let best = FACTIONS[0];
  for (const f of FACTIONS) if (held[f] < held[best]) best = f;
  return best;
}










export function admit(lobby, id, name, maxPlayers = MAX_PLAYERS) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  const existing = lobby.members[id];
  const seated = players(lobby).filter((p) => p !== id).length;
  const observer = existing
    ? !!existing.observer
    : seated >= Math.max(0, Math.min(maxPlayers, MAX_PLAYERS));
  const r = join(lobby, { id, name: name || id, observer });
  if (!r.ok) return r;
  
  
  if (!r.member.observer && !r.member.faction) {
    setFaction(lobby, id, firstFreeFaction(lobby, id));
  }
  return r;
}


export function dismiss(lobby, id) {
  return leave(lobby, id);
}














export function applyAsk(lobby, from, msg) {
  if (!isLobbyMessage(msg)) return { ok: false, why: 'not a lobby message', publish: false };
  if (!ASKS.has(msg.v)) return { ok: false, why: 'not a request', publish: false };
  if (typeof from !== 'string' || !from) return { ok: false, why: 'no sender', publish: false };

  switch (msg.v) {
    case SAY.HELLO: {
      const r = admit(lobby, from, msg.name);
      return { ok: r.ok, why: r.why, publish: r.ok };
    }
    case SAY.WANT: {
      
      
      
      if (!lobby.members[from]) return { ok: false, why: 'not in this room', publish: false };
      if (swapIfHeadToHead(lobby, from, msg.faction)) return { ok: true, publish: true };
      const r = setFaction(lobby, from, msg.faction);
      
      
      
      
      return { ok: r.ok, why: r.why, publish: true };
    }
    case SAY.READY: {
      if (!lobby.members[from]) return { ok: false, why: 'not in this room', publish: false };
      const r = setReady(lobby, from, msg.ready);
      return { ok: r.ok, why: r.why, publish: true };
    }
    default:
      return { ok: false, why: 'unknown request', publish: false };
  }
}






















function swapIfHeadToHead(lobby, from, faction) {
  if (!FACTIONS.includes(faction)) return false;
  const me = lobby.members[from];
  if (!me || me.observer || me.faction === faction || !me.faction) return false;
  const ps = players(lobby);
  if (ps.length !== 2) return false;
  const other = ps.find((p) => p !== from);
  if (!other || lobby.members[other].faction !== faction) return false;
  
  
  
  
  const mine = me.faction;
  lobby.members[other].faction = mine;
  me.faction = faction;
  lobby.members[other].ready = false;
  me.ready = false;
  return true;
}


export function hostSetsMap(lobby, hostId, mapId) {
  return setMap(lobby, hostId, mapId);
}








export function commit(lobby, maxPlayers = MAX_PLAYERS) {
  const seats = players(lobby).length;
  
  
  
  
  if (seats > maxPlayers) {
    return { ok: false, why: 'this map does not seat that many players', payload: null };
  }
  const can = canStart(lobby);
  if (!can.ok) return { ok: false, why: can.why, payload: null };
  return { ok: true, payload: startPayload(lobby) };
}













export function view(lobby, me, maxPlayers = MAX_PLAYERS) {
  const rows = Object.keys(lobby.members).sort().map((id) => {
    const m = lobby.members[id];
    return {
      id,
      name: m.name,
      faction: m.faction,
      ready: !!m.ready,
      observer: !!m.observer,
      isHost: id === lobby.hostId,
      isMe: id === me,
    };
  });
  const ps = players(lobby);
  const can = commit(lobby, maxPlayers);
  return {
    code: lobby.code,
    mapId: lobby.mapId,
    phase: lobby.phase,
    rows,
    playerCount: ps.length,
    maxPlayers,
    canStart: can.ok,
    
    
    
    status: can.ok ? 'Everybody is ready.' : (can.why || 'Not ready.'),
  };
}
