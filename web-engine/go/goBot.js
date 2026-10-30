













import {
  BLACK, PASS, EMPTY, KOMI, play as playPos, ownership, estimateDead, score, seededRng as rngFrom,
} from './goRules.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);
export const BUDGET = Object.freeze({
  easy: { playouts: 250, ms: 250 },
  medium: { playouts: 2500, ms: 1200 },
  hard: { playouts: 9000, ms: 3000 },
});
export const seededRng = (seed = 1) => rngFrom(seed);

const RAVE_K = 600;
const EXPLORE = 0.25;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

class Node {
  constructor(move, mover) {
    this.move = move;
    this.mover = mover; 
    this.children = null;
    this.n = 0;
    this.w = 0;
    this.rn = 0;
    this.rw = 0;
  }
}


function candidates(b, c) {
  const out = [];
  for (let p = 0; p < b.size; p += 1) if (b.cells[p] === EMPTY && p !== b.ko && !b.isEye(p, c)) out.push(p);
  return out;
}

function pick(node, parentN) {
  let best = null;
  let bestV = -Infinity;
  const logN = Math.log(parentN + 1);
  for (const ch of node.children) {
    let v;
    if (ch.n === 0 && ch.rn === 0) v = 1.2;
    else {
      const beta = Math.sqrt(RAVE_K / (3 * ch.n + RAVE_K));
      const q = ch.n ? ch.w / ch.n : 0.5;
      const r = ch.rn ? ch.rw / ch.rn : 0.5;
      v = (1 - beta) * q + beta * r + EXPLORE * Math.sqrt(logN / (ch.n + 1));
    }
    if (v > bestV) { bestV = v; best = ch; }
  }
  return best;
}






export function search(pos, { playouts = 2500, ms = 1500, rng = Math.random, komi = KOMI.japanese } = {}) {
  const me = pos.turn;
  const root = new Node(PASS, 3 - me);
  root.children = candidates(pos.board, me).filter((p) => playPos(pos, p)).map((p) => new Node(p, me));
  if (!root.children.length) return [];
  const size = pos.board.size;
  const first = new Int8Array(size); 
  const own = new Int8Array(size);
  const cand = new Int16Array(size);
  const path = [];
  const t0 = now();
  for (let it = 0; it < playouts; it += 1) {
    if ((it & 63) === 0 && it && now() - t0 > ms) break;
    const b = pos.board.clone();
    first.fill(0);
    path.length = 0;
    path.push(root);
    let node = root;
    let c = me;
    
    for (;;) {
      if (!node.children) {
        if (node.n < 1) break;
        node.children = candidates(b, c).map((p) => new Node(p, c));
        if (!node.children.length) break;
      }
      let ch = pick(node, node.n);
      while (ch && !b.play(ch.move, c)) {
        node.children.splice(node.children.indexOf(ch), 1);
        ch = node.children.length ? pick(node, node.n) : null;
      }
      if (!ch) break;
      if (!first[ch.move]) first[ch.move] = c;
      node = ch;
      path.push(node);
      c = 3 - c;
    }
    
    let passes = 0;
    for (let m = 0; m < size * 3 && passes < 2; m += 1) {
      let k = 0;
      for (let p = 0; p < size; p += 1) if (b.cells[p] === EMPTY && p !== b.ko && !b.isEye(p, c)) cand[k++] = p;
      let played = -1;
      while (k) {
        const i = Math.floor(rng() * k);
        const p = cand[i];
        if (b.play(p, c)) { played = p; break; }
        cand[i] = cand[--k];
      }
      if (played < 0) { b.play(PASS, c); passes += 1; } else {
        passes = 0;
        if (!first[played]) first[played] = c;
      }
      c = 3 - c;
    }
    
    ownership(b, own);
    let black = 0;
    let white = komi;
    for (let p = 0; p < size; p += 1) { if (own[p] === BLACK) black += 1; else if (own[p]) white += 1; }
    const winner = black > white ? BLACK : 3 - BLACK;
    
    for (const nd of path) {
      nd.n += 1;
      if (nd.mover === winner) nd.w += 1;
      if (!nd.children) continue;
      for (const ch of nd.children) {
        if (first[ch.move] === ch.mover) {
          ch.rn += 1;
          if (ch.mover === winner) ch.rw += 1;
        }
      }
    }
  }
  return root.children
    .map((ch) => ({ p: ch.move, visits: ch.n, rate: ch.n ? ch.w / ch.n : 0 }))
    .sort((a, b) => b.visits - a.visits || b.rate - a.rate);
}


export function passWins(pos, rules = 'japanese') {
  const dead = estimateDead(pos.board, pos.turn);
  const s = score(pos.board, { rules, dead });
  return s.winner === pos.turn;
}

function stoneCount(b) {
  let c = 0;
  for (let p = 0; p < b.size; p += 1) if (b.cells[p] !== 0) c += 1;
  return c;
}


export function chooseMove(pos, { level = 'medium', rng = Math.random, rules = 'japanese' } = {}) {
  const budget = BUDGET[level] || BUDGET.medium;
  
  
  
  if (pos.passes === 1 && stoneCount(pos.board) >= pos.board.n && passWins(pos, rules)) return PASS;
  const ranked = search(pos, { ...budget, rng, komi: KOMI[rules] });
  if (!ranked.length) return PASS;
  if (pos.passes === 1 && ranked[0].rate < 0.1) return PASS;
  return ranked[0].p;
}
