







































import { fetchOpenRooms, isLobbyAvailable, publishRoom, sweepStaleRooms } from 'net/firebaseRooms.js';
import { MOON_GAME, openMoons, readNow } from 'moon/play/lobby.mjs';





















export const DIRECTORY_HOSTS = Object.freeze(['magesticanstudios.com', 'www.magesticanstudios.com']);


export function onDirectoryOrigin(host = (typeof location === 'undefined' ? '' : location.hostname)) {
  return DIRECTORY_HOSTS.includes(String(host || '').toLowerCase());
}


export async function lobbyAvailable() {
  if (!onDirectoryOrigin()) return false;
  return isLobbyAvailable();
}








export function publishMoon({ code, players }) {
  
  
  if (!onDirectoryOrigin()) return () => {};
  return publishRoom({ game: MOON_GAME, code, players, bots: 0 });
}









export async function readMoons({ now = Date.now(), mine = null } = {}) {
  if (!onDirectoryOrigin()) return [];
  const rooms = await fetchOpenRooms();
  sweepStaleRooms(rooms, { now }).catch(() => {});
  return openMoons(rooms, { now, mine });
}









export function createLobbyPoll({ mine = () => null, onMoons = () => {} } = {}) {
  let lastReadAt = null;
  let reading = false;
  return {
    
    possible: onDirectoryOrigin(),
    
    async tick(now = Date.now(), hidden = document.visibilityState === 'hidden') {
      if (!onDirectoryOrigin()) return false;
      if (reading || !readNow({ hidden, lastReadAt, now })) return false;
      reading = true;
      try {
        const moons = await readMoons({ now, mine: mine() });
        lastReadAt = now;
        onMoons(moons);
        return true;
      } catch {
        
        
        lastReadAt = now;
        onMoons([]);
        return false;
      } finally {
        reading = false;
      }
    },
    
    now() { lastReadAt = null; },
  };
}
