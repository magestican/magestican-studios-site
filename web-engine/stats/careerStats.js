


























export const CAREER_KEY = 'tb.career.v1';
















export const CHARACTERS = Object.freeze(['cow', 'chicken', 'pig', 'sheep']);


export function normaliseCharacter(raw) {
  
  
  
  
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  return CHARACTERS.includes(s) ? s : null;
}














export function emptyCareer() {
  return { version: 1, matches: 0, firstAt: null, lastAt: null, players: {}, characters: {} };
}

function blankPlayer(name) {
  return { name, matches: 0, wins: 0, kills: 0, deaths: 0, bot: false };
}



export function recordMatch(career, { players = [], winner = null, endedAt = 0 } = {}) {
  const next = {
    ...emptyCareer(), ...career,
    players: { ...(career?.players ?? {}) },
    
    
    
    characters: { ...(career?.characters ?? {}) },
  };
  next.matches = (next.matches ?? 0) + 1;
  next.firstAt = next.firstAt ?? endedAt ?? null;
  next.lastAt = endedAt ?? next.lastAt ?? null;

  for (const p of players) {
    
    
    
    
    const name = String(p?.name ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const row = { ...(next.players[key] ?? blankPlayer(name)) };
    row.name = name;                       
    row.bot = !!p.bot;
    row.matches += 1;
    row.kills += Number(p.kills) || 0;
    row.deaths += Number(p.deaths) || 0;
    if (winner && p.team === winner) row.wins += 1;
    next.players[key] = row;
    
    
    
    
    const character = normaliseCharacter(p?.character);
    if (character) next.characters[key] = character;
  }
  return next;
}













export function rememberCharacters(career, roster = []) {
  const base = career ?? emptyCareer();
  let changed = false;
  const characters = { ...(base.characters ?? {}) };
  for (const p of roster) {
    const name = String(p?.name ?? '').trim();
    if (!name) continue;
    const character = normaliseCharacter(p?.character);
    if (!character) continue;
    const key = name.toLowerCase();
    if (characters[key] === character) continue;
    characters[key] = character;
    changed = true;
  }
  if (!changed) return base;
  return { ...emptyCareer(), ...base, players: { ...(base.players ?? {}) }, characters };
}



export function ratio(row) {
  return (Number(row?.kills) || 0) / Math.max(1, Number(row?.deaths) || 0);
}







export function leaderboard(career, { limit = 10, includeBots = false } = {}) {
  const characters = career?.characters ?? {};
  const rows = Object.entries(career?.players ?? {})
    .map(([key, r]) => ({ ...r, character: normaliseCharacter(characters[key] ?? r?.character) }))
    .filter((r) => includeBots || !r.bot);
  rows.sort((a, b) =>
    
    
    
    (b.kills - a.kills)
    || (ratio(b) - ratio(a))
    || (b.wins - a.wins)
    || a.name.localeCompare(b.name));
  return rows.slice(0, Math.max(0, limit));
}






export function loadCareer(storage) {
  try {
    const raw = storage?.getItem?.(CAREER_KEY);
    if (!raw) return emptyCareer();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.players) return emptyCareer();
    
    
    
    
    return {
      ...emptyCareer(), ...parsed,
      players: { ...parsed.players },
      characters: { ...(parsed.characters ?? {}) },
    };
  } catch (_) {
    
    
    return emptyCareer();
  }
}

export function saveCareer(storage, career) {
  try {
    storage?.setItem?.(CAREER_KEY, JSON.stringify(career));
    return true;
  } catch (_) {
    
    
    return false;
  }
}
