


















































export const MATCH_CAP = 16;
export const MAX_BOTS = MATCH_CAP - 1;   









export function desiredBots(humans, requested, { cap = MATCH_CAP } = {}) {
  const room = Math.max(0, cap - humans);
  const ceiling = Math.max(0, cap - 1);
  return Math.min(room, Math.max(0, requested), ceiling);
}


















const idOf = (b) => b.id ?? b.peerId ?? null;

export function pickBotToDisplace(bots, joinerTeam, counts) {
  if (!bots || !bots.length) return null;
  const own = bots.filter((b) => b.team === joinerTeam);
  if (own.length) return idOf(own[0]);
  
  
  
  
  
  if (bots.every((b) => b.team == null)) return pickBotToDisplaceTeamless(bots);
  const biggest = (counts?.red ?? 0) >= (counts?.blue ?? 0) ? 'red' : 'blue';
  return idOf(bots.find((b) => b.team === biggest) ?? bots[0]);
}




























export function pickBotToDisplaceTeamless(bots, { rank = null } = {}) {
  if (!bots || !bots.length) return null;
  if (!rank) return idOf(bots[0]);
  let worst = bots[0];
  let worstRank = rank(bots[0]);
  for (let i = 1; i < bots.length; i += 1) {
    const r = rank(bots[i]);
    if (r > worstRank) { worst = bots[i]; worstRank = r; }
  }
  return idOf(worst);
}





export function hasRoom(humans, bots, { cap = MATCH_CAP } = {}) {
  return humans + bots < cap;
}









