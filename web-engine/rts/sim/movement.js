















import { stepToward, dist2, isqrt, angleTo } from '../fixed.js';
import { UNITS, BUILDINGS } from '../roster.js';
import { UNIT_KINDS, BUILDING_KINDS, STATE, ORDER, unitSpec, isArmy } from './world.js';

const SPEED = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].speedMmPerTick));
const IS_AIR = new Uint8Array(UNIT_KINDS.map((k) => (UNITS[k].air ? 1 : 0)));
const IS_WALL = new Uint8Array(BUILDING_KINDS.map((k) => (BUILDINGS[k].wall ? 1 : 0)));
const SLOWS_PCT = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].slowsNearbyPct || 0));































export const ARRIVE_MM = 9000;


















































export const SEPARATION_MM = 11000;










































const SEPARATION_DIVISOR = 3;












const WALL_SLOW_MM = 19000;
const WALL_TOUCH_MM = 11000;










export function stepMovement(w, speedBonusPct = null) {
  const u = w.u;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    if (u.state[i] !== STATE.MOVING) continue;
    const tx = u.orderX[i];
    const ty = u.orderY[i];

    let speed = SPEED[u.kind[i]];
    if (speedBonusPct) speed += Math.floor((speed * speedBonusPct[i]) / 100);
    
    
    if (!IS_AIR[u.kind[i]]) {
      const slow = wallSlowAt(w, u.x[i], u.y[i]);
      if (slow > 0) speed -= Math.floor((speed * slow) / 100);
    }
    if (speed < 1) speed = 1;

    const [nx, ny, arrived] = stepToward(u.x[i], u.y[i], tx, ty, speed);
    u.facing[i] = angleTo(u.x[i], u.y[i], tx, ty);
    u.x[i] = nx;
    u.y[i] = ny;

    if (arrived || dist2(nx, ny, tx, ty) <= ARRIVE_MM * ARRIVE_MM) {
      
      
      
      
      
      u.state[i] = u.orderType[i] === ORDER.GATHER ? STATE.GATHERING : STATE.IDLE;
    }
  }
}






















export function stepSeparation(w, sectorCount) {
  const u = w.u;
  
  
  if (!w._sepHead || w._sepHead.length !== sectorCount) {
    w._sepHead = new Int32Array(sectorCount);
    w._sepNext = new Int32Array(u.id.length);
  }
  if (!w._sepDx || w._sepDx.length !== u.id.length) {
    w._sepDx = new Int32Array(u.id.length);
    w._sepDy = new Int32Array(u.id.length);
  }
  const head = w._sepHead;
  const next = w._sepNext;
  const dxAcc = w._sepDx;
  const dyAcc = w._sepDy;
  head.fill(-1);
  dxAcc.fill(0);
  dyAcc.fill(0);

  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    
    
    
    if (IS_AIR[u.kind[i]]) continue;
    const s = u.sector[i];
    if (s < 0) continue;
    next[i] = head[s];
    head[s] = i;
  }

  const r2 = SEPARATION_MM * SEPARATION_MM;
  for (let s = 0; s < sectorCount; s += 1) {
    for (let i = head[s]; i !== -1; i = next[i]) {
      for (let j = next[i]; j !== -1; j = next[j]) {
        const dx = u.x[j] - u.x[i];
        const dy = u.y[j] - u.y[i];
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        if (d2 === 0) {
          
          
          
          
          
          const bx = 1 + ((i + j) % 7);
          const by = 1 + ((i * 3 + j) % 5);
          dxAcc[i] -= bx; dyAcc[i] -= by;
          dxAcc[j] += bx; dyAcc[j] += by;
          continue;
        }
        const d = isqrt(d2);
        const push = Math.floor((SEPARATION_MM - d) / SEPARATION_DIVISOR);
        if (push <= 0) continue;
        
        
        
        
        
        
        
        
        const px = Math.trunc((dx * push) / d);
        const py = Math.trunc((dy * push) / d);
        dxAcc[i] -= px; dyAcc[i] -= py;
        dxAcc[j] += px; dyAcc[j] += py;
      }
    }
  }
  
  
  
  
  
  
  
  
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    if (dxAcc[i] === 0 && dyAcc[i] === 0) continue;
    u.x[i] += dxAcc[i];
    u.y[i] += dyAcc[i];
  }
  clampToField(w);
}


function clampToField(w) {
  const u = w.u;
  const max = w.map.cellsPerSide * w.map.cellMm - 1;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    if (u.x[i] < 0) u.x[i] = 0; else if (u.x[i] > max) u.x[i] = max;
    if (u.y[i] < 0) u.y[i] = 0; else if (u.y[i] > max) u.y[i] = max;
  }
}


export function wallSlowAt(w, xMm, yMm) {
  const b = w.b;
  let worst = 0;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0) continue;
    const pct = SLOWS_PCT[b.kind[i]];
    if (pct <= worst) continue;
    
    
    
    
    const r = WALL_SLOW_MM;
    if (dist2(xMm, yMm, b.x[i], b.y[i]) <= r * r) worst = pct;
  }
  return worst;
}


export function wallBetween(w, ax, ay, bx, by) {
  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0 || !IS_WALL[b.kind[i]]) continue;
    if (pointNearSegment(b.x[i], b.y[i], ax, ay, bx, by, WALL_TOUCH_MM)) return i;
  }
  return -1;
}








function pointNearSegment(px, py, ax, ay, bx, by, rMm) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const len2 = abx * abx + aby * aby;
  const r2 = rMm * rMm;
  if (len2 === 0) return apx * apx + apy * apy <= r2;
  let t = apx * abx + apy * aby;
  if (t <= 0) return apx * apx + apy * apy <= r2;
  if (t >= len2) {
    const bpx = px - bx;
    const bpy = py - by;
    return bpx * bpx + bpy * bpy <= r2;
  }
  
  
  const cx = ax + Math.floor((abx * t) / len2);
  const cy = ay + Math.floor((aby * t) / len2);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r2;
}


export function moveTo(w, slot, x, y) {
  w.u.orderType[slot] = ORDER.MOVE;
  w.u.orderX[slot] = x;
  w.u.orderY[slot] = y;
  w.u.state[slot] = STATE.MOVING;
}












export function armyCentre(w, owner) {
  const u = w.u;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] !== owner) continue;
    
    
    
    if (!isArmy(unitSpec(w, i))) continue;
    const m = u.members[i];
    sx += u.x[i] * m;
    sy += u.y[i] * m;
    n += m;
  }
  if (n === 0) return { x: 0, y: 0, weight: 0 };
  return { x: Math.floor(sx / n), y: Math.floor(sy / n), weight: n };
}
