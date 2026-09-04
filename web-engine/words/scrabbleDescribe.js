




















import { SIZE, tileAt, premiumCharAt, VALUES, BLANK } from './scrabbleRules.js';
import { ACTIONS } from './scrabbleMatch.js';









export const coordOf = (row, col) => `${String.fromCharCode(65 + col)}${row + 1}`;


export function premiumName(row, col) {
  const ch = premiumCharAt(row, col);
  if (ch === 'T') return 'triple word';
  if (ch === 'D') return 'double word';
  if (ch === 't') return 'triple letter';
  if (ch === 'd') return 'double letter';
  if (ch === '*') return 'centre star';
  return '';
}


export function describeSquare(board, row, col) {
  const tile = tileAt(board, row, col);
  const where = coordOf(row, col);
  if (tile) return `${where}, ${tile.letter}${tile.blank ? ' on a blank' : ''}`;
  const premium = premiumName(row, col);
  return premium ? `${where}, ${premium}` : `${where}, empty`;
}









export const describeRack = (rack = []) => rack
  .map((t) => (t === BLANK ? 'blank' : t))
  .join(' ');


export function describeBoard(board) {
  const lines = [];
  for (let row = 0; row < SIZE; row += 1) {
    const cells = [];
    for (let col = 0; col < SIZE; col += 1) {
      const tile = tileAt(board, row, col);
      if (tile) cells.push(`${coordOf(row, col)} ${tile.letter}`);
    }
    if (cells.length) lines.push(`Row ${row + 1}: ${cells.join(', ')}`);
  }
  return lines.length ? lines : ['The board is empty. The first word goes through the star at H8.'];
}


export function describeWords(words = []) {
  if (!words.length) return '';
  const names = words.map((w) => (typeof w === 'string' ? w : w.word));
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}








export function describeLast(state, { me = null, nameOf = (id) => id } = {}) {
  const last = state?.last;
  if (!last) return '';
  const id = state.seats[last.seat];
  const who = id === me ? 'You' : nameOf(id);
  if (last.kind === ACTIONS.PASS) return `${who} passed.`;
  if (last.kind === ACTIONS.EXCHANGE) return `${who} swapped ${last.count} tile${last.count === 1 ? '' : 's'}.`;
  const bingo = last.bingo ? ' All seven tiles - fifty extra.' : '';
  return `${who} played ${describeWords(last.words)} for ${last.score}.${bingo}`;
}









export function describePending(pending = [], verdict = null) {
  if (!pending.length) return '';
  const where = `${coordOf(pending[0].row, pending[0].col)}`;
  const letters = pending.map((p) => p.letter).join('');
  if (!verdict) return `Laying ${letters} from ${where}.`;
  if (!verdict.ok) return `${letters} from ${where}. ${verdict.reason}`;
  const bingo = verdict.bingo ? ', including fifty for all seven tiles' : '';
  return `${describeWords(verdict.words)} from ${where}, ${verdict.score} points${bingo}. Press Play.`;
}


export function describeScores(state, { me = null, nameOf = (id) => id } = {}) {
  return state.seats
    .map((id, seat) => `${id === me ? 'You' : nameOf(id)} ${state.scores[seat]}`)
    .join(', ');
}


export function describeTurn(state, { me = null, nameOf = (id) => id } = {}) {
  if (state.over) return describeResult(state, { me, nameOf });
  const id = state.seats[state.turn];
  if (id === me) return 'Your turn.';
  return `${nameOf(id)} to play.`;
}









export function describeResult(state, { me = null, nameOf = (id) => id } = {}) {
  if (!state.over) return '';
  const rows = state.seats.map((id, seat) => ({ id, seat, score: state.scores[seat] }))
    .sort((a, b) => b.score - a.score);
  const top = rows[0];
  const drawn = rows.length > 1 && rows[1].score === top.score;
  const how = state.ending === 'stalled'
    ? 'Nobody could move, so that is the game.'
    : 'The bag is empty and somebody went out.';
  if (rows.length === 1) return `${how} You finished on ${top.score}.`;
  if (drawn) return `${how} A draw, on ${top.score}.`;
  const who = top.id === me ? 'You win' : `${nameOf(top.id)} wins`;
  return `${how} ${who} with ${top.score}.`;
}











export function describeMatch(state, {
  me = null, nameOf = (id) => id, pending = [], verdict = null, cursor = null, message = '',
} = {}) {
  const view = state;
  const lines = [
    `Scores: ${describeScores(view, { me, nameOf })}`,
    `${view.bag.length} tiles left in the bag.`,
  ];
  const seat = view.seats.indexOf(me);
  if (seat >= 0) lines.push(`Your tiles: ${describeRack(view.racks[seat])}`);
  if (cursor) lines.push(`Cursor on ${describeSquare(view.board, cursor.row, cursor.col)}.`);
  const laid = describePending(pending, verdict);
  if (laid) lines.push(laid);
  lines.push(...describeBoard(view.board));
  return {
    title: 'Farmy Scrabble',
    status: message || describeLast(view, { me, nameOf }) || describeTurn(view, { me, nameOf }),
    lines,
  };
}


export const valueOf = (letter) => VALUES[String(letter).toUpperCase()] ?? 0;
