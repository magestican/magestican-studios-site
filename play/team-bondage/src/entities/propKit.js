// Builds and scatters the procedural prop kit (propKitSpec.js).
//
// The GLB props in mapProps.js still do what they always did — they are the
// farm's six, they carry baked texture atlases, and they load asynchronously.
// This is the other half: twenty-seven voxel props defined in data, built
// synchronously, and scattered per map from the recipe's `kit` block.
//
// Placement is a pure function of the world seed, exactly like mapProps: every
// peer scatters the same props on the same tiles, so the visible scene matches
// without a single byte crossing the wire.

import * as THREE from 'three';
import { PROPS, SCATTER_JITTER, FIXED_YAW } from './propKitSpec.js';
import { SeededRng } from '../../../../web-engine/rng/seededRng.js';

const WORLD = { x: 64, z: 64 };

// One material per hex, shared across every instance of every prop. Twenty-
// seven props at ~8 boxes each, times up to 16 instances, is a few thousand
// meshes; sharing takes the material count to about twenty.
const _mats = new Map();
function matFor(hex, glow) {
  const key = `${hex}:${glow || 0}`;
  if (!_mats.has(key)) {
    _mats.set(key, new THREE.MeshLambertMaterial({
      color: new THREE.Color(hex),
      flatShading: true,
      // `glow` is emissive, not a light. A brazier or a lamp that actually lit
      // the map would need a light per prop and there can be a dozen on screen;
      // emissive gives the read at a tenth of the cost, and the light rig is a
      // measured thing that a stray point light would quietly invalidate.
      ...(glow ? { emissive: new THREE.Color(hex), emissiveIntensity: glow } : {}),
    }));
  }
  return _mats.get(key);
}

// Build one prop as a THREE.Group at the origin, standing on y=0.
export function buildProp(id) {
  const parts = PROPS[id];
  if (!parts) return null;
  const g = new THREE.Group();
  g.name = `prop:${id}`;
  for (const part of parts) {
    const [x, y, z, w, h, d] = part.p;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFor(part.hex, part.glow));
    mesh.position.set(x, y, z);
    if (part.tiltX) mesh.rotation.x = part.tiltX;
    if (part.tiltY) mesh.rotation.y = part.tiltY;
    if (part.tiltZ) mesh.rotation.z = part.tiltZ;
    g.add(mesh);
  }
  return g;
}

// The bounding height of a prop, from the spec alone. Used by the tests and by
// the "does this fit under the ceiling" check.
export function propHeight(id) {
  const parts = PROPS[id] || [];
  let top = 0;
  for (const p of parts) top = Math.max(top, p.p[1] + p.p[4] / 2);
  return top;
}

// Scatter the map's kit. Returns the group (already added to the scene).
export function scatterPropKit(scene, world) {
  const kit = world.map?.kit;
  const group = new THREE.Group();
  group.name = 'propKit';
  scene.add(group);
  if (!kit) return group;

  // A stream of its own, so adding a prop to one map cannot shuffle the GLB
  // props or the hazards on another.
  const rng = new SeededRng((world.seed ^ 0x7A9C31B5) >>> 0);
  const grid = world.grid;

  const insideBase = (x, z, b) =>
    x >= b.x - 2 && x <= b.x + 12 && z >= b.z - 2 && z <= b.z + 12;
  const nearCentre = (x, z) =>
    Math.abs(x - WORLD.x / 2) < 5 && Math.abs(z - WORLD.z / 2) < 5;

  // Remember what has been placed so two props never share a tile. Props are
  // decoration and they do not collide, so an overlap is not a bug you can
  // walk into — it is a lamp post growing out of a bench, which is worse.
  const taken = new Set();

  let placed = 0, skipped = 0;
  for (const [id, count] of Object.entries(kit)) {
    const base = buildProp(id);
    if (!base) { skipped += count; continue; }
    const tall = propHeight(id);
    for (let i = 0; i < count; i++) {
      let done = false;
      for (let attempt = 0; attempt < 24 && !done; attempt++) {
        const x = rng.rangeI(3, WORLD.x - 4);
        const z = rng.rangeI(3, WORLD.z - 4);
        if (taken.has(`${x},${z}`)) continue;
        if (insideBase(x, z, world.redBase) || insideBase(x, z, world.blueBase)) continue;
        if (nearCentre(x, z)) continue;
        // Find the ground. The mountain is terraced, so "y=1" is only right on
        // the flat maps — a prop dropped at a fixed height on a terrace either
        // floats or is buried to its roof.
        const y = surfaceY(grid, x, z);
        if (y == null) continue;
        // Don't stand a 3.5 m radio mast under the 12-voxel ceiling on top of
        // a four-course terrace.
        if (y + tall > 11) continue;

        const inst = base.clone(true);
        const jx = (rng.rangeF(0, 1) - 0.5) * 2 * SCATTER_JITTER.offset;
        const jz = (rng.rangeF(0, 1) - 0.5) * 2 * SCATTER_JITTER.offset;
        inst.position.set(x + 0.5 + jx, y, z + 0.5 + jz);
        if (!FIXED_YAW.has(id)) inst.rotation.y = rng.rangeF(0, Math.PI * 2);
        const s = rng.rangeF(SCATTER_JITTER.scale[0], SCATTER_JITTER.scale[1]);
        inst.scale.setScalar(s);
        group.add(inst);
        taken.add(`${x},${z}`);
        placed++;
        done = true;
      }
      if (!done) skipped++;
    }
  }
  console.log(`[propKit] ${world.mapId}: placed ${placed} props (${skipped} could not find a tile)`);
  return group;
}

// The Y a prop should stand at: the top of the first solid column found from
// the ground up, or null if this tile is already occupied by something above
// ground level (cover, a ridge, a barn wall).
function surfaceY(grid, x, z) {
  for (let y = 1; y < 11; y++) {
    if (!grid.isSolid(x + 0.5, y + 0.5, z + 0.5)) {
      // y is the first free voxel. Anything above it must be free too, or the
      // prop is standing in a gap under an overhang.
      if (grid.isSolid(x + 0.5, y + 1.5, z + 0.5)) return null;
      return y;
    }
  }
  return null;
}
