

import { OneEuroFilter, POSE_SMOOTHING } from './oneEuro.js';

export const POSE_JOINTS = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_index',
  'right_index',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_foot_index',
  'right_foot_index',
];








export const MIN_JOINT_SCORE = 0.5;


export function seen(j, min = MIN_JOINT_SCORE) {
  return !!j && j.score >= min && Number.isFinite(j.x) && Number.isFinite(j.y);
}




export function onlyInFrame(pose, width, height) {
  
  const out = {};
  for (const [name, j] of Object.entries(pose)) {
    if (!j) continue;
    const inside = j.x >= 0 && j.x <= width && j.y >= 0 && j.y <= height;
    out[name] = inside ? j : { ...j, score: 0 };
  }
  return out;
}



export function fromDetector(keypoints) {
  
  const out = {};
  for (const k of keypoints) {
    if (!k.name || !POSE_JOINTS.includes(k.name)) continue;
    out[k.name] = { x: k.x, y: k.y, score: k.score ?? 0 };
  }
  return out;
}



export class PoseSmoother {
  constructor(params = POSE_SMOOTHING) {
    this.params = params;
    
    this.filters = new Map();
  }

  f(key) {
    let f = this.filters.get(key);
    if (!f) {
      f = new OneEuroFilter(this.params);
      this.filters.set(key, f);
    }
    return f;
  }

  
  smooth(frame) {
    const unit = Math.max(frame.width, frame.height) || 1;
    
    const out = {};
    for (const name of POSE_JOINTS) {
      const j = frame.pose[name];
      if (!j) continue;
      if (j.score < MIN_JOINT_SCORE * 0.5) {
        out[name] = j;
        continue;
      }
      out[name] = {
        x: this.f(`${name}.x`).filter(j.x / unit, frame.t) * unit,
        y: this.f(`${name}.y`).filter(j.y / unit, frame.t) * unit,
        score: j.score,
      };
    }
    return { ...frame, pose: out };
  }

  reset() {
    this.filters.clear();
  }
}



export function jitter(frames) {
  let sum = 0;
  let n = 0;
  for (let i = 2; i < frames.length; i++) {
    const [a, b, c] = [frames[i - 2], frames[i - 1], frames[i]];
    const unit = Math.max(c.width, c.height) || 1;
    for (const name of POSE_JOINTS) {
      const ja = a.pose[name];
      const jb = b.pose[name];
      const jc = c.pose[name];
      if (!seen(ja) || !seen(jb) || !seen(jc)) continue;
      sum += Math.hypot(jc.x - 2 * jb.x + ja.x, jc.y - 2 * jb.y + ja.y) / unit;
      n++;
    }
  }
  return n ? sum / n : 0;
}



export function mirrorFrame(frame) {
  
  const out = {};
  for (const [name, j] of Object.entries(frame.pose)) if (j) out[name] = { ...j, x: frame.width - j.x };
  return { ...frame, pose: out };
}
