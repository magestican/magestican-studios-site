





















import { mat3FromQuat, transformPoint } from './math.mjs';

export const MAX_BONES = 32;


export const BIPED = Object.freeze([
  ['root', null],
  ['hips', 'root'],
  ['spine', 'hips'],
  ['chest', 'spine'],
  ['neck', 'chest'],
  ['head', 'neck'],
  ['earL', 'head'],
  ['earR', 'head'],
  ['armUpperL', 'chest'],
  ['armLowerL', 'armUpperL'],
  ['handL', 'armLowerL'],
  ['armUpperR', 'chest'],
  ['armLowerR', 'armUpperR'],
  ['handR', 'armLowerR'],
  ['legUpperL', 'hips'],
  ['legLowerL', 'legUpperL'],
  ['footL', 'legLowerL'],
  ['legUpperR', 'hips'],
  ['legLowerR', 'legUpperR'],
  ['footR', 'legLowerR'],
  ['tail1', 'hips'],
  ['tail2', 'tail1'],
  ['tail3', 'tail2'],
].map(Object.freeze));




const L = (x, y, z) => Object.freeze({ x, y, z });
const EAR = L([-0.9, 0.9], [-0.7, 0.7], [-0.9, 0.9]);
const TAIL = L([-1.0, 1.0], [-1.0, 1.0], [-1.0, 1.0]);
export const JOINT_LIMITS = Object.freeze({
  root: L([-1e-6, 1e-6], [-1e-6, 1e-6], [-1e-6, 1e-6]),
  hips: L([-0.5, 0.6], [-0.5, 0.5], [-0.35, 0.35]),
  spine: L([-0.4, 0.8], [-0.5, 0.5], [-0.35, 0.35]),
  chest: L([-0.4, 0.7], [-0.5, 0.5], [-0.35, 0.35]),
  neck: L([-0.5, 0.6], [-0.6, 0.6], [-0.4, 0.4]),
  head: L([-0.6, 0.6], [-0.8, 0.8], [-0.5, 0.5]),
  earL: EAR,
  earR: EAR,
  
  
  armUpperL: L([-2.0, 1.0], [-1.7, 1.7], [-1.2, 1.6]),
  armLowerL: L([-2.4, 0.05], [-0.7, 0.7], [-0.4, 0.4]),
  handL: L([-1.0, 1.0], [-0.8, 0.8], [-0.7, 0.7]),
  armUpperR: L([-2.0, 1.0], [-1.7, 1.7], [-1.6, 1.2]),
  armLowerR: L([-2.4, 0.05], [-0.7, 0.7], [-0.4, 0.4]),
  handR: L([-1.0, 1.0], [-0.8, 0.8], [-0.7, 0.7]),
  legUpperL: L([-1.7, 0.9], [-0.6, 0.6], [-0.4, 0.6]),
  legLowerL: L([-0.05, 2.5], [-0.35, 0.35], [-0.35, 0.35]),
  
  
  footL: L([-1.4, 1.1], [-0.7, 0.7], [-0.45, 0.45]),
  legUpperR: L([-1.7, 0.9], [-0.6, 0.6], [-0.6, 0.4]),
  legLowerR: L([-0.05, 2.5], [-0.35, 0.35], [-0.35, 0.35]),
  footR: L([-1.4, 1.1], [-0.7, 0.7], [-0.45, 0.45]),
  tail1: TAIL,
  tail2: TAIL,
  tail3: TAIL,
  
  
  
  neck2: L([-0.35, 0.35], [-0.3, 0.3], [-0.25, 0.25]),
  neck3: L([-0.35, 0.35], [-0.3, 0.3], [-0.25, 0.25]),
  trunk1: L([-0.7, 0.7], [-0.6, 0.6], [-0.6, 0.6]),
  trunk2: L([-0.8, 0.8], [-0.7, 0.7], [-0.7, 0.7]),
  trunk3: L([-0.9, 0.9], [-0.8, 0.8], [-0.8, 0.8]),
  
  
  
  
  thumbL: L([-0.3, 1.3], [-0.5, 0.5], [-0.6, 0.3]),
  indexL: L([-0.3, 0.3], [-0.3, 0.3], [-1.7, 0.25]),
  middleL: L([-0.3, 0.3], [-0.3, 0.3], [-1.7, 0.25]),
  ringL: L([-0.3, 0.3], [-0.3, 0.3], [-1.7, 0.25]),
  thumbR: L([-0.3, 1.3], [-0.5, 0.5], [-0.3, 0.6]),
  indexR: L([-0.3, 0.3], [-0.3, 0.3], [-0.25, 1.7]),
  middleR: L([-0.3, 0.3], [-0.3, 0.3], [-0.25, 1.7]),
  ringR: L([-0.3, 0.3], [-0.3, 0.3], [-0.25, 1.7]),
});








export function createSkeleton(joints, tails = {}, { extra = [], reparent = {} } = {}) {
  const spec = [...BIPED.map(([name, parent]) => [name, reparent[name] ?? parent]), ...extra];
  for (const [name, to] of Object.entries(reparent)) {
    if (!BIPED.some(([n]) => n === name) || !extra.some(([n]) => n === to)) throw new Error(`skeleton: reparent ${name} -> ${to} must thread a BIPED bone onto an added one`);
  }
  for (const [name] of extra) {
    if (BIPED.some(([n]) => n === name)) throw new Error(`skeleton: added bone ${name} is already a BIPED bone`);
    if (!JOINT_LIMITS[name]) throw new Error(`skeleton: added bone ${name} has no JOINT_LIMITS`);
  }
  const index = new Map();
  const bones = [];
  let pending = spec;
  while (pending.length) {
    const next = [];
    for (const [name, parent] of pending) {
      if (parent !== null && !index.has(parent)) { next.push([name, parent]); continue; }
      const head = joints[name];
      if (!head || head.length !== 3 || !head.every(Number.isFinite)) throw new Error(`skeleton: no joint for ${name}`);
      const bone = { name, parent: parent === null ? -1 : index.get(parent), head: [head[0], head[1], head[2]] };
      if (tails[name]) bone.tail = [tails[name][0], tails[name][1], tails[name][2]];
      index.set(name, bones.length);
      bones.push(bone);
    }
    if (next.length === pending.length) throw new Error(`skeleton: no parent for ${next.map(([n, p]) => `${n} (${p})`).join(', ')}`);
    pending = next;
  }
  return { bones };
}





export function kneeBetween(hip, ankle, forward, at = 0.5) {
  const d = [ankle[0] - hip[0], ankle[1] - hip[1], ankle[2] - hip[2]];
  const l = Math.hypot(d[0], d[1], d[2]);
  const u = [d[0] / l, d[1] / l, d[2] / l];
  const n = [-u[2] * u[0], -u[2] * u[1], 1 - u[2] * u[2]];
  const nl = Math.hypot(n[0], n[1], n[2]);
  return [0, 1, 2].map((k) => hip[k] + d[k] * at + (n[k] / nl) * forward);
}

const indexCache = new WeakMap();
export function boneIndex(skeleton, name) {
  let map = indexCache.get(skeleton.bones);
  if (!map) {
    map = new Map(skeleton.bones.map((b, i) => [b.name, i]));
    indexCache.set(skeleton.bones, map);
  }
  const i = map.get(name);
  if (i === undefined) throw new Error(`skeleton: no bone '${name}'`);
  return i;
}






export function createPose(skeleton) {
  const n = skeleton.bones.length;
  const q = new Float64Array(n * 4);
  for (let i = 0; i < n; i++) q[i * 4 + 3] = 1;
  return { q, t: new Float64Array(n * 3), s: new Float64Array(n).fill(1) };
}

export function copyPose(src, dst) {
  dst.q.set(src.q);
  dst.t.set(src.t);
  if (src.s && dst.s) dst.s.set(src.s);
  return dst;
}




const axisCache = new WeakMap();
export function boneAxes(skeleton) {
  let axes = axisCache.get(skeleton.bones);
  if (axes) return axes;
  const bones = skeleton.bones;
  axes = bones.map((b, i) => {
    const child = bones.find((c) => c.parent === i);
    const end = b.tail || (child && child.head);
    if (!end) return null;
    const d = [end[0] - b.head[0], end[1] - b.head[1], end[2] - b.head[2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    return l > 1e-9 ? [d[0] / l, d[1] / l, d[2] / l] : null;
  });
  axisCache.set(bones, axes);
  return axes;
}

const ZERO = Object.freeze([0, 0, 0]);



export function forwardKinematics(skeleton, pose, out = null) {
  const bones = skeleton.bones;
  const n = bones.length;
  const world = out ? out.world : new Float64Array(n * 12);
  const joints = out ? out.joints : new Float64Array(n * 3);
  const R = new Array(9);
  const S = pose.s || null;
  const axes = S ? boneAxes(skeleton) : null;
  for (let i = 0; i < n; i++) {
    const b = bones[i];
    mat3FromQuat(pose.q, i * 4, R);
    const ph = b.parent >= 0 ? bones[b.parent].head : ZERO;
    let ox = b.head[0] - ph[0], oy = b.head[1] - ph[1], oz = b.head[2] - ph[2];
    
    if (S && b.parent >= 0 && S[b.parent] !== 1 && axes[b.parent]) {
      const d = axes[b.parent];
      const k = (S[b.parent] - 1) * (d[0] * ox + d[1] * oy + d[2] * oz);
      ox += k * d[0]; oy += k * d[1]; oz += k * d[2];
    }
    const lx = ox + pose.t[i * 3];
    const ly = oy + pose.t[i * 3 + 1];
    const lz = oz + pose.t[i * 3 + 2];
    const o = i * 12;
    if (b.parent < 0) {
      for (let r = 0; r < 3; r++) {
        world[o + r * 4] = R[r * 3]; world[o + r * 4 + 1] = R[r * 3 + 1]; world[o + r * 4 + 2] = R[r * 3 + 2];
      }
      world[o + 3] = lx; world[o + 7] = ly; world[o + 11] = lz;
    } else {
      const p = b.parent * 12;
      for (let r = 0; r < 3; r++) {
        const a0 = world[p + r * 4], a1 = world[p + r * 4 + 1], a2 = world[p + r * 4 + 2];
        world[o + r * 4] = a0 * R[0] + a1 * R[3] + a2 * R[6];
        world[o + r * 4 + 1] = a0 * R[1] + a1 * R[4] + a2 * R[7];
        world[o + r * 4 + 2] = a0 * R[2] + a1 * R[5] + a2 * R[8];
        world[o + r * 4 + 3] = a0 * lx + a1 * ly + a2 * lz + world[p + r * 4 + 3];
      }
    }
    joints[i * 3] = world[o + 3]; joints[i * 3 + 1] = world[o + 7]; joints[i * 3 + 2] = world[o + 11];
  }
  
  return { world, joints, scale: S };
}




export function skinMatrices(skeleton, fk, out = null) {
  const n = skeleton.bones.length;
  const m = out || new Float64Array(n * 12);
  const S = fk.scale || null;
  const axes = S ? boneAxes(skeleton) : null;
  for (let i = 0; i < n; i++) {
    const o = i * 12;
    const [hx, hy, hz] = skeleton.bones[i].head;
    const d = S && S[i] !== 1 ? axes[i] : null;
    for (let r = 0; r < 3; r++) {
      let a0 = fk.world[o + r * 4], a1 = fk.world[o + r * 4 + 1], a2 = fk.world[o + r * 4 + 2];
      if (d) {
        
        const k = (S[i] - 1) * (a0 * d[0] + a1 * d[1] + a2 * d[2]);
        a0 += k * d[0]; a1 += k * d[1]; a2 += k * d[2];
      }
      m[o + r * 4] = a0; m[o + r * 4 + 1] = a1; m[o + r * 4 + 2] = a2;
      m[o + r * 4 + 3] = fk.world[o + r * 4 + 3] - (a0 * hx + a1 * hy + a2 * hz);
    }
  }
  return m;
}

export function jointPosition(fk, i) {
  return [fk.joints[i * 3], fk.joints[i * 3 + 1], fk.joints[i * 3 + 2]];
}


export function carriedPoint(skeleton, fk, i, restPoint) {
  const [hx, hy, hz] = skeleton.bones[i].head;
  return transformPoint(fk.world, i * 12, [restPoint[0] - hx, restPoint[1] - hy, restPoint[2] - hz]);
}
