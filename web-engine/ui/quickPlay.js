



















import { MAX_BOTS } from '../scenarios/matchRoster.js';
import { PLAY_TEAMS, isObserver } from '../match/observer.js';







export function randomLoadout({ maps = [], modes = [], characters = [], rng = Math.random } = {}) {
  
  
  
  
  
  const pick = (arr) => {
    if (!arr.length) return null;
    const r = Number.isFinite(rng()) ? rng() : 0;
    const i = Math.floor(r * arr.length);
    return arr[Math.max(0, Math.min(arr.length - 1, i))];
  };
  return {
    mapId: maps.length ? pick(maps) : null,
    gameMode: modes.length ? pick(modes) : null,
    character: characters.length ? pick(characters) : null,
    
    
    team: pick(PLAY_TEAMS),
    
    
    
    
    bots: MAX_BOTS,
  };
}





export function assertPlayable(loadout, rng = Math.random) {
  const out = { ...loadout };
  
  
  
  
  
  if (!PLAY_TEAMS.includes(out.team)) {
    const r = Number.isFinite(rng()) ? Math.max(0, Math.min(0.999, rng())) : 0;
    out.team = PLAY_TEAMS[Math.floor(r * PLAY_TEAMS.length)] ?? PLAY_TEAMS[0];
  }
  if (!Number.isFinite(out.bots) || out.bots < 0) out.bots = MAX_BOTS;
  out.bots = Math.min(out.bots, MAX_BOTS);
  return out;
}
