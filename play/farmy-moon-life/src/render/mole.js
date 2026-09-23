





















import * as THREE from 'three';
import { generate, generateMound } from 'moon/art/mole.mjs';
import { MOLE, trailMounds } from 'moon/play/mole.mjs';
import { cozyMaterial } from './material.js';
import { toObject3D } from './toMesh.js';






export const SINK_M = 0.82;
export const RISE_M = 0.52;

export const MOUND_SQUASH = 0.42;

function geometryOf(arrays) {
  const g = arrays.groups[0];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(g.color, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(g.index, 1));
  geometry.computeBoundingSphere();
  return geometry;
}








export async function createMoleDraw({ scene, season = 'summer', seed = 1, heightAt = () => 0, onProblems = () => {} }) {
  const group = new THREE.Group();
  group.name = 'mole';
  scene.add(group);

  const problems = [];
  const moleData = generate({ seed, season, lod: 0 });
  problems.push(...moleData.validate());
  const liveData = generateMound({ seed, season, lod: 1, widthM: MOLE.moundM, heightM: MOLE.moundH });
  problems.push(...liveData.validate());
  const trailData = generateMound({ seed: seed + 1, season, lod: 2, widthM: MOLE.trailMoundM, heightM: MOLE.trailMoundH });
  problems.push(...trailData.validate());
  if (problems.length) onProblems(problems.map((p) => `mole: ${p}`));

  const body = await toObject3D(moleData);
  body.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  body.visible = false;
  group.add(body);
  const faceMeshes = [];
  body.traverse((o) => { if (o.isMesh && o.morphTargetInfluences) faceMeshes.push(o); });

  const liveMound = await toObject3D(liveData);
  liveMound.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  group.add(liveMound);

  const capacity = trailMounds() + 2;
  const trailMesh = new THREE.InstancedMesh(geometryOf(trailData.toArrays()), await cozyMaterial('soil'), capacity);
  trailMesh.name = 'mole-trail';
  trailMesh.count = 0;
  trailMesh.frustumCulled = false;
  
  
  
  trailMesh.castShadow = false;
  trailMesh.receiveShadow = true;
  trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(trailMesh);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const stats = {
    ready: true, seed, triangles: moleData.triangleCount + liveData.triangleCount + trailData.triangleCount,
    x: 0, z: 0, up: 0, still: 0, travelled: 0, mounds: 0, surfaced: false,
  };

  



  function update(view, { look = null, face = null } = {}) {
    if (!view) return;
    
    if (face && view.up > 0.001) for (const mesh of faceMeshes) face.forEach((v, i) => { mesh.morphTargetInfluences[i] = v; });
    const groundY = heightAt(view.x, view.z);

    
    liveMound.position.set(view.x, groundY, view.z);
    liveMound.rotation.y = view.heading * 0.7;
    const squash = 1 - MOUND_SQUASH * view.up;
    
    
    liveMound.scale.set(1 + 0.35 * view.up, squash, 1 + 0.35 * view.up);

    
    body.visible = view.up > 0.001;
    if (body.visible) {
      body.position.set(view.x, groundY - SINK_M + RISE_M * view.up, view.z);
      
      const toward = look ? Math.atan2(look.x - view.x, look.z - view.z) : view.heading;
      body.rotation.y = toward;
    }

    
    const n = Math.min(view.mounds.length, capacity);
    for (let i = 0; i < n; i++) {
      const mound = view.mounds[i];
      const rise = mound.rise;
      pos.set(mound.x, heightAt(mound.x, mound.z) - MOLE.trailMoundH * (1 - rise) * 0.6, mound.z);
      
      q.setFromAxisAngle(up, i * 2.39996);
      
      scale.set(0.82 + 0.18 * rise, Math.max(0.04, rise), 0.82 + 0.18 * rise);
      trailMesh.setMatrixAt(i, m.compose(pos, q, scale));
    }
    trailMesh.count = n;
    trailMesh.instanceMatrix.needsUpdate = true;

    stats.x = view.x;
    stats.z = view.z;
    stats.up = view.up;
    stats.still = view.still;
    stats.travelled = view.travelled;
    stats.mounds = n;
    stats.surfaced = view.up > 0.5;
  }

  return {
    group,
    body,
    update,
    get stats() { return { ...stats }; },
    get triangles() { return stats.triangles; },
    dispose() { scene.remove(group); },
  };
}
