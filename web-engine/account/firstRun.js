



























































import { GAME_IDS, GAME_NAMES } from './dailyChallenge.js';


export const NEW_GAME_XP = 120;


export const OPENING_STEPS = Object.freeze(['first-round', 'second-game', 'come-back']);







export function unplayedGames(profile) {
  const games = profile?.games ?? {};
  return GAME_IDS.filter((id) => !((games[id]?.plays ?? 0) > 0));
}


export function isFirstPlayOf(profile, gameId) {
  if (!GAME_IDS.includes(gameId)) return false;
  return (profile?.games?.[gameId]?.plays ?? 0) === 0;
}




const ESTABLISHED_DAYS = 3;












export function openingRun(profile) {
  const games = profile?.games ?? {};
  const played = GAME_IDS.filter((id) => (games[id]?.plays ?? 0) > 0);
  const totalPlays = GAME_IDS.reduce((n, id) => n + (games[id]?.plays ?? 0), 0);
  
  
  const daysPlayed = Math.max(0, Math.floor(Number(profile?.streak?.daysPlayed) || 0));

  const steps = [
    step('first-round', 'Finish one round of any game', totalPlays >= 1),
    step('second-game', 'Try a second game', played.length >= 2),
    step('come-back', 'Come back tomorrow and play again', daysPlayed >= 2),
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done) ?? null;
  const unplayed = unplayedGames(profile);

  return {
    
    
    
    
    
    
    
    
    
    
    active: doneCount < steps.length && daysPlayed < ESTABLISHED_DAYS,
    steps,
    doneCount,
    total: steps.length,
    nextStep: next ? next.id : null,
    
    
    
    suggest: unplayed.length ? unplayed[0] : null,
    suggestName: unplayed.length ? GAME_NAMES[unplayed[0]] : null,
  };
}

function step(id, text, done) {
  return Object.freeze({ id, text, done: !!done });
}









export function openingLine(run) {
  const r = run ?? {};
  if (!r.active) return null;
  switch (r.nextStep) {
    case 'first-round':
      return 'Play one round to start - nothing to sign up for';
    case 'second-game':
      return r.suggestName
        ? `One down. Try ${r.suggestName} next - it is a different game entirely`
        : 'One down. Try a second game next';
    case 'come-back':
      return 'Two down. Come back tomorrow and the third is yours';
    default:
      return null;
  }
}







export function coldOpen(featuredGameId) {
  const name = GAME_NAMES[featuredGameId] ?? null;
  return {
    headline: 'Four games. Nothing to install, nothing to sign up for.',
    line: name
      ? `Today's game of the day is ${name}. Play a round and your progress starts keeping itself.`
      : 'Play a round and your progress starts keeping itself.',
    featured: name ? featuredGameId : null,
  };
}









export function comebackLine(streakStatus) {
  const s = streakStatus ?? {};
  const best = Math.max(0, Math.floor(Number(s.best) || 0));
  const current = Math.max(0, Math.floor(Number(s.current) || 0));
  if (best < 2 || current >= best) return null;
  return `Back on day ${current} - your best run is ${best} days`;
}
