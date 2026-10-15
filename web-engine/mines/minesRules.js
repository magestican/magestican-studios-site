



















export const PRESETS = Object.freeze({
  beginner: Object.freeze({ rows: 9, cols: 9, mines: 10 }),
  intermediate: Object.freeze({ rows: 16, cols: 16, mines: 40 }),
  expert: Object.freeze({ rows: 16, cols: 30, mines: 99 }),
});

export const LIMITS = Object.freeze({ min: 5, max: 30, defaultSide: 9 });


function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const blankCell = () => ({ mine: false, open: false, flag: false, count: 0 });

function make({ rows, cols, mines, seed, now }) {
  return {
    rows, cols, mines,
    cells: Array.from({ length: rows * cols }, blankCell),
    state: 'ready', 
    placed: false,
    seed: seed ?? Math.floor(Math.random() * 2 ** 31),
    now: now || (() => Date.now()),
    startedAt: null,
    endedAt: null,
    exploded: null,
    opened: 0,
  };
}


export function newGame({ rows, cols, mines, seed, now } = PRESETS.beginner) {
  const c = clampCustom({ rows, cols, mines });
  return make({ ...c, seed, now });
}


export function gameFrom(lines, { now } = {}) {
  const rows = lines.length;
  const cols = lines[0].length;
  const g = make({ rows, cols, mines: 0, seed: 0, now });
  lines.forEach((line, r) => [...line].forEach((ch, c) => {
    if (ch === '*') { g.cells[r * cols + c].mine = true; g.mines++; }
  }));
  g.placed = true;
  countAll(g);
  return g;
}

export function neighbours(g, r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr; const cc = c + dc;
      if (rr >= 0 && rr < g.rows && cc >= 0 && cc < g.cols) out.push(rr * g.cols + cc);
    }
  }
  return out;
}

const rc = (g, i) => [Math.floor(i / g.cols), i % g.cols];

function countAll(g) {
  g.cells.forEach((cell, i) => {
    const [r, c] = rc(g, i);
    cell.count = neighbours(g, r, c).filter((n) => g.cells[n].mine).length;
  });
}

function place(g, r, c) {
  const keep = new Set([r * g.cols + c, ...neighbours(g, r, c)]);
  let pool = g.cells.map((_, i) => i).filter((i) => !keep.has(i));
  
  if (pool.length < g.mines) pool = g.cells.map((_, i) => i).filter((i) => i !== r * g.cols + c);
  const rand = rng(g.seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const i of pool.slice(0, g.mines)) g.cells[i].mine = true;
  g.placed = true;
  countAll(g);
}

const live = (g) => g.state === 'ready' || g.state === 'playing';

function start(g) {
  if (g.state === 'ready') { g.state = 'playing'; g.startedAt = g.now(); }
}

function finish(g, state) {
  g.state = state;
  g.endedAt = g.now();
  if (state === 'won') for (const cell of g.cells) if (cell.mine) cell.flag = true;
}


export function reveal(g, r, c) {
  if (!live(g)) return false;
  const i = r * g.cols + c;
  const cell = g.cells[i];
  if (!cell || cell.open || cell.flag) return false;
  if (!g.placed) place(g, r, c);
  start(g);
  if (cell.mine) {
    cell.open = true;
    g.exploded = i;
    finish(g, 'lost');
    return true;
  }
  const stack = [i];
  while (stack.length) {
    const j = stack.pop();
    const x = g.cells[j];
    if (x.open || x.flag || x.mine) continue;
    x.open = true;
    g.opened++;
    if (x.count === 0) stack.push(...neighbours(g, ...rc(g, j)));
  }
  if (g.opened === g.rows * g.cols - g.mines) finish(g, 'won');
  return true;
}


export function toggleFlag(g, r, c) {
  if (!live(g)) return false;
  const cell = g.cells[r * g.cols + c];
  if (!cell || cell.open) return false;
  cell.flag = !cell.flag;
  return true;
}





export function chord(g, r, c) {
  if (!live(g)) return false;
  const cell = g.cells[r * g.cols + c];
  if (!cell || !cell.open || cell.count === 0) return false;
  const around = neighbours(g, r, c);
  const flags = around.filter((n) => g.cells[n].flag).length;
  if (flags !== cell.count) return false;
  let changed = false;
  for (const n of around) {
    if (!live(g)) break;
    const x = g.cells[n];
    if (!x.open && !x.flag) changed = reveal(g, ...rc(g, n)) || changed;
  }
  return changed;
}


export function act(g, r, c, mode = 'dig') {
  const cell = g.cells[r * g.cols + c];
  if (!cell) return false;
  if (cell.open) return chord(g, r, c);
  return mode === 'flag' ? toggleFlag(g, r, c) : reveal(g, r, c);
}

export function flagsLeft(g) {
  return g.mines - g.cells.filter((x) => x.flag).length;
}


export function elapsed(g) {
  if (g.startedAt === null) return 0;
  return (g.endedAt ?? g.now()) - g.startedAt;
}

const whole = (v, fallback) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : fallback;
};


export function clampCustom({ rows, cols, mines }) {
  const clamp = (v) => Math.min(LIMITS.max, Math.max(LIMITS.min, whole(v, LIMITS.defaultSide)));
  const R = clamp(rows);
  const C = clamp(cols);
  const M = Math.min(R * C - 9, Math.max(1, whole(mines, 10)));
  return { rows: R, cols: C, mines: M };
}


export function isRanked({ rows, cols, mines }) {
  for (const [name, p] of Object.entries(PRESETS)) {
    if (p.mines !== mines) continue;
    if ((p.rows === rows && p.cols === cols) || (p.rows === cols && p.cols === rows)) return name;
  }
  return null;
}






export function recordBest(table, g) {
  const level = isRanked(g);
  const ms = elapsed(g);
  const old = table && Number.isFinite(table[level]) ? table[level] : null;
  if (g.state !== 'won' || !level) return { table: { ...table }, isBest: false, level };
  if (old !== null && old <= ms) return { table: { ...table }, isBest: false, level };
  return { table: { ...table, [level]: ms }, isBest: true, level };
}


export function boardText(g, all = false) {
  const lines = [];
  for (let r = 0; r < g.rows; r++) {
    let s = '';
    for (let c = 0; c < g.cols; c++) {
      const x = g.cells[r * g.cols + c];
      if (x.mine && (x.open || all)) s += '*';
      else if (x.open || all) s += x.count ? String(x.count) : '.';
      else s += x.flag ? 'F' : '#';
    }
    lines.push(s);
  }
  return lines.join('\n');
}
