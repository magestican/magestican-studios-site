




































































export const FINISH_POINTS = Object.freeze([15, 12, 10, 8, 6, 4, 2, 1]);


export const FASTEST_LAP_BONUS = 3;


export const LAP_COMPLETE_POINTS = 1;


export const LAP_LEAD_POINTS = 4;









export function finishPoints(position) {
  const p = Math.floor(Number(position));
  if (!Number.isFinite(p) || p < 1) return 0;
  return FINISH_POINTS[p - 1] ?? 0;
}








export function lapPoints(position, fieldSize) {
  const n = Math.floor(Number(fieldSize));
  const p = Math.floor(Number(position));
  if (!Number.isFinite(p) || p < 1) return 0;
  
  
  if (!Number.isFinite(n) || n <= 1) return LAP_COMPLETE_POINTS + LAP_LEAD_POINTS;
  const clamped = Math.min(Math.max(p, 1), n);
  const share = (n - clamped) / (n - 1);
  return LAP_COMPLETE_POINTS + Math.round(LAP_LEAD_POINTS * share);
}








export function fastestLapRacer(rows) {
  let best = null;
  for (const r of rows ?? []) {
    const t = Number(r?.bestLap);
    if (!Number.isFinite(t) || t <= 0) continue;
    if (best === null || t < Number(best.bestLap)) best = r;
  }
  return best ?? null;
}
















export function scoreRace(table, { fieldSize = null } = {}) {
  const rows = [...(table ?? [])];
  const size = Number.isFinite(Number(fieldSize)) && Number(fieldSize) > 0
    ? Math.floor(Number(fieldSize)) : rows.length;
  const quickest = fastestLapRacer(rows);
  const scored = rows.map((r) => {
    
    
    
    
    
    const fin = r?.finished === false ? 0 : finishPoints(r?.position);
    const laps = Math.max(0, Math.floor(Number(r?.lapPoints) || 0));
    const isFastest = !!quickest && quickest === r;
    const bonus = isFastest ? FASTEST_LAP_BONUS : 0;
    return {
      ...r,
      fieldSize: size,
      finishPoints: fin,
      lapPoints: laps,
      fastestLap: isFastest,
      fastestLapBonus: bonus,
      points: fin + laps + bonus,
    };
  });
  
  
  scored.sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));
  return scored;
}















export function podium(scored, { playerId = null } = {}) {
  const rows = [...(scored ?? [])]
    .sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));
  const top = rows.slice(0, 3);
  const winner = top[0] ?? null;
  const order = [1, 0, 2];        
  const steps = order
    .filter((i) => top[i])
    .map((i) => ({
      place: i + 1,
      row: top[i],
      
      
      
      isPlayer: playerId != null ? top[i].id === playerId : !!top[i].isPlayer,
    }));
  const playerRow = rows.find((r) => (playerId != null ? r.id === playerId : r.isPlayer)) ?? null;
  return {
    winner,
    steps,
    playerRow,
    playerOnPodium: !!playerRow && Number(playerRow.position) <= 3,
    playerWon: !!playerRow && Number(playerRow.position) === 1,
    rest: rows.slice(3),
  };
}














export function winnerAnnouncement(model) {
  if (!model || !model.winner) return 'Race over';
  if (model.playerWon) return 'You won';
  return `${model.winner.name ?? 'Unknown'} wins`;
}






export function emptyCup() {
  return {
    version: 1,
    races: 0,
    
    
    trackIds: [],
    
    
    racers: {},
  };
}









export function applyRace(cup, scored, { trackId = null } = {}) {
  const base = cup && cup.version === 1 ? cup : emptyCup();
  const next = {
    ...base,
    races: (base.races ?? 0) + 1,
    trackIds: [...(base.trackIds ?? []), trackId].filter((t) => t != null),
    racers: { ...(base.racers ?? {}) },
  };
  for (const r of scored ?? []) {
    const id = r?.id;
    if (id == null) continue;
    const prev = next.racers[id] ?? {
      id, name: r.name ?? String(id), character: r.character ?? null,
      points: 0, races: 0, wins: 0, podiums: 0, bestPosition: null, fastestLaps: 0,
    };
    const pos = Number(r.position);
    next.racers[id] = {
      ...prev,
      
      
      name: r.name ?? prev.name,
      character: r.character ?? prev.character,
      points: prev.points + (Number(r.points) || 0),
      races: prev.races + 1,
      wins: prev.wins + (pos === 1 ? 1 : 0),
      podiums: prev.podiums + (pos >= 1 && pos <= 3 ? 1 : 0),
      bestPosition: Number.isFinite(pos) && pos >= 1
        ? (prev.bestPosition == null ? pos : Math.min(prev.bestPosition, pos))
        : prev.bestPosition,
      fastestLaps: prev.fastestLaps + (r.fastestLap ? 1 : 0),
    };
  }
  return next;
}








export function cupStandings(cup) {
  const rows = Object.values(cup?.racers ?? {});
  rows.sort((a, b) => (b.points - a.points)
    || (b.wins - a.wins)
    || ((a.bestPosition ?? 999) - (b.bestPosition ?? 999))
    || String(a.name).localeCompare(String(b.name)));
  return rows.map((r, i) => ({ ...r, position: i + 1 }));
}


export function formatPoints(n) {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  return `${v} pt${v === 1 ? '' : 's'}`;
}
