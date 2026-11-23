









import { ARENAS, ARENA_ORDER } from './arenas.js';

export const ROUND_CHOICES = Object.freeze([3, 4, 5]);
export const DEFAULT_ROUNDS = 4;
export const TEAM_CHOICES = Object.freeze([2, 3, 4]);
export const MODES = Object.freeze(['brawl', 'team']);
export const MODE_NAME = Object.freeze({ brawl: 'Bell Brawl', team: 'Team Trial' });


export const HOUSE_WELL = Object.freeze({
  vale: 'Forgehold', mirren: 'Tidewall', sora: 'High Spire', kett: 'Glassfields',
  oru: 'The Archive', dunn: 'Deepcut', lisle: 'Gilt Harbour', ash: 'a new city for Ash',
});


export const placePoints = (place) => Math.max(1, 8 - place);


export function assignTeams(n, teams) {
  const k = TEAM_CHOICES.includes(teams) ? teams : 2;
  return Array.from({ length: n }, (_, i) => i % k);
}





export function createNight({ rounds = DEFAULT_ROUNDS, mode = 'brawl', teams = 2, players = [], allNew = false, arena = 'rotate' } = {}) {
  const m = MODES.includes(mode) ? mode : 'brawl';
  const k = TEAM_CHOICES.includes(teams) ? teams : 2;
  const seats = players.slice(0, 8).map((p, i) => ({ ...p, team: m === 'team' ? assignTeams(players.length, k)[i] : i }));
  return {
    rounds: ROUND_CHOICES.includes(rounds) ? rounds : DEFAULT_ROUNDS, mode: m, teams: m === 'team' ? k : seats.length,
    arena: arena === 'rotate' || ARENAS[arena] ? arena : 'rotate',
    allNew: !!allNew, round: 0, seats, scores: seats.map(() => 0), bells: seats.map(() => 0), cards: [],
  };
}


export const arenaFor = (night, round = night.round) => (night.arena && night.arena !== 'rotate' ? night.arena : ARENA_ORDER[round % ARENA_ORDER.length]);


export function matchOptions(night, { seed = 1, arena = arenaFor(night) } = {}) {
  return { seed, arena, mode: night.mode, players: night.seats, sleeper: !(night.round === 0 && night.allNew) };
}


function placeRows(rows, key) {
  rows.sort((a, b) => key(b) - key(a) || a.id - b.id);
  let place = 0;
  rows.forEach((r, n) => { if (n > 0 && key(r) !== key(rows[n - 1])) place = n; r.place = place; });
  return rows;
}


export function roundCard(match) {
  const rows = match.titans.map((t) => ({
    id: t.id, house: t.house, frame: t.frame, team: t.team, bells: t.bells, rung: t.rung,
    clangsWon: t.clangsWon, perfectVents: t.perfectVents, bestStreak: t.bestStreak || 0,
    stalls: t.stalls || 0, slamHits: t.slamHits || 0, rookie: !!t.rookie,
  }));
  if (match.mode !== 'team') {
    
    placeRows(rows, (r) => r.bells * 1000 - r.rung);
    return { mode: 'brawl', rows, teams: null, winner: rows[0] ? { house: rows[0].house, ids: [rows[0].id] } : null };
  }
  const byTeam = new Map();
  for (const r of rows) {
    if (!byTeam.has(r.team)) byTeam.set(r.team, { id: r.team, team: r.team, bells: 0, members: [] });
    const g = byTeam.get(r.team); g.bells += r.bells; g.members.push(r.id);
  }
  const teams = placeRows([...byTeam.values()], (g) => g.bells);
  for (const r of rows) r.place = byTeam.get(r.team).place;
  rows.sort((a, b) => a.place - b.place || b.bells - a.bells || a.id - b.id);
  const top = teams[0];
  return { mode: 'team', rows, teams, winner: top ? { team: top.team, ids: top.members, house: rows.find((r) => r.team === top.team).house } : null };
}


export function recordRound(night, match) {
  const card = roundCard(match);
  for (const r of card.rows) {
    r.points = placePoints(r.place);
    night.scores[r.id] += r.points;
    night.bells[r.id] += r.bells;
  }
  night.cards.push(card);
  night.round += 1;
  return card;
}

export const nightOver = (night) => night.round >= night.rounds;


export function standings(night) {
  if (night.mode === 'team') {
    const byTeam = new Map();
    night.seats.forEach((s, i) => {
      if (!byTeam.has(s.team)) byTeam.set(s.team, { id: s.team, team: s.team, score: night.scores[i], bells: 0, members: [] });
      const g = byTeam.get(s.team); g.bells += night.bells[i]; g.members.push(i);
    });
    return placeRows([...byTeam.values()], (g) => g.score * 10000 + g.bells);
  }
  const rows = night.seats.map((s, i) => ({ id: i, house: s.house, members: [i], score: night.scores[i], bells: night.bells[i] }));
  return placeRows(rows, (r) => r.score * 10000 + r.bells);
}





export function podium(night) {
  const top = standings(night).slice(0, 3).map((e) => ({
    place: e.place, members: e.members, houses: e.members.map((i) => night.seats[i].house), score: e.score, bells: e.bells,
  }));
  const champ = top[0];
  const lead = champ ? champ.houses[0] : null;
  return { entries: top, champion: champ || null, well: lead ? HOUSE_WELL[lead] : null };
}
