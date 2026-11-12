

























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const marketWins = n(r.marketWins);
  const stampedeWins = n(r.stampedeWins);
  const won = Math.max(n(r.won), marketWins + stampedeWins);
  const podiums = Math.max(n(r.podiums), won);
  const played = Math.max(n(r.played), podiums);
  return { played, won, podiums, marketWins, stampedeWins, lostInRow: n(r.lostInRow) };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Race on, and try {stampede} over five laps.',
    firstRace: 'Finish a race against the computer.', firstPodium: 'Finish in the top three.',
    firstWin: 'Win a race against the computer.',
    wins: 'Win {need} races. You have won {n}.', winLevel: 'Win a race on {level}.',
    races: 'Finish {need} races. You have raced {n}.',
    tipEasier: 'Try {sunday} in Race setup for a gentler race.',
    tipAssist: 'Pick Assist on in Race setup. It keeps you on the road.',
    tipLaunch: 'Press go on the last beat of the countdown for a boost.',
    tipDrift: 'Hold drift through a bend, then let go for a turbo.',
    names: ['First race', 'First podium', 'First win', 'Three wins', '{market} win', 'Ten wins', '{stampede} win', 'Twenty-five races'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-race', need: 1, have: (r) => r.played, goal: (W) => W.firstRace },
  { id: 'first-podium', need: 1, have: (r) => r.podiums, goal: (W) => W.firstPodium },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'market', need: 1, have: (r) => r.marketWins, goal: (W) => fill(W.winLevel, { level: W.market }) },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'stampede', need: 1, have: (r) => r.stampedeWins, goal: (W) => fill(W.winLevel, { level: W.stampede }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.races, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, labels = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    sunday: labels.sunday ?? 'Sunday Drivers', market: labels.market ?? 'Market Day', stampede: labels.stampede ?? 'Stampede',
  };
  const out = { ...lv };
  for (const [k, v] of Object.entries(W)) out[k] = Array.isArray(v) ? v.map((s) => fill(s, lv)) : fill(v, lv);
  return out;
}


export function earnedPrizes(record) {
  const r = cleanRecord(record);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}

const nameOf = (W, p) => W.names[PRIZES.indexOf(p)];


export function newPrizes(W, before, after) {
  const had = new Set(earnedPrizes(before));
  const now = earnedPrizes(after);
  return PRIZES.filter((p) => !had.has(p.id) && now.includes(p.id)).map((p) => nameOf(W, p));
}


export const prizeCount = (W, record) => fill(W.count, { n: earnedPrizes(record).length, m: PRIZES.length });

const nextPrize = (r) => PRIZES.find((p) => p.have(r) < p.need) ?? null;


export function nextGoal(W, record) {
  const r = cleanRecord(record);
  const p = nextPrize(r);
  return p ? p.goal(W, r, p) : W.playOn;
}


export function goalFill(W, record) {
  const r = cleanRecord(record);
  const p = nextPrize(r);
  return { share: p ? Math.min(p.have(r), p.need) / p.need : 1, text: prizeCount(W, r) };
}


export function prizeLines(W, record) {
  const r = cleanRecord(record);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    const name = nameOf(W, p);
    return have >= p.need ? fill(W.yours, { name }) : fill(W.along, { name, have, need: p.need });
  });
}







export function raceOutcome(result) {
  if (!result || !Number.isFinite(result.position) || result.position < 1) return null;
  if (Array.isArray(result.seats)) return null;
  const field = Number.isFinite(result.fieldSize) ? result.fieldSize : 1;
  return {
    won: result.position === 1 && field >= 2,
    podium: result.position <= 3 && field >= 4,
    level: result.difficulty,
  };
}





export function recordAfter(record, race) {
  const r = cleanRecord(record);
  if (!race) return r;
  r.played += 1;
  if (race.won || race.podium) r.podiums += 1;
  if (race.won) {
    r.won += 1;
    if (race.level === 'market') r.marketWins += 1;
    if (race.level === 'stampede') r.stampedeWins += 1;
    r.lostInRow = 0;
  } else {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;






export function helpLines(W, record, level, assist) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  const first = level !== 'sunday' ? W.tipEasier : (assist ? W.tipLaunch : W.tipAssist);
  return [first, W.tipDrift];
}
