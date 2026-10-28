



import { THREE } from '../vendor/three-vendor.js';

export const RIG_BONES = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'shoulder.L',
  'upper_arm.L',
  'forearm.L',
  'hand.L',
  'shoulder.R',
  'upper_arm.R',
  'forearm.R',
  'hand.R',
  'thigh.L',
  'shin.L',
  'foot.L',
  'toe.L',
  'thigh.R',
  'shin.R',
  'foot.R',
  'toe.R',
];


export const RIG_PARENT = {
  hips: null,
  spine: 'hips',
  chest: 'spine',
  neck: 'chest',
  head: 'neck',
  'shoulder.L': 'chest',
  'upper_arm.L': 'shoulder.L',
  'forearm.L': 'upper_arm.L',
  'hand.L': 'forearm.L',
  'shoulder.R': 'chest',
  'upper_arm.R': 'shoulder.R',
  'forearm.R': 'upper_arm.R',
  'hand.R': 'forearm.R',
  'thigh.L': 'hips',
  'shin.L': 'thigh.L',
  'foot.L': 'shin.L',
  'toe.L': 'foot.L',
  'thigh.R': 'hips',
  'shin.R': 'thigh.R',
  'foot.R': 'shin.R',
  'toe.R': 'foot.R',
};


const TAIL_BONE = {
  hips: 'spine',
  spine: 'chest',
  chest: 'neck',
  neck: 'head',
  'shoulder.L': 'upper_arm.L',
  'upper_arm.L': 'forearm.L',
  'forearm.L': 'hand.L',
  'shoulder.R': 'upper_arm.R',
  'upper_arm.R': 'forearm.R',
  'forearm.R': 'hand.R',
  'thigh.L': 'shin.L',
  'shin.L': 'foot.L',
  'foot.L': 'toe.L',
  'thigh.R': 'shin.R',
  'shin.R': 'foot.R',
  'foot.R': 'toe.R',
};



const NAMES = new Map(
  RIG_BONES.flatMap((b) => [
    [b, b],
    [THREE.PropertyBinding.sanitizeNodeName(b), b],
  ]),
);


export function rigBoneName(nodeName) {
  return NAMES.get(nodeName) ?? null;
}


export function findRigBones(root) {
  const out = new Map();
  root.traverse((o) => {
    const name = rigBoneName(o.name);
    if (name && !out.has(name)) out.set(name, o);
  });
  return out;
}

export function hasFullRig(root) {
  return findRigBones(root).size === RIG_BONES.length;
}


function meshHeight(root) {
  const box = new THREE.Box3();
  const rootInv = root.matrixWorld.clone().invert();
  root.traverse((n) => {
    if (!n.isMesh || !n.geometry) return;
    if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
    box.union(n.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(rootInv, n.matrixWorld)));
  });
  const h = box.isEmpty() ? 0 : box.max.y - box.min.y;
  return h > 0.5 ? h : null;
}

const v3 = (v) => [v.x, v.y, v.z];
const q4 = (q) => [q.x, q.y, q.z, q.w];
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);


export function basisQuaternion(xAxis, up) {
  const x = xAxis.clone().normalize();
  const y = up
    .clone()
    .sub(x.clone().multiplyScalar(up.dot(x)))
    .normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}





export function captureRest(root) {
  root.updateMatrixWorld(true);
  const bones = findRigBones(root);
  if (bones.size !== RIG_BONES.length) {
    throw new Error(`rig is missing bones: ${RIG_BONES.filter((b) => !bones.has(b)).join(', ')}`);
  }
  const rootInv = root.matrixWorld.clone().invert();
  const inRig = (o) => new THREE.Matrix4().multiplyMatrices(rootInv, o.matrixWorld);
  const head = {};
  const restWorld = new Map();
  const restLocal = new Map();
  const pos = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  for (const name of RIG_BONES) {
    const b = bones.get(name);
    inRig(b).decompose(pos, q, sc);
    head[name] = v3(pos);
    restWorld.set(name, q.clone());
    restLocal.set(name, b.quaternion.clone());
  }
  const hipsParent = bones.get('hips').parent;
  const rootParentWorld = new THREE.Quaternion();
  if (hipsParent && hipsParent !== root) inRig(hipsParent).decompose(pos, rootParentWorld, sc);
  const dir = {};
  for (const name of RIG_BONES) {
    const tail = TAIL_BONE[name];
    const d = tail ? V(head[tail]).sub(V(head[name])) : V(dir[RIG_PARENT[name]]);
    dir[name] = v3(d.normalize());
  }
  const midHip = V(head['thigh.L']).add(V(head['thigh.R'])).multiplyScalar(0.5);
  const midShoulder = V(head['upper_arm.L']).add(V(head['upper_arm.R'])).multiplyScalar(0.5);
  const up = midShoulder.clone().sub(midHip);
  const hipsB = basisQuaternion(V(head['thigh.L']).sub(V(head['thigh.R'])), up);
  const chestB = basisQuaternion(V(head['upper_arm.L']).sub(V(head['upper_arm.R'])), up);
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const name of RIG_BONES) {
    minY = Math.min(minY, head[name][1]);
    maxY = Math.max(maxY, head[name][1]);
  }
  const headLen = V(head.head).distanceTo(V(head.neck));
  return {
    root,
    bones,
    restWorld,
    restLocal,
    rootParentWorld,
    info: {
      head,
      dir,
      basis: { hips: q4(hipsB), chest: q4(chestB), head: q4(chestB.clone()) },
      torso: up.length(),
      shoulderSpan: V(head['upper_arm.L']).distanceTo(V(head['upper_arm.R'])),
      
      height: meshHeight(root) ?? maxY - minY + headLen * 2.4 + 0.02,
      midHip: v3(midHip),
    },
  };
}


export function applyRigPose(rest, rotations, scales = {}) {
  
  
  for (const name of RIG_BONES) rest.bones.get(name).scale.setScalar(scales[name] ?? 1);
  const posedWorld = new Map();
  const delta = new Map();
  for (const name of RIG_BONES) {
    const parent = RIG_PARENT[name];
    const r = rotations[name];
    const d = r ? new THREE.Quaternion(r[0], r[1], r[2], r[3]).normalize() : parent ? delta.get(parent).clone() : new THREE.Quaternion();
    delta.set(name, d);
    const world = d.clone().multiply(rest.restWorld.get(name));
    posedWorld.set(name, world);
    const parentWorld = parent ? posedWorld.get(parent) : rest.rootParentWorld;
    rest.bones.get(name).quaternion.copy(parentWorld.clone().invert().multiply(world));
  }
}

export function resetRigPose(rest) {
  for (const name of RIG_BONES) {
    rest.bones.get(name).quaternion.copy(rest.restLocal.get(name));
    rest.bones.get(name).scale.setScalar(1);
  }
}


export function bindSkinnedToRig(piece, bones) {
  let bound = 0;
  piece.traverse((o) => {
    if (!o.isSkinnedMesh || !o.skeleton) return;
    const mapped = o.skeleton.bones.map((bn) => {
      const name = rigBoneName(bn.name);
      return name ? bones.get(name) : undefined;
    });
    if (mapped.some((m) => !m?.isBone)) return;
    o.bind(new THREE.Skeleton(mapped, o.skeleton.boneInverses), o.bindMatrix);
    bound++;
  });
  return bound;
}
