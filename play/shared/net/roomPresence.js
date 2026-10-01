























import { publishRoom } from '../../../web-engine/net/firebaseRooms.js';
import { honestCounts } from '../../../web-engine/net/presence.js';
import { CARDS } from '../../../web-engine/progress/peerCards.js';
import { isFleet } from '../../../web-engine/progress/fleet.js';
import { SNAPSHOT_KEY } from '../../../web-engine/progress/snapshot.js';








export function hostCard({ storage, fleet = isFleet } = {}) {
  try {
    if (fleet()) return {};
    const st = storage ?? globalThis.localStorage;
    const snap = JSON.parse(st?.getItem(SNAPSHOT_KEY) || 'null');
    if (!snap || typeof snap !== 'object') return {};
    const out = {};
    if (typeof snap.name === 'string' && snap.name.trim()) out.host = snap.name;
    if (Number.isInteger(snap.level) && snap.level >= 1) out.level = snap.level;
    return out;
  } catch {
    return {};
  }
}




















export function roomPresence({
  game, net, players, bots = 0, ids = null, mode = null,
  publish = publishRoom, fleet = isFleet, cards = CARDS, storage,
}) {
  let withdrawFn = null;
  const botsOf = typeof bots === 'function' ? bots : () => bots;

  
  
  const counts = () => honestCounts({
    players: players(),
    bots: botsOf(),
    ids: ids ? ids() : null,
    me: net()?.id ?? null,
    meIsFleet: !!fleet(),
    cardOf: (id) => cards.get(id),
  });

  function sync() {
    const mesh = net();
    if (withdrawFn || !mesh?.hosting || !mesh.id) return;
    withdrawFn = publish({
      game,
      code: mesh.id,
      players: () => counts().players,
      bots: () => counts().bots,
      host: () => hostCard({ storage, fleet }).host,
      level: () => hostCard({ storage, fleet }).level,
      mode: mode ? () => mode() : undefined,
    });
  }

  
  function refresh() {
    try { withdrawFn?.refresh?.(); } catch {  }
  }

  function withdraw() {
    if (!withdrawFn) return;
    const stop = withdrawFn;
    withdrawFn = null;
    
    
    
    try { stop(); } catch {  }
  }

  try {
    
    globalThis.addEventListener?.('pagehide', withdraw);
    globalThis.addEventListener?.('beforeunload', withdraw);
  } catch {  }

  return { sync, withdraw, refresh };
}
