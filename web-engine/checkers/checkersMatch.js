

































































import {
  SHEEP, COWS, FIRST, EMPTY, newBoard, legalMoves, capturesFor, applyMove,
  findMove, other, positionKey, isProgress, outcome, sideOf, isKing,
  mustCaptureWith, countPieces, RESULT,
} from './checkersRules.js';









export const CMSG = Object.freeze({
  HELLO: 'fch-hello',   
  LOG: 'fch-log',       
  ACT: 'fch-act',       
  SAY: 'fch-say',       
});


export const SEATS = 2;


export const SOLO = 'you';


export function createMatch({ seats = [SOLO, 'bot'] } = {}) {
  return { seats: seats.slice(0, SEATS), moves: [] };
}


export const sideOfSeat = (seat) => (seat === 0 ? SHEEP : COWS);

export const seatOfSide = (side) => (side === SHEEP ? 0 : 1);


export const seatOf = (state, id) => state.seats.indexOf(id);


export const isMyTurn = (state, id) => !state.over && state.seats[seatOfSide(state.turn)] === id;













export function replay({ seats = [SOLO, 'bot'], moves = [] } = {}) {
  let board = newBoard();
  let turn = FIRST;
  let idle = 0;
  const counts = new Map();
  const history = [];
  counts.set(positionKey(board, turn), 1);
  let repeats = 1;
  let broke = null;

  for (const wanted of moves) {
    const move = findMove(board, turn, wanted);
    if (!move) {
      
      
      
      
      
      broke = history.length;
      break;
    }
    const progress = isProgress(board, move);
    const side = turn;
    const promoted = move.crowned;
    board = applyMove(board, move);
    turn = other(turn);
    idle = progress ? 0 : idle + 1;
    if (progress) {
      
      
      
      counts.clear();
      repeats = 1;
    }
    const key = positionKey(board, turn);
    const seen = (counts.get(key) ?? 0) + 1;
    counts.set(key, seen);
    repeats = seen;
    history.push({
      ...move, side, crowned: promoted, ply: history.length, progress,
    });
  }

  const end = outcome({ board, turn, repeats, idle });
  const jumps = capturesFor(board, turn);
  return {
    seats: seats.slice(0, SEATS),
    board,
    turn,
    history,
    broke,
    idle,
    repeats,
    legal: end.over ? [] : legalMoves(board, turn),
    forced: end.over ? [] : mustCaptureWith(board, turn),
    mustCapture: !end.over && jumps.length > 0,
    counts: { [SHEEP]: countPieces(board, SHEEP), [COWS]: countPieces(board, COWS) },
    last: history.length ? history[history.length - 1] : null,
    over: end.over,
    draw: end.draw,
    winner: end.winner,
    reason: end.reason,
  };
}














export function applyAction(state, action) {
  if (state.over) return { error: 'The game is over. Start a new one.' };
  if (!action || action.kind !== 'move') return { error: 'That is not a move.' };
  if (action.by !== undefined && action.by !== null) {
    const seat = seatOf(state, action.by);
    if (seat < 0) return { error: 'You are watching this game, not playing it.' };
    if (sideOfSeat(seat) !== state.turn) return { error: 'It is not your turn yet.' };
  }
  const from = Number(action.from);
  const piece = state.board[from];
  if (piece === EMPTY || piece === undefined) return { error: 'There is no piece on that square.' };
  if (sideOf(piece) !== state.turn) return { error: 'That is not one of your pieces.' };
  const move = findMove(state.board, state.turn, action);
  if (!move) {
    if (state.mustCapture) {
      return {
        error: state.forced.includes(from)
          ? 'That piece must take, and that is not the jump.'
          : 'A take is on offer, so a take is the only move.',
      };
    }
    return { error: 'That piece cannot go there.' };
  }
  return { move, state: replay({ seats: state.seats, moves: [...historyMoves(state), wireMove(move)] }) };
}


export const wireMove = (m) => ({ from: m.from, to: m.to, path: [...m.path] });
const historyMoves = (state) => state.history.map(wireMove);








export function withMove(match, move) {
  return { seats: match.seats, moves: [...match.moves, wireMove(move)] };
}













export function undoPlies(state, { me = SOLO, bots = [] } = {}) {
  const n = state.history.length;
  if (!n) return 0;
  const opponent = state.seats.find((s) => s !== me);
  const soloish = bots.includes(opponent);
  if (!soloish) return 1;
  
  
  
  const lastBy = state.seats[seatOfSide(other(state.turn))];
  return lastBy === me ? 1 : Math.min(2, n);
}


export function undoMatch(match, count) {
  const keep = Math.max(0, match.moves.length - Math.max(0, count));
  return { seats: match.seats, moves: match.moves.slice(0, keep) };
}









export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id)) return seats;
  if (started) return seats;
  if (seats.length >= SEATS) {
    
    
    return [seats[0], id];
  }
  return [...seats, id];
}


export function standings(state) {
  return state.seats.map((id, seat) => {
    const side = sideOfSeat(seat);
    const { men, kings, total } = state.counts[side];
    return {
      id, seat, side, men, kings, left: total,
      
      
      
      taken: 12 - state.counts[other(side)].total,
      toMove: !state.over && state.turn === side,
    };
  });
}


export function winnerSeat(state) {
  if (!state.over || state.draw || state.winner === null) return null;
  return seatOfSide(state.winner);
}

export { RESULT, SHEEP, COWS, isKing };
