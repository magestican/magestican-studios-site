






import { boneIndex, createPose, forwardKinematics, carriedPoint } from './skeleton.mjs';
import { sampleClip } from './pose.mjs';
import { frac } from './math.mjs';













export const DEFORMATION = Object.freeze({
  minAreaRatio: 0.25, maxAreaRatio: 4, maxFoldDeg: 120, maxBadShare: 0.015, floorAreaRatio: 0.003, capAreaRatio: 12, minRestArea: 1e-5,
});






export const EXTREMES = Object.freeze([
  ['walk', [0, 0.08, 0.12, 0.25, 0.5, 0.62, 0.75, 0.95]],
  ['run', [0, 0.1, 0.15, 0.2, 0.3, 0.45, 0.5, 0.65, 0.7, 0.8]],
  ['pickUp', [0.36, 0.43, 0.5]],
  ['carry', [0, 0.5]],
  ['idle', [0, 0.62]],
]);


export function footTrack(skeleton, clip, contacts, { samples = 240 } = {}) {
  const pose = createPose(skeleton);
  const feet = { L: boneIndex(skeleton, 'footL'), R: boneIndex(skeleton, 'footR') };
  const track = {};
  for (const side of ['L', 'R']) track[side] = { y: new Float64Array(samples), z: new Float64Array(samples) };
  for (let s = 0; s < samples; s++) {
    const fk = forwardKinematics(skeleton, sampleClip(skeleton, clip, s / samples, pose));
    for (const side of ['L', 'R']) {
      const pts = contacts[`foot${side}`];
      let low = Infinity, z = 0;
      for (const p of pts) {
        const w = carriedPoint(skeleton, fk, feet[side], p);
        if (w[1] < low) low = w[1];
        z += w[2] / pts.length;
      }
      track[side].y[s] = low;
      track[side].z[s] = z;
    }
  }
  return track;
}


export function plantedFlags(heights, tolerance) {
  const min = Math.min(...heights);
  return Array.from(heights, (h) => h <= min + tolerance);
}

export const share = (flags) => flags.filter(Boolean).length / flags.length;


export function circularCentre(flags) {
  let sx = 0, sy = 0;
  flags.forEach((f, i) => {
    if (!f) return;
    const a = (2 * Math.PI * i) / flags.length;
    sx += Math.cos(a); sy += Math.sin(a);
  });
  return frac(Math.atan2(sy, sx) / (2 * Math.PI));
}




export function skate(footZ, flags, stride) {
  const n = flags.length;
  const start = flags.indexOf(false);
  if (start < 0) return Infinity; 
  let worst = 0, lo = Infinity, hi = -Infinity;
  for (let k = 1; k <= n; k++) {
    const i = (start + k) % n;
    if (flags[i]) {
      const w = footZ[i] + (stride * (start + k)) / n;
      if (w < lo) lo = w;
      if (w > hi) hi = w;
    } else if (lo <= hi) {
      worst = Math.max(worst, hi - lo);
      lo = Infinity; hi = -Infinity;
    }
  }
  return worst;
}
