
















import { start, stepOnce } from '../../../web-engine/board/ludoRules.js';

const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const won = n(r.won);
  return { played: Math.max(n(r.played), won), won, knocks: n(r.knocks), lostInRow: n(r.lostInRow) };
}






export const PRIZES = Object.freeze([
  { id: 'first-game', name: 'First game', need: 1, have: (r) => r.played,
    goal: () => 'Finish a game against the computer.' },
  { id: 'first-knock', name: 'First knock', need: 1, have: (r) => r.knocks,
    goal: () => 'Send a rival piece back to its yard.' },
  { id: 'first-win', name: 'First win', need: 1, have: (r) => r.won,
    goal: () => 'Win a game against the computer.' },
  { id: 'three-wins', name: 'Three wins', need: 3, have: (r) => r.won,
    goal: (r) => `Win 3 games. You have won ${r.won}.` },
  { id: 'five-games', name: 'Five games', need: 5, have: (r) => r.played,
    goal: (r) => `Play 5 games. You have played ${r.played}.` },
  { id: 'ten-knocks', name: 'Ten knocks', need: 10, have: (r) => r.knocks,
    goal: (r) => `Send 10 pieces back. You have sent ${r.knocks}.` },
  { id: 'ten-wins', name: 'Ten wins', need: 10, have: (r) => r.won,
    goal: (r) => `Win 10 games. You have won ${r.won}.` },
  { id: 'twenty-five', name: 'Twenty-five games', need: 25, have: (r) => r.played,
    goal: (r) => `Play 25 games. You have played ${r.played}.` },
]);

export const GOAL_HEADING = 'Next goal';
export const PRIZES_HEADING = 'Your prizes';
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





export function outcomeFor(match, mine) {
  if (!match || !Array.isArray(match.seats)) return null;
  if (!Number.isInteger(mine) || mine < 0 || mine >= match.seats.length) return null;
  const vsBot = match.seats.every((s, i) => i === mine || s?.kind === 'bot');
  return { won: match.winner === mine, vsBot };
}






export function recordAfter(record, { won, knocks = 0, vsBot = true }) {
  const r = cleanRecord(record);
  r.played += 1;
  if (won) r.won += 1;
  r.knocks += n(knocks);
  if (vsBot) r.lostInRow = won ? 0 : r.lostInRow + 1;
  return r;
}






export function gameEvents(seats, entries, limit = 40000) {
  let s = start(seats);
  const events = [];
  for (let i = 0; i < limit; i += 1) {
    const r = stepOnce(s, entries);
    s = r.state;
    if (r.did === 'move') events.push(s.event);
    if (r.did !== 'roll' && r.did !== 'move') return { events, over: r.did === 'over' };
  }
  return { events, over: false };
}


export function knocksBy(events, team) {
  return events.reduce((a, e) => a + (e?.kind === 'move' && e.team === team ? (e.captures?.length ?? 0) : 0), 0);
}


export const HELP_AFTER = 2;






export function helpLines(record) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return ['Bring a new piece out on every six.', 'Stop on a star square to keep a piece safe.'];
}
