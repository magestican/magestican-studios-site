// Build a THREE mesh from a VoxelGrid.
// One InstancedMesh per voxel type so the whole world is a handful of draw
// calls even for a 64x12x64 grid.

import * as THREE from 'three';
import { VOX, VOX_COLOR } from 'arbelo/voxel';
import { makeGrassTexture, makeWoodTexture, makeStoneTexture, makeDirtTexture } from './textures.js';

const CUBE_GEO = new THREE.BoxGeometry(1, 1, 1);

// Lazily built texture cache - built the first time buildWorldMeshes runs.
let TEX = null;
function getTextures() {
  if (TEX) return TEX;
  TEX = {
    [VOX.GRASS]: makeGrassTexture(),
    [VOX.WOOD]:  makeWoodTexture(),
    [VOX.STONE]: makeStoneTexture(),
    [VOX.DIRT]:  makeDirtTexture(),
  };
  return TEX;
}

export function buildWorldMeshes(grid) {
  // Group instances by voxel type.
  const groups = new Map();  // vType -> Array<{x,y,z}>
  for (let z = 0; z < grid.sz; z++) {
    for (let y = 0; y < grid.sy; y++) {
      for (let x = 0; x < grid.sx; x++) {
        const v = grid.get(x, y, z);
        if (v === VOX.AIR) continue;
        // Skip fully-occluded voxels for perf.
        if (isFullyOccluded(grid, x, y, z)) continue;
        if (!groups.has(v)) groups.set(v, []);
        groups.get(v).push({ x, y, z });
      }
    }
  }

  const parent = new THREE.Group();
  parent.name = 'voxelWorld';
  const dummy = new THREE.Object3D();

  const textures = getTextures();
  for (const [v, cells] of groups.entries()) {
    const [r, g, b] = VOX_COLOR[v];
    const materialOpts = {
      color: new THREE.Color(r / 255, g / 255, b / 255),
      flatShading: true,
    };
    if (textures[v]) materialOpts.map = textures[v];
    const material = new THREE.MeshLambertMaterial(materialOpts);
    const inst = new THREE.InstancedMesh(CUBE_GEO, material, cells.length);
    inst.castShadow = false;
    inst.receiveShadow = false;
    // Slight per-instance colour jitter for a hand-drawn feel.
    const jitterColor = new THREE.Color();
    if (!inst.instanceColor) {
      inst.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(cells.length * 3), 3);
    }
    for (let i = 0; i < cells.length; i++) {
      const { x, y, z } = cells[i];
      dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      const j = 1 - Math.random() * 0.08;
      jitterColor.setRGB((r / 255) * j, (g / 255) * j, (b / 255) * j);
      inst.setColorAt(i, jitterColor);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    parent.add(inst);
  }

  return parent;
}

// A voxel is fully occluded if all 6 neighbours are also solid (not AIR).
function isFullyOccluded(grid, x, y, z) {
  for (const [dx, dy, dz] of NEIGHBOURS) {
    const v = grid.get(x + dx, y + dy, z + dz);
    if (v === VOX.AIR) return false;
  }
  return true;
}

const NEIGHBOURS = [
  [ 1, 0, 0], [-1, 0, 0],
  [ 0, 1, 0], [ 0,-1, 0],
  [ 0, 0, 1], [ 0, 0,-1],
];
