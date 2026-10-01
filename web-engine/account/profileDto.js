
































































import { GAME_IDS, isGameId } from './dailyChallenge.js';
import { normaliseProfile, normaliseName, LIMITS } from './profile.js';
import { MS_PER_DAY, dayNumberToMs, msToDayNumber } from './dayKey.js';


export const CLOUD_FIELDS = Object.freeze([
  'name', 'xp', 'createdDayMs',
  'streakCurrent', 'streakBest', 'streakRest', 'streakDays', 'streakLastDayMs',
  'tourStamps', 'tourLastAwardDayMs',
  'plays', 'wins', 'lastDayMs',
]);





export const NEVER = 0;

const int = (v, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

const dayField = (day) => {
  const ms = dayNumberToMs(day);
  return ms === null ? NEVER : ms;
};

const dayValue = (ms) => {
  const d = msToDayNumber(ms);
  return d === null || d <= 0 ? null : d;
};

function gameMap(source, pick, max) {
  const out = {};
  for (const id of GAME_IDS) out[id] = int(pick(source?.[id]), max);
  return out;
}










export function toCloudDto(profile) {
  const p = normaliseProfile(profile);
  const totalPlays = GAME_IDS.reduce((n, id) => n + (p.games[id]?.plays ?? 0), 0);
  if (totalPlays <= 0) return null;
  return {
    name: normaliseName(p.name),
    xp: int(p.xp, LIMITS.maxXp),
    createdDayMs: dayField(p.createdDay),
    streakCurrent: int(p.streak.current, LIMITS.maxStreak),
    streakBest: int(p.streak.best, LIMITS.maxStreak),
    streakRest: int(p.streak.restDays, 2),
    streakDays: int(p.streak.daysPlayed, LIMITS.maxStreak * 10),
    streakLastDayMs: dayField(p.streak.lastDay),
    tourStamps: int(p.tour.stamps, LIMITS.maxTour),
    tourLastAwardDayMs: dayField(p.tour.lastAwardDay),
    plays: gameMap(p.games, (g) => g?.plays, LIMITS.maxCount),
    wins: gameMap(p.games, (g) => g?.wins, LIMITS.maxCount),
    lastDayMs: gameMap(p.games, (g) => dayField(g?.lastDay ?? null), Number.MAX_SAFE_INTEGER),
  };
}










export function fromCloudDto(doc) {
  if (!doc || typeof doc !== 'object') return null;
  const games = {};
  for (const id of GAME_IDS) {
    if (!isGameId(id)) continue;
    games[id] = {
      plays: int(doc.plays?.[id], LIMITS.maxCount),
      wins: int(doc.wins?.[id], LIMITS.maxCount),
      lastDay: dayValue(doc.lastDayMs?.[id]),
      totals: {},
    };
  }
  return normaliseProfile({
    version: 1,
    name: normaliseName(doc.name),
    xp: int(doc.xp, LIMITS.maxXp),
    createdDay: dayValue(doc.createdDayMs),
    streak: {
      current: int(doc.streakCurrent, LIMITS.maxStreak),
      best: int(doc.streakBest, LIMITS.maxStreak),
      restDays: int(doc.streakRest, 2),
      daysPlayed: int(doc.streakDays, LIMITS.maxStreak * 10),
      lastDay: dayValue(doc.streakLastDayMs),
    },
    games,
    daily: { day: null, progress: {}, done: [] },
    tour: {
      stamps: int(doc.tourStamps, LIMITS.maxTour),
      lastAwardDay: dayValue(doc.tourLastAwardDayMs),
    },
  });
}


export function extraFields(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj).filter((k) => !CLOUD_FIELDS.includes(k));
}










export function isSyncable(dto) {
  if (!dto || typeof dto !== 'object') return false;
  if (extraFields(dto).length) return false;
  for (const k of CLOUD_FIELDS) if (!(k in dto)) return false;
  if (typeof dto.name !== 'string' || dto.name.length > LIMITS.nameMaxLength) return false;
  if (/[<>]/.test(dto.name)) return false;
  const bounded = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  if (!bounded(dto.xp, LIMITS.maxXp)) return false;
  if (!bounded(dto.streakCurrent, LIMITS.maxStreak)) return false;
  if (!bounded(dto.streakBest, LIMITS.maxStreak)) return false;
  if (!bounded(dto.streakRest, 2)) return false;
  if (!bounded(dto.streakDays, LIMITS.maxStreak * 10)) return false;
  if (!bounded(dto.tourStamps, LIMITS.maxTour)) return false;
  if (dto.streakBest < dto.streakCurrent) return false;
  for (const k of ['createdDayMs', 'streakLastDayMs', 'tourLastAwardDayMs']) {
    if (!Number.isInteger(dto[k]) || dto[k] < 0 || dto[k] % MS_PER_DAY !== 0) return false;
  }
  
  
  
  
  if (dto.streakCurrent > 0) {
    if (dto.createdDayMs === NEVER || dto.streakLastDayMs === NEVER) return false;
    if ((dto.streakCurrent - 1) * MS_PER_DAY > dto.streakLastDayMs - dto.createdDayMs) return false;
  }
  for (const field of ['plays', 'wins', 'lastDayMs']) {
    const m = dto[field];
    if (!m || typeof m !== 'object') return false;
    const keys = Object.keys(m);
    if (keys.length !== GAME_IDS.length) return false;
    for (const id of GAME_IDS) {
      if (!Number.isInteger(m[id]) || m[id] < 0) return false;
      if (field === 'lastDayMs' && m[id] % MS_PER_DAY !== 0) return false;
      if (field !== 'lastDayMs' && m[id] > LIMITS.maxCount) return false;
    }
  }
  return true;
}
