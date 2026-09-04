





















export const COLS = 6;
export const ROWS = 8;
export const CELLS = COLS * ROWS;      


export const WORDS_PER_HINT = 3;







export const FREE_HINTS = 3;


export const MIN_BONUS_LENGTH = 4;


export const rowOf = (i) => Math.floor(i / COLS);
export const colOf = (i) => i % COLS;


export function adjacent(a, b) {
  if (a === b) return false;
  const dr = Math.abs(rowOf(a) - rowOf(b));
  const dc = Math.abs(colOf(a) - colOf(b));
  return dr <= 1 && dc <= 1;
}








export function pathProblem(path) {
  if (!Array.isArray(path) || path.length === 0) return 'empty path';
  const seen = new Set();
  for (let k = 0; k < path.length; k += 1) {
    const i = path[k];
    if (!Number.isInteger(i) || i < 0 || i >= CELLS) return `cell ${i} is off the board`;
    if (seen.has(i)) return `cell ${i} is used twice`;
    seen.add(i);
    if (k > 0 && !adjacent(path[k - 1], i)) {
      return `cells ${path[k - 1]} and ${i} do not touch`;
    }
  }
  return null;
}


export function wordAt(rows, path) {
  return path.map((i) => rows[rowOf(i)][colOf(i)]).join('');
}






export function spansOpposite(path) {
  const cs = path.map(colOf);
  const rs = path.map(rowOf);
  const leftRight = cs.includes(0) && cs.includes(COLS - 1);
  const topBottom = rs.includes(0) && rs.includes(ROWS - 1);
  return leftRight || topBottom;
}









export function puzzleProblems(puzzle) {
  const problems = [];
  const { rows, words, spangram } = puzzle;

  if (!Array.isArray(rows) || rows.length !== ROWS) {
    problems.push(`grid has ${rows?.length} rows, not ${ROWS}`);
    return problems;                       
  }
  for (const [r, row] of rows.entries()) {
    if (typeof row !== 'string' || row.length !== COLS) {
      problems.push(`row ${r} is ${row?.length} letters, not ${COLS}`);
    }
    if (!/^[A-Z]*$/.test(row)) problems.push(`row ${r} has something other than A-Z in it`);
  }
  if (problems.length) return problems;

  const used = new Array(CELLS).fill(0);
  let sawSpangram = false;
  for (const entry of words) {
    const bad = pathProblem(entry.p);
    if (bad) { problems.push(`${entry.w}: ${bad}`); continue; }
    const spelled = wordAt(rows, entry.p);
    if (spelled !== entry.w) problems.push(`${entry.w}: its path spells ${spelled}`);
    for (const i of entry.p) used[i] += 1;
    if (entry.w === spangram) {
      sawSpangram = true;
      if (!spansOpposite(entry.p)) problems.push(`${entry.w} is the spangram and does not reach two opposite edges`);
    }
  }
  if (!sawSpangram) problems.push(`the spangram ${spangram} is not one of the words`);

  const missed = used.reduce((n, c) => n + (c === 0 ? 1 : 0), 0);
  const doubled = used.reduce((n, c) => n + (c > 1 ? 1 : 0), 0);
  if (missed) problems.push(`${missed} cells belong to no word - the grid is not tiled`);
  if (doubled) problems.push(`${doubled} cells belong to more than one word`);

  const names = words.map((e) => e.w);
  if (new Set(names).size !== names.length) problems.push('two words in this puzzle are the same');

  return problems;
}








export function themeWordAt(puzzle, path) {
  const key = [...path].join(',');
  const rev = [...path].reverse().join(',');
  return puzzle.words.find((e) => e.p.join(',') === key || e.p.join(',') === rev) ?? null;
}





















export function play(puzzle, foundWords = [], bonusCount = 0, hintsUsed = 0) {
  const found = new Set(foundWords.map((w) => w.toUpperCase()));
  const remaining = puzzle.words.filter((e) => !found.has(e.w));
  const earned = FREE_HINTS + Math.floor(bonusCount / WORDS_PER_HINT);
  return {
    found: [...found],
    remaining,
    foundCount: found.size,
    total: puzzle.words.length,
    spangramFound: found.has(puzzle.spangram),
    bonusCount,
    hintsAvailable: Math.max(0, earned - hintsUsed),
    
    
    towardsHint: bonusCount % WORDS_PER_HINT,
    won: found.size === puzzle.words.length,
  };
}










export function hintCells(puzzle, foundWords = []) {
  const found = new Set(foundWords.map((w) => w.toUpperCase()));
  const left = puzzle.words
    .filter((e) => !found.has(e.w))
    .sort((a, b) => a.w.length - b.w.length || a.p[0] - b.p[0]);
  return left.length ? [...left[0].p].sort((a, b) => a - b) : [];
}
