

















import { EMPTY, BLACK, WHITE, isLegal, play, fiveAt, other } from './gomokuRules.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);


export function seededRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


const W = [0, 2, 24, 300, 6000, 1_000_000];

const WINDOW_CACHE = new Map();

function windows(size) {
  if (WINDOW_CACHE.has(size)) return WINDOW_CACHE.get(size);
  const list = [];
  const of = Array.from({ length: size * size }, () => []);
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const er = r + 4 * dr; const ec = c + 4 * dc;
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        const w = [];
        for (let k = 0; k < 5; k++) w.push((r + k * dr) * size + (c + k * dc));
        const id = list.length;
        list.push(w);
        for (const i of w) of[i].push(id);
      }
    }
  }
  const out = { list, of };
  WINDOW_CACHE.set(size, out);
  return out;
}


function counts(cells, w, color) {
  let own = 0; let opp = 0;
  for (const i of w) {
    const x = cells[i];
    if (x === color) own += 1; else if (x !== EMPTY) opp += 1;
  }
  return [own, opp];
}





function pointValue(cells, size, i, color) {
  const { list, of } = windows(size);
  let attack = 0; let defence = 0;
  for (const id of of[i]) {
    const [own, opp] = counts(cells, list[id], color);
    if (opp === 0) attack += W[own + 1] - W[own];
    if (own === 0) defence += W[opp + 1] - W[opp];
  }
  return attack + defence * 0.9;
}







function evaluate(cells, size, color) {
  const { list } = windows(size);
  let mine = 0; let theirs = 0;
  let iHaveFour = false;
  const theirPoints = new Set();
  for (const w of list) {
    const [own, opp] = counts(cells, w, color);
    if (opp === 0) {
      mine += W[own];
      if (own === 4) iHaveFour = true;
    } else if (own === 0) {
      theirs += W[opp];
      if (opp === 4) for (const i of w) if (cells[i] === EMPTY) theirPoints.add(i);
    }
  }
  if (iHaveFour) return W[5] / 2;
  if (theirPoints.size >= 2) return -W[5] / 2;
  return mine - theirs * 1.1;
}


function candidates(g) {
  const { size, cells } = g;
  const seen = new Uint8Array(cells.length);
  const out = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === EMPTY) continue;
    const r0 = Math.floor(i / size); const c0 = i % size;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = r0 + dr; const c = c0 + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const j = r * size + c;
        if (seen[j] || cells[j] !== EMPTY) continue;
        seen[j] = 1;
        if (isLegal(g, j)) out.push(j);
      }
    }
  }
  return out;
}


function ranked(g) {
  return candidates(g)
    .map((i) => ({ i, v: pointValue(g.cells, g.size, i, g.turn) }))
    .sort((a, b) => b.v - a.v || a.i - b.i);
}


function winningPoint(g, color, list) {
  for (const i of list) {
    if (fiveAt(g.cells, g.size, i, color, g.rules)) return i;
  }
  return -1;
}

const BRANCH = 10;
const DEPTH = 3;


function search(g, depth, alpha, beta) {
  if (g.over) return g.winner === EMPTY ? 0 : -W[5] * (depth + 1); 
  if (depth === 0) return evaluate(g.cells, g.size, g.turn);
  const moves = ranked(g).slice(0, BRANCH);
  if (moves.length === 0) return 0;
  let best = -Infinity;
  for (const { i } of moves) {
    const v = -search(play(g, i), depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}







export function chooseMove(g, { level = 'medium', rng = Math.random } = {}) {
  if (!LEVELS.includes(level)) throw new Error(`unknown level: ${level}`);
  if (g.over) throw new Error('the game is over');
  const centre = Math.floor(g.size / 2) * g.size + Math.floor(g.size / 2);
  if (g.moves.length === 0 && isLegal(g, centre)) return centre;

  const list = ranked(g);
  if (list.length === 0) {
    
    for (let i = 0; i < g.cells.length; i++) if (isLegal(g, i)) return i;
    throw new Error('no legal move');
  }
  const points = list.map((x) => x.i);

  
  const win = winningPoint(g, g.turn, points);
  if (win >= 0) return win;

  if (level === 'easy') {
    
    const top = list.slice(0, Math.min(6, list.length));
    return rng() < 0.3 ? top[0].i : top[Math.floor(rng() * top.length)].i;
  }

  
  
  const opp = other(g.turn);
  for (let i = 0; i < g.cells.length; i++) {
    if (g.cells[i] !== EMPTY || !isLegal(g, i)) continue;
    if (fiveAt(g.cells, g.size, i, opp, g.rules)) return i;
  }

  if (level === 'medium') {
    
    const bestV = list[0].v;
    const ties = list.filter((x) => x.v >= bestV - 1e-9);
    return ties[Math.floor(rng() * ties.length)].i;
  }

  
  let best = list[0].i;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  for (const { i } of list.slice(0, BRANCH)) {
    const v = -search(play(g, i), DEPTH - 1, -Infinity, -alpha);
    if (v > bestScore || (v === bestScore && rng() < 0.5)) { bestScore = v; best = i; }
    if (v > alpha) alpha = v;
  }
  return best;
}

export { BLACK, WHITE };
