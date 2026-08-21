// Build a THREE mesh from a VoxelGrid.
// One InstancedMesh per voxel type so the whole world is a handful of draw
// calls even for a 64x12x64 grid.

import * as THREE from 'three';
import { VOX, VOX_COLOR } from 'arbelo/voxel';
import { makeSnowTexture, makeIceTexture, makeWoodTexture, makeStoneTexture, makeDirtTexture, makeHayTexture, makeBloodTinted, makeBarnPaintTexture } from './textures.js';

const CUBE_GEO = new THREE.BoxGeometry(1, 1, 1);
// Every cube vertex is plain white so `vertexColors: true` is safe: with the
// flag on and NO `color` attribute bound, WebGL feeds the shader the generic
// attribute default (0,0,0) and the entire world renders BLACK.
CUBE_GEO.setAttribute('color', new THREE.BufferAttribute(
  new Float32Array(CUBE_GEO.attributes.position.count * 3).fill(1), 3));

// Lazily built texture cache - built the first time buildWorldMeshes runs.
let TEX = null;
function getTextures() {
  if (TEX) return TEX;
  TEX = {
    // GRASS is repurposed as SNOW in this theme (voxelWorldGen.js); ICE is
    // the exposed pan scattered through it. Both paint their own hue.
    [VOX.GRASS]: makeSnowTexture(),
    [VOX.ICE]:   makeIceTexture(),
    [VOX.WOOD]:  makeWoodTexture(),
    [VOX.STONE]: makeStoneTexture(),
    [VOX.DIRT]:  makeDirtTexture(),
    [VOX.HAY]:   makeHayTexture(),
    [VOX.HILL]:  makeDirtTexture(),
    // Barn siding — board-and-batten planks, weathered differently per team.
    [VOX.BASE_RED]:  makeBarnPaintTexture('red'),
    [VOX.BASE_BLUE]: makeBarnPaintTexture('blue'),
  };
  return TEX;
}

// Textures that carry their OWN hue (the barn siding paints its own red /
// blue). Tinting those with the palette hex on top would square the colour
// and ship near-black planks — the tint trap in art/knowledge/craft/color.md.
// They get a white tint; every other type keeps its VOX_COLOR tint over a
// value-only texture.
const SELF_COLOURED = new Set([
  VOX.BASE_RED, VOX.BASE_BLUE,
  // The ground joined this set on 2026-08-21. It used to be a GREEN grass
  // texture under a near-white snow tint, and a tint cannot replace a hue —
  // the map rendered green for months. Snow and ice now paint their final
  // colour and nothing multiplies it afterwards.
  VOX.GRASS, VOX.ICE,
]);

// Mature-mode variant: blood-tinted versions of ONLY the vertical geometry
// (walls, hay). Ground (grass/ice/hill) stays snow-white - blood on the
// floor was never asked for.
let TEX_BLOOD = null;
function getBloodTextures() {
  if (TEX_BLOOD) return TEX_BLOOD;
  const base = getTextures();
  const BLOOD_TARGETS = new Set([VOX.WOOD, VOX.STONE, VOX.HAY]);
  TEX_BLOOD = {};
  for (const k in base) {
    if (BLOOD_TARGETS.has(Number(k))) TEX_BLOOD[k] = makeBloodTinted(base[k]);
    else TEX_BLOOD[k] = base[k];
  }
  return TEX_BLOOD;
}

// Also returns a `materials` map so the game can dynamically toggle hay
// visibility when the local player steps inside a bale.
export function buildWorldMeshes(grid, { mature = false } = {}) {
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
  const materialsByType = {};   // voxel type id -> THREE.Material

  const textures = mature ? getBloodTextures() : getTextures();
  for (const [v, cells] of groups.entries()) {
    const [r, g, b] = VOX_COLOR[v];
    const selfColoured = SELF_COLOURED.has(v);
    const materialOpts = {
      color: selfColoured
        ? new THREE.Color(1, 1, 1)
        : new THREE.Color(r / 255, g / 255, b / 255),
      flatShading: true,
      // Required for the per-instance jitter below to reach the fragment
      // shader at all — see the comment on the jitter loop.
      vertexColors: true,
    };
    if (textures[v]) materialOpts.map = textures[v];
    // HAY (v=10) is see-through so players hiding inside can see out.
    // Higher opacity + emissive-y bright yellow so bales are unmistakably
    // recognisable from a distance.
    if (v === VOX.HAY) {
      materialOpts.transparent = true;
      materialOpts.opacity = 0.72;
      materialOpts.side = THREE.DoubleSide;
      materialOpts.emissive = new THREE.Color(0x5a4a15);
    }
    // Glass: see-through panels used to close up barn roofs. Solid for
    // collision (bots + players can't fly out), transparent for vision.
    // See docs/features/barn-glass-roofs.md.
    if (v === VOX.GLASS) {
      materialOpts.transparent = true;
      materialOpts.opacity = 0.30;
      materialOpts.side = THREE.DoubleSide;
      // Slight emissive so glass reads even in shadow.
      materialOpts.emissive = new THREE.Color(0x203040);
    }
    const material = new THREE.MeshLambertMaterial(materialOpts);
    materialsByType[v] = material;
    const inst = new THREE.InstancedMesh(CUBE_GEO, material, cells.length);
    inst.castShadow = false;
    inst.receiveShadow = false;
    // Slight per-instance VALUE jitter for a hand-drawn feel (the wobble
    // hierarchy, art/knowledge/styles/hand-drawn.md).
    //
    // This was dead code until 2026-08-21 and shipped nothing for months.
    // Two bugs, both now fixed above:
    //   1. three r161's `color_fragment` only multiplies `vColor` into the
    //      diffuse under `#ifdef USE_COLOR` — i.e. only when the material
    //      sets `vertexColors: true`. `USE_INSTANCING_COLOR` alone declares
    //      the varying in the VERTEX shader and the fragment shader never
    //      reads it, so every voxel of a type rendered dead identical.
    //   2. The jitter multiplied VOX_COLOR again, so switching (1) on with
    //      it unchanged would have shipped `map x colour^2` — every surface
    //      crushed toward black. The jitter is greyscale now; hue comes
    //      from the material tint only.
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
      jitterColor.setRGB(j, j, j);
      inst.setColorAt(i, jitterColor);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    parent.add(inst);
  }

  parent.userData.materialsByType = materialsByType;
  return parent;
}

// re-export the standalone state machine so the game keeps its old import.
export { hayOpacityFor } from '../../../../web-engine/render/hayVisibility.js';

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
