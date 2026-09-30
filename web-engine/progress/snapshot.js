






























import { normaliseProfile } from '../account/profile.js';
import { ACHIEVEMENTS, statsFor, evaluate } from '../account/achievements.js';
import { levelFromXp } from '../account/playerLevel.js';
import { localDayNumber, MS_PER_DAY } from '../account/dayKey.js';
import { trophyRows, TROPHIES, seasonTrophy } from './trophies.js';
import { masteryOf } from './mastery.js';
import { titleFor } from './ranks.js';
import { PROFILE_GAME_IDS } from './gameIds.js';

export const SNAPSHOT_KEY = 'magestican.progress.snapshot.v1';
export const SNAPSHOT_VERSION = 1;
export const RECENT_BADGES = 5;

const TROPHY_NAME = Object.freeze(Object.fromEntries(TROPHIES.map((t) => [t.id, t.name])));


export function trophyName(id) {
  if (TROPHY_NAME[id]) return TROPHY_NAME[id];
  const m = /^season-(\d+)$/.exec(String(id));
  if (m) {
    try { return seasonTrophy(Number(m[1])).name; } catch {  }
  }
  return String(id);
}

const dayMs = (day) => (Number.isInteger(day) && day >= 0 ? day * MS_PER_DAY : null);







export function snapshotOf(profile, nowMs, opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const p = normaliseProfile(profile);
  const lv = levelFromXp(p.xp);
  const seen = o.seen && typeof o.seen === 'object' ? o.seen : {};
  let stats = {};
  let rows = [];
  try {
    stats = statsFor(p, { today: localDayNumber(nowMs, o.tzOffsetMinutes), kartRecords: o.kartRecords ?? null });
    rows = evaluate(stats, { seen });
  } catch {  }

  const earned = rows.filter((r) => r.unlocked);
  const recent = earned
    .map((r) => ({
      id: r.id,
      name: r.name,
      tier: r.tier,
      at: p.feats.badgeAt[r.id] ?? dayMs(seen[r.id]) ?? null,
    }))
    
    .map((r, i) => ({ r, i }))
    .sort((a, b) => ((b.r.at ?? -1) - (a.r.at ?? -1)) || (a.i - b.i))
    .slice(0, RECENT_BADGES)
    .map(({ r }) => r);

  let trophies = [];
  try {
    const appGameIds = Array.isArray(o.appGameIds) ? o.appGameIds : PROFILE_GAME_IDS;
    trophies = trophyRows(stats, { appGameIds, seen: p.feats.trophyAt })
      .filter((t) => t.unlocked)
      .map((t) => ({ id: t.id, name: trophyName(t.id), at: t.at ?? null }));
  } catch {  }

  const games = {};
  for (const id of Object.keys(p.games).sort()) {
    const g = p.games[id];
    const rating = p.ratings[id];
    games[id] = {
      plays: g.plays,
      wins: g.wins,
      seconds: g.seconds ?? 0,
      mastery: masteryOf({ plays: g.plays, wins: g.wins }).tier,
      lastAt: p.feats.playedAt[id] ?? dayMs(g.lastDay) ?? null,
      rating: rating ? { r: rating.r, n: rating.n, peak: rating.peak } : null,
    };
  }

  return {
    v: SNAPSHOT_VERSION,
    at: Number.isFinite(nowMs) ? nowMs : 0,
    name: p.name,
    level: lv.level,
    title: titleFor(lv.level),
    xp: lv.xp,
    xpIntoLevel: lv.xpIntoLevel,
    xpForNext: lv.xpForNext,
    streak: { current: p.streak.current, best: p.streak.best },
    badges: { earned: earned.length, total: ACHIEVEMENTS.length, recent },
    trophies,
    games,
    signedIn: p.linked === true,
  };
}
