





























import { CHARACTERS } from './kartTuning.js';
import { botsForField } from './netRace.js';

export const LOBBY_PHASE = Object.freeze({
  OPEN: 'open',           
  COUNTDOWN: 'countdown', 
  RACING: 'racing',
});





export const FIELD_SIZES = Object.freeze([4, 6, 8, 10, 12]);
export const LAP_OPTIONS = Object.freeze([2, 3, 5]);

export const DEFAULT_SETTINGS = Object.freeze({
  trackId: null,       
  difficulty: null,    
  laps: 3,
  fieldSize: 8,
});

const rosterIds = () => CHARACTERS.map((c) => c.id);










export function createLobby({ hostId = null, roster = null, settings = {} } = {}) {
  return {
    hostId: hostId == null ? null : String(hostId),
    phase: LOBBY_PHASE.OPEN,
    roster: (roster && roster.length ? [...roster] : rosterIds()),
    
    players: [],
    settings: { ...DEFAULT_SETTINGS, ...settings },
    
    
    
    
    
    version: 0,
  };
}




const bump = (lobby, patch) => ({ ...lobby, ...patch, version: lobby.version + 1 });


export function humanCapacity(lobby) {
  return Math.min(lobby.settings.fieldSize, lobby.roster.length);
}


export function takenCharacters(lobby) {
  return lobby.players.map((p) => p.characterId).filter((c) => c != null);
}


export function freeCharacters(lobby) {
  const taken = new Set(takenCharacters(lobby));
  return lobby.roster.filter((c) => !taken.has(c));
}









export function pickCharacter(lobby, prefer = null) {
  const free = freeCharacters(lobby);
  if (prefer && free.includes(prefer)) return prefer;
  return free[0] ?? null;
}










export function joinLobby(lobby, { peerId, name = null, characterId = null } = {}) {
  if (peerId == null) return { lobby, ok: false, reason: 'no-id', player: null };
  const id = String(peerId);
  const already = lobby.players.find((p) => p.peerId === id);
  
  
  
  if (already) return { lobby, ok: true, reason: null, player: already };
  if (lobby.players.length >= humanCapacity(lobby)) {
    return { lobby, ok: false, reason: 'full', player: null };
  }
  const character = pickCharacter(lobby, characterId);
  if (character == null) return { lobby, ok: false, reason: 'no-character', player: null };
  const player = {
    peerId: id,
    name: name || defaultName(character, lobby),
    characterId: character,
    
    
    
    ready: id === lobby.hostId,
  };
  return {
    lobby: bump(lobby, { players: [...lobby.players, player] }),
    ok: true,
    reason: null,
    player,
  };
}

const defaultName = (characterId, lobby) => defaultNameFor(characterId)
  ?? `Racer ${lobby.players.length + 1}`;


function defaultNameFor(characterId) {
  return CHARACTERS.find((x) => x.id === characterId)?.name ?? null;
}


export function leaveLobby(lobby, peerId) {
  const id = String(peerId);
  if (!lobby.players.some((p) => p.peerId === id)) return lobby;
  return bump(lobby, { players: lobby.players.filter((p) => p.peerId !== id) });
}










export function claimCharacter(lobby, peerId, characterId) {
  const id = String(peerId);
  const me = lobby.players.find((p) => p.peerId === id);
  if (!me) return { lobby, ok: false, reason: 'not-in-lobby' };
  if (!lobby.roster.includes(characterId)) return { lobby, ok: false, reason: 'unknown-character' };
  if (me.characterId === characterId) return { lobby, ok: true, reason: null };
  const holder = lobby.players.find((p) => p.peerId !== id && p.characterId === characterId);
  if (holder) return { lobby, ok: false, reason: 'taken' };
  
  
  
  
  
  
  const renamed = me.name === defaultNameFor(me.characterId)
    ? defaultNameFor(characterId) : me.name;
  return {
    lobby: bump(lobby, {
      players: lobby.players.map((p) => (p.peerId === id ? { ...p, characterId, name: renamed } : p)),
    }),
    ok: true,
    reason: null,
  };
}

export function setReady(lobby, peerId, ready) {
  const id = String(peerId);
  if (!lobby.players.some((p) => p.peerId === id)) return lobby;
  return bump(lobby, {
    players: lobby.players.map((p) => (p.peerId === id ? { ...p, ready: !!ready } : p)),
  });
}















export function setSettings(lobby, peerId, patch = {}) {
  if (String(peerId) !== lobby.hostId) return { lobby, ok: false, reason: 'not-host' };
  const next = { ...lobby.settings };
  if (patch.trackId != null) next.trackId = String(patch.trackId);
  if (patch.difficulty != null) next.difficulty = String(patch.difficulty);
  if (patch.laps != null) {
    const laps = Number(patch.laps);
    if (LAP_OPTIONS.includes(laps)) next.laps = laps;
  }
  if (patch.fieldSize != null) {
    const want = Number(patch.fieldSize);
    if (FIELD_SIZES.includes(want)) {
      next.fieldSize = Math.max(want, lobby.players.length);
    }
  }
  return { lobby: bump(lobby, { settings: next }), ok: true, reason: null };
}


export function botCount(lobby) {
  return botsForField(lobby.players.length, lobby.settings.fieldSize);
}











export function botCharacterOrder(lobby, count = null) {
  const n = count == null ? botCount(lobby) : count;
  const free = freeCharacters(lobby);
  const order = [];
  for (let i = 0; i < n; i += 1) {
    order.push(i < free.length ? free[i] : lobby.roster[(i - free.length) % lobby.roster.length]);
  }
  return order;
}











export function canStart(lobby) {
  if (lobby.phase !== LOBBY_PHASE.OPEN) return { ok: false, reason: 'already-started' };
  if (lobby.settings.trackId == null) return { ok: false, reason: 'no-track' };
  const notReady = lobby.players.filter((p) => !p.ready);
  if (notReady.length) return { ok: false, reason: 'not-ready', who: notReady.map((p) => p.peerId) };
  const dupes = duplicateCharacters(lobby);
  if (dupes.length) return { ok: false, reason: 'duplicate-character', who: dupes };
  return { ok: true, reason: null };
}











export function duplicateCharacters(lobby) {
  const seen = new Map();
  const dupes = [];
  for (const p of lobby.players) {
    if (p.characterId == null) continue;
    if (seen.has(p.characterId)) dupes.push(p.characterId);
    else seen.set(p.characterId, p.peerId);
  }
  return [...new Set(dupes)];
}


export function lobbyPlayers(lobby) {
  return lobby.players.map((p) => ({
    peerId: p.peerId, name: p.name, characterId: p.characterId,
  }));
}

export function startLobby(lobby) {
  return bump(lobby, { phase: LOBBY_PHASE.RACING });
}

export function reopenLobby(lobby) {
  
  
  
  
  return bump(lobby, {
    phase: LOBBY_PHASE.OPEN,
    players: lobby.players.map((p) => ({ ...p, ready: p.peerId === lobby.hostId })),
  });
}









export function migrateLobbyHost(lobby, newHostId) {
  const id = newHostId == null ? null : String(newHostId);
  return bump(lobby, {
    hostId: id,
    players: lobby.players.map((p) => (p.peerId === id ? { ...p, ready: true } : p)),
  });
}


export function serializeLobby(lobby) {
  return {
    hostId: lobby.hostId,
    phase: lobby.phase,
    roster: [...lobby.roster],
    players: lobby.players.map((p) => ({ ...p })),
    settings: { ...lobby.settings },
    version: lobby.version,
  };
}










export function applyLobby(local, wire) {
  if (!wire || typeof wire !== 'object') return local;
  if (local && wire.version != null && local.version != null && wire.version < local.version) {
    return local;
  }
  return {
    hostId: wire.hostId ?? null,
    phase: wire.phase ?? LOBBY_PHASE.OPEN,
    roster: wire.roster?.length ? [...wire.roster] : rosterIds(),
    players: (wire.players ?? []).map((p) => ({ ...p })),
    settings: { ...DEFAULT_SETTINGS, ...(wire.settings ?? {}) },
    version: wire.version ?? 0,
  };
}
