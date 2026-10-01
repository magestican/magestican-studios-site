
















import { roomPresence } from '../../shared/net/roomPresence.js';

export function publishShootRoom(game, mesh, myId, make = roomPresence) {
  let original = true;
  const peopleIds = () => [...(game.playerMeta?.keys?.() ?? [])]
    .filter((id) => id && !game.bots?.has?.(id));
  const presence = make({
    game: 'farmyshoot',
    net: () => (original && game.isHost ? { hosting: true, id: myId } : null),
    players: () => Math.max(1, peopleIds().length),
    ids: peopleIds,
    bots: () => game.bots?.size ?? 0,
    mode: () => 'playing',
  });
  presence.sync();
  try {
    mesh.addEventListener('host-changed', (e) => {
      if ((e?.detail?.hostId ?? null) !== myId) { original = false; presence.withdraw(); }
    });
  } catch {  }
  return presence;
}
