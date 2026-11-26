















export const HAZARD_CAR_R = 1.55 / 12; 






export const PERSONALITIES = Object.freeze({
  careful: Object.freeze({ id: 'careful', dodge: ['critter', 'can', 'block', 'marble'], clear: 0.06, lookM: 0.8, lookT: 0.5, pads: false, tail: false, patience: 6 }),
  racer: Object.freeze({ id: 'racer', dodge: ['critter', 'can', 'block'], clear: 0.035, lookM: 0.6, lookT: 0.4, pads: true, tail: false, patience: 4 }),
  bully: Object.freeze({ id: 'bully', dodge: ['critter'], clear: 0.02, lookM: 0.4, lookT: 0.3, pads: true, tail: true, patience: 2.5 }),
});

const ORDER = [PERSONALITIES.racer, PERSONALITIES.careful, PERSONALITIES.bully];

export const personalityOf = (slot) => ORDER[((slot % 3) + 3) % 3];

const ahead = (from, to, length) => {
  const d = (to - from) % length;
  return d < 0 ? d + length : d;
};

const EDGE = HAZARD_CAR_R + 0.04; 
const PAST = 0.12; 


const AIM_NEAR = 0.3;
const AIM_FAR = 0.55;


export const lookOf = (p, speed = 0) => p.lookM + Math.max(0, speed) * p.lookT;







export function hazardAim(me, hazards, p, { length, half }) {
  let best = null;
  let bestD = Infinity;
  const look = lookOf(p, me.speed);
  for (const h of hazards) {
    if (!p.dodge.includes(h.kind)) continue;
    const d = ahead(me.s, h.s, length);
    if (d <= 0 || d > look || d >= bestD) continue;
    const gap = h.r + HAZARD_CAR_R + p.clear;
    if (Math.abs(h.side - me.side) >= gap) continue;
    best = { h, gap };
    bestD = d;
  }
  if (!best) return null;
  const { h, gap } = best;
  const room = half - EDGE;
  const sides = [h.side + gap, h.side - gap].filter((v) => Math.abs(v) <= room);
  if (!sides.length) return null;
  sides.sort((a, b) => Math.abs(a - me.side) - Math.abs(b - me.side));
  const lead = Math.max(AIM_NEAR, Math.min(AIM_FAR, bestD + PAST));
  return { s: (me.s + lead) % length, side: sides[0] };
}

const TAIL_REACH = 0.8; 
const TAIL_LANE = 0.35; 






export function tailAim(me, cars, p, { length, half }) {
  if (!p.tail) return null;
  let mark = null;
  let markD = Infinity;
  for (const c of cars) {
    if (c.id === me.id) continue;
    const d = ahead(me.s, c.s, length);
    if (d <= 0 || d > TAIL_REACH || d >= markD) continue;
    if (Math.abs(c.side - me.side) > TAIL_LANE) continue;
    mark = c;
    markD = d;
  }
  if (!mark || Math.abs(mark.side) > half - 0.3) return null;
  return { s: (mark.s + 0.1) % length, side: mark.side };
}







export const REACT = 0.3;

const carIn = (me, cars, { from, to, lane = Infinity }, length) => cars.some((c) => {
  if (c.id === me.id) return false;
  let d = (c.s - me.s) % length;
  if (d > length / 2) d -= length;
  if (d < -length / 2) d += length;
  return d >= from && d <= to && Math.abs(c.side - me.side) <= lane;
});


export const USE_RULES = Object.freeze({
  battery: () => true,
  
  rocket: (me, cars, p, L) => {
    const close = carIn(me, cars, { from: 0, to: 0.8, lane: 0.3 }, L);
    if (p.id === 'bully') return close || !carIn(me, cars, { from: 0, to: 3 }, L);
    return !close;
  },
  magnet: (me, cars, p, L) => carIn(me, cars, { from: 0.4, to: 3 }, L),
  band: (me, cars, p, L) => carIn(me, cars, { from: 0.5, to: 7, lane: 0.6 }, L),
  marble: (me, cars, p, L) => carIn(me, cars, { from: 0.5, to: 4, lane: 0.15 }, L),
  balloon: (me, cars, p, L) => carIn(me, cars, { from: 1, to: 3, lane: 0.5 }, L),
  
  
  gum: (me, cars, p, L) => carIn(me, cars, { from: -2.5, to: -0.8, lane: 0.3 }, L),
  fan: (me, cars, p, L) => carIn(me, cars, { from: -2.5, to: -0.8 }, L) && !carIn(me, cars, { from: -0.8, to: 0 }, L),
});




export function wantsUse(pickup, me, cars, p, { length, heldFor }) {
  if (heldFor < REACT) return false;
  if (heldFor >= p.patience) return true;
  const rule = USE_RULES[pickup];
  return rule ? rule(me, cars, p, length) : true;
}
