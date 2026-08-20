// First-person weapon viewmodel SPECS -- pure data, no THREE, no DOM, so the
// shapes can be unit-tested in node (see firstPersonWeapon.test.mjs).
//
// Weapon space convention (before `pose` is applied):
//   +Y  = up            -Z = muzzle / business end (camera looks down -Z)
//   The shovel is authored shaft-up, blade at -Y, spade face toward +Z.
//
// Style rules applied here come from art/knowledge:
//   * voxel.md            -- boxes only, flat shading, <= 6 materials/model
//   * silhouette-readability.md -- one unique signature per weapon, and it
//     has to survive at 1/8th of a 1080p screen
//   * hand-drawn.md       -- palette-only colours, wear marks, per-element
//     wobble (texture offsets are jittered per part in firstPersonWeapon.js)

// Palette. Every colour here is already in the game's palette
// (docs/DESIGN_PRINCIPLES.md / art/knowledge/styles/hand-drawn.md) -- no new
// bright colour is introduced by the viewmodels.
export const VM_PALETTE = {
  wood:      0x8a5a2b,   // handle / stock
  woodDark:  0x5d3a1a,   // grips, bindings, butt plate
  metal:     0x8a90a0,   // spade, receiver, rocket tube
  metalDark: 0x3a3d44,   // barrels, ribs, fins
  metalLite: 0xc3cad6,   // polished/worn edges -- the "used" tell
  brass:     0xf4c95d,   // game gold: bands, sights, breech
  red:       0xb73a2a,   // barn red: rocket warhead
  muck:      0x7a5c3d,   // poo ammo + dirt smear
};

// Which materials get a canvas texture (the rest stay flat graphic colour,
// per hand-drawn.md "dead-flat colour only for deliberate graphic elements").
//
// `tint` is NOT the palette colour: a canvas texture already carries its own
// hue (makeWoodTexture paints #8a5a2b, makeMetalTexture paints #a6acb8) and
// three multiplies map x color, so tinting with the palette hex would square
// the colour and ship near-black wood. Each tint below is
// palette / texture-average, clamped to white; where the target is BRIGHTER
// than the texture (metalLite, the polished cutting edge) the shortfall is
// made up with `emissive` instead, because multiply can only darken.
// This is the same class of bug as the sRGB/linear doubling recorded in
// GRAPHICS_QUALITY_LOOP.md -- see art/knowledge/craft/color.md.
export const VM_TEXTURED = {
  wood:      { tex: 'wood',  tint: 0xffffff },
  woodDark:  { tex: 'wood',  tint: 0xaca49b },
  metal:     { tex: 'metal', tint: 0xd5d8e0 },
  metalDark: { tex: 'metal', tint: 0x5b5c5f },
  metalLite: { tex: 'metal', tint: 0xffffff, emissive: 0x2a2c30 },
};

const box  = (mat, size, pos, rot) => ({ kind: 'box', mat, size, pos, rot });
const blob = (mat, r, pos)         => ({ kind: 'blob', mat, r, pos });

// -- SHOVEL -----------------------------------------------------------------
// Signature: wide spade blade + D-handle + the poo pellet riding on the face.
const SHOVEL = [
  box('wood',      [0.048, 0.62, 0.048], [0, 0.06, 0]),            // shaft
  box('woodDark',  [0.056, 0.03, 0.056], [0, 0.20, 0]),            // binding
  box('woodDark',  [0.030, 0.13, 0.030], [-0.052, 0.435, 0]),      // D-grip left
  box('woodDark',  [0.030, 0.13, 0.030], [0.052, 0.435, 0]),       // D-grip right
  box('woodDark',  [0.155, 0.036, 0.042], [0, 0.508, 0]),          // D-grip top
  box('metalDark', [0.078, 0.11, 0.070], [0, -0.29, 0]),           // ferrule collar
  // Spade in three stepped widths -- a voxel taper reads as a POINTED spade,
  // where the single slab it replaced read as a snow paddle (loop pass 3).
  box('metal',     [0.200, 0.200, 0.036], [0, -0.415, 0]),         // spade shoulder
  box('metal',     [0.185, 0.120, 0.036], [0, -0.575, 0]),         // spade waist
  box('metal',     [0.140, 0.100, 0.036], [0, -0.685, 0]),         // spade point
  box('metalLite', [0.125, 0.034, 0.044], [0, -0.742, 0]),         // worn cutting lip
  box('metalDark', [0.038, 0.300, 0.026], [0, -0.520, -0.028]),    // spine (BACK face only)
  box('metalDark', [0.032, 0.030, 0.046], [-0.050, -0.720, 0]),    // chipped nick (wear)
  // The dirt is a STREAK, not a patch: an earlier pass put a 0.12x0.10 muck
  // rectangle on the spade face and it read as a hole punched through the
  // blade -- silhouette-readability.md rule 1, texture never beats shape.
  box('muck',      [0.090, 0.032, 0.008], [0.016, -0.620, 0.022]), // dirt streak
  blob('muck',     0.040, [-0.045, -0.360, 0.045]),                // poo pellet (ammo)
];

// -- SHOTGUN ----------------------------------------------------------------
// Signature: TWO barrels side by side (never confusable with the rocket's
// single fat tube at a glance) + brass breech.
const SHOTGUN = [
  box('metalDark', [0.052, 0.055, 0.62], [-0.038, 0.005, -0.24]),  // barrel left
  box('metalDark', [0.052, 0.055, 0.62], [0.038, 0.005, -0.24]),   // barrel right
  box('metalLite', [0.020, 0.016, 0.56], [0, 0.034, -0.24]),       // top rib (splits the pair)
  box('metalLite', [0.060, 0.062, 0.05], [-0.038, 0.005, -0.53]),  // worn muzzle L
  box('metalLite', [0.060, 0.062, 0.05], [0.038, 0.005, -0.53]),   // worn muzzle R
  box('brass',     [0.078, 0.070, 0.04], [0, 0.005, -0.34]),       // barrel band
  box('wood',      [0.082, 0.070, 0.22], [0, -0.045, -0.20]),      // fore-grip
  box('metal',     [0.086, 0.105, 0.20], [0, -0.020, 0.03]),       // receiver
  box('brass',     [0.090, 0.050, 0.035], [0, -0.020, 0.132]),     // breech hinge
  box('metalDark', [0.018, 0.045, 0.020], [0, -0.085, 0.10]),      // trigger
  box('wood',      [0.070, 0.115, 0.26], [0, -0.058, 0.245], [-0.10, 0, 0]),   // stock
  box('woodDark',  [0.074, 0.122, 0.030], [0, -0.083, 0.378], [-0.10, 0, 0]),  // butt plate
  box('woodDark',  [0.076, 0.026, 0.13], [0, -0.008, 0.215], [-0.10, 0, 0]),   // cheek wear strip
  box('brass',     [0.020, 0.022, 0.020], [0, 0.045, -0.52]),      // front bead sight
];

// -- ROCKET -----------------------------------------------------------------
// Signature: fat square tube + STEPPED red warhead + rear fins. The steps are
// deliberate: a smooth cone reads as plastic at 1/8th screen, stairs read as
// "big rocket" (voxel.md: detail through voxel count, not curvature).
const ROCKET = [
  box('metal',     [0.150, 0.150, 0.60], [0, 0, -0.20]),           // tube
  box('brass',     [0.158, 0.158, 0.045], [0, 0, -0.34]),          // hazard band front
  box('brass',     [0.158, 0.158, 0.045], [0, 0, -0.06]),          // hazard band rear
  box('metalDark', [0.154, 0.052, 0.12], [0, 0.030, -0.20]),       // scuffed dent band (wear)
  box('red',       [0.150, 0.150, 0.090], [0, 0, -0.540]),         // warhead step 1
  box('red',       [0.110, 0.110, 0.070], [0, 0, -0.615]),         // warhead step 2
  box('red',       [0.070, 0.070, 0.055], [0, 0, -0.672]),         // warhead step 3
  box('metalLite', [0.030, 0.030, 0.035], [0, 0, -0.708]),         // fuse tip
  box('metal',     [0.165, 0.165, 0.060], [0, 0, 0.115]),          // exhaust bell
  box('metalDark', [0.014, 0.110, 0.130], [-0.086, 0, 0.020]),     // fin left
  box('metalDark', [0.014, 0.110, 0.130], [0.086, 0, 0.020]),      // fin right
  box('metalDark', [0.110, 0.014, 0.130], [0, 0.086, 0.020]),      // fin top
  box('woodDark',  [0.055, 0.100, 0.075], [0, -0.115, 0.055]),     // rear grip
  box('woodDark',  [0.050, 0.090, 0.060], [0, -0.105, -0.285]),    // fore grip
  box('metalDark', [0.045, 0.030, 0.220], [0, 0.092, -0.185]),     // sight rail
  box('brass',     [0.020, 0.045, 0.020], [0, 0.128, -0.285]),     // sight post
];

// `pose` puts the authored model into the player's hands. `scale` keeps the
// authored numbers human-readable (shovel is ~1.1 long in weapon space).
export const VIEWMODELS = {
  shovel: {
    // Blade UP-LEFT, handle down-right off the frame edge: the classic melee
    // hold, and the only one that keeps the spade (the signature) fully
    // on screen instead of clipped by the bottom edge.
    signature: 'wide spade blade + D-handle',
    parts: SHOVEL,
    pose: { pos: [0.25, -0.02, -0.08], rot: [-0.16, 0.18, -2.05], scale: 0.66 },
  },
  shotgun: {
    signature: 'double barrel',
    parts: SHOTGUN,
    pose: { pos: [0, -0.01, -0.20], rot: [0.02, 0.16, 0.03], scale: 1 },
  },
  rocket: {
    // Yawed across the frame so the red warhead is IN shot -- pointed straight
    // down -Z the player only ever sees the exhaust bell.
    signature: 'stepped red warhead + fins',
    parts: ROCKET,
    pose: { pos: [0.02, -0.02, -0.16], rot: [0.02, 0.42, 0.05], scale: 1 },
  },
};

// Bounding box of a spec in weapon space (used by tests to prove each model
// actually occupies enough of the frame to read at 1/8th screen).
export function specBounds(parts) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    const half = p.kind === 'blob' ? [p.r, p.r, p.r] : p.size.map((s) => s / 2);
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], p.pos[i] - half[i]);
      hi[i] = Math.max(hi[i], p.pos[i] + half[i]);
    }
  }
  return { lo, hi, size: hi.map((h, i) => h - lo[i]) };
}
