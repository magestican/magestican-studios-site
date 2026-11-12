

























export const STORE_KEY = 'hoofrise-record-v1';

const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const herdWins = n(r.herdWins);
  const yieldWins = n(r.yieldWins);
  const won = Math.max(n(r.won), herdWins + yieldWins);
  const hardWins = Math.min(n(r.hardWins), won);
  const routWins = Math.min(n(r.routWins), won);
  const played = Math.max(n(r.played), won);
  return { played, won, herdWins, yieldWins, hardWins, routWins, lostInRow: n(r.lostInRow) };
}





export const HARD_STRENGTH = 95;

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try the other side on a new map.',
    firstMatch: 'Finish a match against the computer.',
    firstWin: 'Win a match against the computer.',
    herdWin: 'Win a match as the animals.',
    yieldWin: 'Win a match as the farmers.',
    hardWin: 'Win a match against the Hard opponent.',
    routWin: 'Win before the clock runs out.',
    wins: 'Win {need} matches. You have won {n}.',
    tipHerd: 'Keep moving to new ground. Animals take it fast, so take more.',
    tipYield: 'Hold what you take. Farmers are slow, but hard to push back.',
    tipGentle: 'Pick the Gentle opponent, and hold the water for more to spend.',
    names: ['First match', 'First win', 'Animal win', 'Farmer win', 'Three wins', 'Hard win', 'Early win', 'Ten wins'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));





export const PRIZES = Object.freeze([
  { id: 'first-match', need: 1, have: (r) => r.played, goal: (W) => W.firstMatch },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'herd-win', need: 1, have: (r) => r.herdWins, goal: (W) => W.herdWin },
  { id: 'yield-win', need: 1, have: (r) => r.yieldWins, goal: (W) => W.yieldWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard-win', need: 1, have: (r) => r.hardWins, goal: (W) => W.hardWin },
  { id: 'early-win', need: 1, have: (r) => r.routWins, goal: (W) => W.routWin },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
]);


export function progressWords(lang) {
  return WORDS[lang] ?? WORDS.en;
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

const EARLY = new Set(['rout', 'eliminated']);











export function matchOutcome({ networked = false, observing = false, seats, mySeat, winner, endReason = '' } = {}) {
  if (networked || observing) return null;
  if (!Array.isArray(seats) || seats.length < 2) return null;
  if (!Number.isInteger(mySeat) || mySeat < 0 || mySeat >= seats.length) return null;
  const me = seats[mySeat];
  if (!me || me.bot) return null;
  const others = seats.filter((s, i) => i !== mySeat);
  if (others.some((s) => !s || !s.bot)) return null;
  const won = Number.isInteger(winner) && winner === mySeat;
  const hard = others.every((s) => n(s.bot.strengthPct) >= HARD_STRENGTH);
  return { won, faction: String(me.faction ?? ''), hard, early: won && EARLY.has(endReason) };
}





export function recordAfter(record, match) {
  const r = cleanRecord(record);
  if (!match) return r;
  r.played += 1;
  if (match.won) {
    r.won += 1;
    if (match.faction === 'herd') r.herdWins += 1;
    if (match.faction === 'yield') r.yieldWins += 1;
    if (match.hard) r.hardWins += 1;
    if (match.early) r.routWins += 1;
    r.lostInRow = 0;
  } else {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;





export function helpLines(W, record, faction) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return [faction === 'yield' ? W.tipYield : W.tipHerd, W.tipGentle];
}
