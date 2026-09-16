
































import { boneIndex, createPose, forwardKinematics, jointPosition, carriedPoint } from './skeleton.mjs';
import { keySpan } from './pose.mjs';
import { quatFromEuler, quatNlerp, eulerFromQuat, eulerFromMat3, mat3FromEuler, mat3Mul, mat3Apply, mat3Transpose, mat3FromColumns, clamp, frac, v3 } from './math.mjs';

const TAU = Math.PI * 2;


export const ACT_NAMES = Object.freeze(['chop', 'dig', 'mine', 'water']);
export const CLIP_NAMES = Object.freeze(['idle', 'walk', 'run', 'carry', 'pickUp', ...ACT_NAMES]);
const SIDES = [['L', 1, 0], ['R', -1, 0.5]]; 
const LEG_BONES = ['legUpperL', 'legLowerL', 'footL', 'legUpperR', 'legLowerR', 'footR'];
const ARM_BONES = ['armUpperL', 'armLowerL', 'armUpperR', 'armLowerR'];

const FINGERS = Object.freeze(['thumb', 'index', 'middle', 'ring']);
const ZERO = Object.freeze([0, 0, 0]);



const REACH = 0.955;
const GROUNDED = 0.002;


const SLACK = 0.02;
const round = (v) => Math.round(v * 1e6) / 1e6 || 0; 
const uniform = (n) => Array.from({ length: n }, (_, i) => i / n);
const inclusive = (n) => Array.from({ length: n + 1 }, (_, i) => i / n);

const pulse = (p, at, w) => { const d = frac(p - at + 0.5) - 0.5; return Math.exp(-((d / w) ** 2)); };
const heading = (yaw) => [Math.sin(yaw), 0, Math.cos(yaw)];






















export const WALK = Object.freeze({
  name: 'walk', speed: 1.3, keys: 24, stance: 0.5, lift: 0.03, rise: 2, land: 2, snapOff: 2, snapOn: 4, relax: 0,
  crouch: 0.045, bob: 0.02, low: 0, tilt: 0,
  sway: 0.012, yaw: 0.16, roll: 0.05, lean: 0.05, nod: 0.035, ear: 0.12, arm: 0.42, armOut: 0.08,
  elbow: 0.18, elbowSwing: 0.22, tail: 0.3, toe: 0.2, narrow: 0.004,
});
export const RUN = Object.freeze({
  name: 'run', speed: 2.9, keys: 48, stance: 0.19, lift: 0.04, rise: 1.2, land: 1.2, snapOff: 3, snapOn: 5, relax: 0.2,
  crouch: 0.04, bob: 0.01, low: 0.1, tilt: 0.15,
  sway: 0.008, yaw: 0.2, roll: 0.035, lean: 0.1, nod: 0.05, ear: 0.24, arm: 0.8, armOut: 0.14,
  elbow: 1.0, elbowSwing: 0.3, tail: 0.45, toe: 0.25, narrow: 0.008,
});
const CARRY_MASK = Object.freeze({ armUpperL: 1, armLowerL: 1, handL: 1, armUpperR: 1, armLowerR: 1, handR: 1, chest: 0.5, spine: 0.35, neck: 0.3 });





const gaitOf = (base, over) => (over ? Object.freeze({ ...base, ...over, name: base.name, speed: base.speed }) : base);

export function buildClips(skeleton, { walk = gaitOf(WALK, skeleton.gait?.walk), run = gaitOf(RUN, skeleton.gait?.run) } = {}) {
  const limbs = {
    legs: { L: limbGeometry(skeleton, 'legUpperL', 'legLowerL', 'footL', 1), R: limbGeometry(skeleton, 'legUpperR', 'legLowerR', 'footR', 1) },
    arms: { L: limbGeometry(skeleton, 'armUpperL', 'armLowerL', 'handL', -1), R: limbGeometry(skeleton, 'armUpperR', 'armLowerR', 'handR', -1) },
  };
  return {
    idle: idleClip(skeleton, limbs),
    walk: gaitClip(skeleton, limbs, walk),
    run: gaitClip(skeleton, limbs, run),
    carry: carryClip(skeleton, limbs),
    pickUp: pickUpClip(skeleton, limbs),
    ...Object.fromEntries(ACT_NAMES.map((name) => [name, actClip(skeleton, limbs, name)])),
  };
}

const perp = (v, axis) => v3.norm(v3.sub(v, v3.mul(axis, v3.dot(v, axis))));




function limbGeometry(skeleton, upper, lower, end, flex) {
  const iU = boneIndex(skeleton, upper), iL = boneIndex(skeleton, lower), iE = boneIndex(skeleton, end);
  const H = skeleton.bones[iU].head, K = skeleton.bones[iL].head, A = skeleton.bones[iE].head;
  const u1 = v3.sub(K, H), u2 = v3.sub(A, K);
  return { iU, iL, iE, H, K, A, u1, u2, L1: v3.len(u1), L2: v3.len(u2), flex };
}

function setLocal(pose, i, R, share = 1) {
  const e = eulerFromMat3(R);
  quatFromEuler(e[0] * share, e[1] * share, e[2] * share, pose.q, i * 4);
}

const rotX = (t) => mat3FromEuler(t, 0, 0);

const frameTo = (a0, e0, a1, e1) => mat3Mul(mat3FromColumns(a1, e1, v3.cross(a1, e1)), mat3Transpose(mat3FromColumns(a0, e0, v3.cross(a0, e0))));












export function solveLimb(skeleton, pose, limb, { pos, pole, end = null, endShare = 1, reach = Infinity }) {
  for (const i of end ? [limb.iU, limb.iL, limb.iE] : [limb.iU, limb.iL]) { pose.q.fill(0, i * 4, i * 4 + 3); pose.q[i * 4 + 3] = 1; }
  const fk = forwardKinematics(skeleton, pose);
  const root = jointPosition(fk, limb.iU);
  const far = reach * (limb.L1 + limb.L2);
  const gap = v3.dist(pos, root);
  if (gap > far) {
    const slack = SLACK * (limb.L1 + limb.L2);
    pos = v3.add(root, v3.mul(v3.sub(pos, root), (far + slack * (1 - Math.exp(-(gap - far) / slack))) / gap));
  }
  const p = skeleton.bones[limb.iU].parent * 12;
  const Rp = [fk.world[p], fk.world[p + 1], fk.world[p + 2], fk.world[p + 4], fk.world[p + 5], fk.world[p + 6], fk.world[p + 8], fk.world[p + 9], fk.world[p + 10]];
  const { u1, u2, flex } = limb;
  const a = u1[1] * u2[1] + u1[2] * u2[2];
  const b = u1[2] * u2[1] - u1[1] * u2[2];
  const C = v3.dot(u1, u1) + v3.dot(u2, u2) + 2 * u1[0] * u2[0];
  const rho = Math.hypot(a, b), phi = Math.atan2(b, a);
  const d = v3.sub(pos, root);
  const k = clamp((v3.dot(d, d) - C) / (2 * rho), -1, 1);
  const wrap = (t) => Math.atan2(Math.sin(t), Math.cos(t));
  const roots = [wrap(phi + Math.acos(k)), wrap(phi - Math.acos(k))];
  
  
  
  const onSide = roots.filter((t) => t * flex >= -1e-9);
  const t = onSide.length ? onSide.reduce((best, r) => (Math.abs(r) < Math.abs(best) ? r : best)) : 0;
  const w = v3.add(u1, mat3Apply(rotX(t), u2));
  const wn = v3.norm(w);
  let e0 = v3.sub(u1, v3.mul(wn, v3.dot(u1, wn)));
  e0 = v3.len(e0) > 1e-9 ? v3.norm(e0) : perp([0, 0, 1], wn);
  const dir = v3.norm(d);
  const RU = frameTo(wn, e0, dir, perp(pole, dir));
  setLocal(pose, limb.iU, mat3Mul(mat3Transpose(Rp), RU));
  quatFromEuler(t, 0, 0, pose.q, limb.iL * 4);
  if (end) setLocal(pose, limb.iE, mat3Mul(mat3Transpose(mat3Mul(RU, rotX(t))), end), endShare);
  return { reach: v3.len(d) / v3.len(w) };
}

function framePose(skeleton, f) {
  const pose = createPose(skeleton);
  for (const [bone, e] of Object.entries(f.rot)) quatFromEuler(e[0], e[1], e[2], pose.q, boneIndex(skeleton, bone) * 4);
  const h = boneIndex(skeleton, 'hips') * 3;
  pose.t[h] = f.hips[0]; pose.t[h + 1] = f.hips[1]; pose.t[h + 2] = f.hips[2];
  return pose;
}





function bake(skeleton, limbs, { name, loop, duration, times, frame, extra = {}, stance }) {
  const tracks = {};
  const hips = [];
  const stretch = {};
  for (const phase of times) {
    const f = frame(phase);
    Object.assign(f.rot, addedBoneRot(skeleton, name, phase, f));
    const sf = stretchFrame(skeleton, name, phase, f, stance);
    if (sf) for (const [bone, v] of Object.entries(sf)) (stretch[bone] ||= []).push(round(v));
    const pose = framePose(skeleton, f);
    const names = Object.keys(f.rot);
    if (f.feet) {
      for (const [s] of SIDES) {
        const foot = f.feet[s];
        solveLimb(skeleton, pose, limbs.legs[s], { pos: foot.pos, pole: heading(foot.yaw || 0), end: mat3FromEuler(foot.pitch || 0, foot.yaw || 0, 0), endShare: 1 - (foot.relax || 0), reach: foot.reach });
      }
      names.push(...LEG_BONES);
    }
    if (f.hands) {
      if (f.hands.weight > 0) {
        const ik = { q: Float64Array.from(pose.q), t: Float64Array.from(pose.t) };
        const fk = forwardKinematics(skeleton, ik);
        for (const [s, sx] of SIDES) {
          const h = f.hands[s];
          const pos = h.relTo ? carriedPoint(skeleton, fk, boneIndex(skeleton, h.relTo), h.point) : h.point;
          solveLimb(skeleton, ik, limbs.arms[s], { pos, pole: h.pole || [sx * 0.8, -0.35, -0.45] });
        }
        for (const bone of ARM_BONES) {
          const i = boneIndex(skeleton, bone) * 4;
          quatNlerp(pose.q, i, ik.q, i, Math.min(1, f.hands.weight), pose.q, i);
        }
      }
      for (const bone of ARM_BONES) if (!names.includes(bone)) names.push(bone);
    }
    for (const bone of names) (tracks[bone] ||= []).push(eulerFromQuat(pose.q, boneIndex(skeleton, bone) * 4).map(round));
    hips.push(f.hips.map(round));
  }
  for (const [bone, keys] of Object.entries(tracks)) {
    if (keys.length !== times.length) throw new Error(`clips: ${name} names ${bone} in only ${keys.length} of ${times.length} keys`);
  }
  return { name, loop, duration, times: times.map(round), tracks, hips, ...(Object.keys(stretch).length ? { stretch } : {}), ...extra };
}









function stretchFrame(skeleton, clip, p, f, stance) {
  const st = skeleton.stretch;
  if (!st) return null;
  const arms = (v) => ({ armUpperL: v, armLowerL: v, armUpperR: v, armLowerR: v });
  const c = Math.cos(TAU * p);
  if (clip === 'idle') return arms(1 + st.arms * 0.04 * (0.5 - 0.5 * Math.cos(TAU * p)));
  if (clip === 'walk') return arms(1 + st.arms * 0.15 * c * c);
  if (clip === 'run') {
    const out = arms(1 + st.arms * 0.35 * c * c);
    if (st.legs) {
      for (const [side, , landsAt] of SIDES) {
        const local = frac(p - landsAt);
        const swing = local > stance ? Math.sin((Math.PI * (local - stance)) / (1 - stance)) : 0;
        out[`legLower${side}`] = 1 + st.legs * swing * swing;
      }
    }
    return out;
  }
  if (clip === 'carry') return arms(1 + st.arms * 0.1);
  if (clip === 'pickUp') return arms(1 + st.arms * (f.hands ? f.hands.weight : 0));
  return null;
}







function addedBoneRot(skeleton, clip, p, f = null) {
  const has = (n) => skeleton.bones.some((b) => b.name === n);
  const out = {};
  const s = (k, off) => Math.sin(TAU * k * p + off);
  const gait = clip === 'walk' || clip === 'run';
  const g = clip === 'run' ? 1.5 : 1;
  if (has('neck2')) {
    if (clip === 'idle') {
      out.neck2 = [0.035 * s(1, 0.4), 0.05 * s(1, 0), 0.03 * s(1, -0.8)];
      out.neck3 = [-0.03 * s(1, -0.2), 0.04 * s(1, -0.6), 0.025 * s(1, -1.4)];
    } else if (gait) {
      out.neck2 = [0.05 * g * s(2, -0.5), 0.04 * g * s(1, 0.3), 0];
      out.neck3 = [-0.045 * g * s(2, -1.1), 0.03 * g * s(1, -0.3), 0];
    }
  }
  if (has('trunk1')) {
    if (clip === 'idle') {
      out.trunk1 = [0.08 * s(1, 0), 0.1 * s(1, 0.9), 0.06 * s(2, 0.2)];
      out.trunk2 = [0.12 * s(1, -0.7), 0.14 * s(1, 0.2), 0.08 * s(2, -0.5)];
      out.trunk3 = [0.18 * s(1, -1.4) - 0.1, 0.2 * s(1, -0.5), 0.1 * s(2, -1.2)];
    } else if (gait) {
      out.trunk1 = [0.08 * g * s(2, -0.8), 0.12 * g * s(1, -0.6), 0];
      out.trunk2 = [0.12 * g * s(2, -1.5), 0.16 * g * s(1, -1.3), 0];
      out.trunk3 = [0.16 * g * s(2, -2.2), 0.2 * g * s(1, -2.0), 0];
    }
  }
  
  
  
  
  if (has('indexL')) {
    const reach = f && f.hands ? f.hands.weight : 0;
    
    const base = { idle: 0.35, walk: 0.4, run: 0.55, carry: 1.2, pickUp: 0.35 + 0.9 * reach, chop: 1.3, dig: 1.3, mine: 1.3, water: 1.2 }[clip] ?? 0;
    FINGERS.forEach((name, j) => {
      for (const [side, sx] of [['L', 1], ['R', -1]]) {
        const wig = clip === 'idle' ? 0.06 * Math.sin(TAU * p + j * 0.9 + (sx > 0 ? 0 : 1.7)) : 0;
        if (name === 'thumb') out[`thumb${side}`] = [0.7 * base + wig, 0, -sx * 0.15 * base];
        else out[`${name}${side}`] = [0, 0, -sx * (base * (1 + 0.08 * j) + wig)];
      }
    });
  }
  return out;
}



function gaitFoot(p, landsAt, g, stride, rest, sx) {
  const local = frac(p - landsAt);
  const R = (stride * g.stance) / 2;
  let z, y = rest[1], pitch = 0, relax = 0;
  if (local < g.stance) {
    z = R * (1 - (2 * local) / g.stance); 
  } else {
    const u = (local - g.stance) / (1 - g.stance);
    const v = (-2 * R * (1 - g.stance)) / g.stance; 
    
    
    
    
    
    z = -R + 2 * R * u * u * (3 - 2 * u) + v * (u * (1 - u) ** g.snapOff - u ** g.snapOn * (1 - u));
    const a = g.rise, b = g.land;
    const h = (u ** a * (1 - u) ** b * (a + b) ** (a + b)) / (a ** a * b ** b); 
    y += g.lift * h;
    
    
    
    pitch = -g.toe * u * Math.sin(Math.PI * u) ** 2;
    relax = g.relax * h * h;
  }
  return { pos: [rest[0] - sx * g.narrow, y, rest[2] + z], yaw: 0, pitch, relax, reach: REACH };
}

function gaitFrame(p, g, stride, limbs) {
  const c = Math.cos(TAU * p), s = Math.sin(TAU * p);
  const b = 2 * TAU * (p - g.low); 
  const rot = {
    hips: [g.tilt, -g.yaw * c, g.roll * s],
    spine: [g.lean * 0.45, g.yaw * 0.55 * c, -g.roll * 0.55 * s],
    chest: [g.lean * 0.55 - 0.015 * Math.cos(b), g.yaw * 0.3 * c, -g.roll * 0.35 * s],
    neck: [0, 0, 0],
    head: [-(g.lean + g.tilt) * 0.85 + g.nod * Math.sin(b - 0.9), -g.yaw * 0.35 * c, -g.roll * 0.1 * s],
    earL: [g.ear * Math.sin(b - 1.2), 0.04 * s, 0.05 * s],
    earR: [g.ear * 1.2 * Math.sin(b - 1.6), -0.03 * s, -0.06 * Math.sin(TAU * p + 0.5)],
    armUpperL: [g.arm * c, 0, g.armOut],
    armLowerL: [-g.elbow - g.elbowSwing * (0.5 - 0.5 * c), 0, 0],
    handL: [-0.12, 0, 0],
    armUpperR: [-g.arm * c, 0, -g.armOut],
    armLowerR: [-g.elbow - g.elbowSwing * (0.5 + 0.5 * c), 0, 0],
    handR: [-0.12, 0, 0],
    tail1: [0.12 * Math.sin(b), g.tail * s, 0],
    tail2: [0, g.tail * Math.sin(TAU * p - 0.9), 0],
    tail3: [0, g.tail * Math.sin(TAU * p - 1.8), 0],
  };
  const feet = {};
  for (const [side, sx, landsAt] of SIDES) feet[side] = gaitFoot(p, landsAt, g, stride, limbs.legs[side].A, sx);
  return { rot, hips: [g.sway * s, -g.crouch - g.bob * Math.cos(b), 0], feet };
}







function fitStride(skeleton, limbs, g) {
  const reachable = (stride) => {
    for (let i = 0; i < g.keys * 4; i++) {
      const f = gaitFrame(i / (g.keys * 4), g, stride, limbs);
      const fk = forwardKinematics(skeleton, framePose(skeleton, f));
      for (const [s] of SIDES) {
        const leg = limbs.legs[s];
        if (f.feet[s].pos[1] - leg.A[1] > GROUNDED) continue;
        if (v3.dist(jointPosition(fk, leg.iU), f.feet[s].pos) > REACH * (leg.L1 + leg.L2)) return false;
      }
    }
    return true;
  };
  if (!reachable(0)) throw new Error(`clips: ${g.name} cannot keep its feet down even in place (crouch ${g.crouch} m is too shallow for these legs)`);
  let lo = 0, hi = 2;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (reachable(mid)) lo = mid; else hi = mid;
  }
  return lo;
}

function gaitClip(skeleton, limbs, g) {
  if (!(g.speed > 0)) throw new Error(`clips: ${g.name} needs a ground speed (m/s), got ${g.speed}`);
  const stride = round(fitStride(skeleton, limbs, g));
  return bake(skeleton, limbs, {
    name: g.name, loop: true, duration: round(stride / g.speed), times: uniform(g.keys),
    frame: (p) => gaitFrame(p, g, stride, limbs),
    extra: { stride, speed: g.speed },
    stance: g.stance,
  });
}







function idleClip(skeleton, limbs) {
  const { L, R } = limbs.legs;
  const frame = (p) => {
    const s = Math.sin(TAU * p);
    const flick = pulse(p, 0.62, 0.045);
    return {
      hips: [0.02 + 0.002 * s, -0.015 + 0.003 * Math.sin(TAU * p - 1.3), 0.004],
      rot: {
        hips: [0.02, 0.06, 0.07],
        spine: [0.03, -0.03, -0.045],
        chest: [0.01 + 0.022 * s, -0.03, -0.03],
        neck: [0, 0.03, 0.01],
        head: [-0.03 - 0.02 * Math.sin(TAU * p - 0.6), 0.14, 0.11 + 0.015 * s],
        earL: [0.05 * Math.sin(TAU * p + 1.0), 0, 0.03],
        earR: [0.15 * flick, 0, -0.32 * flick],
        armUpperL: [0.05 + 0.02 * Math.sin(TAU * p + 0.4), 0, -0.05],
        armLowerL: [-0.16, 0, 0],
        handL: [0.05, 0, 0],
        armUpperR: [-0.2, 0.12, 0.03],
        armLowerR: [-0.55 - 0.03 * s, 0, 0],
        handR: [-0.2, 0, 0],
        tail1: [0.05, 0.2 * Math.sin(2 * TAU * p), 0],
        tail2: [0, 0.2 * Math.sin(2 * TAU * p - 1), 0],
        tail3: [0, 0.2 * Math.sin(2 * TAU * p - 2), 0],
      },
      feet: {
        L: { pos: [L.A[0] + 0.004, L.A[1], L.A[2]], yaw: 0.06 },
        R: { pos: [R.A[0] - 0.018, R.A[1], R.A[2] + 0.035], yaw: -0.32 },
      },
    };
  };
  return bake(skeleton, limbs, { name: 'idle', loop: true, duration: 3.4, times: uniform(20), frame });
}








function carryClip(skeleton, limbs) {
  const chest = skeleton.bones[boneIndex(skeleton, 'chest')].head;
  const hold = skeleton.hold || [chest[0], chest[1] - 0.012, chest[2] + 0.18];
  const frame = (p) => {
    const s = Math.sin(TAU * p);
    return {
      hips: [0, 0, 0],
      rot: {
        spine: [-0.03, 0, 0],
        chest: [-0.06 + 0.012 * s, 0, 0],
        neck: [0.04, 0, 0],
        armUpperL: [-0.7, 0, 0], armLowerL: [-0.9, 0, 0], handL: [0.25, -0.2, 0],
        armUpperR: [-0.7, 0, 0], armLowerR: [-0.9, 0, 0], handR: [0.25, 0.2, 0],
      },
      hands: {
        weight: 1,
        L: { relTo: 'chest', point: [hold[0] + 0.08, hold[1] - 0.01 + 0.004 * s, hold[2] - 0.03] },
        R: { relTo: 'chest', point: [hold[0] - 0.076, hold[1] - 0.004 + 0.004 * Math.sin(TAU * p + 0.35), hold[2] - 0.034] },
      },
    };
  };
  return bake(skeleton, limbs, { name: 'carry', loop: true, duration: 1.6, times: uniform(12), frame, extra: { mask: carryMask(skeleton) } });
}



function carryMask(skeleton) {
  if (!skeleton.bones.some((b) => b.name === 'indexL')) return CARRY_MASK;
  const mask = { ...CARRY_MASK };
  for (const name of FINGERS) for (const side of ['L', 'R']) mask[`${name}${side}`] = 1;
  return Object.freeze(mask);
}







const PICKUP = [
  { t: 0, hips: [0, 0, 0], reach: 0, rot: {} },
  { t: 0.14, hips: [0, -0.004, 0.006], reach: 0, rot: { chest: [-0.07, 0, 0], head: [0.05, 0, 0], armUpperL: [0.12, 0, 0], armUpperR: [0.12, 0, 0] } },
  { t: 0.36, hips: [0, -0.082, -0.038], reach: 1, rot: {
    hips: [0.18, 0, 0], spine: [0.46, 0, 0.02], chest: [0.32, 0, 0], neck: [0.12, 0, 0], head: [-0.12, 0.05, 0.06],
    earL: [0.4, 0, 0.1], earR: [0.5, 0, -0.1], armUpperL: [-0.72, -0.12, 0], armLowerL: [-0.3, 0, 0], handL: [0.35, 0, 0],
    armUpperR: [-0.78, 0.12, 0], armLowerR: [-0.26, 0, 0], handR: [0.35, 0, 0], tail1: [-0.3, 0, 0],
  } },
  { t: 0.5, hips: [0, -0.085, -0.04], reach: 1, rot: {
    hips: [0.19, 0, 0], spine: [0.48, 0, 0.02], chest: [0.33, 0, 0], neck: [0.1, 0, 0], head: [-0.1, 0.05, 0.05],
    earL: [0.32, 0, 0.08], earR: [0.42, 0, -0.08], armUpperL: [-0.78, -0.1, 0], armLowerL: [-0.34, 0, 0], handL: [0.3, 0, 0],
    armUpperR: [-0.82, 0.1, 0], armLowerR: [-0.3, 0, 0], handR: [0.3, 0, 0], tail1: [-0.25, 0, 0],
  } },
  { t: 0.68, hips: [0, -0.028, -0.012], reach: 0, rot: {
    hips: [0.05, 0, 0], spine: [0.16, 0, 0], chest: [0.08, 0, 0], head: [0.02, 0, 0], earL: [0.2, 0, 0.05], earR: [0.25, 0, -0.05],
    armUpperL: [-0.55, -0.1, 0], armLowerL: [-0.9, 0, 0], handL: [0.2, 0, 0], armUpperR: [-0.58, 0.1, 0], armLowerR: [-0.9, 0, 0], handR: [0.2, 0, 0],
  } },
  { t: 0.84, hips: [0, -0.003, 0.004], reach: 0, rot: {
    chest: [-0.05, 0, 0], spine: [-0.02, 0, 0], head: [0.05, 0, 0], earL: [-0.12, 0, 0], earR: [-0.15, 0, 0],
    armUpperL: [-0.2, 0, 0], armLowerL: [-0.4, 0, 0], armUpperR: [-0.2, 0, 0], armLowerR: [-0.4, 0, 0],
  } },
  { t: 1, hips: [0, 0, 0], reach: 0, rot: {} },
];
const PICKUP_WRISTS = { L: [0.075, 0.1, 0.19], R: [-0.068, 0.1, 0.2] };




function pickUpClip(skeleton, limbs) {
  const times = PICKUP.map((k) => k.t);
  const bones = [...new Set(PICKUP.flatMap((k) => Object.keys(k.rot)))];
  const drop = skeleton.gait?.pickUp?.drop;
  const frame = (p) => {
    const { k, c } = keySpan(times, false, p);
    const blend = (get) => {
      const vals = k.map((i) => get(PICKUP[i]));
      return vals[0].map((_, j) => c[0] * vals[0][j] + c[1] * vals[1][j] + c[2] * vals[2][j] + c[3] * vals[3][j]);
    };
    const rot = {};
    for (const b of bones) rot[b] = blend((key) => key.rot[b] || ZERO);
    return {
      hips: drop === undefined ? blend((key) => key.hips) : blend((key) => key.hips.map((v) => v * drop)),
      rot,
      feet: { L: { pos: limbs.legs.L.A }, R: { pos: limbs.legs.R.A } },
      hands: { weight: clamp(blend((key) => [key.reach])[0], 0, 1), L: { point: PICKUP_WRISTS.L }, R: { point: PICKUP_WRISTS.R } },
    };
  };
  return bake(skeleton, limbs, { name: 'pickUp', loop: false, duration: 1.1, times: inclusive(44), frame });
}























const ACTS = {
  
  
  chop: { duration: 1.05, keys: [
    { t: 0, hips: [0, 0, 0], rot: {} },
    { t: 0.12, hips: [0, -0.008, 0], rot: { chest: [0.03, -0.1, 0], armUpperR: [-0.5, -0.2, 0.2], armLowerR: [-0.3, 0, 0], handR: [0.5, 0, 0] } },
    { t: 0.36, hips: [0, -0.012, -0.008], rot: {
      hips: [0, -0.2, 0], spine: [-0.02, -0.3, 0.04], chest: [-0.04, -0.3, 0.02], neck: [0, 0.22, 0], head: [0.04, 0.28, 0],
      armUpperR: [-1.25, -0.9, 0.7], armLowerR: [-0.35, 0, 0], handR: [0.8, 0, 0.3],
      armUpperL: [-0.5, 0.5, 0.1], armLowerL: [-0.9, 0, 0], handL: [0.2, 0, 0],
    } },
    { t: 0.52, hips: [0, -0.03, 0.02], rot: {
      hips: [0.06, 0.22, 0], spine: [0.12, 0.34, -0.04], chest: [0.1, 0.3, -0.02], neck: [0, -0.22, 0], head: [-0.05, -0.26, 0],
      armUpperR: [-1.05, 0, 1.0], armLowerR: [-0.2, 0, 0], handR: [0.9, 0, 0.5],
      armUpperL: [0.25, -0.2, 0.2], armLowerL: [-0.5, 0, 0], handL: [0, 0, 0],
    } },
    { t: 0.62, hips: [0, -0.026, 0.016], rot: {
      hips: [0.05, 0.19, 0], spine: [0.1, 0.3, -0.03], chest: [0.08, 0.26, -0.02], neck: [0, -0.2, 0], head: [-0.04, -0.22, 0],
      armUpperR: [-1.05, 0.3, 0.95], armLowerR: [-0.3, 0, 0], handR: [0.8, 0, 0.45],
      armUpperL: [0.2, -0.18, 0.18], armLowerL: [-0.5, 0, 0], handL: [0, 0, 0],
    } },
    { t: 0.82, hips: [0, -0.006, 0.004], rot: { spine: [0.03, 0.06, 0], chest: [0.02, 0.05, 0], armUpperR: [-0.45, 0.1, 0.3], armLowerR: [-0.4, 0, 0], handR: [0.4, 0, 0.1], armLowerL: [-0.2, 0, 0] } },
    { t: 1, hips: [0, 0, 0], rot: {} },
  ] },
  mine: { duration: 1.2, keys: [
    { t: 0, hips: [0, 0, 0], rot: {} },
    
    
    { t: 0.14, hips: [0, -0.012, 0], rot: { spine: [0.08, 0, 0], chest: [0.06, 0, 0], armUpperR: [-0.3, 0, 0], armLowerR: [-0.25, 0, 0], armUpperL: [-0.3, 0, 0], armLowerL: [-0.25, 0, 0], handR: [0.3, 0, 0] } },
    { t: 0.4, hips: [0, 0.004, -0.012], rot: {
      hips: [-0.08, -0.05, 0], spine: [-0.26, -0.04, 0], chest: [-0.2, 0, 0], neck: [0.1, 0, 0], head: [0.24, 0, 0],
      armUpperR: [-1.95, 0.1, 0.4], armLowerR: [-1.2, 0, 0], handR: [0.7, 0, 0],
      armUpperL: [-1.85, -0.1, -0.42], armLowerL: [-1.25, 0, 0], handL: [0.5, 0, 0],
    } },
    { t: 0.56, hips: [0, -0.05, 0.02], rot: {
      hips: [0.2, 0.04, 0], spine: [0.5, 0.02, 0], chest: [0.32, 0, 0], neck: [0.08, 0, 0], head: [-0.32, 0, 0],
      armUpperR: [-0.85, 0.1, 0.3], armLowerR: [-0.15, 0, 0], handR: [0.1, 0, 0],
      armUpperL: [-0.8, -0.1, -0.3], armLowerL: [-0.25, 0, 0], handL: [0.1, 0, 0],
    } },
    { t: 0.66, hips: [0, -0.044, 0.016], rot: {
      hips: [0.17, 0.04, 0], spine: [0.44, 0.02, 0], chest: [0.28, 0, 0], neck: [0.06, 0, 0], head: [-0.28, 0, 0],
      armUpperR: [-0.95, 0.1, 0.3], armLowerR: [-0.3, 0, 0], handR: [0, 0, 0],
      armUpperL: [-0.9, -0.1, -0.3], armLowerL: [-0.35, 0, 0], handL: [0, 0, 0],
    } },
    { t: 0.84, hips: [0, -0.01, 0.004], rot: { spine: [0.1, 0, 0], chest: [0.06, 0, 0], armUpperR: [-0.45, 0.05, 0.1], armLowerR: [-0.5, 0, 0], handR: [0.2, 0, 0], armUpperL: [-0.4, -0.05, -0.1], armLowerL: [-0.5, 0, 0] } },
    { t: 1, hips: [0, 0, 0], rot: {} },
  ] },
  dig: { duration: 1.25, keys: [
    { t: 0, hips: [0, 0, 0], rot: {} },
    { t: 0.2, hips: [0, 0.004, 0], rot: {
      spine: [-0.04, 0, 0], chest: [-0.04, 0, 0], head: [0.06, 0, 0],
      armUpperR: [-1.0, 0.25, 0.3], armLowerR: [-0.9, 0, 0], handR: [0.9, 0, 0],
      armUpperL: [-0.9, -0.3, -0.25], armLowerL: [-1.0, 0, 0], handL: [0.3, 0, 0],
    } },
    { t: 0.42, hips: [0, -0.055, -0.02], rot: {
      hips: [0.16, 0, 0], spine: [0.4, 0, 0.02], chest: [0.24, 0, 0], neck: [0.06, 0, 0], head: [-0.26, 0, 0],
      armUpperR: [-0.45, 0.3, 0.28], armLowerR: [-0.2, 0, 0], handR: [0.7, 0, 0],
      armUpperL: [-0.7, -0.35, -0.3], armLowerL: [-0.5, 0, 0], handL: [0.4, 0, 0],
    } },
    { t: 0.56, hips: [0, -0.05, -0.024], rot: {
      hips: [0.12, 0, 0], spine: [0.34, -0.05, 0.02], chest: [0.2, -0.05, 0], neck: [0.04, 0, 0], head: [-0.2, 0, 0],
      armUpperR: [-0.75, 0.28, 0.26], armLowerR: [-0.5, 0, 0], handR: [0.9, 0, 0],
      armUpperL: [-0.8, -0.3, -0.25], armLowerL: [-0.8, 0, 0], handL: [0.2, 0, 0],
    } },
    { t: 0.74, hips: [0, -0.012, -0.01], rot: {
      hips: [-0.02, -0.15, 0], spine: [-0.04, -0.28, 0], chest: [-0.06, -0.24, 0], neck: [0, 0.14, 0], head: [0.08, 0.1, 0],
      armUpperR: [-1.45, -0.35, -0.4], armLowerR: [-0.7, 0, 0], handR: [0.2, 0, 0],
      armUpperL: [-0.6, -0.2, -0.1], armLowerL: [-0.9, 0, 0], handL: [0.1, 0, 0],
    } },
    { t: 0.88, hips: [0, -0.004, 0], rot: { spine: [0.02, -0.06, 0], chest: [0, -0.05, 0], armUpperR: [-0.5, 0, -0.1], armLowerR: [-0.4, 0, 0], handR: [0.5, 0, 0], armUpperL: [-0.2, 0, 0], armLowerL: [-0.3, 0, 0] } },
    { t: 1, hips: [0, 0, 0], rot: {} },
  ] },
  water: { duration: 1.5, keys: [
    { t: 0, hips: [0, 0, 0], rot: {} },
    { t: 0.18, hips: [0, -0.004, 0], rot: { chest: [-0.02, 0, 0], armUpperR: [-0.6, 0.2, 0.15], armLowerR: [-0.4, 0, 0], handR: [0.85, 0, 0], armUpperL: [0.1, 0, 0.3], armLowerL: [-0.3, 0, 0] } },
    { t: 0.38, hips: [0, -0.02, 0.01], rot: {
      spine: [0.14, 0.04, 0], chest: [0.1, 0.04, 0], neck: [0.04, 0, 0], head: [-0.14, 0, 0],
      armUpperR: [-0.5, 0, -0.58], armLowerR: [-0.12, 0, 0], handR: [0.9, 0, 0.05],
      armUpperL: [0.15, 0, 0.4], armLowerL: [-0.35, 0, 0], handL: [0.2, 0, 0],
    } },
    { t: 0.52, hips: [0, -0.022, 0.012], rot: {
      spine: [0.16, 0.06, 0], chest: [0.12, 0.06, 0], neck: [0.04, 0, 0], head: [-0.16, -0.08, 0.03],
      armUpperR: [-0.46, 0.05, -0.56], armLowerR: [-0.1, 0, 0], handR: [0.9, 0, 0.12],
      armUpperL: [0.15, 0, 0.42], armLowerL: [-0.35, 0, 0], handL: [0.2, 0, 0],
    } },
    { t: 0.66, hips: [0, -0.02, 0.01], rot: {
      spine: [0.14, 0.02, 0], chest: [0.1, 0.02, 0], neck: [0.04, 0, 0], head: [-0.14, -0.1, -0.02],
      
      
      armUpperR: [-0.5, -0.05, -0.6], armLowerR: [-0.12, 0, 0], handR: [0.88, 0, -0.06],
      armUpperL: [0.15, 0, 0.38], armLowerL: [-0.35, 0, 0], handL: [0.2, 0, 0],
    } },
    { t: 0.82, hips: [0, -0.006, 0.002], rot: { spine: [0.04, 0, 0], chest: [0.02, 0, 0], armUpperR: [-0.55, 0.15, 0.12], armLowerR: [-0.4, 0, 0], handR: [0.8, 0, 0], armUpperL: [0.05, 0, 0.12], armLowerL: [-0.2, 0, 0] } },
    { t: 1, hips: [0, 0, 0], rot: {} },
  ] },
};

function actClip(skeleton, limbs, name) {
  const { duration, keys } = ACTS[name];
  const times = keys.map((k) => k.t);
  const bones = [...new Set(keys.flatMap((k) => Object.keys(k.rot)))];
  const drop = skeleton.gait?.pickUp?.drop ?? 1;
  const frame = (p) => {
    const { k, c } = keySpan(times, false, p);
    const blend = (get) => {
      const vals = k.map((i) => get(keys[i]));
      return vals[0].map((_, j) => c[0] * vals[0][j] + c[1] * vals[1][j] + c[2] * vals[2][j] + c[3] * vals[3][j]);
    };
    const rot = {};
    for (const b of bones) rot[b] = blend((key) => key.rot[b] || ZERO);
    return {
      hips: blend((key) => key.hips.map((v) => v * drop)),
      rot,
      feet: { L: { pos: limbs.legs.L.A }, R: { pos: limbs.legs.R.A } },
    };
  };
  return bake(skeleton, limbs, { name, loop: false, duration, times: inclusive(Math.round(duration * 40)), frame });
}





export function gripBasis(axis) {
  const z = v3.norm(axis);
  const y = v3.norm(v3.sub([0, 1, 0], v3.mul(z, z[1])));
  return { X: v3.cross(y, z), Y: y, Z: z };
}
