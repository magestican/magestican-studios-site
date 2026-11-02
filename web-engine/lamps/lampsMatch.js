

























import { cluesOf, rowCells, colCells } from './lampsLogic.js';

export const CELL = Object.freeze({
  DARK: 0,  
  LIT: 1,   
  SHUT: 2,  
  FUSED: 3, 
  OFF: 4,   
});

export const DEFAULT_RULES = Object.freeze({
  windowPoints: 1,
  lineBonus: 2,
  lastCallShare: 0.75,
  lastCallMultiplier: 2,
  freezeMs: Object.freeze([3000, 5000, 8000, 13000, 21000]),
});

export const SEATS = 2;


export function freezeMsFor(nth, rules = DEFAULT_RULES) {
  const steps = rules.freezeMs;
  return steps[Math.min(nth, steps.length) - 1];
}


export const lastCallAt = (total, rules = DEFAULT_RULES) => Math.ceil(total * rules.lastCallShare);


export function createMatch({ lines, rules = DEFAULT_RULES }) {
  const rows = lines.length;
  const cols = lines[0].length;
  const { rowClues, colClues } = cluesOf(lines);
  const solution = [...lines.join('')].map((ch) => ch === '#');
  const m = {
    rows,
    cols,
    rowClues,
    colClues,
    rules,
    solution,
    total: solution.filter(Boolean).length,
    state: new Array(rows * cols).fill(CELL.DARK),
    owner: new Array(rows * cols).fill(-1),
    order: [], 
    litCount: 0,
    scores: [0, 0],
    wrong: [0, 0],
    frozenUntil: [0, 0],
    closedRows: new Array(rows).fill(false),
    closedCols: new Array(cols).fill(false),
    lastCall: false,
    finished: false,
    winner: null,
    draw: false,
  };
  
  
  rowClues.forEach((clue, r) => { if (!clue.length) closeLine(m, rowCells(r, rows, cols), m.closedRows, r); });
  colClues.forEach((clue, c) => { if (!clue.length) closeLine(m, colCells(c, rows, cols), m.closedCols, c); });
  return m;
}

function closeLine(m, cells, closed, index) {
  closed[index] = true;
  const shut = [];
  for (const i of cells) {
    if (m.state[i] === CELL.DARK) { m.state[i] = CELL.SHUT; shut.push(i); }
  }
  return shut;
}

const lineDone = (m, cells) => cells.every((i) => !m.solution[i] || m.state[i] === CELL.LIT);







export function fill(m, seat, cell, now) {
  if (!Number.isInteger(seat) || seat < 0 || seat >= SEATS) return { ok: false, reason: 'bad' };
  if (!Number.isInteger(cell) || cell < 0 || cell >= m.state.length) return { ok: false, reason: 'bad' };
  if (m.finished) return { ok: false, reason: 'finished' };
  if (now < m.frozenUntil[seat]) return { ok: false, reason: 'frozen' };
  const st = m.state[cell];
  if (st === CELL.LIT) return { ok: false, reason: 'taken' };
  if (st === CELL.SHUT || st === CELL.FUSED) return { ok: false, reason: 'closed' };
  return m.solution[cell] ? light(m, seat, cell) : blow(m, seat, cell, now);
}

function light(m, seat, cell) {
  const { rules, rows, cols } = m;
  m.state[cell] = CELL.LIT;
  m.owner[cell] = seat;
  m.order.push({ seat, cell });
  m.litCount++;

  const r = Math.floor(cell / cols);
  const c = cell % cols;
  const closed = { rows: [], cols: [] };
  const shut = [];
  const rowLine = rowCells(r, rows, cols);
  const colLine = colCells(c, rows, cols);
  if (!m.closedRows[r] && lineDone(m, rowLine)) { closed.rows.push(r); shut.push(...closeLine(m, rowLine, m.closedRows, r)); }
  if (!m.closedCols[c] && lineDone(m, colLine)) { closed.cols.push(c); shut.push(...closeLine(m, colLine, m.closedCols, c)); }

  const bonus = rules.lineBonus * (m.lastCall ? rules.lastCallMultiplier : 1);
  const points = rules.windowPoints + bonus * (closed.rows.length + closed.cols.length);
  m.scores[seat] += points;

  
  
  const lastCallStarted = !m.lastCall && m.litCount >= lastCallAt(m.total, rules);
  if (lastCallStarted) m.lastCall = true;

  const finished = m.litCount === m.total;
  if (finished) finish(m);
  return { ok: true, correct: true, cell, points, closed, shut, lastCallStarted, finished };
}

function blow(m, seat, cell, now) {
  m.state[cell] = CELL.FUSED;
  m.wrong[seat]++;
  const frozenMs = freezeMsFor(m.wrong[seat], m.rules);
  m.frozenUntil[seat] = now + frozenMs;
  const switchedOff = m.lastCall ? switchOff(m, seat) : null;
  return { ok: true, correct: false, cell, frozenMs, switchedOff };
}


function switchOff(m, seat) {
  for (let k = m.order.length - 1; k >= 0; k--) {
    const { seat: s, cell } = m.order[k];
    if (s !== seat) continue;
    if (m.closedRows[Math.floor(cell / m.cols)] || m.closedCols[cell % m.cols]) continue;
    m.order.splice(k, 1);
    m.state[cell] = CELL.OFF;
    m.owner[cell] = -1;
    m.litCount--;
    m.scores[seat] -= m.rules.windowPoints;
    return cell;
  }
  return null;
}

function finish(m) {
  m.finished = true;
  m.state.forEach((st, i) => { if (st === CELL.DARK) m.state[i] = CELL.SHUT; });
  const [a, b] = m.scores;
  m.winner = a > b ? 0 : b > a ? 1 : null;
  m.draw = a === b;
}






export function publicView(m) {
  return {
    rows: m.rows,
    cols: m.cols,
    rowClues: m.rowClues.map((c) => [...c]),
    colClues: m.colClues.map((c) => [...c]),
    total: m.total,
    state: [...m.state],
    owner: [...m.owner],
    litCount: m.litCount,
    scores: [...m.scores],
    wrong: [...m.wrong],
    frozenUntil: [...m.frozenUntil],
    closedRows: [...m.closedRows],
    closedCols: [...m.closedCols],
    lastCall: m.lastCall,
    finished: m.finished,
    winner: m.winner,
    draw: m.draw,
  };
}
