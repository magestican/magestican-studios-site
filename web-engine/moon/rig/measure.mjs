






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












export const CONTACT = 0.001;




export function contactOf(track) {
  const L = plantedFlags(track.L.y, CONTACT), R = plantedFlags(track.R.y, CONTACT);
  let both = 0, neither = 0;
  for (let i = 0; i < L.length; i++) { if (L[i] && R[i]) both++; else if (!L[i] && !R[i]) neither++; }
  return { flags: { L, R }, share: { L: share(L), R: share(R) }, double: both / L.length, flight: neither / L.length, gap: frac(circularCentre(L) - circularCentre(R)) };
}









export function gaitMisses(clip, track, stance, { tolerance = 0.04, slide = 0.01, ground = 0.01 } = {}) {
  const c = contactOf(track);
  const out = [];
  for (const side of ['L', 'R']) {
    const s = c.share[side];
    if (Math.abs(s - stance) > tolerance) out.push(`${side}: on the ground ${r3(s)} of the cycle, authored stance ${stance}`);
    const low = Math.min(...track[side].y);
    if (!(Math.abs(low) < ground)) out.push(`${side}: sole bottoms out at ${r3(low)} m, not the ground`);
    const sk = skate(track[side].z, c.flags[side], clip.stride);
    if (!(sk < slide)) out.push(`${side}: a planted sole slides ${r3(sk)} m`);
  }
  if (!(Math.abs(c.gap - 0.5) < 0.05)) out.push(`contacts ${r3(c.gap)} of a cycle apart, not half`);
  if (stance >= 0.5) {
    if (!(c.double > 0)) out.push('a walk has no double support');
    if (c.flight > 0) out.push(`a walk leaves the ground for ${r3(c.flight)} of the cycle`);
  } else {
    if (!(c.flight > 0)) out.push('a run never leaves the ground');
    if (c.double > 0) out.push(`a run has both feet down for ${r3(c.double)} of the cycle`);
  }
  return out;
}
const r3 = (v) => Math.round(v * 1000) / 1000;


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
