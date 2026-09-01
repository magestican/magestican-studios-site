





































































import { drivableWater, waterPlaneY, isChasmWater } from './trackHazards.js';

const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));












export const DRAFT = 0.90;








export const buoyancyK = (gravity) => gravity / DRAFT;










export const BUOY_ZETA = 0.8;
export const buoyancyDamp = (gravity) => 2 * BUOY_ZETA * Math.sqrt(buoyancyK(gravity));











export const PLUNGE_MAX = 3.5;










export const RISE_CAP = 3.0;










export const IMPACT_KILL = 26;
export const IMPACT_KEEP_MIN = 0.25;


export function impactKeep(vy) {
  return clamp(1 - Math.abs(vy ?? 0) / IMPACT_KILL, IMPACT_KEEP_MIN, 1);
}






export const WATER_SPEED = 0.62;


export const WATER_ACCEL = 0.55;


export const WATER_STEER = 0.80;








export const WATER_GRIP_GAIN = 0.62;
export const WATER_SLIP_GAIN = 1.25;








export const HULL_DRAG = 1.6;











export const ADRIFT_GRACE = 10;


export function waterFields() {
  return {
    






    boating: false,
    
    boatTime: 0,
    

























    boatPlaneY: 0,
    
    adriftTime: 0,
    
    splashed: false,
    
    splashVy: 0,
    
    beached: false,
  };
}



















export function waterSurface(zones, at, groundY) {
  if (!zones || !zones.length || !at) return null;
  const { frac, lateral, width, y = 0 } = at;
  if (frac == null) return null;
  const out = Math.abs(lateral ?? 0) / Math.max(1e-3, (width ?? 20) / 2);
  const side = (lateral ?? 0) > 0 ? 'left' : 'right';
  for (const zone of zones) {
    if (!drivableWater(zone)) continue;
    if (!inSpanLocal(frac, zone.from, zone.to)) continue;
    if (zone.side && zone.side !== 'both' && zone.side !== side) continue;
    if (out < (zone.beyond ?? 1.18)) continue;
    
    
    
    
    
    
    
    
    if (zone.until != null && out > zone.until) continue;
    const planeY = waterPlaneY(zone, y);
    if (!isWaterAt(planeY, groundY)) continue;
    return { zone, planeY, chasm: isChasmWater(zone) };
  }
  return null;
}


function inSpanLocal(f, from, to) {
  if (from <= to) return f >= from && f <= to;
  return f >= from || f <= to;
}















export function isWaterAt(planeY, groundY) {
  return (groundY ?? 0) < planeY - 0.05;
}














export function boatStep(kart, input = {}, ctx = {}) {
  const { water = null, dt = 0, enabled = true } = ctx;
  const t = kart.tuning ?? {};
  const idle = {
    boating: false,
    boatTime: 0,
    started: false,
    ended: false,
    planeY: 0,
    chasm: false,
    speedScale: 1,
    accelScale: 1,
    steer: 1,
    gripTurn: 0,
    maxSlip: 0,
    drag: 0,
  };
  if (!enabled || !water) {
    return (kart.boating ? { ...idle, ended: true } : idle);
  }
  
  
  
  
  const wet = (kart.y ?? 0) <= water.planeY + DRAFT * 0.5;
  if (!wet) return (kart.boating ? { ...idle, ended: true } : idle);

  const already = !!kart.boating;
  return {
    boating: true,
    boatTime: already ? (kart.boatTime ?? 0) + dt : 0,
    started: !already,
    ended: false,
    planeY: water.planeY,
    chasm: !!water.chasm,
    
    
    
    
    
    
    
    
    speedScale: t?.waterSpeed ?? WATER_SPEED,
    accelScale: WATER_ACCEL,
    steer: WATER_STEER,
    
    gripTurn: (t.driftGripTurn ?? 1) * WATER_GRIP_GAIN,
    maxSlip: (t.driftMaxSlip ?? 0.5) * WATER_SLIP_GAIN,
    drag: HULL_DRAG,
  };
}










































export function boatFloat(y, vy, planeY, dt, gravity, bedY = -Infinity) {
  const k = buoyancyK(gravity);
  const c = buoyancyDamp(gravity);
  const submerge = Math.max(0, planeY - y);
  let v = vy - gravity * dt;
  if (submerge > 0) v += (k * submerge - c * vy) * dt;
  if (v > RISE_CAP) v = RISE_CAP;
  let ny = y + v * dt;
  const floor = Math.max(planeY - PLUNGE_MAX, bedY);
  if (ny < floor) { ny = floor; v = Math.max(0, v); }
  return { y: ny, vy: v, submerge: Math.max(0, planeY - ny) };
}








export function isAdrift(kart) {
  return (kart.adriftTime ?? 0) >= ADRIFT_GRACE;
}


export function boatCruise(tuning) {
  return (tuning?.topSpeed ?? 40) * (tuning?.waterSpeed ?? WATER_SPEED);
}
