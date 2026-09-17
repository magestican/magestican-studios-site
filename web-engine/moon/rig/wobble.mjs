





























import { boneIndex, createPose, forwardKinematics, jointPosition } from './skeleton.mjs';
import { sampleClip } from './pose.mjs';
import { footTrack, plantedFlags, share, circularCentre, skate } from './measure.mjs';





export const SAMPLES = 240;



export const CONTACT = 0.001;


export const PLANTED = 0.015;

const mean = (a) => { let s = 0; for (const v of a) s += v; return s / a.length; };

export const amplitude = (a) => (Math.max(...a) - Math.min(...a)) / 2;
const mm = (v) => Math.round(v * 1e5) / 100;
const deg = (v) => Math.round((v * 180) / Math.PI * 100) / 100;




export function jointTrack(skeleton, clip, name, { samples = SAMPLES } = {}) {
  const i = boneIndex(skeleton, name);
  if (i < 0) throw new Error(`wobble: no bone '${name}' on this skeleton`);
  const pose = createPose(skeleton);
  const x = new Float64Array(samples), y = new Float64Array(samples), z = new Float64Array(samples), roll = new Float64Array(samples);
  for (let s = 0; s < samples; s++) {
    const fk = forwardKinematics(skeleton, sampleClip(skeleton, clip, s / samples, pose));
    const p = jointPosition(fk, i);
    x[s] = p[0]; y[s] = p[1]; z[s] = p[2];
    roll[s] = Math.atan2(fk.world[i * 12 + 4], fk.world[i * 12]);
  }
  return { x, y, z, roll };
}


export function slideOf(skeleton, clip, contacts, { samples = SAMPLES } = {}) {
  const track = footTrack(skeleton, clip, contacts, { samples });
  return Math.max(...['L', 'R'].map((s) => skate(track[s].z, plantedFlags(track[s].y, CONTACT), clip.stride)));
}



export function landOf(skeleton, clip, contacts, { samples = SAMPLES } = {}) {
  const track = footTrack(skeleton, clip, contacts, { samples });
  const out = {};
  for (const s of ['L', 'R']) {
    const flags = plantedFlags(track[s].y, PLANTED);
    out[s] = { at: Math.round(circularCentre(flags) * 1000) / 1000, stance: Math.round(share(flags) * 1000) / 1000 };
  }
  return out;
}






export function leanOf(skeleton, clip, { samples = SAMPLES, bone = 'chest' } = {}) {
  const i = boneIndex(skeleton, bone);
  const pose = createPose(skeleton);
  let sum = 0;
  for (let s = 0; s < samples; s++) {
    const fk = forwardKinematics(skeleton, sampleClip(skeleton, clip, s / samples, pose));
    
    sum += Math.atan2(fk.world[i * 12 + 9], fk.world[i * 12 + 5]);
  }
  return sum / samples;
}


export function wobbleOf(skeleton, clip, contacts, { samples = SAMPLES, head = 'head' } = {}) {
  const h = jointTrack(skeleton, clip, head, { samples });
  const hip = jointTrack(skeleton, clip, 'hips', { samples });
  return {
    headHeight_m: Math.round(mean(h.y) * 1000) / 1000,
    lean_deg: deg(leanOf(skeleton, clip, { samples })),
    sway_mm: mm(amplitude(h.x)),
    bob_mm: mm(amplitude(h.y)),
    hipRoll_deg: deg(amplitude(hip.roll)),
    headRoll_deg: deg(amplitude(h.roll)),
    slide_mm: mm(slideOf(skeleton, clip, contacts, { samples })),
    land: landOf(skeleton, clip, contacts, { samples }),
  };
}







export const MOTION_BAR = Object.freeze({
  
  
  
  
  walk: Object.freeze({ sway_mm: 12, bob_mm: [16, 26], hipRoll_deg: 4, headRoll_deg: 1.5 }),
  
  
  
  
  
  run: Object.freeze({ sway_mm: 16, bob_mm: [30, 48], hipRoll_deg: 4, headRoll_deg: 1.5, lean_deg: [6, 20] }),
  
  
  slide_mm: 10,
  
  
  
  swayOverBob: 0.5,
});


export function barMisses(gait, row) {
  const bar = MOTION_BAR[gait];
  if (!bar) throw new Error(`wobble: no bar for gait '${gait}'`);
  const out = [];
  if (row.sway_mm > bar.sway_mm) out.push(`head sways ${row.sway_mm} mm, over ${bar.sway_mm}`);
  if (row.bob_mm < bar.bob_mm[0]) out.push(`head bobs ${row.bob_mm} mm, under ${bar.bob_mm[0]}`);
  if (row.bob_mm > bar.bob_mm[1]) out.push(`head bobs ${row.bob_mm} mm, over ${bar.bob_mm[1]}`);
  if (bar.lean_deg && row.lean_deg < bar.lean_deg[0]) out.push(`leans ${row.lean_deg} deg, under ${bar.lean_deg[0]}`);
  if (bar.lean_deg && row.lean_deg > bar.lean_deg[1]) out.push(`leans ${row.lean_deg} deg, over ${bar.lean_deg[1]}`);
  if (row.hipRoll_deg > bar.hipRoll_deg) out.push(`hips roll ${row.hipRoll_deg} deg, over ${bar.hipRoll_deg}`);
  if (row.headRoll_deg > bar.headRoll_deg) out.push(`head rolls ${row.headRoll_deg} deg, over ${bar.headRoll_deg}`);
  if (row.slide_mm > MOTION_BAR.slide_mm) out.push(`a planted sole slides ${row.slide_mm} mm, over ${MOTION_BAR.slide_mm}`);
  const ratio = row.bob_mm > 0 ? row.sway_mm / row.bob_mm : Infinity;
  if (ratio > MOTION_BAR.swayOverBob) out.push(`sways ${Math.round(ratio * 100) / 100} of its bob, over ${MOTION_BAR.swayOverBob} - a waddle`);
  return out;
}
