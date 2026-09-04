




















import {
  EMPTY, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
  WHITE, BLACK, WK, WQ, BK, BQ,
  fileOf, rankOf, squareAt, onBoard, sideOf, kindOf, squareName, squareFrom,
} from './position.js';


const KNIGHT_STEPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

const KING_STEPS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK_DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const BISHOP_DIRS = [[1, 1], [-1, 1], [-1, -1], [1, -1]];


export const PROMOTIONS = [QUEEN, ROOK, BISHOP, KNIGHT];












const RIGHTS_AT = new Map([
  [squareFrom('a1'), WQ], [squareFrom('h1'), WK], [squareFrom('e1'), WK | WQ],
  [squareFrom('a8'), BQ], [squareFrom('h8'), BK], [squareFrom('e8'), BK | BQ],
]);













export function isAttacked(board, sq, side) {
  const file = fileOf(sq);
  const rank = rankOf(sq);

  
  
  const pawnRank = side === WHITE ? rank + 1 : rank - 1;
  const pawn = side === WHITE ? PAWN : -PAWN;
  for (const df of [-1, 1]) {
    if (!onBoard(file + df, pawnRank)) continue;
    if (board[squareAt(file + df, pawnRank)] === pawn) return true;
  }

  const knight = side === WHITE ? KNIGHT : -KNIGHT;
  for (const [df, dr] of KNIGHT_STEPS) {
    if (!onBoard(file + df, rank + dr)) continue;
    if (board[squareAt(file + df, rank + dr)] === knight) return true;
  }

  const king = side === WHITE ? KING : -KING;
  for (const [df, dr] of KING_STEPS) {
    if (!onBoard(file + df, rank + dr)) continue;
    if (board[squareAt(file + df, rank + dr)] === king) return true;
  }

  for (const [df, dr] of ROOK_DIRS) {
    for (let f = file + df, r = rank + dr; onBoard(f, r); f += df, r += dr) {
      const p = board[squareAt(f, r)];
      if (p === EMPTY) continue;
      if (sideOf(p) === side && (kindOf(p) === ROOK || kindOf(p) === QUEEN)) return true;
      break;
    }
  }
  for (const [df, dr] of BISHOP_DIRS) {
    for (let f = file + df, r = rank + dr; onBoard(f, r); f += df, r += dr) {
      const p = board[squareAt(f, r)];
      if (p === EMPTY) continue;
      if (sideOf(p) === side && (kindOf(p) === BISHOP || kindOf(p) === QUEEN)) return true;
      break;
    }
  }
  return false;
}


function findKing(board, side) {
  const want = side === WHITE ? KING : -KING;
  for (let i = 0; i < 64; i += 1) if (board[i] === want) return i;
  return -1;
}


export function inCheck(pos, side = pos.turn) {
  const at = findKing(pos.board, side);
  return at >= 0 && isAttacked(pos.board, at, -side);
}

const move = (from, to, piece, captured, extra = {}) => ({
  from, to, piece, captured, promo: 0, castle: null, ep: false, double: false, ...extra,
});
















export function pseudoMoves(pos, { capturesOnly = false } = {}) {
  const { board, turn } = pos;
  const out = [];
  const forward = turn === WHITE ? -1 : 1;   
  const homeRank = turn === WHITE ? 6 : 1;
  const lastRank = turn === WHITE ? 0 : 7;

  for (let from = 0; from < 64; from += 1) {
    const piece = board[from];
    if (piece === EMPTY || sideOf(piece) !== turn) continue;
    const kind = kindOf(piece);
    const file = fileOf(from);
    const rank = rankOf(from);

    if (kind === PAWN) {
      const oneRank = rank + forward;
      if (onBoard(file, oneRank)) {
        const one = squareAt(file, oneRank);
        if (!capturesOnly && board[one] === EMPTY) {
          if (oneRank === lastRank) {
            for (const promo of PROMOTIONS) out.push(move(from, one, piece, EMPTY, { promo }));
          } else {
            out.push(move(from, one, piece, EMPTY));
            const twoRank = rank + forward * 2;
            if (rank === homeRank && board[squareAt(file, twoRank)] === EMPTY) {
              out.push(move(from, squareAt(file, twoRank), piece, EMPTY, { double: true }));
            }
          }
        }
        for (const df of [-1, 1]) {
          if (!onBoard(file + df, oneRank)) continue;
          const to = squareAt(file + df, oneRank);
          const target = board[to];
          if (target !== EMPTY && sideOf(target) !== turn) {
            if (oneRank === lastRank) {
              for (const promo of PROMOTIONS) out.push(move(from, to, piece, target, { promo }));
            } else {
              out.push(move(from, to, piece, target));
            }
          } else if (to === pos.ep && target === EMPTY) {
            
            
            out.push(move(from, to, piece, turn === WHITE ? -PAWN : PAWN, { ep: true }));
          }
        }
      }
      continue;
    }

    if (kind === KNIGHT || kind === KING) {
      const steps = kind === KNIGHT ? KNIGHT_STEPS : KING_STEPS;
      for (const [df, dr] of steps) {
        if (!onBoard(file + df, rank + dr)) continue;
        const to = squareAt(file + df, rank + dr);
        const target = board[to];
        if (sideOf(target) === turn) continue;
        if (capturesOnly && target === EMPTY) continue;
        out.push(move(from, to, piece, target));
      }
      continue;
    }

    const dirs = kind === ROOK ? ROOK_DIRS : kind === BISHOP ? BISHOP_DIRS : KING_STEPS;
    for (const [df, dr] of dirs) {
      for (let f = file + df, r = rank + dr; onBoard(f, r); f += df, r += dr) {
        const to = squareAt(f, r);
        const target = board[to];
        if (sideOf(target) === turn) break;
        if (!capturesOnly || target !== EMPTY) out.push(move(from, to, piece, target));
        if (target !== EMPTY) break;
      }
    }
  }

  if (!capturesOnly) for (const c of castles(pos)) out.push(c);
  return out;
}















function castles(pos) {
  const { board, turn, castling } = pos;
  const out = [];
  const back = turn === WHITE ? 7 : 0;
  const kingFrom = squareAt(4, back);
  if (board[kingFrom] !== (turn === WHITE ? KING : -KING)) return out;
  const rook = turn === WHITE ? ROOK : -ROOK;
  const them = -turn;
  if (isAttacked(board, kingFrom, them)) return out;

  const kingSide = turn === WHITE ? WK : BK;
  if (castling & kingSide && board[squareAt(7, back)] === rook) {
    const f = squareAt(5, back);
    const g = squareAt(6, back);
    if (board[f] === EMPTY && board[g] === EMPTY
      && !isAttacked(board, f, them) && !isAttacked(board, g, them)) {
      out.push(move(kingFrom, g, board[kingFrom], EMPTY, { castle: 'K' }));
    }
  }
  const queenSide = turn === WHITE ? WQ : BQ;
  if (castling & queenSide && board[squareAt(0, back)] === rook) {
    const b = squareAt(1, back);
    const c = squareAt(2, back);
    const d = squareAt(3, back);
    if (board[b] === EMPTY && board[c] === EMPTY && board[d] === EMPTY
      && !isAttacked(board, d, them) && !isAttacked(board, c, them)) {
      out.push(move(kingFrom, c, board[kingFrom], EMPTY, { castle: 'Q' }));
    }
  }
  return out;
}










export function makeMove(pos, m) {
  const board = pos.board.slice();
  const turn = pos.turn;
  board[m.from] = EMPTY;
  board[m.to] = m.promo ? (turn === WHITE ? m.promo : -m.promo) : m.piece;

  if (m.ep) {
    
    
    board[squareAt(fileOf(m.to), rankOf(m.from))] = EMPTY;
  }
  if (m.castle) {
    const back = turn === WHITE ? 7 : 0;
    const rookFrom = squareAt(m.castle === 'K' ? 7 : 0, back);
    const rookTo = squareAt(m.castle === 'K' ? 5 : 3, back);
    board[rookTo] = board[rookFrom];
    board[rookFrom] = EMPTY;
  }

  let castling = pos.castling;
  castling &= ~(RIGHTS_AT.get(m.from) ?? 0);
  castling &= ~(RIGHTS_AT.get(m.to) ?? 0);   

  
  
  
  
  
  
  
  let ep = -1;
  if (m.double) {
    const landed = m.to;
    const behind = squareAt(fileOf(m.to), rankOf(m.to) + (turn === WHITE ? 1 : -1));
    const enemyPawn = turn === WHITE ? -PAWN : PAWN;
    for (const df of [-1, 1]) {
      const f = fileOf(landed) + df;
      if (!onBoard(f, rankOf(landed))) continue;
      if (board[squareAt(f, rankOf(landed))] === enemyPawn) { ep = behind; break; }
    }
  }

  return {
    board,
    turn: -turn,
    castling,
    ep,
    
    half: (kindOf(m.piece) === PAWN || m.captured !== EMPTY) ? 0 : pos.half + 1,
    full: turn === BLACK ? pos.full + 1 : pos.full,
  };
}


export function legalMoves(pos, opts) {
  const out = [];
  for (const m of pseudoMoves(pos, opts)) {
    const next = makeMove(pos, m);
    const at = findKing(next.board, pos.turn);
    if (at < 0 || !isAttacked(next.board, at, -pos.turn)) out.push(m);
  }
  return out;
}










export function moveKey(m) {
  if (!m) return '';
  return `${squareName(m.from)}${squareName(m.to)}${m.promo ? PROMO_LETTER[m.promo] : ''}`;
}


export const PROMO_LETTER = { [QUEEN]: 'q', [ROOK]: 'r', [BISHOP]: 'b', [KNIGHT]: 'n' };
const PROMO_FROM_LETTER = { q: QUEEN, r: ROOK, b: BISHOP, n: KNIGHT };


export function moveFromKey(pos, key) {
  const s = String(key ?? '').toLowerCase();
  const from = squareFrom(s.slice(0, 2));
  const to = squareFrom(s.slice(2, 4));
  const promo = PROMO_FROM_LETTER[s[4]] ?? 0;
  if (from < 0 || to < 0) return null;
  return legalMoves(pos).find((m) => m.from === from && m.to === to && (m.promo || 0) === promo) ?? null;
}


export function movesFrom(pos, from) {
  return legalMoves(pos).filter((m) => m.from === from);
}





export function perft(pos, depth) {
  if (depth <= 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let total = 0;
  for (const m of moves) total += perft(makeMove(pos, m), depth - 1);
  return total;
}
