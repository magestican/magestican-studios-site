



































































































import {
  SHEEP, COWS, SIZE, rowOf, sideOf, isKing, legalMoves, applyMove, other,
  countPieces, capturesFor, quietMoves, CROWN_ROW,
} from './checkersRules.js';
import {
  CHALLENGER, ceilingFor, pickRanked, considers, describeBot,
} from '../words/botSkill.js';


export const MAX_DEPTH = 6;

export const MAX_EXTENSION = 4;


export const VALUE = Object.freeze({ man: 100, king: 175 });









export const WEIGHT = Object.freeze({
  advance: 3,   
  backRank: 6,  
  mobility: 2,  
  centre: 2,    
});


const MIDDLE = new Set([2, 3, 4, 5]);








export function evaluate(board, side, { positional = true } = {}) {
  let score = 0;
  const foe = other(side);
  for (let at = 0; at < board.length; at += 1) {
    const ch = board[at];
    const who = sideOf(ch);
    if (who < 0) continue;
    const sign = who === side ? 1 : -1;
    if (isKing(ch)) {
      score += sign * VALUE.king;
      continue;
    }
    score += sign * VALUE.man;
    if (!positional) continue;
    const row = rowOf(at);
    
    const home = CROWN_ROW[other(who)];
    score += sign * WEIGHT.advance * Math.abs(row - home);
    if (row === home) score += sign * WEIGHT.backRank;
    if (MIDDLE.has(at % SIZE)) score += sign * WEIGHT.centre;
  }
  if (!positional) return score;
  
  
  
  
  
  score += WEIGHT.mobility * (quietMoves(board, side).length - quietMoves(board, foe).length);
  return score;
}


const WIN = 100000;







function search(board, side, depth, alpha, beta, counter, opts, extension = 0) {
  counter.nodes += 1;
  const jumps = capturesFor(board, side);
  const moves = jumps.length ? jumps : quietMoves(board, side);
  if (!moves.length) {
    
    
    
    return -WIN - depth;
  }
  
  
  const forced = jumps.length > 0 && extension < MAX_EXTENSION;
  const deeper = forced ? depth : depth - 1;
  const spent = forced ? extension + 1 : extension;
  if (depth <= 0 && !forced) return evaluate(board, side, opts);
  let best = -Infinity;
  let a = alpha;
  for (const move of moves) {
    const value = -search(
      applyMove(board, move), other(side), deeper, -beta, -a, counter, opts, spent,
    );
    if (value > best) best = value;
    if (best > a) a = best;
    if (a >= beta) break;   
  }
  return best;
}
















export function createSearch(board, side, { depth = MAX_DEPTH, positional = true } = {}) {
  const roots = legalMoves(board, side);
  const counter = { nodes: 0 };
  const opts = { positional };
  let level = 1;
  let at = 0;
  let scores = new Array(roots.length).fill(0);
  let ranked = roots.map((move, i) => ({ move, score: 0, index: i }));
  let complete = roots.length <= 1;

  const rank = () => roots
    .map((move, i) => ({ move, score: scores[i], index: i }))
    .sort((x, y) => y.score - x.score);

  return {
    get nodes() { return counter.nodes; },
    
    get depth() { return complete ? level : level - 1; },
    get done() { return complete; },
    
    get ranked() { return ranked; },
    get moves() { return roots; },

    







    step() {
      if (complete) return false;
      if (at < roots.length) {
        const move = roots[at];
        scores[at] = -search(
          applyMove(board, move), other(side), level - 1, -Infinity, Infinity, counter, opts,
        );
        at += 1;
        return true;
      }
      
      ranked = rank();
      if (level >= depth) { complete = true; return false; }
      level += 1;
      at = 0;
      scores = new Array(roots.length).fill(0);
      return true;
    },

    
    finish(limit = 1e7) {
      let n = 0;
      while (this.step() && n < limit) n += 1;
      if (roots.length <= 1) ranked = rank();
      return ranked;
    },
  };
}














export function depthFor(strength) {
  const s = Math.max(0, Math.min(1, Number.isFinite(strength) ? strength : 0));
  return Math.max(2, Math.min(MAX_DEPTH, Math.round(2 + s * (MAX_DEPTH - 2))));
}








export function botFor(level = 0, { index = 0 } = {}) {
  const strength = ceilingFor(level);
  return {
    ...describeBot(index, strength),
    strength,
    depth: depthFor(strength),
    
    
    name: 'Bot',
  };
}










export function chooseMove(ranked, strength, random = Math.random) {
  if (!ranked || !ranked.length) return null;
  const at = pickRanked(ranked.length, strength, random);
  return ranked[Math.max(0, Math.min(ranked.length - 1, at))]?.move ?? null;
}


export const weighsPosition = (strength, random = Math.random) => considers(strength, random);








export function bestMove(board, side, { strength = CHALLENGER, random = Math.random } = {}) {
  const moves = legalMoves(board, side);
  if (moves.length <= 1) return moves[0] ?? null;
  const s = createSearch(board, side, {
    depth: depthFor(strength),
    positional: weighsPosition(strength, random),
  });
  s.finish();
  return chooseMove(s.ranked, strength, random);
}

export { SHEEP, COWS, evaluate as evaluateBoard, countPieces };
