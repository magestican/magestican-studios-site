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

  // Ground: one layer of snow-covered ice at y=0. GRASS is repurposed as
  // "snow" in this theme (see voxelGrid.js palette).
  grid.fillBox(0, 0, 0, WORLD_SIZE.x - 1, 0, WORLD_SIZE.z - 1, VOX.GRASS);
  // Sprinkle patches of exposed pale-blue ice for visual texture.
  const iceRng = rng.child('ice-patch');
  for (let i = 0; i < 24; i++) {
    const px = iceRng.rangeI(4, WORLD_SIZE.x - 6);
    const pz = iceRng.rangeI(4, WORLD_SIZE.z - 6);
    const w = iceRng.rangeI(2, 4);
    const h = iceRng.rangeI(2, 4);
    grid.fillBox(px, 0, pz, px + w, 0, pz + h, VOX.ICE);
  }

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

  // Spawn point per team = 2 tiles offset from the flag stand (which is at
  // base centre and is a SOLID voxel - spawning on top of it made the player
  // instantly clip and be unable to move on any axis).
  // Barn floors are at ground level since 2026-08-21, so spawn + flag
  // heights dropped one voxel with them (floor top is y=1 everywhere now).
  const spawns = {
    red:  { x: redBase.x  + 2, y: 1, z: redBase.z  + Math.floor(BASE_SIZE.z / 2) },
    blue: { x: blueBase.x + BASE_SIZE.x - 3, y: 1, z: blueBase.z + Math.floor(BASE_SIZE.z / 2) },
  };

  const flags = {
    red:  { x: redBase.x  + BASE_SIZE.x / 2, y: 1, z: redBase.z  + BASE_SIZE.z / 2 },
    blue: { x: blueBase.x + BASE_SIZE.x / 2, y: 1, z: blueBase.z + BASE_SIZE.z / 2 },
  };

  // Where each barn's "BARN" name-plate hangs (entities/barnSign.js).
  const barnSigns = {
    red:  barnSignAnchor(redBase.x,  redBase.z),
    blue: barnSignAnchor(blueBase.x, blueBase.z),
  };

  return { seed, grid, spawns, flags, redBase, blueBase, hillSpawn, hayStacks, barnSigns };
}

function buildBase(grid, ox, oz, baseVox, standVox) {
  // Barn floor AT GROUND LEVEL (2026-08-21): the painted plank floor
  // REPLACES the y=0 ground voxel instead of stacking on top of it. The
  // old raised floor (y=1) made a 1.0 m step at the doorway that autostep
  // handled inconsistently — Bryan: "I still can't auto climb". Now the
  // barn threshold is dead flat with the outside snow; entering is just
  // walking. Walls grow one voxel taller (y=1..3) to keep interior height.
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, baseVox);
  // Full-height painted-wood walls (y=1 through y=3). Doorway on inward side.
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    for (let y = 1; y <= 3; y++) {
      grid.set(x, y, oz, baseVox);
      grid.set(x, y, oz + BASE_SIZE.z - 1, baseVox);
    }
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let y = 1; y <= 3; y++) {
      grid.set(ox, y, z, baseVox);
      grid.set(ox + BASE_SIZE.x - 1, y, z, baseVox);
    }
  }
  // Big barn doorway on the inward side - 3 wide x 2 tall AT GROUND LEVEL,
  // with a WOOD frame (jamb posts either side + lintel above).
  const { wallX, midZ } = barnDoorway(ox, oz);
  for (let z = midZ - 1; z <= midZ + 1; z++) {
    grid.set(wallX, 1, z, VOX.AIR);
    grid.set(wallX, 2, z, VOX.AIR);
  }
  for (const jz of [midZ - 2, midZ + 2]) {          // jamb posts
    grid.set(wallX, 1, jz, VOX.WOOD);
    grid.set(wallX, 2, jz, VOX.WOOD);
  }
  for (let z = midZ - 2; z <= midZ + 2; z++) {       // lintel beam
    grid.set(wallX, 3, z, VOX.WOOD);
  }

  // WOOD corner posts on all four corners (y=1..3) — breaks up the flat
  // painted walls and frames the silhouette (GRAPHICS_QUALITY_LOOP item 2).
  for (let y = 1; y <= 3; y++) {
    grid.set(ox, y, oz, VOX.WOOD);
    grid.set(ox + BASE_SIZE.x - 1, y, oz, VOX.WOOD);
    grid.set(ox, y, oz + BASE_SIZE.z - 1, VOX.WOOD);
    grid.set(ox + BASE_SIZE.x - 1, y, oz + BASE_SIZE.z - 1, VOX.WOOD);
  }
  // PITCHED ROOF — WOOD frame (edges) with a translucent GLASS fill inside
  // the triangle, so the barn is closed to bodies + bullets but you can
  // still see the sky through it. Bryan 2026-08-20: "close up the barns
  // by creating some glass voxel models". See docs/features/barn-glass-roofs.md.
  //
  // 2026-08-21: the courses used to stop dead at `y > 6` while the ridge beam
  // was still laid at `4 + halfWidth` (= y 9), so each barn shipped a flat
  // glass lid with a 10-long WOOD stick FLOATING three voxels above it. The
  // cap is gone — the triangle now closes on the ridge the way it was always
  // written to, which is also three voxels more barn silhouette on the
  // skyline. Roof apex y=9 is well inside WORLD_SIZE.y (12).
  const midX = ox + Math.floor(BASE_SIZE.x / 2);
  const halfWidth = Math.floor(BASE_SIZE.x / 2);
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let step = 0; step < halfWidth; step++) {
      const y = 4 + step;
      // Frame edges (wood).
      grid.set(midX - halfWidth + step, y, z, VOX.WOOD);
      grid.set(midX + halfWidth - step, y, z, VOX.WOOD);
      // Fill everything BETWEEN the two frame edges at this row with glass
      // (leaves the wood edges as visible rafters).
      for (let fx = midX - halfWidth + step + 1; fx <= midX + halfWidth - step - 1; fx++) {
        grid.set(fx, y, z, VOX.GLASS);
      }
    }
    // Ridge wood beam at the top.
    grid.set(midX, 4 + halfWidth, z, VOX.WOOD);
  }
  // Hay loft: stuff the bottom row of both gable ends with hay so the
  // barn reads as a working farm building, not an empty painted shell.
  for (const gz of [oz, oz + BASE_SIZE.z - 1]) {
    for (let hx = midX - 1; hx <= midX + 1; hx++) {
      grid.set(hx, 4, gz, VOX.HAY);
    }
  }
  // Small flag stand (1 tall).
  const cx = ox + Math.floor(BASE_SIZE.x / 2);
  const cz = oz + Math.floor(BASE_SIZE.z / 2);
  grid.set(cx, 1, cz, standVox);   // sits on the (now ground-level) floor
}

// Where a barn's doorway is, in one place, so the generator and whatever
// hangs things on the front of the barn can never drift apart. Pure maths on
// the base origin — no grid, so tests can assert it directly.
//
//   wallX  — the voxel column the doorway is cut through
//   midZ   — the doorway's centre column
//   nx     — +1 / -1: which way the doorway faces (always toward mid-map)
//   faceX  — world X of the wall's OUTER face (voxel v spans [v, v+1])
export function barnDoorway(ox, oz) {
  const midZ = oz + Math.floor(BASE_SIZE.z / 2);
  const facesPlusX = ox < 10;
  const wallX = facesPlusX ? ox + BASE_SIZE.x - 1 : ox;
  return {
    wallX, midZ,
    nx: facesPlusX ? 1 : -1,
    faceX: facesPlusX ? wallX + 1 : wallX,
  };
}

// Where the "BARN" name-plate hangs: dead centre over the doorway, sitting on
// the lintel beam (the lintel is voxel row y=3, i.e. world y in [3, 4)), a
// few centimetres proud of the wall so it never z-fights the siding.
// `yaw` turns a +Z-facing plane to face outward along nx.
export function barnSignAnchor(ox, oz) {
  const { faceX, midZ, nx } = barnDoorway(ox, oz);
  return {
    x: faceX + nx * 0.06,
    y: 3.5,
    z: midZ + 0.5,
    yaw: nx > 0 ? Math.PI / 2 : -Math.PI / 2,
    nx,
  };
}

function insideBase(x, z, base) {
  return x >= base.x - 1 && x <= base.x + BASE_SIZE.x
      && z >= base.z - 1 && z <= base.z + BASE_SIZE.z;
}

// Small round-ish hay bale. 2x2 footprint, 2 voxels tall, pure hay all the
// way through so it looks unmistakably yellow (no more grey ice caps on
// top). Non-colliding — see-through + walk-through — see rapierWorld.js.
function _buildHayBale(grid, ox, oz) {
  for (let dx = 0; dx < 2; dx++) {
    for (let dz = 0; dz < 2; dz++) {
      grid.set(ox + dx, 1, oz + dz, VOX.HAY);
      grid.set(ox + dx, 2, oz + dz, VOX.HAY);
    }
  }
}
