






















import { play as playWordle, MAX_GUESSES } from './wordleRules.js';
import { scoreWord, isPangram } from './beeRules.js';
import { play as playConnections } from './connectionsRules.js';








export const LEVELS = Object.freeze([
  { at: 0, name: 'Newcomer' },
  { at: 50, name: 'Farmhand' },
  { at: 150, name: 'Shepherd' },
  { at: 350, name: 'Grower' },
  { at: 700, name: 'Harvester' },
  { at: 1200, name: 'Landholder' },
  { at: 2000, name: 'Old Hand' },
  { at: 3200, name: 'Master of the Farm' },
]);


export function levelOf(points = 0) {
  const p = Math.max(0, Math.round(points));
  let at = LEVELS[0];
  let next = null;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (p >= LEVELS[i].at) { at = LEVELS[i]; next = LEVELS[i + 1] ?? null; }
  }
  return {
    points: p,
    name: at.name,
    next: next ? next.name : null,
    toNext: next ? next.at - p : 0,
    
    
    
    share: next ? (p - at.at) / (next.at - at.at) : 1,
  };
}






export function scoreIn(game, puzzle, saved = {}) {
  if (!puzzle) return 0;
  if (game === 'wordle') return wordleScore(puzzle, saved);
  if (game === 'bee') return beeScore(puzzle, saved);
  if (game === 'connections') return connectionsScore(puzzle, saved);
  if (game === 'strands') return strandsScore(puzzle, saved);
  return 0;
}








function wordleScore(answer, saved) {
  const guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
  if (!guesses.length) return 0;
  const state = playWordle(answer, guesses);
  if (!state.won) return 0;
  
  
  
  
  const used = guesses.length;
  const earned = 45 + Math.round((MAX_GUESSES - used) * 15);
  
  
  
  
  
  
  
  
  
  
  
  
  
  const hints = Array.isArray(saved.given) ? saved.given.length : 0;
  return Math.max(30, earned - hints * 15);
}









function beeScore(puzzle, saved) {
  const valid = new Set(puzzle.answers ?? []);
  const found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => valid.has(w));
  if (!found.length) return 0;
  const raw = found.reduce((t, w) => t + scoreWord(w, puzzle.letters), 0);
  const max = (puzzle.answers ?? []).reduce((t, w) => t + scoreWord(w, puzzle.letters), 0) || 1;
  const bonus = found.some((w) => isPangram(w, puzzle.letters)) ? 15 : 0;
  return Math.round((raw / max) * 100) + bonus;
}


function connectionsScore(puzzle, saved) {
  const state = playConnections(puzzle, Array.isArray(saved.selections) ? saved.selections : []);
  return Math.max(0, state.solved.length * 25 - state.mistakes * 8);
}


function strandsScore(puzzle, saved) {
  const words = puzzle.words ?? [];
  if (!words.length) return 0;
  const real = new Set(words.map((e) => e.w ?? e));
  const found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => real.has(w));
  const per = 100 / words.length;
  const spangram = found.includes(puzzle.spangram) ? 20 : 0;
  return Math.round(found.length * per) + spangram;
}







export function isSolved(game, puzzle, saved = {}) {
  if (!puzzle || !saved) return false;
  if (game === 'wordle') {
    const guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
    if (!guesses.length) return false;
    const state = playWordle(puzzle, guesses);
    return state.over;
  }
  if (game === 'bee') {
    const valid = new Set(puzzle.answers ?? []);
    const found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => valid.has(w));
    return valid.size > 0 && found.length >= valid.size;
  }
  if (game === 'connections') {
    const state = playConnections(puzzle, Array.isArray(saved.selections) ? saved.selections : []);
    return state.over;
  }
  if (game === 'strands') {
    const words = puzzle.words ?? [];
    const real = new Set(words.map((e) => e.w ?? e));
    const found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => real.has(w));
    return words.length > 0 && found.length >= words.length;
  }
  return false;
}


export function totalOf(entries = []) {
  return entries.reduce((t, e) => t + Math.max(0, e.points ?? 0), 0);
}








export function roomScore(rows = []) {
  const players = rows.map((r) => ({ ...r, points: Math.max(0, r.points ?? 0) }));
  return {
    players: [...players].sort((a, b) => b.points - a.points),
    total: players.reduce((t, p) => t + p.points, 0),
  };
}
