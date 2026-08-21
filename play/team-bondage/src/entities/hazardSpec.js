// Falling-hazard SPECS (egg + milk pint) -- PURE DATA, no THREE, no DOM, so
// the art rules in art/knowledge/ are asserted by tests instead of only being
// written down. Same pattern as viewmodelSpec.js / barnPaintSpec.js.
//
// Why this exists: GRAPHICS_QUALITY_LOOP.md queue item "Hazards (falling
// eggs, milk pints) -- currently basic geometry. Add: crack line on eggs,
// 'MILK' side-panel on pints." The egg was one smooth-shaded SphereGeometry
// scaled on Y and the pint was three smooth 12-segment cylinders, which broke
// two standing rules at once: voxel.md ("flat shading always ... low-segment
// cylinders (6-8 verts) if a cylinder is unavoidable", and "curved/smooth
// GLBs dropped into the voxel map -- clashes"), and this loop's own bar that
// every surface carries a texture pattern.
//
// Hazard space convention:
//   +Y = up, the egg is authored point-UP, the bottle stands upright, and the
//   front of both faces +Z. The object origin is its centre, which is the
//   point HazardSystem drives down the fall.

// Every hex is from the canonical game palette (art/knowledge/styles/
// hand-drawn.md: night #1c1a17, gold #f4c95d, barn red #b73a2a, sky blue
// #7cb0ff, snow #e8f3ff, hay #f5d53a) or a warm-dark / cool-light neighbour
// of one. Never pure black, never pure white.
export const HZ_PALETTE = {
  shell:     0xefe3c4,   // eggshell -- warm cream, a shade off the #f6f1e6 ceiling
  shellDark: 0xcbb894,   // shaded shell: the underside of the lifted flake
  shellLite: 0xf6f1e6,   // the lit lip standing along the crack
  crack:     0x4a3626,   // the fracture -- warm dark brown, never black
  yolk:      0xf4c95d,   // game gold, seeping out of the break
  milk:      0xf6f1e6,   // hand-drawn.md white ceiling, not #ffffff
  cream:     0xf0e2b8,   // the cream line that settles in a real pint neck
  label:     0xb73a2a,   // barn red -- the MILK panel ground
  foil:      0xc3cad6,   // crimped foil cap (same hex as the viewmodel metalLite)
};

// Which materials get a canvas texture. As in VM_TEXTURED, `tint` is NOT the
// palette hex: a canvas texture already carries its own hue and three
// multiplies map x color, so tinting with the palette colour squares the
// value. Each tint below is palette / texture-average, clamped to white.
//
// The `emissive` values are not decoration. Measured through the game's own
// light rig (art/preview/hazard.html), the brightest pixel of a shell painted
// #efe3c4 comes back at about (168,170,162) — 70 % of its own value, and
// hue-NEUTRAL, because three's Lambert BRDF divides the irradiance by PI and
// the rig's hemisphere light is sky-blue. A cream egg lit that way reads as
// grey concrete. Multiply cannot fix it, since multiply only darkens; the
// shortfall has to be added, which is what emissive does — the same trick the
// viewmodel's polished metalLite edge uses. Every one here is a WARM dark, so
// it puts back the hue the blue sky light took out (color.md).
export const HZ_TEXTURED = {
  shell:     { tex: 'eggshell', tint: 0xffffff, emissive: 0x554527 },
  shellLite: { tex: 'eggshell', tint: 0xffffff, emissive: 0x7a6c4e },
  milk:  { tex: 'glass',     tint: 0xffffff, emissive: 0x46443a },
  cream: { tex: 'glass',     tint: 0xf7ecc8, emissive: 0x50441f },
  label: { tex: 'milkLabel', tint: 0xffffff, emissive: 0x2a1410 },
  foil:  { tex: 'metal',     tint: 0xffffff, emissive: 0x24272c },
};

const box  = (mat, size, pos, rot) => ({ kind: 'box', mat, size, pos, rot });
const blob = (mat, r, pos)         => ({ kind: 'blob', mat, r, pos });
// Low-segment prisms only -- 8 facets is the voxel.md ceiling for a cylinder.
const cyl  = (mat, r, h, y, seg = 8) => ({ kind: 'cyl', mat, r, h, seg, pos: [0, y, 0] });

// -- EGG --------------------------------------------------------------------
// Signature: stepped ovoid + a CRACK with gold yolk seeping out of it and one
// shell flake lifted off the surface.
//
// The ovoid is seven stacked boxes rather than a sphere because
// silhouette-readability.md ranks silhouette first and voxel.md gets its
// roundness from step count, not from smoothing. The widest tier sits BELOW
// centre so it reads as an egg (fat end down) rather than as a lemon.
const EGG_TIERS = [
  [0.16, 0.07,  0.275],
  [0.27, 0.08,  0.205],
  [0.36, 0.10,  0.110],
  [0.42, 0.12,  0.000],   // equator
  [0.40, 0.10, -0.105],
  [0.30, 0.09, -0.195],
  [0.16, 0.06, -0.265],
];

// The fracture. Each segment stands CRACK_PROUD in front of the tier it sits
// on, so it can never z-fight with the shell or end up buried inside it --
// there is a test for exactly that, because a crack drawn flush with the
// surface is a crack nobody can see. The x zigzags: a real break wanders, but
// only a little. The ice-crack lesson in silhouette-readability.md sets the
// limit -- too much per-segment kink and a marking stops reading as physics
// and starts reading as HANDWRITING.
export const CRACK_PROUD = 0.012;

const crackSeg = (x, y, tierW, rz, len = 0.105) =>
  box('crack', [0.026, len, 0.028], [x, y, tierW / 2 + CRACK_PROUD], [0, 0, rz]);

// Segment centres are CRACK_STEP apart and every segment is longer than the
// step, so consecutive pieces overlap and the fracture is one continuous
// line. Drawn shorter than the step they became five separate dark
// rectangles floating on the shell, which read as HOLES punched through it —
// the same failure as the muck patch on the shovel blade. A crack is a line
// or it is damage; there is no in-between.
export const CRACK_STEP = 0.090;

const EGG = [
  ...EGG_TIERS.map(([w, h, y]) => box('shell', [w, h, w], [0, y, 0])),
  // Main fracture, crown -> equator, down the +Z face.
  crackSeg(0.020,  0.220, 0.27,  0.30),
  crackSeg(-0.030, 0.130, 0.36, -0.26),
  crackSeg(0.032,  0.040, 0.42,  0.24),
  // Long enough to run all the way down to the 0.30 tier's shoulder, and set
  // proud of the EQUATOR (0.42) because that is the fattest tier it crosses.
  crackSeg(-0.020, -0.081, 0.42, -0.22, 0.148),
  // The tail stops exactly where the 0.40 tier ends, so it is wholly on the
  // 0.30 tier: run any further up and its top half is BURIED inside the tier
  // above it, which is how the first cut of this shipped. A crack you cannot
  // see is not a crack.
  crackSeg(0.012, -0.1875, 0.30,  0.18, 0.065),
  // A short branch part-way ALONG the main run (never off a shared origin --
  // branching every crack from one point makes an asterisk, see the ice pan).
  box('crack', [0.062, 0.020, 0.028], [0.070, 0.075, 0.36 / 2 + CRACK_PROUD], [0, 0, -0.5]),
  // The LIT LIP. A dark line on its own reads as a scratch, or worse as a hole
  // punched through the shell; the shoulder of raised shell along one side is
  // what makes it read as DEPTH -- exactly the finding the ice pan recorded in
  // silhouette-readability.md ("drawn dark with a bright shoulder on one side
  // ... what makes a crack read as depth at distance instead of as a
  // scratch"). One side only: lip both sides and it becomes a groove moulded
  // into the surface rather than a break.
  box('shellLite', [0.020, 0.100, 0.026], [0.043,  0.215, 0.27 / 2 + CRACK_PROUD * 0.6], [0, 0, 0.30]),
  box('shellLite', [0.020, 0.100, 0.026], [-0.007, 0.128, 0.36 / 2 + CRACK_PROUD * 0.6], [0, 0, -0.26]),
  box('shellLite', [0.020, 0.145, 0.026], [0.004, -0.078, 0.42 / 2 + CRACK_PROUD * 0.6], [0, 0, -0.22]),
  // Secondary fracture wrapping onto the -X face, so the break still reads
  // when the tumble turns the egg away from you.
  box('crack', [0.026, 0.070, 0.030], [-(0.42 / 2 + CRACK_PROUD),  0.010,  0.030], [0.26, 0, 0]),
  box('crack', [0.026, 0.062, 0.030], [-(0.40 / 2 + CRACK_PROUD), -0.070, -0.020], [-0.22, 0, 0]),
  // Gold yolk welling out of the widest part of the break. This is why the
  // egg reads as CRACKED rather than merely speckled at 10 m: cream shell and
  // brown crack are one value family, the yolk is the only saturated note.
  blob('yolk', 0.062, [0.010, -0.012, 0.238]),
  blob('yolk', 0.034, [-0.022, -0.100, 0.208]),   // a drip running down
  blob('yolk', 0.026, [0.044,  0.072, 0.196]),    // a bead caught in the branch
  // One flake of shell peeled up off the surface -- the 3D tell. It breaks
  // the ovoid silhouette, which is the first thing that reads at distance.
  box('shell',     [0.085, 0.018, 0.072], [0.082, 0.128, 0.176], [0.62, 0.20, -0.34]),
  box('shellDark', [0.072, 0.012, 0.060], [0.078, 0.116, 0.170], [0.62, 0.20, -0.34]),
];

// -- MILK PINT --------------------------------------------------------------
// Signature: the bottle SHOULDER-AND-NECK step + a barn-red MILK band.
//
// The old pint was a plain cylinder with a pink ring, which at a glance was
// the same blob as the egg. A pint bottle reads by its silhouette: fat
// straight body, two shoulder steps, a narrow neck, a crimped foil cap.
export const LABEL_R = 0.182;   // proud of the 0.175 body so the band has an edge

const MILK = [
  cyl('milk',  0.185, 0.030, -0.235),   // heel flare (the bottle foot)
  cyl('milk',  0.175, 0.300, -0.100),   // body
  cyl('milk',  0.155, 0.060,  0.075),   // shoulder step 1
  cyl('cream', 0.125, 0.060,  0.135),   // shoulder step 2 = the cream line
  cyl('milk',  0.078, 0.100,  0.215),   // neck
  cyl('foil',  0.085, 0.012,  0.262),   // crimp ring under the cap
  cyl('foil',  0.095, 0.035,  0.283),   // foil cap
  cyl('label', LABEL_R, 0.170, -0.090), // the MILK panel
];

// The label texture paints the word this many times across its width, so with
// the band 8 facets one whole MILK lands every 90 degrees and the pint stays
// legible whatever yaw the tumble leaves it at.
export const LABEL_REPEAT = 4;
// three maps u=0 to theta=0, so facet CENTRES sit at u = 1/16, 3/16, ... while
// the painted word centres sit at 1/8, 3/8, ... Shifting the texture by half a
// facet drops each word onto a flat facet instead of folding it over an edge.
export const LABEL_UV_OFFSET = 1 / 16;

// Authored sizes are life-size farm produce -- and life-size is the wrong
// size for this. Rendered through the game's own camera at the loop's 10 m
// bar, a 0.6 m egg is about 50 px on a 1080p screen and a crack painted on it
// is one pixel wide: nothing that goes on the shell can read, because the
// shell itself barely does. The lever that actually works is the object, so
// both hazards are blown up by a third. They are comedy farm ordnance falling
// out of a clear sky, not groceries, and the splash radius (2.2 m) is
// unchanged -- this is purely how big the thing LOOKS while you dodge it.
export const HAZARD_SCALE = 1.34;

export const HAZARDS = {
  egg: {
    signature: 'cracked shell + gold yolk seep',
    parts: EGG,
    scale: HAZARD_SCALE,
    // Radians turned over the WHOLE 2 s fall. The old code spun every hazard
    // at a hard-coded 8 rad, which smeared the shell into a blur — a detail
    // that only reads when static is wasted budget (the motion test), and so
    // is a detail spun too fast to resolve. Eggs still tumble end-over-end;
    // the pint is heavier and lazier. Per-item jitter on top of this lives in
    // hazard.js (hand-drawn.md: no two of the same prop in view should move
    // identically).
    spin: { x: 6.5, z: 4.0 },
  },
  milk: {
    signature: 'bottle neck + red MILK band',
    parts: MILK,
    scale: HAZARD_SCALE,
    spin: { x: 3.2, z: 1.9 },
  },
};

// Bounding box of a spec in hazard space (tests use it to prove each hazard is
// big enough to read while falling and small enough not to look like a prop
// that fell off the map).
export function specBounds(parts) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    let half;
    if (p.kind === 'blob') half = [p.r, p.r, p.r];
    else if (p.kind === 'cyl') half = [p.r, p.h / 2, p.r];
    else half = p.size.map((s) => s / 2);
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], p.pos[i] - half[i]);
      hi[i] = Math.max(hi[i], p.pos[i] + half[i]);
    }
  }
  return { lo, hi, size: hi.map((h, i) => h - lo[i]) };
}
