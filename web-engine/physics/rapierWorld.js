















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

  
  const terrainBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  addVoxelColliders(RAPIER, world, terrainBody, grid);

  
  const characterCtrl = world.createCharacterController(0.02);
  characterCtrl.setUp({ x: 0, y: 1, z: 0 });
  
  
  
  
  characterCtrl.enableAutostep(1.15, 0.3, true);
  characterCtrl.enableSnapToGround(0.60);                
  characterCtrl.setApplyImpulsesToDynamicBodies(true);   
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

  
  
  
  
  
  
  
  
  function setCharacterSize(collider, halfHeight, radius) {
    try {
      collider.setShape(new RAPIER.Capsule(halfHeight, radius));
      return true;
    } catch (err) {
      console.warn('[physics] capsule resize not supported:', err?.message || err);
      return false;
    }
  }

  
  
  function addDynamic({ position, radius = 0.15, restitution = 0.6, gravityScale = 1.0, linvel }) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setGravityScale(gravityScale)
      .setCcdEnabled(true);   
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

  return { world, characterCtrl, addCharacter, setCharacterSize, addDynamic, step, RAPIER };
}








function addVoxelColliders(RAPIER, world, body, grid) {
  const HAY = 10;
  const solid = (x, y, z) => {
    const v = grid.get(x, y, z);
    return v !== 0 && v !== HAY;   
  };
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
