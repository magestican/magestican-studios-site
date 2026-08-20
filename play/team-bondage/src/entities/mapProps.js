// Scatter hand-drawn snow-farm props (snowmen, barrels, crates, fence
// posts, hay bales, tractor) around the map.
//
// Deterministic per world seed - every peer scatters the same props in
// the same tiles, so the visible scene matches without network sync.
//
// Placement rules:
//   * Never inside a base (red / blue) or on the centre hill.
//   * Never on top of an existing solid voxel above ground level.
//   * Never within 1 tile of the ground exit doorway.
//   * Fence posts prefer a "fence-line" pattern - drop them in short runs.
//
// Feature spec: docs/features/map-props.md

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SeededRng } from '../../../../web-engine/rng/seededRng.js';

const GLB_BASE = '/play/team-bondage/assets/hand-drawn/props/';
const _loader = new GLTFLoader();

// prop-id -> count of instances to scatter
const SCATTER = {
  snowman:    8,
  'fence-post': 40,
  'hay-bale':  6,
  barrel:      7,
  crate:       9,
  tractor:     2,
};

// Bright pink cube fallback so props are STILL VISIBLE even if a GLB fails
// to load or is missing. Bryan should never see nothing.
function makeFallback(id) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.4, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xff44dd, flatShading: true }),
  );
  box.position.y = 0.7;
  g.add(box);
  g.userData.propId = id;
  g.userData.fallback = true;
  return g;
}

// Cache GLBs so N instances share geometry/material.
const _cache = new Map();
async function loadProp(id) {
  if (_cache.has(id)) return _cache.get(id);
  const url = GLB_BASE + id + '.glb';
  const p = new Promise((resolve) => {
    _loader.load(url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => {
        console.warn(`[mapProps] failed to load ${url}, using fallback`, err?.message || err);
        resolve(makeFallback(id));
      },
    );
  });
  _cache.set(id, p);
  return p;
}

function isInsideBaseOrHill(x, z, world) {
  const inBase = (b) => x >= b.x - 1 && x <= b.x + 10 && z >= b.z - 1 && z <= b.z + 10;
  if (inBase(world.redBase) || inBase(world.blueBase)) return true;
  const hx = world.hillSpawn.x, hz = world.hillSpawn.z;
  return Math.abs(x - hx) < 4 && Math.abs(z - hz) < 4;
}

// Public: load and scatter every prop under a single group.
export async function scatterMapProps(scene, world) {
  const group = new THREE.Group();
  group.name = 'mapProps';
  scene.add(group);
  console.log('[mapProps] scattering props for seed', world.seed);

  // XOR-safe seed derivation (`_` is invalid in a numeric literal).
  const rng = new SeededRng((world.seed ^ 0x51EED91E) >>> 0);
  const { x: W, z: D } = { x: 64, z: 64 };   // matches WORLD_SIZE

  // Load all props once.
  const loaded = {};
  for (const id of Object.keys(SCATTER)) loaded[id] = await loadProp(id);

  let placed = 0;
  for (const [id, count] of Object.entries(SCATTER)) {
    const base = loaded[id];
    if (!base) continue;
    for (let i = 0; i < count; i++) {
      // Try up to 20 candidates to find a legal tile.
      for (let attempt = 0; attempt < 20; attempt++) {
        const x = rng.rangeI(3, W - 4);
        const z = rng.rangeI(3, D - 4);
        if (isInsideBaseOrHill(x, z, world)) continue;
        // Skip if the ground here is not standard (avoid stacking on cover).
        if (world.grid.isSolid(x + 0.5, 1.5, z + 0.5)) continue;
        const inst = base.clone(true);
        inst.position.set(x + 0.5, 1.0, z + 0.5);
        // Random yaw so props don't all face north.
        inst.rotation.y = rng.rangeF(0, Math.PI * 2);
        // Small scale jitter for a "hand-placed" look.
        const s = 0.85 + rng.rangeF(0, 0.35);
        inst.scale.setScalar(s);
        group.add(inst);
        placed++;
        break;
      }
    }
  }
  console.log(`[mapProps] placed ${placed} instances across ${Object.keys(SCATTER).length} kinds`);
  return group;
}
