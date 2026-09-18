



















import * as THREE from 'three';
import { parts, BIRD_HEIGHT_M } from 'moon/art/bird.mjs';
import { BIRD, createFlock, setBirdMax, stepBirds, birdPose, flockStats, perchKey } from 'moon/play/birds.mjs';
import { toObject3D } from './toMesh.js';








export async function createBirds({ scene, max = BIRD.perMoon, seed = 1, season = 'summer' }) {
  const capacity = BIRD.perMoon;
  const flock = createFlock({ max: capacity, seed, capacity });
  setBirdMax(flock, max);

  const p = parts({ seed, season, lod: 0 });
  const root = new THREE.Group();
  root.name = 'birds';
  scene.add(root);

  
  
  
  const bodySrc = await toObject3D(p.body, { castShadow: false, receiveShadow: false });
  const wingSrc = await toObject3D(p.wing, { castShadow: false, receiveShadow: false });
  const meshes = [];
  const tinted = [];
  const add = (src, count, tint) => {
    for (const child of src.children) {
      if (!child.isMesh) continue;
      const im = new THREE.InstancedMesh(child.geometry, child.material, count);
      im.name = `${child.name}#instanced`;
      im.count = 0;
      im.frustumCulled = false;   
      im.castShadow = false;
      im.receiveShadow = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      
      
      if (tint && !child.name.endsWith('/eye')) {
        const white = new THREE.Color(1, 1, 1);
        for (let i = 0; i < count; i++) im.setColorAt(i, white);
        im.instanceColor.setUsage(THREE.DynamicDrawUsage);
        tinted.push(im);
      }
      root.add(im);
      meshes.push({ mesh: im, perBird: count / capacity });
    }
  };
  add(bodySrc, capacity, true);
  add(wingSrc, capacity * 2, true);

  const dummy = new THREE.Object3D();
  const wingDummy = new THREE.Object3D();
  const colour = new THREE.Color();
  const shoulder = p.shoulder;

  




  function update(dt, t, sources, { player = null } = {}) {
    if (flock.max > 0) stepBirds(flock, sources, dt, t, { player });
    else { flock.birds.length = 0; flock.alive = 0; }
    const n = flock.alive;
    for (let i = 0; i < n; i++) {
      const pose = birdPose(flock.birds[i], t);
      dummy.position.set(pose.x, pose.y, pose.z);
      dummy.rotation.set(pose.pitch, pose.yaw, 0, 'YXZ');
      dummy.updateMatrix();
      colour.setRGB(pose.tint[0], pose.tint[1], pose.tint[2]);
      for (const { mesh, perBird } of meshes) {
        if (perBird === 1) {
          mesh.setMatrixAt(i, dummy.matrix);
          if (mesh.instanceColor) mesh.setColorAt(i, colour);
          continue;
        }
        
        
        
        for (let s = 0; s < 2; s++) {
          const side = s === 0 ? 1 : -1;
          wingDummy.position.set(shoulder[0] * side, shoulder[1], shoulder[2]);
          wingDummy.rotation.set(
            0,
            (side > 0 ? 0 : Math.PI) - side * (1 - pose.spread) * BIRD.foldRad,
            side * (pose.flap - (1 - pose.spread) * BIRD.foldDroopRad),
            'YZX',
          );
          wingDummy.updateMatrix();
          wingDummy.matrix.premultiply(dummy.matrix);
          mesh.setMatrixAt(i * 2 + s, wingDummy.matrix);
          if (mesh.instanceColor) mesh.setColorAt(i * 2 + s, colour);
        }
      }
    }
    for (const { mesh, perBird } of meshes) {
      mesh.count = n * perBird;
      mesh.visible = n > 0;
      if (n > 0) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
  }

  
  function setMax(n) { setBirdMax(flock, n); }

  





  function at(sources) {
    const out = [];
    for (let i = 0; i < flock.alive; i++) {
      const b = flock.birds[i];
      const s = sources.find((c) => perchKey(c) === b.perch);
      const inCrown = b.state !== 'perch' ? null : Boolean(s)
        && Math.hypot(b.x - s.x, b.z - s.z) <= s.r + 0.2
        && Math.abs(b.y - (s.y + s.h * BIRD.perchRise)) <= BIRD.hopRiseM + 0.02;
      out.push({ i, x: b.x, y: b.y, z: b.z, state: b.state, perch: b.perch, inCrown });
    }
    return out;
  }

  return {
    root, update, setMax, at,
    heightM: BIRD_HEIGHT_M,
    species: p.species.name,
    get stats() { return { ...flockStats(flock), species: p.species.name, meshes: meshes.length, tinted: tinted.length }; },
  };
}
