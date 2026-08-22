// Turns a map's BACKDROPS entry (mapSpec.js) into geometry, as pure data.
//
// Everything out of bounds is an axis-aligned BOX that has then been yawed to
// face the arena — towers, tree wedges, mountain steps, pressure ridges,
// fence rails, all of it. One primitive means the whole backdrop merges into a
// single buffer and ships as ONE draw call (entities/mapBackdrop.js), which is
// the only budget available: the target machine is a locked-down corporate
// laptop and this is scenery, not gameplay.
//
// No THREE here, and no voxels. Boxes are emitted in world metres and never
// touch the VoxelGrid, which is what makes the backdrop unreachable for free —
// rapierWorld.js builds every collider in the game from the grid alone, so
// there is no code path by which one of these can become solid.
//
// Two hard guarantees, both asserted in backdrop.test.js:
//   * nothing intersects the playfield inflated by BACKDROP.PLAY_MARGIN, so a
//     player at the map's corner is still metres clear of the nearest scenery;
//   * nothing sits closer to mid-map than BACKDROP.MIN_RADIUS, which is well
//     outside the corner distance, so the backdrop can never occlude the arena
//     or an enemy standing in it.

import { SeededRng } from '../rng/seededRng.js';
import { WORLD_SIZE } from './voxelWorldGen.js';
import { getBackdrop, getSky } from './mapSpec.js';

const TAU = Math.PI * 2;

export const BACKDROP = Object.freeze({
  // Ground level. Voxel y=0 spans world [0, 1], so everything out here stands
  // on y=1 exactly like a prop inside the map does.
  GROUND_Y: 1,
  // The playfield's circumscribed radius is hypot(40, 40) = 56.6 m. 78 leaves
  // ~21 m of clear air off the worst corner even before PLAY_MARGIN, which is
  // what keeps the backdrop out of every sightline across the arena.
  MIN_RADIUS: 78,
  // Keep-out apron around the playable rectangle. The rectangle is the real
  // bound (the map is square, not round); the radius above is the sightline
  // bound. Both are enforced, and a box that fails either is dropped.
  PLAY_MARGIN: 8,
  // How far the ground skirt reaches before it has finished dissolving into
  // the sky's fog colour. Comfortably past the furthest band on any map and
  // still inside CAMERA_FAR (320).
  SKIRT_OUTER: 300,
  // Minimum value gap between ANY backdrop tone and its sky's horizon band.
  // Below this a silhouette stops being a silhouette — see the note on the
  // BACKDROPS table and the far-cloud-bank failure it is quoting.
  MIN_SKY_GAP: 0.15,
  // Where the sun is, copied from lightRigSpec.js's LIGHT_RIG.sun.dir. Faces
  // are shaded against this ONCE, here, because nothing out of bounds is lit
  // at runtime. lightRigSpec.js is deliberately import-free (it is loaded by
  // node tests through several different path depths), so this file keeps its
  // own copy and backdrop.test.js asserts the two agree.
  SUN_DIR: Object.freeze([0.6, 1.0, 0.4]),
});

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

export function hexToRgb(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Rec.709 luma on the sRGB values as authored. Not a photometric quantity —
// it is the same ranking metric craft/color.md's cloud-bank numbers use, and
// the point is that two tones can be compared, not that either is calibrated.
export function luma(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return [ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k];
}

// The 0.55 stop — the bright horizon band a player actually looks at, and the
// thing every backdrop tone has to stay clear of.
export function skyHorizonHex(mapId) {
  const stops = getSky(mapId).gradient;
  const at = stops.find((s) => s.at === 0.55) ?? stops[Math.floor(stops.length / 2)];
  return at.hex;
}

// ---------------------------------------------------------------------------
// Placement helpers
// ---------------------------------------------------------------------------

const CENTRE = Object.freeze({ x: WORLD_SIZE.x / 2, z: WORLD_SIZE.z / 2 });

// The yaw that turns a box's local +Z to point at mid-map. Every form is
// authored facing the arena — windows go on local +Z, a barn's long wall faces
// local +Z — so bearing is the only thing a placement has to decide.
export function inwardYaw(theta) {
  return Math.atan2(-Math.cos(theta), -Math.sin(theta));
}

// World XZ half-extents of a yawed box. Used by the keep-out filter and by the
// tests, so "outside the play area" means the same thing in both.
export function boxAabb(b) {
  const ca = Math.abs(Math.cos(b.yaw));
  const sa = Math.abs(Math.sin(b.yaw));
  const hx = (b.w / 2) * ca + (b.d / 2) * sa;
  const hz = (b.w / 2) * sa + (b.d / 2) * ca;
  return { x0: b.x - hx, x1: b.x + hx, z0: b.z - hz, z1: b.z + hz };
}

// The rectangle nothing may touch: the playfield plus its apron.
export function keepOut() {
  const m = BACKDROP.PLAY_MARGIN;
  return { x0: -m, z0: -m, x1: WORLD_SIZE.x + m, z1: WORLD_SIZE.z + m };
}

function allowed(box) {
  const a = boxAabb(box);
  const k = keepOut();
  if (a.x1 > k.x0 && a.x0 < k.x1 && a.z1 > k.z0 && a.z0 < k.z1) return false;
  return Math.hypot(box.x - CENTRE.x, box.z - CENTRE.z) >= BACKDROP.MIN_RADIUS;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

// Everything a form needs to place one box, so the forms stay small.
class Emitter {
  constructor() { this.solids = []; this.lights = []; this.dropped = 0; }

  // `lx` / `lz` are offsets in the anchor's own frame: +Z is toward mid-map.
  // `y` is the box's BOTTOM, because every form builds upward from the ground.
  box(anchor, { lx = 0, y, lz = 0, w, h, d, lit, shade }) {
    const s = Math.sin(anchor.yaw), c = Math.cos(anchor.yaw);
    const box = {
      x: anchor.x + lx * c + lz * s,
      y, z: anchor.z - lx * s + lz * c,
      w, h, d, yaw: anchor.yaw, lit, shade,
    };
    if (!allowed(box)) { this.dropped++; return null; }
    this.solids.push(box);
    return box;
  }

  // A lit window: an upright quad standing a hair proud of a box's arena-
  // facing face, so it never z-fights the wall it is on.
  light(anchor, { lx, y, lz, w, h, hex }) {
    const s = Math.sin(anchor.yaw), c = Math.cos(anchor.yaw);
    this.lights.push({
      x: anchor.x + lx * c + lz * s,
      y, z: anchor.z - lx * s + lz * c,
      w, h, yaw: anchor.yaw, hex,
    });
  }
}

// Walk all the way round a ring, placing one form after another with a gap
// between them. Count falls out of the circumference rather than being
// authored: a band asked for "shoulder to shoulder" stays shoulder to shoulder
// when its radius changes, where a hand-picked count would silently thin out.
//
// A NEGATIVE gap is legal and the mountains use it — peaks are supposed to
// overlap and hide each other's feet, which is what makes a range read as
// depth rather than as a row of pyramids.
function ringWalk(rng, band, place) {
  const start = rng.rangeF(0, TAU);
  let a = 0;
  let guard = 0;
  while (a < TAU && guard++ < 400) {
    const w = rng.rangeF(band.w[0], band.w[1]);
    const r = rng.rangeF(band.r[0], band.r[1]);
    const theta = start + a;
    place({
      theta, r, w,
      x: CENTRE.x + Math.cos(theta) * r,
      z: CENTRE.z + Math.sin(theta) * r,
      yaw: inwardYaw(theta),
    });
    a += Math.max(w * 0.35, w + rng.rangeF(band.gap[0], band.gap[1])) / r;
  }
}

function anchorAt(turn, r) {
  const theta = turn * TAU;
  return {
    theta, r,
    x: CENTRE.x + Math.cos(theta) * r,
    z: CENTRE.z + Math.sin(theta) * r,
    yaw: inwardYaw(theta),
  };
}

// -- Forms ------------------------------------------------------------------

// A tower: shaft, optional setbacks, a crown, and a grid of lit windows on the
// face that looks at the arena.
function tower(em, rng, band, spot, win) {
  const { lit, shade } = band;
  const g = BACKDROP.GROUND_Y;
  const d = rng.rangeF(band.d[0], band.d[1]);
  const h = rng.rangeF(band.h[0], band.h[1]);
  const shaft = em.box(spot, { y: g, w: spot.w, h, d, lit, shade });
  if (!shaft) return;

  // Setbacks: the 1916 zoning law made every Manhattan tower step inward as it
  // rose, and that stepped profile is the difference between a skyline and a
  // bar chart.
  let topY = g + h, tw = spot.w, td = d, off = 0;
  const steps = rng.chance(band.setback ?? 0) ? rng.rangeI(1, 2) : 0;
  for (let i = 0; i < steps; i++) {
    const sh = h * rng.rangeF(0.14, 0.32);
    tw *= rng.rangeF(0.6, 0.84);
    td *= rng.rangeF(0.62, 0.86);
    off += rng.rangeF(-1, 1) * (spot.w - tw) * 0.18;
    em.box(spot, { lx: off, y: topY, w: tw, h: sh, d: td, lit, shade });
    topY += sh;
  }

  switch (rng.pick(band.crowns ?? ['flat'])) {
    case 'water-tower': {
      // The single most New York rooftop object there is, and it is two boxes.
      const tx = off + rng.rangeF(-1, 1) * tw * 0.22;
      em.box(spot, { lx: tx, y: topY, w: 1.0, h: 2.0, d: 1.0, lit, shade });
      em.box(spot, { lx: tx, y: topY + 2.0, w: 2.6, h: 3.2, d: 2.6, lit, shade });
      break;
    }
    case 'penthouse':
      em.box(spot, { lx: off, y: topY, w: tw * 0.5, h: rng.rangeF(2.5, 4.5),
                     d: td * 0.5, lit, shade });
      break;
    case 'step':
      em.box(spot, { lx: off, y: topY, w: tw * 0.66, h: h * rng.rangeF(0.08, 0.18),
                     d: td * 0.66, lit, shade });
      break;
    case 'spire':
      em.box(spot, { lx: off, y: topY, w: 1.4, h: h * rng.rangeF(0.16, 0.34),
                     d: 1.4, lit, shade });
      break;
    case 'twin-mast':
      for (const s of [-1, 1]) {
        em.box(spot, { lx: off + s * tw * 0.3, y: topY, w: 0.8,
                       h: h * rng.rangeF(0.1, 0.2), d: 0.8, lit, shade });
      }
      break;
    default: break;
  }

  if (band.windows > 0 && win) towerWindows(em, rng, band, spot, win, h, d);
}

// The window grid. Four separate randomisations sit on top of a regular grid,
// because a grid is a repeat and this project has shipped visible banding out
// of a repeat twice: a per-building BIAS (whole towers that are mostly dark),
// whole dark FLOORS, a hue drawn per window, and an occasional fully lit crown
// band — which is what real offices look like at dusk and also breaks the last
// bit of regularity at the top edge, where the eye is looking.
function towerWindows(em, rng, band, spot, win, h, d) {
  const bias = rng.rangeF(win.bias[0], win.bias[1]);
  const p = Math.min(0.95, band.windows * bias);
  const usableW = spot.w - win.margin * 2;
  const cols = Math.floor(usableW / win.colPitch);
  if (cols < 1) return;
  const floors = Math.floor((h - win.sill - 1.5) / win.floorPitch);
  if (floors < 1) return;
  const x0 = -(cols - 1) * win.colPitch / 2;
  const face = d / 2 + 0.12;
  const crownBand = rng.chance(win.crownLit) ? floors - rng.rangeI(1, 2) : -99;

  for (let f = 0; f < floors; f++) {
    const dark = f !== crownBand && rng.chance(win.darkFloor);
    if (dark) continue;
    const y = BACKDROP.GROUND_Y + win.sill + f * win.floorPitch;
    for (let c = 0; c < cols; c++) {
      if (f !== crownBand && !rng.chance(p)) continue;
      em.light(spot, {
        lx: x0 + c * win.colPitch, y: y + win.h / 2, lz: face,
        w: win.w, h: win.h,
        hex: rng.chance(win.coolMix) ? win.cool : rng.pick(win.warm),
      });
    }
  }
}

// A conifer / bare-tree wedge: three stacked boxes, narrowing. A cone would
// need its own geometry and would look wrong next to a world made of cubes.
function conifer(em, rng, band, spot) {
  const { lit, shade } = band;
  const h = rng.rangeF(band.h[0], band.h[1]);
  const seg = h / 3;
  let y = BACKDROP.GROUND_Y;
  for (const k of [1.0, 0.68, 0.36]) {
    em.box(spot, { y, w: spot.w * k, h: seg * rng.rangeF(0.9, 1.15),
                   d: spot.w * k, lit, shade });
    y += seg;
  }
}

function shrub(em, rng, band, spot) {
  em.box(spot, { y: BACKDROP.GROUND_Y, w: spot.w,
                 h: rng.rangeF(band.h[0], band.h[1]),
                 d: spot.w * rng.rangeF(0.6, 1.1),
                 lit: band.lit, shade: band.shade });
}

// A peak: a stepped pyramid whose centre WANDERS as it rises. A symmetric
// pyramid reads as a pyramid; the wander is what turns the same boxes into a
// ridgeline with a summit off to one side.
function peak(em, rng, band, spot) {
  const h = rng.rangeF(band.h[0], band.h[1]);
  const steps = rng.rangeI(5, 8);
  const capFrom = band.cap > 0 ? Math.ceil(steps * (1 - band.cap)) : steps + 1;
  let y = BACKDROP.GROUND_Y, off = 0;
  for (let i = 0; i < steps; i++) {
    const k = Math.pow(1 - i / steps, 1.25);
    const snow = i >= capFrom;
    const w = spot.w * Math.max(0.08, k);
    off += rng.rangeF(-1, 1) * spot.w * 0.055;
    em.box(spot, {
      lx: off, y, w, h: h / steps * rng.rangeF(0.92, 1.1),
      d: w * rng.rangeF(0.7, 1.05),
      lit: snow ? band.capLit : band.lit,
      shade: snow ? band.capShade : band.shade,
    });
    y += h / steps;
  }
}

// A pressure ridge: a broken run of low blocks along the ring's tangent. Same
// silhouette rule as the in-map ridges (voxelWorldGen.js) — it has to read as
// broken, or it is a wall.
function ridge(em, rng, band, spot) {
  const { lit, shade } = band;
  const n = rng.rangeI(3, 7);
  const seg = spot.w / n;
  for (let i = 0; i < n; i++) {
    if (rng.chance(0.18)) continue;               // the gaps are the point
    em.box(spot, {
      lx: -spot.w / 2 + seg * (i + 0.5), y: BACKDROP.GROUND_Y,
      w: seg * rng.rangeF(0.7, 1.0),
      h: rng.rangeF(band.h[0], band.h[1]),
      d: rng.rangeF(2.5, 6), lit, shade,
    });
  }
}

// A tabular berg: a flat slab, plus a thin warmer cap where the low polar sun
// that never sets catches its top edge.
function berg(em, rng, band, spot) {
  const h = rng.rangeF(band.h[0], band.h[1]);
  const d = spot.w * rng.rangeF(0.5, 0.95);
  em.box(spot, { y: BACKDROP.GROUND_Y, w: spot.w, h, d,
                 lit: band.lit, shade: band.shade });
  if (band.cap) {
    em.box(spot, { y: BACKDROP.GROUND_Y + h, w: spot.w * 0.94, h: 0.9,
                   d: d * 0.94, lit: band.cap, shade: band.shade });
  }
}

// -- Marks: fixed-bearing landmarks ----------------------------------------

function silo(em, rng, mark, spot) {
  const { lit, shade } = mark;
  em.box(spot, { y: BACKDROP.GROUND_Y, w: mark.w, h: mark.h, d: mark.w, lit, shade });
  // Domed cap, two courses, so a silo is never mistaken for a chimney.
  em.box(spot, { y: BACKDROP.GROUND_Y + mark.h, w: mark.w * 0.92, h: mark.w * 0.32,
                 d: mark.w * 0.92, lit, shade });
  em.box(spot, { y: BACKDROP.GROUND_Y + mark.h + mark.w * 0.32, w: mark.w * 0.5,
                 h: mark.w * 0.26, d: mark.w * 0.5, lit, shade });
}

function farBarn(em, rng, mark, spot) {
  const { lit, shade } = mark;
  em.box(spot, { y: BACKDROP.GROUND_Y, w: mark.w, h: mark.h, d: mark.d, lit, shade });
  // Stepped gable — three courses is enough to say "pitched roof" at 120 m,
  // and it matches how the in-map barn's roof is built.
  let y = BACKDROP.GROUND_Y + mark.h;
  for (const k of [0.86, 0.58, 0.28]) {
    em.box(spot, { y, w: mark.w * 0.99, h: mark.h * 0.16, d: mark.d * k, lit, shade });
    y += mark.h * 0.16;
  }
}

// -- Lines: fence runs that leave the map ----------------------------------

// A fence heading away from the arena, posts and a top rail. It is the only
// straight line out there, and a line with a vanishing point in it does more
// for "this field keeps going" than another hundred trees.
function fenceLine(em, rng, line, fence) {
  const theta = line.turn * TAU;
  const n = Math.floor((line.to - line.from) / line.postPitch);
  for (let i = 0; i <= n; i++) {
    const r = line.from + i * line.postPitch;
    // Drift the bearing as it recedes so the run is walked, not ruled — the
    // same reason applyGroundWear's footpaths wobble.
    const a = theta + line.drift * (i / Math.max(1, n));
    const spot = {
      x: CENTRE.x + Math.cos(a) * r, z: CENTRE.z + Math.sin(a) * r,
      yaw: inwardYaw(a),
    };
    em.box(spot, { y: BACKDROP.GROUND_Y, w: fence.postW, h: fence.postH,
                   d: fence.postW, lit: fence.lit, shade: fence.shade });
    if (i === n) continue;
    // The rail is what actually reads: a 0.5 m post is sub-pixel at 150 m, a
    // continuous horizontal line is not.
    const rMid = r + line.postPitch / 2;
    const aMid = theta + line.drift * ((i + 0.5) / Math.max(1, n));
    em.box({
      x: CENTRE.x + Math.cos(aMid) * rMid, z: CENTRE.z + Math.sin(aMid) * rMid,
      yaw: inwardYaw(aMid) + Math.PI / 2,
    }, { y: BACKDROP.GROUND_Y + fence.railY, w: line.postPitch, h: fence.railH,
         d: 0.22, lit: fence.lit, shade: fence.shade });
  }
}

const FORMS = { tower, conifer, shrub, peak, ridge, berg };

// ---------------------------------------------------------------------------
// The entry point
// ---------------------------------------------------------------------------
// Pure function of (mapId, seed), exactly like generateWorld — every peer in
// the P2P mesh builds the same skyline without a byte crossing the wire.
//
// Deliberately NOT called from generateWorld: the backdrop is render-only, and
// keeping it out means a headless peer, a bot simulation and every worldgen
// test pay nothing for scenery they will never draw.
export function generateBackdrop(mapId, seed = 1) {
  const spec = getBackdrop(mapId);
  if (!spec) return null;
  const em = new Emitter();
  const rng = new SeededRng((seed ^ 0x5EEDBACD) >>> 0);

  for (const band of spec.bands) {
    const form = FORMS[band.form];
    if (!form) continue;
    const bandRng = rng.child(`band:${band.id}`);
    ringWalk(bandRng, band, (spot) => form(em, bandRng, band, spot, spec.window));
  }

  for (const mark of spec.marks ?? []) {
    const spot = { ...anchorAt(mark.turn, mark.r), w: mark.w };
    if (mark.form === 'silo') silo(em, rng, mark, spot);
    else if (mark.form === 'barn') farBarn(em, rng, mark, spot);
  }

  for (const line of spec.lines ?? []) fenceLine(em, rng, line, spec.fence);

  return {
    mapId, id: spec.id,
    skirt: {
      inner: { x0: 0, z0: 0, x1: WORLD_SIZE.x, z1: WORLD_SIZE.z },
      outer: BACKDROP.SKIRT_OUTER,
      y: BACKDROP.GROUND_Y,
      hex: spec.skirt,
    },
    solids: em.solids,
    lights: em.lights,
  };
}

// How lit a face is, from its world normal alone — 0 at the shade end of a
// band's ramp, 1 at the lit end. Exported so the builder and the tests agree
// on what "the sun-facing flank" means.
export function faceShade(nx, ny, nz) {
  const [sx, sy, sz] = BACKDROP.SUN_DIR;
  const len = Math.hypot(sx, sy, sz);
  const d = (nx * sx + ny * sy + nz * sz) / len;
  // Remapped rather than clamped: a face pointing straight away from the sun
  // still gets the shade tone rather than black, because there is no such
  // thing as an unlit surface under a sky.
  return 0.5 + 0.5 * d;
}
