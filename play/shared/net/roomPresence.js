























import { publishRoom } from '../../../web-engine/net/firebaseRooms.js';














export function roomPresence({ game, net, players, bots = 0 }) {
  let withdrawFn = null;

  function sync() {
    const mesh = net();
    if (withdrawFn || !mesh?.hosting || !mesh.id) return;
    withdrawFn = publishRoom({ game, code: mesh.id, players, bots });
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

  return { sync, withdraw };
}
