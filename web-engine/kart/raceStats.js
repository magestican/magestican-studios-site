
















export const STORE_KEY = 'farmykart.progress.v1';


export function safeStore(candidate) {
  try {
    if (!candidate) return memoryStore();
    const probe = `${STORE_KEY}.probe`;
    candidate.setItem(probe, '1');
    candidate.removeItem(probe);
    return candidate;
  } catch {
    return memoryStore();
  }
}

export function memoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

export function emptyProgress() {
  return {
    version: 1,
    
    tracks: {},
    
    characters: {},
    totalRaces: 0,
    totalWins: 0,
    
    unlocked: [],
  };
}

export function loadProgress(store) {
  const s = safeStore(store);
  try {
    const raw = s.getItem(STORE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return emptyProgress();
    
    
    
    
    return { ...emptyProgress(), ...parsed, tracks: parsed.tracks ?? {}, characters: parsed.characters ?? {} };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(store, progress) {
  const s = safeStore(store);
  try {
    s.setItem(STORE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}





export function recordRace(progress, {
  trackId, characterId, position, fieldSize, bestLap, raceTime, difficulty,
}) {
  const next = {
    ...progress,
    tracks: { ...progress.tracks },
    characters: { ...progress.characters },
  };
  const prev = next.tracks[trackId] ?? {
    bestLap: null, bestRace: null, bestPosition: null, races: 0, wins: 0,
  };
  const notable = [];

  const t = { ...prev, races: prev.races + 1 };
  if (bestLap != null && (t.bestLap == null || bestLap < t.bestLap)) {
    notable.push({ type: 'bestLap', value: bestLap, previous: t.bestLap });
    t.bestLap = bestLap;
  }
  if (raceTime != null && (t.bestRace == null || raceTime < t.bestRace)) {
    notable.push({ type: 'bestRace', value: raceTime, previous: t.bestRace });
    t.bestRace = raceTime;
  }
  if (position != null && (t.bestPosition == null || position < t.bestPosition)) {
    notable.push({ type: 'bestPosition', value: position, previous: t.bestPosition });
    t.bestPosition = position;
  }
  if (position === 1) { t.wins += 1; next.totalWins = (next.totalWins ?? 0) + 1; }

  next.tracks[trackId] = t;
  next.characters[characterId] = (next.characters[characterId] ?? 0) + 1;
  next.totalRaces = (next.totalRaces ?? 0) + 1;
  next.lastTrack = trackId;
  next.lastCharacter = characterId;
  next.lastDifficulty = difficulty;
  return { progress: next, notable, fieldSize };
}










export function unlockedTracks(progress, allTracks) {
  const podiumed = Object.values(progress.tracks ?? {})
    .some((t) => t.bestPosition != null && t.bestPosition <= 3);
  return allTracks.filter((t) => !t.locked || podiumed);
}


export function isLocked(progress, track) {
  if (!track.locked) return false;
  return !Object.values(progress.tracks ?? {})
    .some((t) => t.bestPosition != null && t.bestPosition <= 3);
}


export function trackRecord(progress, trackId) {
  return progress.tracks?.[trackId] ?? { bestLap: null, bestRace: null, bestPosition: null, races: 0, wins: 0 };
}
