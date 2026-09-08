
















































import { actFor, isBossDeck, openingGate } from './acts.js';
import { seededRng, insideLevel, progressAt, routeLength, routePointAt, corners } from './level.js';

export const BEAT_RULES = Object.freeze({
  perAct: { 1: 1, 2: 2, 3: 2 },
  
  
  
  
  
  
  spare: 2,
  minFromHazard: 8,
  minFromBay: 8,
  minFromOpening: 10,
  minFromStart: 10,
  spacing: 12,          
  window: [0.24, 0.92], 
  attempts: 60,
  cornerAhead: [12, 22],  
  runEndMin: 8,           
});

export const SPEAKERS = Object.freeze(['pa', 'survivor']);

export const BEATS = Object.freeze([
  {
    id: 'hookBody', kind: 'setPiece', acts: [2, 3], setPiece: 'hookBody',
    trigger: 'pass', reach: 2.5, duration: 4, sound: 'chainCreak',
    text: 'a body on a hook that swings as you pass it',
  },
  {
    id: 'chickenCrossing', kind: 'apparition', acts: [1, 2, 3], species: 'chicken',
    where: 'cornerAhead', trigger: 'reach', duration: 1.4, sound: 'chickenScurry',
    text: 'a chicken crosses the corridor at the corner ahead and is gone',
  },
  {
    id: 'lightsDropPA', kind: 'lights', acts: [1, 2, 3], seconds: 3, mode: 'out',
    pa: 'beat:lightsDrop', speaker: 'pa', trigger: 'reach', anchors: ['onLeave:safe'],
    text: 'the lights drop for three seconds and the PA speaks into it',
  },
  {
    id: 'porkerAtWindow', kind: 'apparition', acts: [1, 2, 3], species: 'porker',
    setPiece: 'grilleWindow', trigger: 'reach', duration: 2.6, sound: 'porkerBreathFar',
    text: 'a porker walks past a grille in the wall without noticing you',
  },
  {
    id: 'lockerRattle', kind: 'setPiece', acts: [1, 2, 3], setPiece: 'locker',
    trigger: 'pass', reach: 2.0, duration: 1.2, sound: 'lockerRattle', empty: true,
    text: 'a locker rattles as you pass; it is empty',
  },
  {
    id: 'cowSilhouette', kind: 'apparition', acts: [1, 2, 3], species: 'cow',
    where: 'runEnd', trigger: 'reach', duration: 2.0, sound: 'cowLowFar',
    text: 'a cow silhouette at the end of the corridor steps back into the dark',
  },
  {
    id: 'grilleFalls', kind: 'setPiece', acts: [1, 2, 3], setPiece: 'duct', ahead: 8,
    trigger: 'reach', duration: 0.8, sound: 'grilleFall', empty: true,
    text: 'a duct grille falls off ahead of you; nothing is behind it',
  },
  {
    id: 'dripStream', kind: 'fx', acts: [1, 2, 3], fx: 'ceilingDrip', duration: 12, ramp: 6,
    trigger: 'reach', sound: 'dripToStream',
    text: 'a ceiling drip that becomes a stream',
  },
  {
    id: 'tannoyMusic', kind: 'audio', acts: [1, 2, 3], seconds: 10, cut: true,
    pa: 'beat:music', speaker: 'pa', trigger: 'reach', anchors: ['onEnter:safe'],
    text: 'the tannoy plays music for ten seconds and cuts out',
  },
  {
    id: 'survivorIntercom', kind: 'voice', acts: [1, 2, 3], speaker: 'survivor',
    pa: 'beat:survivorIntercom', setPiece: 'intercom', trigger: 'reach', duration: 6, minLevel: 2,
    text: "a survivor's voice on the intercom nearby",
  },
  {
    id: 'brownout', kind: 'lights', acts: [1, 2, 3], seconds: 6, mode: 'emergency',
    trigger: 'reach', sound: 'powerBrownout', anchors: ['onLeave:safe'],
    text: "the deck's power browns out for six seconds; the emergency light",
  },
  {
    id: 'doorSlamBehind', kind: 'audio', acts: [1, 2, 3], behind: 15, sound: 'doorSlam',
    trigger: 'reach', duration: 1,
    text: 'a door slams somewhere behind you',
  },
  {
    id: 'ceilingSteps', kind: 'audio', acts: [2, 3], sound: 'ceilingSteps', duration: 4,
    movesAway: true, trigger: 'reach',
    text: 'heavy steps in the ceiling overhead, moving away',
  },
  {
    id: 'dragTrail', kind: 'decal', acts: [1, 2, 3], where: 'backRoomDoor', decal: 'dragTrail',
    trigger: 'reach', duration: 0,
    text: 'a fresh drag trail leads into a back room',
  },
  {
    id: 'paCallsName', kind: 'voice', acts: [1, 2, 3], speaker: 'pa', pa: 'beat:paCallsName',
    repeats: 3, trigger: 'reach', duration: 8, minLevel: 2,
    text: 'the PA calls a name three times and stops',
  },
  {
    id: 'fixtureSwing', kind: 'setPiece', acts: [1, 2, 3], setPiece: 'lightFixture',
    trigger: 'pass', reach: 3, duration: 5, sound: 'fixtureCreak',
    text: 'a light fixture swings after something passes above it',
  },
]);


export const PA_TRIGGERS = Object.freeze([...new Set(BEATS.filter((b) => b.pa).map((b) => b.pa))]);

const byId = (id) => BEATS.find((b) => b.id === id);

function shuffle(list, r) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const distToRect = (rc, x, z) => {
  const dx = Math.max(rc.x0 - x, 0, x - rc.x1);
  const dz = Math.max(rc.z0 - z, 0, z - rc.z1);
  return Math.hypot(dx, dz);
};









export function beatIdsFor(level, campaignSeed = 1) {
  let prev = [];
  let out = { pick: [], spare: [] };
  for (let L = 1; L <= Math.max(1, level); L += 1) {
    if (isBossDeck(L)) { out = { pick: [], spare: [] }; prev = []; continue; }
    const act = actFor(L);
    const eligible = BEATS
      .filter((b) => b.acts.includes(act) && L >= (b.minLevel || 1) && !prev.includes(b.id))
      .map((b) => b.id);
    const r = seededRng(campaignSeed * 7919 + L * 104729 + 7);
    const n = BEAT_RULES.perAct[Math.min(3, act)] || 1;
    const drawn = shuffle(eligible, r);
    out = { pick: drawn.slice(0, n), spare: drawn.slice(n, n + BEAT_RULES.spare) };
    prev = [...out.pick, ...out.spare];
  }
  return out;
}











export function beatsFor(level, plan, { hazards = [], campaignSeed = 1 } = {}) {
  if (isBossDeck(level)) return [];
  const drawn = beatIdsFor(level, campaignSeed);
  const ids = [...drawn.pick, ...drawn.spare];
  const want = drawn.pick.length;
  const r = seededRng(plan.seed * 6113 + level * 271 + 19);
  const total = routeLength(plan);
  const startP = progressAt(plan, plan.start.x, plan.start.z);
  const bays = plan.bays || [];
  const opening = openingGate(plan, level, plan.seed);
  const safe = plan.rooms.find((m) => m.kind === 'safe') || null;
  const back = plan.rooms.filter((m) => m.kind === 'back');
  const cs = corners(plan);
  const hazardPoints = hazards.flatMap((h) => [{ x: h.x, z: h.z }, h.valve, h.box, h.vent].filter(Boolean));
  const placed = [];

  const legal = (x, z, p) => {
    if (p - startP < BEAT_RULES.minFromStart) return false;
    if (!insideLevel(plan, x, z, 0.3)) return false;
    for (const q of hazardPoints) if (Math.hypot(x - q.x, z - q.z) < BEAT_RULES.minFromHazard) return false;
    for (const b of bays) if (distToRect(b, x, z) < BEAT_RULES.minFromBay) return false;
    if (opening && Math.hypot(x - opening.x, z - opening.z) < BEAT_RULES.minFromOpening) return false;
    for (const o of placed) if (Math.abs(o.progress - p) < BEAT_RULES.spacing) return false;
    return true;
  };

  for (const id of ids) {
    if (placed.length >= want) break;
    const beat = byId(id);
    let done = null;

    
    if (beat.anchors && safe && r() < 0.6) {
      const anchor = beat.anchors[Math.floor(r() * beat.anchors.length) % beat.anchors.length];
      const dp = progressAt(plan, safe.door.x, safe.door.z);
      if (legal(safe.door.x, safe.door.z, dp)) {
        done = { ...beat, at: anchor, progress: dp, x: safe.door.x, z: safe.door.z, run: routePointAt(plan, dp).run };
      }
    }
    
    
    if (!done && beat.where === 'backRoomDoor') {
      for (const m of shuffle(back.filter((q) => q.contents !== 'item'), r)) {
        const dp = progressAt(plan, m.door.x, m.door.z);
        if (!legal(m.door.x, m.door.z, dp)) continue;
        done = { ...beat, at: dp / total, progress: dp, x: m.door.x, z: m.door.z, run: routePointAt(plan, dp).run, room: m };
        break;
      }
    }
    
    for (let a = 0; a < BEAT_RULES.attempts && !done; a += 1) {
      const f = BEAT_RULES.window[0] + r() * (BEAT_RULES.window[1] - BEAT_RULES.window[0]);
      const p = f * total;
      const pt = routePointAt(plan, p);
      if (!legal(pt.x, pt.z, p)) continue;
      const run = plan.runs[pt.run];
      const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
      const cand = { ...beat, at: f, progress: p, x: pt.x, z: pt.z, run: pt.run };
      if (beat.where === 'cornerAhead') {
        const c = cs.find((q) => q.progress - p >= BEAT_RULES.cornerAhead[0] && q.progress - p <= BEAT_RULES.cornerAhead[1]);
        if (!c || c.runBefore !== pt.run) continue;     
        cand.target = { x: c.x, z: c.z, progress: c.progress, corner: c.index };
      } else if (beat.where === 'runEnd') {
        if ((1 - pt.t) * len < BEAT_RULES.runEndMin) continue;
        cand.target = { x: run.x1, z: run.z1, progress: p + (1 - pt.t) * len, run: pt.run };
      } else if (beat.ahead) {
        if ((1 - pt.t) * len < beat.ahead + 1) continue;   
        const q = routePointAt(plan, p + beat.ahead);
        cand.target = { x: q.x, z: q.z, progress: p + beat.ahead, run: q.run };
      } else if (beat.behind) {
        const q = routePointAt(plan, Math.max(0, p - beat.behind));
        cand.target = { x: q.x, z: q.z, progress: Math.max(0, p - beat.behind), run: q.run };
      }
      done = cand;
    }
    if (done) placed.push(done);
  }
  return placed;
}
