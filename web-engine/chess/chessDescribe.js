























import {
  EMPTY, WHITE, BLACK, NAMES, squareName, kindOf, sideOf, rankOf, fileOf,
} from './position.js';
import { speakMove } from './notation.js';


export function pieceName(piece) {
  if (piece === EMPTY) return 'empty';
  return `${sideOf(piece) === WHITE ? 'white' : 'black'} ${NAMES[kindOf(piece)]}`;
}














export function describeBoard(pos) {
  const lines = [];
  for (let rank = 0; rank < 8; rank += 1) {
    const parts = [];
    for (let file = 0; file < 8; file += 1) {
      const sq = rank * 8 + file;
      const p = pos.board[sq];
      if (p !== EMPTY) parts.push(`${pieceName(p)} ${squareName(sq)}`);
    }
    lines.push(`Rank ${8 - rank}: ${parts.length ? parts.join(', ') : 'empty'}.`);
  }
  return lines;
}









export function describeSelection(pos, from, moves = []) {
  if (from === null || from === undefined || from < 0) return '';
  const piece = pos.board[from];
  if (piece === EMPTY) return `${squareName(from)} is empty.`;
  const mine = moves.filter((m) => m.from === from);
  if (!mine.length) return `${pieceName(piece)} on ${squareName(from)}. It has no legal move.`;
  
  
  
  const where = [...new Set(mine.map((m) => squareName(m.to)))].sort();
  const takes = [...new Set(mine.filter((m) => m.captured).map((m) => squareName(m.to)))].sort();
  const notes = [];
  if (takes.length) notes.push(`Takes on ${takes.join(', ')}.`);
  if (mine.some((m) => m.castle)) notes.push('Castling is available.');
  if (mine.some((m) => m.promo)) notes.push('This pawn promotes.');
  return `${pieceName(piece)} on ${squareName(from)}, selected. `
    + `${where.length} square${where.length === 1 ? '' : 's'}: ${where.join(', ')}. ${notes.join(' ')}`.trim();
}


export function describeCursor(pos, sq) {
  if (sq === null || sq === undefined || sq < 0) return '';
  const p = pos.board[sq];
  return p === EMPTY ? `${squareName(sq)}, empty.` : `${squareName(sq)}, ${pieceName(p)}.`;
}


export function describeLast(derived) {
  if (!derived.moves.length) return 'No moves yet.';
  const at = derived.positions[derived.positions.length - 2];
  return speakMove(at, derived.moves[derived.moves.length - 1]);
}


export function describeList(derived, limit = 0) {
  const rows = derived.list.map((r) => `${r.number}. ${r.white}${r.black ? ` ${r.black}` : ''}`);
  return limit > 0 ? rows.slice(-limit) : rows;
}


export function describeCaptures(derived) {
  const say = (list) => (list.length
    ? list.map((k) => NAMES[k]).join(', ')
    : 'nothing');
  return [
    `White has taken: ${say(derived.captured.white)}.`,
    `Black has taken: ${say(derived.captured.black)}.`,
  ];
}









export function describeGame({
  derived, me = null, names = {}, selected = -1, cursor = -1, message = '', bot = null,
} = {}) {
  const pos = derived.pos;
  const label = (id) => (id === me ? 'You' : (names[id] ?? 'The other player'));
  const seatLine = `White: ${label(derived.seats[0])}. Black: ${label(derived.seats[1])}.`;
  const whose = derived.over
    ? derived.outcome.text
    : `${derived.turn === WHITE ? 'White' : 'Black'} to move${derived.check ? ', and in check' : ''}.`;
  return {
    title: 'Farmy Chess',
    status: message || whose,
    lines: [
      seatLine,
      ...(bot ? [bot] : []),
      whose,
      describeLast(derived),
      describeSelection(pos, selected, derived.legal),
      describeCursor(pos, cursor),
      ...describeBoard(pos),
      ...describeCaptures(derived),
      `Material: white ${derived.material.white}, black ${derived.material.black}.`,
      ...describeList(derived, 6),
    ].filter(Boolean),
  };
}









export function asciiBoard(pos) {
  const out = [];
  for (let rank = 0; rank < 8; rank += 1) {
    let line = '';
    for (let file = 0; file < 8; file += 1) {
      const p = pos.board[rank * 8 + file];
      if (p === EMPTY) { line += '.'; continue; }
      const ch = ['', 'p', 'n', 'b', 'r', 'q', 'k'][kindOf(p)];
      line += p > 0 ? ch.toUpperCase() : ch;
    }
    out.push(line);
  }
  return out;
}


export const isDark = (sq) => (fileOf(sq) + rankOf(sq)) % 2 === 1;
