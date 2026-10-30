















import {
  legalMoves, hasLegalMove, pseudoMoves, doMove, undoMove, inCheck, typeOf, ownerOf, other, rowOf, colOf, HAND_ORDER,
} from './shogiRules.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);
const MATE = 100000;

export const VALUE = Object.freeze({
  P: 90, L: 230, N: 260, S: 370, G: 440, B: 570, R: 640, K: 0,
  '+P': 530, '+L': 490, '+N': 510, '+S': 500, '+B': 830, '+R': 950,
});
const HAND_BONUS = 1.15;

export function seededRng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}


export function evaluate(pos) {
  let score = 0;
  const { board } = pos;
  for (let sq = 0; sq < 81; sq += 1) {
    const p = board[sq];
    if (!p) continue;
    const v = VALUE[typeOf(p)];
    score += ownerOf(p) === 'b' ? v : -v;
  }
  for (const t of HAND_ORDER) {
    score += (pos.hands.b[t] - pos.hands.w[t]) * VALUE[t] * HAND_BONUS;
  }
  score += shelter(pos, 'b') - shelter(pos, 'w');
  return pos.turn === 'b' ? score : -score;
}

function shelter(pos, color) {
  const k = pos.kings[color];
  if (k < 0) return -MATE;
  const r0 = rowOf(k);
  const c0 = colOf(k);
  let s = 0;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      const r = r0 + dr;
      const c = c0 + dc;
      if (r < 0 || r > 8 || c < 0 || c > 8 || (!dr && !dc)) continue;
      const p = pos.board[r * 9 + c];
      if (p && ownerOf(p) === color) {
        const t = typeOf(p);
        if (t === 'G' || t === 'S' || t[0] === '+') s += 18;
      }
    }
  }
  return s;
}

const orderScore = (m) => (m.capture ? VALUE[typeOf(m.capture)] * 10 - (VALUE[m.piece] || 0) : 0) + (m.promote ? 300 : 0);
const ordered = (moves) => moves.sort((a, b) => orderScore(b) - orderScore(a));

function quiesce(pos, alpha, beta, budget, qd) {
  budget.nodes += 1;
  const stand = evaluate(pos);
  if (qd <= 0) return stand;
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  const me = pos.turn;
  for (const m of ordered(pseudoMoves(pos).filter((x) => x.capture))) {
    if (typeOf(m.capture) === 'K') return MATE;
    const u = doMove(pos, m);
    if (inCheck(pos, me)) { undoMove(pos, m, u); continue; }
    const v = -quiesce(pos, -beta, -alpha, budget, qd - 1);
    undoMove(pos, m, u);
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function negamax(pos, depth, alpha, beta, budget, ply) {
  if (depth <= 0) return quiesce(pos, alpha, beta, budget, 4);
  budget.nodes += 1;
  const me = pos.turn;
  let best = -MATE + ply;
  let any = false;
  for (const m of ordered(pseudoMoves(pos))) {
    if (m.capture && typeOf(m.capture) === 'K') return MATE - ply;
    const u = doMove(pos, m);
    if (inCheck(pos, me)) { undoMove(pos, m, u); continue; }
    any = true;
    const v = -negamax(pos, depth - 1, -beta, -alpha, budget, ply + 1);
    undoMove(pos, m, u);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
    if (budget.nodes > budget.max) break;
  }
  return any ? best : -MATE + ply;
}

const SETTINGS = Object.freeze({
  easy: { depth: 1, nodes: 20000, pick: 'half', noise: 120 },
  medium: { depth: 2, nodes: 80000, pick: 3, noise: 40 },
  hard: { depth: 3, nodes: 200000, pick: 1, noise: 0 },
});


export function rankMoves(pos, { depth = 2, nodes = 80000 } = {}) {
  const roots = legalMoves(pos);
  let ranked = roots.map((m) => ({ move: m, score: 0 }));
  for (let d = 1; d <= depth; d += 1) {
    const budget = { nodes: 0, max: nodes };
    const next = [];
    for (const r of ranked) {
      const u = doMove(pos, r.move);
      
      const score = hasLegalMove(pos) ? -negamax(pos, d - 1, -MATE, MATE, budget, 1) : MATE - 1;
      undoMove(pos, r.move, u);
      next.push({ move: r.move, score });
    }
    
    if (budget.nodes > nodes && d > 1) break;
    ranked = next.sort((a, b) => b.score - a.score);
  }
  return ranked;
}


export function chooseMove(pos, { level = 'medium', rng = Math.random } = {}) {
  const s = SETTINGS[level] || SETTINGS.medium;
  const ranked = rankMoves(pos, { depth: s.depth, nodes: s.nodes });
  if (!ranked.length) return null;
  if (s.noise) for (const r of ranked) r.score += (rng() - 0.5) * 2 * s.noise;
  ranked.sort((a, b) => b.score - a.score);
  
  if (ranked[0].score >= MATE - 10) return ranked[0].move;
  const n = s.pick === 'half' ? Math.max(1, Math.ceil(ranked.length / 2)) : Math.min(s.pick, ranked.length);
  
  const floor = ranked[0].score - (level === 'easy' ? 400 : 200);
  const pool = ranked.slice(0, n).filter((r) => r.score >= floor);
  return pool[Math.floor(rng() * pool.length)].move;
}
