


















import { play as playWordle } from '../../../web-engine/words/wordleRules.js';
import { isPangram } from '../../../web-engine/words/beeRules.js';
import { play as playConnections } from '../../../web-engine/words/connectionsRules.js';

const list = (v) => (Array.isArray(v) ? v : []);






export function outcomeOf(game, puzzle, saved) {
  const none = { over: false, won: false, found: 0, pangram: false };
  if (!puzzle || !saved || typeof saved !== 'object') return none;
  try {
    if (game === 'wordle') {
      const guesses = list(saved.guesses);
      if (!guesses.length) return none;
      const s = playWordle(puzzle, guesses);
      return { ...none, over: !!s.over, won: !!s.won };
    }
    if (game === 'connections') {
      const s = playConnections(puzzle, list(saved.selections));
      return { ...none, over: !!s.over, won: !!s.won };
    }
    if (game === 'bee') {
      const valid = new Set(list(puzzle.answers));
      const found = list(saved.found).filter((w) => valid.has(w));
      const all = valid.size > 0 && found.length >= valid.size;
      return { over: all, won: all, found: found.length, pangram: found.some((w) => isPangram(w, puzzle.letters ?? '')) };
    }
    if (game === 'strands') {
      const real = new Set(list(puzzle.words).map((e) => e?.w ?? e));
      const found = list(saved.found).filter((w) => real.has(w));
      const all = real.size > 0 && found.length >= real.size;
      return { ...none, over: all, won: all };
    }
  } catch {  }
  return none;
}






export function recordFrom(entries, ledger = []) {
  const r = { right: 0, wordle: 0, connections: 0, strands: 0, bestHive: 0, pangram: false, ranOut: {} };
  const byKey = new Map();
  for (const e of list(entries)) {
    if (!e || !e.outcome) continue;
    byKey.set(e.key, e);
    const o = e.outcome;
    if (o.won) {
      r.right += 1;
      if (e.game in r && typeof r[e.game] === 'number' && e.game !== 'right') r[e.game] += 1;
    }
    if (e.game === 'bee') {
      r.bestHive = Math.max(r.bestHive, o.found || 0);
      if (o.pangram) r.pangram = true;
    }
  }
  
  
  for (const game of ['wordle', 'connections']) {
    let run = 0;
    const keys = list(ledger).filter((k) => typeof k === 'string' && k.startsWith(`${game}:`));
    for (let i = keys.length - 1; i >= 0; i -= 1) {
      const e = byKey.get(keys[i]);
      if (!e || !e.outcome.over) continue;
      if (e.outcome.won) break;
      run += 1;
    }
    r.ranOut[game] = run;
  }
  return r;
}


export const HIVE_WORDS = 10;





export const PRIZES = Object.freeze([
  { id: 'guesswise', name: 'Guesswise word', need: 1, have: (r) => r.wordle,
    goal: () => 'Get a Guesswise word in six guesses.' },
  { id: 'hive', name: 'Ten hive words', need: HIVE_WORDS, have: (r) => r.bestHive,
    goal: (r) => (r.bestHive ? `Find ${HIVE_WORDS} words in one Combword hive. Your best is ${r.bestHive}.`
      : `Find ${HIVE_WORDS} words in one Combword hive.`) },
  { id: 'groups', name: 'Four groups', need: 1, have: (r) => r.connections,
    goal: () => 'Find all four groups in a Groupseek puzzle.' },
  { id: 'grid', name: 'Full grid', need: 1, have: (r) => r.strands,
    goal: () => 'Find every word in a Gridseek grid.' },
  { id: 'five', name: 'Five right', need: 5, have: (r) => r.right,
    goal: (r) => `Get 5 puzzles right. You have ${r.right}.` },
  { id: 'seven', name: 'All seven', need: 1, have: (r) => (r.pangram ? 1 : 0),
    goal: () => 'Find a Combword word that uses all seven letters.' },
  { id: 'ten', name: 'Ten right', need: 10, have: (r) => r.right,
    goal: (r) => `Get 10 puzzles right. You have ${r.right}.` },
  { id: 'twenty-five', name: 'Twenty-five right', need: 25, have: (r) => r.right,
    goal: (r) => `Get 25 puzzles right. You have ${r.right}.` },
]);

export const GOAL_HEADING = 'Next goal';
export const PRIZES_HEADING = 'Your prizes';
export const SEE_PRIZES = 'See prizes';
export const newPrizeLine = (name) => `New prize, ${name}.`;

const EMPTY = recordFrom([]);
const safe = (r) => (r && typeof r === 'object' ? { ...EMPTY, ...r } : EMPTY);


export function earnedPrizes(record) {
  const r = safe(record);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}


export function newPrizes(had, now) {
  const before = new Set(list(had));
  return PRIZES.filter((p) => !before.has(p.id) && list(now).includes(p.id)).map((p) => p.name);
}


export const prizeCount = (record) => `${earnedPrizes(record).length} of ${PRIZES.length} prizes`;

const nextPrize = (r) => PRIZES.find((p) => p.have(r) < p.need) ?? null;


export function nextGoal(record) {
  const r = safe(record);
  const next = nextPrize(r);
  return next ? next.goal(r) : 'Play on as long as you like.';
}


export function goalFill(record) {
  const r = safe(record);
  const next = nextPrize(r);
  return { share: next ? Math.min(next.have(r), next.need) / next.need : 1, text: prizeCount(r) };
}


export function prizeLines(record) {
  const r = safe(record);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    return have >= p.need ? `${p.name}, yours` : `${p.name}, ${have} of ${p.need}`;
  });
}


export const HELP_AFTER = 2;

const TIPS = {
  wordle: ['Use Hint to see one letter of the word.', 'Try new letters in each guess to learn more.'],
  connections: ['Find the group you are surest of first.', 'Change one word when you see One away.'],
};






export function helpLines(record, game, { alone = true } = {}) {
  if (!alone || !TIPS[game]) return [];
  return (safe(record).ranOut?.[game] ?? 0) >= HELP_AFTER ? [...TIPS[game]] : [];
}
