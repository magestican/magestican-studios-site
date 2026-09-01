
















































export const SHADOW_ROLES = {
  
  
  road: { cast: false, receive: true, why: 'the largest surface in frame; it is what shadows land ON' },
  ground: { cast: false, receive: true, why: 'the field. Receives; a ground plane casting on itself is acne' },
  verge: { cast: false, receive: true, why: '290 m-radius strip beside the road, second-most-looked-at surface' },
  shortcut: { cast: false, receive: true, why: 'a drivable ribbon, same role as the road' },
  cliff: { cast: false, receive: true, why: 'chasm wall; a shadowed wall is most of what gives a chasm depth' },
  guardBank: { cast: false, receive: true, why: 'the banked edge guard, a ground surface like the verge' },
  fascia: {
    cast: true,
    receive: true,
    why: 'the vertical skirt down a raised road edge. A VERTICAL face is the one '
      + 'surface a 31-degree sun models best, and it was in the "neither" list on 2026-08-30',
  },
  kerb: {
    cast: false,
    receive: true,
    why: 'the red/cream ribbon at the road edge - the highest-contrast band in the '
      + 'frame and the universal "edge of the racing surface" read. It received '
      + 'nothing, so a kart driving over a kerb in a barn shadow stayed lit',
  },
  startLine: {
    cast: false,
    receive: true,
    why: '24 chequer tiles laid 4 cm above the road that DOES receive, under the '
      + 'grid, at the one moment every player is looking hardest',
  },

  milkRamp: {
    cast: true,
    receive: false,
    why: 'the 10-degree milk ramp (2026-09-01). It CASTS, because a metre-tall '
      + 'white wedge with no shadow floats above the road and the player cannot '
      + 'judge where its foot is - which is the one thing they need to know to '
      + 'take it straight. It does NOT receive: the kart about to hit it would '
      + 'lay its own shadow across the ramp face at exactly the moment the '
      + 'player is reading that face to line the launch up, and a liquid milk '
      + 'film would not hold a crisp shadow anyway',
  },

  airship: {
    cast: true,
    receive: false,
    why: 'the rescue airship (2026-09-01). A 26 m envelope CASTS, and its shadow '
      + 'sweeping across the road is most of how the rest of the field learns '
      + 'that something is happening above them - the one player it is carrying '
      + 'is the only one who can see the balloon itself. It does not receive: '
      + 'it flies above everything, so there is nothing to shadow it, and the '
      + 'cost of testing that every frame buys a picture that never changes',
  },

  ceremony: {
    cast: true,
    receive: true,
    why: 'the podium rostrum and its three animals (FK-20, 2026-09-01). It '
      + 'stands on the verge in full sun while the camera holds on it for the '
      + 'whole ceremony - an unshadowed block there reads as pasted on',
  },

  
  kart: { cast: true, receive: true, why: 'the hand-built chassis; a kart must shadow its own driver and its neighbour' },
  driver: {
    cast: true,
    receive: true,
    why: 'the animal GLB. 56-64 meshes across the field with NEITHER flag, because '
      + 'kartMesh.js applied them synchronously before loadDriver().then() resolved. '
      + 'render/showcase.js has always done it correctly inside its own .then(), '
      + 'which is what proves this was an oversight and not a policy',
  },

  
  itemBox: {
    cast: true,
    receive: true,
    why: '20 boxes x 2 meshes hovering 1.1 m over the racing line. An object with '
      + 'no ground shadow reads as having no height, and these are the objects a '
      + 'player aims at',
  },
  markerPost: {
    cast: 'high',
    receive: true,
    why: '240 posts at 9 m spacing, each laying a 1.75 m bar across the kerb line. '
      + 'That is the densest available "the sun is out" cue in the whole frame. '
      + 'Gated to high because everything that casts is drawn a second time into '
      + 'the shadow map and the original measurement was on SwiftShader',
  },
  
  
  
  
  
  
  
  
  grindRail: {
    cast: true,
    receive: true,
    why: 'a waist-high pole the player must SEE and aim at from a distance at 200 km/h. '
      + 'Its cast shadow is the only cue that separates a rail standing on the verge '
      + 'from a stripe painted on it, and 595 m of it exists across the roster',
  },
  guardFurniture: { cast: 'high', receive: true, why: 'stones and barrels on a cliff edge; their shadows fall down the cliff' },
  hedgerow: { cast: 'high', receive: false, why: 'instanced foliage, deliberately cheap; casting is the only part worth having' },
  tree: { cast: true, receive: true, why: 'the biggest single shadow available at the roadside' },
  bale: { cast: true, receive: true, why: 'roadside; its shadow is what puts it ON the ground rather than in front of it' },
  barn: { cast: true, receive: true, why: 'a building-sized shadow across the road is the strongest sun cue there is' },
  silo: { cast: true, receive: true, why: 'tall and narrow: a long moving bar across the track' },
  landmark: { cast: true, receive: true, why: 'the per-circuit hero prop' },
  spectator: { cast: true, receive: true, why: 'crowd; receiving is one texture read on meshes already in the shadow pass' },
  fencePost: { cast: true, receive: true, why: 'the roadside rhythm, at the scale a shadow reads' },
  gatePost: { cast: true, receive: true, why: 'the tallest thing at a shortcut mouth' },
  viaductPost: { cast: true, receive: true, why: 'a bridge pier with no shadow floats' },
  startGatePost: { cast: true, receive: true, why: 'the gantry over the grid' },
  marshal: { cast: true, receive: true, why: 'a figure at the roadside' },
  hazardProp: {
    cast: true,
    receive: true,
    why: 'a cowpat or bale dropped on the road. Without a shadow it is a sticker '
      + 'printed on the tarmac rather than an object lying on it, and the player '
      + 'has to decide whether to swerve in under a third of a second',
  },

  
  
  sky: { cast: false, receive: false, why: 'a 900 m dome drawn behind everything, outside the world' },
  backdropHill: { cast: false, receive: false, why: 'MeshBasicMaterial on purpose - unlit, so it is immune to any light change' },
  flagCloth: { cast: false, receive: false, why: 'thin animated cloth; its shadow is noise at any distance it is visible from' },
  shieldBubble: { cast: false, receive: false, why: 'a transparent power-up bubble. A shadow cast by a force field is a bug report' },
  water: { cast: false, receive: false, why: 'a ShaderMaterial with its own lighting model; the shadow chunks are not in it' },
  lava: { cast: false, receive: false, why: 'emissive by definition - a light source does not receive a shadow' },
  fire: { cast: false, receive: false, why: 'additive-blended quads; a shadow map entry for one is a black square' },
  shark: { cast: false, receive: false, why: 'lives under a water ShaderMaterial that cannot receive' },
  particle: { cast: false, receive: false, why: 'pooled instanced smoke and dust, hundreds alive, additive' },
  speedLine: { cast: false, receive: false, why: 'a screen-space speed cue, not an object in the world' },
  tyreMark: { cast: false, receive: false, why: 'a decal lying ON the road; it would shadow-acne against its own receiver' },
};









export const NEITHER_ROLES = new Set([
  'sky', 'backdropHill', 'flagCloth', 'shieldBubble', 'water', 'lava', 'fire',
  'shark', 'particle', 'speedLine', 'tyreMark',
]);












export function shadowsFor(role, quality = 'high') {
  const r = SHADOW_ROLES[role];
  if (!r) {
    throw new Error(
      `shadowsFor: unknown shadow role ${JSON.stringify(role)}. `
      + `Add it to SHADOW_ROLES in web-engine/render/shadowRoles.js with a reason. `
      + `Known: ${Object.keys(SHADOW_ROLES).join(', ')}`,
    );
  }
  return {
    cast: r.cast === 'high' ? quality === 'high' : r.cast,
    receive: r.receive,
  };
}
