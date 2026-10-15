





















export const SIZE = 15;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const RULES = Object.freeze(['free', 'omok', 'caro']);


const DIRS = Object.freeze([[0, 1], [1, 0], [1, 1], [1, -1]]);

export const other = (color) => (color === BLACK ? WHITE : BLACK);

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';


export function toCoord(i, size = SIZE) {
  const r = Math.floor(i / size);
  const c = i % size;
  return `${LETTERS[c]}${size - r}`;
}


export function fromCoord(s, size = SIZE) {
  const m = /^([a-z])(\d{1,2})$/.exec(String(s).trim().toLowerCase());
  if (!m) return -1;
  const c = LETTERS.indexOf(m[1]);
  const n = Number(m[2]);
  if (c < 0 || c >= size || n < 1 || n > size) return -1;
  return (size - n) * size + c;
}


export function newGame({ size = SIZE, rules = 'free' } = {}) {
  if (!RULES.includes(rules)) throw new Error(`unknown rule set: ${rules}`);
  if (!(size >= 5 && size <= 26)) throw new Error(`bad board size: ${size}`);
  return Object.freeze({
    size, rules,
    cells: Object.freeze(new Array(size * size).fill(EMPTY)),
    turn: BLACK,
    moves: Object.freeze([]),
    over: false, winner: EMPTY, draw: false, line: null,
  });
}

const at = (cells, size, r, c) => (r < 0 || c < 0 || r >= size || c >= size ? -1 : cells[r * size + c]);






function run(cells, size, i, color, [dr, dc]) {
  const r0 = Math.floor(i / size);
  const c0 = i % size;
  const line = [i];
  let r = r0 - dr; let c = c0 - dc;
  while (at(cells, size, r, c) === color) { line.unshift(r * size + c); r -= dr; c -= dc; }
  const before = at(cells, size, r, c);
  r = r0 + dr; c = c0 + dc;
  while (at(cells, size, r, c) === color) { line.push(r * size + c); r += dr; c += dc; }
  const after = at(cells, size, r, c);
  return { line, before, after };
}





export function fiveAt(cells, size, i, color, rules) {
  const opp = other(color);
  for (const d of DIRS) {
    const { line, before, after } = run(cells, size, i, color, d);
    if (line.length < 5) continue;
    if (rules === 'omok' && line.length !== 5) continue;
    if (rules === 'caro' && before === opp && after === opp) continue;
    return line;
  }
  return null;
}







function threeIn(cells, size, i, color, d) {
  const [dr, dc] = d;
  const r0 = Math.floor(i / size);
  const c0 = i % size;
  const work = cells.slice();
  work[i] = color;
  
  if (run(work, size, i, color, d).line.length >= 4) return false;
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const r = r0 + dr * k; const c = c0 + dc * k;
    if (at(work, size, r, c) !== EMPTY) continue;
    const e = r * size + c;
    work[e] = color;
    const { line, before, after } = run(work, size, i, color, d);
    work[e] = EMPTY;
    if (line.length !== 4 || !line.includes(e)) continue;
    if (before !== EMPTY || after !== EMPTY) continue;
    
    const first = line[0]; const last = line[line.length - 1];
    const b2 = at(work, size, Math.floor(first / size) - 2 * dr, (first % size) - 2 * dc);
    const a2 = at(work, size, Math.floor(last / size) + 2 * dr, (last % size) + 2 * dc);
    if (b2 === color && a2 === color) continue;
    return true;
  }
  return false;
}


export function isDoubleThree(cells, size, i, color) {
  
  
  
  const r0 = Math.floor(i / size);
  const c0 = i % size;
  const near = DIRS.filter(([dr, dc]) => {
    let own = 0;
    for (let k = -4; k <= 4; k++) if (k && at(cells, size, r0 + dr * k, c0 + dc * k) === color) own += 1;
    return own >= 2;
  });
  if (near.length < 2) return false;
  let threes = 0;
  for (const d of near) {
    if (threeIn(cells, size, i, color, d)) threes += 1;
    if (threes >= 2) return true;
  }
  return false;
}


export function isLegal(g, i) {
  if (g.over) return false;
  if (!Number.isInteger(i) || i < 0 || i >= g.cells.length) return false;
  if (g.cells[i] !== EMPTY) return false;
  if (g.rules === 'omok') {
    if (fiveAt(g.cells, g.size, i, g.turn, g.rules)) return true;
    if (isDoubleThree(g.cells, g.size, i, g.turn)) return false;
  }
  return true;
}


export function legalMoves(g) {
  const out = [];
  if (g.over) return out;
  for (let i = 0; i < g.cells.length; i++) if (isLegal(g, i)) out.push(i);
  return out;
}


export function play(g, i) {
  if (!isLegal(g, i)) throw new Error(`illegal move: ${i}`);
  const cells = g.cells.slice();
  cells[i] = g.turn;
  const moves = [...g.moves, i];
  const line = fiveAt(cells, g.size, i, g.turn, g.rules);
  const full = moves.length === cells.length;
  return Object.freeze({
    size: g.size, rules: g.rules,
    cells: Object.freeze(cells),
    turn: other(g.turn),
    moves: Object.freeze(moves),
    over: !!line || full,
    winner: line ? g.turn : EMPTY,
    draw: !line && full,
    line: line ? Object.freeze(line) : null,
  });
}


export function replay(moves, { size = SIZE, rules = 'free' } = {}) {
  let g = newGame({ size, rules });
  for (const i of moves) g = play(g, i);
  return g;
}


export function undo(g, n = 1) {
  return replay(g.moves.slice(0, Math.max(0, g.moves.length - n)), { size: g.size, rules: g.rules });
}
