





































































import {
  EMPTY, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE,
  kindOf, sideOf,
} from './position.js';
import { legalMoves, makeMove, inCheck } from './moves.js';


export const VALUE = [0, 100, 320, 330, 500, 900, 20000];


export const MATE = 1000000;








const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];
const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];
const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];
const PST_ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];
const PST_QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];
const PST_KING_MID = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];
const PST_KING_END = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];
const TABLES = [null, PST_PAWN, PST_KNIGHT, PST_BISHOP, PST_ROOK, PST_QUEEN, PST_KING_MID];















export function evaluate(pos) {
  let score = 0;
  let heavy = 0;          
  let whiteBishops = 0;
  let blackBishops = 0;
  for (let sq = 0; sq < 64; sq += 1) {
    const p = pos.board[sq];
    if (p === EMPTY) continue;
    const kind = kindOf(p);
    if (kind !== PAWN && kind !== KING) heavy += VALUE[kind];
    if (kind === BISHOP) { if (p > 0) whiteBishops += 1; else blackBishops += 1; }
  }
  const endgame = heavy <= 1300;   

  for (let sq = 0; sq < 64; sq += 1) {
    const p = pos.board[sq];
    if (p === EMPTY) continue;
    const kind = kindOf(p);
    const white = p > 0;
    const at = white ? sq : sq ^ 56;
    const table = kind === KING ? (endgame ? PST_KING_END : PST_KING_MID) : TABLES[kind];
    const value = VALUE[kind] + table[at];
    score += white ? value : -value;
    if (kind === ROOK) {
      
      
      
      const file = sq & 7;
      let blocked = false;
      for (let r = 0; r < 8 && !blocked; r += 1) {
        const q = pos.board[r * 8 + file];
        if (q === PAWN || q === -PAWN) blocked = true;
      }
      if (!blocked) score += white ? 20 : -20;
    }
  }
  if (whiteBishops >= 2) score += 30;
  if (blackBishops >= 2) score -= 30;
  return pos.turn === WHITE ? score : -score;
}
















function scoreMove(m) {
  let s = 0;
  if (m.captured) s += 100000 + VALUE[kindOf(m.captured)] * 10 - VALUE[kindOf(m.piece)];
  if (m.promo) s += 90000 + VALUE[m.promo];
  if (m.castle) s += 5000;
  return s;
}

const ordered = (moves) => moves
  .map((m) => ({ m, s: scoreMove(m) }))
  .sort((a, b) => b.s - a.s)
  .map((x) => x.m);










function quiesce(pos, alpha, beta, depth, counter) {
  counter.nodes += 1;
  const stand = evaluate(pos);
  if (depth <= 0) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  const captures = ordered(legalMoves(pos, { capturesOnly: true }));
  for (const m of captures) {
    const score = -quiesce(makeMove(pos, m), -beta, -alpha, depth - 1, counter);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}









export function negamax(pos, depth, alpha, beta, counter, quiescenceDepth = 4) {
  counter.nodes += 1;
  if (depth <= 0) return quiesce(pos, alpha, beta, quiescenceDepth, counter);
  const moves = ordered(legalMoves(pos));
  if (!moves.length) {
    
    
    
    
    
    return inCheck(pos) ? -(MATE + depth) : 0;
  }
  let best = -Infinity;
  for (const m of moves) {
    const score = -negamax(makeMove(pos, m), depth - 1, -beta, -alpha, counter, quiescenceDepth);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}












export function depthFor(strength = 1) {
  const s = Math.max(0, Math.min(1, strength));
  if (s >= 0.85) return 4;
  if (s >= 0.6) return 3;
  return 2;
}









export function createSearch(position, { maxDepth = 4, quiescence = 4 } = {}) {
  const counter = { nodes: 0 };
  
  
  
  let roots = ordered(legalMoves(position)).map((m) => ({ move: m, score: 0, depth: 0 }));
  
  let completed = [];
  let depth = 1;
  let index = 0;

  const finished = () => depth > maxDepth || roots.length === 0;

  return {
    get nodes() { return counter.nodes; },
    
    get completedDepth() { return completed.length ? completed[0].depth : 0; },
    get total() { return roots.length; },
    get done() { return finished(); },

    








    step() {
      if (finished()) return false;
      const entry = roots[index];
      
      
      entry.score = -negamax(
        makeMove(position, entry.move), depth - 1, -Infinity, Infinity, counter, quiescence,
      );
      entry.depth = depth;
      index += 1;
      if (index >= roots.length) {
        
        roots.sort((a, b) => b.score - a.score);
        completed = roots.map((r) => ({ ...r }));
        index = 0;
        depth += 1;
      }
      return true;
    },

    











    ranked() {
      return completed.length ? completed : roots.map((r) => ({ ...r }));
    },

    
    finish() {
      while (this.step()) {  }
      return this.ranked();
    },
  };
}


export function searchMoves(position, opts) {
  return createSearch(position, opts).finish();
}
