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

// A mountain goat, for Icy Mountain. The first NON-BIRD in the roster, and it
// is here because the map's name makes a promise about altitude and nothing
// keeps that promise like the animal that lives on the one ledge you cannot
// reach.
//
// Three decisions worth writing down, because each one is a rule from
// art/knowledge/ pulling against the obvious choice:
//
// 1. NOT pure white. A mountain goat is famously white, and the queue asked
//    for a white body "so it reads against granite" — true while it is stood
//    on rock, and a disaster the moment it steps onto the snow field or is
//    seen against the alpine sky's near-white haze band (#e4eef6), which is
//    exactly how a goat on a terrace edge is seen from below. That is the
//    goose note above, run in reverse. So the goat is cream on TOP and dark
//    underneath — legs, belly skirt, muzzle, beard, horns, hooves — which is
//    snow.js's opposite-face tone pairing applied to an animal: whichever
//    background it is against, one half of it contrasts.
// 2. Longer legs than the farm animals. proportions.md says legs shorter than
//    body depth is our register, and that is right for the cow and the sheep;
//    for a goat it is wrong, because leg length is most of what separates a
//    goat from a sheep at 30 m and a short-legged goat IS a sheep. Legs run
//    about 1.3x body depth here, deliberately against the house rule.
// 3. Horns curving BACK over the neck, in three stepped segments. This is the
//    silhouette signature and nothing else in the game has one — see the
//    per-asset signature table in silhouette-readability.md.
const GOAT_COAT = 0xe4dbc8;   // cream shaggy topcoat, painted UNDER white so
                              // the alpine rig's 1.18 sun has somewhere to go
const GOAT_DARK = 0x4a4239;   // legs, belly skirt, muzzle, beard
const GOAT_HORN = 0x241f1b;   // horn + hoof — the darkest value on the model
const GOAT_EYE  = 0x14120f;

export const GOAT = Object.freeze({
  scale: 0.58,
  // The rear-up. A goat has no wings, so its cheer cannot be the flipper throw
  // every bird uses: it rocks back onto its hind legs and throws its head.
  // That is a BODY pitch, and it has to pivot at the rear hooves — a pitch
  // about the model origin lifts the front and drives the back legs through
  // the rock. `pivotZ` is that hoof line; the runtime lifts the whole animal
  // by |pivotZ| * sin(angle) to keep it planted on it.
  rearUp: Object.freeze({ pivotZ: -0.44 }),
  parts: Object.freeze([
    // --- legs (dark, hooves darker still: proportions.md) -------------------
    // Listed BEFORE the body so the barrel overlaps their tops — a limb that
    // stops short of the mass it hangs off is the goose's floating-crate
    // failure, one map along.
    { p: [ 0.20, 0.44,  0.40, 0.15, 0.88, 0.17], hex: GOAT_DARK,
      role: 'foreleg', side:  1, pivot: [ 0.20, 0.86, 0.40] },
    { p: [-0.20, 0.44,  0.40, 0.15, 0.88, 0.17], hex: GOAT_DARK,
      role: 'foreleg', side: -1, pivot: [-0.20, 0.86, 0.40] },
    // The hind legs are a role too, and they are the reason the rear-up reads
    // as a rear-up. Pitching the body alone tips the hind legs back with it,
    // so at 0.6 rad the animal's whole long axis is on a slant with nothing
    // vertical anywhere in it and the render came back looking like a goat
    // being knocked over. A rearing animal keeps its hind legs UNDER itself;
    // the runtime counters most of the body pitch on this pivot to put them
    // back there.
    { p: [ 0.21, 0.44, -0.44, 0.16, 0.88, 0.18], hex: GOAT_DARK,
      role: 'hindleg', side:  1, pivot: [ 0.21, 0.86, -0.44] },
    { p: [-0.21, 0.44, -0.44, 0.16, 0.88, 0.18], hex: GOAT_DARK,
      role: 'hindleg', side: -1, pivot: [-0.21, 0.86, -0.44] },
    { p: [ 0.20, 0.05,  0.40, 0.19, 0.11, 0.21], hex: GOAT_HORN,
      role: 'foreleg', side:  1, pivot: [ 0.20, 0.86, 0.40] },
    { p: [-0.20, 0.05,  0.40, 0.19, 0.11, 0.21], hex: GOAT_HORN,
      role: 'foreleg', side: -1, pivot: [-0.20, 0.86, 0.40] },
    { p: [ 0.21, 0.05, -0.44, 0.20, 0.11, 0.22], hex: GOAT_HORN,
      role: 'hindleg', side:  1, pivot: [ 0.21, 0.86, -0.44] },
    { p: [-0.21, 0.05, -0.44, 0.20, 0.11, 0.22], hex: GOAT_HORN,
      role: 'hindleg', side: -1, pivot: [-0.21, 0.86, -0.44] },
    // --- body ---------------------------------------------------------------
    // Barrel: 1.28 long by 0.68 deep, ~1.9x longer than tall, which is the
    // quadruped band in proportions.md.
    { p: [0, 1.20, -0.04, 0.60, 0.68, 1.28], hex: GOAT_COAT },
    // The withers hump, high and FORWARD of the barrel. Second silhouette
    // signature after the horns, and the reason the animal reads as built for
    // climbing rather than for grazing.
    { p: [0, 1.56,  0.24, 0.54, 0.30, 0.60], hex: GOAT_COAT },
    // Rump, lower and shorter, so the back line falls away behind the hump.
    { p: [0, 1.16, -0.62, 0.50, 0.54, 0.28], hex: GOAT_COAT },
    // The belly skirt — the shaggy dark underline. Proud of the barrel by a
    // hair in X so it survives a pure side view, and it is what keeps the
    // animal off the snow when it is stood on the white field.
    { p: [0, 0.92, -0.04, 0.62, 0.16, 1.16], hex: GOAT_DARK },
    // --- head, on its own pivot so the cheer can throw it -------------------
    // Neck, running forward and slightly down out of the hump. A goat does not
    // carry its head up the way the goose does, and that difference is most of
    // what stops the two species reading as one animal in silhouette.
    { p: [0, 1.44, 0.66, 0.34, 0.44, 0.36], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    // Narrow face — 0.26 across against a 0.60 body.
    { p: [0, 1.44, 0.96, 0.26, 0.30, 0.34], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [0, 1.36, 1.16, 0.20, 0.18, 0.16], hex: GOAT_DARK,
      role: 'head', pivot: [0, 1.48, 0.50] },
    // The beard. Cheap, and nothing else in the game has one.
    { p: [0, 1.18, 1.06, 0.11, 0.26, 0.11], hex: GOAT_DARK,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [ 0.19, 1.54, 0.90, 0.14, 0.09, 0.17], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.19, 1.54, 0.90, 0.14, 0.09, 0.17], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    // Eyes: a dark pupil straight onto the cream, no sclera ring. The ring on
    // the penguin and the goose is there because a dark eye on a BLACK head is
    // invisible; on a pale head the ring is the part that would disappear.
    { p: [ 0.075, 1.49, 1.125, 0.07, 0.07, 0.03], hex: GOAT_EYE,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.075, 1.49, 1.125, 0.07, 0.07, 0.03], hex: GOAT_EYE,
      role: 'head', pivot: [0, 1.48, 0.50] },
    // HORNS — three stepped segments each, rising and then sweeping BACK over
    // the neck. Consecutive segments overlap in both Y and Z: a horn drawn as
    // separate blocks is the egg-crack failure again, where a feature made of
    // parts that do not touch reads as debris rather than as one form.
    { p: [ 0.105, 1.72, 0.94, 0.12, 0.26, 0.13], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.105, 1.72, 0.94, 0.12, 0.26, 0.13], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [ 0.11, 1.94, 0.82, 0.115, 0.22, 0.15], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.11, 1.94, 0.82, 0.115, 0.22, 0.15], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    // The last segment is LONG IN Z, not another stub. First cut made all
    // three the same chunky little block and the render came back with a
    // vague dark lump on the head — at 10 m the horn was not a shape, it was
    // more head. A sweep only reads as a sweep if the far end of it clears
    // the outline of the thing it grows out of.
    { p: [ 0.115, 2.06, 0.62, 0.11, 0.15, 0.26], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.115, 2.06, 0.62, 0.11, 0.15, 0.26], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    // Tail: a short dark stub. proportions.md — the tail is personality,
    // never skip it. Curly = pig, tufted = cow, stub = goat.
    //
    // It is SMALL, and it was not in the first cut. Held up proud of the back
    // line at the size a tail wants to be, a dark stub on a pale rump is a
    // second dark lump the same size as the head, and at 10 m the animal
    // stopped having a front: you could not tell which end you were looking
    // at. A quadruped's value pattern has to be directional or the silhouette
    // is doing half its job.
    { p: [0, 1.34, -0.74, 0.12, 0.14, 0.11], hex: GOAT_DARK },
  ]),
});

// Every ambient species, keyed by the `ambient.kind` a map asks for.
export const SPECIES = Object.freeze({
  penguin: PENGUIN,
  goose: GOOSE,
  goat: GOAT,
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
  // --- the non-bird cheer ------------------------------------------------
  // A goat has no wings, so `flipperSwing` says nothing about it. Its cheer is
  // a REAR-UP: the body pitches back over the hind hooves, the forelegs paw,
  // and the head throws. Three separate numbers because they are three
  // separate reads and the first two are the ones visible at 30 m.
  //
  // The rear angle is the only one with a hard floor: under about 0.35 rad the
  // front hooves are still scuffing the rock and the silhouette says
  // "standing", which is what it says the rest of the time — the same argument
  // `flipperSwing` makes for the birds. 0.62 rad lifts the front hooves about
  // a quarter of a metre off the ground on this model.
  rearUp: 0.62,
  // The forelegs paw, and they paw in ANTIPHASE — both legs pumping together
  // is a rabbit, and it is also the unison failure this whole block exists to
  // avoid, at the scale of a single animal.
  foreLegPaw: 1.05,
  // The head throws back. Nose UP, so the horns sweep down behind the neck,
  // which is what makes the horn silhouette move instead of just translate.
  headToss: 0.5,
  // How much of the body pitch the hind legs cancel out, so they stay under
  // the animal instead of swinging out behind it. Not 1.0: a leg held dead
  // vertical while the body above it rotates reads as a hinge, and the hock
  // does bend back a little in a real rear.
  hindLegBrace: 0.8,
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
