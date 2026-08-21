// Snowfall — PURE DATA + PURE SIMULATION (no THREE, no DOM) so the art rules
// in art/knowledge/ can be asserted by tests instead of only written down.
// Same pattern as map/groundPaintSpec.js, map/skyPaintSpec.js,
// entities/viewmodelSpec.js, entities/hazardSpec.js.
//
// Why this exists. The snowfall was 400 identical 15 cm white cubes falling
// dead straight down through a 120 m box, and three separate things were
// wrong with it:
//
//   1. THE DRIFT WAS A NO-OP. The old update computed
//        const drift = Math.sin(t * 0.6 + f.driftPhase) * 0.4;
//        const targetX = f.x + drift * dt;      // <- written to a LOCAL
//      and then rendered at `targetX` while `f.x` was never assigned. So the
//      sideways offset was (a) thrown away every frame instead of
//      accumulating and (b) scaled by dt on top, i.e. ~6 mm at 60 fps. Snow
//      that falls perfectly vertically is not snow, it is rain in a vacuum —
//      and this is a whole family of bug: an integration written as a
//      position instead of a velocity reads as "nearly still" rather than as
//      "broken", so it survives review forever. Locked by a test.
//
//   2. NOTHING VARIED. One size, one material, one attitude, 400 times.
//      voxel.md's "detail through voxel count, not geometry" does not mean a
//      field of clones: a snowfall where every flake is the same object at
//      the same angle reads as a screen effect pasted over the game, because
//      real depth in a particle field comes from the flakes NOT agreeing
//      about how big they are or how fast they fall.
//
//   3. AN AXIS-ALIGNED WHITE CUBE OVER A WHITE FIELD IS INVISIBLE. This is
//      the one that matters most, and it is why "slight rotation" is not a
//      garnish. Our ground is axis-aligned voxels and our flake was an
//      axis-aligned cube, so a flake's faces caught the sun at EXACTLY the
//      same angles as the snow behind it — same light, same value, no edge.
//      Below the horizon the old snow could only be seen where it happened
//      to cross a barn. Tilt the cube off-axis and its lit face goes brighter
//      than the field while its shaded face goes darker: the flake gets a
//      value range the ground plane cannot have, and THAT is what makes it
//      read. Rotation is the contrast, not the motion.
//
// The replacement is three size classes with honest falling physics — a
// bigger flake falls faster, is pushed sideways less, and tumbles slower
// (more mass, more inertia) — under one gusting wind. The class spread is
// the depth cue: a fat flake ripping past close to the camera while the fine
// grains hang and swirl behind it is what tells the player the snow is a
// volume they are standing inside rather than a texture on the lens.

import { SeededRng } from '../../../../web-engine/rng/seededRng.js';

// -- The field -------------------------------------------------------------
// A box that slides with the player. The half-extent came DOWN from the old
// 60 m and the count went UP, because density where the camera is looking is
// the only density that exists: 400 flakes spread over 120x120x22 m is one
// flake per 790 cubic metres, and the player's whole near field (everything
// inside 8 m) then holds about seven of them. You cannot see weather at that
// rate.
export const FIELD = Object.freeze({
  halfExtentXZ: 22,     // m from the player to the wrap plane
  top: 20,              // m — respawn ceiling (barn ridges reach ~10)
  topJitter: 6,         // m of extra spread so respawns do not come in waves
  groundY: 1.0,         // top face of the y=0 ground voxel: where a flake lands
});

// The camera sits EYE.offsetY above the player position the field follows
// (player.js: camera.position.y = pos.y + 0.55). Nothing inside holdOut of
// that point is drawn at all: a flake 20 cm from the eye is 500 px of flat
// white pasted over the crosshair, which is not weather, it is a smear on the
// lens — and at this density one is in there fairly often.
export const EYE = Object.freeze({ offsetY: 0.55, holdOut: 1.5 });

// Total instances across all three classes. One InstancedMesh per class, so
// this is three draw calls and a matrix compose per flake per frame.
export const TOTAL_FLAKES = 1500;

// -- Wind ------------------------------------------------------------------
// The ground already tells the player which way the wind blows on this map:
// makeSnowTexture() carves sastrugi as bands running along a tile's texture-x,
// which groundPaintSpec maps to world +X — and sastrugi form ACROSS the wind,
// never along it. So the prevailing wind on this map runs on Z, and snow
// slanting along X would be contradicting the ground it lands on. Locked by a
// test against RIDGE_AXIS.
export const RIDGE_AXIS = Object.freeze({ x: 1, z: 0 });

export const WIND = Object.freeze({
  dir: Object.freeze({ x: 0, z: 1 }),
  // m/s of sideways push on a mid-class flake. A mid flake falls at ~2.9 m/s,
  // so 1.7 m/s across is a ~30 deg slant — visibly weather, still readable.
  // (Past ~45 deg the snow starts reading as horizontal streaks and fights
  // the crosshair.)
  base: 1.7,
  // Gusts: two sine terms whose periods do not divide each other, so the
  // field never repeats on a beat the player can learn. Both are far slower
  // than the 3.2 s brawl cycle in skyPaintSpec — weather is the slowest thing
  // on screen, or it reads as a strobe.
  gustAmp: 1.15, gustPeriodS: 9.3,
  gust2Amp: 0.45, gust2PeriodS: 3.7,
  // The wind must never fully reverse — a snowfall that swings back and forth
  // reads as a desk fan, not as weather. Asserted by a test over a full cycle.
  minSpeed: 0.1,
  // A little push on the perpendicular axis so the fall is not perfectly
  // planar. Small: this is a wobble in the wind, not a second wind.
  crossAmp: 0.4, crossPeriodS: 14.1,
});

// -- Flake classes ---------------------------------------------------------
// fine  : dry wind-borne grains — the ones that hang, swirl and never seem to
//         land. Smallest, slowest fall, MOST wind, fastest tumble.
// mid   : ordinary flakes, the body of the fall.
// fat   : wet clumped flakes, several stuck together. Biggest, fastest fall,
//         LEAST wind, slowest tumble.
//
// That ordering is the physics and it is also the art: three sizes falling at
// three speeds is parallax, three sizes falling at one speed is confetti.
//
// `size` is the cube edge in metres. three's PerspectiveCamera fov is the
// VERTICAL angle, so the game's 75 deg camera at 1080p puts 1 m at 703/d
// pixels — 70 px/m at the loop's 10 m readability bar. (Worth stating plainly
// because it is easy to get wrong in the other direction: this pass's first
// notes had it at 121 px/m by treating 75 deg as the horizontal field, which
// makes every flake sound twice as legible as it is.) So at 10 m a fat flake
// is ~12 px, a mid ~8 px and a fine grain ~5 px: a shape, not a subpixel
// shimmer. They are deliberately not bigger, because the same arithmetic run
// the other way says a 0.17 m cube one metre from your eye is 120 px, and a
// white slab that size across the crosshair is a gameplay problem — which is
// what EYE.holdOut below is for.
//
// `tones` is the part this pass had to MEASURE rather than reason about.
// A flake used to be a lit white cube, and rendered through the game's own
// rig it came out DARKER than the sky it fell across — 92-100 % of the pixels
// the old snowfall touched, it darkened, by a mean of 28-56 levels. Snow that
// darkens what it lands on is not snow, it is dirt on the lens, and that is
// exactly what it looked like: grey specks over a pale sky.
//
// The cause is the light rig. game.js hangs a HemisphereLight(sky 0x9fd7ff,
// GROUND 0x2a4a24, 0.55) over the map — that ground colour is a dark green
// left over from when this was a grass map — and a particle above eye level
// is seen from BELOW, so every flake in the sky was showing the face the
// hemisphere paints with a dead lawn.
//
// So a flake is not lit any more: it is PAINTED, unlit, three tones baked
// into its faces, exactly the way the ground tiles are painted (crest /
// field / hollow in groundPaintSpec, where "snow's shade is BLUE, not grey").
// Opposite faces share a tone, so a cube seen from any corner shows one crest
// face, one body face and one shade face — which means a flake always has a
// face BRIGHTER than the snow field behind it and a face DARKER than the pale
// sky above it, whichever way it happens to be tumbling. That is the whole
// visibility argument, and it is why the tumble and the tones are one idea
// rather than two.
export const FLAKE_CLASSES = Object.freeze([
  Object.freeze({
    name: 'fine',
    share: 0.46,
    size: 0.070,
    fall: Object.freeze([1.5, 2.3]),
    windGain: 1.4,
    spin: Object.freeze([0.30, 0.70]),   // rad/s per axis
    swayAmp: 0.55, swayRate: Object.freeze([0.8, 1.6]),
    tones: Object.freeze({ crest: '#f2f8ff', body: '#dbe8f8', shade: '#b9d1e8' }),
    opacity: 0.70,
  }),
  Object.freeze({
    name: 'mid',
    share: 0.35,
    size: 0.120,
    fall: Object.freeze([2.4, 3.4]),
    windGain: 1.0,
    spin: Object.freeze([0.18, 0.42]),
    swayAmp: 0.30, swayRate: Object.freeze([0.6, 1.1]),
    tones: Object.freeze({ crest: '#f8fcff', body: '#dceafa', shade: '#adc9e4' }),
    opacity: 0.88,
  }),
  Object.freeze({
    name: 'fat',
    share: 0.19,
    size: 0.170,
    fall: Object.freeze([3.6, 5.0]),
    windGain: 0.68,
    spin: Object.freeze([0.08, 0.22]),
    swayAmp: 0.14, swayRate: Object.freeze([0.4, 0.8]),
    tones: Object.freeze({ crest: '#fdfeff', body: '#d8e7f8', shade: '#9dbcda' }),
    opacity: 0.97,
  }),
]);

// Instances per class, exact — the remainder lands on the last class so the
// totals always add up to TOTAL_FLAKES.
export function classCounts(total = TOTAL_FLAKES) {
  const out = FLAKE_CLASSES.map((c) => Math.floor(total * c.share));
  out[out.length - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

// -- Wind field ------------------------------------------------------------
// Metres/second, as a world vector. A pure function of time: every peer that
// agrees about the clock agrees about the weather.
export function windAt(t) {
  const gust = WIND.base
    + Math.sin((t / WIND.gustPeriodS) * Math.PI * 2) * WIND.gustAmp
    + Math.sin((t / WIND.gust2PeriodS) * Math.PI * 2 + 1.7) * WIND.gust2Amp;
  const speed = Math.max(WIND.minSpeed, gust);
  const cross = Math.sin((t / WIND.crossPeriodS) * Math.PI * 2) * WIND.crossAmp;
  // The perpendicular of dir in XZ is (-dir.z, dir.x).
  return {
    x: WIND.dir.x * speed + -WIND.dir.z * cross,
    z: WIND.dir.z * speed + WIND.dir.x * cross,
  };
}

// -- The field itself ------------------------------------------------------
// Seeded, so the preview page and the tests see the same snowfall the game
// does and a render can be compared frame to frame.
export function makeField(seed = 0x5106f, total = TOTAL_FLAKES) {
  const counts = classCounts(total);
  const rng = new SeededRng((seed >>> 0) || 1);
  const flakes = [];
  for (let ci = 0; ci < FLAKE_CLASSES.length; ci++) {
    const cls = FLAKE_CLASSES[ci];
    const r = rng.child(cls.name);
    for (let i = 0; i < counts[ci]; i++) {
      flakes.push({
        cls: ci, slot: i,
        x: (r.next() * 2 - 1) * FIELD.halfExtentXZ,
        y: FIELD.groundY + r.next() * (FIELD.top - FIELD.groundY),
        z: (r.next() * 2 - 1) * FIELD.halfExtentXZ,
        fall: cls.fall[0] + r.next() * (cls.fall[1] - cls.fall[0]),
        // Every flake starts at its own attitude. A field of cubes that all
        // share the world's axes is a field of cubes nobody can see (see the
        // header): the tilt IS the contrast against the ground plane.
        rx: r.next() * Math.PI * 2, ry: r.next() * Math.PI * 2, rz: r.next() * Math.PI * 2,
        sx: spinRate(r, cls), sy: spinRate(r, cls), sz: spinRate(r, cls),
        swayPhase: r.next() * Math.PI * 2,
        swayRate: cls.swayRate[0] + r.next() * (cls.swayRate[1] - cls.swayRate[0]),
      });
    }
  }
  return flakes;
}

function spinRate(r, cls) {
  const mag = cls.spin[0] + r.next() * (cls.spin[1] - cls.spin[0]);
  return r.next() < 0.5 ? -mag : mag;
}

// -- One simulation step ---------------------------------------------------
// Mutates the flake. `px`/`pz` is the player, which the field follows.
//
// The horizontal move is INTEGRATED into f.x / f.z (that is the bug in the
// header) and the field WRAPS rather than teleporting: the old code re-rolled
// a flake's x and z the moment the player walked past it, which at this
// density would pop flakes into existence a couple of metres in front of the
// camera. Wrapping by a full 2 x halfExtent keeps every flake's offset from
// its neighbours intact, so the field slides under the player instead of
// re-scattering.
// `solidAt(x, y, z)` is an optional voxel test in world units. Snow that
// falls straight through a barn roof was survivable while there were 400
// flakes in a 120 m box and you could barely see them; at 32x that density it
// is snowing indoors, so a flake now LANDS on whatever is under it.
export function stepFlake(f, dt, t, px = 0, pz = 0, rand = Math.random, solidAt = null) {
  const cls = FLAKE_CLASSES[f.cls];
  const wind = windAt(t);
  const sway = Math.sin(t * f.swayRate + f.swayPhase) * cls.swayAmp;

  f.y -= f.fall * dt;
  f.x += (wind.x * cls.windGain + -WIND.dir.z * sway) * dt;
  f.z += (wind.z * cls.windGain + WIND.dir.x * sway) * dt;

  f.rx += f.sx * dt; f.ry += f.sy * dt; f.rz += f.sz * dt;

  // Landed: back to the ceiling somewhere new. This is the ONLY teleport, and
  // it happens 20 m over the player's head where nothing can see it.
  if (f.y <= FIELD.groundY
      || (solidAt && solidAt(Math.floor(f.x), Math.floor(f.y), Math.floor(f.z)))) {
    f.y = FIELD.top + rand() * FIELD.topJitter;
    f.x = px + (rand() * 2 - 1) * FIELD.halfExtentXZ;
    f.z = pz + (rand() * 2 - 1) * FIELD.halfExtentXZ;
    return f;
  }

  // Wrap the sliding box.
  const span = FIELD.halfExtentXZ * 2;
  while (f.x - px > FIELD.halfExtentXZ) f.x -= span;
  while (px - f.x > FIELD.halfExtentXZ) f.x += span;
  while (f.z - pz > FIELD.halfExtentXZ) f.z -= span;
  while (pz - f.z > FIELD.halfExtentXZ) f.z += span;
  return f;
}
