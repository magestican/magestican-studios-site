// Ground paint — PURE DATA (no THREE, no canvas) so the art rules in
// art/knowledge/ can be asserted by tests instead of only written down.
// Same pattern as barnPaintSpec.js and entities/viewmodelSpec.js.
//
// Why this exists: the map is one flat layer of VOX.GRASS at y=0 (worldgen
// repurposes GRASS as "snow" in this theme) with ICE patches scattered
// through it. That layer is the single largest surface in the game — it is
// under the player in every frame — and it shipped GREEN.
//
// The bug was a two-part one and both halves are worth remembering:
//
//   1. `makeGrassTexture()` painted an actual green field (#5aa64b base,
//      pale-green blade strokes). The theme changed to a snow farm; the
//      texture never did.
//   2. The fix that was attempted at the time was to set the GRASS palette
//      entry to snow #e8f3ff and call it done — but a renderer multiplies
//      `map x color`, and multiplying a green texture by a near-white tint
//      is still green. A tint can darken a hue; it can never replace one.
//      (Same family as the tint trap in art/knowledge/craft/color.md.)
//
// So snow and ice now carry their OWN hue in the texture and are tinted
// WHITE by voxelMesh.js — the texture is the single source of truth for
// what the ground looks like, and there is no multiplier left to lie.

// Every hex is the canonical snow/ice pair from art/knowledge/craft/color.md
// or a cool neighbour of one. Never pure white: "painting snow pure white
// kills every colour next to it", and it also destroys the value range the
// ripples need in order to read at 10 m.
export const GROUND_PALETTE = Object.freeze({
  snow:       '#dce9f7',   // packed snow field — a shade under palette #e8f3ff
                           // so the sun (1.05 dir + 0.55 ambient) has headroom
                           // to lift the crests without clipping to flat white
  snowCrest:  '#f2f8ff',   // wind-blown ridge catching the light
  snowHollow: '#93b2d1',   // scoured hollow — snow's shadow is BLUE, not grey.
                           // Started at #a9c3dd and that was only a 0.22 luma
                           // range against the crest: too shallow to survive
                           // the mip chain, so the field flattened at range.
  glint:      '#fbfdff',   // single-pixel sparkle on a crystal face
  ice:        '#b8e0ef',   // game palette exposed ice
  iceDeep:    '#6fa3bd',   // the dark of a crack seen edge-on
  iceSheen:   '#dcf3fb',   // polished wind-swept lane across a pan
  grit:       '#8d9aa6',   // trodden dirt/straw ground into the snow
});

// One entry per ground material. Fields are the *surface story*, not
// generic knobs: snow is wind-packed and takes a footfall; ice is a hard
// pan that cracks and polishes.
export const GROUND_PAINT = Object.freeze({
  snow: Object.freeze({
    name: 'snow',
    field: GROUND_PALETTE.snow,
    crest: GROUND_PALETTE.snowCrest,
    hollow: GROUND_PALETTE.snowHollow,
    // Sastrugi — the wind-carved ripples that are the ONLY reason a snow
    // field reads as a surface rather than a white void at 10 m. Each band
    // is a lit crest with a cool shadow tucked under its lower edge.
    ripples: 5,
    rippleRows: 4,          // px of a 64 px tile => ~6 cm ripples at 1 m/voxel
    rippleWander: 2.2,      // px of sine wander so no band is a ruled line
    // Scoured hollows: broad soft dishes of blue shade. Big features —
    // these are what survives the mip chain at distance.
    hollows: 6,
    hollowAlpha: 0.30,
    glints: 22,             // crystal sparkle; close-range life only
    grit: 9,                // specks of trodden-in dirt, keeps it off pure white
    noise: 16,              // +/- per-pixel value jitter
    // Snow drifts against a block edge and its lip catches the sun, so the
    // seam between two voxels reads as a raised ridge, not a ruled grid.
    edgeCrest: 0.26,
    edgeHollow: 0.14,
    // ...but drawn as BROKEN runs, not a ruled line. A continuous 1 px lip
    // on all four sides of every tile lines up across the whole map in
    // perspective and the field turns into graph paper — that is exactly
    // what the first render of this pass did. Fraction of each edge drawn.
    edgeBreakup: 0.55,
    seed: 401,
  }),
  ice: Object.freeze({
    name: 'ice',
    field: GROUND_PALETTE.ice,
    crest: GROUND_PALETTE.iceSheen,
    hollow: GROUND_PALETTE.iceDeep,
    // Ice does not ripple — it CRACKS. Branching fracture lines are its
    // whole silhouette read (silhouette-readability.md: one signature per
    // material, and never the same signature as its neighbour).
    cracks: 4,
    crackBranches: 2,
    crackAlpha: 0.5,
    // A fracture runs nearly STRAIGHT. The first render let each segment
    // kink by up to +/-0.55 rad and the result read as handwriting scrawled
    // on the ice — recognisably letter-shaped, which is the worst possible
    // accidental read. Fractures also branch part-way ALONG their length,
    // never all from one point (that made a bird/asterisk shape that then
    // repeated identically on every ice voxel).
    crackWander: 0.32,
    // Bubbles frozen into the pan.
    bubbles: 14,
    // A polished lane the wind has swept clear.
    sheens: 3,
    sheenAlpha: 0.34,
    noise: 10,
    edgeCrest: 0.16,
    edgeHollow: 0.22,       // ice sits LOWER than the snow around it
    edgeBreakup: 0.5,
    seed: 613,
  }),
});

// The rule that keeps "snow and ice are different surfaces" honest: if a
// future pass makes the ground one undifferentiated pale mush, this fails.
export const GROUND_MATERIALS = Object.freeze(['snow', 'ice']);
