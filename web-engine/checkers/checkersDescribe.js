

























import { t } from '../i18n/tr.js';
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


export const sideName = (side) => (side === SHEEP ? t('Sheep') : t('Cows'));
export const sideWord = (side) => (side === SHEEP ? t('sheep') : t('cows'));


const joinAnd = (names) => (names.length === 1
  ? names[0]
  : t('{list} and {last}', { list: names.slice(0, -1).join(t(', ')), last: names[names.length - 1] }));


export function pieceName(ch) {
  const side = sideOf(ch);
  if (side < 0) return null;
  if (side === SHEEP) return isKing(ch) ? t('sheep king') : t('sheep');
  return isKing(ch) ? t('cow king') : t('cow');
}


export function describeSquare(board, i) {
  const name = pieceName(board[i]);
  return name ? t('{name} on {square}', { name, square: squareName(i) }) : null;
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
    lines.push(t('Rank {n}: {on}', { n: SIZE - row, on: on.length ? on.join(t(', ')) : t('empty') }));
  }
  return lines;
}


export function describeCounts(state) {
  return [SHEEP, COWS].map((side) => {
    const { men, kings } = state.counts[side];
    const parts = [];
    if (men) parts.push(men === 1 ? t('{n} piece', { n: men }) : t('{n} pieces', { n: men }));
    if (kings) parts.push(kings === 1 ? t('{n} king', { n: kings }) : t('{n} kings', { n: kings }));
    return `${sideName(side)}: ${parts.length ? joinAnd(parts) : t('nothing left')}`;
  });
}









export function describeMove(entry) {
  if (!entry) return '';
  return `${sideName(entry.side)} ${describeMoveBody(entry)}`;
}


export function describeMoveBody(entry) {
  const took = entry.captured ?? [];
  const crowned = entry.crowned ? t(', and is crowned') : '';
  const [from, to] = [squareName(entry.from), squareName(entry.to)];
  if (!took.length) return t('{from} to {to}{crowned}.', { from, to, crowned });
  return t('{from} takes {list}, to {to}{crowned}.', { from, to, crowned, list: joinAnd(took.map(squareName)) });
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
    return t('{from} takes {list}, to {to}', { from: squareName(m.from), to: squareName(m.to), list: joinAnd((m.captured ?? []).map(squareName)) });
  });
}


export function describeOptions(board, side, from) {
  const moves = legalMoves(board, side).filter((m) => m.from === from);
  if (!moves.length) return [];
  return moves.map((m) => ((m.captured ?? []).length
    ? t('take to {to}, over {list}', { to: squareName(m.to), list: joinAnd(m.captured.map(squareName)) })
    : t('move to {to}', { to: squareName(m.to) })));
}


export function describeTurn(state, { me = null, nameOf = (id) => id } = {}) {
  if (state.over) return describeResult(state, { me, nameOf });
  const seat = seatOfSide(state.turn);
  const id = state.seats[seat];
  const side = sideWord(state.turn);
  const forced = state.mustCapture ? t(' A take is on offer, so a take is the only move.') : '';
  return id === me
    ? t('Your move, playing the {side}.{forced}', { side, forced })
    : t("{name}'s move, playing the {side}.{forced}", { name: nameOf(id), side, forced });
}


export function describeResult(state, { me = null, nameOf = (id) => id } = {}) {
  if (!state.over) return '';
  if (state.draw) {
    if (state.reason === RESULT.REPETITION) {
      return t('A draw: the same position for the third time.');
    }
    return t('A draw: forty moves each with nothing taken and no piece advanced.');
  }
  const seat = seatOfSide(state.winner);
  const id = state.seats[seat];
  const winner = id === me ? t('You') : nameOf(id);
  const side = sideWord(state.turn);
  const nothing = state.counts[state.turn].total === 0;
  const how = nothing ? t('the {side} have nothing left', { side }) : t('the {side} cannot move', { side });
  return t('{who} won: {how}.', { who: winner, how });
}







export function describeLast(state, { me = null, nameOf = (id) => id } = {}) {
  if (!state.last) return describeTurn(state, { me, nameOf });
  const seat = seatOfSide(state.last.side);
  const id = state.seats[seat];
  const who = id === me ? t('You') : nameOf(id);
  const move = describeMoveBody(state.last);
  const took = (state.last.captured ?? []).length;
  const gain = took ? (took === 1 ? t(' That is {n} piece.', { n: took }) : t(' That is {n} pieces.', { n: took })) : '';
  return t('{who} played {move}{gain} {turn}', { who, move, gain, turn: describeTurn(state, { me, nameOf }) }).trim();
}








export function describeMatch(state, {
  me = null, nameOf = (id) => id, selected = null, message = '',
} = {}) {
  const forced = describeForced(state);
  const lines = [
    describeTurn(state, { me, nameOf }),
    ...describeCounts(state),
    ...(forced.length ? [t('Takes available: {list}.', { list: forced.join(t('; ')) })] : []),
    ...(selected !== null && selected >= 0 && state.board[selected] !== EMPTY
      ? [`Selected: ${describeSquare(state.board, selected)}. From there you can ${describeOptions(state.board, state.turn, selected).join(', ') || 'do nothing'}.`]
      : []),
    ...describeBoard(state.board),
    ...(state.history.length ? [t('Moves so far:'), ...moveList(state)] : [t('No moves yet.')]),
  ];
  return {
    title: 'Jumpwise',
    status: message || describeLast(state, { me, nameOf }),
    lines,
  };
}

export { SIDE_NAMES, sideOfSeat };
