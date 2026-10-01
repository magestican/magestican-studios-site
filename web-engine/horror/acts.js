





































import { ENTRANCE } from './entrance.js';
import {
  seededRng, insideLevel, progressAt, wallPointAt, corners,
} from './level.js';

export const ACT_LEN = 4;   

export const ACTS = Object.freeze([
  {
    name: 'ACT I - THE STOCK DECKS',
    
    
    
    behind: [18, 30],
    porkerFromCorner: 3,
    cows: 1,
    ahead: 0,
    opening: {
      
      
      
      
      
      
      
      
      telegraph: { at: 8, kind: 'ductRattle', ahead: 12 },
      first: { species: 'chicken', via: 'duct', ahead: 12, by: 12 },
      teaches: 'struggle:chicken',
      
      
      
      
      
      lightEvent: { at: 'firstCornerAfterFirstEncounter', kind: 'flicker', seconds: 1.5 },
      
      
      
      porkerNotBeforeRun: 3,
    },
  },
  {
    name: 'ACT II - PROCESSING',
    
    
    
    behind: [14, 24, 34],
    porkerFromCorner: 2,
    cows: 2,
    ahead: 0,
    opening: {
      
      
      
      
      
      telegraph: { at: 6, kind: 'wallThud', ahead: 12 },
      first: { species: 'porker', via: 'breach', ahead: 12, by: 11 },
      teaches: 'move:keepMoving',
      lightEvent: { at: 'control', kind: 'drop', seconds: 3 },
      porkerNotBeforeRun: 1,
    },
  },
  {
    name: 'ACT III - THE DARK DECKS',
    
    
    
    behind: [12, 20, 30],
    porkerFromCorner: 1,
    cows: 2,
    ahead: 1,
    opening: {
      
      
      
      
      
      telegraph: { at: 4, kind: 'brownout', ahead: 10 },
      first: { species: 'chicken', via: 'duct', ahead: 10, by: 9 },
      teaches: 'route:ahead',
      lightEvent: { at: 'control', kind: 'emergency', seconds: 6 },
      porkerNotBeforeRun: 1,
    },
  },
]);















export const FINAL_DECK = ACTS.length * ACT_LEN;


export function isFinalDeck(level) {
  return level === FINAL_DECK;
}



export function actFor(level) {
  return Math.min(ACTS.length, Math.max(1, Math.ceil(level / ACT_LEN)));
}


export function isBossDeck(level) {
  return level > 0 && level % ACT_LEN === 0;
}



export function rosterFor(level) {
  if (isBossDeck(level)) return null;
  return ACTS[actFor(level) - 1];
}



export function actCardFor(level) {
  if (level <= 1 || isBossDeck(level)) return null;
  const first = (level - 1) % ACT_LEN === 0;
  return first ? ACTS[actFor(level) - 1].name : null;
}





export const OPENING = Object.freeze({
  
  
  
  
  maxSeconds: 30,
  within: 12,
  
  
  
  nudge: [0, 1, -1, 2, -2, 3, -3],
  minFromDoor: 2.0,
  minFromCorner: 2.0,
  minFromBay: 2.0,
});


export function openingFor(level) {
  if (isBossDeck(level)) return null;
  return ACTS[actFor(level) - 1].opening;
}







export function firstPorkerRunIndex(act) {
  const p = Math.max(1, act.porkerFromCorner);
  return p % 2 === 1 ? p : p + 1;
}




export function openingTimeline(level) {
  const o = openingFor(level);
  if (!o) return null;
  const e = ENTRANCE[o.first.via];
  return {
    telegraphAt: o.telegraph.at,
    firstAwakeAt: o.telegraph.at + e.telegraph + e.burst + e.emerge,
    by: o.first.by,
    species: o.first.species,
    via: o.first.via,
    lightEvent: o.lightEvent,
  };
}

const distToRect = (rc, x, z) => {
  const dx = Math.max(rc.x0 - x, 0, x - rc.x1);
  const dz = Math.max(rc.z0 - z, 0, z - rc.z1);
  return Math.hypot(dx, dz);
};

















export function openingGate(plan, level, seed = plan.seed) {
  const o = openingFor(level);
  if (!o) return null;
  const startP = progressAt(plan, plan.start.x, plan.start.z);
  const r = seededRng(seed * 48271 + level * 977 + 3);
  const firstSide = r() < 0.5 ? -1 : 1;
  const cs = corners(plan);
  const bays = plan.bays || [];
  for (const side of [firstSide, -firstSide]) {
    for (const nudge of OPENING.nudge) {
      const p = startP + o.first.ahead + nudge;
      const w = wallPointAt(plan, p, side);
      if (insideLevel(plan, w.x - w.nx * 0.2, w.z - w.nz * 0.2, 0.05)) continue;    
      if (!insideLevel(plan, w.x + w.nx * 0.8, w.z + w.nz * 0.8, 0.3)) continue;    
      if (plan.rooms.some((m) => Math.hypot(m.door.x - w.x, m.door.z - w.z) < OPENING.minFromDoor)) continue;
      if (cs.some((c) => Math.abs(c.progress - p) < OPENING.minFromCorner)) continue;
      if (bays.some((b) => distToRect(b, w.x, w.z) < OPENING.minFromBay)) continue;
      return {
        x: w.x, z: w.z, nx: w.nx, nz: w.nz, run: w.run, side,
        kind: o.first.via, species: o.first.species, scripted: true,
        progress: p, ahead: p - startP,
      };
    }
  }
  return null;
}









export function openingRosterAt(plan, level) {
  const act = rosterFor(level);
  if (!act) return null;
  const first = firstPorkerRunIndex(act);
  const at = (x, z) => progressAt(plan, x, z);
  const porkers = [];
  plan.runs.forEach((run, i) => {
    if (run.axis !== 'x' || i < first) return;
    const x = (run.x0 + run.x1) / 2; const z = run.z1;
    porkers.push({ x, z, run: i, progress: at(x, z) });
  });
  const zRuns = plan.runs.map((q, i) => ({ q, i })).filter(({ q }) => q.axis === 'z');
  const last = zRuns[zRuns.length - 1];
  const cows = [{ x: last.q.x0, z: last.q.z0 + (last.q.z1 - last.q.z0) * 0.45, run: last.i }];
  if (act.cows >= 2 && zRuns.length > 2) {
    const mid = zRuns[Math.floor(zRuns.length / 2) - 1];
    cows.push({ x: mid.q.x0, z: mid.q.z0 + (mid.q.z1 - mid.q.z0) * 0.5, run: mid.i });
  }
  for (const c of cows) c.progress = at(c.x, c.z);
  return { porkers, cows };
}







export function teachingOrderFor(plan, level) {
  const o = openingFor(level);
  const roster = openingRosterAt(plan, level);
  if (!o || !roster) return null;
  const gate = openingGate(plan, level);
  const startP = progressAt(plan, plan.start.x, plan.start.z);
  const firstP = gate ? gate.progress : startP + o.first.ahead;
  const porkerP = roster.porkers.length ? Math.min(...roster.porkers.map((p) => p.progress)) : Infinity;
  const cowP = Math.min(...roster.cows.map((c) => c.progress));
  return {
    first: o.first.species,
    chicken: o.first.species === 'chicken' ? firstP : Infinity,
    porker: Math.min(porkerP, o.first.species === 'porker' ? firstP : Infinity),
    cow: cowP,
  };
}
