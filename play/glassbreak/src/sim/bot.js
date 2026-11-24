





import { FP } from './fixed.js';
import { pack, X_MAX } from './input.js';
import { C_CATH, C_EMPTY, C_GLASS, C_IRON, CH, CW, FIELD_W, MAX_PLAYERS, PADDLE_H, PADDLE_HW, PADDLE_Y, PH_CLEAR, PH_PLAY, SPARK_V, WIDE_HW, cellXY } from './sim.js';
import { COLS } from './windows.js';


export function landingX(e, lineY = PADDLE_Y * FP) {
  if (e.vy <= 0) return null;
  const ticks = (lineY - e.y) / e.vy;
  const W = FIELD_W * FP;
  let x = e.x + e.vx * ticks;
  const period = 2 * W;
  x = ((x % period) + period) % period;
  return x > W ? period - x : x;
}

export function botInput(s, seat, { skill = 1, level = 'beginner', dodgeBolts = level === 'skilled', lowAim = level === 'skilled', catchSparks = true } = {}) {
  const p = s.players[seat];
  if (s.phase === PH_CLEAR) return pack({ x: 2048, next: (s.tick - s.phT) > 60 });
  if (s.phase !== PH_PLAY || !p) return pack({ x: 2048 });
  
  const count = [0, 0, 0];
  let leftMass = 0, rightMass = 0;
  for (let i = 0; i < s.grid.t.length; i++) {
    const t = s.grid.t[i];
    if (!t) continue;
    if (i % COLS < COLS / 2) leftMass++; else rightMass++;
    if (t === C_GLASS || t === C_CATH) count[s.grid.tn[i]]++;
  }
  const tint = count[1] > count[0] ? (count[2] > count[1] ? 2 : 1) : count[2] > count[0] ? 2 : 0;
  
  let target = null, soonest = Infinity;
  for (const e of s.embers) {
    if (e.held || e.vy <= 0) continue;
    const t = (PADDLE_Y * FP - e.y) / e.vy;
    const mine = e.own === seat ? 0 : 40; 
    if (t + mine < soonest) { soonest = t + mine; target = e; }
  }

  let x;
  if (target) {
    const lx = landingX(target);
    
    const aim = (rightMass > leftMass ? -1 : 1) * 22 * FP;
    x = lx + aim * skill;
    
    
    
    
    if (lowAim) {
      const goal = threatPoint(s);
      if (goal) {
        const ly = PADDLE_Y * FP;
        
        
        const slope = (goal.x - lx) / Math.max(ly - goal.y, 40 * FP); 
        const off = Math.max(-0.8, Math.min(0.8, slope / 1.732));
        x = Math.round(lx - off * (PADDLE_HW + 11) * FP);
      }
    }
  } else {
    
    const n = s.players.filter((q) => q.on).length || 1;
    const k = s.players.slice(0, seat).filter((q) => q.on).length;
    x = ((k + 0.5) / n) * FIELD_W * FP;
  }
  if (catchSparks) x = sparkDetour(s, p, x, target);
  if (dodgeBolts) x = dodge(s, p, x, target);
  const tx = Math.max(0, Math.min(X_MAX, Math.round((x / (FIELD_W * FP)) * X_MAX)));
  const held = s.embers.some((e) => e.own === seat && e.held);
  return pack({ x: tx, tint, launch: held && (s.tick + seat * 7) % 40 > 20, fire: p.lance > 0 });
}


export function threatPoint(s) {
  const g = s.grid;
  for (let i = g.t.length - 1; i >= 0; i--) {
    const t = g.t[i];
    if (t === C_EMPTY || t === C_IRON) continue;
    const p = cellXY(s, i % COLS, (i / COLS) | 0);
    return { x: p.x + (CW / 2) * FP, y: p.y + (CH / 2) * FP };
  }
  if (s.boss && s.boss.on && !s.boss.beaten) return { x: s.boss.x, y: s.boss.y };
  return null;
}





export function sparkDetour(s, p, want, target) {
  if (!s.sparks || !s.sparks.length) return want;
  const V = 18 * FP;
  const line = PADDLE_Y * FP;
  const emberT = target ? (line - target.y) / target.vy : Infinity;
  let best = null, bt = Infinity;
  for (const k of s.sparks) {
    if (k.y > line) continue;
    const t = (line - k.y) / SPARK_V;
    if (t >= bt) continue;
    const reach = Math.abs(k.x - p.x) / V;
    if (reach > t) continue;
    if (target && t + Math.abs(want - k.x) / V + 6 > emberT) continue;
    best = k; bt = t;
  }
  return best ? best.x : want;
}


export function boltArrival(b) {
  if (b.own >= 0 || b.vy <= 0 || b.y > PADDLE_Y * FP + PADDLE_H * FP) return null;
  const t = Math.max(0, (PADDLE_Y * FP - b.y) / b.vy);
  return { t, x: b.x + (b.vx || 0) * t };
}





function dodge(s, p, want, target) {
  const hw = (p.wide > 0 ? WIDE_HW : PADDLE_HW) * FP;
  const reach = hw + 14 * FP; 
  const near = [];
  for (const b of s.bolts) {
    const a = boltArrival(b);
    if (a && a.t <= 22) near.push(a);
  }
  if (!near.length) return want;
  const safe = (x) => near.every((a) => Math.abs(a.x - x) > reach);
  if (safe(want)) return want;
  const W = FIELD_W * FP;
  let best = null;
  for (let d = 8 * FP; d <= W; d += 8 * FP) {
    for (const x of [want - d, want + d]) {
      if (x < hw || x > W - hw || !safe(x)) continue;
      best = x; break;
    }
    if (best !== null) break;
  }
  if (best === null) return want;
  if (target) {
    const te = (PADDLE_Y * FP - target.y) / target.vy;
    const back = Math.abs(best - want) / (24 * FP);
    const lastBolt = Math.max(...near.map((a) => a.t)) + 6;
    if (te < lastBolt + back) return want; 
  }
  return best;
}

export { MAX_PLAYERS };
