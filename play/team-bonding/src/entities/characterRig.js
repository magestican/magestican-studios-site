








































import * as THREE from 'three';

import {
  HIP_Y, LEG_COUNT, gaitPhase, gaitWeight, legSwing, bodyBounce,
  wingAngle, headBob,
} from '../../../../web-engine/entities/characterRigSpec.js';








const LF = 0, RF = 1, LB = 2, RB = 3;

function limbIndex(x, z, midX, midZ, legs) {
  const left = x < midX;
  if (legs === 2) return left ? LF : RF;
  const front = z < midZ;
  return front ? (left ? LF : RF) : (left ? LB : RB);
}






function splitByHip(mesh, hipY, legs, bounds) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  if (!pos) return null;

  const idx = geo.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const midX = (bounds.min.x + bounds.max.x) / 2;
  const midZ = (bounds.min.z + bounds.max.z) / 2;

  
  const bucket = new Int8Array(triCount);
  let anyLeg = false;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    const cy = (a.y + b.y + c.y) / 3;
    if (cy >= hipY) { bucket[t] = -1; continue; }
    const cx = (a.x + b.x + c.x) / 3;
    const cz = (a.z + b.z + c.z) / 3;
    bucket[t] = limbIndex(cx, cz, midX, midZ, legs);
    anyLeg = true;
  }
  if (!anyLeg) return null;
  return { bucket, triCount, idx, pos, geo };
}






function geometryFromTris(src, keep) {
  const { bucket, triCount, idx, geo } = src;
  const attrs = Object.keys(geo.attributes);
  const out = new THREE.BufferGeometry();
  let n = 0;
  for (let t = 0; t < triCount; t++) if (bucket[t] === keep) n++;
  if (!n) return null;

  for (const name of attrs) {
    const src2 = geo.attributes[name];
    const size = src2.itemSize;
    const arr = new Float32Array(n * 3 * size);
    let w = 0;
    for (let t = 0; t < triCount; t++) {
      if (bucket[t] !== keep) continue;
      for (let k = 0; k < 3; k++) {
        const vi = idx ? idx.getX(t * 3 + k) : t * 3 + k;
        for (let c = 0; c < size; c++) arr[w++] = src2.array[vi * size + c];
      }
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  out.computeBoundingBox();
  return out;
}






export function buildRig(body, kind) {
  if (!body) return null;
  const hipY = HIP_Y[kind];
  const legCount = LEG_COUNT[kind] ?? 4;
  if (!Number.isFinite(hipY)) return null;

  
  
  const meshes = [];
  body.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); });
  if (!meshes.length) return null;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const rigRoot = meshes[0].parent || body;
  const bounds = new THREE.Box3();
  for (const m of meshes) {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    
    
    
    const bb = m.geometry.boundingBox.clone();
    m.updateMatrix();
    bb.applyMatrix4(m.matrix);          
    bounds.union(bb);
  }

  const rig = { kind, hipY, legs: [], wings: [], bodyMeshes: [] };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const legParts = [];      
  const legAccum = [];      
  for (let i = 0; i < legCount; i++) legAccum.push(null);

  for (const mesh of meshes) {
    const matName = (mesh.material && mesh.material.name) || '';

    
    
    
    
    if (matName === 'wing') {
      const wing = splitWings(mesh, bounds, rigRoot);
      if (wing) { rig.wings.push(...wing); continue; }
    }

    const split = splitByHip(mesh, hipY, legCount, bounds);
    if (!split) { rig.bodyMeshes.push(mesh); continue; }

    for (let li = 0; li < legCount; li++) {
      const legGeo = geometryFromTris(split, li);
      if (!legGeo) continue;
      legParts.push({ index: li, geo: legGeo, material: mesh.material,
                      castShadow: mesh.castShadow });
      const bb = legGeo.boundingBox;
      if (!legAccum[li]) legAccum[li] = bb.clone();
      else legAccum[li].union(bb);
    }

    
    const bodyGeo = geometryFromTris(split, -1);
    if (bodyGeo) {
      
      
      
      
      
      
      
      
      mesh.geometry = bodyGeo;
      rig.bodyMeshes.push(mesh);
    } else {
      
      mesh.visible = false;
      mesh.userData.replacedByRig = true;
    }
  }

  
  const pivots = new Map();
  for (let li = 0; li < legCount; li++) {
    const bb = legAccum[li];
    if (!bb) continue;
    const px = (bb.min.x + bb.max.x) / 2;
    const pz = (bb.min.z + bb.max.z) / 2;
    
    
    
    const py = hipY;
    const pivot = new THREE.Group();
    pivot.position.set(px, py, pz);
    rigRoot.add(pivot);
    pivots.set(li, { pivot, px, py, pz });
    rig.legs.push({ pivot, index: li });
  }

  for (const part of legParts) {
    const at = pivots.get(part.index);
    if (!at) continue;
    part.geo.translate(-at.px, -at.py, -at.pz);
    const m = new THREE.Mesh(part.geo, part.material);
    m.castShadow = part.castShadow;
    at.pivot.add(m);
  }

  if (!rig.legs.length && !rig.wings.length) return null;
  
  
  
  
  rig.root = rigRoot;
  rig.baseY = rigRoot.position.y;
  return rig;
}




function splitWings(mesh, bounds, root) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const idx = geo.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const midX = (bounds.min.x + bounds.max.x) / 2;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const halfW = Math.max(1e-6, (bounds.max.x - bounds.min.x) / 2);
  const OUTBOARD = 0.42;                      

  const bucket = new Int8Array(triCount);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let left = 0, right = 0;
  for (let t = 0; t < triCount; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    const cx = (a.x + b.x + c.x) / 3;
    const out = (cx - midX) / halfW;
    if (out <= -OUTBOARD) { bucket[t] = 0; left++; }
    else if (out >= OUTBOARD) { bucket[t] = 1; right++; }
    else bucket[t] = -1;                      
  }
  
  
  
  if (!left || !right) return null;

  const src = { bucket, triCount, idx, pos, geo };
  const out = [];
  
  
  
  const parent = root || mesh.parent;
  for (const side of [0, 1]) {
    const g = geometryFromTris(src, side);
    if (!g) continue;
    const bb = g.boundingBox;
    
    
    
    const px = side === 0 ? bb.max.x : bb.min.x;
    const py = bb.max.y;
    const pz = (bb.min.z + bb.max.z) / 2;
    g.translate(-px, -py, -pz);
    const wingMesh = new THREE.Mesh(g, mesh.material);
    wingMesh.castShadow = mesh.castShadow;
    const pivot = new THREE.Group();
    pivot.position.set(px, py, pz);
    parent.add(pivot);
    out.push({ pivot, side: side === 0 ? -1 : 1 });
  }
  
  
  
  const coverts = geometryFromTris(src, -1);
  if (coverts) {
    
    mesh.geometry = coverts;
  } else {
    mesh.visible = false;
    mesh.userData.replacedByRig = true;
  }
  return out;
}







export function applyRig(rig, { distance = 0, speed = 0, timeSec = 0, airborne = false } = {}) {
  if (!rig) return;
  const w = gaitWeight(speed);
  const phase = gaitPhase(distance, rig.kind);

  for (const leg of rig.legs) {
    leg.pivot.rotation.x = legSwing(phase, leg.index, rig.kind, w);
  }

  for (const wing of rig.wings) {
    
    
    
    const ang = wingAngle(timeSec, speed, airborne, wing.side < 0 ? 0 : 0);
    wing.pivot.rotation.z = ang * wing.side;
  }

  
  
  
  
  
  if (rig.root) {
    rig.root.position.y = rig.baseY + bodyBounce(phase, rig.kind, w);
    rig.root.rotation.x = headBob(phase, rig.kind, w) * 0.35;
  }
}
