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
import { getMap, DEFAULT_MAP } from './mapSpec.js';

// 2026-08-22 (Bryan: "make the map at least 50% bigger"): 64 -> 80 on both
// horizontal axes. 80x80 = 6400 tiles against 64x64 = 4096, so the playable
// area is +56%. The HEIGHT is deliberately unchanged: 12 courses is what the
// one-voxel-step rule, the barn roofs and the hazard fall time are all tuned
// against, and a taller world would only add sky.
export const WORLD_SIZE = { x: 80, y: 12, z: 80 };
export const BASE_SIZE  = { x: 10, y: 4,  z: 10 };

// Everything the generator scatters is authored as a count, and a count is a
// DENSITY only for the map size it was authored against. Growing the map
// without growing the counts is how a bigger arena ends up feeling emptier
// than the small one it replaced — the same 24 ice patches and 22 geese spread
// over 56% more ground. BASELINE_SIZE records what the numbers in mapSpec.js
// (and in the scatter tables in games/) were tuned on, and `perArea()` is the
// one place that converts count-per-64x64 into count-per-actual-map.
export const BASELINE_SIZE = 64;
export const AREA_SCALE =
  (WORLD_SIZE.x * WORLD_SIZE.z) / (BASELINE_SIZE * BASELINE_SIZE);
export function perArea(count) {
  return Math.max(1, Math.round(count * AREA_SCALE));
}
// The same idea for a coordinate: a landmark authored at x=25 on a 64-wide map
// belongs at the same FRACTION of the width, not at the same metre.
export function atFraction(v, axis = WORLD_SIZE.x) {
  return Math.round((v / BASELINE_SIZE) * axis);
}

export function generateWorld(seed, mapId = DEFAULT_MAP) {
  const map = getMap(mapId);
  const rng = new SeededRng(seed);
  const grid = new VoxelGrid(WORLD_SIZE.x, WORLD_SIZE.y, WORLD_SIZE.z);

  // Ground: one layer of the map's own floor material at y=0.
  grid.fillBox(0, 0, 0, WORLD_SIZE.x - 1, 0, WORLD_SIZE.z - 1, map.ground);
  // Patches of a second ground material for visual texture — exposed ice on
  // the farm, wind-blown snow over the rink's pavers, snow over the floe.
  const patchRng = rng.child('ice-patch');
  const patchCount = perArea(map.patch.count);
  for (let i = 0; i < patchCount; i++) {
    const px = patchRng.rangeI(4, WORLD_SIZE.x - 6);
    const pz = patchRng.rangeI(4, WORLD_SIZE.z - 6);
    const w = patchRng.rangeI(map.patch.size[0], map.patch.size[1]);
    const h = patchRng.rangeI(map.patch.size[0], map.patch.size[1]);
    grid.fillBox(px, 0, pz, px + w, 0, pz + h, map.patch.vox);
  }

  const cx = Math.floor(WORLD_SIZE.x / 2);
  const cz = Math.floor(WORLD_SIZE.z / 2);

  // Two bases at opposite corners. Their footprints are decided BEFORE the
  // terrain runs so the terrain pass can keep its hands off the ground they
  // stand on — a base half-buried in a terrace is a base with no door.
  const redBase = { x: 2,                       z: 2 };
  const blueBase = { x: WORLD_SIZE.x - BASE_SIZE.x - 2,
                     z: WORLD_SIZE.z - BASE_SIZE.z - 2 };

  // Terrain shape. Everything here steps ONE voxel at a time: autostep is
  // 1.15 m and a jump apex is ~1.5 m, so a single course is walkable and two
  // is a wall. A mountain built out of 3-voxel cliffs is a mountain nobody can
  // climb.
  buildTerrain(grid, rng.child('terrain'), map, { redBase, blueBase, cx, cz });

  // Centre feature — where the chicken slingshot spawns. Every map raises
  // something here; only the material and the profile change.
  const centreTop = buildCentre(grid, map, cx, cz);

  buildBase(grid, redBase.x,  redBase.z,  VOX.BASE_RED,  VOX.FLAG_STAND_RED,  map);
  buildBase(grid, blueBase.x, blueBase.z, VOX.BASE_BLUE, VOX.FLAG_STAND_BLUE, map);

  // The two power-up zones, on the diagonal the bases do NOT occupy. See
  // buildPowerZone() for why they are landmarks rather than scatter.
  const powerUpZones = buildPowerZones(grid);

  // Cover, drawn from the map's own vocabulary.
  const coverRng = rng.child('cover');
  const coverCount = perArea(coverRng.rangeI(20, 32));
  for (let i = 0; i < coverCount; i++) {
    const px = coverRng.rangeI(12, WORLD_SIZE.x - 13);
    const pz = coverRng.rangeI(12, WORLD_SIZE.z - 13);
    if (insideBase(px, pz, redBase) || insideBase(px, pz, blueBase)) continue;
    if (insideZone(px, pz, powerUpZones, 6)) continue;   // 6 = the longest cover piece
    // Never drop cover onto something already standing there. Until this
    // guard the rink's dasher boards were being punched through by benches
    // and stone walls — the boards generate first, cover picks a free tile at
    // random, and "free" had only ever meant "not in a base". Also stops
    // cover stacking on cover and on pressure ridges.
    if (occupied(grid, px, pz, 3)) continue;
    buildCover(grid, coverRng, coverRng.pick(map.cover), px, pz);
  }

  // Hay bales — walk-through hiding cover. A farm thing; the other maps get
  // their hiding places from their own cover vocabulary instead.
  const hayStacks = [];
  if (map.hay) {
    const hayRng = rng.child('hay');
    const hayCount = perArea(hayRng.rangeI(8, 12));
    for (let i = 0; i < hayCount; i++) {
      const hx = hayRng.rangeI(6, WORLD_SIZE.x - 9);
      const hz = hayRng.rangeI(6, WORLD_SIZE.z - 9);
      if (insideBase(hx, hz, redBase) || insideBase(hx, hz, blueBase)) continue;
      if (insideZone(hx, hz, powerUpZones, 2)) continue;   // a bale is 2x2
      if (Math.abs(hx - cx) < 4 && Math.abs(hz - cz) < 4) continue;
      _buildHayBale(grid, hx, hz);
      hayStacks.push({ x: hx, z: hz });
    }
  }

  // Ground WEAR — footpaths, door aprons and the tractor lane. Runs LAST so it
  // only ever paints over ground that is still bare, and never over a floor,
  // the centre, or anything built on top. Farm-only: a rink that is swept
  // every hour and a floe that re-freezes every night do not keep footprints.
  const wear = map.wear
    ? applyGroundWear(grid, rng.child('wear'), { redBase, blueBase, hillX: cx, hillZ: cz })
    : { tractorParking: [] };

  const ambientSpots = placeAmbient(grid, rng.child('ambient'), map, { redBase, blueBase });

  const hillSpawn = { x: cx + 0.5, y: centreTop + 0.5, z: cz + 0.5 };

  // Spawn point per team = 2 tiles offset from the flag stand (which is at
  // base centre and is a SOLID voxel — spawning on top of it made the player
  // instantly clip and be unable to move on any axis).
  const spawns = {
    red:  { x: redBase.x  + 2, y: 1, z: redBase.z  + Math.floor(BASE_SIZE.z / 2) },
    blue: { x: blueBase.x + BASE_SIZE.x - 3, y: 1, z: blueBase.z + Math.floor(BASE_SIZE.z / 2) },
  };

  const flags = {
    red:  { x: redBase.x  + BASE_SIZE.x / 2, y: 1, z: redBase.z  + BASE_SIZE.z / 2 },
    blue: { x: blueBase.x + BASE_SIZE.x / 2, y: 1, z: blueBase.z + BASE_SIZE.z / 2 },
  };

  const barnSigns = {
    red:  barnSignAnchor(redBase.x,  redBase.z),
    blue: barnSignAnchor(blueBase.x, blueBase.z),
  };

  return { seed, mapId: map.id, map, grid, spawns, flags, redBase, blueBase,
           hillSpawn, hayStacks, barnSigns,
           tractorParking: wear.tractorParking,
           powerUpZones,
           powerUpSpawns: {
             'protein-shake': zoneSpawn(powerUpZones.gym),
             'cheese-wheel':  zoneSpawn(powerUpZones.dairy),
           },
           ambientSpots };
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

function buildTerrain(grid, rng, map, { redBase, blueBase, cx, cz }) {
  const ambientSpots = [];
  // A STANDOFF, not just the footprint. `insideBase` covers the building and
  // one tile of margin, which was enough while the ground was flat — the first
  // mountain grew a four-course terrace six metres from the red door, so the
  // opening shot of the map was a wall of rock and the spawn had one exit.
  // Every base now gets a clear apron to fight out of.
  const STANDOFF = 9;
  const nearBase = (x, z, b) =>
    x > b.x - STANDOFF && x < b.x + BASE_SIZE.x + STANDOFF
    && z > b.z - STANDOFF && z < b.z + BASE_SIZE.z + STANDOFF;
  // The power-up zones get the same treatment as the bases, and for the same
  // reason: the gym is a stepped deck, and a stepped deck built on top of a
  // four-course terrace is a deck with a cliff on one side. Terrain keeps off
  // their footprint plus an apron, so both zones always stand on flat ground.
  const zones = Object.values(powerZoneCentres());
  const clearOfBases = (x, z) =>
    !nearBase(x, z, redBase) && !nearBase(x, z, blueBase)
    && !zones.some((c) => Math.abs(x - c.x) <= ZONE_HALF + 5
                       && Math.abs(z - c.z) <= ZONE_HALF + 5);

  if (map.terrain === 'terraces') {
    // A mountain saddle: two RIDGE LINES, and the height at any tile steps down
    // with its distance from the nearer line. The first cut measured distance
    // to two POINTS, and from above that is two circular mesas — a pair of
    // donuts, not a mountain, because a point falls away equally in every
    // direction and a ridge does not. The floor of the division is what makes
    // the fall-off terraced rather than smooth, and terraced is what makes it
    // climbable at all.
    //
    // Both lines are laid ACROSS the red-to-blue diagonal rather than along
    // it, so the mountain is something the attack has to cross instead of a
    // wall down the middle of the route.
    // The endpoints are quoted in 64-tile coordinates (where they were drawn)
    // and mapped onto the real map with atFraction — a ridge that ended at
    // x=60 was meant to end near the far edge, not at a fixed 60 metres.
    const F = (v) => atFraction(v);
    const ridges = [
      { ax: F(rng.rangeI(6, 16)),  az: F(rng.rangeI(30, 42)),
        bx: F(rng.rangeI(30, 42)), bz: F(rng.rangeI(4, 14)) },
      { ax: F(rng.rangeI(22, 34)), az: F(rng.rangeI(50, 60)),
        bx: F(rng.rangeI(50, 60)), bz: F(rng.rangeI(22, 34)) },
    ];
    const distToSeg = (px, pz, s) => {
      const vx = s.bx - s.ax, vz = s.bz - s.az;
      const len2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((px - s.ax) * vx + (pz - s.az) * vz) / len2));
      return Math.hypot(px - (s.ax + t * vx), pz - (s.az + t * vz));
    };
    for (let x = 0; x < WORLD_SIZE.x; x++) {
      for (let z = 0; z < WORLD_SIZE.z; z++) {
        if (!clearOfBases(x, z)) continue;
        if (Math.abs(x - cx) < 6 && Math.abs(z - cz) < 6) continue;  // keep the summit approach open
        const d = Math.min(...ridges.map((s) => distToSeg(x, z, s)));
        const h = Math.max(0, 4 - Math.floor(d / 3.2));
        for (let y = 1; y <= h; y++) grid.set(x, y, z, VOX.ROCK);
        if (h >= 3) grid.set(x, h, z, VOX.ICE);   // ice glazes the high terraces
      }
    }

  } else if (map.terrain === 'rink') {
    // One rectangular rink pad in the middle of a park, ringed by dasher
    // boards two courses high, with a gate in each of the four sides — a pad
    // you cannot leave is a pen, and the flag has to be able to cross it.
    const pad = { x0: 14, z0: 14, x1: WORLD_SIZE.x - 15, z1: WORLD_SIZE.z - 15 };
    grid.fillBox(pad.x0, 0, pad.z0, pad.x1, 0, pad.z1, VOX.RINK);
    const gateX = Math.floor((pad.x0 + pad.x1) / 2);
    const gateZ = Math.floor((pad.z0 + pad.z1) / 2);
    const isGate = (x, z) =>
      (Math.abs(x - gateX) <= 2 && (z === pad.z0 || z === pad.z1))
      || (Math.abs(z - gateZ) <= 2 && (x === pad.x0 || x === pad.x1));
    for (let x = pad.x0; x <= pad.x1; x++) {
      for (const z of [pad.z0, pad.z1]) {
        if (isGate(x, z)) continue;
        grid.set(x, 1, z, VOX.BOARDS); grid.set(x, 2, z, VOX.BOARDS);
      }
    }
    for (let z = pad.z0; z <= pad.z1; z++) {
      for (const x of [pad.x0, pad.x1]) {
        if (isGate(x, z)) continue;
        grid.set(x, 1, z, VOX.BOARDS); grid.set(x, 2, z, VOX.BOARDS);
      }
    }

  } else if (map.terrain === 'floes') {
    // Pressure ridges: lines of ice forced up where two floes have driven into
    // each other. One course along most of their length with the occasional
    // second block, so they read as broken rather than as walls.
    const ridges = perArea(rng.rangeI(5, 8));
    for (let r = 0; r < ridges; r++) {
      let x = rng.rangeI(8, WORLD_SIZE.x - 9);
      let z = rng.rangeI(8, WORLD_SIZE.z - 9);
      const alongX = rng.rangeF(0, 1) < 0.5;
      const len = rng.rangeI(10, 22);
      for (let i = 0; i < len; i++) {
        if (clearOfBases(x, z) && !(Math.abs(x - cx) < 5 && Math.abs(z - cz) < 5)) {
          // IGLOO, not ICE. A pressure ridge made of the same smooth blue pan
          // it is pushed up out of has no silhouette against it — the first
          // arctic render was a flat pale field with faint pale lumps on it.
          // Block-ice is whiter, and its sawn-block texture gives the ridge an
          // edge to catch the low sun on.
          grid.set(x, 1, z, VOX.IGLOO);
          if (rng.rangeF(0, 1) < 0.35) grid.set(x, 2, z, VOX.ICE);
        }
        if (alongX) { x += 1; z += rng.rangeI(-1, 1); }
        else        { z += 1; x += rng.rangeI(-1, 1); }
        if (x < 3 || z < 3 || x >= WORLD_SIZE.x - 3 || z >= WORLD_SIZE.z - 3) break;
      }
    }
  }

  return { ambientSpots };
}

// Where ambient life stands. Runs at the very END of generateWorld, not inside
// buildTerrain: the first cut placed penguins against the terrain alone, and
// then cover, the centre and the bases were built on top of them, so a
// colony's worth of birds ended up standing inside stone walls. "Is this tile
// free" is only answerable once the world is finished.
function placeAmbient(grid, rng, map, { redBase, blueBase }) {
  const spots = [];
  if (!map.ambient) return spots;
  // `prefer: 'high'` asks for a crowd that lives UP the map rather than on the
  // flat. A goat standing on the one terrace nobody can reach is the whole
  // joke of putting goats on a mountain, and it is also the only way the crowd
  // says "altitude" rather than "some animals".
  const wantsHigh = map.ambient.prefer === 'high';
  // Both numbers scale with the map. Scaling only the head-count would pack
  // the same five gaggles tighter; scaling only the clusters would spread the
  // same birds one to a field. A crowd is a density AND a distribution.
  const total = perArea(map.ambient.count);
  const clusters = perArea(map.ambient.clusters);
  const per = Math.ceil(total / clusters);
  for (let c = 0; c < clusters; c++) {
    // Try several anchors per cluster — a colony centred on the middle of a
    // pressure ridge would otherwise place nothing at all and quietly halve
    // the population. The first two thirds of the attempts on a `high` map
    // insist the anchor itself is up a terrace; the rest will take anything,
    // because a cluster that places nobody is worse than a cluster on the flat.
    for (let attempt = 0; attempt < 18; attempt++) {
      const hx = rng.rangeI(8, WORLD_SIZE.x - 9);
      const hz = rng.rangeI(8, WORLD_SIZE.z - 9);
      const strict = wantsHigh && attempt < 12;
      if (strict && standY(grid, hx, hz) < 2) continue;
      const got = [];
      for (let i = 0; i < per * 4 && got.length < per; i++) {
        const x = hx + rng.rangeI(-4, 4);
        const z = hz + rng.rangeI(-4, 4);
        if (x < 2 || z < 2 || x >= WORLD_SIZE.x - 2 || z >= WORLD_SIZE.z - 2) continue;
        if (insideBase(x, z, redBase) || insideBase(x, z, blueBase)) continue;
        const y = ledgeY(grid, x, z);
        if (y < 0) continue;
        if (strict && y < 2) continue;
        if (got.some((g) => g.x === x + 0.5 && g.z === z + 0.5)) continue;
        got.push({ x: x + 0.5, y, z: z + 0.5 });
      }
      if (got.length) { spots.push(...got); break; }
    }
  }
  return spots;
}

// ---------------------------------------------------------------------------
// Power-up zones
// ---------------------------------------------------------------------------
// Bryan asked that each power-up have "its own identifiable voxel area in the
// map" — not a scatter. So each one gets a LANDMARK: a built place you can
// name and point at from across the arena ("meet me at the gym"), the same job
// the centre hill does for the chicken.
//
// Where: the two corners the bases do not use. Red and blue sit on one
// diagonal, so the gym and the dairy take the other one, mirrored through the
// same axis the bases are mirrored through. That is what makes them FAIR —
// each zone is within a metre of the same distance from both bases, so
// neither team spawns closer to a buff.
//
// Shape: both are the same two-course dais, because the step out of one has to
// be the step out of the other — one voxel per course, exactly like every
// other rise in the game (see the INVARIANTS note in mapSpec.js). What differs
// is everything a player reads at 40 m: the gym is DARK and VERTICAL (a stone
// squat rack and a loaded barbell), the dairy is BRIGHT and LOW (a ring of
// yellow cheese wheels round a creamery floor). Silhouette first, colour
// second — art/knowledge/craft/silhouette-readability.md.
export const ZONE_HALF = 4;          // the dais + its apron: a 9x9 footprint
export const ZONE_DECK_TOP = 3;      // world Y of the surface you stand on

// Pure function of the map size so the terrain pass, the scatterers and the
// tests can all ask where the zones are without generating a world.
export function powerZoneCentres(size = WORLD_SIZE) {
  // ~11.5% in from the corner: far enough that the dais never touches the
  // edge fog, close enough that it is unmistakably "the far corner".
  const inset = Math.round(size.x * 0.115);
  return {
    gym:   { x: size.x - 1 - inset, z: inset },
    dairy: { x: inset,              z: size.z - 1 - inset },
  };
}

// `margin` exists because most of what this guard rejects is an ORIGIN, not a
// tile: buildCover() draws walls up to five tiles long from the point it is
// handed, so a wall that starts one tile outside the zone still lands a stone
// block against the gym's dais. Callers that place a single tile pass 0; ones
// that place a shape pass its longest reach.
export function insideZone(x, z, zones, margin = 0) {
  if (!zones) return false;
  const r = ZONE_HALF + margin;
  for (const zn of Object.values(zones)) {
    if (Math.abs(x - zn.x) <= r && Math.abs(z - zn.z) <= r) return true;
  }
  return false;
}

// Where the pickup floats: dead centre of the dais, half a metre proud of the
// deck — the same offset the chicken uses over the centre hill, so the two
// pickups read as the same KIND of thing.
export function zoneSpawn(zone) {
  return { x: zone.x + 0.5, y: ZONE_DECK_TOP + 0.5, z: zone.z + 0.5 };
}

function buildPowerZones(grid) {
  const c = powerZoneCentres();
  const gym   = { id: 'gym',   powerUp: 'protein-shake', name: 'THE GYM',   ...c.gym };
  const dairy = { id: 'dairy', powerUp: 'cheese-wheel',  name: 'THE DAIRY', ...c.dairy };
  buildGym(grid, gym.x, gym.z);
  buildDairy(grid, dairy.x, dairy.z);
  return { gym, dairy };
}

// The shared dais. Two courses, seven tiles then five, so you climb it a metre
// at a time from any side and the top is a clean 5x5 platform.
function buildDais(grid, x, z, vox) {
  // Wipe the column first. Terrain keeps its distance, but cover, ridges and
  // the odd patch can all still have landed here, and a barbell resting on a
  // boulder is not a landmark, it is a mistake.
  grid.fillBox(x - ZONE_HALF, 1, z - ZONE_HALF,
               x + ZONE_HALF, WORLD_SIZE.y - 1, z + ZONE_HALF, VOX.AIR);
  grid.fillBox(x - 3, 1, z - 3, x + 3, 1, z + 3, vox);
  grid.fillBox(x - 2, 2, z - 2, x + 2, 2, z + 2, vox);
}

// THE GYM — protein shake. Wood platform, stone squat rack, loaded barbell.
// The rack's two uprights are the only tall vertical pair anywhere outside a
// base, which is the whole point: it is identifiable at range from its
// silhouette alone, before any colour resolves.
function buildGym(grid, x, z) {
  buildDais(grid, x, z, VOX.WOOD);
  // Squat rack: two uprights FOUR courses proud of the deck, joined by a bar
  // across the top. Four and not three because three tops out level with the
  // dairy's cheese stacks, and two landmarks with the same height are two
  // landmarks you cannot tell apart at the range you need to (a test measures
  // exactly this).
  for (const rz of [z - 2, z + 2]) {
    for (let y = ZONE_DECK_TOP; y <= ZONE_DECK_TOP + 3; y++) grid.set(x - 2, y, rz, VOX.STONE);
  }
  for (let bz = z - 2; bz <= z + 2; bz++) grid.set(x - 2, ZONE_DECK_TOP + 3, bz, VOX.STONE);
  // Loaded barbell lying on the far side of the deck: a bar with a plate
  // standing on each end. One voxel high, so you step over it, not around it.
  for (let bz = z - 1; bz <= z + 1; bz++) grid.set(x + 2, ZONE_DECK_TOP, bz, VOX.STONE);
  for (const pz of [z - 2, z + 2]) {
    grid.set(x + 2, ZONE_DECK_TOP,     pz, VOX.STONE);
    grid.set(x + 2, ZONE_DECK_TOP + 1, pz, VOX.STONE);
  }
}

// THE DAIRY — cheese wheel. Stone creamery floor ringed with stacked wheels.
// HAY is the brightest yellow in the palette AND it is the one voxel players
// can walk through (rapierWorld.js), so a ring of it round the deck reads as
// cheese from 40 m and can never trap the tiny player who came for it.
function buildDairy(grid, x, z) {
  buildDais(grid, x, z, VOX.STONE);
  // Wheels rolled up against the lower course — but with a GATE in the middle
  // of each of the four sides. An unbroken ring blocks the only one-voxel step
  // onto the deck: the perimeter is the lower course, the middle is the upper
  // one, so a solid ring leaves a player on the ground facing a two-voxel
  // face with nothing to stand on in between. (Hay is walk-through in the
  // physics, so in-game you would push past it — but a landmark that reads as
  // walled and is not is worse than one with four honest doors, and the
  // walkability test measures the grid, not the collider.) Same lesson as the
  // rink's dasher boards: a pad you cannot leave is a pen.
  for (let d = -3; d <= 3; d++) {
    if (d === 0) continue;   // the gate
    for (const [wx, wz] of [[x + d, z - 3], [x + d, z + 3], [x - 3, z + d], [x + 3, z + d]]) {
      grid.set(wx, 2, wz, VOX.HAY);
    }
  }
  // Four stacks two high on the deck corners — the vertical accent that stops
  // the dairy reading as a bare plinth, without giving it the gym's outline.
  for (const cx2 of [x - 2, x + 2]) {
    for (const cz2 of [z - 2, z + 2]) {
      grid.set(cx2, ZONE_DECK_TOP,     cz2, VOX.HAY);
      grid.set(cx2, ZONE_DECK_TOP + 1, cz2, VOX.HAY);
    }
  }
}

// Is anything standing on this tile above ground level? Still the right
// question for props, which want FLAT open ground and nothing else.
function occupied(grid, x, z, upTo = 3) {
  for (let y = 1; y <= upTo; y++) if (grid.get(x, y, z) !== VOX.AIR) return true;
  return false;
}

// The Y a creature's feet sit at on this tile: one above the highest solid
// voxel in the column.
//
// The old version of this was the constant 1, which is correct on a flat map
// and wrong on every other kind. On the icy mountain the terrain IS stacked
// voxels, so `y = 1` puts an animal inside the second course of a four-course
// terrace, and the "is this tile free" check — anything solid between y=1 and
// y=3 — rejected every terraced tile on the map. Between them those two lines
// meant the mountain could only ever have had a crowd on its flat ground,
// which is the one place a mountain crowd must not be.
function standY(grid, x, z) {
  for (let y = WORLD_SIZE.y - 1; y >= 1; y--) if (grid.get(x, y, z) !== VOX.AIR) return y + 1;
  return 1;
}

// Where an animal can actually STAND: the surface Y of a tile that is a real
// ledge, or -1 if it is not one.
//
// A ledge needs two things beyond a floor. Headroom, so nothing is placed in
// the middle of a wall or under an overhang; and NEIGHBOURS at roughly its own
// height, which is what separates a terrace from the top of a one-tile spire.
// Without the second test a goat happily spawns balanced on a boulder — which
// sounds charming and reads, at any distance, as a bug.
function ledgeY(grid, x, z) {
  const y = standY(grid, x, z);
  if (y + 2 >= WORLD_SIZE.y) return -1;                       // no room to stand
  for (let h = 0; h < 3; h++) if (grid.get(x, y + h, z) !== VOX.AIR) return -1;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!grid.inBounds(nx, 0, nz)) return -1;
    if (Math.abs(standY(grid, nx, nz) - y) > 1) return -1;    // a perch, not a ledge
  }
  return y;
}

// The centre feature, and the Y its top surface sits at (the slingshot spawn
// rides on the returned value, so a map that changes its profile cannot leave
// the pickup floating or buried).
function buildCentre(grid, map, cx, cz) {
  const vox = map.centre.vox;
  switch (map.centre.style) {
    case 'summit':
      // A rock summit, a course taller than the farm's knoll — this is a map
      // about high ground, so the high ground should be worth taking.
      grid.fillBox(cx - 3, 1, cz - 3, cx + 3, 1, cz + 3, vox);
      grid.fillBox(cx - 2, 2, cz - 2, cx + 2, 2, cz + 2, vox);
      grid.fillBox(cx - 1, 3, cz - 1, cx + 1, 3, cz + 1, VOX.ICE);
      return 4;
    case 'faceoff':
      // Centre ice. Dead flat — you do not put a hill in the middle of a rink
      // — so the slingshot sits on the face-off dot itself.
      grid.fillBox(cx - 3, 0, cz - 3, cx + 3, 0, cz + 3, vox);
      return 1;
    case 'berg':
      // A grounded berg: a stepped block of snow-ice with a flat top.
      grid.fillBox(cx - 2, 1, cz - 2, cx + 2, 1, cz + 2, vox);
      grid.fillBox(cx - 2, 2, cz - 1, cx + 1, 2, cz + 2, vox);
      grid.fillBox(cx - 1, 3, cz - 1, cx, 3, cz, VOX.ICE);
      return 4;
    default:
      grid.fillBox(cx - 2, 1, cz - 2, cx + 2, 1, cz + 2, vox);
      grid.fillBox(cx - 1, 2, cz - 1, cx + 1, 2, cz + 1, vox);
      return 3;
  }
}

function buildCover(grid, rng, kind, x, z) {
  switch (kind) {
    case 'pillar': {
      const h = rng.rangeI(2, 4);
      grid.fillBox(x, 1, z, x, h, z, VOX.STONE);
      break;
    }
    case 'crate': {
      const stacks = rng.rangeI(1, 2);
      grid.fillBox(x, 1, z, x + 1, stacks, z + 1, VOX.WOOD);
      break;
    }
    case 'wall': {
      const len = rng.rangeI(3, 5);
      if (rng.pick(['x', 'z']) === 'x') grid.fillBox(x, 1, z, x + len, 2, z, VOX.STONE);
      else                              grid.fillBox(x, 1, z, x, 2, z + len, VOX.STONE);
      break;
    }
    case 'spire': {
      // A rock finger: tall, one tile square, tipped with ice.
      const h = rng.rangeI(3, 6);
      grid.fillBox(x, 1, z, x, h - 1, z, VOX.ROCK);
      grid.set(x, h, z, VOX.ICE);
      break;
    }
    case 'iceWall': {
      // A serac wall — head height, and translucent, so it is cover you can
      // half see through and half trust.
      const len = rng.rangeI(3, 6);
      if (rng.pick(['x', 'z']) === 'x') grid.fillBox(x, 1, z, x + len, 2, z, VOX.ICE);
      else                              grid.fillBox(x, 1, z, x, 2, z + len, VOX.ICE);
      break;
    }
    case 'boulder': {
      grid.fillBox(x, 1, z, x + 1, 1, z + 1, VOX.ROCK);
      grid.set(x, 2, z, VOX.ROCK);
      break;
    }
    case 'berg': {
      const w = rng.rangeI(2, 3);
      grid.fillBox(x, 1, z, x + w, 1, z + w, VOX.IGLOO);
      grid.fillBox(x, 2, z, x + w - 1, 2, z + w - 1, VOX.ICE);
      break;
    }
    case 'ridge': {
      const len = rng.rangeI(4, 8);
      for (let i = 0; i < len; i++) grid.set(x + i, 1, z + (i % 2), VOX.ICE);
      break;
    }
    case 'bench': {
      const len = rng.rangeI(3, 5);
      const alongX = rng.pick(['x', 'z']) === 'x';
      for (let i = 0; i < len; i++) {
        grid.set(alongX ? x + i : x, 1, alongX ? z : z + i, VOX.WOOD);
      }
      break;
    }
    case 'planter': {
      // A stone planter with a conifer in it — the park's answer to a crate.
      grid.fillBox(x, 1, z, x + 1, 1, z + 1, VOX.STONE);
      grid.set(x, 2, z, VOX.PINE);
      grid.set(x + 1, 2, z + 1, VOX.PINE);
      break;
    }
  }
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
  // The lane's position is a FRACTION of the map, not a fixed metre count: on
  // a 64-wide map it ran at z=25 from x=4 to x=59, which is "a bit north of
  // centre, right across the field". Hard-coding 25 and 59 onto an 80-wide map
  // would have left a lane that starts on time and stops 20 m short.
  trackZ: atFraction(25, WORLD_SIZE.z),
  trackX0: 4,
  trackX1: WORLD_SIZE.x - 5,
  trackWander: 1.4,     // tiles of slow drift in Z across the map's width
  trackWanderRate: 0.055,
  parkingX: Object.freeze([atFraction(12), atFraction(47)]),  // where the two tractors sit on it
  parkingApron: 2,      // churned turn-around radius around a parked tractor
  holeFill: 6,          // neighbours needed to swallow a bare tile stranded
                        // inside a path (see closeWearHoles)
  scuffs: perArea(14),  // loose scuffed patches out in the open ground
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
    tractorParking.push({ x: px, z: pz,
      yaw: px < WORLD_SIZE.x / 2 ? Math.PI / 2 : -Math.PI / 2 });
  }

  // 6. Loose scuffed patches out in the open — the skirmishes that did not
  //    happen on a path. Without these every worn tile sits on a route and
  //    the wear reads as painted-on level design.
  for (let i = 0; i < WEAR.scuffs; i++) {
    const x = rng.rangeI(6, WORLD_SIZE.x - 7), z = rng.rangeI(6, WORLD_SIZE.z - 7);
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

// ---------------------------------------------------------------------------
// Bases
// ---------------------------------------------------------------------------
// Four architectures, one contract. Whatever a base looks like it must:
//   * have its floor at y=0, flush with the ground outside, so walking in is
//     walking (the 1.0 m threshold step is what made Bryan say "I still can't
//     auto climb", and raising the floor is how it came back every time);
//   * put its doorway exactly where barnDoorway() says, facing mid-map, at
//     least 3 wide and 2 tall;
//   * put a flag stand on the floor at the centre of its footprint;
//   * be closed overhead, so nobody can drop into a base from above.
// Everything else — material, roof, silhouette — belongs to the map.
function buildBase(grid, ox, oz, baseVox, standVox, map) {
  const style = map?.base?.style ?? 'barn';
  if (style === 'cabin')         buildCabin(grid, ox, oz, baseVox);
  else if (style === 'pavilion') buildPavilion(grid, ox, oz, baseVox);
  else if (style === 'igloo')    buildIgloo(grid, ox, oz, baseVox);
  else                           buildBarn(grid, ox, oz, baseVox);

  // Flag stand, on the floor at the centre of the footprint. Shared by every
  // style, because the CTF rules measure from it.
  const cx = ox + Math.floor(BASE_SIZE.x / 2);
  const cz = oz + Math.floor(BASE_SIZE.z / 2);
  grid.set(cx, 1, cz, standVox);
}

// Cut the doorway (and its frame) through whichever wall faces mid-map.
// Shared, so no style can put its door somewhere the sign and the pathing
// do not expect.
function cutDoorway(grid, ox, oz, frameVox) {
  const { wallX, midZ } = barnDoorway(ox, oz);
  for (let z = midZ - 1; z <= midZ + 1; z++) {
    grid.set(wallX, 1, z, VOX.AIR);
    grid.set(wallX, 2, z, VOX.AIR);
  }
  if (frameVox == null) return;
  for (const jz of [midZ - 2, midZ + 2]) {
    grid.set(wallX, 1, jz, frameVox);
    grid.set(wallX, 2, jz, frameVox);
  }
  for (let z = midZ - 2; z <= midZ + 2; z++) grid.set(wallX, 3, z, frameVox);
}

// Four walls, y=1..3, on the footprint's perimeter.
function boxWalls(grid, ox, oz, vox, top = 3) {
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    for (let y = 1; y <= top; y++) {
      grid.set(x, y, oz, vox);
      grid.set(x, y, oz + BASE_SIZE.z - 1, vox);
    }
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let y = 1; y <= top; y++) {
      grid.set(ox, y, z, vox);
      grid.set(ox + BASE_SIZE.x - 1, y, z, vox);
    }
  }
}

// -- Barn (snow-farm) -------------------------------------------------------
function buildBarn(grid, ox, oz, baseVox) {
  // Painted plank floor REPLACES the y=0 ground voxel rather than stacking on
  // it, so the threshold is dead flat with the snow outside.
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, baseVox);
  boxWalls(grid, ox, oz, baseVox);
  cutDoorway(grid, ox, oz, VOX.WOOD);

  // WOOD corner posts — breaks up the flat painted walls and frames the
  // silhouette.
  for (let y = 1; y <= 3; y++) {
    grid.set(ox, y, oz, VOX.WOOD);
    grid.set(ox + BASE_SIZE.x - 1, y, oz, VOX.WOOD);
    grid.set(ox, y, oz + BASE_SIZE.z - 1, VOX.WOOD);
    grid.set(ox + BASE_SIZE.x - 1, y, oz + BASE_SIZE.z - 1, VOX.WOOD);
  }
  // PITCHED ROOF — WOOD rafters with translucent GLASS between, so the barn
  // is closed to bodies and bullets but you can still see the sky through it.
  const midX = ox + Math.floor(BASE_SIZE.x / 2);
  const halfWidth = Math.floor(BASE_SIZE.x / 2);
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let step = 0; step < halfWidth; step++) {
      const y = 4 + step;
      grid.set(midX - halfWidth + step, y, z, VOX.WOOD);
      grid.set(midX + halfWidth - step, y, z, VOX.WOOD);
      for (let fx = midX - halfWidth + step + 1; fx <= midX + halfWidth - step - 1; fx++) {
        grid.set(fx, y, z, VOX.GLASS);
      }
    }
    grid.set(midX, 4 + halfWidth, z, VOX.WOOD);
  }
  // Hay loft in both gable ends, so the barn reads as a working farm building
  // rather than an empty painted shell.
  for (const gz of [oz, oz + BASE_SIZE.z - 1]) {
    for (let hx = midX - 1; hx <= midX + 1; hx++) grid.set(hx, 4, gz, VOX.HAY);
  }
}

// -- Cabin (icy-mountain) ---------------------------------------------------
// A climbers' hut: log walls, a shallow snow-loaded roof, and a stone chimney.
// Deliberately squatter than the barn — at altitude you build low.
function buildCabin(grid, ox, oz, baseVox) {
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, VOX.WOOD);
  boxWalls(grid, ox, oz, VOX.WOOD);
  // Team colour banded through the log courses rather than painted over all
  // of them: a solid team-coloured cabin stops reading as timber.
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    grid.set(x, 2, oz, baseVox);
    grid.set(x, 2, oz + BASE_SIZE.z - 1, baseVox);
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    grid.set(ox, 2, z, baseVox);
    grid.set(ox + BASE_SIZE.x - 1, 2, z, baseVox);
  }
  cutDoorway(grid, ox, oz, VOX.ROCK);

  // Shallow pitched roof, two courses, snow-capped. Lower than the barn's, so
  // the two buildings are different shapes on the skyline and not one shape in
  // two colours.
  const midX = ox + Math.floor(BASE_SIZE.x / 2);
  const half = Math.floor(BASE_SIZE.x / 2);
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let step = 0; step < half; step += 2) {
      const y = 4 + step / 2;
      for (let fx = midX - half + step; fx <= midX + half - step; fx++) {
        grid.set(fx, y, z, fx === midX - half + step || fx === midX + half - step
          ? VOX.WOOD : VOX.GLASS);
      }
    }
    grid.set(midX, 4 + Math.ceil(half / 2), z, VOX.ICE);   // snow along the ridge
  }
  // Stone chimney up one gable end.
  const chx = ox + 1, chz = oz + 1;
  for (let y = 1; y <= 6; y++) grid.set(chx, y, chz, VOX.ROCK);
}

// -- Pavilion (central-park-rink) -------------------------------------------
// A rink-side team box: dasher boards for walls, a bench along the back, and
// a glass roof so the dusk sky is still overhead while you are in it.
function buildPavilion(grid, ox, oz, baseVox) {
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, VOX.PAVER);
  boxWalls(grid, ox, oz, VOX.BOARDS);
  // Team colour as the kickplate course, which is exactly where a real rink
  // puts its one band of colour.
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    grid.set(x, 1, oz, baseVox);
    grid.set(x, 1, oz + BASE_SIZE.z - 1, baseVox);
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    grid.set(ox, 1, z, baseVox);
    grid.set(ox + BASE_SIZE.x - 1, 1, z, baseVox);
  }
  cutDoorway(grid, ox, oz, VOX.BOARDS);
  // Players' bench along the far wall.
  const benchZ = oz + BASE_SIZE.z - 2;
  for (let x = ox + 2; x < ox + BASE_SIZE.x - 2; x++) grid.set(x, 1, benchZ, VOX.WOOD);
  // Flat glass canopy on a board frame.
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    for (let z = oz; z < oz + BASE_SIZE.z; z++) {
      const edge = x === ox || z === oz
        || x === ox + BASE_SIZE.x - 1 || z === oz + BASE_SIZE.z - 1;
      grid.set(x, 4, z, edge ? VOX.BOARDS : VOX.GLASS);
    }
  }
  // Two lamp standards on the front corners.
  for (const lx of [ox, ox + BASE_SIZE.x - 1]) {
    for (let y = 5; y <= 6; y++) grid.set(lx, y, oz, VOX.STONE);
  }
}

// -- Igloo (arctic) ---------------------------------------------------------
// A dome of cut snow block with an entrance tunnel. The only base that is
// round, which is the whole point: at 40 m across a snow field it is
// unmistakable, and nothing else on any map has that outline.
function buildIgloo(grid, ox, oz, baseVox) {
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, VOX.IGLOO);

  const cx = ox + (BASE_SIZE.x - 1) / 2;
  const cz = oz + (BASE_SIZE.z - 1) / 2;
  // R is deliberately a little WIDER than the footprint's half-width (4.5).
  // The first cut used exactly 4.5 and the dome fell inside its own equator
  // the moment it started tapering, so by the second course there was no wall
  // at the middle of any side — a ring of open doorways with a lid on top.
  const R = 4.9;
  const H = 5.6;
  const SHELL = 0.78;   // ~1.1 voxels thick at the equator

  // One ellipsoid test decides everything, which is what keeps the shell and
  // the cavity consistent. The previous version computed a per-course radius
  // for the shell and a single flat radius for the hollow-out, and the two
  // disagreed above the third course: the hollow pass ate its own roof.
  const e = (x, y, z) => Math.hypot((x - cx) / R, (z - cz) / R, (y - 1) / H);

  for (let y = 1; y <= Math.ceil(H); y++) {
    for (let x = ox - 1; x <= ox + BASE_SIZE.x; x++) {
      for (let z = oz - 1; z <= oz + BASE_SIZE.z; z++) {
        const d = e(x, y, z);
        if (d > 1.0) continue;
        if (d > SHELL) {
          // Every third block of the second course is dyed — an igloo has no
          // natural place to take a team colour, so it gets a band of coloured
          // blocks rather than a coat of paint over the whole dome.
          grid.set(x, y, z, (y === 2 && (x + z) % 3 === 0) ? baseVox : VOX.IGLOO);
        } else {
          grid.set(x, y, z, VOX.AIR);   // the room
        }
      }
    }
  }
  // Close the crown. The ellipsoid's top course is a single tile wide and
  // leaves a hole you could drop a rocket through.
  for (let x = Math.floor(cx) - 1; x <= Math.ceil(cx) + 1; x++) {
    for (let z = Math.floor(cz) - 1; z <= Math.ceil(cz) + 1; z++) {
      grid.set(x, Math.ceil(H) + 1, z, VOX.IGLOO);
    }
  }

  // Entrance tunnel: a low passage driven THROUGH the shell and out toward
  // mid-map, roofed in block. It is most of what an igloo looks like, and it
  // is also the only way in, so it is cut last and nothing may overwrite it.
  const { wallX, midZ, nx } = barnDoorway(ox, oz);
  const innerX = Math.round(cx - nx * (R - 1.6));   // start inside the room
  for (let step = -1; step <= 4; step++) {
    const x = wallX + nx * step;
    if (nx > 0 ? x < innerX : x > innerX) continue;
    for (let z = midZ - 1; z <= midZ + 1; z++) {
      grid.set(x, 0, z, VOX.IGLOO);
      grid.set(x, 1, z, VOX.AIR);
      grid.set(x, 2, z, VOX.AIR);
      if (step >= 0) grid.set(x, 3, z, VOX.IGLOO);
    }
    if (step >= 0) {
      for (const jz of [midZ - 2, midZ + 2]) {
        grid.set(x, 1, jz, VOX.IGLOO);
        grid.set(x, 2, jz, VOX.IGLOO);
      }
    }
  }
  // Clear the run from the tunnel mouth to the flag stand, so the shell's
  // inner face cannot leave a block standing in the doorway of the room.
  const standX = ox + Math.floor(BASE_SIZE.x / 2);
  const lo = Math.min(standX, innerX), hi = Math.max(standX, innerX);
  for (let x = lo; x <= hi; x++) {
    for (let z = midZ - 1; z <= midZ + 1; z++) {
      grid.set(x, 1, z, VOX.AIR);
      grid.set(x, 2, z, VOX.AIR);
    }
  }
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
