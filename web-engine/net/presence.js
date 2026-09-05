



































export const REFRESH_MS = 20_000;
export const STALE_MS = REFRESH_MS * 3;


export const LIVE_GAMES = Object.freeze({
  crosswords: 'Farmy Crosswords',
  chess: 'Farmy Chess',
  ludo: 'Farmy Ludo',
  scrabble: 'Farmy Scrabble',
});


export const LIVE_PATH = Object.freeze({
  crosswords: '/play/farmy-crosswords/',
  chess: '/play/farmy-chess/',
  ludo: '/play/farmy-ludo/',
  scrabble: '/play/farmy-scrabble/',
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
  const players = Number(room.players);
  const who = players === 1 ? 'one player waiting'
    : (players > 1 ? `${players} players` : 'open');
  return `${name} - ${who} - ${String(room.code).toUpperCase()}`;
}










export function roomDoc({ game, code, players, now }) {
  return {
    game: String(game),
    code: String(code),
    players: Math.max(0, Math.min(99, Number(players) || 0)),
    updatedAt: Number(now),
  };
}
