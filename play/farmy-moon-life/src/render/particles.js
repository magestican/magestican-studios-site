
























import * as THREE from 'three';
import { makeCozy } from './material.js';
import { LEAF, createLeafPool, setLeafMax, emitLeaves, stepLeaves, leafPose } from 'moon/play/leaves.mjs';




function leafGeometry() {
  const L = LEAF.lengthM, W = LEAF.widthM;
  const pos = [
    0, 0, -L * 0.5,       
    -W * 0.5, -0.008, 0,  
    W * 0.5, -0.008, 0,   
    0, 0.012, 0.02,       
    0, 0, L * 0.5,        
  ];
  const idx = [0, 1, 3, 0, 3, 2, 3, 1, 4, 3, 4, 2];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  
  
  const n = g.getAttribute('normal');
  for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * 0.4, Math.abs(n.getY(i)) * 0.6 + 0.6, n.getZ(i) * 0.4);
  g.computeBoundingSphere();
  return g;
}







export function createParticles({ scene, max = LEAF.max ?? 64, seed = 1 }) {
  const capacity = 64;
  const pool = createLeafPool({ max: capacity, seed });
  setLeafMax(pool, max);

  const material = makeCozy(new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide,
  }), { key: 'particle-leaf', keepNormals: true });
  material.name = 'particle-leaf';
  const mesh = new THREE.InstancedMesh(leafGeometry(), material, capacity);
  mesh.name = 'leaves';
  mesh.count = 0;
  mesh.frustumCulled = false;   
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < capacity; i++) mesh.setColorAt(i, white);   
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  




  function update(dt, t, sources, { wind = 1 } = {}) {
    if (pool.max > 0) emitLeaves(pool, sources, dt, t, wind);
    stepLeaves(pool, dt, t);
    for (let i = 0; i < pool.alive; i++) {
      const p = leafPose(pool.leaves[i]);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(Math.max(0.001, p.scale));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colour.setRGB(p.colour[0], p.colour[1], p.colour[2]));
    }
    mesh.count = pool.alive;
    mesh.visible = pool.alive > 0;
    if (pool.alive) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    }
  }

  
  function setMax(n) { setLeafMax(pool, n); }

  return {
    mesh, update, setMax,
    get stats() { return { alive: pool.alive, emitted: pool.emitted, max: pool.max, capacity }; },
  };
}
