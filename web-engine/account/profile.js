






















































import { localDayNumber, utcDayNumber, daysBetween } from './dayKey.js';
import { emptyStreak, normaliseStreak, recordDay, streakStatus, MAX_STREAK } from './streak.js';
import {
  GAME_IDS, isGameId, metricsFor, dailyChallenge, challengeProgress,
} from './dailyChallenge.js';





export const PROFILE_KEY = 'arbelo.account.v1';


export const LIMITS = Object.freeze({
  nameMaxLength: 16,
  maxXp: 10000000,
  maxCount: 1000000,
  maxStreak: MAX_STREAK,
  maxTour: 10000,
});


export const XP = Object.freeze({
  play: 10,          
  win: 15,           
  tour: 200,         
});




export const RANKS = Object.freeze([
  Object.freeze({ at: 0, name: 'Farmhand' }),
  Object.freeze({ at: 500, name: 'Drover' }),
  Object.freeze({ at: 1500, name: 'Stockhand' }),
  Object.freeze({ at: 4000, name: 'Ranch Boss' }),
  Object.freeze({ at: 10000, name: 'Barn Legend' }),
]);


export const TOUR_WINDOW_DAYS = 7;

export function emptyProfile() {
  return {
    version: 1,
    
    
    uid: null,
    
    
    linked: false,
    name: '',
    xp: 0,
    
    
    
    createdDay: null,
    streak: emptyStreak(),
    
    games: {},
    
    
    daily: { day: null, progress: {}, done: [] },
    
    tour: { stamps: 0, lastAwardDay: null },
  };
}

const clampInt = (v, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};






const UNSAFE_NAME = /[\u0000-\u001f\u007f<>\u202a-\u202e\u2066-\u2069]/g;

export function normaliseName(raw) {
  
  
  
  
  
  
  if (typeof raw !== 'string') return '';
  const s = raw.replace(UNSAFE_NAME, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, LIMITS.nameMaxLength);
}










export function normaliseProfile(raw) {
  const base = emptyProfile();
  if (!raw || typeof raw !== 'object') return base;
  const day = (v) => (Number.isInteger(v) && v >= 0 ? v : null);

  const games = {};
  for (const id of GAME_IDS) {
    const g = raw.games?.[id];
    if (!g || typeof g !== 'object') continue;
    const totals = {};
    for (const m of metricsFor(id)) totals[m] = clampInt(g.totals?.[m], LIMITS.maxCount);
    games[id] = {
      plays: clampInt(g.plays, LIMITS.maxCount),
      wins: clampInt(g.wins, LIMITS.maxCount),
      lastDay: day(g.lastDay),
      totals,
    };
  }

  const dailyDay = day(raw.daily?.day);
  const progress = {};
  if (dailyDay !== null && raw.daily?.progress && typeof raw.daily.progress === 'object') {
    for (const id of GAME_IDS) {
      const p = raw.daily.progress[id];
      if (!p || typeof p !== 'object') continue;
      const kept = {};
      for (const m of metricsFor(id)) kept[m] = clampInt(p[m], LIMITS.maxCount);
      progress[id] = kept;
    }
  }
  const done = Array.isArray(raw.daily?.done)
    ? [...new Set(raw.daily.done.filter(isGameId))] : [];

  const streak = normaliseStreak(raw.streak);
  return {
    version: 1,
    uid: typeof raw.uid === 'string' && raw.uid.length > 0 && raw.uid.length <= 128 ? raw.uid : null,
    linked: raw.linked === true,
    name: normaliseName(raw.name),
    xp: clampInt(raw.xp, LIMITS.maxXp),
    
    
    
    
    
    createdDay: day(raw.createdDay) ?? earliestDay(streak, games),
    streak,
    games,
    daily: { day: dailyDay, progress, done: dailyDay === null ? [] : done },
    tour: {
      stamps: clampInt(raw.tour?.stamps, LIMITS.maxTour),
      lastAwardDay: day(raw.tour?.lastAwardDay),
    },
  };
}

function earliestDay(streak, games) {
  const days = [streak?.lastDay, ...Object.values(games).map((g) => g.lastDay)]
    .filter((d) => Number.isInteger(d));
  return days.length ? Math.min(...days) : null;
}










export function rankFor(xp) {
  const v = clampInt(xp, LIMITS.maxXp);
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (v >= RANKS[i].at) index = i;
  const next = RANKS[index + 1] ?? null;
  return {
    index,
    name: RANKS[index].name,
    xp: v,
    nextName: next ? next.name : null,
    nextAt: next ? next.at : null,
    toNext: next ? next.at - v : 0,
    
    
    fraction: next ? (v - RANKS[index].at) / (next.at - RANKS[index].at) : 1,
  };
}


















export function tourStatus(profile, today) {
  const p = normaliseProfile(profile);
  const played = [];
  const missing = [];
  for (const id of GAME_IDS) {
    const last = p.games[id]?.lastDay;
    const gap = Number.isInteger(today) ? daysBetween(last, today) : null;
    if (gap !== null && gap >= 0 && gap < TOUR_WINDOW_DAYS) played.push(id);
    else missing.push(id);
  }
  const complete = missing.length === 0;
  
  
  
  const sinceAward = daysBetween(p.tour.lastAwardDay, today);
  const claimable = complete
    && (p.tour.lastAwardDay === null || (sinceAward !== null && sinceAward >= TOUR_WINDOW_DAYS));
  return { played, missing, complete, claimable, stamps: p.tour.stamps };
}




















export function recordPlay(profile, {
  gameId, nowMs = 0, tzOffsetMinutes, metrics = {}, won = false, name,
} = {}) {
  const before = normaliseProfile(profile);
  if (!isGameId(gameId)) return { profile: before, events: [], changed: false };

  const today = localDayNumber(nowMs, tzOffsetMinutes);
  const utcToday = utcDayNumber(nowMs);
  const events = [];
  const p = {
    ...before,
    games: { ...before.games },
    daily: { ...before.daily, progress: { ...before.daily.progress }, done: [...before.daily.done] },
    tour: { ...before.tour },
  };

  if (name !== undefined) {
    const n = normaliseName(name);
    if (n) p.name = n;
  }

  
  const allowed = metricsFor(gameId);
  const prev = before.games[gameId] ?? { plays: 0, wins: 0, lastDay: null, totals: {} };
  const totals = { ...prev.totals };
  for (const m of allowed) {
    const add = clampInt(metrics[m], LIMITS.maxCount);
    if (add) totals[m] = Math.min(LIMITS.maxCount, (totals[m] ?? 0) + add);
  }
  p.games[gameId] = {
    plays: Math.min(LIMITS.maxCount, prev.plays + 1),
    wins: Math.min(LIMITS.maxCount, prev.wins + (won ? 1 : 0)),
    
    
    lastDay: today ?? prev.lastDay,
    totals,
  };
  let xp = XP.play + (won ? XP.win : 0);

  
  if (today !== null) {
    if (p.createdDay === null) p.createdDay = today;
    
    
    
    
    if (p.createdDay > today) p.createdDay = today;
    const r = recordDay(before.streak, today);
    p.streak = normaliseStreak(r.streak);
    if (r.event !== 'ignored' && r.event !== 'same-day') {
      events.push({ type: 'streak', event: r.event, current: p.streak.current, restSpent: r.restSpent });
    }
  }

  
  if (utcToday !== null) {
    
    
    
    
    
    if (p.daily.day !== utcToday) {
      p.daily = { day: utcToday, progress: {}, done: [] };
    }
    const dayProgress = { ...(p.daily.progress[gameId] ?? {}) };
    for (const m of allowed) {
      const add = clampInt(metrics[m], LIMITS.maxCount);
      if (add) dayProgress[m] = Math.min(LIMITS.maxCount, (dayProgress[m] ?? 0) + add);
    }
    p.daily.progress = { ...p.daily.progress, [gameId]: dayProgress };

    const challenge = dailyChallenge(utcToday, gameId);
    if (challenge && !p.daily.done.includes(gameId)) {
      const prog = challengeProgress(challenge, dayProgress);
      if (prog.done) {
        p.daily.done = [...p.daily.done, gameId];
        xp += challenge.xp;
        events.push({ type: 'challenge', gameId, xp: challenge.xp, featured: challenge.featured, text: challenge.text });
      }
    }
  }

  
  if (today !== null) {
    const tour = tourStatus(p, today);
    if (tour.claimable) {
      p.tour = { stamps: Math.min(LIMITS.maxTour, p.tour.stamps + 1), lastAwardDay: today };
      xp += XP.tour;
      events.push({ type: 'tour', xp: XP.tour, stamps: p.tour.stamps });
    }
  }

  
  const rankBefore = rankFor(before.xp);
  p.xp = Math.min(LIMITS.maxXp, before.xp + xp);
  const rankAfter = rankFor(p.xp);
  events.push({ type: 'xp', gained: p.xp - before.xp, total: p.xp });
  if (rankAfter.index > rankBefore.index) {
    events.push({ type: 'rank', name: rankAfter.name, index: rankAfter.index });
  }

  return { profile: p, events, changed: true };
}







export function profileSummary(profile, nowMs = 0, tzOffsetMinutes) {
  const p = normaliseProfile(profile);
  const today = localDayNumber(nowMs, tzOffsetMinutes);
  const utcToday = utcDayNumber(nowMs);
  return {
    name: p.name,
    linked: p.linked,
    rank: rankFor(p.xp),
    streak: streakStatus(p.streak, today),
    tour: tourStatus(p, today),
    utcDay: utcToday,
    games: GAME_IDS.map((id) => {
      const g = p.games[id] ?? { plays: 0, wins: 0, lastDay: null, totals: {} };
      const challenge = utcToday === null ? null : dailyChallenge(utcToday, id);
      const dayProgress = p.daily.day === utcToday ? (p.daily.progress[id] ?? {}) : {};
      return {
        id,
        plays: g.plays,
        wins: g.wins,
        challenge,
        progress: challengeProgress(challenge, dayProgress),
        done: p.daily.day === utcToday && p.daily.done.includes(id),
      };
    }),
  };
}





























export function reconcileProfiles(local, cloud) {
  const l = normaliseProfile(local);
  const c = normaliseProfile(cloud);
  const max = (m, n) => Math.max(m ?? 0, n ?? 0);
  const laterDay = (m, n) => {
    if (!Number.isInteger(m)) return Number.isInteger(n) ? n : null;
    if (!Number.isInteger(n)) return m;
    return Math.max(m, n);
  };
  const earlierDay = (m, n) => {
    if (!Number.isInteger(m)) return Number.isInteger(n) ? n : null;
    if (!Number.isInteger(n)) return m;
    return Math.min(m, n);
  };

  const games = {};
  for (const id of GAME_IDS) {
    const g = l.games[id];
    const h = c.games[id];
    if (!g && !h) continue;
    const totals = {};
    
    
    
    for (const m of metricsFor(id)) totals[m] = max(g?.totals?.[m], 0);
    games[id] = {
      plays: max(g?.plays, h?.plays),
      wins: max(g?.wins, h?.wins),
      lastDay: laterDay(g?.lastDay ?? null, h?.lastDay ?? null),
      totals,
    };
  }

  return normaliseProfile({
    version: 1,
    uid: l.uid ?? c.uid,
    linked: l.linked || c.linked,
    
    
    name: l.name || c.name,
    xp: max(l.xp, c.xp),
    createdDay: earlierDay(l.createdDay, c.createdDay),
    streak: {
      current: max(l.streak.current, c.streak.current),
      best: max(l.streak.best, c.streak.best),
      lastDay: laterDay(l.streak.lastDay, c.streak.lastDay),
      restDays: max(l.streak.restDays, c.streak.restDays),
      daysPlayed: max(l.streak.daysPlayed, c.streak.daysPlayed),
    },
    games,
    daily: l.daily,
    tour: {
      stamps: max(l.tour.stamps, c.tour.stamps),
      lastAwardDay: laterDay(l.tour.lastAwardDay, c.tour.lastAwardDay),
    },
  });
}





































export function mergeProfiles(a, b) {
  const x = normaliseProfile(a);
  const y = normaliseProfile(b);
  const sum = (m, n, max) => Math.min(max, (m ?? 0) + (n ?? 0));
  const laterDay = (m, n) => {
    if (!Number.isInteger(m)) return Number.isInteger(n) ? n : null;
    if (!Number.isInteger(n)) return m;
    return Math.max(m, n);
  };
  const earlierDay = (m, n) => {
    if (!Number.isInteger(m)) return Number.isInteger(n) ? n : null;
    if (!Number.isInteger(n)) return m;
    return Math.min(m, n);
  };

  const games = {};
  for (const id of GAME_IDS) {
    const g = x.games[id];
    const h = y.games[id];
    if (!g && !h) continue;
    const totals = {};
    for (const m of metricsFor(id)) {
      totals[m] = sum(g?.totals?.[m], h?.totals?.[m], LIMITS.maxCount);
    }
    games[id] = {
      plays: sum(g?.plays, h?.plays, LIMITS.maxCount),
      wins: sum(g?.wins, h?.wins, LIMITS.maxCount),
      lastDay: laterDay(g?.lastDay ?? null, h?.lastDay ?? null),
      totals,
    };
  }

  const newer = (x.daily.day ?? -1) >= (y.daily.day ?? -1) ? x.daily : y.daily;

  return normaliseProfile({
    version: 1,
    uid: x.uid ?? y.uid,
    linked: x.linked || y.linked,
    name: x.name || y.name,
    xp: sum(x.xp, y.xp, LIMITS.maxXp),
    createdDay: earlierDay(x.createdDay, y.createdDay),
    streak: {
      current: Math.max(x.streak.current, y.streak.current),
      best: Math.max(x.streak.best, y.streak.best),
      lastDay: laterDay(x.streak.lastDay, y.streak.lastDay),
      restDays: Math.max(x.streak.restDays, y.streak.restDays),
      daysPlayed: sum(x.streak.daysPlayed, y.streak.daysPlayed, LIMITS.maxStreak * 10),
    },
    games,
    daily: { day: newer.day, progress: newer.progress, done: newer.done },
    tour: {
      stamps: sum(x.tour.stamps, y.tour.stamps, LIMITS.maxTour),
      lastAwardDay: laterDay(x.tour.lastAwardDay, y.tour.lastAwardDay),
    },
  });
}











export function memoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

export function safeStore(candidate) {
  try {
    if (!candidate) return memoryStore();
    const probe = `${PROFILE_KEY}.probe`;
    candidate.setItem(probe, '1');
    candidate.removeItem(probe);
    return candidate;
  } catch {
    return memoryStore();
  }
}

export function loadProfile(storage) {
  const s = safeStore(storage);
  try {
    const raw = s.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    return normaliseProfile(JSON.parse(raw));
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(storage, profile) {
  const s = safeStore(storage);
  try {
    s.setItem(PROFILE_KEY, JSON.stringify(normaliseProfile(profile)));
    return true;
  } catch {
    return false;
  }
}







export function clearProfile(storage) {
  const s = safeStore(storage);
  try { s.removeItem(PROFILE_KEY); return true; } catch { return false; }
}
