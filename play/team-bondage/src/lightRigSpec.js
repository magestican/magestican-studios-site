// The light rig — PURE DATA (no THREE), so the one set of numbers that touches
// every surface in the game lives in one place and can be asserted by tests.
// Same pattern as map/barnPaintSpec.js and entities/viewmodelSpec.js.
//
// Why this file exists at all: these five numbers were copy-pasted into
// game.js and all five art/preview/*.html pages. Six copies of the rig meant
// the preview pages could drift from the game they exist to preview, which
// would quietly invalidate every "measured through the game's own rig" note in
// this codebase. Import LIGHT_RIG instead of retyping it.
//
// ---------------------------------------------------------------------------
// What this pass changed, and what it measured before changing it
// ---------------------------------------------------------------------------
// The old rig was AmbientLight(white, 0.55) + HemisphereLight(sky 0x9fd7ff,
// ground 0x2a4a24, 0.55). That ground colour is a dark green left over from
// when this was a grass map, and GRAPHICS_QUALITY_LOOP called it out: every
// down-facing surface in the game — prop undersides, roof eaves, the barn
// overhang, every character's chin and hooves — was bounce-lit by a dead lawn
// on a snow field.
//
// Measured with art/preview/lightrig.mjs, the diagnosis is only half right,
// and the half that is wrong is the half that matters:
//
//   * 0x2a4a24 is so DARK (linear luminance 0.049, about 8 % of the sky's
//     0.617) that it contributes almost no colour. The undersides were not
//     very green. They were nearly unlit, and what little tint they had was a
//     dull olive: a white cow's chin came back #6f6f67 — blue channel BELOW
//     red, on a snow field.
//   * So swapping the hex for a pale cool bounce, on its own, does not work.
//     Anything pale enough to read costs the thing that makes voxels legible:
//     side-vs-underside face separation. At the queue's suggested #93b2d1 that
//     separation collapses from 12.8 to 4.0 levels and the cube stops
//     modelling itself — against styles/voxel.md, "face normals do the
//     modelling".
//
// The blocker was the AMBIENT light. At 0.55 it carried over half the fill,
// it is hue-neutral, and it is the same in every direction, so it dilutes both
// the bounce colour and the face separation the hemisphere is there to give.
// The fix is to move fill out of ambient and into the hemisphere, which is
// direction-aware, and then pull the SKY half back toward neutral so the
// up-faces keep the warmth they had.
//
// That last step is not optional. textures.js pre-warps the eggshell (painted
// #f2e0ab to land on cream) and hazardSpec.js adds a warm emissive to every
// egg and milk-bottle material, both tuned against the old blue-heavy fill. A
// naive "more hemisphere" rig re-cools exactly those surfaces and puts the
// grey-concrete egg back. Warming the sky half by the measured amount is what
// keeps that pass's work intact — the guards in lightRig.test.mjs are what
// stop the next pass from undoing it by accident.
//
// Measured before -> after (art/preview/lightrig.mjs, sRGB):
//
//   white cow, top face          182 -> 182     held
//   white cow, side face         123 -> 123     held
//   white cow, underside         110 -> 112     held
//   side-vs-underside separation 12.8 -> 13.3   slightly BETTER, not worse
//   snow underside          #6b7173 -> #677382  blue-minus-red 8 -> 27
//   white cow underside     #6f6f67 -> #6b7175  blue-minus-red -8 -> +9
//   eggshell top face, warmth    19 -> 26       cream, still not butter
//
// The visible change: every down-facing surface stops reading olive-grey and
// starts reading as light bounced off snow, at the same exposure, without
// giving up voxel face separation.
export const LIGHT_RIG = Object.freeze({
  // Unchanged. The one directional source; no shadow map, so nothing in the
  // scene is occluded and ambient/hemisphere are pure normal-dependent fill.
  sun: Object.freeze({ color: 0xffffff, intensity: 1.05, dir: Object.freeze([0.6, 1.0, 0.4]) }),

  // 0.55 -> 0.34. Ambient is flat in every direction: every level of it is a
  // level that cannot describe form. Kept non-zero so a surface facing away
  // from both sun and sky never goes to mud.
  ambient: Object.freeze({ color: 0xffffff, intensity: 0.34 }),

  // 0.55 -> 0.86, and both halves re-picked together.
  //   sky    0x9fd7ff -> 0xc5dde5  paler and less saturated, because at the
  //          higher intensity the old sky-blue over-cools every up-face and
  //          undoes the eggshell pre-warp in textures.js.
  //   ground 0x2a4a24 -> 0x7e99b4  the actual point of this pass: snow's
  //          hollow, a cool mid blue-grey, the same hue family
  //          groundPaintSpec.js already paints the ground's own shade with
  //          ("snow's shade is BLUE, not grey"). Its value is chosen to be the
  //          palest cool bounce that still keeps face separation >= the old
  //          rig's, not the palest that looked nice in a swatch.
  hemi: Object.freeze({ sky: 0xc5dde5, ground: 0x7e99b4, intensity: 0.86 }),
});

// The previous rig, kept so the tests can assert the change is an improvement
// against something real rather than against hard-coded numbers, and so a
// future pass can re-measure the trade instead of re-deriving it.
// Per-map rig. Every number that was MEASURED by the 2026-08-21 pass —
// intensities, the ground bounce's relationship to the sky half, the ambient
// fraction — is kept; only the two hues and the sun's strength move, and they
// move with the map's own sky (mapSpec.js SKIES). That is deliberate: the
// measurements above are what stop a naive relight from putting the
// grey-concrete egg back, so a new map gets a new TIME OF DAY, not a new rig.
//
// Takes the sky OBJECT rather than a map id on purpose. This file is imported
// directly by node tests, which cannot resolve the browser's bare 'arbelo/*'
// specifiers, and a relative path up into web-engine resolves to a different
// directory in the deploy layout than it does locally (see the two different
// depths game.js already uses for web-engine imports). Staying import-free
// sidesteps both and keeps this file what its header says it is: pure data.
//
// rigFromSky(SKIES['farm-day']) is LIGHT_RIG exactly — farm-day's sky carries the
// measured values verbatim, and a test asserts it, so adding per-map skies
// could not have changed how the original map looks.
export function rigFromSky(sky) {
  if (!sky) return LIGHT_RIG;
  return Object.freeze({
    sun: Object.freeze({
      color: sky.sunTint ?? LIGHT_RIG.sun.color,
      intensity: sky.sunIntensity ?? LIGHT_RIG.sun.intensity,
      dir: LIGHT_RIG.sun.dir,
    }),
    ambient: LIGHT_RIG.ambient,
    hemi: Object.freeze({
      sky: sky.hemiSky ?? LIGHT_RIG.hemi.sky,
      ground: sky.hemiGround ?? LIGHT_RIG.hemi.ground,
      intensity: LIGHT_RIG.hemi.intensity,
    }),
  });
}

export const PREVIOUS_RIG = Object.freeze({
  sun: Object.freeze({ color: 0xffffff, intensity: 1.05, dir: Object.freeze([0.6, 1.0, 0.4]) }),
  ambient: Object.freeze({ color: 0xffffff, intensity: 0.55 }),
  hemi: Object.freeze({ sky: 0x9fd7ff, ground: 0x2a4a24, intensity: 0.55 }),
});
