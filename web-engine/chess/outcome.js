




















import {
  EMPTY, PAWN, KNIGHT, BISHOP, KING, WHITE, BLACK,
  NAMES, kindOf, sideOf, squareName, repetitionKey, fileOf, rankOf,
} from './position.js';
import {
  legalMoves, pseudoMoves, inCheck, isAttacked,
} from './moves.js';


export const FIFTY_MOVE_PLIES = 100;

export const REPETITION_LIMIT = 3;












export function insufficientMaterial(pos) {
  const minor = [];
  for (let sq = 0; sq < 64; sq += 1) {
    const p = pos.board[sq];
    if (p === EMPTY) continue;
    const kind = kindOf(p);
    if (kind === KING) continue;
    if (kind !== BISHOP && kind !== KNIGHT) return false;   
    minor.push({ side: sideOf(p), kind, dark: (fileOf(sq) + rankOf(sq)) % 2 === 1 });
  }
  if (minor.length === 0) return true;                       
  if (minor.length === 1) return true;                       
  if (minor.length === 2
    && minor[0].kind === BISHOP && minor[1].kind === BISHOP
    && minor[0].side !== minor[1].side
    && minor[0].dark === minor[1].dark) return true;         
  return false;
}


export function repetitionCount(positions) {
  if (!positions.length) return 0;
  const key = repetitionKey(positions[positions.length - 1]);
  let n = 0;
  for (const p of positions) if (repetitionKey(p) === key) n += 1;
  return n;
}













export function outcomeOf(positions, { resigned = null } = {}) {
  const pos = positions[positions.length - 1];
  if (!pos) return { over: false, result: null, reason: null, text: '' };

  if (resigned) {
    const winner = resigned === WHITE ? BLACK : WHITE;
    return end(winner, 'resignation',
      `${side(resigned)} resigned. ${side(winner)} wins.`);
  }

  const moves = legalMoves(pos);
  if (!moves.length) {
    if (inCheck(pos)) {
      const winner = -pos.turn;
      return end(winner, 'checkmate', `Checkmate. ${side(winner)} wins.`);
    }
    return draw('stalemate',
      `Stalemate. ${side(pos.turn)} has no legal move and is not in check, so it is a draw.`);
  }
  if (insufficientMaterial(pos)) {
    return draw('material', 'A draw: neither side has enough pieces left to give checkmate.');
  }
  if (repetitionCount(positions) >= REPETITION_LIMIT) {
    return draw('repetition', 'A draw: the same position has come up three times.');
  }
  if (pos.half >= FIFTY_MOVE_PLIES) {
    return draw('fifty',
      'A draw: fifty moves each without a capture or a pawn move.');
  }
  return { over: false, result: null, reason: null, text: '' };
}

const side = (s) => (s === WHITE ? 'White' : 'Black');
const end = (winner, reason, text) => ({
  over: true, result: winner === WHITE ? '1-0' : '0-1', winner, reason, text,
});
const draw = (reason, text) => ({
  over: true, result: '1/2-1/2', winner: 0, reason, text,
});











export function drawWatch(positions) {
  const pos = positions[positions.length - 1];
  if (!pos) return null;
  const reps = repetitionCount(positions);
  if (reps === REPETITION_LIMIT - 1) {
    return 'That position has now come up twice. A third time is a draw.';
  }
  const movesLeft = Math.ceil((FIFTY_MOVE_PLIES - pos.half) / 2);
  if (pos.half >= 80 && movesLeft > 0) {
    return `${movesLeft} moves each left before the fifty-move draw.`;
  }
  return null;
}









export function refuse(pos, from, to) {
  
  
  
  
  
  if (!Number.isInteger(from) || !Number.isInteger(to)
    || from < 0 || from > 63 || to < 0 || to > 63) {
    return 'That is not a square on the board.';
  }
  const piece = pos.board[from];
  if (piece === EMPTY) return 'There is no piece on that square.';
  if (sideOf(piece) !== pos.turn) {
    return `That is ${side(-pos.turn)}'s piece, and it is ${side(pos.turn)} to move.`;
  }
  if (from === to) return 'A piece has to go somewhere.';

  const target = pos.board[to];
  if (sideOf(target) === pos.turn) {
    return `Your own ${NAMES[kindOf(target)]} is on ${squareName(to)}.`;
  }

  const legal = legalMoves(pos);
  if (legal.some((m) => m.from === from && m.to === to)) return null;

  
  
  
  if (kindOf(piece) === KING && Math.abs(fileOf(to) - fileOf(from)) === 2) {
    return castleRefusal(pos, from, to);
  }

  const pseudo = pseudoMoves(pos).some((m) => m.from === from && m.to === to);
  if (pseudo) {
    return inCheck(pos)
      ? 'Your king is in check, and that move does not deal with it.'
      : 'That move would leave your own king in check.';
  }
  if (inCheck(pos)) {
    return `Your king is in check. The ${NAMES[kindOf(piece)]} cannot reach ${squareName(to)} to stop it.`;
  }
  return `A ${NAMES[kindOf(piece)]} cannot move from ${squareName(from)} to ${squareName(to)}.`;
}


function castleRefusal(pos, from, to) {
  const kingSide = fileOf(to) > fileOf(from);
  const back = pos.turn === WHITE ? 7 : 0;
  const between = kingSide ? [5, 6] : [1, 2, 3];
  for (const f of between) {
    if (pos.board[f + back * 8] !== EMPTY) {
      return 'You cannot castle with a piece still between the king and the rook.';
    }
  }
  if (inCheck(pos)) return 'You cannot castle out of check.';
  const crossed = kingSide ? [5, 6] : [3, 2];
  for (const f of crossed) {
    if (isAttacked(pos.board, f + back * 8, -pos.turn)) {
      return 'You cannot castle through or into a square the other side attacks.';
    }
  }
  return 'You cannot castle on that side any more - the king or that rook has already moved.';
}









export function describeState(positions, { resigned = null, names = {} } = {}) {
  const outcome = outcomeOf(positions, { resigned });
  if (outcome.over) return outcome.text;
  const pos = positions[positions.length - 1];
  const who = names[pos.turn === WHITE ? 'white' : 'black'] ?? side(pos.turn);
  const warning = drawWatch(positions);
  const check = inCheck(pos) ? ' You are in check.' : '';
  return `${who} to move.${check}${warning ? ` ${warning}` : ''}`;
}


export function materialOf(pos) {
  const VALUE = [0, 1, 3, 3, 5, 9, 0];
  let white = 0;
  let black = 0;
  for (let i = 0; i < 64; i += 1) {
    const p = pos.board[i];
    if (p === EMPTY) continue;
    if (p > 0) white += VALUE[p]; else black += VALUE[-p];
  }
  return { white, black, lead: white - black };
}











export function capturedBy(moves = []) {
  const white = [];
  const black = [];
  for (const m of moves) {
    if (!m || !m.captured) continue;
    (sideOf(m.piece) === WHITE ? white : black).push(kindOf(m.captured));
  }
  const order = (list) => [...list].sort((a, b) => b - a);
  return { white: order(white), black: order(black) };
}
