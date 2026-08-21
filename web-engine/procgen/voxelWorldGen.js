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
import { VoxelGrid, VOX, GROUND_VOX } from '../voxel/voxelGrid.js';

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

  // Ground WEAR — footpaths, barn aprons and the tractor lane. Runs LAST so
  // it only ever paints over ground that is still bare snow or ice, and
  // never over a barn floor, the hill, or anything that got built on top.
  const wear = applyGroundWear(grid, rng.child('wear'),
                               { redBase, blueBase, hillX: cx, hillZ: cz });

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

  return { seed, grid, spawns, flags, redBase, blueBase, hillSpawn, hayStacks,
           barnSigns, tractorParking: wear.tractorParking };
}

// ---------------------------------------------------------------------------
// Ground wear
// ---------------------------------------------------------------------------
// Until 2026-08-21 the map was 4096 tiles of pristine, wind-carved snow —
// including the three metres immediately outside a barn door that an entire
// team sprints through every thirty seconds. Nothing on the ground recorded
// that anyone had ever been here, and a place nobody has ever walked across
// does not read as a farm; it reads as a render.
//
// So: paths where players actually go (barn doorway -> centre hill), a
// churned apron at each doorway, a scuffed ring around the hill everyone
// fights over, and a tractor lane with two real wheel ruts running the width
// of the map. All of it is a pure function of the world seed, because every
// peer in the P2P mesh generates its own copy of the map and they have to
// agree tile for tile.
//
// Hard rule: wear only ever overwrites tiles that are STILL GROUND. Barn
// floors, the hill, cover and anything built on top are off limits — hence
// GROUND_VOX rather than "y === 0".
export const WEAR = Object.freeze({
  apronDepth: 6,        // tiles the churned apron reaches out from a doorway
  apronHalfWidth: 4,    // ...and how wide it fans at its far end
  pathHalfWidth: 1,     // core half-width; the ragged edge adds up to 1 more
  pathWander: 0.42,     // rad of heading wobble per step — a footpath is not
                        // a ruled line, it drifts around whatever was in the
                        // way that day
  pathFray: 0.45,       // chance a tile just outside the core also gets worn
  hillRingInner: 3,     // the ring of scuffed ground around the centre hill
  hillRingOuter: 5,     // (everyone fights over the chicken slingshot there)
  hillRingFray: 0.72,
  // The tractor lane. Two rut rows one tile apart, with a trodden row down
  // the middle where the axle drags — that is what turns 1 m tiles into a
  // vehicle-width track. It runs along +X because the rut texture's tread
  // does (a tile's texture-x maps to world +X on a top face), so a lane on
  // any other heading would ship tyre marks running sideways to the track.
  trackZ: 25,
  trackX0: 4,
  trackX1: 59,
  trackWander: 1.4,     // tiles of slow drift in Z across the map's width
  trackWanderRate: 0.055,
  parkingX: Object.freeze([12, 47]),   // where the two tractors sit on it
  parkingApron: 2,      // churned turn-around radius around a parked tractor
  holeFill: 6,          // neighbours needed to swallow a bare tile stranded
                        // inside a path (see closeWearHoles)
  scuffs: 14,           // loose scuffed patches out in the open ground
  scuffRadius: 2,
});

// Two trodden tiles exist so a boot print is not stamped identically across
// a 1 m grid (see makeTroddenTexture). Which one a tile gets is a hash of its
// position, NOT a draw from the rng: that keeps the choice independent of the
// ORDER wear happens to be painted in, so re-ordering a pass later can never
// silently reshuffle the whole map.
function troddenAt(x, z) {
  // lowbias32 finaliser. The naive version (one xor-shift) leaked the parity
  // of x^z straight into bit 0 and shipped a 60/40 split with a checkerboard
  // in it — which is the exact structure this hash exists to destroy.
  let h = (Math.imul(x, 0x9e3779b1) ^ Math.imul(z, 0x85ebca77)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h & 1) ? VOX.TRODDEN_B : VOX.TRODDEN;
}

const GROUND_SET = new Set(GROUND_VOX);

// Paint one ground tile, if it is still ground.
//
// A RUT is never overwritten by anything but another rut. The lane is the
// only LINEAR feature on the ground plane and an unbroken pair of parallel
// lines is its entire read — one gap and it stops being a wheel track and
// becomes two smudges. Three things wanted to punch holes in it: the
// tractor's own turn-around apron (a 7-tile hole at each parking spot in the
// first render), a footpath crossing it, and a loose scuff landing on it.
// In the real world a boot crossing a rut does not fill the rut in, so the
// rule is a physical one, not a rendering hack.
function wearTile(grid, x, z, vox) {
  if (!grid.inBounds(x, 0, z)) return false;
  const cur = grid.get(x, 0, z);
  if (!GROUND_SET.has(cur)) return false;
  const paint = vox === undefined ? troddenAt(x, z) : vox;
  if (cur === VOX.RUT && paint !== VOX.RUT) return false;
  grid.set(x, 0, z, paint);
  return true;
}

function wearDisc(grid, rng, x0, z0, r, fray = 0) {
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > r) continue;
      // Soften the rim: a disc with a clean edge reads as a stamped circle.
      if (d > r - 1 && rng.rangeF(0, 1) > fray) continue;
      wearTile(grid, x0 + dx, z0 + dz);
    }
  }
}

export function applyGroundWear(grid, rng, { redBase, blueBase, hillX, hillZ }) {
  // 1. The apron outside each barn door, fanning wider as it gets further
  //    from the threshold — that spread is the shape of people scattering
  //    once they are through the gap.
  for (const base of [redBase, blueBase]) {
    const { faceX, midZ, nx } = barnDoorway(base.x, base.z);
    const x0 = nx > 0 ? faceX : faceX - 1;
    for (let d = 0; d < WEAR.apronDepth; d++) {
      const t = d / (WEAR.apronDepth - 1);
      const halfW = 1 + Math.round(t * (WEAR.apronHalfWidth - 1));
      for (let dz = -halfW; dz <= halfW; dz++) {
        // Fray the outer lip so the apron fades into the snow instead of
        // ending on a hard rectangle.
        if (Math.abs(dz) === halfW && rng.rangeF(0, 1) > 0.6) continue;
        if (d === WEAR.apronDepth - 1 && rng.rangeF(0, 1) > 0.55) continue;
        wearTile(grid, x0 + nx * d, midZ + dz);
      }
    }
  }

  // 2. A footpath from each barn door to the centre hill. Walked, not ruled:
  //    the heading wobbles, and the edge frays a tile at a time.
  for (const base of [redBase, blueBase]) {
    const { faceX, midZ, nx } = barnDoorway(base.x, base.z);
    walkPath(grid, rng, faceX + nx * WEAR.apronDepth, midZ, hillX, hillZ);
  }

  // 3. The scuffed ring around the hill. The chicken slingshot spawns on top
  //    of it, so this is the single most fought-over patch on the map — and
  //    it looked exactly as untouched as the far corners.
  for (let dz = -WEAR.hillRingOuter; dz <= WEAR.hillRingOuter; dz++) {
    for (let dx = -WEAR.hillRingOuter; dx <= WEAR.hillRingOuter; dx++) {
      const d = Math.hypot(dx, dz);
      if (d < WEAR.hillRingInner || d > WEAR.hillRingOuter) continue;
      if (rng.rangeF(0, 1) > WEAR.hillRingFray) continue;
      wearTile(grid, hillX + dx, hillZ + dz);
    }
  }

  // 4. The tractor lane: rut / churn / rut, drifting slowly in Z so it reads
  //    as a lane someone drives rather than a line someone drew.
  const phase = rng.rangeF(0, 6.28);
  const laneZ = (x) => WEAR.trackZ
    + Math.round(Math.sin(x * WEAR.trackWanderRate + phase) * WEAR.trackWander);
  for (let x = WEAR.trackX0; x <= WEAR.trackX1; x++) {
    const z = laneZ(x);
    // Where the lane drifts a tile sideways, lay BOTH z positions in the
    // transition column so the two ruts overlap into a short dogleg. Without
    // it each rut simply stopped and restarted one tile over, and a wheel
    // track with a clean break in it stops reading as a wheel track.
    const zs = new Set([z, laneZ(x - 1)]);
    for (const lz of zs) {
      wearTile(grid, x, lz,     VOX.RUT);
      wearTile(grid, x, lz + 1, troddenAt(x, lz + 1));
      wearTile(grid, x, lz + 2, VOX.RUT);
    }
  }

  // 5. Where the two tractors park, with the churned ground they turned on.
  //    Handing these back means the tractor prop stands in its OWN ruts
  //    instead of being scattered to a random tile that has never been
  //    driven over — the detail that makes the lane read as caused by
  //    something rather than decorative.
  const tractorParking = [];
  for (const px of WEAR.parkingX) {
    const pz = laneZ(px) + 1;
    wearDisc(grid, rng, px, pz, WEAR.parkingApron + 1, 0.5);
    // Clear anything cover-generation dropped on the spot, or the prop
    // scatterer will reject it and the lane will have no tractor on it.
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++)
        grid.fillBox(px + dx, 1, pz + dz, px + dx, 3, pz + dz, VOX.AIR);
    tractorParking.push({ x: px, z: pz, yaw: px < 32 ? Math.PI / 2 : -Math.PI / 2 });
  }

  // 6. Loose scuffed patches out in the open — the skirmishes that did not
  //    happen on a path. Without these every worn tile sits on a route and
  //    the wear reads as painted-on level design.
  for (let i = 0; i < WEAR.scuffs; i++) {
    const x = rng.rangeI(6, 57), z = rng.rangeI(6, 57);
    wearDisc(grid, rng, x, z, rng.rangeI(1, WEAR.scuffRadius), 0.35);
  }

  // 7. Close the pinholes. The frayed path edges leave the odd single
  //    untouched tile surrounded by worn ones, and at a grazing angle that
  //    is a hard-edged, uniformly bright 1 m parallelogram sitting in the
  //    middle of a dark path — it reads as a sheet of paper dropped on the
  //    ground, not as a patch of snow. Nobody walks around a one-metre
  //    island, so nor does the wear.
  closeWearHoles(grid);

  return { tractorParking };
}

// Any bare tile with `WEAR.holeFill` or more of its eight neighbours worn
// gets worn too. One pass over a snapshot, not in place, so filling one hole
// cannot cascade across the whole map.
function closeWearHoles(grid) {
  const worn = new Set([VOX.TRODDEN, VOX.TRODDEN_B, VOX.RUT]);
  const before = grid.data.slice();
  const at = (x, z) => worn.has(before[grid.idx(x, 0, z)]);
  for (let z = 1; z < WORLD_SIZE.z - 1; z++) {
    for (let x = 1; x < WORLD_SIZE.x - 1; x++) {
      if (at(x, z)) continue;
      let n = 0;
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++)
          if ((dx || dz) && at(x + dx, z + dz)) n++;
      if (n >= WEAR.holeFill) wearTile(grid, x, z);
    }
  }
}

// A footpath: step toward the target with a wobble on the heading, laying a
// core of trodden tiles and fraying the edge. Bounded step count so a bad
// seed can never spin here.
function walkPath(grid, rng, x0, z0, tx, tz) {
  let x = x0, z = z0;
  let ang = Math.atan2(tz - z0, tx - x0);
  const maxSteps = (WORLD_SIZE.x + WORLD_SIZE.z) * 2;
  for (let i = 0; i < maxSteps; i++) {
    const toTarget = Math.atan2(tz - z, tx - x);
    // Steer back toward the hill every step, then wobble. Pure wobble
    // wanders off; pure steering draws a ruled line.
    let d = toTarget - ang;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    ang += d * 0.35 + rng.rangeF(-WEAR.pathWander, WEAR.pathWander);
    x += Math.cos(ang);
    z += Math.sin(ang);
    const ix = Math.round(x), iz = Math.round(z);
    const nx = -Math.sin(ang), nz = Math.cos(ang);
    for (let o = -WEAR.pathHalfWidth; o <= WEAR.pathHalfWidth; o++) {
      wearTile(grid, Math.round(x + nx * o), Math.round(z + nz * o));
    }
    // Fray: one more tile out, sometimes, on one side or the other.
    if (rng.rangeF(0, 1) < WEAR.pathFray) {
      const side = rng.rangeF(0, 1) < 0.5 ? -1 : 1;
      const o = side * (WEAR.pathHalfWidth + 1);
      wearTile(grid, Math.round(x + nx * o), Math.round(z + nz * o));
    }
    if (Math.hypot(tx - ix, tz - iz) <= WEAR.hillRingOuter) break;
  }
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
