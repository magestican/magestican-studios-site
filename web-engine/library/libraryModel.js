














import { isLibraryId } from './libraryIds.js';

export const LIBRARY_KEY = 'magestican.library.v1';
export const MAX_GAMES = 64;


export const MAX_FLUSH_MS = 6 * 60 * 60 * 1000;

const MAX_COUNT = 1e9;
const int = (v, max = MAX_COUNT) => (typeof v === 'number' && Number.isFinite(v)
  ? Math.min(max, Math.max(0, Math.floor(v))) : 0);

const day = (v) => (Number.isInteger(v) && v > 0 && v < 1e6 ? v : 0);

export function emptyLibrary() { return { v: 1, seq: 0, games: {} }; }

function emptyEntry() {
  return { lastDay: 0, seq: 0, opens: 0, matches: 0, msPlayed: 0, wins: 0, fav: false, favDay: 0, favSeq: 0 };
}

function normaliseEntry(e) {
  const o = e && typeof e === 'object' ? e : {};
  return {
    lastDay: day(o.lastDay), seq: int(o.seq), opens: int(o.opens), matches: int(o.matches),
    msPlayed: int(o.msPlayed, Number.MAX_SAFE_INTEGER), wins: int(o.wins),
    fav: o.fav === true, favDay: day(o.favDay), favSeq: int(o.favSeq),
  };
}

export function normaliseLibrary(raw) {
  const out = emptyLibrary();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== 1) return out;
  out.seq = int(raw.seq);
  const games = raw.games && typeof raw.games === 'object' ? raw.games : {};
  for (const id of Object.keys(games)) {
    if (!isLibraryId(id) || Object.keys(out.games).length >= MAX_GAMES) continue;
    const e = normaliseEntry(games[id]);
    out.games[id] = e;
    out.seq = Math.max(out.seq, e.seq, e.favSeq);
  }
  return out;
}

function withEntry(lib, id, fn) {
  const l = normaliseLibrary(lib);
  if (!isLibraryId(id)) return l;
  const e = { ...(l.games[id] ?? emptyEntry()) };
  fn(e, l);
  l.games[id] = normaliseEntry(e);
  l.seq = Math.max(l.seq, l.games[id].seq, l.games[id].favSeq);
  return l;
}

function touch(e, l, d) {
  l.seq += 1;
  e.seq = l.seq;
  if (day(d)) e.lastDay = d;
}

export function recordOpen(lib, id, d) {
  return withEntry(lib, id, (e, l) => { e.opens += 1; touch(e, l, d); });
}

export function recordMatch(lib, id, { day: d, won = false } = {}) {
  return withEntry(lib, id, (e, l) => { e.matches += 1; if (won === true) e.wins += 1; touch(e, l, d); });
}

export function recordTime(lib, id, ms) {
  const add = int(ms, MAX_FLUSH_MS);
  return withEntry(lib, id, (e) => { e.msPlayed += add; });
}

export function setFav(lib, id, fav, d) {
  
  
  
  return withEntry(lib, id, (e, l) => { e.fav = fav === true; e.favDay = day(d); l.seq += 1; e.favSeq = l.seq; });
}

const laterOf = (a, b) => (a.lastDay !== b.lastDay ? (a.lastDay > b.lastDay ? a : b) : (a.seq >= b.seq ? a : b));

function mergeEntry(a, b) {
  const r = laterOf(a, b);
  let fav;
  let favDay;
  let favSeq;
  if (a.favDay !== b.favDay || a.favSeq !== b.favSeq) {
    const w = a.favDay !== b.favDay ? (a.favDay > b.favDay ? a : b) : (a.favSeq > b.favSeq ? a : b);
    ({ fav, favDay, favSeq } = w);
  } else {
    
    
    fav = a.fav || b.fav;
    favDay = a.favDay;
    favSeq = a.favSeq;
  }
  return {
    lastDay: r.lastDay, seq: r.seq,
    opens: Math.max(a.opens, b.opens), matches: Math.max(a.matches, b.matches),
    msPlayed: Math.max(a.msPlayed, b.msPlayed), wins: Math.max(a.wins, b.wins),
    fav, favDay, favSeq,
  };
}

function clampFuture(l, today) {
  if (!day(today)) return l;
  for (const e of Object.values(l.games)) {
    if (e.lastDay > today) e.lastDay = today;
    if (e.favDay > today) e.favDay = today;
  }
  return l;
}





export function mergeLibraries(a, b, { today } = {}) {
  const x = clampFuture(normaliseLibrary(a), today);
  const y = clampFuture(normaliseLibrary(b), today);
  const out = { v: 1, seq: Math.max(x.seq, y.seq), games: {} };
  const ids = [...new Set([...Object.keys(x.games), ...Object.keys(y.games)])].sort();
  for (const id of ids.slice(0, MAX_GAMES)) {
    const p = x.games[id];
    const q = y.games[id];
    out.games[id] = p && q ? mergeEntry(p, q) : { ...(p ?? q) };
  }
  return out;
}


export function seedFromProfile(lib, profile) {
  const games = profile && typeof profile === 'object' && profile.games && typeof profile.games === 'object'
    ? profile.games : {};
  const seeded = emptyLibrary();
  for (const [id, g] of Object.entries(games)) {
    if (!isLibraryId(id) || !g || typeof g !== 'object') continue;
    seeded.games[id] = { ...emptyEntry(), matches: int(g.plays), wins: int(g.wins), lastDay: day(g.lastDay) };
  }
  return mergeLibraries(lib, seeded);
}

const entries = (lib) => Object.entries(normaliseLibrary(lib).games);

export function recent(lib, n = 10) {
  return entries(lib).filter(([, e]) => e.lastDay > 0)
    .sort(([, x], [, y]) => (y.lastDay - x.lastDay) || (y.seq - x.seq))
    .slice(0, n).map(([id]) => id);
}

export function continueId(lib) { return recent(lib, 1)[0] ?? null; }

export function favourites(lib) {
  return entries(lib).filter(([, e]) => e.fav)
    .sort(([, x], [, y]) => (y.favDay - x.favDay) || (y.seq - x.seq)).map(([id]) => id);
}

export function mostPlayed(lib, n = 10) {
  return entries(lib).filter(([, e]) => e.msPlayed > 0 || e.matches > 0)
    .sort(([a, x], [b, y]) => (y.msPlayed - x.msPlayed) || (y.matches - x.matches) || (a < b ? -1 : 1))
    .slice(0, n).map(([id]) => id);
}

export function notTried(lib, ids) {
  const g = normaliseLibrary(lib).games;
  return (Array.isArray(ids) ? ids : []).filter((id) => !(g[id] && (g[id].opens > 0 || g[id].matches > 0)));
}

export function daysAgo(lib, id, today) {
  const e = normaliseLibrary(lib).games[id];
  if (!e || !e.lastDay || !Number.isInteger(today)) return null;
  return Math.max(0, today - e.lastDay);
}
