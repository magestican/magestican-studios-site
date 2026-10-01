



















































export const SIZE = 8;


export const SHEEP = 0;
export const COWS = 1;


export const EMPTY = '.';

export const MAN = Object.freeze(['s', 'c']);

export const KING = Object.freeze(['S', 'C']);


export const SIDE_NAMES = Object.freeze(['Sheep', 'Cows']);









export const FIRST = SHEEP;


export const CROWN_ROW = Object.freeze([0, SIZE - 1]);

export const idx = (row, col) => row * SIZE + col;
export const rowOf = (i) => Math.floor(i / SIZE);
export const colOf = (i) => i % SIZE;
export const onBoard = (row, col) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;


export const playable = (row, col) => (row + col) % 2 === 1;


export function sideOf(ch) {
  if (ch === MAN[SHEEP] || ch === KING[SHEEP]) return SHEEP;
  if (ch === MAN[COWS] || ch === KING[COWS]) return COWS;
  return -1;
}

export const isKing = (ch) => ch === KING[SHEEP] || ch === KING[COWS];
export const isEmpty = (ch) => ch === EMPTY;
export const other = (side) => (side === SHEEP ? COWS : SHEEP);





export function newBoard() {
  const board = new Array(SIZE * SIZE).fill(EMPTY);
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!playable(row, col)) continue;
      if (row < 3) board[idx(row, col)] = MAN[COWS];
      else if (row > SIZE - 4) board[idx(row, col)] = MAN[SHEEP];
    }
  }
  return board;
}









export function boardFrom(text) {
  const rows = String(text).trim().split('\n').map((l) => l.trim().replace(/\s+/g, ''));
  if (rows.length !== SIZE) throw new Error(`a board is ${SIZE} rows, got ${rows.length}`);
  const board = new Array(SIZE * SIZE).fill(EMPTY);
  rows.forEach((line, row) => {
    if (line.length !== SIZE) throw new Error(`row ${row} is ${line.length} wide`);
    [...line].forEach((ch, col) => {
      if (ch === '.' || ch === '-') return;
      if (sideOf(ch) < 0) throw new Error(`'${ch}' is not a piece`);
      board[idx(row, col)] = ch;
    });
  });
  return board;
}


export function boardText(board) {
  const out = [];
  for (let row = 0; row < SIZE; row += 1) {
    out.push(board.slice(row * SIZE, row * SIZE + SIZE).join(''));
  }
  return out.join('\n');
}







export function directionsFor(ch) {
  const side = sideOf(ch);
  if (side < 0) return [];
  if (isKing(ch)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return side === SHEEP ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}


export const crowns = (ch, at) => !isKing(ch) && rowOf(at) === CROWN_ROW[sideOf(ch)];








export function quietMoves(board, side) {
  const out = [];
  for (let from = 0; from < board.length; from += 1) {
    const ch = board[from];
    if (sideOf(ch) !== side) continue;
    const row = rowOf(from);
    const col = colOf(from);
    for (const [dr, dc] of directionsFor(ch)) {
      const r = row + dr;
      const c = col + dc;
      if (!onBoard(r, c)) continue;
      const to = idx(r, c);
      if (!isEmpty(board[to])) continue;
      out.push({
        from, to, path: [from, to], captured: [], crowned: crowns(ch, to),
      });
    }
  }
  return out;
}













function extend(board, at, ch, captured, path, out) {
  const side = sideOf(ch);
  const foe = other(side);
  const row = rowOf(at);
  const col = colOf(at);
  let grew = false;
  for (const [dr, dc] of directionsFor(ch)) {
    const mr = row + dr;
    const mc = col + dc;
    const lr = row + dr * 2;
    const lc = col + dc * 2;
    if (!onBoard(lr, lc)) continue;
    const over = idx(mr, mc);
    const land = idx(lr, lc);
    if (sideOf(board[over]) !== foe) continue;
    if (!isEmpty(board[land])) continue;
    grew = true;
    const took = [...captured, over];
    const walked = [...path, land];
    if (crowns(ch, land)) {
      
      
      out.push({ from: path[0], to: land, path: walked, captured: took, crowned: true });
      continue;
    }
    const next = board.slice();
    next[at] = EMPTY;
    next[over] = EMPTY;
    next[land] = ch;
    const before = out.length;
    extend(next, land, ch, took, walked, out);
    if (out.length === before) {
      
      out.push({ from: path[0], to: land, path: walked, captured: took, crowned: false });
    }
  }
  return grew;
}


export function capturesFor(board, side) {
  const out = [];
  for (let from = 0; from < board.length; from += 1) {
    const ch = board[from];
    if (sideOf(ch) !== side) continue;
    extend(board, from, ch, [], [from], out);
  }
  return out;
}










export function legalMoves(board, side) {
  const jumps = capturesFor(board, side);
  return jumps.length ? jumps : quietMoves(board, side);
}


export const mustCapture = (board, side) => capturesFor(board, side).length > 0;


export function mustCaptureWith(board, side) {
  const seen = new Set();
  for (const move of capturesFor(board, side)) seen.add(move.from);
  return [...seen].sort((a, b) => a - b);
}


export function sameMove(a, b) {
  if (!a || !b) return false;
  if (a.from !== b.from || a.to !== b.to) return false;
  const pa = a.path ?? [a.from, a.to];
  const pb = b.path ?? [b.from, b.to];
  if (pa.length !== pb.length) return false;
  return pa.every((v, i) => v === pb[i]);
}










export function findMove(board, side, wanted) {
  if (!wanted) return null;
  const moves = legalMoves(board, side);
  if (Array.isArray(wanted.path) && wanted.path.length > 2) {
    return moves.find((m) => sameMove(m, wanted)) ?? null;
  }
  const hits = moves.filter((m) => m.from === wanted.from && m.to === wanted.to);
  return hits.length === 1 ? hits[0] : (hits.find((m) => sameMove(m, wanted)) ?? null);
}







export function applyMove(board, move) {
  const next = board.slice();
  const ch = board[move.from];
  next[move.from] = EMPTY;
  for (const at of move.captured ?? []) next[at] = EMPTY;
  next[move.to] = crowns(ch, move.to) ? KING[sideOf(ch)] : ch;
  return next;
}


export function countPieces(board, side) {
  let men = 0;
  let kings = 0;
  for (const ch of board) {
    if (sideOf(ch) !== side) continue;
    if (isKing(ch)) kings += 1; else men += 1;
  }
  return { men, kings, total: men + kings };
}








export const positionKey = (board, turn) => `${board.join('')}|${turn}`;







export function isProgress(board, move) {
  if ((move.captured ?? []).length) return true;
  return !isKing(board[move.from]);
}






export const IDLE_LIMIT = 80;

export const REPETITION_LIMIT = 3;

export const RESULT = Object.freeze({
  BLOCKED: 'blocked',        
  REPETITION: 'repetition',  
  IDLE: 'idle',              
});
























export function outcome({ board, turn, repeats = 1, idle = 0 }) {
  if (!legalMoves(board, turn).length) {
    return { over: true, draw: false, winner: other(turn), reason: RESULT.BLOCKED };
  }
  if (repeats >= REPETITION_LIMIT) {
    return { over: true, draw: true, winner: null, reason: RESULT.REPETITION };
  }
  if (idle >= IDLE_LIMIT) {
    return { over: true, draw: true, winner: null, reason: RESULT.IDLE };
  }
  return { over: false, draw: false, winner: null, reason: null };
}
