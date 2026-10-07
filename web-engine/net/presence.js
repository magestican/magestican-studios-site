






































































export const REFRESH_MS = 60_000;
export const STALE_MS = REFRESH_MS * 3;


export const LIVE_GAMES = Object.freeze({
  crosswords: 'Wordnook',
  chess: 'Rookwise',
  ludo: 'Pawnrush',
  scrabble: 'Letterloft',
  checkers: 'Jumpwise',
  uprising: 'Hoofrise',
  evilhills: 'Evil Hills',
  
  
  
  
  moonlife: 'Moon Life',
  
  
  
  kart: 'Kartzoom',
  farmyshoot: 'Splatbarn',
});









export const PEER_PREFIX = Object.freeze({ kart: 'fk-', farmyshoot: 'tb-' });







export function displayCode(room) {
  const c = String(room?.code ?? '');
  return PEER_PREFIX[room?.game] ? c : c.toUpperCase();
}


export function isPublishableCode(game, code) {
  const c = String(code ?? '');
  const peer = PEER_PREFIX[game];
  if (peer) return c.startsWith(peer) && /^(fk|tb)-[a-z0-9]{6}$/.test(c);
  return /^(fcx|fch|flu|fsc|fdr|fup|feh|fml)-[ACDEFGHJKMNPRTUVWXY34679]{6}$/.test(c);
}


export const LIVE_PATH = Object.freeze({
  crosswords: '/play/farmy-crosswords/',
  chess: '/play/farmy-chess/',
  ludo: '/play/farmy-ludo/',
  scrabble: '/play/farmy-tiles/',
  checkers: '/play/farmy-checkers/',
  uprising: '/play/farmy-uprising/',
  evilhills: '/play/farmy-evil-hills/',
  moonlife: '/play/farmy-moon-life/',
  kart: '/play/farmykart/',
  farmyshoot: '/play/farmyshoot/',
});


export function joinUrl(room) {
  const path = LIVE_PATH[room?.game];
  return path ? `${path}?join=${encodeURIComponent(String(room.code))}` : null;
}





export const SEATS = Object.freeze({ chess: 2, checkers: 2, ludo: 4, scrabble: 4 });


export const ROOM_MODES = Object.freeze(['open', 'full', 'playing']);


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
  
  
  
  
  if (room.host || room.level) {
    const parts = [];
    if (room.host) parts.push(String(room.host));
    if (room.level) parts.push(`Lv ${room.level}`);
    
    
    
    parts.push(name.replace(/^Farm[y] /, ''));
    parts.push(seatText(room));
    parts.push(room.mode === 'full' ? 'Full' : 'Join');
    return parts.join(' - ');
  }
  return `${name} - ${whoIsIn(room)} - ${displayCode(room)}`;
}






export function seatText(room) {
  const seats = SEATS[room?.game];
  
  if (!seats) return whoIsIn(room).replace(/, join in$/, '');
  const people = Math.max(0, Number(room?.players) || 0);
  return `${Math.min(seats, people)}/${seats}`;
}








export function whoIsIn(room) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const people = Math.max(0, Number(room?.players) || 0);
  const bots = Math.max(0, Number(room?.bots) || 0);
  const total = people + bots;
  if (total <= 0) return 'open';
  
  
  
  
  if (people <= 0 || bots > 0) {
    return total === 1 ? 'one playing, join in' : `${total} playing, join in`;
  }
  return people === 1 ? 'one player waiting' : `${people} players`;
}




















export function roomDoc({
  game, code, players, bots = 0, now, host, level, mode,
}) {
  const doc = baseRoomDoc({ game, code, players, bots, now });
  const h = safeHost(host);
  if (h) doc.host = h;
  const lv = Math.floor(Number(level));
  if (Number.isFinite(lv) && lv >= 1 && lv <= 999) doc.level = lv;
  if (ROOM_MODES.includes(mode)) doc.mode = mode;
  return doc;
}






export function safeHost(v) {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (!s || s.length > 16) return '';
  
  if (/[<>\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200a\u2028\u2029\u202a-\u202f\u205f\u2066-\u2069\u3000\ufeff]/.test(s)) return '';
  if (s.includes('  ')) return '';
  return s;
}










export function honestCounts({
  players = 0, bots = 0, ids = null, me = null, meIsFleet = false, cardOf = () => null,
} = {}) {
  let people = Math.max(0, Number(players) || 0);
  let fleet = 0;
  if (Array.isArray(ids)) {
    const seen = new Set(ids.filter((x) => typeof x === 'string' && x));
    if (me) seen.add(me);
    people = 0;
    for (const id of seen) {
      const isBot = id === me ? meIsFleet : cardOf(id)?.human === false;
      if (isBot) fleet += 1; else people += 1;
    }
  } else if (meIsFleet && people > 0) {
    people -= 1;
    fleet = 1;
  }
  return { players: people, bots: Math.max(0, Number(bots) || 0) + fleet };
}

function baseRoomDoc({ game, code, players, bots = 0, now }) {
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
