







































export const RIGHT = 'right';
export const MOVED = 'moved';
export const ABSENT = 'absent';


export const MAX_GUESSES = 6;


export const WORD_LENGTH = 5;








export function scoreGuess(guess, answer) {
  const g = String(guess).toUpperCase();
  const a = String(answer).toUpperCase();
  if (g.length !== a.length) {
    throw new Error(`scoreGuess: "${g}" and "${a}" are different lengths`);
  }

  const out = new Array(g.length).fill(ABSENT);

  
  
  
  
  
  
  const pool = new Map();
  for (let i = 0; i < a.length; i += 1) {
    if (g[i] === a[i]) out[i] = RIGHT;
    else pool.set(a[i], (pool.get(a[i]) ?? 0) + 1);
  }

  
  for (let i = 0; i < g.length; i += 1) {
    if (out[i] === RIGHT) continue;
    const left = pool.get(g[i]) ?? 0;
    if (left > 0) {
      out[i] = MOVED;
      pool.set(g[i], left - 1);
    }
  }
  return out;
}


export function isSolved(marks) {
  return marks.length > 0 && marks.every((m) => m === RIGHT);
}














export function keyboardState(rows) {
  const rank = { [ABSENT]: 1, [MOVED]: 2, [RIGHT]: 3 };
  const best = new Map();
  for (const { guess, marks } of rows) {
    const g = String(guess).toUpperCase();
    for (let i = 0; i < g.length; i += 1) {
      const letter = g[i];
      const now = marks[i];
      const was = best.get(letter);
      if (!was || rank[now] > rank[was]) best.set(letter, now);
    }
  }
  return best;
}












export function rejectReason(guess, allowed) {
  const g = String(guess ?? '').toUpperCase();
  if (g.length < WORD_LENGTH) return `Only ${g.length} letters - it needs ${WORD_LENGTH}.`;
  if (g.length > WORD_LENGTH) return `That is ${g.length} letters - it needs ${WORD_LENGTH}.`;
  if (!/^[A-Z]+$/.test(g)) return 'Letters only, please.';
  if (allowed && !allowed.has(g)) return `${g} is not in the word list.`;
  return null;
}







export function play(answer, guesses) {
  const rows = guesses.map((guess) => ({
    guess: String(guess).toUpperCase(),
    marks: scoreGuess(guess, answer),
  }));
  const won = rows.some((r) => isSolved(r.marks));
  const lost = !won && rows.length >= MAX_GUESSES;
  return {
    rows,
    won,
    lost,
    over: won || lost,
    guessesLeft: Math.max(0, MAX_GUESSES - rows.length),
    keyboard: keyboardState(rows),
  };
}









export function verdict(state, answer) {
  if (state.won) {
    const n = state.rows.length;
    return n === 1 ? 'Solved, first guess.' : `Solved in ${n} guesses.`;
  }
  if (state.lost) return `Out of guesses. The word was ${String(answer).toUpperCase()}.`;
  return `${state.guessesLeft} ${state.guessesLeft === 1 ? 'guess' : 'guesses'} left.`;
}
