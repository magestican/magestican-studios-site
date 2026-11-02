

























import { cluesOf, rowCells, colCells } from './lampsLogic.js';
import { dimsOf, shownLines, solutionOf } from './lampsBlock.js';

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




function matchOn({ solution, defs, rules, shape }) {
  const m = {
    ...shape,
    rules,
    solution,
    total: solution.filter(Boolean).length,
    state: new Array(solution.length).fill(CELL.DARK),
    owner: new Array(solution.length).fill(-1),
    order: [], 
    litCount: 0,
    scores: [0, 0],
    wrong: [0, 0],
    frozenUntil: [0, 0],
    lineDefs: defs,
    closedLines: new Array(defs.length).fill(false),
    linesOf: solution.map(() => []),
    lastCall: false,
    finished: false,
    winner: null,
    draw: false,
  };
  defs.forEach((d, li) => d.cells.forEach((i) => m.linesOf[i].push(li)));
  
  
  defs.forEach((d, li) => { if (d.empty) closeLine(m, li); });
  return m;
}


export function createMatch({ lines, rules = DEFAULT_RULES }) {
  const rows = lines.length;
  const cols = lines[0].length;
  const { rowClues, colClues } = cluesOf(lines);
  const closedRows = new Array(rows).fill(false);
  const closedCols = new Array(cols).fill(false);
  const defs = [
    ...rowClues.map((clue, r) => ({ cells: rowCells(r, rows, cols), empty: !clue.length, flags: closedRows, kind: 'rows', index: r })),
    ...colClues.map((clue, c) => ({ cells: colCells(c, rows, cols), empty: !clue.length, flags: closedCols, kind: 'cols', index: c })),
  ];
  return matchOn({
    solution: [...lines.join('')].map((ch) => ch === '#'),
    defs,
    rules,
    shape: { rows, cols, rowClues, colClues, closedRows, closedCols },
  });
}


export function createBlockMatch({ model, rules = DEFAULT_RULES }) {
  const dims = dimsOf(model);
  const solution = solutionOf(model);
  const clued = shownLines(model);
  const defs = clued.map((l) => ({ cells: l.cells, empty: l.count === 0, flags: null, kind: null, index: 0 }));
  return matchOn({ solution, defs, rules, shape: { kind: 'block', dims, blockLines: clued } });
}

function closeLine(m, li) {
  const def = m.lineDefs[li];
  m.closedLines[li] = true;
  if (def.flags) def.flags[def.index] = true;
  const shut = [];
  for (const i of def.cells) {
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
  const { rules } = m;
  m.state[cell] = CELL.LIT;
  m.owner[cell] = seat;
  m.order.push({ seat, cell });
  m.litCount++;

  const closed = { rows: [], cols: [] };
  const closedLines = [];
  const shut = [];
  for (const li of m.linesOf[cell]) {
    const def = m.lineDefs[li];
    if (m.closedLines[li] || !lineDone(m, def.cells)) continue;
    closedLines.push(li);
    if (def.kind) closed[def.kind].push(def.index);
    shut.push(...closeLine(m, li));
  }

  const bonus = rules.lineBonus * (m.lastCall ? rules.lastCallMultiplier : 1);
  const points = rules.windowPoints + bonus * closedLines.length;
  m.scores[seat] += points;

  
  
  const lastCallStarted = !m.lastCall && m.litCount >= lastCallAt(m.total, rules);
  if (lastCallStarted) m.lastCall = true;

  const finished = m.litCount === m.total;
  if (finished) finish(m);
  return { ok: true, correct: true, cell, points, closed, closedLines, shut, lastCallStarted, finished };
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
    if (m.linesOf[cell].some((li) => m.closedLines[li])) continue;
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
  if (m.kind === 'block') {
    return {
      kind: 'block',
      dims: [...m.dims],
      lines: m.blockLines.map((l) => ({ axis: l.axis, cells: [...l.cells], count: l.count, groups: l.groups })),
      total: m.total,
      state: [...m.state],
      owner: [...m.owner],
      litCount: m.litCount,
      scores: [...m.scores],
      wrong: [...m.wrong],
      frozenUntil: [...m.frozenUntil],
      closedLines: [...m.closedLines],
      lastCall: m.lastCall,
      finished: m.finished,
      winner: m.winner,
      draw: m.draw,
    };
  }
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
