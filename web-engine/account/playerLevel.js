
































export const XP_PER_PLAY = 10;
export const XP_PER_WIN = 40;


export function xpForLevel(level) {
  const l = Math.max(1, Math.floor(level));
  return 30 * l * (l - 1);
}


export function xpFrom({ plays = 0, wins = 0 } = {}) {
  const p = Number.isFinite(plays) ? Math.max(0, Math.floor(plays)) : 0;
  const w = Number.isFinite(wins) ? Math.max(0, Math.floor(wins)) : 0;
  
  
  
  return p * XP_PER_PLAY + Math.min(w, p) * XP_PER_WIN;
}







export function levelFrom(totals) {
  const xp = xpFrom(totals);
  let level = 1;
  
  
  
  while (xpForLevel(level + 1) <= xp) level += 1;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    xp,
    intoLevel: xp - floor,
    forNext: ceil - floor,
    progress: (xp - floor) / (ceil - floor),
  };
}









export function totalsFromSummary(summary) {
  const games = summary && Array.isArray(summary.games) ? summary.games : [];
  let plays = 0; let wins = 0;
  for (const g of games) {
    if (!g) continue;
    plays += Number.isFinite(g.plays) ? g.plays : 0;
    wins += Number.isFinite(g.wins) ? g.wins : 0;
  }
  return { plays, wins };
}
