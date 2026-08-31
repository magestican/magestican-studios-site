
















import { lineAt } from './racingLine.js';
import { signedDelta, nearestOnBranch, sampleAt } from './trackPath.js';













import { RAIL_AT, RAIL_CATCH, RAIL_RADIUS } from './trackRails.js';
import { GRIND_EXIT_STEER, GRIND_MIN_SPEED, GRIND_MIN_TIME } from './railGrind.js';
import { TIER_TIMES, chargeRate, driftTier } from './driftBoost.js';







export const DIFFICULTIES = Object.freeze({
  
  
  sunday:   Object.freeze({ id: 'sunday',   label: 'Sunday Drivers', pace: 0.86, precision: 0.62, driftSkill: 0.25, itemSkill: 0.35, rubberBand: 0.55 }),
  market:   Object.freeze({ id: 'market',   label: 'Market Day',     pace: 0.94, precision: 0.80, driftSkill: 0.62, itemSkill: 0.70, rubberBand: 0.75 }),
  stampede: Object.freeze({ id: 'stampede', label: 'Stampede',       pace: 1.00, precision: 0.93, driftSkill: 0.92, itemSkill: 0.95, rubberBand: 0.90 }),
});

export const DEFAULT_DIFFICULTY = 'market';








function mix32(n) {
  let h = Math.imul(n, 0x9e3779b1) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}


export function createDriver(seedIndex, difficulty = DEFAULT_DIFFICULTY) {
  const d = DIFFICULTIES[difficulty] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
  return {
    difficulty: d,
    
    
    
    
    
    lineBias: ((seedIndex * 2654435761) % 1000) / 1000 - 0.5,
    phase: ((seedIndex * 40503) % 628) / 100,
    driftHold: 0,
    itemCooldown: 0.4 + (seedIndex % 5) * 0.3,
    lastS: 0,
    
    
    
    
    
    taking: null,
    judged: null,
    arrived: false,
    approachFor: 0,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    nerve: mix32(seedIndex + 1),
    
    
    
    
    
    
    
    
    
    railTaking: null,
    railJudged: null,
    railFor: 0,
    
    
    railRest: 0,
    
    
    
    
    
    
    railRode: false,
    
    
    
    
    
    
    railNerve: mix32(seedIndex + 101),
  };
}








const GAIN_FALLOFF = 1.15;

const clampAngle = (a) => {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
};


















const DECIDE_AHEAD = 55;


const RELEASE_PAST = 6;









function aheadBy(path, s, target) {
  const d = target - s;
  return ((d % path.length) + path.length) % path.length;
}




















export function wantsShortcut(driver, branch) {
  if (!branch || branch.saving <= 2) return false;

  
  
  
  
  
  
  
  
  const d = driver.difficulty;
  
  
  const skill = (d.driftSkill ?? 0.5) * 0.6 + (d.precision ?? 0.5) * 0.4;

  
  
  const grip = branch.grip ?? 1;
  const width = branch.width ?? 14;
  const risk = (1 - grip) * 2.2 + Math.max(0, (14 - width) / 14) * 0.9;

  
  
  
  const appetite = skill * 0.9 + driver.nerve * 0.45;
  return appetite > risk;
}





































const RAIL_DECIDE_AHEAD = 70;









const RAIL_GIVE_UP = 6;












































































































export const RAIL_TOLL = 0.45;











































export const RAIL_REST = 0.9;












const RAIL_WOBBLE_M = (RAIL_RADIUS + RAIL_CATCH) * 0.2;









export function railKey(span) {
  return `${span.side}@${span.from.toFixed(4)}`;
}








export function railSideSign(span) {
  return span.side === 'left' ? 1 : -1;
}











function grindChargeRate(speed, topSpeed) {
  return chargeRate({
    speed, steerLock: 1, onRoad: false, topSpeed: topSpeed || 40,
  });
}








export function railMetresFor(charge, tierTime, speed, topSpeed) {
  const rate = grindChargeRate(speed, topSpeed);
  if (!(rate > 0)) return Infinity;
  return ((tierTime - charge) / rate) * Math.max(0, speed);
}


























export function wantsRail(driver, span, { topSpeed = 45, speed = 0 } = {}) {
  if (!span || !(span.metres > 0)) return false;
  const d = driver.difficulty;
  if ((d.driftSkill ?? 0) <= 0.15) return false;   

  
  const top = Math.max(1, topSpeed);
  if (!(span.limit < top * 0.80)) return false;

  
  
  
  
  const v = Math.max(GRIND_MIN_SPEED, Math.min(speed || top, span.limit));
  const need = railMetresFor(0, TIER_TIMES[0], v, top);
  if (!(need <= span.metres)) return false;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const fit = need / span.metres;
  const skill = (d.driftSkill ?? 0.5) * 0.6 + (d.precision ?? 0.5) * 0.4;
  const appetite = skill * 0.5 + driver.railNerve * 0.8;
  return appetite > fit + RAIL_TOLL;
}



















export function railAim(path, s, sideSign, look, over = RAIL_AT) {
  const p = sampleAt(path, s + look);
  const off = (p.width / 2 + over) * sideSign;
  return {
    x: p.x + p.nx * off,
    z: p.z + p.nz * off,
    tx: p.tx,
    tz: p.tz,
    index: p.index,
  };
}









function aimOnBranch(branch, kart, look) {
  const near = nearestOnBranch(branch, kart.x, kart.z);
  const want = Math.min(branch.length, near.s + look);
  
  
  
  let i = near.index;
  while (i < branch.count - 1 && branch.s[i] < want) i += 1;
  const p = branch.pts[i];
  return { x: p.x, z: p.z, s: near.s, index: near.index, tx: branch.tangents[i].x, tz: branch.tangents[i].z };
}

export function driveBot(driver, kart, line, ctx) {
  const d = driver.difficulty;
  const path = line.path;
  const speed = Math.max(0, kart.speed);
  const surface = ctx.surface;

  
  
  
  
  
  const look = 7 + speed * 0.55;

  
  
  
  
  if (driver.railRest > 0) {
    driver.railRest = Math.max(0, driver.railRest - Math.abs(signedDelta(path, driver.lastS, surface.s)));
  }

  
  
  
  
  
  
  let branchTarget = null;
  const branches = path.branches ?? [];
  if (branches.length) {
    if (driver.taking) {
      const near = nearestOnBranch(driver.taking, kart.x, kart.z);
      const off = Math.hypot(kart.x - near.x, kart.z - near.z);
      
      
      
      
      
      
      
      if (off < (driver.taking.width ?? 12) * 0.75) driver.arrived = true;
      driver.approachFor += ctx.dt ?? 0;

      const done = near.s > driver.taking.length - RELEASE_PAST;
      
      const stray = driver.arrived && off > (driver.taking.width ?? 12);
      
      
      
      const gaveUp = !driver.arrived && driver.approachFor > 6;

      if (done || stray || gaveUp) {
        
        
        driver.taking = null;
        driver.arrived = false;
        driver.approachFor = 0;
      } else branchTarget = aimOnBranch(driver.taking, kart, look);
    } else {
      for (const b of branches) {
        const gap = aheadBy(path, surface.s, b.entryS);
        if (gap > DECIDE_AHEAD) continue;
        if (driver.judged === b.id) break;      
        driver.judged = b.id;
        if (wantsShortcut(driver, b)) {
          driver.taking = b;
          driver.arrived = false;
          driver.approachFor = 0;
        }
        break;
      }
      
      
      
      if (!driver.taking && driver.judged) {
        const b = branches.find((x) => x.id === driver.judged);
        if (b && aheadBy(path, surface.s, b.entryS) > DECIDE_AHEAD * 2) driver.judged = null;
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  let railTarget = null;
  let railExit = false;
  const spans = (!branchTarget && !driver.taking && ctx.rails) ? (ctx.rails.spans ?? []) : [];
  if (spans.length) {
    if (driver.railTaking) {
      const span = driver.railTaking;
      driver.railFor += ctx.dt ?? 0;
      const sideSign = railSideSign(span);
      
      
      
      
      const remaining = aheadBy(path, surface.s, span.to * path.length);
      
      
      const past = remaining > path.length * 0.5;
      
      
      const gaveUp = !kart.grinding && driver.railFor > RAIL_GIVE_UP;
      
      
      
      
      
      if (kart.grinding) driver.railRode = true;
      const rodeItOut = driver.railRode && !kart.grinding;

      if (past || gaveUp || rodeItOut) {
        
        
        driver.railRest = path.length * RAIL_REST;
        
        
        
        driver.railTaking = null;
        driver.railFor = 0;
        driver.railRode = false;
      } else {
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const aimAhead = Math.min(remaining, look);
        const halfW = Math.max(1e-6, (surface.width ?? 20) / 2);
        
        
        
        const shortBy = ((halfW + RAIL_AT) * sideSign - (surface.lateral ?? 0)) * sideSign;
        const lead = Math.min(RAIL_AT, Math.max(0, shortBy));
        const pace = lineAt(line, surface.s + aimAhead);
        railTarget = {
          ...railAim(path, surface.s, sideSign, aimAhead, RAIL_AT + lead),
          speed: pace.speed,
          curvature: pace.curvature,
        };
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        if (kart.grinding && (kart.grindTime ?? 0) >= GRIND_MIN_TIME) {
          const charge = kart.grindCharge ?? 0;
          const top = kart.tuning?.topSpeed ?? 40;
          const next = TIER_TIMES.find((t) => t > charge);
          const reach = next === undefined
            ? Infinity
            : railMetresFor(charge, next, speed, top);
          if (driftTier(charge) >= 1) railExit = true;
          void reach;
        }
      }
    } else if (driver.railRest <= 0) {
      for (const span of spans) {
        const gap = aheadBy(path, surface.s, span.from * path.length);
        if (gap > RAIL_DECIDE_AHEAD) continue;
        const key = railKey(span);
        if (driver.railJudged === key) break;   
        driver.railJudged = key;
        if (wantsRail(driver, span, { topSpeed: kart.tuning?.topSpeed ?? 40, speed })) {
          driver.railTaking = span;
          driver.railFor = 0;
          driver.railRode = false;
        }
        break;
      }
      
      
      if (!driver.railTaking && driver.railJudged) {
        const span = spans.find((x) => railKey(x) === driver.railJudged);
        if (span && aheadBy(path, surface.s, span.from * path.length) > RAIL_DECIDE_AHEAD * 2) {
          driver.railJudged = null;
        }
      }
    }
  } else if (driver.railTaking) {
    
    
    
    driver.railTaking = null;
    driver.railFor = 0;
    driver.railRode = false;
  }

  const target = branchTarget ?? railTarget ?? lineAt(line, surface.s + look);

  
  
  
  
  
  
  
  let wobble = Math.sin(ctx.time * 0.55 + driver.phase) * 1.1 * driver.lineBias * 2;
  if (railTarget) {
    wobble = Math.max(-RAIL_WOBBLE_M, Math.min(RAIL_WOBBLE_M, wobble));
  }
  
  
  
  const targetHeading = target.heading ?? Math.atan2(target.tx, target.tz);
  const tx = target.x + Math.cos(targetHeading) * wobble;
  const tz = target.z - Math.sin(targetHeading) * wobble;

  
  
  
  
  
  
  
  
  
  const want = Math.atan2(tx - kart.x, tz - kart.z);
  const err = clampAngle(want + (kart.slip ?? 0) - kart.heading);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const speedFrac = Math.min(1.2, speed / Math.max(1, kart.tuning.topSpeed));
  const gain = 2.6 / (1 + speedFrac * GAIN_FALLOFF);
  let steer = Math.max(-1, Math.min(1, -err * gain));

  
  
  
  const deadzone = (1 - d.precision) * 0.22;
  if (Math.abs(steer) < deadzone) steer = 0;

  
  
  
  const stopIn = 6 + (speed * speed) / (2 * 22);
  const ahead = lineAt(line, surface.s + stopIn);
  const targetSpeed = Math.min(target.speed, ahead.speed) * d.pace * rubberBand(ctx, d);

  let throttle = 1;
  if (speed > targetSpeed * 1.06) throttle = -1;
  else if (speed > targetSpeed) throttle = 0;

  
  
  
  if (surface.lost) throttle = 1;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cornerIsSlow = target.speed < kart.tuning.topSpeed * (kart.drifting ? 0.92 : 0.80);
  
  
  
  
  
  
  
  
  
  
  
  const roomToDrift = surface.width >= 15 - d.driftSkill * 4;
  
  
  
  
  
  
  
  
  
  const wantDrift = cornerIsSlow && roomToDrift && speed > 13 && d.driftSkill > 0.15;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cornerSteer = -Math.sign(target.curvature || 0);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (wantDrift && !kart.drifting && cornerSteer !== 0 && !railTarget) {
    steer = Math.max(-1, Math.min(1, steer + cornerSteer * 0.5));
  }
  driver.driftHold = wantDrift
    ? 0.28 + d.driftSkill * 0.30
    : Math.max(0, driver.driftHold - ctx.dt);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let drift = driver.driftHold > 0 && speed > 9 && !surface.lost
    && !kart.grinding && !kart.boating;
  
  
  
  if (kart.drifting && steer * kart.drifting < -0.05) drift = false;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let jump = false;
  if (railExit && kart.grinding) {
    jump = true;
    const side = kart.grindSide || 0;
    
    
    
    
    if (side !== 0) steer = side * GRIND_EXIT_STEER;
  }

  
  driver.itemCooldown = Math.max(0, driver.itemCooldown - ctx.dt);
  const useItem = !!ctx.hasItem && driver.itemCooldown <= 0 && shouldUseItem(kart, ctx, d);
  if (useItem) driver.itemCooldown = 0.55 + (1 - d.itemSkill) * 2.4;

  driver.lastS = surface.s;
  return { throttle, steer, drift, jump, useItem };
}















function rubberBand(ctx, d) {
  if (!ctx.fieldSize || ctx.position == null) return 1;
  
  const rank = ctx.fieldSize <= 1 ? 0 : (ctx.position - 1) / (ctx.fieldSize - 1);
  const behind = rank * 2 - 1;
  return 1 + behind * 0.12 * d.rubberBand;
}










export function shouldUseItem(kart, ctx, d) {
  const item = ctx.heldItem;
  if (!item) return false;
  const kind = item.kind ?? item;

  if (kind === 'mushroom' || kind === 'turbo') {
    
    const straight = Math.abs(ctx.surface ? (ctx.lineCurvature ?? 0) : 0) < 0.01;
    return straight || !!(ctx.surface && !ctx.surface.onRoad);
  }
  if (kind === 'shield' || kind === 'haybale') {
    
    
    
    
    
    
    
    
    return !!ctx.threatBehind || (ctx.heldFor ?? 0) > 9;
  }
  const target = kind === 'banana' || kind === 'oil' ? ctx.threatBehind : ctx.threatAhead;
  if (!target) return false;
  
  
  
  const window = 26 + (1 - d.itemSkill) * 34;
  return target.distance < window;
}





export function findThreats(path, self, others) {
  let ahead = null;
  let behind = null;
  for (const o of others) {
    if (o.id === self.id) continue;
    const d = signedDelta(path, self.s, o.s);
    if (d > 0 && (!ahead || d < ahead.distance)) ahead = { racer: o, distance: d };
    if (d < 0 && (!behind || -d < behind.distance)) behind = { racer: o, distance: -d };
  }
  return { ahead, behind };
}
