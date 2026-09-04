





















import {
  PAWN, KING, SAN_LETTER, NAMES,
  fileOf, rankOf, squareName, kindOf, sideOf, WHITE,
} from './position.js';
import {
  legalMoves, makeMove, inCheck, PROMO_LETTER,
} from './moves.js';








export function toSan(pos, m, all = null) {
  if (!m) return '';
  if (m.castle === 'K') return decorate(pos, m, 'O-O');
  if (m.castle === 'Q') return decorate(pos, m, 'O-O-O');

  const kind = kindOf(m.piece);
  const takes = m.captured !== 0;
  let out = '';

  if (kind === PAWN) {
    
    
    if (takes) out += `${'abcdefgh'[fileOf(m.from)]}x`;
    out += squareName(m.to);
    if (m.promo) out += `=${PROMO_LETTER[m.promo].toUpperCase()}`;
  } else {
    out += SAN_LETTER[kind];
    out += disambiguate(pos, m, all);
    if (takes) out += 'x';
    out += squareName(m.to);
  }
  return decorate(pos, m, out);
}


function decorate(pos, m, text) {
  const next = makeMove(pos, m);
  if (!inCheck(next)) return text;
  return legalMoves(next).length ? `${text}+` : `${text}#`;
}







function disambiguate(pos, m, all) {
  const kind = kindOf(m.piece);
  if (kind === KING) return '';
  const moves = all ?? legalMoves(pos);
  const rivals = moves.filter((o) => o.to === m.to
    && o.from !== m.from
    && o.piece === m.piece);
  if (!rivals.length) return '';
  const sameFile = rivals.some((o) => fileOf(o.from) === fileOf(m.from));
  const sameRank = rivals.some((o) => rankOf(o.from) === rankOf(m.from));
  if (!sameFile) return 'abcdefgh'[fileOf(m.from)];
  if (!sameRank) return String(8 - rankOf(m.from));
  return squareName(m.from);
}









export function moveList(positions, moves) {
  const out = [];
  for (let i = 0; i < moves.length; i += 1) {
    const pos = positions[i];
    if (!pos) break;
    const san = toSan(pos, moves[i]);
    const number = Math.floor(i / 2) + 1;
    if (pos.turn === WHITE) out.push({ number, white: san, black: '' });
    else if (out.length) out[out.length - 1].black = san;
    else out.push({ number, white: '...', black: san });
  }
  return out;
}













export function speakMove(pos, m) {
  if (!m) return '';
  const who = sideOf(m.piece) === WHITE ? 'White' : 'Black';
  if (m.castle === 'K') return `${who} castles kingside.`;
  if (m.castle === 'Q') return `${who} castles queenside.`;
  const name = NAMES[kindOf(m.piece)];
  const from = squareName(m.from);
  const to = squareName(m.to);
  let out = `${who} ${name} ${from} to ${to}`;
  if (m.ep) out += `, taking the pawn en passant`;
  else if (m.captured) out += `, taking the ${NAMES[kindOf(m.captured)]}`;
  if (m.promo) out += `, promoting to a ${NAMES[m.promo]}`;
  const next = makeMove(pos, m);
  if (inCheck(next)) out += legalMoves(next).length ? '. Check' : '. Checkmate';
  return `${out}.`;
}
