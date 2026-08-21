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

  // -- ground WEAR ---------------------------------------------------------
  // Snow that has been WALKED ON is not darker snow, it is a different
  // material: the crystal structure is crushed, so it stops scattering and
  // starts reading closer to wet ice — lower value, and the value RANGE
  // opens up rather than closing, because a boot leaves a hole with a lit
  // rim. That widening range is the whole reason a path reads at 10 m.
  //
  // These hexes look far too dark on a swatch and that is deliberate. Two
  // things sit between the tile and the screen and BOTH compress the step:
  //   1. three's sRGB output transform. A tile painted 79 % of the snow's
  //      value comes back at 86 % of it on screen — the encode curve pulls
  //      everything in the top half of the range together. Getting a 20 %
  //      step in the RENDER costs a ~35 % step in the paint.
  //   2. voxelMesh gives every voxel instance a random value jitter of up
  //      to 8 %, so anything under about a 15 % step is inside the noise and
  //      the edge of the path dissolves into the field.
  // Measured through the game's own rig with `window.__probe` in
  // art/preview/ground.html — the first two cuts of this pass were picked by
  // eye off the swatch and both shipped a path you could not see.
  trodden:     '#8a9cb2',  // packed, crushed snow of a walked lane
  troddenRim:  '#eaf2fb',  // snow shoved up around a footfall, catching sun
  troddenDeep: '#5a6e85',  // the compressed shadowed floor of a print
  straw:       '#c1a45e',  // bedding straw dragged out of the barn and
                           // trodden flat — dulled well below HAY's #f5d53a,
                           // which would read as a fresh bale on the ground
  mud:         '#7d6a55',  // dirt showing through where the snow is gone.
                           // The one WARM note on the entire ground plane —
                           // it is the 10 % accent that says "farm", so it
                           // stays small (see 60-30-10 in color.md)
  rutSnow:     '#7f93ab',  // churned snow of the tractor lane — darker than a
                           // footpath: a tyre compacts harder than a boot and
                           // drags ground up with it
  rutLip:      '#f0f6fd',  // the ridge a tyre shoulders aside
  rutFloor:    '#4e647c',  // the shadowed bottom of the rut itself
});

// One entry per ground material. Fields are the *surface story*, not
// generic knobs: snow is wind-packed and takes a footfall; ice is a hard
// pan that cracks and polishes.
const GROUND_PAINT_VIRGIN = {
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
};

// -- Ground WEAR -----------------------------------------------------------
// The map had no sign that anyone had ever set foot on it. Every one of the
// 4096 ground tiles was pristine wind-carved snow, including the three
// metres directly outside a barn door that a whole team runs through every
// thirty seconds. Wear is what turns a terrain into a PLACE: it records
// where people go.
//
// Two tiles, not one. A boot print is the most recognisable shape we have
// ever painted onto a 64 px tile, and anything recognisable repeated on a
// 1 m grid reads as wallpaper (the graph-paper failure in
// silhouette-readability.md, one step up in severity because this feature is
// high-contrast). `variantSeeds` gives two independently-scattered prints
// tiles, which worldgen alternates by a hash of the tile position.

// The game's sun is at (0.6, 1.0, 0.4); on a ground tile texture-x runs
// along world +X and texture-y along world +Z, so in TILE space the light
// comes from this direction. Every wear feature that has a lit side puts it
// here, so the whole ground plane agrees about where the sun is.
export const TILE_SUN = Object.freeze({ x: 0.83, y: 0.55 });

export const GROUND_PAINT_WEAR = Object.freeze({
  trodden: Object.freeze({
    name: 'trodden',
    field: GROUND_PALETTE.trodden,
    crest: GROUND_PALETTE.troddenRim,
    hollow: GROUND_PALETTE.troddenDeep,
    // Boot prints, in left/right PAIRS along a heading — a scatter of
    // single prints reads as dents, a pair with a stride reads as someone
    // having walked here. One tile is 1 m and a boot is ~0.30 m, so ~2
    // pairs per tile is the honest density for a well-used path.
    // Three pairs, each at its own alpha, deliberately OVERLAPPING. The
    // first cut drew two crisp, isolated, full-strength prints per tile and
    // they read as grey bricks scattered on the snow — fresh prints in
    // untouched powder, which is the opposite of a path. A used path is
    // mostly PARTIAL prints on top of each other.
    printPairs: 3,
    printLen: 17,           // px of a 64 px tile => ~0.27 m boot
    printWide: 7,
    printStride: 20,        // px between the two prints of a pair
    printSpread: 6,         // px sideways between left and right foot
    printAlpha: 0.46,
    printFade: 0.45,        // how faint the faintest pair gets — traffic
                            // means prints of every age at once
    printLugs: 3,           // lit bars across the sole. A plain dark blob is
                            // a dent; the lug gaps are what say BOOT
    printRim: 0.42,         // alpha of the lit rim on the sun side
    // Churn: broad scuff arcs from feet that slid rather than stepped.
    // These are the BIG features — they are what still reads once the
    // prints have mipped away at range.
    churn: 16,
    churnAlpha: 0.24,
    // Bedding straw + bare dirt showing through. Small: warm accents on a
    // cool plane draw the eye far harder than their coverage suggests, and
    // the first cut proved it — three 8 px saturated brown blobs per tile
    // read as litter dropped on the snow and were the ONLY thing the tile
    // said at any distance.
    straws: 11,
    mudPatches: 4,
    mudRadius: 3.2,
    mudAlpha: 0.34,
    noise: 18,
    edgeCrest: 0.16,        // lower than virgin snow: a path is packed FLAT,
    edgeHollow: 0.12,       // it has lost the drift lip between blocks
    edgeBreakup: 0.42,
    variantSeeds: Object.freeze([727, 941]),
  }),
  rut: Object.freeze({
    name: 'rut',
    field: GROUND_PALETTE.rutSnow,
    crest: GROUND_PALETTE.rutLip,
    hollow: GROUND_PALETTE.rutFloor,
    // ONE rut per tile, running the length of the tile along world +X.
    // Worldgen lays two parallel rows of these with a trodden row between,
    // which is what makes a tractor-width TRACK out of a 1 m tile.
    rutWidth: 0.40,         // fraction of the tile the depression spans
    // Angled lugs across the rut. A plain trench is a trench; the lug bars
    // are the only thing that says TYRE.
    treads: 9,
    treadLean: 0.42,        // rad from perpendicular — tractor lugs are a
                            // herringbone, never square across
    treadAlpha: 0.46,
    lipRows: 3,             // px of shouldered-aside snow either side
    lipAlpha: 0.4,
    lipWander: 1.6,         // px of sine wander along the lip. Without it the
                            // lip is a straight bright dashed line at a fixed
                            // height and the tile reads as a ROAD MARKING —
                            // which is the single worst thing a snow farm
                            // could accidentally say
    // Mud the tyre has dragged up out of the ground.
    mudSpecks: 16,
    mudAlpha: 0.4,
    noise: 14,
    edgeCrest: 0.12,
    edgeHollow: 0.1,
    edgeBreakup: 0.3,
    // The rut runs THROUGH the tile boundary along X, so a lit lip on the
    // left/right edges would chop a continuous wheel track into 1 m
    // segments. Only the edges that run parallel to the track get one.
    edgeOnly: 'horizontal',
    seed: 1153,
  }),
});

// The rule that keeps "snow and ice are different surfaces" honest: if a
// future pass makes the ground one undifferentiated pale mush, this fails.
export const GROUND_MATERIALS = Object.freeze(['snow', 'ice', 'trodden', 'rut']);

// One signature per ground material, never shared with a neighbour
// (silhouette-readability.md). Asserted by a test, so a later pass cannot
// quietly give two of them the same treatment.
export const GROUND_SIGNATURE = Object.freeze({
  snow: 'ripples', ice: 'cracks', trodden: 'printPairs', rut: 'treads',
});

// Every ground material in one place. Virgin snow/ice first, then the wear
// tiles that get painted over them where the map has been used.
export const GROUND_PAINT = Object.freeze({
  ...GROUND_PAINT_VIRGIN,
  ...GROUND_PAINT_WEAR,
});
