






export const STORE_KEY = 'rr.progress';


export const PLAYABLE = [
  { stage: 1, name: 'Jungle Road' },
  { stage: 2, name: 'Visitor Centre' },
  { stage: 3, name: 'River Canyon' },
  { stage: 4, name: 'Razor Coast' },
  { stage: 5, name: 'Volcano Works' },
  { stage: 6, name: 'Ash Road' },
  { stage: 7, name: 'The Stadium' },
];
const BOSS = 7;
const RANKS = ['D', 'C', 'B', 'A', 'S'];
const HARDER = ['normal', 'hard'];
const DIFFICULTIES = ['easy', ...HARDER];
const WEAK = new Set(['C', 'D']);




export const emptyRecord = () => ({ best: {}, beat: [], low: {} });

const better = (a, b) => RANKS.indexOf(a) > RANKS.indexOf(b ?? '');
const isStage = (k) => PLAYABLE.some((p) => String(p.stage) === String(k));


export function parse(text) {
  const rec = emptyRecord();
  let raw;
  try {
    raw = JSON.parse(text ?? 'null');
  } catch {
    return rec;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return rec;
  for (const [k, v] of Object.entries(raw.best ?? {})) if (isStage(k) && RANKS.includes(v)) rec.best[Number(k)] = v;
  if (Array.isArray(raw.beat)) rec.beat = DIFFICULTIES.filter((d) => raw.beat.includes(d));
  for (const [k, v] of Object.entries(raw.low ?? {})) if (isStage(k) && Number.isInteger(v) && v > 0 && v < 100) rec.low[Number(k)] = v;
  return rec;
}


export const serialize = (rec) => JSON.stringify(rec);


export function load(store) {
  try {
    return parse(store?.getItem(STORE_KEY) ?? null);
  } catch {
    return emptyRecord();
  }
}


export function save(store, rec) {
  try {
    store?.setItem(STORE_KEY, serialize(rec));
  } catch {
    
  }
}

const PRIZES = [
  { id: 'first', name: 'First clear', how: 'Clear any stage.', won: (r) => cleared(r) >= 1 },
  { id: 'top', name: 'Top marks', how: 'Get an S on any stage.', won: (r) => Object.values(r.best).includes('S') },
  { id: 'half', name: 'Halfway there', how: 'Clear four stages.', won: (r) => cleared(r) >= 4 },
  { id: 'rex', name: 'Iron-Jaw down', how: 'Beat Iron-Jaw in The Stadium.', won: (r) => !!r.best[BOSS] },
  { id: 'island', name: 'Whole island', how: 'Clear all seven stages.', won: (r) => cleared(r) === PLAYABLE.length },
  { id: 'straightA', name: "Straight A's", how: 'Get an A or better on every stage.', won: (r) => allAtLeast(r, 'A') },
  { id: 'perfect', name: 'Perfect park', how: 'Get an S on every stage.', won: (r) => allAtLeast(r, 'S') },
  { id: 'normal', name: 'Normal hero', how: 'Beat Iron-Jaw on normal.', won: (r) => r.beat.includes('normal') },
  { id: 'hard', name: 'Hard as nails', how: 'Beat Iron-Jaw on hard.', won: (r) => r.beat.includes('hard') },
];
const cleared = (r) => PLAYABLE.filter((p) => r.best[p.stage]).length;
const allAtLeast = (r, rank) => PLAYABLE.every((p) => r.best[p.stage] && !better(rank, r.best[p.stage]));


export const prizes = (rec) => PRIZES.map((p) => ({ id: p.id, name: p.name, how: p.how, won: p.won(rec) }));






export function goal(rec) {
  const open = PLAYABLE.find((p) => !rec.best[p.stage]);
  if (open) return { stage: open.stage, difficulty: null, text: `Clear ${open.name}` };
  for (const [rank, article] of [
    ['A', 'an A'],
    ['S', 'an S'],
  ]) {
    const under = PLAYABLE.find((p) => better(rank, rec.best[p.stage]));
    if (under) return { stage: under.stage, difficulty: null, text: `Get ${article} on ${under.name}` };
  }
  const harder = HARDER.find((d) => !rec.beat.includes(d));
  if (harder) return { stage: BOSS, difficulty: harder, text: `Beat Iron-Jaw on ${harder}` };
  return { stage: 1, difficulty: null, text: 'Every prize is yours' };
}






export function recordRun(rec, { stage, rank, difficulty }) {
  const next = { best: { ...rec.best }, beat: [...rec.beat], low: { ...rec.low } };
  if (!isStage(stage) || !RANKS.includes(rank)) return { rec: next, newBest: false, prizes: [], help: null };
  const newBest = better(rank, rec.best[stage]);
  if (newBest) next.best[stage] = rank;
  if (stage === BOSS && DIFFICULTIES.includes(difficulty) && !next.beat.includes(difficulty)) {
    next.beat = DIFFICULTIES.filter((d) => d === difficulty || next.beat.includes(d));
  }
  let help = null;
  if (WEAK.has(rank)) {
    next.low[stage] = Math.min(99, (rec.low[stage] ?? 0) + 1);
    if (next.low[stage] >= 2) {
      help = difficulty === 'easy' ? 'aim' : 'easy';
      delete next.low[stage]; 
    }
  } else delete next.low[stage];
  const had = new Set(
    prizes(rec)
      .filter((p) => p.won)
      .map((p) => p.id),
  );
  const won = prizes(next)
    .filter((p) => p.won && !had.has(p.id))
    .map((p) => p.id);
  return { rec: next, newBest, prizes: won, help };
}


export const LINES = {
  newBest: 'New best',
  newPrize: 'New prize',
  prizes: 'Prizes',
  nextPrize: 'Next prize',
  helpEasy: 'Try easy for more hearts',
  playEasy: 'PLAY EASY',
  helpAim: 'Keep the crosshair on one dinosaur until it falls',
};


export const STRINGS = [
  ...Object.values(LINES),
  'Every prize is yours',
  ...PLAYABLE.flatMap((p) => [`Clear ${p.name}`, `Get an A on ${p.name}`, `Get an S on ${p.name}`]),
  'Beat Iron-Jaw on normal',
  'Beat Iron-Jaw on hard',
];
