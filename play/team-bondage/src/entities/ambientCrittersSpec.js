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
    // Flippers, held slightly back off the body.
    { p: [ 0.29, 0.62, -0.02, 0.07, 0.60, 0.24], hex: BLACK, tilt: -0.12 },
    { p: [-0.29, 0.62, -0.02, 0.07, 0.60, 0.24], hex: BLACK, tilt: -0.12 },
    // Tail, dragging on the ice behind.
    { p: [0, 0.14, -0.26,  0.24, 0.10, 0.22], hex: BLACK, tilt: 0.35 },
    // Feet.
    { p: [ 0.13, 0.05, 0.12, 0.18, 0.10, 0.28], hex: FOOT },
    { p: [-0.13, 0.05, 0.12, 0.18, 0.10, 0.28], hex: FOOT },
  ]),
});

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
