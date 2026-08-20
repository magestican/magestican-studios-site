// Rapier3d physics world wrapper.
//
// Loads @dimforge/rapier3d-compat lazily from a CDN, initialises the WASM
// module, and exposes:
//
//   createPhysicsWorld({ grid })  -> { world, characterCtrl, addCharacter,
//                                       step, RAPIER }
//
// The voxel grid becomes a compound of fixed cuboid colliders (one per
// exposed solid voxel) attached to a single fixed body. That's ~4-6k
// colliders on our 64x12x64 CTF map — well within rapier's happy zone.
//
// The character is a kinematic-position-based body with a capsule collider,
// driven by rapier's built-in `KinematicCharacterController` (slide-along-
// walls, auto-step, snap-to-ground included).

import * as THREE from 'three';

const RAPIER_URL = 'https://esm.sh/@dimforge/rapier3d-compat@0.14.0';

let _rapierPromise = null;
export function loadRapier() {
  if (!_rapierPromise) {
    _rapierPromise = import(RAPIER_URL).then(async (mod) => {
      const RAPIER = mod.default || mod;
      await RAPIER.init();
      return RAPIER;
    });
  }
  return _rapierPromise;
}

export async function createPhysicsWorld({ grid }) {
  const RAPIER = await loadRapier();
  const world = new RAPIER.World({ x: 0.0, y: -30.0, z: 0.0 });

  // Static terrain: one fixed body with many cuboid colliders.
  const terrainBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  addVoxelColliders(RAPIER, world, terrainBody, grid);

  // Character controller (shared across all characters on this client).
  const characterCtrl = world.createCharacterController(0.02);
  characterCtrl.setUp({ x: 0, y: 1, z: 0 });
  characterCtrl.enableAutostep(0.9, 0.35, true);         // climb single voxel (1m) ledges without jumping
  characterCtrl.enableSnapToGround(0.60);                // stick to slopes down
  characterCtrl.setApplyImpulsesToDynamicBodies(true);   // rockets shove crates
  characterCtrl.setMaxSlopeClimbAngle(60 * Math.PI / 180);
  characterCtrl.setMinSlopeSlideAngle(70 * Math.PI / 180);

  function addCharacter({ position, halfHeight = 0.8, radius = 0.32 }) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z);
    const body = world.createRigidBody(bodyDesc);
    const colDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius);
    const collider = world.createCollider(colDesc, body);
    return { body, collider };
  }

  // Dynamic rigid body (for projectiles, hazards, etc). Position + optional
  // initial linvel.
  function addDynamic({ position, radius = 0.15, restitution = 0.6, gravityScale = 1.0, linvel }) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setGravityScale(gravityScale)
      .setCcdEnabled(true);   // continuous collision so fast bullets don't tunnel
    if (linvel) bodyDesc.setLinvel(linvel.x, linvel.y, linvel.z);
    const body = world.createRigidBody(bodyDesc);
    const colDesc = RAPIER.ColliderDesc.ball(radius).setRestitution(restitution);
    world.createCollider(colDesc, body);
    return body;
  }

  function step(dt) {
    world.timestep = dt;
    world.step();
  }

  return { world, characterCtrl, addCharacter, addDynamic, step, RAPIER };
}

// Build one cuboid collider per exposed (has AIR neighbour) solid voxel.
// Merges same-material 1x1 cuboids into strips on the X axis for a ~2-3x
// perf win. Rapier is happy with ~5000 colliders on a fixed body.
function addVoxelColliders(RAPIER, world, body, grid) {
  const solid = (x, y, z) => grid.get(x, y, z) !== 0;   // 0 = AIR
  const exposed = (x, y, z) =>
    !solid(x + 1, y, z) || !solid(x - 1, y, z) ||
    !solid(x, y + 1, z) || !solid(x, y - 1, z) ||
    !solid(x, y, z + 1) || !solid(x, y, z - 1);

  let count = 0;
  for (let z = 0; z < grid.sz; z++) {
    for (let y = 0; y < grid.sy; y++) {
      let runStart = -1;
      for (let x = 0; x <= grid.sx; x++) {
        const wantHere = x < grid.sx && solid(x, y, z) && exposed(x, y, z);
        if (wantHere && runStart < 0) runStart = x;
        if (!wantHere && runStart >= 0) {
          const length = x - runStart;
          // Cuboid half-extents: length/2 x 0.5 x 0.5, centred at (runStart+length/2, y+0.5, z+0.5).
          const colDesc = RAPIER.ColliderDesc.cuboid(length / 2, 0.5, 0.5)
            .setTranslation(runStart + length / 2, y + 0.5, z + 0.5);
          world.createCollider(colDesc, body);
          count++;
          runStart = -1;
        }
      }
    }
  }
  console.log(`[physics] created ${count} voxel colliders for ${grid.sx}x${grid.sy}x${grid.sz} grid`);
}
