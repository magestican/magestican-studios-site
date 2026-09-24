




















import * as THREE from 'three';
import { cozyMaterial, curveUniforms } from './material.js';
import { cullPad } from 'moon/world/curve.mjs';
import { NO_SHADOW_MATERIALS } from 'moon/mesh/meshData.mjs';
import { boneAxes } from 'moon/rig/skeleton.mjs';
import { MORPH_NAMES } from 'moon/rig/face.mjs';


const POSE_MARGIN = 0.35;


export const PARTS_WHOLE_MAX_TRIS = 40000;





export async function toObject3D(meshData, { materials = {}, castShadow = true, receiveShadow = true, parts = true } = {}) {
  const baked = !parts && meshData.movingParts && meshData.movingParts.length;
  const arrays = (baked ? meshData.bakeParts() : meshData).toArrays();
  const group = new THREE.Group();
  group.name = arrays.name;
  const rig = meshData.rig && arrays.groups.length && arrays.groups.every((g) => g.skinIndex && g.skinWeight) ? buildRig(meshData.rig) : null;
  if (rig) {
    group.add(...rig.roots);
    group.userData.rig = rig;
  }
  
  
  
  
  
  
  const whole = Boolean(arrays.movingParts && arrays.movingParts.length && !meshData.rig
    && !Object.keys(arrays.morphs || {}).length && arrays.triangles <= PARTS_WHOLE_MAX_TRIS);
  for (const g of whole ? [] : arrays.groups) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(g.color, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
    if (g.sway) geometry.setAttribute('fmlSway', new THREE.BufferAttribute(g.sway, 1)); 
    if (g.ripple) geometry.setAttribute('fmlRipple', new THREE.BufferAttribute(g.ripple, 1)); 
    
    
    
    
    
    const hasMorph = Object.values(arrays.morphs).some((m) => m.group === g.material);
    if (hasMorph) {
      
      
      
      
      
      geometry.morphTargetsRelative = true;
      geometry.morphAttributes.position = MORPH_NAMES.map((n) => {
        const m = arrays.morphs[n];
        const deltas = m && m.group === g.material ? m.deltas : new Float32Array(g.position.length);
        return new THREE.BufferAttribute(deltas, 3);
      });
      
      
      
      if (MORPH_NAMES.some((n) => arrays.morphs[n]?.group === g.material && arrays.morphs[n].colorDeltas)) {
        geometry.morphAttributes.color = MORPH_NAMES.map((n) => {
          const m = arrays.morphs[n];
          return new THREE.BufferAttribute(m && m.group === g.material && m.colorDeltas ? m.colorDeltas : new Float32Array(g.position.length), 3);
        });
      }
    }
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
    if (hasMorph) mesh.morphTargetInfluences = new Array(MORPH_NAMES.length).fill(0);
    if (material.userData.depthMaterial) mesh.customDepthMaterial = material.userData.depthMaterial;
    mesh.name = `${arrays.name}/${g.material}`;
    
    
    
    mesh.castShadow = castShadow && !NO_SHADOW_MATERIALS.includes(g.material);
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);
  }
  
  
  
  
  
  const partObjects = [];
  if (arrays.movingParts && arrays.movingParts.length) {
    const child = await toObject3D(partsRig(arrays, whole), { materials, castShadow, receiveShadow });
    const { bones, skeleton } = child.userData.rig;
    bones.slice(whole ? 1 : 0).forEach((b, i) => {
      const p = arrays.movingParts[i];
      b.userData.part = { name: p.name, axis: p.axis, clip: p.clip };
      partObjects.push(b);
    });
    
    
    delete child.userData.rig;
    
    
    
    
    const inverses = skeleton.boneInverses;
    child.clone = function cloneParts(recursive = true) {
      const c = THREE.Group.prototype.clone.call(this, recursive);
      const own = new THREE.Skeleton(c.children.filter((o) => o.isBone), inverses.map((m) => m.clone()));
      c.traverse((o) => { if (o.isSkinnedMesh) o.bind(own, new THREE.Matrix4()); });
      c.clone = cloneParts;
      return c;
    };
    group.add(child);
  }
  
  Object.defineProperty(group.userData, 'parts', { value: partObjects, enumerable: false, configurable: true, writable: true });
  group.userData.triangles = arrays.triangles;
  return group;
}





function partsRig(arrays, whole = false) {
  
  const pieces = whole ? [{ name: 'static', pivot: [0, 0, 0], groups: arrays.groups }, ...arrays.movingParts] : arrays.movingParts;
  const byMat = new Map();
  pieces.forEach((p, bone) => {
    for (const g of p.groups) {
      if (!byMat.has(g.material)) byMat.set(g.material, []);
      byMat.get(g.material).push({ g, bone, pivot: p.pivot });
    }
  });
  const groups = [];
  for (const [material, list] of byMat) {
    const nv = list.reduce((s, e) => s + e.g.position.length / 3, 0);
    const ni = list.reduce((s, e) => s + e.g.index.length, 0);
    const sway = list.some((e) => e.g.sway);
    const ripple = list.some((e) => e.g.ripple);
    const out = {
      material, position: new Float32Array(nv * 3), normal: new Float32Array(nv * 3), color: new Float32Array(nv * 3),
      uv: new Float32Array(nv * 2), index: new Uint32Array(ni), skinIndex: new Uint16Array(nv * 4), skinWeight: new Float32Array(nv * 4),
      ...(sway ? { sway: new Float32Array(nv) } : {}),
      ...(ripple ? { ripple: new Float32Array(nv) } : {}),
    };
    let v = 0, i = 0;
    for (const { g, bone, pivot } of list) {
      const n = g.position.length / 3;
      for (let k = 0; k < n; k++) {
        for (let c = 0; c < 3; c++) out.position[(v + k) * 3 + c] = g.position[k * 3 + c] + pivot[c];
        out.skinIndex[(v + k) * 4] = bone;
        out.skinWeight[(v + k) * 4] = 1;
      }
      out.normal.set(g.normal, v * 3);
      out.color.set(g.color, v * 3);
      out.uv.set(g.uv, v * 2);
      if (sway && g.sway) out.sway.set(g.sway, v);
      if (ripple && g.ripple) out.ripple.set(g.ripple, v);
      for (let k = 0; k < g.index.length; k++) out.index[i + k] = g.index[k] + v;
      v += n; i += g.index.length;
    }
    groups.push(out);
  }
  const name = `${arrays.name}:parts`;
  const rig = { bones: pieces.map((p) => ({ name: p.name, parent: -1, head: p.pivot })) };
  const triangles = whole ? arrays.triangles : arrays.movingParts.reduce((s, p) => s + p.triangles, 0);
  return { name, rig, toArrays: () => ({ name, triangles, groups, morphs: {} }) };
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
