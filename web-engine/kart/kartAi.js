














import { lineAt } from './racingLine.js';
import { signedDelta } from './trackPath.js';







export const DIFFICULTIES = Object.freeze({
  
  
  sunday:   Object.freeze({ id: 'sunday',   label: 'Sunday Drivers', pace: 0.86, precision: 0.62, driftSkill: 0.25, itemSkill: 0.35, rubberBand: 0.55 }),
  market:   Object.freeze({ id: 'market',   label: 'Market Day',     pace: 0.94, precision: 0.80, driftSkill: 0.62, itemSkill: 0.70, rubberBand: 0.75 }),
  stampede: Object.freeze({ id: 'stampede', label: 'Stampede',       pace: 1.00, precision: 0.93, driftSkill: 0.92, itemSkill: 0.95, rubberBand: 0.90 }),
});

export const DEFAULT_DIFFICULTY = 'market';


export function createDriver(seedIndex, difficulty = DEFAULT_DIFFICULTY) {
  const d = DIFFICULTIES[difficulty] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
  return {
    difficulty: d,
    
    
    
    
    
    lineBias: ((seedIndex * 2654435761) % 1000) / 1000 - 0.5,
    phase: ((seedIndex * 40503) % 628) / 100,
    driftHold: 0,
    itemCooldown: 0.4 + (seedIndex % 5) * 0.3,
    lastS: 0,
  };
}








const GAIN_FALLOFF = 1.15;

const clampAngle = (a) => {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
};










export function driveBot(driver, kart, line, ctx) {
  const d = driver.difficulty;
  const path = line.path;
  const speed = Math.max(0, kart.speed);
  const surface = ctx.surface;

  
  
  
  
  
  const look = 7 + speed * 0.55;
  const target = lineAt(line, surface.s + look);

  
  
  
  const wobble = Math.sin(ctx.time * 0.55 + driver.phase) * 1.1 * driver.lineBias * 2;
  const tx = target.x + Math.cos(target.heading) * wobble;
  const tz = target.z - Math.sin(target.heading) * wobble;

  
  
  
  
  
  
  
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cornerIsSlow = target.speed < kart.tuning.topSpeed * 0.80;
  
  
  
  
  
  
  
  
  
  
  
  const roomToDrift = surface.width >= 15 - d.driftSkill * 4;
  const wantDrift = cornerIsSlow && roomToDrift && speed > 13 && d.driftSkill > 0.15;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cornerSteer = -Math.sign(target.curvature || 0);
  if (wantDrift && !kart.drifting && cornerSteer !== 0) {
    steer = Math.max(-1, Math.min(1, steer + cornerSteer * 0.5));
  }
  driver.driftHold = wantDrift
    ? 0.28 + d.driftSkill * 0.30
    : Math.max(0, driver.driftHold - ctx.dt);
  let drift = driver.driftHold > 0 && speed > 9 && !surface.lost;
  
  
  
  if (kart.drifting && steer * kart.drifting < -0.05) drift = false;

  
  driver.itemCooldown = Math.max(0, driver.itemCooldown - ctx.dt);
  const useItem = !!ctx.hasItem && driver.itemCooldown <= 0 && shouldUseItem(kart, ctx, d);
  if (useItem) driver.itemCooldown = 0.55 + (1 - d.itemSkill) * 2.4;

  driver.lastS = surface.s;
  return { throttle, steer, drift, useItem };
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
