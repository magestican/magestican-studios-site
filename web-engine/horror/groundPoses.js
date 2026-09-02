





















import { standPose, reachGuard } from './gait.js';




function key(w, pitch, lift, pose) {
  return {
    w,
    pitch,
    lift,
    pose: {
      grip: 'open',
      air: 0,
      toe: pose.toe ?? [0.1, 0.2],
      ...pose,
      hands: pose.hands.map(([x, y]) => reachGuard(x, y)),
    },
  };
}




export const GET_UP_KEYS = Object.freeze([
  
  
  key(0.00, -1.50, 0.16, {
    hands: [[0.12, 0.46], [-0.04, 0.34]],
    feet: [[0.46, 0.03], [0.30, 0.12]],
    toe: [0.35, 0.5],
    twist: 0.05, squash: 1.0, lean: 0,
  }),
  
  key(0.20, -0.95, 0.12, {
    hands: [[-0.17, 0.30], [0.13, 0.48]],
    feet: [[0.36, 0.04], [0.24, 0.10]],
    toe: [0.3, 0.4],
    twist: 0.10, squash: 0.96, lean: 0,
  }),
  
  key(0.18, -0.40, 0.05, {
    hands: [[-0.20, 0.28], [0.22, 0.42]],
    feet: [[0.27, 0.02], [0.31, 0.05]],
    toe: [0.2, 0.3],
    twist: 0.08, squash: 0.80, lean: 0.02,
  }),
  
  
  key(0.18, -0.14, 0.0, {
    hands: [[0.27, 0.15], [0.12, 0.38]],
    feet: [[0.04, 0.0], [0.30, 0.03]],
    toe: [-0.1, 0.25],
    twist: 0.14, squash: 0.66, lean: 0.10,
  }),
  
  key(0.17, 0.0, 0.0, {
    hands: [[0.17, 0.42], [0.10, 0.40]],
    feet: [[-0.06, 0.0], [0.17, 0.0]],
    toe: [-0.05, 0.1],
    twist: 0.10, squash: 0.62, lean: 0.15,
  }),
  
  
  key(0.16, 0.0, 0.0, {
    hands: [[0.09, 0.47], [0.05, 0.45]],
    feet: [[-0.05, 0.0], [0.11, 0.0]],
    toe: [0.0, 0.05],
    twist: 0.07, squash: 0.86, lean: 0.17,
  }),
  
  
  key(0.11, 0.0, 0.0, { ...standPose(0) }),
]);



export const LIE_SUPINE = GET_UP_KEYS[0];
export const SIT_GROUND = GET_UP_KEYS[2];


export const RECLINE = key(0, -0.72, 0.09, {
  hands: [[-0.14, 0.30], [0.10, 0.44]],
  feet: [[0.34, 0.03], [0.22, 0.09]],
  toe: [0.3, 0.35],
  twist: 0.08, squash: 0.90, lean: 0,
});

const ease = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];





export function getUpAt(u) {
  const keys = GET_UP_KEYS;
  const total = keys.reduce((a, k) => a + k.w, 0);
  let t = Math.min(0.99999, Math.max(0, u)) * total;
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1].w && keys[i + 1].w > 0) {
    
    
    t -= keys[i + 1].w;
    i += 1;
  }
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const segLen = b.w > 0 ? b.w : 1;
  const k = ease(Math.min(1, Math.max(0, t / segLen)));
  return {
    pitch: lerp(a.pitch, b.pitch, k),
    lift: lerp(a.lift, b.lift, k),
    pose: {
      hands: [lerp2(a.pose.hands[0], b.pose.hands[0], k), lerp2(a.pose.hands[1], b.pose.hands[1], k)],
      feet: [lerp2(a.pose.feet[0], b.pose.feet[0], k), lerp2(a.pose.feet[1], b.pose.feet[1], k)],
      toe: [lerp(a.pose.toe[0], b.pose.toe[0], k), lerp(a.pose.toe[1], b.pose.toe[1], k)],
      grip: 'open',
      air: 0,
      twist: lerp(a.pose.twist, b.pose.twist, k),
      squash: lerp(a.pose.squash, b.pose.squash, k),
      lean: lerp(a.pose.lean ?? 0, b.pose.lean ?? 0, k),
    },
  };
}
