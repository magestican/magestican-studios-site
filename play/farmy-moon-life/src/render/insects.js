
























import * as THREE from 'three';
import { makeCozy } from './material.js';
import { INSECT, createInsectPool, setInsectMax, stepInsects, insectPose } from 'moon/play/insects.mjs';
import { parts } from 'moon/art/insect.mjs';



const CAPACITY = 4;


function geometryOf(meshData) {
  const arrays = meshData.toArrays();
  if (arrays.groups.length !== 1) throw new Error(`${arrays.name}: expected one material group, got ${arrays.groups.length}`);
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

function instanced(scene, geometry, material, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
  mesh.name = name;
  mesh.count = 0;
  mesh.visible = false;
  mesh.frustumCulled = false;   
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < CAPACITY; i++) mesh.setColorAt(i, white);   
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  return mesh;
}








export function createInsects({ scene, max = 3, seed = 1, season = 'summer', lod = 0 }) {
  const pool = createInsectPool({ max: CAPACITY, seed });
  setInsectMax(pool, max);

  const art = parts({ seed, season, lod });
  const furry = makeCozy(new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.9, metalness: 0,
  }), { rim: 0.35, key: 'insect-body' });
  furry.name = 'insect-body';
  
  
  
  const papery = makeCozy(new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide,
  }), { key: 'insect-wing', keepNormals: true });
  papery.name = 'insect-wing';

  const body = instanced(scene, geometryOf(art.body), furry, 'insect-bodies');
  const wingR = instanced(scene, geometryOf(art.wingR), papery, 'insect-wings-right');
  const wingL = instanced(scene, geometryOf(art.wingL), papery, 'insect-wings-left');
  const meshes = [body, wingR, wingL];

  const dummy = new THREE.Object3D();
  const flap = new THREE.Matrix4();
  const wingMatrix = new THREE.Matrix4();
  const colour = new THREE.Color();

  




  function update(dt, at) {
    stepInsects(pool, dt, at);
    for (let i = 0; i < pool.alive; i++) {
      const p = insectPose(pool.bugs[i], pool.clock);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.ry, 0);
      dummy.scale.setScalar(Math.max(0.001, p.scale));
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      wingR.setMatrixAt(i, wingMatrix.multiplyMatrices(dummy.matrix, flap.makeRotationZ(p.wing)));
      wingL.setMatrixAt(i, wingMatrix.multiplyMatrices(dummy.matrix, flap.makeRotationZ(-p.wing)));
      colour.setRGB(p.colour[0], p.colour[1], p.colour[2]);
      wingR.setColorAt(i, colour);
      wingL.setColorAt(i, colour);
      body.setColorAt(i, colour);
    }
    for (const m of meshes) {
      m.count = pool.alive;
      m.visible = pool.alive > 0;
      if (pool.alive) {
        m.instanceMatrix.needsUpdate = true;
        m.instanceColor.needsUpdate = true;
      }
    }
  }

  
  function setMax(n) { setInsectMax(pool, n); }

  return {
    meshes, update, setMax,
    get stats() {
      return {
        alive: pool.alive, max: pool.max, capacity: CAPACITY,
        spawned: pool.spawned, retired: pool.retired,
        season: pool.season, planet: pool.planet, clock: pool.clock,
        farM: INSECT.farM, leaveM: INSECT.leaveM,
        poses: pool.bugs.slice(0, pool.alive).map((b) => {
          const p = insectPose(b, pool.clock);
          return { x: p.x, y: p.y, z: p.z, wingDeg: (p.wing * 180) / Math.PI, scale: p.scale };
        }),
      };
    },
  };
}
