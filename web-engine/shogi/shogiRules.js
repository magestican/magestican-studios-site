













export const START_SFEN = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';
export const HAND_ORDER = Object.freeze(['R', 'B', 'G', 'S', 'N', 'L', 'P']);
const PROMOTABLE = new Set(['P', 'L', 'N', 'S', 'B', 'R']);

const G_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];


export const MOVES = Object.freeze({
  P: { steps: [[-1, 0]], slides: [] },
  L: { steps: [], slides: [[-1, 0]] },
  N: { steps: [], slides: [], jumps: [[-2, -1], [-2, 1]] },
  S: { steps: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 1]], slides: [] },
  G: { steps: G_STEPS, slides: [] },
  K: { steps: KING_STEPS, slides: [] },
  B: { steps: [], slides: DIAG },
  R: { steps: [], slides: ORTH },
  '+P': { steps: G_STEPS, slides: [] },
  '+L': { steps: G_STEPS, slides: [] },
  '+N': { steps: G_STEPS, slides: [] },
  '+S': { steps: G_STEPS, slides: [] },
  '+B': { steps: ORTH, slides: DIAG },
  '+R': { steps: DIAG, slides: ORTH },
});

export const ownerOf = (p) => {
  const ch = p[p.length - 1];
  return ch === ch.toUpperCase() ? 'b' : 'w';
};

export const typeOf = (p) => p.toUpperCase();

export const baseOf = (p) => p[p.length - 1].toUpperCase();
export const isPromoted = (p) => p[0] === '+';
const pieceFor = (type, color) => (color === 'b' ? type : type.toLowerCase());
export const other = (c) => (c === 'b' ? 'w' : 'b');
const emptyHand = () => ({ R: 0, B: 0, G: 0, S: 0, N: 0, L: 0, P: 0 });

export const rowOf = (sq) => Math.floor(sq / 9);
export const colOf = (sq) => sq % 9;
export const sqName = (sq) => `${9 - colOf(sq)}${'abcdefghi'[rowOf(sq)]}`;
export const sqFromName = (s) => (s.charCodeAt(1) - 97) * 9 + (9 - Number(s[0]));
const inZone = (row, color) => (color === 'b' ? row <= 2 : row >= 6);

const depth = (row, color) => (color === 'b' ? row : 8 - row);

const stuck = (type, row, color) => {
  const d = depth(row, color);
  return ((type === 'P' || type === 'L') && d === 0) || (type === 'N' && d <= 1);
};

export function parseSfen(sfen) {
  const [boardPart, turn = 'b', handPart = '-', ply = '1'] = sfen.trim().split(/\s+/);
  const board = new Array(81).fill(null);
  const rows = boardPart.split('/');
  if (rows.length !== 9) throw new Error(`bad sfen board: ${boardPart}`);
  rows.forEach((row, r) => {
    let c = 0;
    for (let i = 0; i < row.length; i += 1) {
      const ch = row[i];
      if (/\d/.test(ch)) { c += Number(ch); continue; }
      let p = ch;
      if (ch === '+') { i += 1; p = `+${row[i]}`; }
      board[r * 9 + c] = p;
      c += 1;
    }
    if (c !== 9) throw new Error(`bad sfen row ${r}: ${row}`);
  });
  const hands = { b: emptyHand(), w: emptyHand() };
  if (handPart !== '-') {
    const re = /(\d*)([A-Za-z])/g;
    let m;
    while ((m = re.exec(handPart))) {
      const color = m[2] === m[2].toUpperCase() ? 'b' : 'w';
      hands[color][m[2].toUpperCase()] += m[1] ? Number(m[1]) : 1;
    }
  }
  const kings = { b: board.indexOf('K'), w: board.indexOf('k') };
  return { board, hands, turn, ply: Number(ply), kings };
}

export function toSfen(pos) {
  const rows = [];
  for (let r = 0; r < 9; r += 1) {
    let s = '';
    let empty = 0;
    for (let c = 0; c < 9; c += 1) {
      const p = pos.board[r * 9 + c];
      if (!p) { empty += 1; continue; }
      if (empty) { s += empty; empty = 0; }
      s += p;
    }
    if (empty) s += empty;
    rows.push(s);
  }
  return `${rows.join('/')} ${pos.turn} ${handString(pos)} ${pos.ply}`;
}

function handString(pos) {
  let h = '';
  for (const color of ['b', 'w']) {
    for (const t of HAND_ORDER) {
      const n = pos.hands[color][t];
      if (n) h += `${n > 1 ? n : ''}${pieceFor(t, color)}`;
    }
  }
  return h || '-';
}


export const positionKey = (pos) => {
  const s = toSfen(pos);
  return s.slice(0, s.lastIndexOf(' '));
};

export function clonePos(pos) {
  return {
    board: pos.board.slice(),
    hands: { b: { ...pos.hands.b }, w: { ...pos.hands.w } },
    turn: pos.turn,
    ply: pos.ply,
    kings: { ...pos.kings },
  };
}


export function attacked(pos, sq, by) {
  const { board } = pos;
  const r0 = rowOf(sq);
  const c0 = colOf(sq);
  const f = by === 'b' ? 1 : -1; 
  for (const [dr, dc] of KING_STEPS) {
    let r = r0 + dr;
    let c = c0 + dc;
    let dist = 1;
    while (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const p = board[r * 9 + c];
      if (p) {
        if (ownerOf(p) === by) {
          
          const rr = (-dr) * f;
          const cc = -dc;
          const mv = MOVES[typeOf(p)];
          if (dist === 1 && mv.steps.some(([a, b]) => a === rr && b === cc)) return true;
          if (mv.slides.some(([a, b]) => a === rr && b === cc)) return true;
        }
        break;
      }
      r += dr;
      c += dc;
      dist += 1;
    }
  }
  
  for (const dc of [-1, 1]) {
    const r = r0 + 2 * f;
    const c = c0 + dc;
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const p = board[r * 9 + c];
      if (p && typeOf(p) === 'N' && ownerOf(p) === by) return true;
    }
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
  let ok = !inCheck(pos, me);
  
  if (ok && m.from === null && m.piece === 'P' && inCheck(pos, pos.turn) && !hasLegalMove(pos)) ok = false;
  undoMove(pos, m, u);
  return ok;
}

export function pseudoMoves(pos) {
  const { board, turn } = pos;
  const f = turn === 'b' ? 1 : -1;
  const out = [];
  const add = (from, to, type, capture) => {
    const fromRow = rowOf(from);
    const toRow = rowOf(to);
    const canPromote = PROMOTABLE.has(type) && (inZone(fromRow, turn) || inZone(toRow, turn));
    if (canPromote) out.push({ from, to, piece: type, promote: true, capture });
    if (!stuck(type, toRow, turn)) out.push({ from, to, piece: type, promote: false, capture });
  };
  for (let sq = 0; sq < 81; sq += 1) {
    const p = board[sq];
    if (!p || ownerOf(p) !== turn) continue;
    const type = typeOf(p);
    const mv = MOVES[type];
    const r0 = rowOf(sq);
    const c0 = colOf(sq);
    for (const [dr, dc] of mv.steps) {
      const r = r0 + dr * f;
      const c = c0 + dc;
      if (r < 0 || r > 8 || c < 0 || c > 8) continue;
      const t = board[r * 9 + c];
      if (t && ownerOf(t) === turn) continue;
      add(sq, r * 9 + c, type, t);
    }
    for (const [dr, dc] of mv.slides) {
      let r = r0 + dr * f;
      let c = c0 + dc;
      while (r >= 0 && r < 9 && c >= 0 && c < 9) {
        const t = board[r * 9 + c];
        if (t && ownerOf(t) === turn) break;
        add(sq, r * 9 + c, type, t);
        if (t) break;
        r += dr * f;
        c += dc;
      }
    }
    if (mv.jumps) {
      for (const [dr, dc] of mv.jumps) {
        const r = r0 + dr * f;
        const c = c0 + dc;
        if (r < 0 || r > 8 || c < 0 || c > 8) continue;
        const t = board[r * 9 + c];
        if (t && ownerOf(t) === turn) continue;
        add(sq, r * 9 + c, type, t);
      }
    }
  }
  
  const hand = pos.hands[turn];
  let pawnFiles = null;
  for (const type of HAND_ORDER) {
    if (!hand[type]) continue;
    if (type === 'P' && !pawnFiles) {
      pawnFiles = new Set();
      const mine = pieceFor('P', turn);
      for (let sq = 0; sq < 81; sq += 1) if (board[sq] === mine) pawnFiles.add(colOf(sq));
    }
    for (let sq = 0; sq < 81; sq += 1) {
      if (board[sq]) continue;
      if (stuck(type, rowOf(sq), turn)) continue;
      if (type === 'P' && pawnFiles.has(colOf(sq))) continue; 
      out.push({ from: null, to: sq, piece: type, promote: false, capture: null });
    }
  }
  return out;
}


export function doMove(pos, m) {
  const { board } = pos;
  const me = pos.turn;
  const captured = board[m.to];
  if (m.from === null) {
    pos.hands[me][m.piece] -= 1;
    board[m.to] = pieceFor(m.piece, me);
  } else {
    const moving = board[m.from];
    board[m.from] = null;
    board[m.to] = m.promote ? `+${moving}` : moving;
    if (captured) pos.hands[me][baseOf(captured)] += 1;
    if (typeOf(moving) === 'K') pos.kings[me] = m.to;
  }
  if (captured && typeOf(captured) === 'K') pos.kings[other(me)] = -1;
  pos.turn = other(me);
  pos.ply += 1;
  return captured;
}

export function undoMove(pos, m, captured) {
  const { board } = pos;
  pos.turn = other(pos.turn);
  pos.ply -= 1;
  const me = pos.turn;
  if (m.from === null) {
    board[m.to] = null;
    pos.hands[me][m.piece] += 1;
    return;
  }
  const moved = board[m.to];
  board[m.from] = m.promote ? moved.slice(1) : moved;
  board[m.to] = captured;
  if (captured) {
    pos.hands[me][baseOf(captured)] -= 1;
    if (typeOf(captured) === 'K') pos.kings[other(me)] = m.to;
  }
  if (typeOf(board[m.from]) === 'K') pos.kings[me] = m.from;
}

export function applyMove(pos, m) {
  const next = clonePos(pos);
  doMove(next, m);
  return next;
}

export const moveToUsi = (m) => (m.from === null
  ? `${m.piece}*${sqName(m.to)}`
  : `${sqName(m.from)}${sqName(m.to)}${m.promote ? '+' : ''}`);


export function usiToMove(pos, usi) {
  return legalMoves(pos).find((m) => moveToUsi(m) === usi) || null;
}


export function status(pos) {
  if (hasLegalMove(pos)) return { over: false };
  return { over: true, winner: other(pos.turn), reason: inCheck(pos, pos.turn) ? 'checkmate' : 'noMoves' };
}
