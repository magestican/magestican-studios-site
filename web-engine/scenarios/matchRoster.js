







export const MATCH_CAP = 16;
export const MAX_BOTS = MATCH_CAP - 1;   



export function desiredBots(humans, requested) {
  const room = Math.max(0, MATCH_CAP - humans);
  return Math.min(room, Math.max(0, requested), MAX_BOTS);
}










export function pickBotToDisplace(bots, joinerTeam, counts) {
  if (!bots || !bots.length) return null;
  const own = bots.filter((b) => b.team === joinerTeam);
  if (own.length) return own[0].id;
  const biggest = (counts?.red ?? 0) >= (counts?.blue ?? 0) ? 'red' : 'blue';
  return (bots.find((b) => b.team === biggest) ?? bots[0]).id;
}


export function hasRoom(humans, bots) {
  return humans + bots < MATCH_CAP;
}


export function onHumanJoin({ humans, bots, joinerTeam, counts }) {
  
  if (humans + bots <= MATCH_CAP) return { displace: null, full: humans >= MATCH_CAP };
  return {
    displace: pickBotToDisplace(bots.list ?? [], joinerTeam, counts),
    full: humans >= MATCH_CAP,
  };
}
