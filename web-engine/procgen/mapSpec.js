// The map roster — PURE DATA. No THREE, no grid, no generation.
//
// Team Bondage shipped with exactly one map for its whole life, so "the map"
// and "a snow farm" had become the same idea: every voxel type was a farm
// noun, the generator hardcoded barns, and the sky, the fog and the light rig
// were all tuned to one place. Bryan asked for three more — an icy mountain,
// an ice rink in Central Park, and an arctic floe with penguins watching you —
// which meant the first job was separating "the rules of a Team Bondage
// arena" from "the things that make it a farm".
//
// What is INVARIANT across every map, because the game needs it:
//   * WORLD_SIZE playable tiles (80 x 80 since 2026-08-22), 12 tall.
//   * Two bases at opposite corners, mirrored, each with a flag stand at its
//     centre and a doorway facing mid-map.
//   * A raised centre feature where the chicken slingshot spawns.
//   * Two POWER-UP ZONES on the other diagonal — the gym and the dairy — each
//     a landmark you can name from across the map, each equidistant from both
//     bases so neither team owns one.
//   * A walkable floor at y=0 everywhere a player can stand.
//   * Every step a player must climb is ONE voxel. Autostep is 1.15 m and a
//     jump apex is ~1.5 m, so a two-voxel wall is cover, not terrain — the
//     icy mountain is built entirely out of stepped one-voxel terraces for
//     this reason, not for looks.
//
// What each map gets to CHANGE: ground material, terrain shape, cover
// vocabulary, base architecture, props, ambient life, and its sky.
//
// EVERY COUNT IN THIS FILE IS A DENSITY, quoted per 64 x 64 tiles — the size
// the map was when these numbers were tuned. The generator multiplies them by
// `perArea()` (voxelWorldGen.js) before it scatters anything, so growing the
// world keeps the same props-per-hectare instead of stretching the same props
// thinner. Author new numbers against 64 x 64 and let perArea do the rest.

import { VOX } from '../voxel/voxelGrid.js';

export const DEFAULT_MAP = 'snow-farm';

// ---------------------------------------------------------------------------
// Skies
// ---------------------------------------------------------------------------
// Every sky is FIVE stops down the equirectangular strip, at the same
// fractions, because that is the shape the farm sky was already painted with
// and a per-map gradient is only comparable if the stops line up:
//
//   0.00  zenith          straight up
//   0.35  upper sky
//   0.55  horizon haze    the bright band the player actually looks at
//   0.75  fog colour      MUST match `fog` — this is the stop the world
//                         dissolves into, and a mismatch draws a visible line
//                         across the map where the ground stops
//   1.00  nadir           below the horizon, behind the map
//
// `sunTint` / `hemiSky` / `hemiGround` re-colour the light rig for the map.
// Time of day is the cheapest way to make four maps feel like four places,
// and it costs nothing at runtime.
export const SKIES = Object.freeze({
  // The farm's sky, unchanged — these five stops are the ones skyPaintSpec.js
  // has always used, and a test asserts the two copies stay identical. Its
  // light values are LIGHT_RIG's exactly, so snow-farm renders bit-for-bit as
  // it did before per-map skies existed.
  'farm-day': {
    gradient: [
      { at: 0.00, hex: '#a8c4e0' },
      { at: 0.35, hex: '#c8dcf5' },
      { at: 0.55, hex: '#e6ecf5' },
      { at: 0.75, hex: '#8ec5ff' },
      { at: 1.00, hex: '#3a5a89' },
    ],
    fog: 0x8ec5ff, fogNear: 50, fogFar: 150,
    sunTint: 0xffffff, sunIntensity: 1.05,
    hemiSky: 0xc5dde5, hemiGround: 0x7e99b4,
    cloudAlpha: 1.0,
  },

  // High altitude. The sky gets DARKER and bluer the higher you are, because
  // there is less air above you to scatter light — that one fact is most of
  // what makes a mountain read as a mountain rather than as grey hills. The
  // haze band stays bright because it is snow, not air, doing the reflecting.
  'alpine-thin-air': {
    gradient: [
      { at: 0.00, hex: '#1b437c' },
      { at: 0.35, hex: '#5f97cf' },
      { at: 0.55, hex: '#e4eef6' },
      { at: 0.75, hex: '#c6dcec' },
      { at: 1.00, hex: '#6f8ba6' },
    ],
    fog: 0xc6dcec, fogNear: 55, fogFar: 169,   // thin dry air: you can see FURTHER up here
    sunTint: 0xffffff, sunIntensity: 1.18,   // thin air, nothing softening it
    hemiSky: 0xd3e6f2, hemiGround: 0x8fa8be,
    cloudAlpha: 0.7,                         // you are level with the weather
  },

  // Late afternoon in a city in winter: the sun already low, the haze warm,
  // and the light going amber hours before it should.
  'manhattan-dusk': {
    gradient: [
      { at: 0.00, hex: '#26365f' },
      { at: 0.35, hex: '#7b7ba6' },
      { at: 0.55, hex: '#f6cf9d' },
      { at: 0.75, hex: '#e0b48a' },
      { at: 1.00, hex: '#6d5f56' },
    ],
    fog: 0xe0b48a, fogNear: 43, fogFar: 140,   // city haze, low sun through it
    sunTint: 0xffcf96, sunIntensity: 0.92,   // low sun, and less of it
    hemiSky: 0xf0cfae, hemiGround: 0x9a8b7c, // bounce off grey pavers, not snow
    cloudAlpha: 1.0,
  },

  // Polar twilight: the sun sits ON the horizon for hours and never commits to
  // setting, so the whole sky is one long low-angle gradient and every shadow
  // on the map points the same way all match.
  'polar-twilight': {
    gradient: [
      { at: 0.00, hex: '#1e2c63' },
      { at: 0.35, hex: '#5b67a4' },
      { at: 0.55, hex: '#f0c3b0' },
      { at: 0.75, hex: '#c9c2d8' },
      { at: 1.00, hex: '#4e5a83' },
    ],
    fog: 0xc9c2d8, fogNear: 48, fogFar: 153,   // ice blink softens the far end of the floe
    sunTint: 0xffc2a6, sunIntensity: 0.86,
    hemiSky: 0xd8d2e6, hemiGround: 0x8ea0bd,
    cloudAlpha: 0.55,
  },
});

// ---------------------------------------------------------------------------
// Backdrops — what is OUT OF BOUNDS
// ---------------------------------------------------------------------------
// Bryan 2026-08-22, about the rink: *"add some buildings outside of the map
// area, in an unreachable part of the map, that still feels close enough to
// feel like we are in new york, with lights on the buildings and all"* — and
// then *"add similar things to my other maps"*.
//
// So every map now owns a ring of scenery beyond the 80x80 playfield. It is
// the difference between an arena and a PLACE: the arena tells you what you
// can do, the backdrop tells you where you are doing it. Nothing here is ever
// reachable, collidable or shootable — backdropGen.js emits plain boxes in
// world space, never voxels, and the physics world is built from the voxel
// grid alone, so an out-of-bounds building cannot acquire a collider by
// accident.
//
// The shape of an entry:
//
//   skirt   the ground BEYOND the playfield. A square annulus around the map
//           whose inner edge is this colour and whose outer edge is the sky's
//           own fog stop, so the land runs out into haze instead of ending on
//           a line and leaving the backdrop standing on nothing.
//   bands   concentric rings, nearest first. Each is walked all the way round
//           and filled with one FORM at a radius/width/height/gap range.
//   marks   named landmarks placed at fixed bearings rather than scattered,
//           because a silo you can take a compass bearing off is worth more
//           than three more silos in random places.
//   lines   radial runs (the farm's fences) that leave the map and keep going.
//
// COLOUR IS THE DEPTH CUE, and it follows one rule from
// art/knowledge/craft/color.md: *distance costs CONTRAST, not brightness, and
// against a bright sky the far thing is DARKER*. Every one of these skies has
// a bright horizon band (0.55 stop), so a band that recedes:
//
//   * KEEPS a hard value gap to that band (>= BACKDROP.MIN_SKY_GAP) or it
//     dissolves into the haze and the horizon comes back empty — exactly the
//     failure the far cloud bank shipped;
//   * NARROWS its own lit-to-shade range with distance, which is the thing
//     that actually reads as air between you and it;
//   * lifts its MEAN value toward the sky as it goes back, but never past
//     that gap.
//
// backdrop.test.js asserts all three on every band of every map, so a
// prettier hex cannot quietly undo the depth.
//
// `lit` / `shade` are the two ends of a per-face ramp: a face is shaded by its
// own world normal against the light rig's sun direction, once, at build time.
// Nothing out here is lit at runtime — an unlit value is a number we chose,
// which is the only way to promise a tower stays darker than the sky it is
// standing against (color.md, "a thing that must always look bright should be
// PAINTED, not lit").
export const BACKDROPS = Object.freeze({

  // -- Central Park Rink ----------------------------------------------------
  // Manhattan at dusk, and it is built the way the real thing is built: the
  // park is ringed by a fairly even pre-war apartment WALL, and the towers
  // rise behind it. Getting that order right is most of why it reads as
  // Central Park and not as a generic downtown — a skyline that starts at the
  // treeline has no park in it.
  'manhattan-skyline': {
    id: 'manhattan-skyline',
    skirt: '#4a3f45',
    bands: [
      // The park itself: bare winter trees, near-black, one continuous ragged
      // mass. It is what the towers stand BEHIND, and it hides every base of
      // every building so the city never looks like it is floating.
      { id: 'park-trees', form: 'conifer', depth: 0,
        r: [80, 92], gap: [0.5, 4], w: [3.5, 8], h: [7, 15],
        lit: '#504957', shade: '#16151d' },

      // Fifth Avenue / Central Park West. Shoulder to shoulder, roughly one
      // height, and every window in the city that is close enough to read is
      // in this row.
      { id: 'park-wall', form: 'tower', depth: 1,
        r: [96, 110], gap: [1, 6], w: [8, 15], d: [10, 18], h: [19, 33],
        lit: '#5b5568', shade: '#262437',
        setback: 0.25, crowns: ['flat', 'flat', 'flat', 'water-tower', 'penthouse'],
        windows: 0.5 },

      // Midtown. Setbacks and water towers — the 1920s zoning-law wedding-cake
      // profile is the single most New York silhouette there is, and a row of
      // equal boxes reads as a bar chart.
      { id: 'midtown', form: 'tower', depth: 2,
        r: [134, 156], gap: [6, 22], w: [10, 19], d: [11, 20], h: [34, 66],
        lit: '#63617a', shade: '#3a3850',
        setback: 0.8, crowns: ['step', 'step', 'water-tower', 'spire', 'flat'],
        windows: 0.26 },

      // The far towers. No windows at all: at this range a lit window is a
      // sub-pixel sparkle that aliases, and the silhouette is doing the work.
      { id: 'far-towers', form: 'tower', depth: 3,
        r: [180, 208], gap: [22, 62], w: [13, 24], d: [14, 24], h: [46, 92],
        lit: '#736f88', shade: '#56536c',
        setback: 0.7, crowns: ['spire', 'step', 'twin-mast', 'flat'],
        windows: 0 },
    ],
    // The window grid. A grid is a REPEATING pattern and this project has
    // learned twice over that a repeat ships as banding, so four separate
    // things break it up: a per-building lit BIAS (some towers are mostly
    // dark), whole dark FLOORS, three warm hues plus the odd cold office
    // white, and a lit crown band on a few buildings.
    window: {
      floorPitch: 3.4, colPitch: 2.9, w: 1.15, h: 1.75, margin: 1.8, sill: 5.5,
      darkFloor: 0.18, bias: [0.45, 1.4], crownLit: 0.14,
      warm: ['#ffd88c', '#ffc167', '#fff1c8'],
      cool: '#c8dcff', coolMix: 0.12,
    },
  },

  // -- Snow Farm ------------------------------------------------------------
  // The farm keeps going past the fence. Hedgerow, then the shelter belt, then
  // the woods — and two silos and a neighbour's barn far enough out that they
  // are landmarks rather than props. No lit windows: farm-day is broad
  // daylight, and a lamp on at noon is the fastest way to lose a time of day.
  'farm-horizon': {
    id: 'farm-horizon',
    skirt: '#cfdcec',
    bands: [
      { id: 'hedgerow', form: 'shrub', depth: 0,
        r: [86, 98], gap: [0.5, 6], w: [2.5, 7], h: [2.5, 5.5],
        lit: '#6e7a80', shade: '#2f3b45' },
      { id: 'shelter-belt', form: 'conifer', depth: 1,
        r: [108, 134], gap: [1, 9], w: [4, 9], h: [9, 17],
        lit: '#6f8189', shade: '#3d4d57' },
      { id: 'far-woods', form: 'conifer', depth: 2,
        r: [152, 192], gap: [0.5, 14], w: [6, 13], h: [8, 15],
        lit: '#8b9aa4', shade: '#64737f' },
    ],
    marks: [
      // Two silos and a neighbour's barn, at fixed bearings. Fixed, not
      // seeded: a landmark you can steer by has to be in the same place every
      // match or it is only scenery.
      { form: 'silo',  turn: 0.13, r: 120, w: 5.5, h: 19, lit: '#a8b3bb', shade: '#6b7883' },
      { form: 'silo',  turn: 0.155, r: 124, w: 5, h: 16, lit: '#a8b3bb', shade: '#6b7883' },
      { form: 'barn',  turn: 0.20, r: 116, w: 20, d: 12, h: 9, lit: '#8a4b46', shade: '#4a2b2c' },
      { form: 'barn',  turn: 0.64, r: 140, w: 16, d: 10, h: 8, lit: '#7d5a4a', shade: '#452f2b' },
    ],
    // Fence lines running off toward the horizon. They are the only straight
    // lines out there and they all point AWAY, which is what sells the field
    // as continuing rather than as a painted wall — perspective needs
    // something with a vanishing point in it.
    lines: [
      { turn: 0.06, from: 62, to: 168, postPitch: 4.2, drift: 0.05 },
      { turn: 0.42, from: 62, to: 150, postPitch: 4.6, drift: -0.07 },
      { turn: 0.77, from: 62, to: 176, postPitch: 4.0, drift: 0.09 },
    ],
    fence: { postW: 0.5, postH: 1.7, railH: 0.32, railY: 1.15,
             lit: '#7a7f84', shade: '#3f464e' },
  },

  // -- Icy Mountain ---------------------------------------------------------
  // You are ON a mountain, in a RANGE. Three rings of stepped peaks, each ring
  // taller AND further, so the far range subtends more of the sky than the
  // near one — that inversion is what a real range does and it is the whole
  // reason the map stops reading as a lone hill.
  'alpine-range': {
    id: 'alpine-range',
    skirt: '#c3d3e4',
    bands: [
      { id: 'near-range', form: 'peak', depth: 0,
        r: [88, 114], gap: [-14, 10], w: [26, 48], h: [26, 46],
        lit: '#6c7688', shade: '#2f3745',
        cap: 0.42, capLit: '#adc0d4', capShade: '#7d93ad' },
      { id: 'mid-range', form: 'peak', depth: 1,
        r: [142, 178], gap: [-18, 34], w: [44, 82], h: [46, 74],
        lit: '#7b8698', shade: '#4b5566',
        cap: 0.55, capLit: '#b3c5d8', capShade: '#93a7bd' },
      // The far range is all snow and haze: one narrow value pair, no rock
      // showing, because at that distance rock and snow have averaged out.
      { id: 'far-range', form: 'peak', depth: 2,
        r: [206, 246], gap: [-24, 46], w: [70, 124], h: [62, 106],
        lit: '#9fadc0', shade: '#7e8da2', cap: 0 },
    ],
  },

  // -- Arctic Floe ----------------------------------------------------------
  // "Nothing for miles, and it is watching you." Emptiness IS the content, so
  // this is the one backdrop that is mostly gap: a broken line of pressure
  // ridges close in, then a handful of tabular bergs with a hundred metres of
  // nothing between them. Each berg wears a warm cap where the low sun that
  // never sets catches its top — a warm accent on a cool plane, budgeted at a
  // fraction of the coverage it would get anywhere else (color.md).
  'floe-horizon': {
    id: 'floe-horizon',
    skirt: '#c2ccdf',
    bands: [
      { id: 'pressure-ridges', form: 'ridge', depth: 0,
        r: [84, 102], gap: [14, 58], w: [10, 26], h: [1.6, 4.2],
        lit: '#8493ae', shade: '#3f4a66' },
      { id: 'bergs', form: 'berg', depth: 1,
        r: [128, 192], gap: [46, 150], w: [14, 34], h: [8, 22],
        lit: '#93a0b8', shade: '#5b6884',
        cap: '#b99a92' },
      { id: 'far-bergs', form: 'berg', depth: 2,
        r: [210, 252], gap: [90, 240], w: [22, 52], h: [12, 30],
        lit: '#97a3b8', shade: '#79869e', cap: '#a2999b' },
    ],
  },
});

export function getBackdrop(mapId) {
  return BACKDROPS[getMap(mapId).backdrop] ?? null;
}

// ---------------------------------------------------------------------------
// The maps
// ---------------------------------------------------------------------------
export const MAPS = Object.freeze({

  'snow-farm': {
    id: 'snow-farm',
    name: 'Snow Farm',
    blurb: 'Two barns, a frozen field and a tractor lane. The original.',
    emoji: '🚜',
    sky: 'farm-day',
    backdrop: 'farm-horizon',
    ground: VOX.GRASS,
    patch: { vox: VOX.ICE, count: 24, size: [2, 4] },
    terrain: 'flat',
    centre: { vox: VOX.HILL, style: 'knoll' },
    base: { style: 'barn', sign: 'BARN' },
    cover: ['pillar', 'crate', 'wall'],
    hay: true,
    wear: true,
    props: { snowman: 8, 'fence-post': 40, 'hay-bale': 6, barrel: 7, crate: 9 },
    kit: { trough: 5, 'milk-churn': 6, 'log-pile': 4, 'chopping-block': 3,
           wheelbarrow: 3, 'feed-sack': 7, scarecrow: 2, 'weather-vane': 2,
           'oil-drum': 4, kennel: 2, 'sandbag-wall': 6, 'ammo-crate': 5 },
    // A gaggle of geese on the field. Every farm has them, they are the one
    // farm bird that is not already a playable character, and they are the
    // reason the default map has a crowd at all: the cheer is wasted if the
    // map most people load has nobody in it to do the cheering.
    ambient: { kind: 'goose', count: 22, clusters: 5 },
  },

  'icy-mountain': {
    id: 'icy-mountain',
    name: 'Icy Mountain',
    blurb: 'Stepped granite terraces, a wind-scoured saddle and pines that '
         + 'grow out of the rock. Height is the cover.',
    emoji: '⛰️',
    sky: 'alpine-thin-air',
    backdrop: 'alpine-range',
    ground: VOX.GRASS,
    patch: { vox: VOX.ICE, count: 30, size: [3, 6] },
    // Terraces, not hills. See the invariant note at the top: every rise a
    // player has to climb is exactly one voxel, so the whole mountain is a
    // staircase and none of it needs a jump.
    terrain: 'terraces',
    centre: { vox: VOX.ROCK, style: 'summit' },
    base: { style: 'cabin', sign: 'CAMP' },
    cover: ['spire', 'iceWall', 'boulder'],
    hay: false,
    wear: false,
    props: { snowman: 3, barrel: 4, crate: 6 },
    kit: { pine: 16, cairn: 8, 'ski-pair': 5, 'oil-drum': 4, 'log-pile': 3,
           'ice-axe-rack': 3, sled: 3, 'sandbag-wall': 7, 'ammo-crate': 5 },
    // Mountain goats, and `prefer: 'high'` is the whole point of them: they
    // are placed UP the terraces, not on the flat. The map's name promises
    // altitude, and an animal standing on a ledge you have to climb three
    // courses to reach says that before you have read a word of the HUD.
    // Fewer than the farm's geese and in more clusters — goats stand in twos
    // and threes on separate ledges, not in a gaggle.
    ambient: { kind: 'goat', count: 18, clusters: 7, prefer: 'high' },
  },

  'central-park-rink': {
    id: 'central-park-rink',
    name: 'Central Park Rink',
    blurb: 'An outdoor rink in the middle of the park at dusk: dasher boards, '
         + 'hex-paver paths, bare trees and benches. The ice is the arena.',
    emoji: '⛸️',
    sky: 'manhattan-dusk',
    backdrop: 'manhattan-skyline',
    ground: VOX.PAVER,
    patch: { vox: VOX.GRASS, count: 22, size: [3, 6] },
    // The rink is a single pad in the middle of a park. It is the fastest
    // ground in the game (see FRICTION below) and it is ringed by boards, so
    // crossing it is committing to it.
    terrain: 'rink',
    centre: { vox: VOX.RINK, style: 'faceoff' },
    base: { style: 'pavilion', sign: 'BOX' },
    cover: ['bench', 'planter', 'wall'],
    hay: false,
    wear: false,
    props: { crate: 5, barrel: 3, snowman: 4 },
    kit: { 'lamp-post': 12, bench: 10, 'bare-tree': 14, 'hot-dog-cart': 2,
           'skate-rack': 4, bin: 6, 'pretzel-stand': 1,
           'sandbag-wall': 5, 'ammo-crate': 4 },
    ambient: null,
  },

  arctic: {
    id: 'arctic',
    name: 'Arctic Floe',
    blurb: 'Pack ice under a sun that will not set, pressure ridges, two '
         + 'igloos — and penguins, standing very still, watching you.',
    emoji: '🐧',
    sky: 'polar-twilight',
    backdrop: 'floe-horizon',
    ground: VOX.ICE,
    patch: { vox: VOX.GRASS, count: 28, size: [3, 7] },
    // Pack ice: mostly flat, broken by pressure ridges where two floes have
    // driven into each other and forced a line of ice into the air.
    terrain: 'floes',
    centre: { vox: VOX.IGLOO, style: 'berg' },
    base: { style: 'igloo', sign: 'IGLOO' },
    cover: ['berg', 'ridge', 'boulder'],
    hay: false,
    wear: false,
    props: { snowman: 5, crate: 4, barrel: 3 },
    kit: { 'ice-hole': 7, 'fish-crate': 6, 'ice-axe-rack': 2, sled: 5,
           'oil-drum': 4, 'radio-mast': 2, 'sandbag-wall': 6, 'ammo-crate': 4 },
    // The penguins. They do not move and they do not fight; they stand in
    // loose colonies and turn to face whoever is nearest, which is a great
    // deal more unsettling than if they wandered around.
    ambient: { kind: 'penguin', count: 26, clusters: 6 },
  },
});

export const MAP_IDS = Object.freeze(Object.keys(MAPS));

export function getMap(id) {
  return MAPS[id] ?? MAPS[DEFAULT_MAP];
}

export function getSky(mapId) {
  return SKIES[getMap(mapId).sky] ?? SKIES['farm-day'];
}

// ---------------------------------------------------------------------------
// Per-map ground friction
// ---------------------------------------------------------------------------
// Ice-drift is the game's identity, so no map turns it off — but a swept rink
// is not the same surface as a snow field, and a mountain terrace is not
// either. Higher number = keeps more velocity per frame = more slide.
// Baseline is the farm's 0.96, which every existing tuning note refers to.
export const FRICTION = Object.freeze({
  'snow-farm': 0.96,
  'icy-mountain': 0.945,        // wind-scoured rock has grip; you need it up here
  'central-park-rink': 0.976,   // the fastest surface in the game
  arctic: 0.968,
});

export function frictionFor(mapId) {
  return FRICTION[mapId] ?? FRICTION[DEFAULT_MAP];
}
