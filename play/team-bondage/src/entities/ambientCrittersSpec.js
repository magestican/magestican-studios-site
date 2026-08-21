// Ambient critters — PURE DATA. Same pattern as viewmodelSpec / hazardSpec /
// skyBrawlSpec: the art rules live in data so the tests can assert them.
//
// Model space: +X right, +Y up, +Z FORWARD (the way the bird faces). Origin is
// between the feet, so y=0 sits on the ground it was placed on.
//
// # PLACEHOLDER ART — procedural boxes, due a hand-drawn pass per
// docs/DESIGN_PRINCIPLES.md.

const BLACK  = 0x1a1c22;   // back, head, flippers
const BELLY  = 0xf4f2ea;   // the front — the only high-value shape on the bird
const BEAK   = 0xe8a13c;
const FOOT   = 0xd88a2e;
const EYE    = 0x0d0e11;
const EYE_LIT = 0xf6f4ee;  // sclera ring, so the eye reads against black

// A penguin. Emperor-ish: upright, heavy, small head, big pale front.
//
// The silhouette rule (art/knowledge/craft/silhouette.md) matters more here
// than anywhere else in the game, because a penguin stands on a WHITE floor
// under a PALE sky: a mostly-black bird is a hole in the map, which is exactly
// what makes it read at 30 m, and the belly is what stops it being a
// featureless hole up close.
export const PENGUIN = Object.freeze({
  scale: 0.62,
  parts: Object.freeze([
    // Body: a tall rounded slab. Two boxes, the upper one narrower, so the
    // shoulders taper instead of the whole bird being a domino.
    { p: [0, 0.52, 0,      0.52, 0.86, 0.42], hex: BLACK },
    { p: [0, 1.06, 0,      0.44, 0.30, 0.38], hex: BLACK },
    // The white front, proud of the black by a hair so it never z-fights.
    // Narrower and LOWER than the first cut, which ran it 0.34 wide and 0.74
    // tall on a body 0.52 wide — two thirds of the front face, so the bird
    // rendered as a pale slab with a thin black outline and lost the black
    // shoulders that are most of a penguin's read at any distance. The white
    // now starts below the shoulder line and stops well short of the sides.
    { p: [0, 0.46, 0.215,  0.26, 0.58, 0.02], hex: BELLY },
    { p: [0, 0.76, 0.212,  0.16, 0.10, 0.02], hex: BELLY },
    // Head, sitting low on the shoulders — a penguin has almost no neck, and
    // giving it one makes it a duck.
    { p: [0, 1.34, 0.02,   0.34, 0.32, 0.32], hex: BLACK },
    // Cheek patches: the pale wrap around the face. Without them the head is
    // a black cube on a black body and the bird has no face at all.
    { p: [ 0.175, 1.30, 0.05, 0.02, 0.20, 0.22], hex: BELLY },
    { p: [-0.175, 1.30, 0.05, 0.02, 0.20, 0.22], hex: BELLY },
    { p: [0, 1.22, 0.17,   0.26, 0.12, 0.02], hex: BELLY },
    // Eyes — a light ring with a dark pupil in it. On a black head a plain
    // dark eye is invisible; the ring is what makes it a look.
    { p: [ 0.10, 1.38, 0.155, 0.10, 0.10, 0.03], hex: EYE_LIT },
    { p: [-0.10, 1.38, 0.155, 0.10, 0.10, 0.03], hex: EYE_LIT },
    { p: [ 0.10, 1.38, 0.170, 0.05, 0.05, 0.03], hex: EYE },
    { p: [-0.10, 1.38, 0.170, 0.05, 0.05, 0.03], hex: EYE },
    // Beak, angled down.
    { p: [0, 1.27, 0.24,   0.08, 0.08, 0.20], hex: BEAK, tilt: 0.25 },
    // Flippers, held slightly back off the body. Tagged with a role + side so
    // the cheer animation can find them without counting indices — the parts
    // list is art and gets reordered; a role does not.
    { p: [ 0.29, 0.62, -0.02, 0.07, 0.60, 0.24], hex: BLACK, tilt: -0.12,
      role: 'flipper', side: 1,  pivot: [0.29, 0.90, -0.02] },
    { p: [-0.29, 0.62, -0.02, 0.07, 0.60, 0.24], hex: BLACK, tilt: -0.12,
      role: 'flipper', side: -1, pivot: [-0.29, 0.90, -0.02] },
    // Tail, dragging on the ice behind.
    { p: [0, 0.14, -0.26,  0.24, 0.10, 0.22], hex: BLACK, tilt: 0.35 },
    // Feet.
    { p: [ 0.13, 0.05, 0.12, 0.18, 0.10, 0.28], hex: FOOT },
    { p: [-0.13, 0.05, 0.12, 0.18, 0.10, 0.28], hex: FOOT },
  ]),
});

// A Canada goose, for the farm. Upright neck, heavy body, and it CHEERS by
// throwing its wings out, which is the loudest gesture any bird on this map
// has got.
//
// The colour choice is the penguin's argument run in reverse. The penguin note
// above says a mostly-black bird works because it is a hole in a white map.
// The obvious farm goose is a white domestic one — and a white bird on snow
// under a pale sky is invisible at 10 m, which is the whole reason the ground
// pass had to give the snow tile headroom (art/knowledge/craft/color.md). So
// this is a Canada goose: black head and neck standing off the snow, the white
// chin strap breaking the black up close, and a warm brown body that is the
// only warm mass on a cold map. Same rule as the shotgun's bright top rib —
// a dark shape needs something bright splitting it or it is a blob.
const GOOSE_BLACK = 0x191b20;   // head + neck
const GOOSE_BODY  = 0x8a7355;   // warm brown-grey back
const GOOSE_PALE  = 0xd9d2c4;   // flank + chin strap
const GOOSE_FOOT  = 0xd88a2e;

export const GOOSE = Object.freeze({
  scale: 0.66,
  parts: Object.freeze([
    // Body: a long horizontal mass, raised clear of the ground so there is
    // room for LEGS under it. The first cut sat the body at 0.56 with the feet
    // at 0.05 and nothing in between, and the silhouette test showed exactly
    // what that is: a brown crate hovering over two detached orange bricks.
    // Same failure as the trodden-snow footprints that read as rubble — parts
    // that do not touch do not read as one animal.
    { p: [0, 0.66, 0.02,   0.44, 0.42, 0.78], hex: GOOSE_BODY },
    // Breast, forward and slightly lower — a goose is deepest at the front.
    { p: [0, 0.60, 0.30,   0.40, 0.34, 0.26], hex: GOOSE_BODY },
    // Rear taper: narrower and higher, running back to the tail, so the body
    // is a wedge instead of the slab that made it read as a box.
    { p: [0, 0.74, -0.34,  0.30, 0.26, 0.26], hex: GOOSE_BODY },
    // Pale flanks — kept short and low so they read as an underside, not as a
    // label stuck on a crate.
    { p: [ 0.225, 0.56, 0.04, 0.02, 0.20, 0.54], hex: GOOSE_PALE },
    { p: [-0.225, 0.56, 0.04, 0.02, 0.20, 0.54], hex: GOOSE_PALE },
    // LEGS — bridging body to feet. Orange, like the feet, so the eye reads
    // leg-and-foot as one limb.
    { p: [ 0.11, 0.29, 0.12, 0.075, 0.36, 0.075], hex: GOOSE_FOOT },
    { p: [-0.11, 0.29, 0.12, 0.075, 0.36, 0.075], hex: GOOSE_FOOT },
    // Neck: the signature. Tall, thin, black, set FORWARD of the body so the
    // bird has a length as well as a height.
    { p: [0, 1.04, 0.32,   0.17, 0.52, 0.17], hex: GOOSE_BLACK },
    { p: [0, 1.36, 0.34,   0.16, 0.22, 0.16], hex: GOOSE_BLACK },
    // Head.
    { p: [0, 1.52, 0.36,   0.20, 0.20, 0.26], hex: GOOSE_BLACK },
    // The white chin strap — the one marking that says Canada goose, and the
    // bright split that stops the head being a black cube on a black stick.
    { p: [ 0.10, 1.46, 0.36, 0.02, 0.15, 0.16], hex: GOOSE_PALE },
    { p: [-0.10, 1.46, 0.36, 0.02, 0.15, 0.16], hex: GOOSE_PALE },
    { p: [0, 1.40, 0.36,   0.18, 0.03, 0.15], hex: GOOSE_PALE },
    // Eyes: light ring, dark pupil. Same reason as the penguin — a dark eye on
    // a black head is not a look.
    { p: [ 0.075, 1.56, 0.43, 0.07, 0.07, 0.03], hex: EYE_LIT },
    { p: [-0.075, 1.56, 0.43, 0.07, 0.07, 0.03], hex: EYE_LIT },
    { p: [ 0.075, 1.56, 0.442, 0.035, 0.035, 0.03], hex: EYE },
    { p: [-0.075, 1.56, 0.442, 0.035, 0.035, 0.03], hex: EYE },
    // Beak, blunt and forward.
    { p: [0, 1.50, 0.51,   0.11, 0.09, 0.16], hex: GOOSE_BLACK },
    // Tail, kicked up at the back.
    { p: [0, 0.80, -0.50,  0.24, 0.13, 0.22], hex: GOOSE_BLACK, tilt: -0.3 },
    // WINGS — folded along the flanks at rest, thrown wide on a cheer. Pivot
    // at the shoulder, high and forward, so they sweep up and out.
    { p: [ 0.25, 0.70, 0.02, 0.09, 0.30, 0.58], hex: GOOSE_BODY,
      role: 'flipper', side: 1,  pivot: [0.23, 0.86, 0.06] },
    { p: [-0.25, 0.70, 0.02, 0.09, 0.30, 0.58], hex: GOOSE_BODY,
      role: 'flipper', side: -1, pivot: [-0.23, 0.86, 0.06] },
    // Feet, webbed and forward of the leg so the bird is not on stilts.
    { p: [ 0.11, 0.05, 0.17, 0.16, 0.10, 0.28], hex: GOOSE_FOOT },
    { p: [-0.11, 0.05, 0.17, 0.16, 0.10, 0.28], hex: GOOSE_FOOT },
  ]),
});

// Every ambient species, keyed by the `ambient.kind` a map asks for.
export const SPECIES = Object.freeze({
  penguin: PENGUIN,
  goose: GOOSE,
});

export function speciesFor(kind) {
  return SPECIES[kind] ?? PENGUIN;
}

// How fast a bird turns to face you, in radians per second. Deliberately slow:
// a penguin that snaps round is a turret, one that takes about a second and a
// half over half a turn is watching you.
export const TURN_RATE = 1.1;

// The idle shuffle-bob.
export const BOB = Object.freeze({ hz: 0.42, amplitude: 0.035 });

// Beyond this many metres a bird stops tracking and just stands. Chosen so a
// colony turns to follow you as you cross the map rather than all snapping at
// once from the far corner.
export const LOOK_RANGE = 34;

// Maximum permanent lean, in radians. A colony of perfectly upright identical
// birds reads as a row of bollards.
export const HUDDLE_TILT = 0.13;

// ---------------------------------------------------------------------------
// The cheer
// ---------------------------------------------------------------------------
// Bryan 2026-08-21: "penguins cheering". The crowd reacts to the big moments —
// a capture, a chicken obliteration, a steak annihilation.
//
// The whole design problem is in one line already written at the top of
// ambientCritters.js about the idle bob: "a colony breathing in unison is one
// animation played twenty-six times". A cheer is far more conspicuous than a
// bob, so unison would be far worse — twenty-six identical puppets snapping
// their arms up on the same frame. Same failure family as the edge-crest lips
// that lined up into ruled lines across the map
// (art/knowledge/craft/silhouette-readability.md): anything every instance
// does identically becomes a pattern, and a pattern reads as a mechanism.
//
// So the cheer travels: it starts at the thing that caused it and moves
// outward at WAVE_SPEED, which is what a stadium actually does. Every bird
// also flaps at its own rate and its own amplitude, so even two neighbours
// starting on the same frame do not agree.
export const CHEER = Object.freeze({
  // How long one bird cheers for, seconds. Long enough to notice across the
  // map, short enough that a busy match is not a permanent flap.
  duration: 2.8,
  // Metres per second the wave crosses the colony.
  //
  // This is a two-sided constraint and the first cut (18 m/s) failed the far
  // side of it. The map's diagonal is ~90 m, so 18 m/s put the far corner FIVE
  // seconds behind the near birds — who had finished cheering after 2.4. The
  // result would not have read as a wave at all but as two unrelated cheers,
  // one after the other. A wave only reads as one event if the near end is
  // still going when the far end starts, so the corner lag has to be shorter
  // than `duration`; and longer than about 0.8 s or nobody can tell it was not
  // simultaneous. 45 m/s puts the corner 2.0 s back inside a 2.8 s cheer.
  // Locked from both sides by ambientCheer.test.mjs.
  waveSpeed: 45,
  // Flipper swing, radians, at full intensity. The flipper hangs at rest and
  // swings UP and OUT — the arms-overhead shape is the whole read.
  flipperSwing: 2.15,
  // Flaps per second. Varied per bird by +/- flapJitter.
  flapHz: 5.2,
  flapJitter: 0.9,
  // Hop height in metres at full intensity, and how many hops per cheer.
  hopHeight: 0.19,
  hopHz: 2.6,
  // A cheering bird straightens up out of its huddle lean and faces the event.
  // Radians per second — faster than TURN_RATE, because this is a reaction.
  turnRate: 3.4,
  // Per-bird amplitude spread. 1.0 +/- this, so the crowd is uneven.
  amplitudeJitter: 0.28,
});

// Intensity per event kind. The crowd is a scoreboard: the bigger the moment,
// the bigger the reaction, so you can hear what happened without reading the
// kill feed. Capture is the only thing that wins matches, so it is the loudest.
export const CHEER_EVENTS = Object.freeze({
  capture:       1.00,   // a flag came home
  annihilation:  0.85,   // steak poisoning finished someone
  chicken:       0.75,   // the slingshot obliterated someone
  pickup:        0.45,   // someone grabbed the enemy flag — a promise, not a win
  kill:          0.30,   // routine
});
