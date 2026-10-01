




































export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;


export const WHITE = 1;
export const BLACK = -1;


export const WK = 1;
export const WQ = 2;
export const BK = 4;
export const BQ = 8;


const LETTERS = ['', 'p', 'n', 'b', 'r', 'q', 'k'];


export const NAMES = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];


export const SAN_LETTER = ['', '', 'N', 'B', 'R', 'Q', 'K'];

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';


export const fileOf = (sq) => sq & 7;

export const rankOf = (sq) => sq >> 3;

export const squareAt = (file, rank) => rank * 8 + file;

export const onBoard = (file, rank) => file >= 0 && file < 8 && rank >= 0 && rank < 8;


export function squareName(sq) {
  if (!Number.isInteger(sq) || sq < 0 || sq > 63) return '-';
  return `${'abcdefgh'[fileOf(sq)]}${8 - rankOf(sq)}`;
}


export function squareFrom(name) {
  const s = String(name ?? '').toLowerCase();
  if (s.length !== 2) return -1;
  const file = 'abcdefgh'.indexOf(s[0]);
  const rank = 8 - Number(s[1]);
  if (file < 0 || !Number.isInteger(rank) || rank < 0 || rank > 7) return -1;
  return squareAt(file, rank);
}


export const sideOf = (piece) => (piece > 0 ? WHITE : piece < 0 ? BLACK : 0);

export const kindOf = (piece) => (piece < 0 ? -piece : piece);











export function fromFen(fen = START_FEN) {
  const parts = String(fen).trim().split(/\s+/);
  const board = new Int8Array(64);
  let sq = 0;
  for (const ch of parts[0] ?? '') {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') { sq += Number(ch); continue; }
    const kind = LETTERS.indexOf(ch.toLowerCase());
    if (kind <= 0) throw new Error(`not a FEN piece: ${ch}`);
    if (sq > 63) throw new Error('FEN has more than 64 squares');
    board[sq] = ch === ch.toLowerCase() ? -kind : kind;
    sq += 1;
  }
  if (sq !== 64) throw new Error(`FEN covers ${sq} squares, not 64`);
  const rights = parts[2] ?? 'KQkq';
  return {
    board,
    turn: (parts[1] ?? 'w') === 'b' ? BLACK : WHITE,
    castling: (rights.includes('K') ? WK : 0) | (rights.includes('Q') ? WQ : 0)
      | (rights.includes('k') ? BK : 0) | (rights.includes('q') ? BQ : 0),
    ep: squareFrom(parts[3] ?? '-'),
    half: Number(parts[4] ?? 0) || 0,
    full: Number(parts[5] ?? 1) || 1,
  };
}


export function toFen(pos) {
  let out = '';
  for (let rank = 0; rank < 8; rank += 1) {
    let run = 0;
    for (let file = 0; file < 8; file += 1) {
      const p = pos.board[squareAt(file, rank)];
      if (p === EMPTY) { run += 1; continue; }
      if (run) { out += run; run = 0; }
      const letter = LETTERS[kindOf(p)];
      out += p > 0 ? letter.toUpperCase() : letter;
    }
    if (run) out += run;
    if (rank < 7) out += '/';
  }
  const rights = `${pos.castling & WK ? 'K' : ''}${pos.castling & WQ ? 'Q' : ''}`
    + `${pos.castling & BK ? 'k' : ''}${pos.castling & BQ ? 'q' : ''}`;
  return [
    out,
    pos.turn === WHITE ? 'w' : 'b',
    rights || '-',
    pos.ep >= 0 ? squareName(pos.ep) : '-',
    pos.half,
    pos.full,
  ].join(' ');
}


export function clone(pos) {
  return { ...pos, board: pos.board.slice() };
}












export function repetitionKey(pos) {
  let out = '';
  for (let i = 0; i < 64; i += 1) out += String.fromCharCode(pos.board[i] + 96);
  return `${out}|${pos.turn}|${pos.castling}|${pos.ep}`;
}


export function kingSquare(pos, side = pos.turn) {
  const want = side === WHITE ? KING : -KING;
  for (let i = 0; i < 64; i += 1) if (pos.board[i] === want) return i;
  return -1;
}


export function piecesOf(pos, side = pos.turn) {
  const out = [];
  for (let i = 0; i < 64; i += 1) if (sideOf(pos.board[i]) === side) out.push(i);
  return out;
}
