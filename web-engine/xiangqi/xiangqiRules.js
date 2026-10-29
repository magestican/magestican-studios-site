
















export const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
export const ROWS = 10;
export const COLS = 9;
export const SIZE = 90;

const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const HORSE = [
  [[-1, 0], [[-2, -1], [-2, 1]]],
  [[1, 0], [[2, -1], [2, 1]]],
  [[0, -1], [[-1, -2], [1, -2]]],
  [[0, 1], [[-1, 2], [1, 2]]],
];

export const ownerOf = (p) => (p === p.toUpperCase() ? 'r' : 'b');
export const typeOf = (p) => p.toUpperCase();
export const other = (c) => (c === 'r' ? 'b' : 'r');
const pieceFor = (type, color) => (color === 'r' ? type : type.toLowerCase());

export const rowOf = (sq) => Math.floor(sq / COLS);
export const colOf = (sq) => sq % COLS;
const on = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

export const sqName = (sq) => `${'abcdefghi'[colOf(sq)]}${9 - rowOf(sq)}`;
export const sqFromName = (s) => (9 - Number(s[1])) * COLS + (s.charCodeAt(0) - 97);



const inPalace = (r, c, color) => c >= 3 && c <= 5 && (color === 'r' ? r >= 7 && r <= 9 : r >= 0 && r <= 2);

const homeSide = (r, color) => (color === 'r' ? r >= 5 : r <= 4);

const LETTER = { E: 'B', H: 'N', e: 'b', h: 'n' };

export function parseFen(fen) {
  const parts = fen.trim().split(/\s+/);
  const rows = parts[0].split('/');
  if (rows.length !== ROWS) throw new Error(`bad fen board: ${parts[0]}`);
  const board = new Array(SIZE).fill(null);
  rows.forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { c += Number(ch); continue; }
      const p = LETTER[ch] || ch;
      if (!/^[KABNRCPkabnrcp]$/.test(p)) throw new Error(`bad fen piece ${ch}`);
      if (c >= COLS) throw new Error(`bad fen row ${r}: ${row}`);
      board[r * COLS + c] = p;
      c += 1;
    }
    if (c !== COLS) throw new Error(`bad fen row ${r}: ${row}`);
  });
  const side = (parts[1] || 'w').toLowerCase();
  const turn = side === 'b' ? 'b' : 'r';
  const idle = Number(parts[4] ?? 0) || 0;
  const move = Number(parts[5] ?? 1) || 1;
  return { board, turn, idle, move, kings: { r: board.indexOf('K'), b: board.indexOf('k') } };
}

export function toFen(pos) {
  const rows = [];
  for (let r = 0; r < ROWS; r += 1) {
    let s = '';
    let empty = 0;
    for (let c = 0; c < COLS; c += 1) {
      const p = pos.board[r * COLS + c];
      if (!p) { empty += 1; continue; }
      if (empty) { s += empty; empty = 0; }
      s += p;
    }
    if (empty) s += empty;
    rows.push(s);
  }
  return `${rows.join('/')} ${pos.turn === 'r' ? 'w' : 'b'} - - ${pos.idle} ${pos.move}`;
}


export const positionKey = (pos) => {
  const s = toFen(pos);
  return s.slice(0, s.indexOf(' - '));
};

export function clonePos(pos) {
  return { board: pos.board.slice(), turn: pos.turn, idle: pos.idle, move: pos.move, kings: { ...pos.kings } };
}







export function attacked(pos, sq, by) {
  const { board } = pos;
  const r0 = rowOf(sq);
  const c0 = colOf(sq);
  for (const [dr, dc] of ORTH) {
    let r = r0 + dr;
    let c = c0 + dc;
    let screens = 0;
    while (on(r, c)) {
      const p = board[r * COLS + c];
      if (p) {
        if (screens === 0) {
          if (ownerOf(p) === by) {
            const t = typeOf(p);
            if (t === 'R') return true;
            if (t === 'K' && dc === 0) return true; 
          }
          screens = 1;
        } else {
          if (ownerOf(p) === by && typeOf(p) === 'C') return true;
          break;
        }
      }
      r += dr;
      c += dc;
    }
  }
  
  for (const [[lr, lc], lands] of HORSE) {
    for (const [dr, dc] of lands) {
      const hr = r0 - dr;
      const hc = c0 - dc;
      if (!on(hr, hc)) continue;
      const p = board[hr * COLS + hc];
      if (!p || ownerOf(p) !== by || typeOf(p) !== 'N') continue;
      if (!board[(hr + lr) * COLS + (hc + lc)]) return true;
    }
  }
  
  const f = by === 'r' ? 1 : -1; 
  const soldier = pieceFor('P', by);
  if (on(r0 + f, c0) && board[(r0 + f) * COLS + c0] === soldier) return true;
  if (!homeSide(r0, by)) {
    if (c0 > 0 && board[r0 * COLS + c0 - 1] === soldier) return true;
    if (c0 < COLS - 1 && board[r0 * COLS + c0 + 1] === soldier) return true;
  }
  return false;
}

export const inCheck = (pos, color) => pos.kings[color] >= 0 && attacked(pos, pos.kings[color], other(color));


export function legalMoves(pos) {
  const out = [];
  for (const m of pseudoMoves(pos)) if (isLegal(pos, m)) out.push(m);
  return out;
}

export function hasLegalMove(pos) {
  for (const m of pseudoMoves(pos)) if (isLegal(pos, m)) return true;
  return false;
}

function isLegal(pos, m) {
  const me = pos.turn;
  const u = doMove(pos, m);
  const ok = !inCheck(pos, me);
  undoMove(pos, m, u);
  return ok;
}

export function pseudoMoves(pos) {
  const { board, turn } = pos;
  const out = [];
  const fwd = turn === 'r' ? -1 : 1;
  const push = (from, r, c) => {
    const to = r * COLS + c;
    const t = board[to];
    if (t && ownerOf(t) === turn) return;
    out.push({ from, to, piece: typeOf(board[from]), capture: t });
  };
  for (let sq = 0; sq < SIZE; sq += 1) {
    const p = board[sq];
    if (!p || ownerOf(p) !== turn) continue;
    const r0 = rowOf(sq);
    const c0 = colOf(sq);
    switch (typeOf(p)) {
      case 'K':
        for (const [dr, dc] of ORTH) if (inPalace(r0 + dr, c0 + dc, turn)) push(sq, r0 + dr, c0 + dc);
        break;
      case 'A':
        for (const [dr, dc] of DIAG) if (inPalace(r0 + dr, c0 + dc, turn)) push(sq, r0 + dr, c0 + dc);
        break;
      case 'B':
        for (const [dr, dc] of DIAG) {
          const r = r0 + 2 * dr;
          const c = c0 + 2 * dc;
          if (!on(r, c) || !homeSide(r, turn)) continue;
          if (board[(r0 + dr) * COLS + (c0 + dc)]) continue; 
          push(sq, r, c);
        }
        break;
      case 'N':
        for (const [[lr, lc], lands] of HORSE) {
          if (!on(r0 + lr, c0 + lc) || board[(r0 + lr) * COLS + (c0 + lc)]) continue; 
          for (const [dr, dc] of lands) if (on(r0 + dr, c0 + dc)) push(sq, r0 + dr, c0 + dc);
        }
        break;
      case 'R':
        for (const [dr, dc] of ORTH) {
          let r = r0 + dr;
          let c = c0 + dc;
          while (on(r, c)) {
            const t = board[r * COLS + c];
            if (t) { if (ownerOf(t) !== turn) push(sq, r, c); break; }
            push(sq, r, c);
            r += dr;
            c += dc;
          }
        }
        break;
      case 'C':
        for (const [dr, dc] of ORTH) {
          let r = r0 + dr;
          let c = c0 + dc;
          let screened = false;
          while (on(r, c)) {
            const t = board[r * COLS + c];
            if (!screened) {
              if (t) screened = true;
              else push(sq, r, c);
            } else if (t) {
              if (ownerOf(t) !== turn) push(sq, r, c);
              break;
            }
            r += dr;
            c += dc;
          }
        }
        break;
      case 'P':
        if (on(r0 + fwd, c0)) push(sq, r0 + fwd, c0);
        if (!homeSide(r0, turn)) {
          if (c0 > 0) push(sq, r0, c0 - 1);
          if (c0 < COLS - 1) push(sq, r0, c0 + 1);
        }
        break;
      default:
        break;
    }
  }
  return out;
}


export function doMove(pos, m) {
  const { board } = pos;
  const me = pos.turn;
  const captured = board[m.to];
  const moving = board[m.from];
  board[m.to] = moving;
  board[m.from] = null;
  if (typeOf(moving) === 'K') pos.kings[me] = m.to;
  if (captured && typeOf(captured) === 'K') pos.kings[other(me)] = -1;
  const undo = { captured, idle: pos.idle };
  pos.idle = captured ? 0 : pos.idle + 1;
  if (me === 'b') pos.move += 1;
  pos.turn = other(me);
  return undo;
}

export function undoMove(pos, m, undo) {
  const { board } = pos;
  pos.turn = other(pos.turn);
  const me = pos.turn;
  if (me === 'b') pos.move -= 1;
  pos.idle = undo.idle;
  const moved = board[m.to];
  board[m.from] = moved;
  board[m.to] = undo.captured;
  if (typeOf(moved) === 'K') pos.kings[me] = m.from;
  if (undo.captured && typeOf(undo.captured) === 'K') pos.kings[other(me)] = m.to;
}

export function applyMove(pos, m) {
  const next = clonePos(pos);
  doMove(next, m);
  return next;
}

export const moveToIccs = (m) => `${sqName(m.from)}${sqName(m.to)}`;


export function iccsToMove(pos, s) {
  return legalMoves(pos).find((m) => moveToIccs(m) === s) || null;
}


export function status(pos) {
  if (hasLegalMove(pos)) return { over: false };
  return { over: true, winner: other(pos.turn), reason: inCheck(pos, pos.turn) ? 'checkmate' : 'stalemate' };
}
