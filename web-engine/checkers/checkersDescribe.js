

























import {
  SIZE, SHEEP, COWS, SIDE_NAMES, EMPTY, rowOf, colOf, sideOf, isKing,
  legalMoves, RESULT,
} from './checkersRules.js';
import { sideOfSeat, seatOfSide } from './checkersMatch.js';


export function squareName(i) {
  if (!Number.isInteger(i) || i < 0 || i >= SIZE * SIZE) return '??';
  return `${String.fromCharCode(65 + colOf(i))}${SIZE - rowOf(i)}`;
}


export const FILES = Object.freeze([...'ABCDEFGH']);

export const RANKS = Object.freeze([8, 7, 6, 5, 4, 3, 2, 1]);


export function pieceName(ch) {
  const side = sideOf(ch);
  if (side < 0) return null;
  const one = side === SHEEP ? 'sheep' : 'cow';
  return isKing(ch) ? `${one} king` : one;
}


export function describeSquare(board, i) {
  const name = pieceName(board[i]);
  return name ? `${name} on ${squareName(i)}` : null;
}








export function describeBoard(board) {
  const lines = [];
  for (let row = 0; row < SIZE; row += 1) {
    const on = [];
    for (let col = 0; col < SIZE; col += 1) {
      const at = row * SIZE + col;
      const name = pieceName(board[at]);
      if (name) on.push(`${name} ${squareName(at)}`);
    }
    lines.push(`Rank ${SIZE - row}: ${on.length ? on.join(', ') : 'empty'}`);
  }
  return lines;
}


export function describeCounts(state) {
  return [SHEEP, COWS].map((side) => {
    const { men, kings } = state.counts[side];
    const parts = [];
    if (men) parts.push(`${men} ${men === 1 ? 'piece' : 'pieces'}`);
    if (kings) parts.push(`${kings} ${kings === 1 ? 'king' : 'kings'}`);
    return `${SIDE_NAMES[side]}: ${parts.length ? parts.join(' and ') : 'nothing left'}`;
  });
}









export function describeMove(entry) {
  if (!entry) return '';
  const who = SIDE_NAMES[entry.side];
  const took = entry.captured ?? [];
  const crowned = entry.crowned ? ', and is crowned' : '';
  if (!took.length) return `${who} ${squareName(entry.from)} to ${squareName(entry.to)}${crowned}.`;
  const names = took.map(squareName);
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${who} ${squareName(entry.from)} takes ${list}, to ${squareName(entry.to)}${crowned}.`;
}


export function moveList(state) {
  const out = [];
  state.history.forEach((entry, ply) => {
    const number = Math.floor(ply / 2) + 1;
    const prefix = ply % 2 === 0 ? `${number}.` : `${number}...`;
    out.push(`${prefix} ${describeMove(entry)}`);
  });
  return out;
}







export function describeForced(state) {
  if (!state.mustCapture) return [];
  return state.legal.map((m) => {
    const names = (m.captured ?? []).map(squareName);
    const list = names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    return `${squareName(m.from)} takes ${list}, to ${squareName(m.to)}`;
  });
}


export function describeOptions(board, side, from) {
  const moves = legalMoves(board, side).filter((m) => m.from === from);
  if (!moves.length) return [];
  return moves.map((m) => ((m.captured ?? []).length
    ? `take to ${squareName(m.to)}, over ${(m.captured).map(squareName).join(' and ')}`
    : `move to ${squareName(m.to)}`));
}


export function describeTurn(state, { me = null, nameOf = (id) => id } = {}) {
  if (state.over) return describeResult(state, { me, nameOf });
  const seat = seatOfSide(state.turn);
  const id = state.seats[seat];
  const who = id === me ? 'Your' : `${nameOf(id)}'s`;
  const side = SIDE_NAMES[state.turn];
  const forced = state.mustCapture ? ' A take is on offer, so a take is the only move.' : '';
  return `${who} move, playing the ${side.toLowerCase()}.${forced}`;
}


export function describeResult(state, { me = null, nameOf = (id) => id } = {}) {
  if (!state.over) return '';
  if (state.draw) {
    if (state.reason === RESULT.REPETITION) {
      return 'A draw: the same position for the third time.';
    }
    return 'A draw: forty moves each with nothing taken and no piece advanced.';
  }
  const seat = seatOfSide(state.winner);
  const id = state.seats[seat];
  const winner = id === me ? 'You' : nameOf(id);
  const loserSide = SIDE_NAMES[state.turn].toLowerCase();
  const nothing = state.counts[state.turn].total === 0;
  const how = nothing ? `the ${loserSide} have nothing left` : `the ${loserSide} cannot move`;
  return `${winner} won: ${how}.`;
}







export function describeLast(state, { me = null, nameOf = (id) => id } = {}) {
  if (!state.last) return describeTurn(state, { me, nameOf });
  const seat = seatOfSide(state.last.side);
  const id = state.seats[seat];
  const who = id === me ? 'You' : nameOf(id);
  const move = describeMove(state.last).replace(/^\w+ /, '');
  const took = (state.last.captured ?? []).length;
  const gain = took ? ` That is ${took} ${took === 1 ? 'piece' : 'pieces'}.` : '';
  return `${who} played ${move}${gain} ${describeTurn(state, { me, nameOf })}`.trim();
}








export function describeMatch(state, {
  me = null, nameOf = (id) => id, selected = null, message = '',
} = {}) {
  const forced = describeForced(state);
  const lines = [
    describeTurn(state, { me, nameOf }),
    ...describeCounts(state),
    ...(forced.length ? [`Takes available: ${forced.join('; ')}.`] : []),
    ...(selected !== null && selected >= 0 && state.board[selected] !== EMPTY
      ? [`Selected: ${describeSquare(state.board, selected)}. From there you can ${describeOptions(state.board, state.turn, selected).join(', ') || 'do nothing'}.`]
      : []),
    ...describeBoard(state.board),
    ...(state.history.length ? ['Moves so far:', ...moveList(state)] : ['No moves yet.']),
  ];
  return {
    title: 'Farmy Checkers',
    status: message || describeLast(state, { me, nameOf }),
    lines,
  };
}

export { SIDE_NAMES, sideOfSeat };
