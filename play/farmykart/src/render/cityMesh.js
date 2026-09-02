





















import * as THREE from 'three';
import { SeededRng } from 'arbelo/rng';
import { sampleAt } from 'arbelo/trackPath';
import { cityBlocks } from '../../../../web-engine/kart/cityBlocks.js';
import { surface } from './materials.js';
import { groundMeshHeightAt } from './trackMesh.js';
import { themeOf } from './themes.js';
import { PALETTE } from '../palette.js';


const SAMPLES = 12;


const CORRIDOR_MARGIN = 12;















const BANK_LIMIT = 9;










const WALL_TINTS = [0.82, 0.9, 1.0, 1.08, 1.16];







export function buildCity(path, track) {
  const group = new THREE.Group();
  group.name = 'city';
  const spec = track.scenery && track.scenery.city;
  if (!spec) return group;

  const glide = (track.glides ?? [])[0];
  if (!glide) return group;

  
  
  
  
  
  
  const lipY = glide.floorY + glide.drop;

  const samples = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const frac = glide.from + ((glide.to - glide.from) * i) / (SAMPLES - 1);
    const p = sampleAt(path, frac * path.length);
    samples.push({ x: p.x, z: p.z, width: p.width });
  }
  
  
  
  
  
  const halfRoad = Math.max(...samples.map((p) => p.width)) / 2;

  const blocks = cityBlocks(samples, {
    count: spec.blocks ?? 60,
    floorY: glide.floorY,
    lipY,
    spread: spec.spread ?? 70,
    minClear: halfRoad + CORRIDOR_MARGIN,
    rng: new SeededRng(spec.seed ?? 0xc17a),
  });
  if (!blocks.length) return group;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const stood = [];
  for (const b of blocks) {
    
    
    
    
    
    
    
    const ground = groundMeshHeightAt(path, b.x, b.z);
    if (!Number.isFinite(ground) || ground > glide.floorY + BANK_LIMIT) continue;
    stood.push({ ...b, y: glide.floorY - 0.3 });
  }
  if (!stood.length) return group;

  const row = themeOf(track.theme);

  
  
  
  
  const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
  bodyGeo.translate(0, 0.5, 0);
  const bodies = new THREE.InstancedMesh(
    bodyGeo, surface({ color: 0xffffff, flatShading: true, unique: true }), stood.length);
  bodies.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(stood.length * 3), 3);
  bodies.name = 'cityWalls';

  
  const roofGeo = new THREE.BoxGeometry(1, 1, 1);
  roofGeo.translate(0, 0.5, 0);
  const roofs = new THREE.InstancedMesh(
    roofGeo, surface({ color: 0xffffff, flatShading: true, unique: true }), stood.length);
  roofs.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(stood.length * 3), 3);
  roofs.name = 'cityRoofs';

  const UP = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const c = new THREE.Color();
  const wall = new THREE.Color(row.rock);
  const roof = new THREE.Color(row.cliff.lip);
  const tallRoof = new THREE.Color(PALETTE.barnRed);
  const ROOF_H = 0.7;
  const ROOF_OUT = 0.5;

  for (let i = 0; i < stood.length; i += 1) {
    const b = stood[i];
    q.setFromAxisAngle(UP, b.yaw);

    pos.set(b.x, b.y, b.z);
    scale.set(b.w, b.h - ROOF_H, b.d);
    m.compose(pos, q, scale);
    bodies.setMatrixAt(i, m);
    c.copy(wall).multiplyScalar(WALL_TINTS[i % WALL_TINTS.length]);
    bodies.setColorAt(i, c);

    pos.set(b.x, b.y + b.h - ROOF_H, b.z);
    scale.set(b.w + ROOF_OUT, ROOF_H, b.d + ROOF_OUT);
    m.compose(pos, q, scale);
    roofs.setMatrixAt(i, m);
    
    
    c.copy(b.tall ? tallRoof : roof)
      .multiplyScalar(0.92 + (i % 3) * 0.06);
    roofs.setColorAt(i, c);
  }
  bodies.instanceMatrix.needsUpdate = true;
  roofs.instanceMatrix.needsUpdate = true;
  bodies.instanceColor.needsUpdate = true;
  roofs.instanceColor.needsUpdate = true;

  
  
  
  
  
  group.add(bodies, roofs);
  return group;
}
