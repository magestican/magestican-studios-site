


import { roomPresence } from '../../../shared/net/roomPresence.js';
import { lobbyPlayers, LOBBY_PHASE } from '../../../../web-engine/kart/lobby.js';
















export function publishKartRoom(session, myId, make = roomPresence) {
  const peopleIds = () => lobbyPlayers(session.lobby).map((p) => p.peerId).filter(Boolean);
  const modeOf = () => (session.lobby?.phase === LOBBY_PHASE.OPEN ? 'open' : 'playing');
  const presence = make({
    game: 'kart',
    net: () => (session.isHost && session.hostId === myId ? { hosting: true, id: myId } : null),
    players: () => Math.max(1, peopleIds().length),
    ids: peopleIds,
    bots: () => (session.seats ?? []).filter((s) => s && s.bot).length,
    mode: modeOf,
  });
  presence.sync();
  let lastMode = modeOf();
  session.addEventListener('lobby', () => {
    const m = modeOf();
    if (m !== lastMode) { lastMode = m; presence.refresh(); }
  });
  session.addEventListener('host-changed', () => {
    if (!(session.isHost && session.hostId === myId)) presence.withdraw();
  });
  session._presence = presence;
  return presence;
}
