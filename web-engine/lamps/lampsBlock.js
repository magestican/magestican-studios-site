













import { UNKNOWN, FILL, EMPTY } from './lampsLogic.js';


export function dimsOf(model) {
  const floors = model.floors;
  return [floors[0][0].length, floors.length, floors[0].length];
}

export const roomIndex = ([X, , Z], x, y, z) => y * X * Z + z * X + x;


export function roomAt([X, , Z], i) {
  return [i % X, Math.floor(i / (X * Z)), Math.floor(i / X) % Z];
}


export const lettersOf = (model) => model.floors.flatMap((floor) => floor.flatMap((row) => [...row]));

export const solutionOf = (model) => lettersOf(model).map((ch) => ch !== '.');


export function blockLines(dims) {
  const [X, Y, Z] = dims;
  const lines = [];
  for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
    lines.push({ axis: 'x', cells: Array.from({ length: X }, (_, x) => roomIndex(dims, x, y, z)) });
  }
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    lines.push({ axis: 'y', cells: Array.from({ length: Y }, (_, y) => roomIndex(dims, x, y, z)) });
  }
  for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
    lines.push({ axis: 'z', cells: Array.from({ length: Z }, (_, z) => roomIndex(dims, x, y, z)) });
  }
  return lines;
}


export function clueOfBools(bools) {
  let count = 0;
  let groups = 0;
  let inside = false;
  for (const on of bools) {
    if (on) { count++; if (!inside) groups++; }
    inside = on;
  }
  return { count, groups };
}


export function linesWithClues(dims, solution) {
  return blockLines(dims).map((l) => ({ ...l, ...clueOfBools(l.cells.map((i) => solution[i])) }));
}



const arrangements = new Map();
function arrangementsOf(n, count, groups) {
  const key = `${n}/${count}/${groups}`;
  let found = arrangements.get(key);
  if (!found) {
    found = [];
    for (let mask = 0; mask < 1 << n; mask++) {
      const bools = Array.from({ length: n }, (_, b) => !!(mask & (1 << b)));
      const c = clueOfBools(bools);
      if (c.count === count && c.groups === groups) found.push(bools);
    }
    arrangements.set(key, found);
  }
  return found;
}





export function solveBlockLine(clue, line) {
  const fits = arrangementsOf(line.length, clue.count, clue.groups).filter((a) => a.every((on, k) => (
    line[k] === UNKNOWN || (line[k] === FILL) === on
  )));
  if (!fits.length) return null;
  return line.map((_, k) => {
    const first = fits[0][k];
    if (!fits.every((a) => a[k] === first)) return UNKNOWN;
    return first ? FILL : EMPTY;
  });
}


export function propagateBlock(lines, cellCount, start) {
  const grid = start ? [...start] : new Array(cellCount).fill(UNKNOWN);
  let sweeps = 0;
  for (;;) {
    let changed = false;
    for (const l of lines) {
      const solved = solveBlockLine(l, l.cells.map((i) => grid[i]));
      if (!solved) return { grid, solved: false, contradiction: true, sweeps };
      l.cells.forEach((i, k) => {
        if (solved[k] !== UNKNOWN && grid[i] === UNKNOWN) { grid[i] = solved[k]; changed = true; }
      });
    }
    if (!changed) break;
    sweeps++;
  }
  return { grid, solved: grid.every((v) => v !== UNKNOWN), contradiction: false, sweeps };
}


export function countBlockSolutions(lines, cellCount, limit = 2, start) {
  const { grid, solved, contradiction } = propagateBlock(lines, cellCount, start);
  if (contradiction) return 0;
  if (solved) return 1;
  const i = grid.indexOf(UNKNOWN);
  let total = 0;
  for (const v of [FILL, EMPTY]) {
    const next = [...grid];
    next[i] = v;
    total += countBlockSolutions(lines, cellCount, limit - total, next);
    if (total >= limit) return total;
  }
  return total;
}







export const KEEP_SHARE = Object.freeze({ b4: 0.8, b5: 0.65, b6: 0.55 });
const DEFAULT_KEEP = 0.65;

function seededOrder(items, id) {
  let a = 0;
  for (const ch of String(id)) a = (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0;
  const out = [...items];
  for (let k = out.length - 1; k > 0; k--) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const j = Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * (k + 1));
    [out[k], out[j]] = [out[j], out[k]];
  }
  return out;
}

const shownCache = new WeakMap();


export function shownLines(model) {
  if (shownCache.has(model)) return shownCache.get(model);
  const solution = solutionOf(model);
  const all = linesWithClues(dimsOf(model), solution);
  const target = Math.ceil(all.length * (KEEP_SHARE[model.size] ?? DEFAULT_KEEP));
  const hidden = new Set();
  const order = seededOrder(all.map((_, k) => k), model.id ?? '');
  const tryOrder = [...order.filter((k) => all[k].count === 0), ...order.filter((k) => all[k].count !== 0)];
  for (const k of tryOrder) {
    if (all.length - hidden.size <= target) break;
    hidden.add(k);
    const { solved } = propagateBlock(all.filter((_, n) => !hidden.has(n)), solution.length);
    if (!solved) hidden.delete(k);
  }
  const shown = all.filter((_, n) => !hidden.has(n));
  shownCache.set(model, shown);
  return shown;
}



export const MIN_OPENING_DARK_SHARE = 0.25;


export function openingOf(model) {
  const solution = solutionOf(model);
  const shed = new Set();
  for (const l of shownLines(model)) if (l.count === 0) l.cells.forEach((i) => shed.add(i));
  const standing = solution.length - shed.size;
  const lit = solution.filter(Boolean).length;
  return { standing, lit, darkShare: standing ? (standing - lit) / standing : 0 };
}


export function validateBlock(model) {
  const floors = model.floors;
  const reasons = [];
  const rows = floors?.[0]?.length;
  const cols = floors?.[0]?.[0]?.length;
  const wellFormed = rows && cols && floors.every((f) => f.length === rows && f.every((r) => r.length === cols));
  if (!wellFormed) return { ok: false, unique: false, lineSolvable: false, sweeps: 0, darkShare: 0, reasons: ['malformed model'] };
  const solution = solutionOf(model);
  const lines = shownLines(model);
  const result = propagateBlock(lines, solution.length);
  const unique = countBlockSolutions(lines, solution.length, 2) === 1;
  const { darkShare } = openingOf(model);
  if (!unique) reasons.push('more than one model fits the clues');
  if (!result.solved) reasons.push('line logic stalls from the opening');
  if (darkShare < MIN_OPENING_DARK_SHARE) reasons.push(`opening gives it away: dark share ${darkShare.toFixed(2)}`);
  return { ok: reasons.length === 0, unique, lineSolvable: result.solved, sweeps: result.sweeps, darkShare, reasons };
}
