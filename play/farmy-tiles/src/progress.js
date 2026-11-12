






















const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const won = n(r.won);
  return {
    played: Math.max(n(r.played), won), won, best: n(r.best), bingos: n(r.bingos), lostInRow: n(r.lostInRow),
  };
}


export const BIG_PLAY = 30;






export const PRIZES = Object.freeze([
  { id: 'first-game', name: 'First game', need: 1, have: (r) => r.played,
    goal: () => 'Finish a game against the computer.' },
  { id: 'first-win', name: 'First win', need: 1, have: (r) => r.won,
    goal: () => 'Win a game against the computer.' },
  { id: 'thirty', name: 'Thirty in one', need: BIG_PLAY, have: (r) => r.best,
    goal: (r) => (r.best ? `Make a play worth ${BIG_PLAY} points. Your best is ${r.best}.`
      : `Make a play worth ${BIG_PLAY} points.`) },
  { id: 'three-wins', name: 'Three wins', need: 3, have: (r) => r.won,
    goal: (r) => `Win 3 games. You have won ${r.won}.` },
  { id: 'five-games', name: 'Five games', need: 5, have: (r) => r.played,
    goal: (r) => `Play 5 games. You have played ${r.played}.` },
  { id: 'all-seven', name: 'All seven', need: 1, have: (r) => r.bingos,
    goal: () => 'Use all seven tiles in one play.' },
  { id: 'ten-wins', name: 'Ten wins', need: 10, have: (r) => r.won,
    goal: (r) => `Win 10 games. You have won ${r.won}.` },
  { id: 'twenty-five', name: 'Twenty-five games', need: 25, have: (r) => r.played,
    goal: (r) => `Play 25 games. You have played ${r.played}.` },
]);

export const GOAL_HEADING = 'Next goal';
export const PRIZES_HEADING = 'Your prizes';
export const SEE_PRIZES = 'See prizes';
export const newPrizeLine = (name) => `New prize, ${name}.`;


export function earnedPrizes(record) {
  const r = cleanRecord(record);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}


export function newPrizes(before, after) {
  const had = new Set(earnedPrizes(before));
  const now = earnedPrizes(after);
  return PRIZES.filter((p) => !had.has(p.id) && now.includes(p.id)).map((p) => p.name);
}


export const prizeCount = (record) => `${earnedPrizes(record).length} of ${PRIZES.length} prizes`;

const nextPrize = (r) => PRIZES.find((p) => p.have(r) < p.need) ?? null;


export function nextGoal(record) {
  const r = cleanRecord(record);
  const next = nextPrize(r);
  return next ? next.goal(r) : 'Play on as long as you like.';
}






export function goalFill(record) {
  const r = cleanRecord(record);
  const next = nextPrize(r);
  return { share: next ? Math.min(next.have(r), next.need) / next.need : 1, text: prizeCount(r) };
}


export function prizeLines(record) {
  const r = cleanRecord(record);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    return have >= p.need ? `${p.name}, yours` : `${p.name}, ${have} of ${p.need}`;
  });
}






export function playsBy(history, seat) {
  let best = 0;
  let bingos = 0;
  for (const h of Array.isArray(history) ? history : []) {
    if (!h || h.seat !== seat || h.kind !== 'play') continue;
    best = Math.max(best, n(h.score));
    if (h.bingo) bingos += 1;
  }
  return { best, bingos };
}







export function recordAfter(record, verdict, plays = { best: 0, bingos: 0 }) {
  const r = cleanRecord(record);
  if (!verdict) return r;
  r.played += 1;
  if (verdict.outcome === 'win') r.won += 1;
  r.best = Math.max(r.best, n(plays.best));
  r.bingos += n(plays.bingos);
  if (verdict.mode === 'bots') r.lostInRow = verdict.outcome === 'loss' ? r.lostInRow + 1 : 0;
  return r;
}


export const HELP_AFTER = 2;






export function helpLines(record) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return ['Put a word on a coloured square for double or triple points.', 'Use Swap when your rack has no good word.'];
}
