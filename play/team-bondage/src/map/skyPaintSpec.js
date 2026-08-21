// Sky paint — PURE DATA (no THREE, no canvas) so the art rules in
// art/knowledge/ can be asserted by tests instead of only written down.
// Same pattern as groundPaintSpec.js, barnPaintSpec.js, entities/viewmodelSpec.js.
//
// Why this exists: the sky was a vertical gradient with 22 flat-white
// ellipse clusters scattered over it — and the scatter used `Math.random()`
// INSIDE the repaint, which the skybox runs 12 times a second. So every
// single frame threw the entire cloud field away and rolled a new one. That
// is not a cloud layer; it is white noise strobing at 12 Hz across the
// largest thing in the game after the ground. Nothing about it could drift,
// because nothing about it persisted for two frames running.
//
// Two more things were wrong with the old field and both are worth keeping
// on the record, because they are the kind of bug that survives review:
//
//   1. Half the clouds were UNDERGROUND. On an equirectangular strip the
//      horizon is the middle row (v = 0.5); the old band was y in
//      0.35H..0.65H, so everything past the midpoint painted cloud into the
//      lower hemisphere, where the map is. Clouds live ABOVE 0.5H, full stop.
//   2. They were one flat tone at 0.5 alpha. A shape with no value range has
//      no form — per craft/color.md, value before hue — so they read as fog
//      smears rather than as cloud, and the aerial perspective that makes a
//      sky feel deep (distant = paler, lower contrast, crowded toward the
//      horizon) was not available at all.
//
// The replacement is three PARALLAX LAYERS, each baked once into its own
// offscreen strip and then scrolled at its own rate. Nearer layers are
// bigger, higher in the sky, higher contrast, and move faster; the far bank
// hugs the horizon, is hazier, and barely moves. That speed difference IS
// the depth cue — a near cumulus visibly overtaking the far bank is what
// tells a player the sky is a place with distance in it and not a backdrop
// painted on the inside of a ball.

import { SeededRng } from '../../../../web-engine/rng/seededRng.js';

// The equirectangular strip the skybox paints. Width = 360 deg of azimuth,
// height = 180 deg of elevation, so y/H = 0 is the zenith and 0.5 is the
// horizon exactly.
export const STRIP = Object.freeze({ W: 2048, H: 1024 });

// Elevation of the horizon as a fraction of H. Not a tunable — it is where
// three's equirectUv() puts dir.y = 0. Clouds above it, ground below it.
export const HORIZON = 0.5;

// The sky gradient, as data. Stops are fractions of H (0 = zenith).
// Cool blue overhead, pale at the horizon (the haze band every cloud has to
// read against), then the sub-horizon rows nobody sees because the map is
// in front of them.
// The FARM's gradient. Since 2026-08-21 every map brings its own (mapSpec.js
// SKIES), and these five stops are farm-day's — kept here because this file is
// the sky's spec and a test asserts the two copies have not drifted. The
// painter takes a gradient as an argument now; this is only the default.
export const SKY_GRADIENT = Object.freeze([
  Object.freeze({ at: 0.00, hex: '#a8c4e0' }),   // zenith
  Object.freeze({ at: 0.35, hex: '#c8dcf5' }),
  Object.freeze({ at: 0.55, hex: '#e6ecf5' }),   // horizon haze
  Object.freeze({ at: 0.75, hex: '#8ec5ff' }),   // game sky / fog colour
  Object.freeze({ at: 1.00, hex: '#3a5a89' }),   // nadir
]);

// The game's sun, copied from game.js `sun.position.set(0.6, 1.0, 0.4)`.
// Clouds are lit from wherever this actually is — a crown on the wrong side
// of every cloud is the fastest way to make a painted sky feel pasted on.
// Locked to game.js by a test.
export const SUN_DIR = Object.freeze({ x: 0.6, y: 1.0, z: 0.4 });

// three r161, equirectUv(): u = atan2(z, x) / 2pi + 0.5, v = asin(y) / pi + 0.5,
// and the canvas row 0 is v = 1 (the zenith). Returns strip pixels.
export function sunStripXY(strip = STRIP) {
  const { x, y, z } = SUN_DIR;
  const len = Math.hypot(x, y, z);
  const u = Math.atan2(z / len, x / len) / (Math.PI * 2) + 0.5;
  const v = Math.asin(y / len) / Math.PI + 0.5;
  return { x: u * strip.W, y: (1 - v) * strip.H };
}

// The brawl animation's loop, from skybox.js. Clouds must be an order of
// magnitude slower than this or they stop being weather and start being a
// second animation competing with the fight — the queue item is literally
// "drifts SLOWER than the brawl".
export const BRAWL_CYCLE_S = 3.2;

// Three cloud banks, far to near. Draw order is this order (painter's
// algorithm), so `near` overlaps `far` and the parallax is legible.
//
//   driftPeriodS — seconds for the layer to travel a full 360 deg. Bigger =
//                  further away. The ratio between layers is the parallax.
//   band         — [top, bottom] centre-line range as a fraction of H. Every
//                  value is < HORIZON; the near bank sits highest because a
//                  closer cloud at the same altitude is nearer the zenith.
//   size         — [minWidth, maxWidth] in strip px. The strip maps 360 deg
//                  across 2048 px and the camera's 75 deg FOV covers ~427 of
//                  them on a 1920-wide screen, so a strip pixel is ~4.5
//                  screen pixels: a 180 px cloud is 810 px of sky.
//   aspect       — height as a fraction of width.
//   tone         — crown / body / shade. Three values per cloud, because a
//                  single flat tone has no form. Aerial perspective runs
//                  through the set: the far bank is DARKER and flatter (it
//                  is a silhouette against a bright horizon haze), the near
//                  bank is brighter and has the widest crown-to-shade range.
export const CLOUD_LAYERS = Object.freeze([
  Object.freeze({
    name: 'far',
    seed: 0x51c1ee,
    count: 30,
    driftPeriodS: 1900,
    // At neutral pitch a 75 deg camera on a 16:9 screen sees elevation -20
    // to +27 deg, i.e. only y = 0.35H..0.5H of the strip. That thin band ABOVE
    // THE HORIZON is the sky the player actually looks at all match; a bank
    // painted higher is a bank nobody sees without aiming at the ceiling. All
    // three bands were dropped to straddle it after the first render came back
    // with an empty horizon.
    band: Object.freeze([0.435, 0.487]),
    size: Object.freeze([54, 96]),
    aspect: 0.30,
    alpha: 0.72,
    // Hazed into the horizon: the layer thins as it approaches HORIZON so the
    // bank dissolves rather than stopping on a line. Gentle — the first cut
    // faded to 0.10 and erased the only bank the player sees at neutral pitch.
    hazeFade: 0.45,
    tone: Object.freeze({ crown: '#dfeaf7', body: '#c0d2e9', shade: '#a8bed8' }),
  }),
  Object.freeze({
    name: 'mid',
    seed: 0x3d0cd5,
    count: 14,
    driftPeriodS: 900,
    band: Object.freeze([0.375, 0.452]),
    size: Object.freeze([96, 148]),
    aspect: 0.34,
    alpha: 0.84,
    hazeFade: false,
    tone: Object.freeze({ crown: '#eef6ff', body: '#d3e3f6', shade: '#a2bad6' }),
  }),
  Object.freeze({
    name: 'near',
    seed: 0x0eab17,
    count: 7,
    driftPeriodS: 420,
    band: Object.freeze([0.290, 0.395]),
    size: Object.freeze([158, 224]),
    aspect: 0.38,
    alpha: 0.94,
    hazeFade: false,
    // Never pure white (hand-drawn.md ceiling is #f6f1e6-ish); #f9fcff is a
    // cool near-white that still leaves the sun's specular room to be the
    // brightest thing on the strip.
    tone: Object.freeze({ crown: '#f9fcff', body: '#dfeafa', shade: '#a3bcda' }),
  }),
]);

// A cumulus has a FLAT BASE and a billowed top — that asymmetry is the whole
// silhouette, and it is what stops a cluster of ellipses reading as a blob.
// These numbers describe one cloud's puff cluster.
export const CLOUD_FORM = Object.freeze({
  basePuffs: Object.freeze([4, 6]),   // puffs sitting along the flat base
  crownPuffs: Object.freeze([1, 2]),  // billows riding ON the tallest one
  // Each base puff's height follows a shallow arc across the cloud (tallest
  // near the middle) so the top line rises and falls instead of being a row
  // of equal bumps.
  profileMin: 0.44,
  profilePower: 0.62,
  // Per-element wobble, per hand-drawn.md: no two puffs share a width ratio
  // or a tilt, or the cloud reads as machine output.
  widthRatio: Object.freeze([1.30, 1.95]),
  jitter: 0.16,
  tilt: 0.22,                         // radians
  // How far the crown highlight is pushed toward the sun, and the shade
  // slab away from it, as a fraction of the cloud's height.
  //
  // Both started nearly three times bigger and the 1:1 render was unambiguous
  // about it: an offset that large stops reading as a lit side and starts
  // reading as a DROP SHADOW behind a sticker — a hard-edged blue crescent
  // detached from the cloud it belongs to. And the crown pass shrinks every
  // puff, so at a big offset the little billows detached into separate white
  // BUBBLES perched on the cloud instead of a continuous lit cap. Shading is
  // a turn of the surface: it has to stay in contact with the form.
  crownOffset: 0.16,
  shadeOffset: 0.09,
  shadeDrop: 0.20,     // and mostly DOWNWARD — a cumulus's dark is its base
  crownShrink: 0.84,
});

// Deterministic cloud field for one layer. Pure data — no canvas, no THREE —
// so a test can assert where the clouds are without a renderer, and so the
// same seed paints the same sky on every peer and every reload.
//
// Returns clouds with `baseY` (the flat underside, strip px) and puffs
// positioned relative to (x, baseY), y NEGATIVE = up.
export function cloudField(layer, strip = STRIP) {
  const rng = new SeededRng(layer.seed);
  const sun = sunStripXY(strip);
  const clouds = [];

  for (let i = 0; i < layer.count; i++) {
    // Spread across the full 360 deg on an even lattice, then jitter within
    // the cell: pure random placement clumps and leaves bald azimuths, and a
    // bald azimuth on a drifting layer is a long stretch of empty sky.
    const cell = strip.W / layer.count;
    const x = (i + 0.5) * cell + rng.rangeF(-0.38, 0.38) * cell;
    const w = rng.rangeF(layer.size[0], layer.size[1]);
    const h = w * layer.aspect * rng.rangeF(0.86, 1.14);
    const baseY = rng.rangeF(layer.band[0], layer.band[1]) * strip.H;

    // Which side the sun crown goes on: the shortest way round the strip to
    // the sun's azimuth. A cloud to the sun's left is lit on its right.
    let d = sun.x - x;
    if (d > strip.W / 2) d -= strip.W;
    if (d < -strip.W / 2) d += strip.W;
    const lit = d >= 0 ? 1 : -1;

    const n = rng.rangeI(CLOUD_FORM.basePuffs[0], CLOUD_FORM.basePuffs[1]);
    const puffs = [];
    let tallest = { dx: 0, ry: 0 };
    for (let p = 0; p < n; p++) {
      const u = (p + 0.5) / n;
      const arc = Math.pow(Math.sin(u * Math.PI), CLOUD_FORM.profilePower);
      const profile = CLOUD_FORM.profileMin + (1 - CLOUD_FORM.profileMin) * arc;
      const ry = h * 0.5 * profile * rng.rangeF(1 - CLOUD_FORM.jitter, 1 + CLOUD_FORM.jitter);
      const rx = ry * rng.rangeF(CLOUD_FORM.widthRatio[0], CLOUD_FORM.widthRatio[1]);
      const dx = (u - 0.5) * w + rng.rangeF(-0.06, 0.06) * w;
      puffs.push({ dx, dy: -ry * 0.78, rx, ry, rot: rng.rangeF(-1, 1) * CLOUD_FORM.tilt, crown: false });
      if (ry > tallest.ry) tallest = { dx, ry };
    }
    // Billows riding on the tallest base puff — the part of the silhouette
    // that says "cumulus" rather than "row of hills".
    const crowns = rng.rangeI(CLOUD_FORM.crownPuffs[0], CLOUD_FORM.crownPuffs[1]);
    for (let c = 0; c < crowns; c++) {
      // Fat and only moderately lifted. A small billow hoisted high enough to
      // clear the base row entirely stops being a billow and becomes a BALL
      // sitting on the cloud — the 1:1 render had clouds wearing snowman
      // heads. It has to overlap the row it rides on and still break the top
      // line above it, which is a narrow window: keep the lift under ~1.7x the
      // base puff's radius and give the billow enough of its own to show.
      const ry = tallest.ry * rng.rangeF(0.55, 0.72);
      puffs.push({
        // Lifted clear of the base row's TOP (a base puff reaches 1.78x its
        // own ry above the base line), not merely of its centre — measured
        // from the centre a billow can sit at exactly the height of the row
        // it is supposed to be riding on, and the top line goes flat.
        dx: tallest.dx + rng.rangeF(-0.35, 0.35) * tallest.ry,
        dy: -tallest.ry * rng.rangeF(1.40, 1.65) - ry * 0.2,
        rx: ry * rng.rangeF(1.25, 1.70),
        ry,
        rot: rng.rangeF(-1, 1) * CLOUD_FORM.tilt,
        crown: true,
      });
    }

    clouds.push({ x, baseY, w, h, lit, puffs });
  }
  return clouds;
}

// Horizontal scroll of a layer at time t, in strip pixels, wrapped to [0, W).
// Used by skybox.js to blit the baked layer twice (offset - W, offset) so the
// seam is never on screen.
export function layerOffset(layer, t, strip = STRIP) {
  const px = (t / layer.driftPeriodS) * strip.W;
  return ((px % strip.W) + strip.W) % strip.W;
}
