// The "BARN" name-plate hung over each barn doorway.
//
// GRAPHICS_QUALITY_LOOP queue item 1. Both barns are identical painted
// boxes at a glance; a hand-painted plank sign over the door does two jobs
// at once — it says "this is a farm building, not a bunker", and its
// team-coloured end blocks tell you whose barn you are running at from
// across the map.
//
// Built here rather than out of voxels because text has to be legible: a
// 1 m voxel is far too coarse to spell anything, and the sign has to read
// at 10 m (docs/GRAPHICS_QUALITY_LOOP.md's standing bar). Placement comes
// from `barnSignAnchor()` in the world generator so the sign and the
// doorway can never drift apart.

import * as THREE from 'three';
import { makeBarnSignTexture, makeWoodTexture } from '../map/textures.js';

// Plank proportions, in metres. 2.6 wide spans the 3 m doorway without
// covering its wood jambs; 0.62 tall keeps it inside the lintel voxel.
const SIGN_W = 2.6, SIGN_H = 0.62, SIGN_D = 0.09;
const ACCENT = { red: '#b73a2a', blue: '#336bbf' };

// One shared wood texture + one texture per team, built on first use.
let _wood = null;
const _face = {};

export function buildBarnSign(team) {
  const group = new THREE.Group();
  group.name = `barnSign-${team}`;

  if (!_wood) _wood = makeWoodTexture();
  if (!_face[team]) _face[team] = makeBarnSignTexture(ACCENT[team] || ACCENT.red);

  // The plank itself — a real box so the sign has an edge and casts a
  // silhouette when you look along the wall, not a floating decal.
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(SIGN_W, SIGN_H, SIGN_D),
    new THREE.MeshLambertMaterial({ map: _wood, color: 0xb99164, flatShading: true }),
  );
  group.add(plank);

  // Painted face on the outward (+Z) side, a hair proud of the plank.
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(SIGN_W * 0.98, SIGN_H * 0.94),
    new THREE.MeshLambertMaterial({ map: _face[team] }),
  );
  face.position.z = SIGN_D / 2 + 0.005;
  group.add(face);

  // Two iron mount straps top and bottom, one at each end — the tell that
  // the sign is BOLTED to the barn rather than hovering in front of it.
  const strapMat = new THREE.MeshLambertMaterial({ color: 0x5c5f66, flatShading: true });
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, SIGN_D + 0.03), strapMat);
      strap.position.set(sx * SIGN_W * 0.42, sy * SIGN_H * 0.36, 0);
      group.add(strap);
    }
  }
  return group;
}

// Hang a sign on each barn. `world.barnSigns` comes from the generator.
export function addBarnSigns(scene, world) {
  const group = new THREE.Group();
  group.name = 'barnSigns';
  for (const team of ['red', 'blue']) {
    const a = world.barnSigns?.[team];
    if (!a) continue;
    const sign = buildBarnSign(team);
    sign.position.set(a.x, a.y, a.z);
    sign.rotation.y = a.yaw;
    // Per-element wobble: each sign hangs a degree or two off true, so the
    // pair never reads as two copies of one decal (hand-drawn.md).
    sign.rotation.z = (team === 'red' ? 1 : -1) * 0.022;
    group.add(sign);
  }
  scene.add(group);
  return group;
}
