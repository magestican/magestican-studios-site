




































import { SeededRng } from '../rng/seededRng.js';







export const GAME_IDS = Object.freeze([
  'team-bonding', 'farmykart', '2d-fighter-ex', 'zelakas',
]);

export const GAME_NAMES = Object.freeze({
  'team-bonding': 'Team Bonding',
  farmykart: 'Farmy Kart',
  '2d-fighter-ex': '2D Fighter EX',
  zelakas: 'Zelakas In Space',
});

export function isGameId(id) {
  return typeof id === 'string' && GAME_IDS.includes(id);
}













const GOALS = Object.freeze({
  'team-bonding': [
    { metric: 'matches', min: 1, max: 2, verb: 'Finish', noun: 'match', nouns: 'matches' },
    { metric: 'kills', min: 5, max: 12, verb: 'Land', noun: 'kill', nouns: 'kills' },
    { metric: 'wins', min: 1, max: 1, verb: 'Win', noun: 'match', nouns: 'matches' },
  ],
  farmykart: [
    { metric: 'races', min: 1, max: 2, verb: 'Finish', noun: 'race', nouns: 'races' },
    { metric: 'podiums', min: 1, max: 2, verb: 'Finish on the podium in', noun: 'race', nouns: 'races' },
    { metric: 'wins', min: 1, max: 1, verb: 'Win', noun: 'race', nouns: 'races' },
    { metric: 'points', min: 10, max: 25, verb: 'Score', noun: 'point', nouns: 'points' },
  ],
  '2d-fighter-ex': [
    { metric: 'fights', min: 1, max: 2, verb: 'Watch', noun: 'fight to the end', nouns: 'fights to the end' },
  ],
  zelakas: [
    { metric: 'sessions', min: 1, max: 1, verb: 'Take', noun: 'flight', nouns: 'flights' },
  ],
});


export function metricsFor(gameId) {
  return (GOALS[gameId] ?? []).map((g) => g.metric);
}














export function goalDeckFor(gameId) {
  return GOALS[gameId] ?? [];
}














export const COMPLETION_METRIC = Object.freeze({
  'team-bonding': 'matches',
  farmykart: 'races',
  '2d-fighter-ex': 'fights',
  zelakas: 'sessions',
});


export const DAILY_XP = 40;













export function gameOfTheDay(utcDay) {
  if (!Number.isInteger(utcDay) || utcDay < 0) return null;
  const block = Math.floor(utcDay / GAME_IDS.length);
  const slot = utcDay - block * GAME_IDS.length;
  const order = new SeededRng(hash32(`arbelo-gotd-v1:${block}`)).shuffle([...GAME_IDS]);
  return order[slot];
}







export function dailyChallenge(utcDay, gameId) {
  if (!Number.isInteger(utcDay) || utcDay < 0 || !isGameId(gameId)) return null;
  const table = GOALS[gameId];
  if (!table || !table.length) return null;
  
  
  const seed = hash32(`arbelo-daily-v1:${utcDay}:${gameId}`);
  const rng = new SeededRng(seed);
  const goal = rng.pick(table);
  const target = rng.rangeI(goal.min, goal.max);
  const featured = gameOfTheDay(utcDay) === gameId;
  return {
    id: `${utcDay}:${gameId}`,
    gameId,
    gameName: GAME_NAMES[gameId],
    metric: goal.metric,
    target,
    featured,
    xp: featured ? DAILY_XP * 2 : DAILY_XP,
    
    
    
    seed,
    text: `${goal.verb} ${target} ${target === 1 ? goal.noun : goal.nouns}`,
  };
}


export function dailyBoard(utcDay) {
  return GAME_IDS.map((id) => dailyChallenge(utcDay, id)).filter(Boolean);
}





export function challengeProgress(challenge, progress) {
  if (!challenge) return { have: 0, target: 0, done: false, fraction: 0 };
  const have = Math.max(0, Math.floor(Number(progress?.[challenge.metric]) || 0));
  const target = Math.max(1, challenge.target);
  return {
    have: Math.min(have, target),
    target,
    done: have >= target,
    fraction: Math.min(1, have / target),
  };
}






function hash32(s) {
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h || 1;
}
