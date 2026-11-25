






















import { rcTuning } from '../../../web-engine/rc/rcTuning.js';

export const CLASSES = Object.freeze({
  zippy: Object.freeze({
    name: 'Zippy', blurb: 'Quick off the line and sharp in the turns, but bigger cars push it around.',
    mul: Object.freeze({ topSpeed: 0.97, accel: 1.08, turnRate: 1.08, gripTurn: 1.0, weight: 0.75 }),
  }),
  allround: Object.freeze({
    name: 'All-round', blurb: 'No weak spot, and the car the tracks were built for.',
    mul: Object.freeze({ topSpeed: 1, accel: 1, turnRate: 1, gripTurn: 1, weight: 1 }),
  }),
  heavy: Object.freeze({
    name: 'Heavy', blurb: 'Slow to get going, hard to stop, and it pushes back.',
    mul: Object.freeze({ topSpeed: 1.03, accel: 0.95, turnRate: 0.94, gripTurn: 1.05, weight: 1.35 }),
  }),
});

const BODY_CLASS = Object.freeze({
  buggy: 'allround', rally: 'allround',
  openwheel: 'zippy', street: 'zippy',
  monster: 'heavy', pickup: 'heavy',
});


export const BODIES = Object.freeze(['buggy', 'monster', 'openwheel', 'rally', 'pickup', 'street']);

export function classOf(body) {
  const id = BODY_CLASS[body];
  if (!id) throw new Error(`carClass: no class for body "${body}"`);
  return id;
}


export const bodyFor = (slot, mine) => (mine ? 'buggy' : BODIES[slot % BODIES.length]);


export function classTuning(classId) {
  const c = CLASSES[classId];
  if (!c) throw new Error(`carClass: no class "${classId}"`);
  const base = rcTuning();
  const out = { ...base, id: `${base.id}-${classId}`, carClass: classId };
  for (const [k, m] of Object.entries(c.mul)) out[k] = base[k] * m;
  return out;
}


const CARD = [['Speed', 'topSpeed'], ['Launch', 'accel'], ['Turning', 'turnRate'], ['Weight', 'weight']];

export function statsCard(classId) {
  const c = CLASSES[classId];
  if (!c) throw new Error(`carClass: no class "${classId}"`);
  const stats = CARD.map(([label, k]) => {
    const all = Object.values(CLASSES).map((o) => o.mul[k]);
    const lo = Math.min(...all), hi = Math.max(...all);
    const v = c.mul[k];
    
    const pips = v === 1 || hi === lo ? 3
      : v < 1 ? Math.round(1 + 2 * (v - lo) / (1 - lo))
        : Math.round(3 + 2 * (v - 1) / (hi - 1));
    return { label, pips };
  });
  return { id: classId, name: c.name, blurb: c.blurb, stats };
}
