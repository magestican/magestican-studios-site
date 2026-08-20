// Seeded voxel-world generator for Team Bondage.
//
// Layout invariants:
//   * two team bases at opposite corners, mirrored so both teams have parity
//   * flat playable ground between them at y=1 (grass)
//   * random cover (stone pillars, wood crate stacks) placed by seed
//   * two flag stands (one per base)
//   * spawn points inside each base
//
// The whole world is a pure function of one integer seed; every peer in the
// P2P mesh generates the same map given the same seed.

import { SeededRng } from '../rng/seededRng.js';
import { VoxelGrid, VOX } from '../voxel/voxelGrid.js';

export const WORLD_SIZE = { x: 64, y: 12, z: 64 };
export const BASE_SIZE  = { x: 10, y: 4,  z: 10 };

export function generateWorld(seed) {
  const rng = new SeededRng(seed);
  const grid = new VoxelGrid(WORLD_SIZE.x, WORLD_SIZE.y, WORLD_SIZE.z);

  // Ground: one layer of grass at y=0.
  grid.fillBox(0, 0, 0, WORLD_SIZE.x - 1, 0, WORLD_SIZE.z - 1, VOX.GRASS);

  // Centre hill (chicken slingshot spawn spot). Small 5x5 knoll rising 2
  // blocks from the middle of the map.
  const cx = Math.floor(WORLD_SIZE.x / 2);
  const cz = Math.floor(WORLD_SIZE.z / 2);
  grid.fillBox(cx - 2, 1, cz - 2, cx + 2, 1, cz + 2, VOX.HILL);
  grid.fillBox(cx - 1, 2, cz - 1, cx + 1, 2, cz + 1, VOX.HILL);

  // Two bases at opposite corners.
  const redBase = { x: 2,                       z: 2 };
  const blueBase = { x: WORLD_SIZE.x - BASE_SIZE.x - 2,
                     z: WORLD_SIZE.z - BASE_SIZE.z - 2 };

  buildBase(grid, redBase.x,  redBase.z,  VOX.BASE_RED,  VOX.FLAG_STAND_RED);
  buildBase(grid, blueBase.x, blueBase.z, VOX.BASE_BLUE, VOX.FLAG_STAND_BLUE);

  // Scatter cover (stone pillars + wood crate stacks) between the bases.
  const coverRng = rng.child('cover');
  const coverCount = coverRng.rangeI(20, 32);
  for (let i = 0; i < coverCount; i++) {
    const cx = coverRng.rangeI(12, WORLD_SIZE.x - 13);
    const cz = coverRng.rangeI(12, WORLD_SIZE.z - 13);
    // Keep clear of the middle line to reward crossing.
    // Also keep out of both bases.
    if (insideBase(cx, cz, redBase) || insideBase(cx, cz, blueBase)) continue;
    const kind = coverRng.pick(['pillar', 'crate', 'wall']);
    switch (kind) {
      case 'pillar': {
        const h = coverRng.rangeI(2, 4);
        grid.fillBox(cx, 1, cz, cx, h, cz, VOX.STONE);
        break;
      }
      case 'crate': {
        // 2x2 base, 1-2 stacks
        const stacks = coverRng.rangeI(1, 2);
        grid.fillBox(cx, 1, cz, cx + 1, stacks, cz + 1, VOX.WOOD);
        break;
      }
      case 'wall': {
        const len = coverRng.rangeI(3, 5);
        const dir = coverRng.pick(['x', 'z']);
        if (dir === 'x') grid.fillBox(cx, 1, cz, cx + len, 2, cz, VOX.STONE);
        else             grid.fillBox(cx, 1, cz, cx, 2, cz + len, VOX.STONE);
        break;
      }
    }
  }

  // Scatter hay bales - voxel-stepped cylinders that approximate a round
  // bale silhouette from any angle. Each bale is 3x3 at the base, 3x3 in
  // the middle course, and 2x2 on top, capped by a 1x1 tuft.
  const hayRng = rng.child('hay');
  const hayCount = hayRng.rangeI(8, 12);
  const hayStacks = [];
  for (let i = 0; i < hayCount; i++) {
    const hx = hayRng.rangeI(6, WORLD_SIZE.x - 9);
    const hz = hayRng.rangeI(6, WORLD_SIZE.z - 9);
    if (insideBase(hx, hz, redBase) || insideBase(hx, hz, blueBase)) continue;
    // Don't stack ON the central hill.
    if (Math.abs(hx - cx) < 4 && Math.abs(hz - cz) < 4) continue;
    _buildHayBale(grid, hx, hz);
    hayStacks.push({ x: hx, z: hz });
  }

  // Hill spawn point for the chicken slingshot pickup.
  const hillSpawn = { x: cx + 0.5, y: 3.5, z: cz + 0.5 };

  // Spawn point per team = centre of that base at y=1 (on top of the floor).
  const spawns = {
    red:  { x: redBase.x  + BASE_SIZE.x / 2, y: 2, z: redBase.z  + BASE_SIZE.z / 2 },
    blue: { x: blueBase.x + BASE_SIZE.x / 2, y: 2, z: blueBase.z + BASE_SIZE.z / 2 },
  };

  const flags = {
    red:  { x: redBase.x  + BASE_SIZE.x / 2, y: 2, z: redBase.z  + BASE_SIZE.z / 2 },
    blue: { x: blueBase.x + BASE_SIZE.x / 2, y: 2, z: blueBase.z + BASE_SIZE.z / 2 },
  };

  return { seed, grid, spawns, flags, redBase, blueBase, hillSpawn, hayStacks };
}

function buildBase(grid, ox, oz, baseVox, standVox) {
  // Floor
  grid.fillBox(ox, 1, oz, ox + BASE_SIZE.x - 1, 1, oz + BASE_SIZE.z - 1, baseVox);
  // Perimeter walls (3 high) with a gap on the inward side.
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    grid.fillBox(x, 2, oz,                   x, 3, oz,                   baseVox);
    grid.fillBox(x, 2, oz + BASE_SIZE.z - 1, x, 3, oz + BASE_SIZE.z - 1, baseVox);
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    grid.fillBox(ox,                   2, z, ox,                   3, z, baseVox);
    grid.fillBox(ox + BASE_SIZE.x - 1, 2, z, ox + BASE_SIZE.x - 1, 3, z, baseVox);
  }
  // Cut a doorway on the inward side (large opening in the wall).
  const midZ = oz + Math.floor(BASE_SIZE.z / 2);
  for (let z = midZ - 1; z <= midZ + 1; z++) {
    for (let y = 2; y <= 3; y++) {
      // Open the wall closest to the map centre.
      const wallX = (ox < 10) ? ox + BASE_SIZE.x - 1 : ox;
      grid.set(wallX, y, z, VOX.AIR);
    }
  }
  // Flag stand: a 1x1 pillar (2 high) at base centre.
  const cx = ox + Math.floor(BASE_SIZE.x / 2);
  const cz = oz + Math.floor(BASE_SIZE.z / 2);
  grid.set(cx, 2, cz, standVox);
  grid.set(cx, 3, cz, standVox);
}

function insideBase(x, z, base) {
  return x >= base.x - 1 && x <= base.x + BASE_SIZE.x
      && z >= base.z - 1 && z <= base.z + BASE_SIZE.z;
}

// Round-ish hay bale (voxel-stepped cylinder). ox,oz is the front-left
// corner of the 3x3 footprint.
function _buildHayBale(grid, ox, oz) {
  // Layer 1 (base): 3x3 solid.
  for (let dx = 0; dx < 3; dx++)
    for (let dz = 0; dz < 3; dz++)
      grid.set(ox + dx, 1, oz + dz, VOX.HAY);
  // Layer 2: 3x3 minus the 4 corners = plus/octagon shape.
  const octagon = (dx, dz) => !((dx === 0 || dx === 2) && (dz === 0 || dz === 2));
  for (let dx = 0; dx < 3; dx++)
    for (let dz = 0; dz < 3; dz++)
      if (octagon(dx, dz)) grid.set(ox + dx, 2, oz + dz, VOX.HAY);
  // Layer 3 (top): 2x2 centred (offset so it hovers over the middle).
  grid.set(ox + 1, 3, oz + 1, VOX.HAY);
  grid.set(ox + 1, 3, oz + 2, VOX.HAY);
  grid.set(ox + 2, 3, oz + 1, VOX.HAY);
  grid.set(ox + 2, 3, oz + 2, VOX.HAY);
  // Tuft on top (a single cube).
  grid.set(ox + 1, 4, oz + 1, VOX.HAY);
}
