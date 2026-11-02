












export const UNKNOWN = 0;
export const FILL = 1;
export const EMPTY = 2;


export function clueOfLine(bools) {
  const clue = [];
  let run = 0;
  for (const on of bools) {
    if (on) run++;
    else if (run) { clue.push(run); run = 0; }
  }
  if (run) clue.push(run);
  return clue;
}


export function cluesOf(lines) {
  const rows = lines.length;
  const cols = lines[0].length;
  const at = (r, c) => lines[r][c] === '#';
  return {
    rowClues: Array.from({ length: rows }, (_, r) => clueOfLine(Array.from({ length: cols }, (__, c) => at(r, c)))),
    colClues: Array.from({ length: cols }, (_, c) => clueOfLine(Array.from({ length: rows }, (__, r) => at(r, c)))),
  };
}








export function solveLine(clue, line) {
  const n = line.length;
  const k = clue.length;
  const row = () => new Array(k + 1).fill(false);

  
  const emptiesTo = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) emptiesTo[i + 1] = emptiesTo[i] + (line[i] === EMPTY ? 1 : 0);
  const clear = (a, b) => emptiesTo[b] === emptiesTo[a];

  const before = Array.from({ length: n + 1 }, row);
  before[0][0] = true;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= k; j++) {
      if (line[i - 1] !== FILL && before[i - 1][j]) { before[i][j] = true; continue; }
      if (!j) continue;
      const len = clue[j - 1];
      if (i < len || !clear(i - len, i)) continue;
      if (i === len) before[i][j] = j === 1;
      else before[i][j] = line[i - len - 1] !== FILL && before[i - len - 1][j - 1];
    }
  }
  if (!before[n][k]) return null;

  const after = Array.from({ length: n + 2 }, row);
  after[n][k] = true;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = k; j >= 0; j--) {
      if (line[i] !== FILL && after[i + 1][j]) { after[i][j] = true; continue; }
      if (j === k) continue;
      const len = clue[j];
      if (i + len > n || !clear(i, i + len)) continue;
      if (i + len === n) after[i][j] = j === k - 1;
      else after[i][j] = line[i + len] !== FILL && after[i + len + 1][j + 1];
    }
  }

  const canEmpty = new Array(n).fill(false);
  for (let c = 0; c < n; c++) {
    if (line[c] === FILL) continue;
    for (let j = 0; j <= k && !canEmpty[c]; j++) canEmpty[c] = before[c][j] && after[c + 1][j];
  }

  
  const fillDiff = new Array(n + 1).fill(0);
  for (let j = 0; j < k; j++) {
    const len = clue[j];
    for (let s = 0; s + len <= n; s++) {
      if (!clear(s, s + len)) continue;
      const left = s === 0 ? j === 0 : line[s - 1] !== FILL && before[s - 1][j];
      if (!left) continue;
      const right = s + len === n ? j === k - 1 : line[s + len] !== FILL && after[s + len + 1][j + 1];
      if (!right) continue;
      fillDiff[s]++;
      fillDiff[s + len]--;
    }
  }

  const out = new Array(n);
  let cover = 0;
  for (let c = 0; c < n; c++) {
    cover += fillDiff[c];
    const canFill = cover > 0;
    if (canFill && !canEmpty[c]) out[c] = FILL;
    else if (canEmpty[c] && !canFill) out[c] = EMPTY;
    else if (canFill) out[c] = UNKNOWN;
    else return null;
  }
  return out;
}


export const rowCells = (r, rows, cols) => Array.from({ length: cols }, (_, c) => r * cols + c);
export const colCells = (c, rows, cols) => Array.from({ length: rows }, (_, r) => r * cols + c);






export function propagate(rowClues, colClues, start) {
  const rows = rowClues.length;
  const cols = colClues.length;
  const grid = start ? [...start] : new Array(rows * cols).fill(UNKNOWN);
  const lines = [
    ...rowClues.map((clue, r) => ({ clue, cells: rowCells(r, rows, cols) })),
    ...colClues.map((clue, c) => ({ clue, cells: colCells(c, rows, cols) })),
  ];
  let sweeps = 0;
  for (;;) {
    let changed = false;
    for (const { clue, cells } of lines) {
      const solved = solveLine(clue, cells.map((i) => grid[i]));
      if (!solved) return { grid, solved: false, contradiction: true, sweeps };
      cells.forEach((i, x) => {
        if (solved[x] !== UNKNOWN && grid[i] === UNKNOWN) { grid[i] = solved[x]; changed = true; }
      });
    }
    if (!changed) break;
    sweeps++;
  }
  return { grid, solved: grid.every((v) => v !== UNKNOWN), contradiction: false, sweeps };
}


export function countSolutions(rowClues, colClues, limit = 2, start) {
  const { grid, solved, contradiction } = propagate(rowClues, colClues, start);
  if (contradiction) return 0;
  if (solved) return 1;
  const i = grid.indexOf(UNKNOWN);
  let total = 0;
  for (const v of [FILL, EMPTY]) {
    const next = [...grid];
    next[i] = v;
    total += countSolutions(rowClues, colClues, limit - total, next);
    if (total >= limit) return total;
  }
  return total;
}






export function validatePuzzle(lines) {
  const reasons = [];
  const rows = lines.length;
  const cols = lines[0]?.length || 0;
  if (!rows || !cols || lines.some((l) => l.length !== cols || /[^#.]/.test(l))) {
    return { ok: false, unique: false, lineSolvable: false, sweeps: 0, reasons: ['malformed picture'] };
  }
  const { rowClues, colClues } = cluesOf(lines);
  const result = propagate(rowClues, colClues);
  const unique = countSolutions(rowClues, colClues, 2) === 1;
  const lineSolvable = result.solved;
  if (!unique) reasons.push('more than one picture fits the clues');
  if (!lineSolvable) reasons.push('line logic stalls from a blank board');
  if (lineSolvable) {
    const wrong = result.grid.findIndex((v, i) => (v === FILL) !== (lines[Math.floor(i / cols)][i % cols] === '#'));
    if (wrong >= 0) reasons.push(`solver finished on a different picture at cell ${wrong}`);
  }
  return { ok: reasons.length === 0, unique, lineSolvable, sweeps: result.sweeps, reasons };
}
