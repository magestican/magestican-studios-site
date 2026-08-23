























export const MATCH_CAP = 16;
export const MAX_BOTS = MATCH_CAP - 1;   



export function desiredBots(humans, requested) {
  const room = Math.max(0, MATCH_CAP - humans);
  return Math.min(room, Math.max(0, requested), MAX_BOTS);
}


















const idOf = (b) => b.id ?? b.peerId ?? null;

export function pickBotToDisplace(bots, joinerTeam, counts) {
  if (!bots || !bots.length) return null;
  const own = bots.filter((b) => b.team === joinerTeam);
  if (own.length) return idOf(own[0]);
  const biggest = (counts?.red ?? 0) >= (counts?.blue ?? 0) ? 'red' : 'blue';
  return idOf(bots.find((b) => b.team === biggest) ?? bots[0]);
}


export function hasRoom(humans, bots) {
  return humans + bots < MATCH_CAP;
}









