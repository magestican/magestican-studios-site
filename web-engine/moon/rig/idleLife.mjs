


































































import { quatFromEuler, clamp, smoothstep, frac } from './math.mjs';
















const PHI = 0.6180339887498949; 
const R2 = 0.4142135623730951; 





const boneOr = (skeleton, name) => skeleton.bones.findIndex((b) => b.name === name);

export const IDLE_LIFE = Object.freeze({
  
  
  breath: Object.freeze({ every: [3.6, 4.8], chest: 0.013, spine: 0.005, nod: 0.005 }),
  
  
  
  
  
  
  shift: Object.freeze({ every: [4, 8], ease: 1.25, spine: 0.019, chest: 0.013, yaw: 0.02, counter: 1.0 }),
  
  
  
  
  
  
  
  
  glance: Object.freeze({ every: [2.4, 4.6], ease: 0.28, yaw: 0.12, pitch: 0.06 }),
  
  
  blink: Object.freeze({ every: [3, 6], close: 0.055, shut: 0.025, open: 0.08, twice: 0.3, gap: 0.14 }),
  
  
  face: Object.freeze({ head: 0.6, neck: 0.28, chest: 0.2, max: 1.4, pitch: 0.25 }),
});



export const IDLE_LIFE_BONES = Object.freeze(['hips', 'spine', 'chest', 'neck', 'head']);





export function hash01(seed, channel, index) {
  let h = 2166136261 ^ (seed >>> 0);
  h = Math.imul(h, 16777619) ^ (channel >>> 0);
  h = Math.imul(h, 16777619) ^ ((index | 0) >>> 0);
  h = Math.imul(h, 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 8) / 16777216;
}


const CH = { breath: 1, shift: 2, glance: 3, blink: 4, blinkTwice: 5, glanceP: 6 };












export function eventAt(seed, channel, [lo, hi], t) {
  const m = (lo + hi) / 2;
  const spread = (hi - lo) / 2;
  const start = (k) => k * m + hash01(seed, channel, k) * spread;
  
  let k = Math.floor(t / m) + 1;
  while (k > 0 && start(k) > t) k -= 1;
  return { index: k, at: start(k), since: t - start(k) };
}


export function eventGap(seed, channel, [lo, hi], k) {
  const m = (lo + hi) / 2;
  const spread = (hi - lo) / 2;
  return m + (hash01(seed, channel, k + 1) - hash01(seed, channel, k)) * spread;
}


function lid(since, b) {
  if (since < 0) return 0;
  if (since < b.close) return smoothstep(0, b.close, since);
  if (since < b.close + b.shut) return 1;
  const done = b.close + b.shut + b.open;
  return since < done ? 1 - smoothstep(b.close + b.shut, done, since) : 0;
}


export function blinkAt(seed, t, cfg = IDLE_LIFE) {
  const b = cfg.blink;
  const e = eventAt(seed, CH.blink, b.every, t);
  let v = lid(e.since, b);
  if (hash01(seed, CH.blinkTwice, e.index) < b.twice) {
    v = Math.max(v, lid(e.since - (b.close + b.shut + b.open + b.gap), b));
  }
  return v;
}







export function shiftAt(seed, t, cfg = IDLE_LIFE) {
  const s = cfg.shift;
  const e = eventAt(seed, CH.shift, s.every, t);
  const side = (k) => (hash01(seed, CH.shift, k * 2 + 1) < 0.5 ? -1 : 1);
  return side(e.index - 1) + (side(e.index) - side(e.index - 1)) * smoothstep(0, s.ease, e.since);
}


export function glanceAt(seed, t, cfg = IDLE_LIFE) {
  const g = cfg.glance;
  const e = eventAt(seed, CH.glance, g.every, t);
  const k = smoothstep(0, g.ease, e.since);
  const aim = (i, ch, amp) => (hash01(seed, ch, i) * 2 - 1) * amp;
  return {
    yaw: aim(e.index - 1, CH.glance, g.yaw) + (aim(e.index, CH.glance, g.yaw) - aim(e.index - 1, CH.glance, g.yaw)) * k,
    pitch: aim(e.index - 1, CH.glanceP, g.pitch) + (aim(e.index, CH.glanceP, g.pitch) - aim(e.index - 1, CH.glanceP, g.pitch)) * k,
  };
}


export function breathAt(seed, t, cfg = IDLE_LIFE) {
  const [lo, hi] = cfg.breath.every;
  
  const period = lo + (hi - lo) * frac(seed * PHI);
  const phase = frac(seed * R2);
  return Math.sin(2 * Math.PI * (t / period + phase));
}







export function idleLifeAt(seed, t, { faceYaw = 0, cfg = IDLE_LIFE } = {}) {
  const s = Number.isFinite(seed) ? Math.abs(Math.round(seed)) : 0;
  const time = Number.isFinite(t) ? t : 0;
  return {
    breath: breathAt(s, time, cfg),
    shift: shiftAt(s, time, cfg),
    glance: glanceAt(s, time, cfg),
    blink: blinkAt(s, time, cfg),
    faceYaw: Number.isFinite(faceYaw) ? clamp(faceYaw, -cfg.face.max, cfg.face.max) : 0,
  };
}





const DQ = [0, 0, 0, 1];
function addLocal(pose, i, rx, ry, rz) {
  if (i < 0) return;
  quatFromEuler(rx, ry, rz, DQ, 0);
  const o = i * 4;
  const ax = pose.q[o], ay = pose.q[o + 1], az = pose.q[o + 2], aw = pose.q[o + 3];
  const [bx, by, bz, bw] = DQ;
  pose.q[o] = aw * bx + ax * bw + ay * bz - az * by;
  pose.q[o + 1] = aw * by - ax * bz + ay * bw + az * bx;
  pose.q[o + 2] = aw * bz + ax * by - ay * bx + az * bw;
  pose.q[o + 3] = aw * bw - ax * bx - ay * by - az * bz;
}







export function applyIdleLife(skeleton, pose, life, weight = 1, cfg = IDLE_LIFE) {
  const w = clamp(Number.isFinite(weight) ? weight : 0, 0, 1);
  if (w <= 0 || !life) return pose;
  const i = {};
  for (const name of IDLE_LIFE_BONES) i[name] = boneOr(skeleton, name);

  
  
  
  const b = cfg.breath;
  const rise = 0.5 + 0.5 * life.breath; 
  if (pose.s) {
    if (i.chest >= 0) pose.s[i.chest] *= 1 + w * b.chest * rise;
    if (i.spine >= 0) pose.s[i.spine] *= 1 + w * b.spine * rise;
  }
  if (i.head >= 0) addLocal(pose, i.head, -w * b.nod * rise, 0, 0);

  
  
  const s = cfg.shift;
  const spineRoll = w * s.spine * life.shift;
  const chestRoll = w * s.chest * life.shift;
  addLocal(pose, i.spine, 0, w * s.yaw * life.shift * 0.5, spineRoll);
  addLocal(pose, i.chest, 0, w * s.yaw * life.shift * 0.5, chestRoll);
  addLocal(pose, i.neck, 0, 0, -(spineRoll + chestRoll) * s.counter);

  
  const f = cfg.face;
  const faceYaw = life.faceYaw || 0;
  addLocal(pose, i.chest, 0, w * faceYaw * f.chest, 0);
  addLocal(pose, i.neck, 0, w * faceYaw * f.neck, 0);
  addLocal(pose, i.head, w * life.glance.pitch, w * (life.glance.yaw + faceYaw * f.head), 0);
  return pose;
}
