

















































import { SEASON_TIERS, seasonStatus } from '../account/season.js';
import { seasonStartDay, dayNumberToKey } from '../account/dayKey.js';

export const TROPHY_LEVELS = Object.freeze([5, 10, 20, 35, 50]);
export const TROPHY_ELO = Object.freeze([1400, 1600, 1800]);


export const TROPHY_ARTS = Object.freeze(['cup', 'globe', 'laurel', 'pennant']);

const num = (v) => {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) && x > 0 ? x : 0;
};
const list = (v) => (Array.isArray(v) ? v : []);
const statsOf = (s) => (s && typeof s === 'object' ? s : {});
const ratio = (have, need) => (need > 0 ? Math.max(0, Math.min(1, have / need)) : 0);

function appGamesPlayed(stats, appGameIds) {
  const played = new Set(list(statsOf(stats).playedGames));
  return list(appGameIds).filter((id) => played.has(id)).length;
}

const T = (o) => Object.freeze(o);

export const TROPHIES = Object.freeze([
  ...TROPHY_LEVELS.map((lv) => T({
    id: `level-${lv}`, name: `Level ${lv}`, art: 'cup',
    blurb: `Reach level ${lv}.`,
    test: (s) => num(statsOf(s).level) >= lv,
    progress: (s) => ratio(num(statsOf(s).level), lv),
  })),
  T({
    id: 'grand-tour', name: 'Grand Tour', art: 'globe',
    blurb: 'Play every game in the app at least once.',
    
    test: (s, ctx) => {
      const ids = list(ctx?.appGameIds);
      return ids.length > 0 && appGamesPlayed(s, ids) === ids.length;
    },
    progress: (s, ctx) => ratio(appGamesPlayed(s, ctx?.appGameIds), list(ctx?.appGameIds).length),
  }),
  T({
    id: 'first-rated-win', name: 'First Rated Win', art: 'laurel',
    blurb: 'Win a rated match against another player.',
    test: (s) => num(statsOf(s).onlineWins) >= 1,
    progress: (s) => ratio(num(statsOf(s).onlineWins), 1),
  }),
  ...TROPHY_ELO.map((e) => T({
    id: `elo-${e}`, name: `Rated ${e}`, art: 'laurel',
    blurb: `Reach a rating of ${e} in any game.`,
    test: (s) => num(statsOf(s).eloPeak) >= e,
    
    
    progress: (s) => ratio(Math.max(0, num(statsOf(s).eloPeak) - 1200), e - 1200),
  })),
]);

export const TROPHY_IDS = Object.freeze(TROPHIES.map((t) => t.id));





export function seasonTrophy(id) {
  const start = seasonStartDay(id);
  const status = start === null ? null : seasonStatus(null, start);
  const name = status?.name ?? 'Season';
  const from = start === null ? null : dayNumberToKey(start);
  const topped = (s) => {
    const st = statsOf(s);
    if (list(st.seasonsTopped).includes(id)) return true;
    return st.seasonId === id && num(st.seasonTier) >= SEASON_TIERS;
  };
  return T({
    id: `season-${id}`,
    name: `Top of ${name}`,
    art: 'pennant',
    blurb: from
      ? `Fill the whole ${name} season track (the season starting ${from}).`
      : `Fill the whole track of season ${id}.`,
    test: topped,
    progress: (s) => {
      if (topped(s)) return 1;
      const st = statsOf(s);
      return st.seasonId === id ? ratio(num(st.seasonTier), SEASON_TIERS) : 0;
    },
  });
}


export function seasonIdsFor(stats) {
  const s = statsOf(stats);
  const ids = list(s.seasonsTopped).filter((v) => Number.isInteger(v) && v >= 0);
  if (Number.isInteger(s.seasonId) && s.seasonId >= 0) ids.push(s.seasonId);
  return [...new Set(ids)].sort((a, b) => a - b);
}












export function trophyRows(stats, options) {
  
  
  const { appGameIds = [], seasons, seen = {} } = options && typeof options === 'object' ? options : {};
  const ctx = { appGameIds: list(appGameIds) };
  const seasonIds = Array.isArray(seasons)
    ? seasons.filter((v) => Number.isInteger(v) && v >= 0)
    : seasonIdsFor(stats);
  const all = [...TROPHIES, ...seasonIds.map(seasonTrophy)];
  const seenMap = seen && typeof seen === 'object' ? seen : {};
  
  
  
  
  
  
  
  
  
  
  
  const trophyAt = statsOf(stats).trophyAt;
  const stickyAt = trophyAt && typeof trophyAt === 'object' ? trophyAt : {};
  return all.map((t) => {
    let unlocked = false;
    let progress = 0;
    try {
      unlocked = (t.id in stickyAt) || t.test(stats, ctx) === true;
      progress = unlocked ? 1 : t.progress(stats, ctx);
    } catch {
      unlocked = false; progress = 0;
    }
    const when = seenMap[t.id];
    return {
      id: t.id,
      unlocked,
      at: unlocked && Number.isFinite(when) ? when : null,
      progress: Number.isFinite(progress) ? progress : 0,
    };
  });
}
