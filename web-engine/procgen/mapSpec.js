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
//   * 64 x 64 playable tiles, 12 tall.
//   * Two bases at opposite corners, mirrored, each with a flag stand at its
//     centre and a doorway facing mid-map.
//   * A raised centre feature where the chicken slingshot spawns.
//   * A walkable floor at y=0 everywhere a player can stand.
//   * Every step a player must climb is ONE voxel. Autostep is 1.15 m and a
//     jump apex is ~1.5 m, so a two-voxel wall is cover, not terrain — the
//     icy mountain is built entirely out of stepped one-voxel terraces for
//     this reason, not for looks.
//
// What each map gets to CHANGE: ground material, terrain shape, cover
// vocabulary, base architecture, props, ambient life, and its sky.

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
    fog: 0x8ec5ff, fogNear: 40, fogFar: 120,
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
    fog: 0xc6dcec, fogNear: 44, fogFar: 135,   // thin dry air: you can see FURTHER up here
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
    fog: 0xe0b48a, fogNear: 34, fogFar: 112,   // city haze, low sun through it
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
    fog: 0xc9c2d8, fogNear: 38, fogFar: 122,   // ice blink softens the far end of the floe
    sunTint: 0xffc2a6, sunIntensity: 0.86,
    hemiSky: 0xd8d2e6, hemiGround: 0x8ea0bd,
    cloudAlpha: 0.55,
  },
});

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
