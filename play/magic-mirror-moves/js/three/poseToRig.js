










import { seen } from '../pose/pose.js';
import { THREE } from '../vendor/three-vendor.js';
import { RIG_BONES, RIG_PARENT } from './rig.js';


export const DEFAULT_STATURE_M = 1.25;


const Z_SIGN_RAMP = 0.08;

const LIMB = {
  'upper_arm.L': ['left_shoulder', 'left_elbow'],
  'forearm.L': ['left_elbow', 'left_wrist'],
  'hand.L': ['left_wrist', 'left_index'],
  'upper_arm.R': ['right_shoulder', 'right_elbow'],
  'forearm.R': ['right_elbow', 'right_wrist'],
  'hand.R': ['right_wrist', 'right_index'],
  'thigh.L': ['left_hip', 'left_knee'],
  'shin.L': ['left_knee', 'left_ankle'],
  'foot.L': ['left_ankle', 'left_foot_index'],
  'thigh.R': ['right_hip', 'right_knee'],
  'shin.R': ['right_knee', 'right_ankle'],
  'foot.R': ['right_ankle', 'right_foot_index'],
};


const LIMB_CHAINS = [
  ['thigh', 'shin', { L: ['left_hip', 'left_knee', 'left_ankle'], R: ['right_hip', 'right_knee', 'right_ankle'] }],
  ['upper_arm', 'forearm', { L: ['left_shoulder', 'left_elbow', 'left_wrist'], R: ['right_shoulder', 'right_elbow', 'right_wrist'] }],
];
const MIN_LIMB_SCALE = 0.8;


const BONE_NEEDS = {
  hips: ['left_hip', 'right_hip'],
  spine: ['left_hip', 'right_hip', 'left_shoulder', 'right_shoulder'],
  chest: ['left_shoulder', 'right_shoulder'],
  neck: ['left_shoulder', 'right_shoulder'],
  head: ['nose'],
  'shoulder.L': ['left_shoulder'],
  'shoulder.R': ['right_shoulder'],
  'upper_arm.L': ['left_shoulder', 'left_elbow'],
  'forearm.L': ['left_elbow', 'left_wrist'],
  'hand.L': ['left_wrist'],
  'upper_arm.R': ['right_shoulder', 'right_elbow'],
  'forearm.R': ['right_elbow', 'right_wrist'],
  'hand.R': ['right_wrist'],
  'thigh.L': ['left_hip', 'left_knee'],
  'shin.L': ['left_knee', 'left_ankle'],
  'foot.L': ['left_ankle'],
  'toe.L': ['left_ankle'],
  'thigh.R': ['right_hip', 'right_knee'],
  'shin.R': ['right_knee', 'right_ankle'],
  'foot.R': ['right_ankle'],
  'toe.R': ['right_ankle'],
};


export const PIECE_BONES = {
  'wizard-hat': ['head'],
  'wizard-robe': ['chest', 'spine'],
  crown: ['head'],
  'ice-crown': ['head'],
  'flower-crown': ['head'],
  'dragon-horns': ['head'],
  'ghost-hood': ['head'],
  'space-helmet': ['head'],
  'robot-head': ['head'],
  'pirate-hat': ['head'],
  'shell-tiara': ['head'],
  'hero-mask': ['head'],
  'pirate-coat': ['chest', 'spine'],
  'hero-cape': ['chest', 'spine'],
  'mermaid-tail': ['hips'],
  'princess-gown': ['chest', 'spine'],
  'ghost-sheet': ['chest', 'spine'],
  'frost-cape': ['chest', 'spine'],
  'robot-chest': ['chest', 'spine'],
  'fairy-wings': ['chest'],
  'dragon-wings': ['chest'],
  jetpack: ['chest'],
  'dragon-tail': ['hips'],
  'robot-arms': ['upper_arm.L', 'upper_arm.R', 'forearm.L', 'forearm.R'],
  'robot-legs': ['thigh.L', 'thigh.R', 'shin.L', 'shin.R'],
};

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const Qt = (a) => new THREE.Quaternion(a[0], a[1], a[2], a[3]);

function mid(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: a.z !== undefined && b.z !== undefined ? (a.z + b.z) / 2 : undefined,
    score: Math.min(a.score, b.score),
  };
}

function basis(xAxis, up) {
  const x = xAxis.clone().normalize();
  const y = up
    .clone()
    .sub(x.clone().multiplyScalar(up.dot(x)))
    .normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}



const EAR_SPAN_M = 0.15;
const TRAGION_OF_STATURE = 0.925;
const NOSE_AHEAD_M = 0.1;
const NOSE_BELOW_EAR_M = 0.03;

function earAboveHead(rest) {
  return Math.max(0, TRAGION_OF_STATURE * rest.height - rest.head.head[1]);
}

function pieceVisibility(hiddenBones) {
  const hidden = new Set(hiddenBones);
  return Object.keys(PIECE_BONES).filter((p) => PIECE_BONES[p].every((b) => hidden.has(b)));
}


function solveHeadOnly(pose, rest, statureScale, ok) {
  const LE = pose.left_ear;
  const RE = pose.right_ear;
  if (!ok(LE) || !ok(RE)) return null;
  const spanM = EAR_SPAN_M * statureScale;
  const earPx = Math.hypot(LE.x - RE.x, LE.y - RE.y);
  const nose = pose.nose;
  const mE = mid(LE, RE);
  const ux = (LE.x - RE.x) / earPx;
  const uy = (LE.y - RE.y) / earPx;
  const along = ok(nose) && earPx > 0 ? (nose.x - mE.x) * ux + (nose.y - mE.y) * uy : 0;
  const ppm = Math.hypot(earPx / spanM, along / (NOSE_AHEAD_M * statureScale));
  if (!(ppm > 0) || !Number.isFinite(ppm)) return null;
  const d = new THREE.Vector3((LE.x - RE.x) / ppm, -(LE.y - RE.y) / ppm, 0);
  const zSign = LE.z !== undefined && RE.z !== undefined && Math.abs(LE.z - RE.z) >= 0.02 ? Math.sign(LE.z - RE.z) : 0;
  const s = ok(nose) && Math.abs(along) > 1e-6 ? -Math.sign(along) : zSign;
  d.z = s * Math.sqrt(Math.max(0, spanM * spanM - d.x * d.x - d.y * d.y));
  let head = basis(d, new THREE.Vector3(0, 1, 0)).multiply(Qt(rest.basis.head).invert());
  if (ok(nose)) {
    const x = d.clone().normalize();
    const frame = head.clone().multiply(Qt(rest.basis.head));
    const fwd = V([0, 0, 1]).applyQuaternion(frame);
    const upv = V([0, 1, 0]).applyQuaternion(frame);
    const a = NOSE_AHEAD_M * statureScale;
    const b = -NOSE_BELOW_EAR_M * statureScale;
    const dy = -(nose.y - mE.y) / ppm;
    const A = a * fwd.y + b * upv.y;
    const B = b * fwd.y - a * upv.y;
    const r = Math.hypot(A, B);
    if (r > 1e-9) {
      const base = Math.atan2(B, A);
      const spread = Math.acos(Math.max(-1, Math.min(1, dy / r)));
      const phi = [base + spread, base - spread].reduce((p, q) => (Math.abs(p) < Math.abs(q) ? p : q));
      head = new THREE.Quaternion().setFromAxisAngle(x, phi).multiply(head);
    }
  }
  const rotations = {};
  for (const name of RIG_BONES) {
    const q = name === 'head' ? head : new THREE.Quaternion();
    rotations[name] = [q.x, q.y, q.z, q.w];
  }
  const up = V(rest.dir.head).applyQuaternion(head);
  const ear = V(rest.head.head)
    .multiplyScalar(statureScale)
    .add(up.multiplyScalar(earAboveHead(rest) * statureScale));
  const hiddenBones = RIG_BONES.filter((b) => b !== 'head');
  return {
    rotations,
    root: { x: mE.x - ear.x * ppm, y: mE.y + ear.y * ppm, scale: statureScale * ppm },
    hiddenBones,
    hiddenPieces: pieceVisibility(hiddenBones),
  };
}






export function solveRig(pose, rest, opts = {}) {
  const min = opts.minScore ?? 0.5;
  const ok = (j) => seen(j, min);
  const LS = pose.left_shoulder;
  const RS = pose.right_shoulder;
  const statureScale = (opts.statureM ?? DEFAULT_STATURE_M) / rest.height;
  if (!ok(LS) || !ok(RS)) return solveHeadOnly(pose, rest, statureScale, ok);
  const hipsSeen = ok(pose.left_hip) && ok(pose.right_hip);
  const mS = mid(LS, RS);
  let ppmUpper = Math.hypot(LS.x - RS.x, LS.y - RS.y) / (rest.shoulderSpan * statureScale);
  if (!hipsSeen) {
    const face = solveHeadOnly(pose, rest, statureScale, ok);
    if (face) ppmUpper = Math.max(ppmUpper, face.root.scale / statureScale);
  }
  const torsoDown = rest.torso * statureScale * ppmUpper;
  const LH = hipsSeen ? pose.left_hip : { x: LS.x, y: LS.y + torsoDown, score: 0 };
  const RH = hipsSeen ? pose.right_hip : { x: RS.x, y: RS.y + torsoDown, score: 0 };
  const mH = mid(LH, RH);

  
  const torsoM = rest.torso * statureScale;
  const shoulderM = rest.shoulderSpan * statureScale;
  const torsoPx = Math.hypot(mS.x - mH.x, mS.y - mH.y);
  const shoulderPx = Math.hypot(LS.x - RS.x, LS.y - RS.y);
  const ppm = Math.max(torsoPx / torsoM, shoulderPx / shoulderM);
  if (!(ppm > 0) || !Number.isFinite(ppm)) return null;

  const nose = pose.nose;
  const facing = ok(nose) ? Math.sign(nose.x - mS.x) : 0;
  const P = (j) => new THREE.Vector3((j.x - mH.x) / ppm, -(j.y - mH.y) / ppm, 0);
  const seg = (a, b, lenM, sign) => {
    const d = P(b).sub(P(a));
    const s = a.z !== undefined && b.z !== undefined ? THREE.MathUtils.clamp((b.z - a.z) / Z_SIGN_RAMP, -1, 1) : sign;
    d.z = s * Math.sqrt(Math.max(0, lenM * lenM - d.x * d.x - d.y * d.y));
    return d;
  };
  const dir2 = (a, b, restLenM, sign) => seg(a, b, restLenM, sign).normalize();
  const restLen = (bone) => {
    const child = Object.entries(RIG_PARENT).find(([, p]) => p === bone)?.[0];
    if (!child) return 0.1 * statureScale;
    return V(rest.head[child]).distanceTo(V(rest.head[bone])) * statureScale;
  };

  const hiddenBones = new Set();
  for (const name of RIG_BONES) if ((BONE_NEEDS[name] ?? []).some((j) => !ok(pose[j]))) hiddenBones.add(name);

  
  
  
  
  const scales = {};
  const limbScale = {};
  for (const [first, second, joints] of LIMB_CHAINS) {
    let best = 0;
    for (const s of ['L', 'R']) {
      const [a, b, c] = joints[s].map((j) => pose[j]);
      if (!ok(a) || !ok(b) || !ok(c)) continue;
      const seenM = (Math.hypot(b.x - a.x, b.y - a.y) + Math.hypot(c.x - b.x, c.y - b.y)) / ppm;
      best = Math.max(best, seenM / (restLen(`${first}.${s}`) + restLen(`${second}.${s}`)));
    }
    if (!(best > 0)) continue;
    const k = THREE.MathUtils.clamp(best, MIN_LIMB_SCALE, 1);
    for (const s of ['L', 'R']) {
      scales[`${first}.${s}`] = k;
      limbScale[`${first}.${s}`] = k;
      limbScale[`${second}.${s}`] = k;
    }
  }

  const delta = new Map();
  const up = seg(mH, mS, torsoM, 1);
  const pairX = (l, r, spanM) => seg(r, l, spanM, -facing);
  const restHipSpan = V(rest.head['thigh.L']).distanceTo(V(rest.head['thigh.R'])) * statureScale;
  const frames = {
    hips: basis(pairX(LH, RH, restHipSpan), up).multiply(Qt(rest.basis.hips).invert()),
    chest: basis(pairX(LS, RS, shoulderM), up).multiply(Qt(rest.basis.chest).invert()),
  };
  const LE = pose.left_ear;
  const RE = pose.right_ear;
  if (ok(LE) && ok(RE)) {
    const headUp = new THREE.Vector3(0, 1, 0).applyQuaternion(frames.chest);
    frames.head = basis(pairX(LE, RE, EAR_SPAN_M * statureScale), headUp).multiply(Qt(rest.basis.head).invert());
  }
  const headTarget = ok(LE) && ok(RE) ? mid(LE, RE) : ok(nose) ? nose : undefined;

  for (const name of RIG_BONES) {
    const parent = RIG_PARENT[name];
    const parentDelta = parent ? delta.get(parent) : new THREE.Quaternion();
    const frame = frames[name];
    if (frame && !hiddenBones.has(name)) {
      delta.set(name, frame);
      continue;
    }
    let target = null;
    const limb = LIMB[name];
    if (limb && !hiddenBones.has(name)) {
      const a = pose[limb[0]];
      const bj = pose[limb[1]];
      if (ok(a) && ok(bj)) target = dir2(a, bj, restLen(name) * (limbScale[name] ?? 1), 1);
    } else if (name === 'spine') {
      target = up.clone().normalize();
    } else if (name === 'neck' && headTarget && ok(headTarget)) {
      target = dir2(mS, headTarget, restLen('neck') + restLen('head') * 0.5, 1);
    }
    if (!target) {
      delta.set(name, parentDelta.clone());
      continue;
    }
    const current = V(rest.dir[name]).applyQuaternion(parentDelta);
    const swing = new THREE.Quaternion().setFromUnitVectors(current.normalize(), target);
    delta.set(name, swing.multiply(parentDelta));
  }

  const rotations = {};
  for (const name of RIG_BONES) {
    const q = delta.get(name);
    rotations[name] = [q.x, q.y, q.z, q.w];
  }
  const hidden = [...hiddenBones];
  return {
    rotations,
    scales,
    
    root: {
      x: mH.x - rest.midHip[0] * statureScale * ppm,
      y: mH.y + rest.midHip[1] * statureScale * ppm,
      scale: statureScale * ppm,
    },
    hiddenBones: hidden,
    hiddenPieces: pieceVisibility(hidden),
  };
}
