




export const PVP_BAND = 10;

const avg = team => team.reduce((a, d) => a + d.lvl, 0) / Math.max(1, team.length);


export const matchLevel = (teamA, teamB) => Math.round((avg(teamA) + avg(teamB)) / 2);

export function battleLevel(lvl, match, band = PVP_BAND) {
  return Math.max(1, Math.min(match + band, Math.max(match - band, lvl)));
}


export function balanceTeams(teamA, teamB) {
  const m = matchLevel(teamA, teamB);
  const re = d => ({ ...d, lvl: battleLevel(d.lvl, m), xp: 0, pvp: true });
  return { match: m, a: teamA.map(re), b: teamB.map(re) };
}


export const pvpReward = won => (won ? { badge: 'pvp-win', xp: 0 } : { badge: null, xp: 0 });
