


























import { quatFromEuler, clamp, smoothstep } from './math.mjs';

const boneOr = (skeleton, name) => skeleton.bones.findIndex((b) => b.name === name);

export const CARRY_HEFT = Object.freeze({
  
  
  spine: -0.1,
  chest: -0.07,
  neck: 0.06,
  head: 0.09,
  
  
  
  
  sink: 0.008,
});

export const PICKUP_HOP = Object.freeze({
  
  from: 0.58,
  to: 0.94,
  
  
  height: 0.055,
  drag: 0.8,
  
  
  crouch: 0.045,
  stretch: 0.05,
  land: 0.07,
  
  heftSquash: 1.3,
  
  crouchAt: 0.1,
  stretchAt: 0.3,
  landAt: 0.74,
  
  width: 0.16,
});


const bump = (u, at, w) => {
  const d = Math.abs(u - at) / w;
  return d >= 1 ? 0 : (Math.cos(Math.PI * d) + 1) / 2;
};







export function pickUpHopAt(u, heft = 0, cfg = PICKUP_HOP) {
  const h = clamp(Number.isFinite(heft) ? heft : 0, 0, 1);
  const p = Number.isFinite(u) ? u : 0;
  if (p <= cfg.from || p >= cfg.to) return { lift: 0, squash: 1 };
  const w = (p - cfg.from) / (cfg.to - cfg.from); 
  
  const a = cfg.stretchAt, b = cfg.landAt;
  let lift = 0;
  if (w > a && w < b) {
    const s = (w - a) / (b - a);
    lift = cfg.height * (1 - cfg.drag * h) * 4 * s * (1 - s); 
  }
  
  const heavier = 1 + cfg.heftSquash * h;
  const squash = 1
    - cfg.crouch * heavier * bump(w, cfg.crouchAt, cfg.width)
    + cfg.stretch * (1 - 0.7 * h) * bump(w, cfg.stretchAt, cfg.width)
    - cfg.land * heavier * bump(w, cfg.landAt, cfg.width);
  return { lift, squash };
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








export function applyCarryHeft(skeleton, pose, heft, weight = 1, cfg = CARRY_HEFT) {
  const h = clamp(Number.isFinite(heft) ? heft : 0, 0, 1);
  const w = clamp(Number.isFinite(weight) ? weight : 0, 0, 1);
  const k = h * w;
  if (k <= 0) return pose;
  addLocal(pose, boneOr(skeleton, 'spine'), k * cfg.spine, 0, 0);
  addLocal(pose, boneOr(skeleton, 'chest'), k * cfg.chest, 0, 0);
  addLocal(pose, boneOr(skeleton, 'neck'), k * cfg.neck, 0, 0);
  addLocal(pose, boneOr(skeleton, 'head'), k * cfg.head, 0, 0);
  const hips = boneOr(skeleton, 'hips');
  if (hips >= 0) pose.t[hips * 3 + 1] -= k * cfg.sink;
  return pose;
}








export const TAKE_OFF = Object.freeze({
  
  crouchS: 0.08,
  crouch: 0.07,
  stretchS: 0.2,
  stretch: 0.06,
});

export function takeOffSquash(t, cfg = TAKE_OFF) {
  const s = Number.isFinite(t) ? t : 0;
  if (s < 0) return 1;
  if (s < cfg.crouchS) return 1 - cfg.crouch * Math.sin((Math.PI * s) / cfg.crouchS);
  if (s < cfg.crouchS + cfg.stretchS) {
    const u = (s - cfg.crouchS) / cfg.stretchS;
    return 1 + cfg.stretch * (1 - smoothstep(0, 1, u));
  }
  return 1;
}
