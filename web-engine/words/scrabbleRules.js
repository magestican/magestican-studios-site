


































export const SIZE = 15;


export const CENTRE = { row: 7, col: 7 };


export const RACK_SIZE = 7;


export const BINGO_BONUS = 50;


export const BLANK = '?';















export const PREMIUM_MAP = [
  'T..d...T...d..T',
  '.D...t...t...D.',
  '..D...d.d...D..',
  'd..D...d...D..d',
  '....D.....D....',
  '.t...t...t...t.',
  '..d...d.d...d..',
  'T..d...*...d..T',
  '..d...d.d...d..',
  '.t...t...t...t.',
  '....D.....D....',
  'd..D...d...D..d',
  '..D...d.d...D..',
  '.D...t...t...D.',
  'T..d...T...d..T',
];


const PREMIUM = {
  '.': { letter: 1, word: 1, name: '' },
  d: { letter: 2, word: 1, name: 'double letter' },
  t: { letter: 3, word: 1, name: 'triple letter' },
  D: { letter: 1, word: 2, name: 'double word' },
  T: { letter: 1, word: 3, name: 'triple word' },
  
  
  
  '*': { letter: 1, word: 2, name: 'centre star' },
};


export const VALUES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
  [BLANK]: 0,
};









export const DISTRIBUTION = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
  [BLANK]: 2,
};


export const TILE_COUNT = Object.values(DISTRIBUTION).reduce((n, c) => n + c, 0);


export const idx = (row, col) => row * SIZE + col;
export const rowOf = (i) => Math.floor(i / SIZE);
export const colOf = (i) => i % SIZE;
export const onBoard = (row, col) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;


export function premiumAt(row, col) {
  if (!onBoard(row, col)) return PREMIUM['.'];
  return PREMIUM[PREMIUM_MAP[row][col]] ?? PREMIUM['.'];
}


export const premiumCharAt = (row, col) => (onBoard(row, col) ? PREMIUM_MAP[row][col] : '.');


export const newBoard = () => new Array(SIZE * SIZE).fill(null);



export function tileAt(board, row, col) {
  if (!onBoard(row, col)) return null;
  return board[idx(row, col)] ?? null;
}


export function withPlacement(board, placed) {
  const next = board.slice();
  for (const p of placed) {
    next[idx(p.row, p.col)] = { letter: String(p.letter).toUpperCase(), blank: !!p.blank };
  }
  return next;
}


export const isEmptyBoard = (board) => board.every((sq) => !sq);













export function newBag() {
  const out = [];
  for (const [letter, count] of Object.entries(DISTRIBUTION)) {
    for (let i = 0; i < count; i += 1) out.push(letter);
  }
  return out;
}










export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export function shuffled(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}








export function draw(bag, n) {
  const want = Math.max(0, Math.min(n, bag.length));
  return { drawn: bag.slice(0, want), bag: bag.slice(want) };
}


export function refill(rack, bag) {
  const { drawn, bag: rest } = draw(bag, RACK_SIZE - rack.length);
  return { rack: [...rack, ...drawn], bag: rest };
}










export function exchange(rack, bag, giving, random = null) {
  const keep = removeTiles(rack, giving);
  if (!keep) return null;
  const { drawn, bag: rest } = draw(bag, giving.length);
  
  
  
  
  const back = [...rest, ...giving];
  return { rack: [...keep, ...drawn], bag: random ? shuffled(back, random) : back };
}








export function removeTiles(rack, letters) {
  const out = rack.slice();
  for (const raw of letters) {
    const letter = String(raw).toUpperCase();
    const at = out.indexOf(letter);
    if (at < 0) return null;
    out.splice(at, 1);
  }
  return out;
}


export const tilesUsedBy = (placed) => placed.map((p) => (p.blank ? BLANK : String(p.letter).toUpperCase()));


export const rackValue = (rack) => rack.reduce((n, t) => n + (VALUES[String(t).toUpperCase()] ?? 0), 0);













export function axisOf(placed) {
  if (placed.length === 0) return null;
  if (placed.length === 1) return 'single';
  const sameRow = placed.every((p) => p.row === placed[0].row);
  const sameCol = placed.every((p) => p.col === placed[0].col);
  if (sameRow) return 'across';
  if (sameCol) return 'down';
  return null;
}









export function wordAt(board, row, col, across) {
  const dr = across ? 0 : 1;
  const dc = across ? 1 : 0;
  let r = row;
  let c = col;
  while (tileAt(board, r - dr, c - dc)) { r -= dr; c -= dc; }
  const squares = [];
  while (tileAt(board, r, c)) {
    squares.push({ row: r, col: c, ...tileAt(board, r, c) });
    r += dr;
    c += dc;
  }
  return squares;
}


export const lettersOf = (squares) => squares.map((s) => s.letter).join('');









export function wordsFormed(board, placed) {
  const after = withPlacement(board, placed);
  const axis = axisOf(placed);
  if (!axis) return [];
  const out = [];
  const seen = new Set();
  
  
  
  
  const add = (squares, across) => {
    if (squares.length < 2) return;
    const key = `${squares[0].row},${squares[0].col},${across ? 'a' : 'd'}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(squares);
  };

  const first = placed[0];
  if (axis === 'across' || axis === 'single') add(wordAt(after, first.row, first.col, true), true);
  if (axis === 'down' || axis === 'single') add(wordAt(after, first.row, first.col, false), false);
  
  
  if (axis === 'across' || axis === 'down') {
    const across = axis === 'down';
    for (const p of placed) add(wordAt(after, p.row, p.col, across), across);
  }
  return out;
}



















export function scoreWord(squares, fresh) {
  let sum = 0;
  let multiplier = 1;
  for (const sq of squares) {
    const isNew = fresh.has(idx(sq.row, sq.col));
    const value = sq.blank ? 0 : (VALUES[sq.letter] ?? 0);
    const premium = isNew ? premiumAt(sq.row, sq.col) : PREMIUM['.'];
    sum += value * premium.letter;
    multiplier *= premium.word;
  }
  return sum * multiplier;
}








export function scorePlay(board, placed) {
  const fresh = new Set(placed.map((p) => idx(p.row, p.col)));
  const words = wordsFormed(board, placed).map((squares) => ({
    word: lettersOf(squares),
    squares,
    score: scoreWord(squares, fresh),
  }));
  const bingo = placed.length === RACK_SIZE;
  const total = words.reduce((n, w) => n + w.score, 0) + (bingo ? BINGO_BONUS : 0);
  return { words, score: total, bingo };
}



















export function rejectReason(board, placed, isWord) {
  if (!placed || placed.length === 0) return 'Put some tiles on the board first.';

  for (const p of placed) {
    if (!onBoard(p.row, p.col)) return 'That is off the board.';
    if (board[idx(p.row, p.col)]) return 'There is already a tile on that square.';
    if (!/^[A-Z]$/.test(String(p.letter).toUpperCase())) return 'A blank has to be given a letter.';
  }
  const seen = new Set();
  for (const p of placed) {
    const key = idx(p.row, p.col);
    if (seen.has(key)) return 'Two tiles cannot go on the same square.';
    seen.add(key);
  }

  const axis = axisOf(placed);
  if (!axis) return 'All your tiles must be in one row or one column.';

  const after = withPlacement(board, placed);
  
  
  
  if (axis !== 'single') {
    const across = axis === 'across';
    const line = placed.map((p) => (across ? p.col : p.row));
    const fixed = across ? placed[0].row : placed[0].col;
    for (let i = Math.min(...line); i <= Math.max(...line); i += 1) {
      const sq = across ? tileAt(after, fixed, i) : tileAt(after, i, fixed);
      if (!sq) return 'Your tiles have to make one unbroken line.';
    }
  }

  if (isEmptyBoard(board)) {
    if (!placed.some((p) => p.row === CENTRE.row && p.col === CENTRE.col)) {
      return 'The first word has to cover the star in the middle.';
    }
    if (placed.length < 2) return 'The first word needs at least two letters.';
  } else {
    
    
    
    
    const touches = placed.some((p) => (
      tileAt(board, p.row - 1, p.col) || tileAt(board, p.row + 1, p.col)
      || tileAt(board, p.row, p.col - 1) || tileAt(board, p.row, p.col + 1)
    ));
    if (!touches) return 'A word has to touch one that is already on the board.';
  }

  const words = wordsFormed(board, placed);
  if (words.length === 0) return 'That does not make a word.';
  for (const squares of words) {
    const word = lettersOf(squares);
    if (!isWord(word)) return `${word} is not in the word list.`;
  }
  return null;
}









export function judge(board, placed, isWord) {
  const reason = rejectReason(board, placed, isWord);
  
  
  
  
  
  const safe = (placed ?? []).filter((p) => onBoard(p.row, p.col) && !board[idx(p.row, p.col)]);
  const { words, score, bingo } = scorePlay(board, safe);
  return { ok: !reason, reason, words, score, bingo };
}











export const SCORELESS_LIMIT = 6;

export function endReason({ bagLeft, racks, scorelessTurns }) {
  if (bagLeft === 0 && racks.some((r) => r.length === 0)) return 'out';
  if (scorelessTurns >= SCORELESS_LIMIT) return 'stalled';
  return null;
}








export function finalAdjustments(racks, wentOut = -1) {
  const deltas = racks.map((rack) => -rackValue(rack));
  if (wentOut >= 0) {
    const gained = racks.reduce((n, rack, i) => (i === wentOut ? n : n + rackValue(rack)), 0);
    deltas[wentOut] = gained;
  }
  return deltas;
}
