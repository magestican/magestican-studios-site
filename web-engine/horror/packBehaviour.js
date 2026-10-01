
























import {
  chaseWaypoint, insideLevel, progressAt, pointBehind, runRect,
} from './level.js';
import { TIMING, RANGE } from './creatureAnim.js';
import { createWithdrawal, stepWithdrawal, withdrawAt, emergeAt } from './entrance.js';

export const PACK = Object.freeze({
  retreat: Object.freeze({
    limbFraction: 0.35,   
    gateRange: 6,         
    kinds: Object.freeze(['duct', 'breach']),   
    arriveAt: 0.35,       
  }),
  ambush: Object.freeze({
    wake: 4,              
    alertScale: 0.5,      
    past: 1.8,            
  }),
  flank: Object.freeze({
    trigger: 3,           
    lateral: 2.5,         
    ahead: 2.0,           
    closeAt: 1.2,         
    pad: 0.22,            
    lookahead: 1.5,       
    minStep: 0.5,         
  }),
});

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);





















const runLen = (q) => Math.hypot(q.x1 - q.x0, q.z1 - q.z0);



function runIndexAtProgress(level, p) {
  let done = 0;
  for (let i = 0; i < level.runs.length; i += 1) {
    const len = runLen(level.runs[i]);
    if (done + len >= p) return i;
    done += len;
  }
  return level.runs.length - 1;
}


function pointAtProgress(level, p) {
  const total = progressAt(level, level.exit.x, level.exit.z);
  return pointBehind(level, level.exit.x, level.exit.z, total - Math.min(total, Math.max(0, p)));
}








function routeProgress(level, x, z) {
  let best = -1;
  let done = 0;
  for (const q of level.runs) {
    const len = runLen(q);
    const r = runRect(q);
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) {
      const along = q.axis === 'z'
        ? (z - q.z0) * Math.sign(q.z1 - q.z0 || 1)
        : (x - q.x0) * Math.sign(q.x1 - q.x0 || 1);
      best = Math.max(best, done + Math.min(len, Math.max(0, along)));
    }
    done += len;
  }
  return best >= 0 ? best : progressAt(level, x, z);
}





function lateralOf(run, hand) {
  const dx = run.x1 - run.x0;
  const dz = run.z1 - run.z0;
  const len = Math.hypot(dx, dz) || 1;
  return { x: (-dz / len) * hand, z: (dx / len) * hand };
}














export function shouldRetreat(status, anim, opts = {}) {
  if (!status || !status.alive) return false;
  if (opts.latched || (anim && anim.state === 'latched')) return false;
  if (anim && (anim.dying || anim.state === 'down')) return false;
  if (status.canSense === false) return false;
  if (anim && (anim.state === 'windup' || anim.state === 'strike')) return false;
  return (status.limbFraction ?? 1) < PACK.retreat.limbFraction;
}



export function nearestGate(gates, pos, maxDist = PACK.retreat.gateRange) {
  let best = null;
  for (let i = 0; i < (gates || []).length; i += 1) {
    const g = gates[i];
    if (!g || !PACK.retreat.kinds.includes(g.kind)) continue;
    const d = dist2(g, pos);
    if (d > maxDist) continue;
    if (!best || d < best.dist) best = { index: i, gate: g, dist: d };
  }
  return best;
}



export function retreatWaypoint(gate) {
  return emergeAt(gate, 1);
}












export function createRetreat(gateIndex, gate) {
  return {
    gateIndex, gate, phase: 'approach', backwards: true, w: null, event: null,
  };
}

export function stepRetreat(r, dt, pos) {
  if (r.phase === 'gone') return r.event ? { ...r, event: null } : r;
  if (r.phase === 'approach') {
    const n = { ...r, event: null };
    if (dist2(pos, retreatWaypoint(r.gate)) <= PACK.retreat.arriveAt) {
      n.phase = 'withdraw';
      n.w = createWithdrawal(r.gate.kind);
      n.event = 'withdraw';
    }
    return n;
  }
  
  const w = stepWithdrawal(r.w, dt);
  const n = { ...r, w, event: null };
  if (w.phase === 'gone') { n.phase = 'gone'; n.event = 'gone'; }
  return n;
}


export function retreatAt(r) {
  if (r.phase === 'withdraw' || r.phase === 'gone') return withdrawAt(r.gate, r.w ? r.w.k : 1);
  return retreatWaypoint(r.gate);
}










export function cornersOf(level) {
  const out = [];
  for (let i = 0; i + 1 < level.runs.length; i += 1) {
    const a = level.runs[i];
    const b = level.runs[i + 1];
    const la = Math.hypot(a.x1 - a.x0, a.z1 - a.z0) || 1;
    const lb = Math.hypot(b.x1 - b.x0, b.z1 - b.z0) || 1;
    out.push({
      index: i,
      x: a.x1,
      z: a.z1,
      approach: { x: (a.x1 - a.x0) / la, z: (a.z1 - a.z0) / la },
      beyond: { x: (b.x1 - b.x0) / lb, z: (b.z1 - b.z0) / lb },
    });
  }
  return out;
}








export function ambushPost(level, cornerIndex) {
  const c = cornersOf(level)[cornerIndex];
  if (!c) return null;
  const x = c.x + c.beyond.x * PACK.ambush.past;
  const z = c.z + c.beyond.z * PACK.ambush.past;
  const face = { x: -c.beyond.x, z: -c.beyond.z };
  return { x, z, face, yaw: Math.atan2(face.x, face.z), corner: c };
}







export function ambushProfile(profile = {}) {
  const timing = { ...TIMING, ...(profile.timing || {}) };
  const range = { ...RANGE, ...(profile.range || {}) };
  return {
    ...profile,
    timing: { ...timing, alert: timing.alert * PACK.ambush.alertScale },
    range: { ...range, wake: PACK.ambush.wake },
  };
}





export function ambushOpts(profile, anim, posted = true) {
  const waiting = anim && (anim.state === 'dormant' || anim.state === 'alert');
  return posted && waiting ? ambushProfile(profile) : profile;
}






























export function flankTarget(level, self, partner, player, opts = {}) {
  const F = PACK.flank;
  const hand = opts.hand === -1 ? -1 : 1;
  
  
  
  
  
  
  
  
  
  
  const dp = partner ? dist2(partner, player) : Infinity;
  const ds = dist2(self, player);
  const close = { x: player.x, z: player.z, phase: 'close', offset: 0 };
  if (!(dp <= F.trigger)) return close;             
  if (!opts.committed && ds <= dp) return close;    

  const pp = progressAt(level, player.x, player.z);
  const pq = progressAt(level, partner.x, partner.z);
  const dirSign = pq <= pp ? 1 : -1;               
  const centre = pointBehind(level, player.x, player.z, -dirSign * F.ahead);
  
  
  const total = progressAt(level, level.exit.x, level.exit.z);
  const run = level.runs[runIndexAtProgress(level, Math.min(total, Math.max(0, pp + dirSign * F.ahead)))];
  const lat = lateralOf(run, hand);
  let off = F.lateral;
  while (off > 0 && !insideLevel(level, centre.x + lat.x * off, centre.z + lat.z * off, F.pad)) off -= 0.1;
  off = Math.max(0, off);
  const target = { x: centre.x + lat.x * off, z: centre.z + lat.z * off };
  if (dist2(self, target) <= F.closeAt) return close;
  return { x: target.x, z: target.z, phase: 'flank', offset: off };
}











export function flankWaypoint(level, self, partner, player, opts = {}) {
  const t = flankTarget(level, self, partner, player, opts);
  if (t.phase !== 'flank') return { ...chaseWaypoint(level, self, t, 3), phase: t.phase, offset: t.offset };
  const F = PACK.flank;
  
  
  
  
  
  
  
  const pf = routeProgress(level, self.x, self.z);
  const delta = routeProgress(level, t.x, t.z) - pf;
  
  
  if (Math.abs(delta) <= F.lookahead) return { x: t.x, z: t.z, phase: t.phase, offset: t.offset };
  
  
  const sign = Math.sign(delta);
  let look = F.lookahead;
  let w = pointAtProgress(level, pf + sign * look);
  while (dist2(self, w) < F.minStep && look < 6) {
    look += 0.5;
    w = pointAtProgress(level, pf + sign * look);
  }
  if (t.offset > 0) {
    
    
    
    
    
    
    const hand = opts.hand === -1 ? -1 : 1;
    const run = level.runs[runIndexAtProgress(level, pf + sign * look)];
    const lat = lateralOf(run, hand);
    const cand = { x: w.x + lat.x * t.offset, z: w.z + lat.z * t.offset };
    if (insideLevel(level, cand.x, cand.z, F.pad)
      && dist2(self, cand) >= F.minStep
      && sign * (routeProgress(level, cand.x, cand.z) - pf) > 0) w = cand;
  }
  return { ...w, phase: t.phase, offset: t.offset };
}
