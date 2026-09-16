




















import * as THREE from 'three';
import { cozyMaterial, curveUniforms } from './material.js';
import { cullPad } from 'moon/world/curve.mjs';
import { boneAxes } from 'moon/rig/skeleton.mjs';


const POSE_MARGIN = 0.35;

export async function toObject3D(meshData, { materials = {}, castShadow = true, receiveShadow = true } = {}) {
  const arrays = meshData.toArrays();
  const group = new THREE.Group();
  group.name = arrays.name;
  const rig = meshData.rig && arrays.groups.length && arrays.groups.every((g) => g.skinIndex && g.skinWeight) ? buildRig(meshData.rig) : null;
  if (rig) {
    group.add(...rig.roots);
    group.userData.rig = rig;
  }
  for (const g of arrays.groups) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(g.color, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
    if (rig) {
      geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(g.skinIndex, 4));
      geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(g.skinWeight, 4));
    }
    geometry.setIndex(new THREE.BufferAttribute(g.index, 1));
    geometry.computeBoundingSphere();
    geometry.boundingSphere.radius += cullPad(geometry.boundingSphere.radius + 60, curveUniforms.uCurve.value);
    const material = await (materials[g.material] || cozyMaterial(g.material));
    let mesh;
    if (rig) {
      mesh = new THREE.SkinnedMesh(geometry, material);
      mesh.bind(rig.skeleton, new THREE.Matrix4());
      mesh.boundingSphere = geometry.boundingSphere.clone();
      mesh.boundingSphere.radius += POSE_MARGIN;
      geometry.computeBoundingBox();
      mesh.boundingBox = geometry.boundingBox.clone(); 
    } else {
      mesh = new THREE.Mesh(geometry, material);
    }
    if (material.userData.depthMaterial) mesh.customDepthMaterial = material.userData.depthMaterial;
    mesh.name = `${arrays.name}/${g.material}`;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);
  }
  group.userData.triangles = arrays.triangles;
  return group;
}


function buildRig(rig) {
  const bones = rig.bones.map((b) => Object.assign(new THREE.Bone(), { name: b.name }));
  const rest = new Float64Array(rig.bones.length * 3);
  const roots = [];
  rig.bones.forEach((b, i) => {
    const p = b.parent >= 0 ? rig.bones[b.parent].head : [0, 0, 0];
    for (let k = 0; k < 3; k++) rest[i * 3 + k] = b.head[k] - p[k];
    bones[i].position.set(rest[i * 3], rest[i * 3 + 1], rest[i * 3 + 2]);
    if (b.parent >= 0) bones[b.parent].add(bones[i]);
    else roots.push(bones[i]);
  });
  const inverses = rig.bones.map((b) => new THREE.Matrix4().makeTranslation(-b.head[0], -b.head[1], -b.head[2]));
  return { bones, skeleton: new THREE.Skeleton(bones, inverses), roots, rest, axes: boneAxes(rig), parents: rig.bones.map((b) => b.parent), manual: false };
}











const stretchM = new THREE.Matrix4(), local = new THREE.Matrix4(), quat = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
function setStretch(m, d, s) {
  const k = s - 1;
  m.set(
    1 + k * d[0] * d[0], k * d[0] * d[1], k * d[0] * d[2], 0,
    k * d[1] * d[0], 1 + k * d[1] * d[1], k * d[1] * d[2], 0,
    k * d[2] * d[0], k * d[2] * d[1], 1 + k * d[2] * d[2], 0,
    0, 0, 0, 1,
  );
  return m;
}
export function applyPose(rig, pose) {
  const s = pose.s;
  if (!rig.manual && !(s && s.some((v) => v !== 1))) {
    for (let i = 0; i < rig.bones.length; i++) {
      const bone = rig.bones[i];
      bone.position.set(rig.rest[i * 3] + pose.t[i * 3], rig.rest[i * 3 + 1] + pose.t[i * 3 + 1], rig.rest[i * 3 + 2] + pose.t[i * 3 + 2]);
      bone.quaternion.set(pose.q[i * 4], pose.q[i * 4 + 1], pose.q[i * 4 + 2], pose.q[i * 4 + 3]);
    }
    return;
  }
  rig.manual = true;
  for (let i = 0; i < rig.bones.length; i++) {
    const bone = rig.bones[i];
    bone.matrixAutoUpdate = false;
    const p = rig.parents[i];
    const sp = p >= 0 && s ? s[p] : 1;
    const dp = p >= 0 ? rig.axes[p] : null;
    let ox = rig.rest[i * 3], oy = rig.rest[i * 3 + 1], oz = rig.rest[i * 3 + 2];
    if (sp !== 1 && dp) {
      const k = (sp - 1) * (dp[0] * ox + dp[1] * oy + dp[2] * oz);
      ox += k * dp[0]; oy += k * dp[1]; oz += k * dp[2];
    }
    pos.set(ox + pose.t[i * 3], oy + pose.t[i * 3 + 1], oz + pose.t[i * 3 + 2]);
    quat.set(pose.q[i * 4], pose.q[i * 4 + 1], pose.q[i * 4 + 2], pose.q[i * 4 + 3]);
    local.compose(pos, quat, one);
    const si = s ? s[i] : 1;
    if (si !== 1 && rig.axes[i]) local.multiply(setStretch(stretchM, rig.axes[i], si));
    if (sp !== 1 && dp) local.premultiply(setStretch(stretchM, dp, 1 / sp));
    bone.matrix.copy(local);
    bone.matrixWorldNeedsUpdate = true;
  }
}
