






































































export const REFRESH_MS = 60_000;
export const STALE_MS = REFRESH_MS * 3;


export const LIVE_GAMES = Object.freeze({
  crosswords: 'Farmy Crosswords',
  chess: 'Farmy Chess',
  ludo: 'Farmy Ludo',
  scrabble: 'Farmy Scrabble',
  checkers: 'Farmy Checkers',
  uprising: 'Farmy Uprising',
});


export const LIVE_PATH = Object.freeze({
  crosswords: '/play/farmy-crosswords/',
  chess: '/play/farmy-chess/',
  ludo: '/play/farmy-ludo/',
  scrabble: '/play/farmy-scrabble/',
  checkers: '/play/farmy-checkers/',
  uprising: '/play/farmy-uprising/',
});


export function isFresh(room, now, staleMs = STALE_MS) {
  const at = Number(room?.updatedAt);
  if (!Number.isFinite(at)) return false;
  
  
  
  if (at > now + staleMs) return false;
  return now - at <= staleMs;
}








export function liveRooms(rooms, { now, mine = null, staleMs = STALE_MS } = {}) {
  const list = Array.isArray(rooms) ? rooms : [];
  return list
    .filter((r) => r && typeof r.code === 'string' && LIVE_GAMES[r.game])
    .filter((r) => r.code !== mine)
    .filter((r) => isFresh(r, now, staleMs))
    .sort((a, b) => {
      
      
      
      const waiting = (r) => (Number(r.players) === 1 ? 1 : 0);
      return waiting(b) - waiting(a)
        || Number(b.updatedAt) - Number(a.updatedAt)
        || String(a.code).localeCompare(String(b.code));
    });
}


export const liveCount = (rooms, opts) => liveRooms(rooms, opts).length;









export function badgeText(count) {
  if (!count) return '';
  return count === 1 ? '1 game live' : `${count} games live`;
}








export function roomLine(room) {
  if (!room) return '';
  const name = LIVE_GAMES[room.game] ?? 'A farm game';
  return `${name} - ${whoIsIn(room)} - ${String(room.code).toUpperCase()}`;
}








export function whoIsIn(room) {
  const players = Math.max(0, Number(room?.players) || 0);
  const bots = Math.max(0, Number(room?.bots) || 0);
  const people = Math.max(0, players - bots);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const total = Math.max(people + bots, players);
  if (total <= 0) return 'open';
  if (people <= 0) return total === 1 ? 'one playing, join in' : `${total} playing, join in`;
  if (bots > 0) return `${total} playing, join in`;
  return people === 1 ? 'one player waiting' : `${people} players`;
}










export function roomDoc({ game, code, players, bots = 0, now }) {
  return {
    game: String(game),
    code: String(code),
    players: Math.max(0, Math.min(99, Number(players) || 0)),
    
    
    
    
    
    
    
    
    
    
    
    
    bots: Math.max(0, Math.min(99, Number(bots) || 0)),
    updatedAt: Number(now),
  };
}
























export function readNow({
  hidden = false, lastReadAt = null, now = 0, pollMs = REFRESH_MS,
} = {}) {
  if (hidden) return false;
  if (lastReadAt === null || !Number.isFinite(Number(lastReadAt))) return true;
  return Number(now) - Number(lastReadAt) >= Number(pollMs);
}
