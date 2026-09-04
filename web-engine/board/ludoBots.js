





























import { HOME, LAP, YARD } from './ludoBoard.js';











export function choose(state) {
  const moves = state.moves ?? [];
  if (!moves.length) return null;
  let best = moves[0];
  let bestScore = score(state, moves[0]);
  for (const m of moves.slice(1)) {
    const s = score(state, m);
    
    
    if (s > bestScore) { best = m; bestScore = s; }
  }
  return best.token;
}
























export function score(state, move) {
  if (move.to >= HOME) return 1e6;

  let s = 0;
  if (move.captures.length) {
    
    const worst = Math.max(...move.captures.map((c) => c.from));
    s += 1e5 + worst * 10;
  }
  if (move.from === YARD) {
    const stuck = (state.tokens[state.turn] ?? []).filter((p) => p === YARD).length;
    s += 4e4 + stuck * 500;
  }
  if (move.to >= LAP) s += 3e4 + move.to * 10;
  if (move.safe) s += 900;
  
  
  s += move.to;
  return s;
}
