









import { UNKNOWN, FILL, EMPTY, solveLine, propagate, rowCells, colCells } from './lampsLogic.js';
import { CELL } from './lampsMatch.js';
import { propagateBlock, solveBlockLine } from './lampsBlock.js';

export const BOT_LEVELS = Object.freeze({
  
  
  
  apprentice: Object.freeze({ thinkMs: 5200, linesPerThought: 3, pick: 'any', sizePace: Object.freeze({ 5: 0.9 }) }),
  lamplighter: Object.freeze({ thinkMs: 3400, linesPerThought: 8, pick: 'closer' }),
  foreman: Object.freeze({ thinkMs: 2400, linesPerThought: Infinity, pick: 'shark' }),
});



export const SIZE_PACE = Object.freeze({ 5: 0.5, 10: 0.8, 15: 1 });
export const thinkMsFor = (cfg, size) => cfg.thinkMs * (cfg.sizePace?.[size] ?? SIZE_PACE[size] ?? 1);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { mulberry32 };

export function createBot(level, seed = 1, overrides = {}) {
  const cfg = BOT_LEVELS[level];
  if (!cfg) throw new Error(`unknown bot level: ${level}`);
  return { level, cfg: { ...cfg, ...overrides }, rand: mulberry32(seed), known: null };
}


const publicFact = (st) => (st === CELL.LIT || st === CELL.OFF ? FILL : st === CELL.SHUT || st === CELL.FUSED ? EMPTY : UNKNOWN);

function learnPublic(bot, view) {
  if (!bot.known) bot.known = new Array(view.state.length).fill(UNKNOWN);
  view.state.forEach((st, i) => {
    const fact = publicFact(st);
    if (fact !== UNKNOWN) bot.known[i] = fact;
  });
}


function readLines(bot, view, count) {
  if (view.kind === 'block') {
    readBlockLines(bot, view, count);
    return;
  }
  const { rows, cols, rowClues, colClues } = view;
  if (count === Infinity) {
    const { grid, contradiction } = propagate(rowClues, colClues, bot.known);
    if (!contradiction) bot.known = grid;
    return;
  }
  const open = [
    ...rowClues.map((clue, r) => ({ clue, cells: rowCells(r, rows, cols) })),
    ...colClues.map((clue, c) => ({ clue, cells: colCells(c, rows, cols) })),
  ].filter((l) => l.cells.some((i) => bot.known[i] === UNKNOWN));
  for (let n = 0; n < count && open.length; n++) {
    const k = Math.floor(bot.rand() * open.length);
    const [{ clue, cells }] = open.splice(k, 1);
    const solved = solveLine(clue, cells.map((i) => bot.known[i]));
    if (!solved) continue;
    cells.forEach((i, x) => { if (solved[x] !== UNKNOWN) bot.known[i] = solved[x]; });
  }
}


function readBlockLines(bot, view, count) {
  if (count === Infinity) {
    const { grid, contradiction } = propagateBlock(view.lines, view.state.length, bot.known);
    if (!contradiction) bot.known = grid;
    return;
  }
  const open = view.lines.filter((l) => l.cells.some((i) => bot.known[i] === UNKNOWN));
  for (let n = 0; n < count && open.length; n++) {
    const k = Math.floor(bot.rand() * open.length);
    const [line] = open.splice(k, 1);
    const solved = solveBlockLine(line, line.cells.map((i) => bot.known[i]));
    if (!solved) continue;
    line.cells.forEach((i, x) => { if (solved[x] !== UNKNOWN) bot.known[i] = solved[x]; });
  }
}


function remaining(view, cells, clue) {
  const need = clue.reduce((a, b) => a + b, 0);
  return need - cells.filter((i) => view.state[i] === CELL.LIT).length;
}


function leftOn(view, cell) {
  if (view.kind === 'block') {
    return view.lines.filter((l) => l.cells.includes(cell))
      .map((l) => l.count - l.cells.filter((i) => view.state[i] === CELL.LIT).length);
  }
  const { rows, cols, rowClues, colClues } = view;
  const r = Math.floor(cell / cols);
  const c = cell % cols;
  return [
    remaining(view, rowCells(r, rows, cols), rowClues[r]),
    remaining(view, colCells(c, rows, cols), colClues[c]),
  ];
}

function scoreCell(view, cell, pick) {
  const left = leftOn(view, cell);
  const closes = left.filter((n) => n === 1).length;
  if (pick === 'closer') return closes * 100;
  
  
  const setsUp = left.filter((n) => n === 2).length;
  return closes * 100 - setsUp * 10 + (view.state[cell] === CELL.OFF ? 5 : 0);
}


export function thinkMove(bot, view) {
  learnPublic(bot, view);
  readLines(bot, view, bot.cfg.linesPerThought);
  const proven = [];
  bot.known.forEach((v, i) => {
    if (v === FILL && (view.state[i] === CELL.DARK || view.state[i] === CELL.OFF)) proven.push(i);
  });
  if (!proven.length) return null;
  if (bot.cfg.pick === 'any') return proven[Math.floor(bot.rand() * proven.length)];
  let best = -Infinity;
  let bestCells = [];
  for (const cell of proven) {
    const s = scoreCell(view, cell, bot.cfg.pick);
    if (s > best) { best = s; bestCells = [cell]; }
    else if (s === best) bestCells.push(cell);
  }
  return bestCells[Math.floor(bot.rand() * bestCells.length)];
}
