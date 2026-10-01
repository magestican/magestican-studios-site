

























import { liveRooms, LIVE_GAMES, LIVE_PATH, joinUrl, roomLine, seatText } from './presence.js';

export const LIVE_POLL_MS = 60_000;
export const LIVE_STOP_AFTER_MS = 10 * 60_000;
export const LIVE_CAP = 12;

export const EMPTY_TEXT = 'Nobody is hosting right now - start a room and it shows here';
export const OFFLINE_TEXT = 'Offline';





export const LIVE_STATS_ID = Object.freeze({
  crosswords: 'farmy-crosswords',
  chess: 'farmy-chess',
  ludo: 'farmy-ludo',
  scrabble: 'farmy-scrabble',
  checkers: 'farmy-checkers',
  uprising: 'farmy-uprising',
  evilhills: 'farmy-evil-hills',
  moonlife: 'farmy-moon-life',
  kart: 'farmykart',
  farmyshoot: 'team-bonding',
});






export const LIVE_ACCENT = Object.freeze({
  crosswords: '#6b4a7a',
  chess: '#7a5c2e',
  ludo: '#2f6b4f',
  scrabble: '#3f5d7a',
  checkers: '#8a4b2a',
  uprising: '#55703a',
  evilhills: '#6a2f2f',
  moonlife: '#e8a15a',
  kart: '#c2452d',
  farmyshoot: '#8a6a2a',
});


export function chipOf(room) {
  return {
    game: room.game,
    code: String(room.code),
    name: LIVE_GAMES[room.game],
    statsId: LIVE_STATS_ID[room.game] ?? null,
    accent: LIVE_ACCENT[room.game] ?? '#1c1a17',
    href: joinUrl(room),
    host: room.host ? String(room.host) : '',
    level: room.level ? Number(room.level) : null,
    seats: seatText(room),
    players: Math.max(0, Number(room.players) || 0),
    full: room.mode === 'full',
    line: roomLine(room),
  };
}









export function feedModel(rooms, { now, mine = null, offline = false, cap = LIVE_CAP } = {}) {
  if (offline) return { state: 'offline', text: OFFLINE_TEXT, count: 0, groups: [], chips: [] };
  const live = liveRooms(rooms, { now, mine })
    .filter((r) => LIVE_PATH[r.game])
    
    .sort((a, b) => (a.mode === 'full') - (b.mode === 'full')
      || (Number(b.players) || 0) - (Number(a.players) || 0)
      || Number(b.updatedAt) - Number(a.updatedAt)
      || String(a.code).localeCompare(String(b.code)))
    .slice(0, Math.max(0, cap));
  if (!live.length) return { state: 'empty', text: EMPTY_TEXT, count: 0, groups: [], chips: [] };
  const groups = [];
  const byGame = new Map();
  for (const r of live) {
    let g = byGame.get(r.game);
    if (!g) {
      g = { game: r.game, name: LIVE_GAMES[r.game], accent: LIVE_ACCENT[r.game], chips: [] };
      byGame.set(r.game, g);
      groups.push(g);
    }
    g.chips.push(chipOf(r));
  }
  const chips = groups.flatMap((g) => g.chips);
  return {
    state: 'live',
    text: chips.length === 1 ? '1 room open' : `${chips.length} rooms open`,
    count: chips.length,
    groups,
    chips,
  };
}





export function shouldPoll({
  hidden = false, startedAt = 0, lastReadAt = null, now = 0,
  pollMs = LIVE_POLL_MS, stopAfterMs = LIVE_STOP_AFTER_MS,
} = {}) {
  if (hidden) return false;
  if (now - startedAt > stopAfterMs) return false;
  if (lastReadAt === null) return true;
  return now - lastReadAt >= pollMs;
}
