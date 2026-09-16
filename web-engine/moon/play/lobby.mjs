




























import { REFRESH_MS, STALE_MS, isFresh, readNow, roomDoc } from '../../net/presence.js';
import { ROOM_PREFIX, isRoomCode } from './session.mjs';












export const MOON_GAME = 'moonlife';

export { REFRESH_MS, STALE_MS, isFresh, readNow };









export const SHOW_LIMIT = 12;


export const isMoonRoom = (room) => Boolean(room)
  && room.game === MOON_GAME
  && isRoomCode(room.code);








export function openMoons(rooms, { now, mine = null, staleMs = STALE_MS, limit = SHOW_LIMIT } = {}) {
  const list = Array.isArray(rooms) ? rooms : [];
  return list
    .filter(isMoonRoom)
    .filter((r) => r.code !== mine)
    .filter((r) => isFresh(r, now, staleMs))
    .sort((a, b) => {
      
      
      
      
      const alone = (r) => (Number(r.players) === 1 ? 1 : 0);
      return alone(b) - alone(a)
        || Number(b.updatedAt) - Number(a.updatedAt)
        || String(a.code).localeCompare(String(b.code));
    })
    .slice(0, Math.max(0, limit));
}

export const openCount = (rooms, opts) => openMoons(rooms, opts).length;










export function moonLine(room) {
  if (!isMoonRoom(room)) return '';
  const people = Math.max(0, Number(room.players) || 0);
  const who = people <= 1 ? 'Someone is here on their own' : `${people} are here`;
  return `${who} - ${String(room.code).toUpperCase()}`;
}









export function lobbyBadge(count) {
  if (!count) return '';
  return count === 1 ? '1 moon to visit' : `${count} moons to visit`;
}





export const moonDoc = ({ code, players, now }) => roomDoc({ game: MOON_GAME, code, players, bots: 0, now });









export function tidyCode(typed) {
  const raw = String(typed ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!raw) return null;
  const body = raw.startsWith(ROOM_PREFIX.toUpperCase()) ? raw.slice(ROOM_PREFIX.length) : raw;
  const code = `${ROOM_PREFIX}-${body}`;
  return isRoomCode(code) ? code : null;
}
