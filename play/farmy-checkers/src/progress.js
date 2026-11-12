


















import { t } from '../../../web-engine/i18n/tr.js';
import { levelOf } from '../../../web-engine/words/scoring.js';

const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export const POINTS = Object.freeze({ won: 100, draw: 40, lost: 15 });


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const won = n(r.won);
  const drawn = n(r.drawn);
  return { played: Math.max(n(r.played), won + drawn), won, drawn, points: n(r.points), lostInRow: n(r.lostInRow) };
}







export const PRIZES = Object.freeze([
  { id: 'first-game', name: () => t('First game'), need: 1, have: (r) => r.played },
  { id: 'first-win', name: () => t('First win'), need: 1, have: (r) => r.won },
  { id: 'first-draw', name: () => t('First draw'), need: 1, have: (r) => r.drawn },
  { id: 'three-wins', name: () => t('Three wins'), need: 3, have: (r) => r.won },
  { id: 'shepherd', name: () => t('Shepherd'), need: 150, have: (r) => r.points, points: true },
  { id: 'ten-wins', name: () => t('Ten wins'), need: 10, have: (r) => r.won },
  { id: 'harvester', name: () => t('Harvester'), need: 700, have: (r) => r.points, points: true },
  { id: 'twenty-five', name: () => t('Twenty-five games'), need: 25, have: (r) => r.played },
]);


const RANK = {
  Farmhand: () => t('Farmhand'),
  Shepherd: () => t('Shepherd'),
  Grower: () => t('Grower'),
  Harvester: () => t('Harvester'),
  Landholder: () => t('Landholder'),
  'Old Hand': () => t('Old Hand'),
  'Master of the Farm': () => t('Master of the Farm'),
};


export function earnedPrizes(record) {
  const r = cleanRecord(record);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}


export function newPrizes(before, after) {
  const had = new Set(earnedPrizes(before));
  const now = earnedPrizes(after);
  return PRIZES.filter((p) => !had.has(p.id) && now.includes(p.id)).map((p) => p.name());
}


export const prizeCount = (record) => t('{have} of {all} prizes', { have: earnedPrizes(record).length, all: PRIZES.length });


export const goalHeading = () => t('Next goal');
export const prizesHeading = () => t('Your prizes');


export const newPrizeLine = (name) => t('New prize, {name}.', { name });


export function prizeLines(record) {
  const r = cleanRecord(record);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    const name = p.name();
    if (have >= p.need) return t('{name}, yours', { name });
    if (p.points) return t('{name}, {have} of {need} points', { name, have, need: p.need });
    return t('{name}, {have} of {need}', { name, have, need: p.need });
  });
}






export function nextGoal(record) {
  const r = cleanRecord(record);
  const next = PRIZES.find((p) => p.id !== 'first-draw' && p.have(r) < p.need);
  if (!next) return r.drawn ? t('Play on as long as you like.') : t('Play on. A draw brings the last prize.');
  switch (next.id) {
    case 'first-game': return t('Finish a game against the bot.');
    case 'first-win': return t('Win a game against the bot.');
    case 'three-wins': return t('Win 3 games. You have won {won}.', { won: r.won });
    case 'ten-wins': return t('Win 10 games. You have won {won}.', { won: r.won });
    case 'twenty-five': return t('Play 25 games. You have played {played}.', { played: r.played });
    default: return t('Reach {rank}. You need {left} more points.', { rank: next.name(), left: next.need - r.points });
  }
}





export function rankFill(record) {
  const lv = levelOf(cleanRecord(record).points);
  if (!lv.next) return { share: 1, text: t('Top rank reached') };
  return { share: lv.share, text: t('{left} points to {rank}', { left: lv.toNext, rank: RANK[lv.next]?.() ?? lv.next }) };
}






export function recordAfter(record, outcome, { vsBot = true } = {}) {
  const r = cleanRecord(record);
  if (!(outcome in POINTS)) return r;
  r.played += 1;
  if (outcome === 'won') r.won += 1;
  else if (outcome === 'draw') r.drawn += 1;
  r.points += POINTS[outcome];
  if (vsBot) r.lostInRow = outcome === 'lost' ? r.lostInRow + 1 : 0;
  return r;
}


export const HELP_AFTER = 2;





export function helpLines(record) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return [t('Look for the jump the bot could make next.'), t('Take back a move to try another.')];
}
