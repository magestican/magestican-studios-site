




























import { GAME_IDS, GAME_NAMES, metricsFor } from './dailyChallenge.js';


const METRIC_LABELS = Object.freeze({
  matches: 'Matches',
  kills: 'Kills',
  wins: 'Wins',
  races: 'Races',
  laps: 'Laps',
  boosts: 'Boosts',
  rounds: 'Rounds',
  combos: 'Combos',
  waves: 'Waves',
  score: 'Score',
});


function metricLabel(m) {
  return METRIC_LABELS[m] || (m.charAt(0).toUpperCase() + m.slice(1));
}

const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);







export function gameStatRows(profile) {
  const games = profile?.games ?? {};
  return GAME_IDS.map((id) => {
    const g = games[id] ?? {};
    const plays = n(g.plays);
    const wins = n(g.wins);
    const totals = g.totals ?? {};
    return {
      id,
      name: GAME_NAMES[id] ?? id,
      played: plays > 0,
      plays,
      wins,
      
      
      
      winRate: plays > 0 ? wins / plays : null,
      winLine: plays > 0 ? `${Math.round((wins / plays) * 100)}%` : '—',
      
      
      
      
      metrics: metricsFor(id)
        .filter((m) => m !== 'wins')          
        .map((m) => ({ id: m, label: metricLabel(m), value: n(totals[m]) })),
    };
  });
}







export function careerTotals(profile) {
  const rows = gameStatRows(profile);
  const plays = rows.reduce((t, r) => t + r.plays, 0);
  const wins = rows.reduce((t, r) => t + r.wins, 0);
  return {
    plays,
    wins,
    gamesTried: rows.filter((r) => r.played).length,
    gamesTotal: rows.length,
    winRate: plays > 0 ? wins / plays : null,
    winLine: plays > 0 ? `${Math.round((wins / plays) * 100)}%` : '—',
  };
}







export function nextGameToTry(profile) {
  return gameStatRows(profile).find((r) => !r.played) ?? null;
}


export function careerLine(profile) {
  const t = careerTotals(profile);
  if (t.plays === 0) return 'No games played yet';
  const games = `${t.gamesTried} of ${t.gamesTotal} games`;
  return `${t.plays} ${t.plays === 1 ? 'match' : 'matches'} across ${games}`;
}
