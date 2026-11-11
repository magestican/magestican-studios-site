










import { intelPercent } from '../sim/intel.js';
import { PARS } from './pars.js';

const LEVELS = 20;
const PER_LEVEL = 3; 
const SPECIMEN = 2;


export function parClears(save) {
  let n = 0;
  for (let i = 0; i < LEVELS; i++) {
    const t = save.bestTimes[i];
    if (save.cleared[i] && t !== null && t <= PARS[i]) n++;
  }
  return n;
}

const count = (a) => a.filter(Boolean).length;
const specimens = (save) => save.secrets.filter((v, i) => v && i % PER_LEVEL === SPECIMEN).length;


const PRIZES = [
  { id: 's95-clock-in', name: 'First Day on the Job', desc: 'Clear your first shift.', got: (s) => count(s.cleared) >= 1 },
  { id: 's95-secret-1', name: 'Nosy Surveyor', desc: 'Find your first secret.', got: (s) => count(s.secrets) >= 1 },
  { id: 's95-meets', name: 'Meets Expectations', desc: 'Clear all twenty shifts.', got: (s) => count(s.cleared) >= LEVELS },
  { id: 's95-specimens', name: 'Field Biologist', desc: 'Defeat or scan all twenty specimens.', got: (s) => specimens(s) >= LEVELS },
  { id: 's95-par', name: 'Overtime Not Required', desc: 'Clear ten shifts under par.', got: (s) => parClears(s) >= 10 },
  { id: 's95-exceeds', name: 'Exceeds Expectations', desc: 'Reach 90% Intel.', got: (s) => intelPercent(s) >= 90 },
  { id: 's95-par-all', name: 'Efficiency Award', desc: 'Clear all twenty shifts under par.', got: (s) => parClears(s) >= LEVELS },
  { id: 's95-eoty', name: 'Employee of the Year', desc: 'Reach 100% Intel.', got: (s) => intelPercent(s) >= 100 },
];


export const prizes = (save) => PRIZES.map((p) => ({ id: p.id, name: p.name, desc: p.desc, got: p.got(save) }));

const PRIZE_COUNT = PRIZES.length;


export const prizeLine = (save) => `${prizes(save).filter((p) => p.got).length} of ${PRIZE_COUNT} prizes`;







export function nextGoal(save, names) {
  const label = (i) => `Shift ${i + 1}, ${names[i + 1] ?? ''}`.replace(/, $/, '');
  const uncleared = save.cleared.indexOf(false);
  if (uncleared >= 0) return { shift: uncleared + 1, text: `Clear ${label(uncleared)}.` };
  for (let i = 0; i < LEVELS; i++) {
    if (save.secrets.slice(i * PER_LEVEL, i * PER_LEVEL + PER_LEVEL).some((v) => !v))
      return { shift: i + 1, text: `Find the Intel still hidden on ${label(i)}.` };
  }
  for (let i = 0; i < LEVELS; i++) {
    const t = save.bestTimes[i];
    if (t === null || t > PARS[i]) return { shift: i + 1, text: `Beat par on ${label(i)}.` };
  }
  return { shift: null, text: 'Beat your best times.' };
}






export function sheetNews(before, after, levelId, names) {
  const was = before.bestTimes[levelId - 1];
  const now = after.bestTimes[levelId - 1];
  const newBest = was !== null && now !== null && now < was;
  const had = new Set(
    prizes(before)
      .filter((p) => p.got)
      .map((p) => p.id),
  );
  const won = prizes(after).filter((p) => p.got && !had.has(p.id));
  return { newBest, prizes: won, goal: won.length ? null : nextGoal(after, names) };
}
