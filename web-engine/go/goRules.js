












export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const PASS = -1;
export const SIZES = Object.freeze([9, 13, 19]);
export const RULES = Object.freeze(['japanese', 'chinese']);

export const KOMI = Object.freeze({ japanese: 6.5, chinese: 7.5 });
export const other = (c) => 3 - c;



const TABLES = new Map();
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}
export function tables(n) {
  let t = TABLES.get(n);
  if (t) return t;
  const size = n * n;
  const nbr = new Int16Array(size * 4).fill(-1);
  const diag = new Int16Array(size * 4).fill(-1);
  for (let p = 0; p < size; p += 1) {
    const r = Math.floor(p / n);
    const c = p % n;
    const o = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const d = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let k = 0; k < 4; k += 1) {
      const [dr, dc] = o[k];
      if (r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n) nbr[p * 4 + k] = (r + dr) * n + c + dc;
      const [er, ec] = d[k];
      if (r + er >= 0 && r + er < n && c + ec >= 0 && c + ec < n) diag[p * 4 + k] = (r + er) * n + c + ec;
    }
  }
  
  
  const rnd = mulberry(0x60 + n);
  const z1 = new Uint32Array(size * 3);
  const z2 = new Uint32Array(size * 3);
  for (let i = 0; i < size * 3; i += 1) { z1[i] = rnd(); z2[i] = rnd(); }
  t = { n, size, nbr, diag, z1, z2 };
  TABLES.set(n, t);
  return t;
}



export class Board {
  constructor(n) {
    this.t = tables(n);
    this.n = n;
    this.size = n * n;
    this.cells = new Int8Array(this.size);
    this.ko = -1; 
    this.h1 = 0;
    this.h2 = 0;
    this.caps = [0, 0, 0]; 
    this.mark = new Int32Array(this.size);
    this.stamp = 1;
    this.stack = new Int16Array(this.size);
  }

  clone() {
    const b = new Board(this.n);
    b.cells.set(this.cells);
    b.ko = this.ko;
    b.h1 = this.h1;
    b.h2 = this.h2;
    b.caps = [...this.caps];
    return b;
  }

  key() { return `${this.h1.toString(36)}.${this.h2.toString(36)}`; }

  setStone(p, c) {
    const { z1, z2 } = this.t;
    const old = this.cells[p];
    if (old) { this.h1 ^= z1[p * 3 + old]; this.h2 ^= z2[p * 3 + old]; }
    this.cells[p] = c;
    if (c) { this.h1 ^= z1[p * 3 + c]; this.h2 ^= z2[p * 3 + c]; }
  }

  
  hasLiberty(p) {
    const { cells, mark, stack } = this;
    const { nbr } = this.t;
    const c = cells[p];
    this.stamp += 1;
    const s = this.stamp;
    let top = 0;
    stack[top++] = p;
    mark[p] = s;
    while (top) {
      const q = stack[--top];
      for (let k = q * 4; k < q * 4 + 4; k += 1) {
        const r = nbr[k];
        if (r < 0) continue;
        const v = cells[r];
        if (v === EMPTY) return true;
        if (v === c && mark[r] !== s) { mark[r] = s; stack[top++] = r; }
      }
    }
    return false;
  }

  
  chain(p) {
    const c = this.cells[p];
    if (!c) return { stones: [], libs: [] };
    const { nbr } = this.t;
    const seen = new Set([p]);
    const libs = new Set();
    const todo = [p];
    while (todo.length) {
      const q = todo.pop();
      for (let k = q * 4; k < q * 4 + 4; k += 1) {
        const r = nbr[k];
        if (r < 0) continue;
        if (this.cells[r] === EMPTY) libs.add(r);
        else if (this.cells[r] === c && !seen.has(r)) { seen.add(r); todo.push(r); }
      }
    }
    return { stones: [...seen].sort((a, b) => a - b), libs: [...libs].sort((a, b) => a - b) };
  }

  removeChain(p) {
    const { nbr } = this.t;
    const c = this.cells[p];
    let count = 0;
    const todo = [p];
    this.setStone(p, EMPTY);
    while (todo.length) {
      const q = todo.pop();
      count += 1;
      for (let k = q * 4; k < q * 4 + 4; k += 1) {
        const r = nbr[k];
        if (r >= 0 && this.cells[r] === c) { this.setStone(r, EMPTY); todo.push(r); }
      }
    }
    return count;
  }

  




  play(p, c) {
    if (p === PASS) { this.ko = -1; return true; }
    if (this.cells[p] !== EMPTY || p === this.ko) return false;
    const { nbr } = this.t;
    const o = 3 - c;
    this.setStone(p, c);
    let captured = 0;
    let capturedAt = -1;
    for (let k = p * 4; k < p * 4 + 4; k += 1) {
      const r = nbr[k];
      if (r >= 0 && this.cells[r] === o && !this.hasLiberty(r)) {
        const got = this.removeChain(r);
        captured += got;
        capturedAt = r;
      }
    }
    if (!captured && !this.hasLiberty(p)) {
      this.setStone(p, EMPTY);
      return false;
    }
    this.caps[c] += captured;
    
    this.ko = -1;
    if (captured === 1) {
      let lone = true;
      let libs = 0;
      for (let k = p * 4; k < p * 4 + 4; k += 1) {
        const r = nbr[k];
        if (r < 0) continue;
        if (this.cells[r] === c) lone = false;
        else if (this.cells[r] === EMPTY) libs += 1;
      }
      if (lone && libs === 1) this.ko = capturedAt;
    }
    return true;
  }

  
  isEye(p, c) {
    if (this.cells[p] !== EMPTY) return false;
    const { nbr, diag } = this.t;
    let edge = false;
    for (let k = p * 4; k < p * 4 + 4; k += 1) {
      const r = nbr[k];
      if (r < 0) { edge = true; continue; }
      if (this.cells[r] !== c) return false;
    }
    let bad = 0;
    for (let k = p * 4; k < p * 4 + 4; k += 1) {
      const r = diag[k];
      if (r >= 0 && this.cells[r] === 3 - c) bad += 1;
    }
    return edge ? bad === 0 : bad < 2;
  }

  toString() {
    let s = '';
    for (let p = 0; p < this.size; p += 1) s += '.bw'[this.cells[p]];
    return s;
  }
}


export function boardFrom(rows) {
  const flat = (Array.isArray(rows) ? rows.join('') : rows).replace(/\s+/g, '');
  const n = Math.round(Math.sqrt(flat.length));
  if (n * n !== flat.length || n < 1 || n > 19) throw new Error(`not a square board: ${flat.length} points`);
  const b = new Board(n);
  for (let p = 0; p < flat.length; p += 1) {
    const ch = flat[p];
    if ('bxX'.includes(ch)) b.setStone(p, BLACK);
    else if ('woO'.includes(ch)) b.setStone(p, WHITE);
    else if (ch !== '.' && ch !== '+') throw new Error(`bad point "${ch}"`);
  }
  return b;
}



export function createPosition(n = 9, { board = null, turn = BLACK } = {}) {
  if (!board && !SIZES.includes(n)) throw new Error(`board size ${n} is not offered`);
  const b = board ? board.clone() : new Board(n);
  return { n: b.n, board: b, turn, passes: 0, seen: new Set([b.key()]), plies: 0 };
}


export function play(pos, p) {
  if (p === PASS) {
    const b = pos.board.clone();
    b.play(PASS, pos.turn);
    return { ...pos, board: b, turn: other(pos.turn), passes: pos.passes + 1, plies: pos.plies + 1 };
  }
  if (!Number.isInteger(p) || p < 0 || p >= pos.board.size) return null;
  const b = pos.board.clone();
  if (!b.play(p, pos.turn)) return null;
  const k = b.key();
  if (pos.seen.has(k)) return null; 
  const seen = new Set(pos.seen);
  seen.add(k);
  return { n: pos.n, board: b, turn: other(pos.turn), passes: 0, seen, plies: pos.plies + 1 };
}

export const isLegal = (pos, p) => p === PASS || play(pos, p) !== null;


export function legalPoints(pos) {
  const out = [];
  for (let p = 0; p < pos.board.size; p += 1) if (pos.board.cells[p] === EMPTY && play(pos, p)) out.push(p);
  return out;
}



const LETTERS = 'abcdefghijklmnopqrs';
export function toSgf(p, n) {
  if (p === PASS) return 'pass';
  return LETTERS[p % n] + LETTERS[Math.floor(p / n)];
}
export function fromSgf(s, n) {
  if (s === 'pass') return PASS;
  if (typeof s !== 'string' || s.length !== 2) return null;
  const c = LETTERS.indexOf(s[0]);
  const r = LETTERS.indexOf(s[1]);
  if (c < 0 || r < 0 || c >= n || r >= n) return null;
  return r * n + c;
}

export function label(p, n) {
  if (p === PASS) return 'pass';
  return 'ABCDEFGHJKLMNOPQRST'[p % n] + String(n - Math.floor(p / n));
}












export function score(board, { rules = 'japanese', dead = [], komi = KOMI[rules] } = {}) {
  const b = board.clone();
  const deadBy = [0, 0, 0]; 
  for (const p of dead) {
    const c = b.cells[p];
    if (c) { deadBy[c] += 1; b.setStone(p, EMPTY); }
  }
  const { nbr } = b.t;
  const owner = new Int8Array(b.size);
  const terr = [0, 0, 0];
  const stones = [0, 0, 0];
  const seen = new Uint8Array(b.size);
  for (let p = 0; p < b.size; p += 1) {
    const c = b.cells[p];
    if (c) { stones[c] += 1; owner[p] = c; continue; }
    if (seen[p]) continue;
    const region = [p];
    seen[p] = 1;
    let touches = 0;
    for (let i = 0; i < region.length; i += 1) {
      const q = region[i];
      for (let k = q * 4; k < q * 4 + 4; k += 1) {
        const r = nbr[k];
        if (r < 0) continue;
        const v = b.cells[r];
        if (v) touches |= v;
        else if (!seen[r]) { seen[r] = 1; region.push(r); }
      }
    }
    const who = touches === BLACK || touches === WHITE ? touches : 0;
    for (const q of region) owner[q] = who;
    if (who) terr[who] += region.length;
  }
  let black;
  let white;
  if (rules === 'chinese') {
    black = stones[BLACK] + terr[BLACK];
    white = stones[WHITE] + terr[WHITE] + komi;
  } else {
    black = terr[BLACK] + board.caps[BLACK] + deadBy[WHITE];
    white = terr[WHITE] + board.caps[WHITE] + deadBy[BLACK] + komi;
  }
  const winner = black > white ? BLACK : white > black ? WHITE : 0;
  return { black, white, komi, winner, margin: Math.abs(black - white), owner: [...owner], terr, stones, deadBy };
}







export function playout(b, turn, rng, cap = b.size * 3, cand = new Int16Array(b.size)) {
  let passes = 0;
  let c = turn;
  for (let m = 0; m < cap && passes < 2; m += 1) {
    let k = 0;
    for (let p = 0; p < b.size; p += 1) if (b.cells[p] === EMPTY && p !== b.ko && !b.isEye(p, c)) cand[k++] = p;
    let played = false;
    while (k) {
      const i = Math.floor(rng() * k);
      const p = cand[i];
      if (b.play(p, c)) { played = true; break; }
      cand[i] = cand[--k];
    }
    if (played) passes = 0;
    else { b.play(PASS, c); passes += 1; }
    c = 3 - c;
  }
  return c;
}


export function ownership(b, into) {
  const { nbr } = b.t;
  for (let p = 0; p < b.size; p += 1) {
    const v = b.cells[p];
    if (v) { into[p] = v; continue; }
    let touches = 0;
    for (let k = p * 4; k < p * 4 + 4; k += 1) {
      const r = nbr[k];
      if (r >= 0) touches |= b.cells[r];
    }
    into[p] = touches === 1 || touches === 2 ? touches : 0;
  }
  return into;
}

export function seededRng(seed) {
  const next = mulberry(seed);
  return () => next() / 4294967296;
}

export const DEAD_PLAYOUTS = 160;
export const DEAD_SHARE = 0.7;






export function estimateDead(board, turn = BLACK, { playouts = DEAD_PLAYOUTS, share = DEAD_SHARE } = {}) {
  const rng = seededRng((board.h1 ^ Math.imul(board.h2, 31)) >>> 0);
  const lost = new Int32Array(board.size);
  const own = new Int8Array(board.size);
  const cand = new Int16Array(board.size);
  for (let i = 0; i < playouts; i += 1) {
    const b = board.clone();
    playout(b, turn, rng, board.size * 3, cand);
    ownership(b, own);
    for (let p = 0; p < board.size; p += 1) {
      const c = board.cells[p];
      if (c && own[p] === 3 - c) lost[p] += 1;
    }
  }
  const dead = [];
  const done = new Uint8Array(board.size);
  for (let p = 0; p < board.size; p += 1) {
    if (!board.cells[p] || done[p]) continue;
    const { stones } = board.chain(p);
    let sum = 0;
    for (const q of stones) { done[q] = 1; sum += lost[q]; }
    if (sum / stones.length >= share * playouts) dead.push(...stones);
  }
  return dead.sort((a, b) => a - b);
}




export function countLegalPositions(n) {
  const b = new Board(n);
  const total = 3 ** b.size;
  let legal = 0;
  const digits = new Int8Array(b.size);
  for (let i = 0; i < total; i += 1) {
    let ok = true;
    for (let p = 0; p < b.size && ok; p += 1) if (b.cells[p] && !b.hasLiberty(p)) ok = false;
    if (ok) legal += 1;
    
    for (let p = 0; p < b.size; p += 1) {
      digits[p] = (digits[p] + 1) % 3;
      b.cells[p] = digits[p];
      if (digits[p]) break;
    }
  }
  return legal;
}
