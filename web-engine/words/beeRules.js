
























export const MIN_LENGTH = 4;


export const HIVE_SIZE = 7;


export const PANGRAM_BONUS = 7;











export function scoreWord(word, letters) {
  const w = String(word).toUpperCase();
  if (w.length === MIN_LENGTH) return 1;
  return w.length + (isPangram(w, letters) ? PANGRAM_BONUS : 0);
}


export function isPangram(word, letters) {
  const w = new Set(String(word).toUpperCase());
  return [...letters].every((c) => w.has(String(c).toUpperCase()));
}












export function rejectReason(word, puzzle, found = new Set(), accepted = null) {
  const w = String(word ?? '').toUpperCase();
  const centre = String(puzzle.centre).toUpperCase();
  const hive = new Set(puzzle.letters.map((c) => String(c).toUpperCase()));

  if (w.length === 0) return 'Type a word first.';
  if (w.length < MIN_LENGTH) return `Too short - words need ${MIN_LENGTH} letters or more.`;
  if (!/^[A-Z]+$/.test(w)) return 'Letters only, please.';
  if (!w.includes(centre)) return `Every word must use the centre letter, ${centre}.`;
  const stray = [...w].find((c) => !hive.has(c));
  if (stray) return `There is no ${stray} in this hive.`;
  if (found.has(w)) return `You already found ${w}.`;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const known = accepted?.has ? accepted.has(w) : false;
  const listed = puzzle.answers.some((a) => a.toUpperCase() === w);
  if (!known && !listed) return `${w} is not a word I know.`;
  return null;
}


export function maxScore(puzzle) {
  return puzzle.answers.reduce((t, a) => t + scoreWord(a, puzzle.letters), 0);
}














export const RANKS = [
  { at: 0.00, name: 'Sprout' },
  { at: 0.05, name: 'Seedling' },
  { at: 0.15, name: 'Picker' },
  { at: 0.25, name: 'Farmhand' },
  { at: 0.40, name: 'Grower' },
  { at: 0.50, name: 'Harvester' },
  { at: 0.70, name: 'Prize Marrow' },
  { at: 1.00, name: 'Best in Show' },
];










export function rankFor(score, puzzle) {
  const max = maxScore(puzzle);
  
  
  
  
  
  const share = max === 0 ? 0 : Math.min(1, score / max);
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) if (share >= RANKS[i].at) index = i;
  const next = RANKS[index + 1] ?? null;
  return {
    name: RANKS[index].name,
    index,
    max,
    share,
    next: next ? next.name : null,
    
    toNext: next ? Math.max(1, Math.ceil(next.at * max) - score) : 0,
  };
}


export function pangramsOf(puzzle) {
  return puzzle.answers.filter((a) => isPangram(a, puzzle.letters));
}


























export function hintGrid(puzzle, found = []) {
  const done = new Set(found.map((w) => w.toUpperCase()));
  const left = puzzle.answers.filter((w) => !done.has(w.toUpperCase()));

  const lengths = [...new Set(left.map((w) => w.length))].sort((a, b) => a - b);
  const letters = [...new Set(left.map((w) => w[0]))].sort();
  const rows = letters.map((letter) => {
    const words = left.filter((w) => w[0] === letter);
    return {
      letter,
      counts: lengths.map((n) => words.filter((w) => w.length === n).length),
      total: words.length,
    };
  });

  
  
  
  const pairCount = new Map();
  for (const w of left) {
    const pair = w.slice(0, 2);
    pairCount.set(pair, (pairCount.get(pair) ?? 0) + 1);
  }
  const pairs = [...pairCount.entries()]
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => a.pair.localeCompare(b.pair));

  const allPangrams = pangramsOf(puzzle);
  return {
    lengths,
    rows,
    remaining: left.length,
    total: puzzle.answers.length,
    pangrams: {
      found: allPangrams.filter((w) => done.has(w)).length,
      total: allPangrams.length,
    },
    pairs,
  };
}
