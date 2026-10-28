


import { seen } from './pose.js';



const HEAD_TO_FEET = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle'];


const EDGE = 0.02;


export function framingAdvice(pose, _width, height) {
  if (!pose || !seen(pose.left_shoulder) || !seen(pose.right_shoulder) || !seen(pose.nose)) return 'searching';
  if (!seen(pose.left_hip) || !seen(pose.right_hip)) return 'close';
  for (const name of HEAD_TO_FEET) {
    const k = pose[name];
    if (!seen(k)) return 'step-back';
    if (k.y < height * EDGE || k.y > height * (1 - EDGE)) return 'step-back';
  }
  return 'ready';
}



export function seenJoints(pose) {
  
  const out = {};
  for (const name of HEAD_TO_FEET) out[name] = !!pose && seen(pose[name]);
  return out;
}

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });




export function torsoLength(pose) {
  const { left_shoulder: ls, right_shoulder: rs, left_hip: lh, right_hip: rh } = pose;
  if (!seen(ls) || !seen(rs) || !seen(lh) || !seen(rh)) return null;
  const s = mid(ls, rs);
  const h = mid(lh, rh);
  const len = Math.hypot(s.x - h.x, s.y - h.y);
  return len > 1 ? len : null;
}


const TORSO_PER_SHOULDER = 1.25;




export function bodyUnit(pose) {
  const T = torsoLength(pose);
  if (T) return T;
  const { left_shoulder: ls, right_shoulder: rs } = pose;
  if (!seen(ls) || !seen(rs)) return null;
  const w = Math.hypot(ls.x - rs.x, ls.y - rs.y);
  return w > 1 ? TORSO_PER_SHOULDER * w : null;
}


export function hipCentre(pose) {
  return seen(pose.left_hip) && seen(pose.right_hip) ? mid(pose.left_hip, pose.right_hip) : null;
}


export function shoulderCentre(pose) {
  return seen(pose.left_shoulder) && seen(pose.right_shoulder) ? mid(pose.left_shoulder, pose.right_shoulder) : null;
}
