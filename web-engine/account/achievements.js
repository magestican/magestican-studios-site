




















































































import { GAME_IDS, GAME_NAMES } from './dailyChallenge.js';
import { RANKS, rankFor, normaliseProfile } from './profile.js';
import { daysBetween } from './dayKey.js';





export const PROOF = Object.freeze({
  DEVICE: 'device',
  RECORDED: 'recorded',
  VERIFIED: 'verified',
});


export const PROOF_LABEL = Object.freeze({
  device: 'On this device',
  recorded: 'Recorded in your account',
  verified: 'Verified',
});

export const PROOF_BLURB = Object.freeze({
  device: 'This badge lives in this browser only. Clear your site data and it is gone.',
  recorded: 'Kept in your account. Our server checks the shape of this number and refuses to let it go backwards, but it cannot prove you played for it.',
  verified: 'Our server measured the time this took against its own clock. It could not have been earned in one sitting.',
});















































export const VERIFIED_IF_RULES = Object.freeze({
  
  streakBest: '(d.streakBest - 1) * 86400000 <= d.streakLastDayMs - d.createdDayMs',
  
  streakDays: '(d.streakDays - 1) * 86400000 <= d.streakLastDayMs - d.createdDayMs',
  
  tourStamps: '(d.tourStamps - 1) * 604800000 <= d.tourLastAwardDayMs - d.createdDayMs',
});
































export const TIERS = Object.freeze(['common', 'uncommon', 'rare', 'legendary']);

export const TIER_LABEL = Object.freeze({
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
});


export const TIER_COLOUR = Object.freeze({
  common: '#9aa4b5',      
  uncommon: '#5fd08a',    
  rare: '#59a6ff',        
  legendary: '#ffb03a',   
});


export const RARITY_DISCLAIMER =
  'How hard we think this is. We do not publish how many players have it - that needs data we do not collect.';















export const STATS = Object.freeze([
  'accountAgeDays',   
  'totalPlays', 'gamesTried', 'xp', 'rankIndex',
  'streakBest', 'daysPlayed', 'tourStamps',
  'tbPlays', 'tbWins', 'tbKills',
  'fkPlays', 'fkWins', 'fkPodiums', 'fkPoints',
  'fkTracksRaced', 'fkTracksPodiumed',
  'fkLapSunflowerMs', 'fkLapMuddybottomMs', 'fkLapFrostfieldMs',
  'fxPlays',
  'zkPlays',
]);











export const STAT_FIELD = Object.freeze({
  accountAgeDays: 'createdDayMs',
  totalPlays: 'plays',
  gamesTried: 'plays',
  xp: 'xp',
  rankIndex: 'xp',
  streakBest: 'streakBest',
  daysPlayed: 'streakDays',
  tourStamps: 'tourStamps',
  tbPlays: 'plays',
  tbWins: 'wins',
  tbKills: 'tbKills',
  fkPlays: 'plays',
  fkWins: 'wins',
  fkPodiums: 'fkPodiums',
  fkPoints: 'fkPoints',
  fkTracksRaced: 'fkBestLapMs',
  fkTracksPodiumed: 'fkBestPosition',
  fkLapSunflowerMs: 'fkBestLapMs',
  fkLapMuddybottomMs: 'fkBestLapMs',
  fkLapFrostfieldMs: 'fkBestLapMs',
  fxPlays: 'plays',
  zkPlays: 'plays',
});



















export const PAR_LAP_MS = Object.freeze({
  sunflower: 27500,
  muddybottom: 25000,
  frostfield: 25000,
});














const A = (o) => Object.freeze(o);

export const ACHIEVEMENTS = Object.freeze([
  
  A({
    id: 'first-steps', name: 'Boots On', game: 'all', tier: 'common', glyph: '⚑',
    desc: 'Finish anything at all.', stat: 'totalPlays', atLeast: 1,
  }),
  A({
    id: 'tried-two', name: 'Second Helping', game: 'all', tier: 'common', glyph: '⚔',
    desc: 'Play two of the four games.', stat: 'gamesTried', atLeast: 2,
  }),
  A({
    id: 'tried-all', name: 'Whole Farm', game: 'all', tier: 'uncommon', glyph: '✲',
    desc: 'Play all four games.', stat: 'gamesTried', atLeast: 4,
  }),
  A({
    id: 'rank-drover', name: 'Drover', game: 'all', tier: 'common', glyph: '★',
    desc: `Reach the rank of ${RANKS[1].name}.`, stat: 'rankIndex', atLeast: 1,
  }),
  A({
    id: 'rank-stockhand', name: 'Stockhand', game: 'all', tier: 'uncommon', glyph: '★',
    desc: `Reach the rank of ${RANKS[2].name}.`, stat: 'rankIndex', atLeast: 2,
  }),
  A({
    id: 'rank-boss', name: 'Ranch Boss', game: 'all', tier: 'rare', glyph: '★',
    desc: `Reach the rank of ${RANKS[3].name}.`, stat: 'rankIndex', atLeast: 3,
  }),
  A({
    id: 'rank-legend', name: 'Barn Legend', game: 'all', tier: 'legendary', glyph: '★',
    desc: `Reach the rank of ${RANKS[4].name}.`, stat: 'rankIndex', atLeast: 4,
  }),

  
  
  A({
    id: 'streak-3', name: 'Three in a Row', game: 'all', tier: 'common', glyph: '◆',
    desc: 'Play on three days in a row.', stat: 'streakBest', atLeast: 3,
    needsRule: 'streakBest',
  }),
  A({
    id: 'streak-7', name: 'Week Straight', game: 'all', tier: 'uncommon', glyph: '◆',
    desc: 'Play on seven days in a row.', stat: 'streakBest', atLeast: 7,
    needsRule: 'streakBest',
  }),
  A({
    id: 'streak-30', name: 'Month of Mornings', game: 'all', tier: 'rare', glyph: '◆',
    desc: 'Play on thirty days in a row.', stat: 'streakBest', atLeast: 30,
    needsRule: 'streakBest',
  }),
  A({
    id: 'streak-100', name: 'Hundred Days', game: 'all', tier: 'legendary', glyph: '◆',
    desc: 'Play on a hundred days in a row.', stat: 'streakBest', atLeast: 100,
    needsRule: 'streakBest',
  }),
  A({
    id: 'days-10', name: 'Regular', game: 'all', tier: 'common', glyph: '●',
    desc: 'Play on ten different days.', stat: 'daysPlayed', atLeast: 10,
    needsRule: 'streakDays',
  }),
  A({
    id: 'days-50', name: 'Fixture', game: 'all', tier: 'uncommon', glyph: '●',
    desc: 'Play on fifty different days.', stat: 'daysPlayed', atLeast: 50,
    needsRule: 'streakDays',
  }),
  A({
    id: 'days-250', name: 'Part of the Furniture', game: 'all', tier: 'legendary', glyph: '●',
    desc: 'Play on two hundred and fifty different days.', stat: 'daysPlayed', atLeast: 250,
    needsRule: 'streakDays',
  }),
  A({
    id: 'tour-1', name: 'Barn Tour', game: 'all', tier: 'uncommon', glyph: '⌘',
    desc: 'Play all four games inside one week.', stat: 'tourStamps', atLeast: 1,
    needsRule: 'tourStamps',
  }),
  A({
    id: 'tour-5', name: 'Season Ticket', game: 'all', tier: 'rare', glyph: '⌘',
    desc: 'Earn five Barn Tour stamps.', stat: 'tourStamps', atLeast: 5,
    needsRule: 'tourStamps',
  }),
  A({
    id: 'tour-25', name: 'Tour Operator', game: 'all', tier: 'legendary', glyph: '⌘',
    desc: 'Earn twenty-five Barn Tour stamps.', stat: 'tourStamps', atLeast: 25,
    needsRule: 'tourStamps',
  }),

  
  
  
  
  
  A({
    id: 'age-7', name: 'One Week In', game: 'all', tier: 'common', glyph: '⌛',
    desc: 'Have an account that is seven days old.', stat: 'accountAgeDays', atLeast: 7,
    verified: true,
  }),
  A({
    id: 'age-100', name: 'Hundred Days Old', game: 'all', tier: 'uncommon', glyph: '⌛',
    desc: 'Have an account that is a hundred days old.', stat: 'accountAgeDays', atLeast: 100,
    verified: true,
  }),
  A({
    id: 'age-365', name: 'Anniversary', game: 'all', tier: 'rare', glyph: '⌛',
    desc: 'Have an account that is a year old.', stat: 'accountAgeDays', atLeast: 365,
    verified: true,
  }),

  
  A({
    id: 'tb-first', name: 'Muster', game: 'team-bonding', tier: 'common', glyph: '▲',
    desc: 'Finish a match of Team Bonding.', stat: 'tbPlays', atLeast: 1,
  }),
  A({
    id: 'tb-25', name: 'Old Hand', game: 'team-bonding', tier: 'uncommon', glyph: '▲',
    desc: 'Finish twenty-five matches.', stat: 'tbPlays', atLeast: 25,
  }),
  A({
    id: 'tb-150', name: 'Barn Veteran', game: 'team-bonding', tier: 'legendary', glyph: '▲',
    desc: 'Finish a hundred and fifty matches.', stat: 'tbPlays', atLeast: 150,
  }),
  A({
    id: 'tb-win-1', name: 'On the Board', game: 'team-bonding', tier: 'common', glyph: '⚑',
    desc: 'Win a match.', stat: 'tbWins', atLeast: 1,
  }),
  A({
    id: 'tb-win-25', name: 'Winning Side', game: 'team-bonding', tier: 'rare', glyph: '⚑',
    desc: 'Win twenty-five matches.', stat: 'tbWins', atLeast: 25,
  }),
  A({
    id: 'tb-kills-100', name: 'Hundred Club', game: 'team-bonding', tier: 'uncommon', glyph: '✦',
    desc: 'Land a hundred kills.', stat: 'tbKills', atLeast: 100,
  }),
  A({
    id: 'tb-kills-1000', name: 'Livestock Legend', game: 'team-bonding', tier: 'legendary', glyph: '✦',
    desc: 'Land a thousand kills.', stat: 'tbKills', atLeast: 1000, hidden: true,
  }),

  
  A({
    id: 'fk-first', name: 'Green Flag', game: 'farmykart', tier: 'common', glyph: '○',
    desc: 'Finish a race.', stat: 'fkPlays', atLeast: 1,
  }),
  A({
    id: 'fk-50', name: 'Full Season', game: 'farmykart', tier: 'uncommon', glyph: '○',
    desc: 'Finish fifty races.', stat: 'fkPlays', atLeast: 50,
  }),
  A({
    id: 'fk-win-1', name: 'Chequered Flag', game: 'farmykart', tier: 'common', glyph: '⚑',
    desc: 'Win a race.', stat: 'fkWins', atLeast: 1,
  }),
  A({
    id: 'fk-win-20', name: 'Serial Winner', game: 'farmykart', tier: 'rare', glyph: '⚑',
    desc: 'Win twenty races.', stat: 'fkWins', atLeast: 20,
  }),
  A({
    id: 'fk-podium-25', name: 'Podium Regular', game: 'farmykart', tier: 'uncommon', glyph: '⎔',
    desc: 'Finish on the podium twenty-five times.', stat: 'fkPodiums', atLeast: 25,
  }),
  A({
    id: 'fk-points-2500', name: 'Points Machine', game: 'farmykart', tier: 'rare', glyph: '⊕',
    desc: 'Score two and a half thousand points.', stat: 'fkPoints', atLeast: 2500,
  }),
  A({
    id: 'fk-tracks-3', name: 'Grand Tour', game: 'farmykart', tier: 'common', glyph: '⌘',
    desc: 'Set a lap time on all three circuits.', stat: 'fkTracksRaced', atLeast: 3,
  }),
  A({
    id: 'fk-podium-3', name: 'Clean Sweep', game: 'farmykart', tier: 'rare', glyph: '⎔',
    desc: 'Finish on the podium on all three circuits.', stat: 'fkTracksPodiumed', atLeast: 3,
    hidden: true,
  }),
  
  A({
    id: 'fk-lap-sunflower', name: 'Sunflower Pace', game: 'farmykart', tier: 'rare', glyph: '⏱',
    desc: 'Beat a Stampede bot round Sunflower - a lap under 27.5 s.',
    stat: 'fkLapSunflowerMs', atMost: PAR_LAP_MS.sunflower,
  }),
  A({
    id: 'fk-lap-muddybottom', name: 'Mud Runner', game: 'farmykart', tier: 'rare', glyph: '⏱',
    desc: 'Beat a Stampede bot round Muddybottom - a lap under 25 s.',
    stat: 'fkLapMuddybottomMs', atMost: PAR_LAP_MS.muddybottom,
  }),
  A({
    id: 'fk-lap-frostfield', name: 'Frostfield Flyer', game: 'farmykart', tier: 'rare', glyph: '⏱',
    desc: 'Beat a Stampede bot round Frostfield - a lap under 25 s.',
    stat: 'fkLapFrostfieldMs', atMost: PAR_LAP_MS.frostfield,
  }),

  
  
  
  
  
  
  A({
    id: 'fx-first', name: 'Ringside', game: '2d-fighter-ex', tier: 'common', glyph: '◇',
    desc: 'Watch a fight to the end.', stat: 'fxPlays', atLeast: 1,
  }),
  A({
    id: 'fx-10', name: 'Fight Fan', game: '2d-fighter-ex', tier: 'uncommon', glyph: '◇',
    desc: 'Watch ten fights to the end.', stat: 'fxPlays', atLeast: 10,
  }),
  A({
    id: 'fx-60', name: 'Season Pass', game: '2d-fighter-ex', tier: 'rare', glyph: '◇',
    desc: 'Watch sixty fights to the end.', stat: 'fxPlays', atLeast: 60, hidden: true,
  }),

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  A({
    id: 'zk-first', name: 'Blast Off', game: 'zelakas', tier: 'common', glyph: '△',
    desc: 'Take a flight.', stat: 'zkPlays', atLeast: 1,
  }),
  A({
    id: 'zk-10', name: 'Frequent Flyer', game: 'zelakas', tier: 'uncommon', glyph: '△',
    desc: 'Take ten flights.', stat: 'zkPlays', atLeast: 10,
  }),
  A({
    id: 'zk-40', name: 'Space Commuter', game: 'zelakas', tier: 'rare', glyph: '△',
    desc: 'Take forty flights.', stat: 'zkPlays', atLeast: 40, hidden: true,
  }),
]);


export const BY_ID = Object.freeze(Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])));

export const ACHIEVEMENT_IDS = Object.freeze(ACHIEVEMENTS.map((a) => a.id));





const n = (v) => {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) && x > 0 ? x : 0;
};















export function statsFor(profile, { today = null, kartRecords = null } = {}) {
  const p = normaliseProfile(profile);
  const g = (id) => p.games[id] ?? { plays: 0, wins: 0, totals: {} };
  const tb = g('team-bonding');
  const fk = g('farmykart');
  const age = daysBetween(p.createdDay, today);
  const rec = kartRecords && typeof kartRecords === 'object' ? kartRecords : {};
  const lap = (id) => n(rec[id]?.bestLapMs);
  const podiumed = ['sunflower', 'muddybottom', 'frostfield']
    .filter((id) => { const b = n(rec[id]?.bestPosition); return b > 0 && b <= 3; }).length;
  const raced = ['sunflower', 'muddybottom', 'frostfield']
    .filter((id) => lap(id) > 0).length;

  return {
    accountAgeDays: age === null || age < 0 ? 0 : age,
    totalPlays: GAME_IDS.reduce((t, id) => t + n(g(id).plays), 0),
    gamesTried: GAME_IDS.filter((id) => n(g(id).plays) > 0).length,
    xp: n(p.xp),
    rankIndex: rankFor(p.xp).index,
    streakBest: n(p.streak.best),
    daysPlayed: n(p.streak.daysPlayed),
    tourStamps: n(p.tour.stamps),
    tbPlays: n(tb.plays),
    tbWins: n(tb.wins),
    tbKills: n(tb.totals?.kills),
    fkPlays: n(fk.plays),
    fkWins: n(fk.wins),
    fkPodiums: n(fk.totals?.podiums),
    fkPoints: n(fk.totals?.points),
    fkTracksRaced: raced,
    fkTracksPodiumed: podiumed,
    fkLapSunflowerMs: lap('sunflower'),
    fkLapMuddybottomMs: lap('muddybottom'),
    fkLapFrostfieldMs: lap('frostfield'),
    fxPlays: n(g('2d-fighter-ex').plays),
    zkPlays: n(g('zelakas').plays),
  };
}


export function isUnlocked(achievement, stats) {
  if (!achievement || !stats) return false;
  const v = Number(stats[achievement.stat]);
  if (!Number.isFinite(v)) return false;
  if (achievement.atMost !== undefined) {
    
    
    
    
    
    
    return v > 0 && v <= achievement.atMost;
  }
  return v >= (achievement.atLeast ?? Infinity);
}


export function progressOf(achievement, stats) {
  if (!achievement || !stats) return 0;
  const v = Number(stats[achievement.stat]) || 0;
  if (achievement.atMost !== undefined) {
    
    
    return isUnlocked(achievement, stats) ? 1 : 0;
  }
  const target = achievement.atLeast ?? 1;
  return Math.max(0, Math.min(1, v / target));
}
















export function proofOf(achievement, { synced = false, saveSync = false, rulesLanded = [] } = {}) {
  if (!achievement) return PROOF.DEVICE;
  if (!synced) return PROOF.DEVICE;
  const field = STAT_FIELD[achievement.stat] ?? null;
  if (field === null) return PROOF.DEVICE;
  if (!saveSync && SAVE_ONLY_FIELDS.includes(field)) return PROOF.DEVICE;
  if (achievement.verified === true) return PROOF.VERIFIED;
  if (achievement.needsRule && rulesLanded.includes(achievement.needsRule)) return PROOF.VERIFIED;
  return PROOF.RECORDED;
}






export const SAVE_ONLY_FIELDS = Object.freeze([
  'tbKills', 'fkPodiums', 'fkPoints', 'fkBestLapMs', 'fkBestRaceMs',
  'fkBestPosition', 'fkBestPoints',
]);











export function evaluate(stats, { synced = false, saveSync = false, rulesLanded = [], seen = {} } = {}) {
  return ACHIEVEMENTS.map((a) => {
    const unlocked = isUnlocked(a, stats);
    return {
      id: a.id,
      name: a.name,
      game: a.game,
      gameName: a.game === 'all' ? 'All games' : (GAME_NAMES[a.game] ?? a.game),
      tier: a.tier,
      glyph: a.glyph,
      
      
      
      
      desc: (a.hidden && !unlocked) ? 'Hidden - keep playing.' : a.desc,
      hidden: !!a.hidden,
      unlocked,
      progress: progressOf(a, stats),
      proof: unlocked ? proofOf(a, { synced, saveSync, rulesLanded }) : PROOF.DEVICE,
      unlockedDay: unlocked ? (Number.isInteger(seen?.[a.id]) ? seen[a.id] : null) : null,
    };
  });
}


export function tally(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return {
    total: ACHIEVEMENTS.length,
    unlocked: list.filter((r) => r.unlocked).length,
    verified: list.filter((r) => r.unlocked && r.proof === PROOF.VERIFIED).length,
    recorded: list.filter((r) => r.unlocked && r.proof === PROOF.RECORDED).length,
    device: list.filter((r) => r.unlocked && r.proof === PROOF.DEVICE).length,
  };
}









export function showcase(rows, limit = 6) {
  const order = Object.fromEntries(TIERS.map((t, i) => [t, i]));
  const proofRank = { verified: 0, recorded: 1, device: 2 };
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r.unlocked)
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (order[b.r.tier] ?? 0) - (order[a.r.tier] ?? 0)
      || (proofRank[a.r.proof] ?? 3) - (proofRank[b.r.proof] ?? 3)
      || (b.r.unlockedDay ?? -1) - (a.r.unlockedDay ?? -1)
      || a.i - b.i)
    .slice(0, Math.max(0, limit))
    .map(({ r }) => r);
}








export function nextUp(rows, stats) {
  let best = null;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r.unlocked || r.hidden) continue;
    const a = BY_ID[r.id];
    if (!a || a.atMost !== undefined) continue;
    const p = progressOf(a, stats);
    if (p <= 0 || p >= 1) continue;
    if (!best || p > best.progress) {
      best = { ...r, progress: p, have: Number(stats[a.stat]) || 0, target: a.atLeast };
    }
  }
  return best;
}









export function rulesLandedIn(rulesText) {
  const src = String(rulesText ?? '').replace(/\s+/g, '');
  return Object.entries(VERIFIED_IF_RULES)
    .filter(([, pred]) => src.includes(pred.replace(/\s+/g, '')))
    .map(([marker]) => marker);
}
