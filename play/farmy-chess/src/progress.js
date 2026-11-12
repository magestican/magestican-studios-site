

















import { levelOf } from '../../../web-engine/words/scoring.js';
import { pointsFrom } from '../../../web-engine/chess/chessBot.js';

const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  return { won: n(r.won), drawn: n(r.drawn), lost: n(r.lost), lostInRow: n(r.lostInRow) };
}

const games = (r) => r.won + r.drawn + r.lost;
const points = (r) => pointsFrom(r);






export const PRIZES = Object.freeze([
  { id: 'first-game', name: 'First game', need: 1, have: games },
  { id: 'first-win', name: 'First win', need: 1, have: (r) => r.won },
  { id: 'first-draw', name: 'First draw', need: 1, have: (r) => r.drawn },
  { id: 'three-wins', name: 'Three wins', need: 3, have: (r) => r.won },
  { id: 'shepherd', name: 'Shepherd', need: 150, have: points },
  { id: 'ten-wins', name: 'Ten wins', need: 10, have: (r) => r.won },
  { id: 'harvester', name: 'Harvester', need: 700, have: points },
  { id: 'twenty-five', name: 'Twenty-five games', need: 25, have: games },
]);


export function earnedPrizes(record) {
  const r = cleanRecord(record);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}


export function newPrizes(before, after) {
  const had = new Set(earnedPrizes(before));
  return PRIZES.filter((p) => !had.has(p.id) && earnedPrizes(after).includes(p.id)).map((p) => p.name);
}


export function prizeCount(record) {
  return `${earnedPrizes(record).length} of ${PRIZES.length} prizes`;
}


export const GOAL_HEADING = 'Next goal';
export const PRIZES_HEADING = 'Your prizes';


export const newPrizeLine = (name) => `New prize, ${name}.`;


export function prizeLines(record) {
  const r = cleanRecord(record);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    if (have >= p.need) return `${p.name}, yours`;
    if (p.id === 'shepherd' || p.id === 'harvester') return `${p.name}, ${have} of ${p.need} points`;
    return `${p.name}, ${have} of ${p.need}`;
  });
}






export function nextGoal(record) {
  const r = cleanRecord(record);
  const next = PRIZES.find((p) => p.id !== 'first-draw' && p.have(r) < p.need);
  if (!next) {
    return r.drawn ? 'Play on as long as you like.' : 'Play on. A draw brings the last prize.';
  }
  switch (next.id) {
    case 'first-game': return 'Finish a game against the bot.';
    case 'first-win': return 'Win a game against the bot.';
    case 'three-wins': return `Win 3 games. You have won ${r.won}.`;
    case 'ten-wins': return `Win 10 games. You have won ${r.won}.`;
    case 'twenty-five': return `Play 25 games. You have played ${games(r)}.`;
    default: return `Reach ${next.name}. You need ${next.need - points(r)} more points.`;
  }
}





export function rankFill(record) {
  const r = cleanRecord(record);
  const lv = levelOf(points(r));
  if (!lv.next) return { share: 1, text: 'Top rank reached' };
  return { share: lv.share, text: `${lv.toNext} points to ${lv.next}` };
}






export function recordAfter(record, outcome, { vsBot = true } = {}) {
  const r = cleanRecord(record);
  if (outcome === 'won') r.won += 1;
  else if (outcome === 'lost') r.lost += 1;
  else if (outcome === 'draw') r.drawn += 1;
  else return r;
  if (vsBot) r.lostInRow = outcome === 'lost' ? r.lostInRow + 1 : 0;
  return r;
}


export const HELP_AFTER = 2;





export function helpLines(record) {
  const r = cleanRecord(record);
  if (r.lostInRow < HELP_AFTER) return [];
  return ['Look at what the bot just attacked before you move.', 'Take back a move to try another.'];
}
