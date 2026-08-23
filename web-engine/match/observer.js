



































export const OBSERVER_TEAM = 'observer';




export const PLAY_TEAMS = Object.freeze(['red', 'blue']);

export function isObserver(team) {
  return team === OBSERVER_TEAM;
}


export function isPlaying(team) {
  return team === 'red' || team === 'blue';
}








export function enemyOf(team) {
  if (team === 'red') return 'blue';
  if (team === 'blue') return 'red';
  return null;
}











export function teamCounts(metas) {
  const counts = { red: 0, blue: 0 };
  for (const m of metas || []) {
    if (m?.team === 'red') counts.red++;
    else if (m?.team === 'blue') counts.blue++;
  }
  return counts;
}



export function playingCount(metas) {
  let n = 0;
  for (const m of metas || []) if (isPlaying(m?.team)) n++;
  return n;
}




export const OBSERVER_CAN = Object.freeze({
  fly: true,             
  noclip: true,          
  leaveMap: true,        
  shoot: false,          
  beShot: false,         
  takeDamage: false,
  carryFlag: false,      
  holdHill: false,       
  score: false,
  beTargetedByBots: false,
  occupySeat: false,     
});

export function observerCan(action) {
  return OBSERVER_CAN[action] === true;
}






export function relation(viewerTeam, otherTeam, { self = false } = {}) {
  if (self) return 'self';
  if (isObserver(otherTeam) || isObserver(viewerTeam)) return 'observer';
  if (!isPlaying(viewerTeam) || !isPlaying(otherTeam)) return 'unknown';
  return viewerTeam === otherTeam ? 'ally' : 'enemy';
}

















export function seatChange(fromTeam, toTeam) {
  const wasPlaying = isPlaying(fromTeam);
  const nowPlaying = isPlaying(toTeam);
  if (wasPlaying && !nowPlaying) return { addBotOn: fromTeam };
  if (!wasPlaying && nowPlaying) return { displace: true };
  return null;
}





export function rejoinTeam(counts) {
  return (counts?.red ?? 0) <= (counts?.blue ?? 0) ? 'red' : 'blue';
}
