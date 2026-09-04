






















import { scoreGuess, MAX_GUESSES } from './wordleRules.js';
import { STATES } from './style.js';
import { scoreWord, isPangram, rankFor } from './beeRules.js';
import { MAX_MISTAKES } from './connectionsRules.js';
import { play as playStrands } from './strandsRules.js';


const tile = (letter, state) => `${letter} ${STATES[state].label}`;








export function describeWordle({ answer, guesses, typed = '', puzzle = 1 }) {
  const lines = [];
  guesses.forEach((guess, i) => {
    const marks = scoreGuess(guess, answer);
    lines.push(`Guess ${i + 1}: ${[...guess.toUpperCase()].map((c, k) => tile(c, marks[k])).join(', ')}.`);
  });
  const won = guesses.some((g) => g.toUpperCase() === answer.toUpperCase());
  const out = guesses.length >= MAX_GUESSES;
  if (!won && !out) {
    lines.push(typed
      ? `Typing: ${[...typed].join(' ')}. ${MAX_GUESSES - guesses.length} guesses left.`
      : `${MAX_GUESSES - guesses.length} guesses left. Type a five letter word.`);
  }
  return {
    title: `Farmy Wordle, puzzle ${puzzle}`,
    status: won
      ? `Solved in ${guesses.length}.`
      : (out ? `Out of guesses. The word was ${answer.toUpperCase()}.` : 'In play.'),
    lines,
  };
}


export function describeBee({ puzzle, found, typed = '', index = 1 }) {
  const score = found.reduce((t, w) => t + scoreWord(w, puzzle.letters), 0);
  const rank = rankFor(score, puzzle);
  const outer = puzzle.letters.filter((c) => c !== puzzle.centre);
  const lines = [
    `Letters: ${outer.join(' ')}. The middle letter is ${puzzle.centre} and every word must use it.`,
    `Rank ${rank.name}, ${score} ${score === 1 ? 'point' : 'points'}.`
      + (rank.next ? ` ${rank.toNext} more to ${rank.next}.` : ' Every word found.'),
    `Found ${found.length} of ${puzzle.answers.length}${found.length ? `: ${found.map((w) => (isPangram(w, puzzle.letters) ? `${w}, a pangram` : w)).join(', ')}` : ''}.`,
  ];
  if (typed) lines.push(`Typing: ${[...typed].join(' ')}.`);
  return {
    title: `Farmy Spelling Bee, hive ${index}`,
    status: found.length === puzzle.answers.length ? 'Every word found.' : 'In play.',
    lines,
  };
}


export function describeConnections({ puzzle, state, board, picked = [], index = 1 }) {
  const lines = [];
  for (const name of state.solved) {
    const group = puzzle.groups.find((g) => g.name === name);
    lines.push(`Solved: ${name} - ${group.words.join(', ')}.`);
  }
  const solvedWords = new Set(puzzle.groups
    .filter((g) => state.solved.includes(g.name))
    .flatMap((g) => g.words));
  const left = board.filter((w) => !solvedWords.has(w));
  if (left.length) lines.push(`Words left: ${left.join(', ')}.`);
  if (picked.length) lines.push(`Selected: ${picked.join(', ')}.`);
  lines.push(`Mistakes: ${state.mistakes} of ${MAX_MISTAKES}.`);
  return {
    title: `Farmy Connections, set ${index}`,
    status: state.won ? 'All four groups found.' : (state.lost ? 'Out of guesses.' : 'In play.'),
    lines,
  };
}


export function describeStrands({ puzzle, found, bonus = [], hintsUsed = 0, trail = [], index = 1 }) {
  const state = playStrands(puzzle, found, bonus.length, hintsUsed);
  const lines = [
    `Theme: ${puzzle.theme}.`,
    `Found ${state.foundCount} of ${state.total}${found.length ? `: ${found.map((w) => (w === puzzle.spangram ? `${w}, the spangram` : w)).join(', ')}` : ''}.`,
  ];
  
  
  puzzle.rows.forEach((row, r) => lines.push(`Row ${r + 1}: ${[...row].join(' ')}.`));
  if (trail.length) lines.push(`Tracing: ${trail.join('')}.`);
  lines.push(`Hints available: ${state.hintsAvailable}.`);
  return {
    title: `Farmy Strands, puzzle ${index}: ${puzzle.theme}`,
    status: state.won ? 'Every word found.' : 'In play.',
    lines,
  };
}


export function describeHome(games) {
  return {
    title: 'Farmy Crosswords',
    status: 'Choose a game. You can also just start typing.',
    lines: games.map((g, i) => `${i + 1}. ${g.name}. ${g.blurb}`),
  };
}















export function summariseGuess(guess, marks) {
  
  
  
  
  
  
  
  
  
  
  
  
  const rank = { absent: 1, moved: 2, right: 3 };
  const best = new Map();
  const order = [];
  [...guess.toUpperCase()].forEach((c, i) => {
    if (!best.has(c)) order.push(c);
    if (!best.has(c) || rank[marks[i]] > rank[best.get(c)]) best.set(c, marks[i]);
  });

  if (marks.every((m) => m === 'right')) return 'Every letter in place.';

  const pick = (want) => order.filter((c) => best.get(c) === want);
  const join = (list) => (list.length === 1
    ? list[0]
    : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);
  const verb = (list) => (list.length === 1 ? 'is' : 'are');

  const right = pick('right');
  const moved = pick('moved');
  const absent = pick('absent');
  const parts = [];
  if (right.length) parts.push(`${join(right)} ${verb(right)} in the right place`);
  if (moved.length) parts.push(`${join(moved)} ${verb(moved)} in the word but somewhere else`);
  if (absent.length) parts.push(`${join(absent)} ${verb(absent)} not in the word`);
  return `${parts.join('. ')}.`;
}
