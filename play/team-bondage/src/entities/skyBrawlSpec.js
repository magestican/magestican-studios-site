// The sky brawl — PURE DATA + PURE MATH, no THREE.
//
// Until 2026-08-21 the bull and the horse were PAINTED onto the
// equirectangular sky canvas: 2D ellipses redrawn 12 times a second onto a
// texture wrapped round a sphere. Bryan's note — "make it 3d characters maybe
// instead of an image, if that is an impediment to make the bull and the horse
// fight" — is the correct diagnosis of why it never looked like a fight. A
// painting cannot fight. It has:
//
//   * no parallax — the two animals are the same flat picture from every
//     position on the map, so walking under them proves they are wallpaper;
//   * no perspective — a charge toward the viewer is impossible, so the whole
//     brawl could only ever be staged side-on;
//   * no lighting — the painted tones are fixed, so the fight is lit by a
//     different sun than everything under it;
//   * no occlusion — nothing can pass in front of a body, so a grapple was
//     drawn as a dust ball because overlapping limbs would have read as mush.
//
// So the animals became real meshes hung in the sky (entities/skyBrawl.js) and
// this file holds every number that drives them. Same pattern as
// viewmodelSpec.js / hazardSpec.js / lightRigSpec.js: the art rules live in
// data so the tests can assert them, and so a later pass cannot quietly break
// the staging while "just tweaking the animation".
//
// Model space convention (shared by both animals):
//   +X right, +Y up, +Z FORWARD (the direction the animal faces / charges).
//   Origin is between the hooves, so y=0 is the ground under the animal.
//   One model unit ~= one metre of animal, then scaled by SKY.modelScale.
//
// # PLACEHOLDER ART — the box parts below are procedural, to be replaced by a
// hand-drawn pass per docs/DESIGN_PRINCIPLES.md.

// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------
// The brawl hangs off an anchor that tracks the camera POSITION but not its
// rotation, so it stays put in the sky (look north and up to find it) while
// never getting closer no matter how far you run. That is what a thing 140 m
// away and 40 m across looks like on a 64 m map: effectively at infinity, but
// still a real object with real perspective, unlike the painting it replaced.
// The camera's far plane. It lives HERE rather than in game.js because the
// sky brawl is the only thing in the game that is deliberately further away
// than the map, so it is the only thing that can outgrow the frustum — and it
// did: scaling the animals up from 11 to 14 put the far corner of the throw at
// 221 m against a far plane of 200, which clips a leg off the horse mid-air.
// game.js imports this so the two cannot drift apart. Fog ends at 120, so
// everything past that is fog-coloured anyway; a bigger far plane costs a
// little depth precision and nothing else.
export const CAMERA_FAR = 320;

export const SKY = Object.freeze({
  // Distance from the eye. Must clear the world (the map's longest diagonal is
  // ~90 m) so the sky animals always sort BEHIND everything you can shoot,
  // and must stay inside the camera's far plane (200) with the model's own
  // half-extent added on top.
  radius: 140,
  elevationDeg: 30,      // above the horizon; see the note on framing below
  azimuthDeg: 0,         // 0 = due -Z. Both barns sit on the +X/+Z diagonal,
                         // so north is the one bearing that is nobody's base.
  modelScale: 14,        // model units -> world metres
  // Tilt the whole stage back by its own elevation so the fight PLANE faces
  // the eye. Without this the brawl is staged 30 degrees above you and you
  // watch it from underneath — the first render of this pass was two animal
  // BELLIES, because "side-on" and "seen from below" are not the same framing
  // and only the first one is a fight.
  faceTheEye: true,
  cycleSeconds: 9.0,     // one full charge -> clash -> grapple -> throw -> stagger
  // Fog is OFF for every sky material: the map's fog ends at 120 m and the
  // brawl is at 140, so an unfogged mesh is the only way it is visible at all.
  fogged: false,
});

// Framing check used by the tests. A 75-degree VERTICAL fov on 16:9 sees
// roughly -20..+27 degrees of elevation at neutral pitch (the finding recorded
// by the cloud pass in art/knowledge/), so at 30 degrees the brawl is JUST
// above the neutral view — you see it by looking up, which is the ask, but a
// glance up finds it rather than a full neck-crane.
export const FRAMING = Object.freeze({
  neutralViewTopDeg: 27,
  maxCraneDeg: 55,
});

// ---------------------------------------------------------------------------
// Fight choreography
// ---------------------------------------------------------------------------
// Phase boundaries as fractions of one cycle. A real fight is mostly the
// middle: the run-up and the recovery are punctuation.
export const PHASES = Object.freeze([
  { name: 'charge',  until: 0.20 },
  { name: 'clash',   until: 0.28 },
  { name: 'grapple', until: 0.64 },
  { name: 'throw',   until: 0.78 },
  { name: 'stagger', until: 1.00 },
]);

// Half the gap between the two animals at the start of the charge, in model
// units. They start off-screen-ish and close it.
export const REST_SEPARATION = 5.0;
// Half the gap while locked head-to-head. Their heads are ~1.5 long, so this
// is contact, not a near miss — the single most important number in the file,
// because "the animals never actually touch" is exactly what made the painted
// version read as two pictures side by side.
export const LOCK_SEPARATION = 1.55;

export const GALLOP_HZ = 2.6;      // leg cycles per second during the charge
export const SHOVE_HZ = 0.9;       // how fast the grapple pushes back and forth
export const SHOVE_AMPLITUDE = 0.7; // model units the lock slides under a shove
export const THROW_HEIGHT = 6.5;   // apex the horse reaches when hurled

const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
// Ease that starts slow and ends fast — a charge accelerates into the hit.
const easeIn = (t) => t * t;
// Ease that starts fast and settles — a recoil, a stagger, a landing.
const easeOut = (t) => 1 - (1 - t) * (1 - t);

// Which phase is `tNorm` (0..1) in, and how far through it?
export function phaseAt(tNorm) {
  const p = ((tNorm % 1) + 1) % 1;
  let from = 0;
  for (const ph of PHASES) {
    if (p < ph.until) {
      return { name: ph.name, p: (p - from) / (ph.until - from) };
    }
    from = ph.until;
  }
  const last = PHASES[PHASES.length - 1];
  return { name: last.name, p: 1 };
}

// ---------------------------------------------------------------------------
// poseAt(t) — the whole fight as one pure function of time in SECONDS.
// ---------------------------------------------------------------------------
// Returns, in model space:
//   bull / horse : { x, y, z, yaw, pitch, roll, legSwing, headTilt, squash }
//   dust         : { x, y, z, scale, spin, alpha }
//   stars        : { alpha, spin, over: 'both' | 'horse' | 'none' }
//   impact       : 0..1, a one-frame spike at the moment of contact
//
// x is the fight axis: the bull comes from -x facing +x, the horse from +x
// facing -x. `yaw` is radians about +Y from the model's +Z forward, so the
// bull's resting yaw is +90 degrees and the horse's is -90.
export function poseAt(t) {
  const tNorm = (t % SKY.cycleSeconds) / SKY.cycleSeconds;
  const { name, p } = phaseAt(tNorm);

  const bull  = blank(+Math.PI / 2);
  const horse = blank(-Math.PI / 2);
  const dust  = { x: 0, y: 0.55, z: 0, scale: 0, spin: t * 1.6, alpha: 0 };
  const stars = { alpha: 0, spin: t * 3.0, over: 'none' };
  let impact = 0;

  if (name === 'charge') {
    // Both gallop in. Heads drop as they commit — a bull that charges with its
    // head up is a bull that has not decided to hit anything.
    const e = easeIn(p);
    const sep = lerp(REST_SEPARATION, LOCK_SEPARATION + 0.5, e);
    bull.x = -sep; horse.x = +sep;
    // Gallop bob: the body rises off the stride, so the vertical motion and
    // the leg swing share one phase rather than being two loose animations.
    const gp = t * GALLOP_HZ * TAU;
    bull.legSwing  = Math.sin(gp);
    horse.legSwing = Math.sin(gp + Math.PI * 0.6);   // out of step with the bull
    bull.y  = Math.abs(Math.sin(gp)) * 0.35;
    horse.y = Math.abs(Math.sin(gp + Math.PI * 0.6)) * 0.30;
    bull.headTilt  = -0.35 * e;
    horse.headTilt = -0.25 * e;
    bull.pitch  = -0.10 * e;
    horse.pitch = -0.08 * e;

  } else if (name === 'clash') {
    // Contact. Both squash on the frame of the hit and rebound, and the dust
    // ball is BORN here rather than fading in — an impact that arrives
    // gradually is not an impact.
    const hit = Math.exp(-p * 7);            // 1 at contact, ~0 by end of phase
    impact = hit;
    bull.x  = -(LOCK_SEPARATION - 0.25 * hit);
    horse.x = +(LOCK_SEPARATION - 0.25 * hit);
    bull.squash  = 1 - 0.18 * hit;
    horse.squash = 1 - 0.22 * hit;
    bull.roll  = +0.20 * hit;
    horse.roll = -0.26 * hit;
    horse.pitch = -0.30 * hit;               // the lighter animal gets lifted
    horse.y = 0.6 * hit;
    bull.headTilt = -0.40;
    horse.headTilt = -0.30;
    dust.scale = easeOut(clamp01(p * 3)) * 3.2;
    dust.alpha = 1;

  } else if (name === 'grapple') {
    // Not two animals leaning on each other — that is a scrum, and a scrum at
    // 140 m is one lump. They fight the way these two animals actually would,
    // and the two answers are different, which is what makes the exchange
    // legible: the BULL keeps its head down and shoves with its horns, the
    // HORSE rears onto its hind legs and strikes down with its front hooves.
    const shove = Math.sin(t * SHOVE_HZ * TAU) * SHOVE_AMPLITUDE;
    const strain = Math.sin(t * SHOVE_HZ * TAU * 3) * 0.06;
    // The rear is its own beat, faster than the shove, so the horse comes down
    // on the bull rather than hovering.
    const rear = 0.5 + 0.5 * Math.sin(t * SHOVE_HZ * TAU * 2 - Math.PI / 2);

    bull.x  = -LOCK_SEPARATION + shove;
    bull.pitch = -0.26 - Math.max(0, -shove) * 0.14 + strain;
    bull.headTilt = -0.5;
    bull.legSwing = Math.sin(t * 9) * 0.5;
    bull.y = Math.abs(Math.sin(t * 9)) * 0.08;

    horse.x = +LOCK_SEPARATION + 0.35 + shove * 0.7;
    horse.pitch = -0.20 - rear * 0.95;       // up onto the hind legs
    horse.y = rear * 0.55;
    horse.headTilt = 0.15 + rear * 0.25;     // head back as it goes up
    horse.legSwing = Math.sin(t * 6) * 0.18; // hind legs planted, just bracing
    horse.frontSwing = -0.9 * rear + Math.sin(t * 13) * 0.35 * rear;  // striking

    dust.x = shove * 0.5;
    dust.scale = 2.2 + Math.sin(t * 3.1) * 0.30;
    dust.alpha = 1;

  } else if (name === 'throw') {
    // The bull wins the shove and hurls the horse up and AWAY, back down its
    // own side of the fight axis. The first cut threw it over the bull's
    // shoulder, which looks better in a still and is wrong in motion: the
    // horse then has to travel back across the bull during the stagger, at
    // ground height, and the two bodies pass clean through each other (they
    // came within 0.01 model units — measured, not guessed). Thrown back the
    // way it came, the pair never share a position and the loop closes on its
    // own.
    const e = p;
    const arc = Math.sin(e * Math.PI);       // 0 -> 1 -> 0
    horse.x = lerp(+LOCK_SEPARATION, +REST_SEPARATION * 1.12, e);
    horse.y = arc * THROW_HEIGHT;
    horse.roll  = e * TAU * 0.85;            // a tumble, not quite a full turn
    horse.pitch = -0.5 + e * 1.4;
    horse.yaw = -Math.PI / 2 - e * 0.9;      // spun away from the bull
    horse.legSwing = Math.sin(t * 14) * 1.2; // flailing
    bull.x = -LOCK_SEPARATION + easeOut(e) * 1.1;
    bull.pitch = -0.9 * Math.sin(e * Math.PI * 0.9);   // rear up, come down
    bull.y = Math.sin(e * Math.PI * 0.9) * 0.5;
    bull.headTilt = -0.2 + e * 0.5;
    dust.scale = 2.4 * (1 - e);
    dust.alpha = 0.8 * (1 - e);
    stars.alpha = e;
    stars.over = 'horse';

  } else {
    // Stagger: the horse lands hard, both wobble apart, stars over both heads,
    // and everything eases back to the charge start so the loop does not snap.
    const e = easeOut(p);
    const wobble = (1 - p);
    horse.x = lerp(+REST_SEPARATION * 1.12, +REST_SEPARATION, e);
    horse.y = Math.max(0, Math.sin((1 - p) * Math.PI * 2) * 0.25 * wobble);
    horse.roll  = Math.sin(t * 7) * 0.22 * wobble;
    horse.yaw   = lerp(-Math.PI / 2 - 0.9, -Math.PI / 2, e);
    horse.pitch = 0.9 * (1 - e);
    bull.x = lerp(-LOCK_SEPARATION + 1.1, -REST_SEPARATION, e);
    bull.roll  = Math.sin(t * 6 + 1) * 0.18 * wobble;
    bull.pitch = 0.15 * wobble;
    bull.legSwing  = Math.sin(t * 4) * 0.3 * wobble;
    horse.legSwing = Math.sin(t * 4.5) * 0.35 * wobble;
    bull.headTilt  = 0.15 * wobble;
    horse.headTilt = 0.20 * wobble;
    stars.alpha = wobble;
    stars.over = 'both';
    dust.alpha = 0.35 * wobble;
    dust.scale = 2.0 * wobble;
  }

  return { phase: name, phaseP: p, bull, horse, dust, stars, impact };
}

function blank(yaw) {
  // frontSwing is separate from legSwing so a rear can throw the FRONT hooves
  // without the hind legs leaving the ground. With one swing value the rearing
  // horse pedalled all four legs and read as falling over backwards.
  return { x: 0, y: 0, z: 0, yaw, pitch: 0, roll: 0,
           legSwing: 0, frontSwing: null, headTilt: 0, squash: 1 };
}

// The gap between the two bodies along the FIGHT AXIS at time t. Goes
// negative during the throw, when the horse is hurled over the bull and lands
// behind it — which is why "do they overlap" is a different question, asked by
// centreDistanceAt below. Exported because "do they ever actually touch" is
// the question the choreography has to answer and a test should be able to ask
// it directly rather than re-deriving it from poseAt.
export function separationAt(t) {
  const { bull, horse } = poseAt(t);
  return horse.x - bull.x;
}

// True 3D distance between the two body origins. The throw carries the horse
// ACROSS the bull, so the axis gap alone would report an interpenetration that
// is really six metres of daylight underneath a thrown animal.
export function centreDistanceAt(t) {
  const { bull, horse } = poseAt(t);
  return Math.hypot(horse.x - bull.x, horse.y - bull.y, horse.z - bull.z);
}

// ---------------------------------------------------------------------------
// The models
// ---------------------------------------------------------------------------
// Boxes, in the palette the ground animals already use, grouped into named
// BONES so the choreography above has something to move. `bone` is one of:
//   body | head | legFL | legFR | legBL | legBR | tail
// Anything on the `head` bone tilts with headTilt; anything on a leg bone
// swings with legSwing (front and back in opposition, left and right in
// opposition, which is what makes a gallop read as a gallop).
//
// Each part is [x, y, z, w, h, d, hex]. Pivots are given per bone.

// Rendered side by side at 140 m the first cut of this palette was two brown
// animals: bull #3d2a1e against horse #7a4d2b is 12 levels of value apart, and
// at that distance against a pale sky both resolve to "dark brown lump". They
// are now separated by VALUE first (craft/color.md: value before hue) — the
// bull is nearly black, the horse is a light chestnut — so the pair reads as
// two different animals even in the 1/8th-screen row.
const BULL_HIDE   = 0x2b1d14;
const BULL_DARK   = 0x1c130d;
const BULL_MUZZLE = 0x6b5540;
const HORN        = 0xf6f1e6;
// Two hoof tones, and the reason is a trap this pass walked into: once the
// bull was retoned to near-black there was no room BELOW it, so a dark hoof
// came out 15 levels off the leg and vanished. A hoof reads by contrast, not
// by being dark — so the bull gets the pale worn horn a bull actually has,
// and the light-chestnut horse gets the dark one.
const HOOF_PALE   = 0xa2937c;   // bull, against near-black legs
const HOOF_DARK   = 0x241a12;   // horse, against a light chestnut leg
const HORSE_COAT  = 0xb5793d;
const HORSE_DARK  = 0x8f5c2a;
const HORSE_MANE  = 0x33230f;
const EYE_HOT     = 0xf4c95d;

export const BONE_PIVOTS = Object.freeze({
  bull: {
    body:  [0, 0, 0],
    head:  [0, 1.72, 1.15],
    legFL: [ 0.42, 1.20,  0.72], legFR: [-0.42, 1.20,  0.72],
    legBL: [ 0.44, 1.20, -0.78], legBR: [-0.44, 1.20, -0.78],
    tail:  [0, 1.62, -1.25],
  },
  horse: {
    body:  [0, 0, 0],
    head:  [0, 3.35, 1.20],
    legFL: [ 0.34, 1.62,  0.70], legFR: [-0.34, 1.62,  0.70],
    legBL: [ 0.36, 1.62, -0.72], legBR: [-0.36, 1.62, -0.72],
    tail:  [0, 2.05, -1.25],
  },
});

// A bull: low, wide, front-heavy, with a shoulder hump and forward horns.
// The silhouette rule (art/knowledge/craft/silhouette.md) is that the two
// animals must be tellable apart as black shapes — so the bull is a BRICK on
// short legs with a hump, and the horse is a WEDGE on long legs with a neck.
export const BULL_PARTS = Object.freeze([
  // torso
  { bone: 'body', p: [0, 1.55, 0,      1.70, 1.15, 2.60], hex: BULL_HIDE },
  // shoulder hump — the bull's one unmistakable landmark
  { bone: 'body', p: [0, 2.28, 0.55,   1.35, 0.55, 1.10], hex: BULL_DARK },
  // chest slab, so the front reads heavier than the rear from side-on
  { bone: 'body', p: [0, 1.45, 1.05,   1.55, 1.05, 0.70], hex: BULL_DARK },
  // neck
  { bone: 'body', p: [0, 1.85, 1.35,   0.95, 0.85, 0.60], hex: BULL_HIDE },
  // head
  { bone: 'head', p: [0, -0.06, 0.42,  0.95, 0.85, 1.00], hex: BULL_HIDE },
  { bone: 'head', p: [0, -0.20, 1.00,  0.62, 0.48, 0.35], hex: BULL_MUZZLE },
  // nostril flare
  { bone: 'head', p: [ 0.16, -0.18, 1.18, 0.14, 0.12, 0.06], hex: BULL_DARK },
  { bone: 'head', p: [-0.16, -0.18, 1.18, 0.14, 0.12, 0.06], hex: BULL_DARK },
  // horns: out, then forward — a fighting horn, not a decorative one
  { bone: 'head', p: [ 0.62, 0.28, 0.35, 0.62, 0.20, 0.20], hex: HORN },
  { bone: 'head', p: [-0.62, 0.28, 0.35, 0.62, 0.20, 0.20], hex: HORN },
  { bone: 'head', p: [ 0.88, 0.30, 0.72, 0.20, 0.20, 0.62], hex: HORN },
  { bone: 'head', p: [-0.88, 0.30, 0.72, 0.20, 0.20, 0.62], hex: HORN },
  // ears
  { bone: 'head', p: [ 0.55, 0.10, 0.10, 0.30, 0.16, 0.18], hex: BULL_HIDE },
  { bone: 'head', p: [-0.55, 0.10, 0.10, 0.30, 0.16, 0.18], hex: BULL_HIDE },
  // eyes, hot so the fight has a face at 140 m
  { bone: 'head', p: [ 0.33, 0.10, 0.86, 0.16, 0.16, 0.06], hex: EYE_HOT },
  { bone: 'head', p: [-0.33, 0.10, 0.86, 0.16, 0.16, 0.06], hex: EYE_HOT },
  // legs — thick, short
  { bone: 'legFL', p: [0, -0.60, 0,  0.40, 1.20, 0.40], hex: BULL_HIDE },
  { bone: 'legFR', p: [0, -0.60, 0,  0.40, 1.20, 0.40], hex: BULL_HIDE },
  { bone: 'legBL', p: [0, -0.60, 0,  0.42, 1.20, 0.42], hex: BULL_HIDE },
  { bone: 'legBR', p: [0, -0.60, 0,  0.42, 1.20, 0.42], hex: BULL_HIDE },
  { bone: 'legFL', p: [0, -1.14, 0,  0.46, 0.22, 0.46], hex: HOOF_PALE },
  { bone: 'legFR', p: [0, -1.14, 0,  0.46, 0.22, 0.46], hex: HOOF_PALE },
  { bone: 'legBL', p: [0, -1.14, 0,  0.48, 0.22, 0.48], hex: HOOF_PALE },
  { bone: 'legBR', p: [0, -1.14, 0,  0.48, 0.22, 0.48], hex: HOOF_PALE },
  // tail
  { bone: 'tail', p: [0, -0.35, -0.10, 0.16, 0.85, 0.16], hex: BULL_HIDE },
  { bone: 'tail', p: [0, -0.85, -0.10, 0.24, 0.30, 0.24], hex: BULL_DARK },
]);

// A horse: taller, leaner, long neck up and forward, long legs, big mane.
export const HORSE_PARTS = Object.freeze([
  { bone: 'body', p: [0, 2.10, 0,      1.05, 0.95, 2.30], hex: HORSE_COAT },
  { bone: 'body', p: [0, 2.02, -1.05,  1.05, 1.05, 0.75], hex: HORSE_DARK },  // haunch
  { bone: 'body', p: [0, 2.10, 0.95,   0.95, 0.90, 0.60], hex: HORSE_COAT },  // chest
  // The NECK, rising steeply. This is the single reason the horse is not a
  // second bull: in the first render its neck ran forward at body height and
  // the silhouette came back as another low brick. It now climbs 1.3 model
  // units above the spine, which is what a horse's outline actually is.
  { bone: 'body', p: [0, 2.62, 1.02,   0.62, 0.95, 0.62], hex: HORSE_COAT },
  { bone: 'body', p: [0, 3.10, 1.14,   0.56, 0.85, 0.58], hex: HORSE_COAT },
  // mane down the crest of that neck
  { bone: 'body', p: [0, 2.80, 0.78,   0.26, 1.30, 0.34], hex: HORSE_MANE },
  { bone: 'body', p: [0, 3.30, 0.92,   0.26, 0.60, 0.34], hex: HORSE_MANE },
  // head: long muzzle carried out in front of the top of the neck
  { bone: 'head', p: [0, 0.05, 0.32,   0.52, 0.62, 0.72], hex: HORSE_COAT },
  { bone: 'head', p: [0, -0.16, 0.86,  0.44, 0.44, 0.66], hex: HORSE_COAT },
  { bone: 'head', p: [0, -0.28, 1.20,  0.40, 0.28, 0.22], hex: HORSE_MANE },  // nose
  { bone: 'head', p: [ 0.19, 0.48, 0.16, 0.15, 0.36, 0.15], hex: HORSE_COAT }, // ears
  { bone: 'head', p: [-0.19, 0.48, 0.16, 0.15, 0.36, 0.15], hex: HORSE_COAT },
  { bone: 'head', p: [0, 0.50, 0.42,   0.32, 0.32, 0.30], hex: HORSE_MANE },   // forelock
  { bone: 'head', p: [ 0.26, 0.12, 0.62, 0.14, 0.14, 0.06], hex: EYE_HOT },
  { bone: 'head', p: [-0.26, 0.12, 0.62, 0.14, 0.14, 0.06], hex: EYE_HOT },
  // legs — long and thin, in two segments so the knee reads
  { bone: 'legFL', p: [0, -0.80, 0, 0.26, 1.62, 0.26], hex: HORSE_COAT },
  { bone: 'legFR', p: [0, -0.80, 0, 0.26, 1.62, 0.26], hex: HORSE_COAT },
  { bone: 'legBL', p: [0, -0.78, 0, 0.32, 1.20, 0.32], hex: HORSE_DARK },
  { bone: 'legBR', p: [0, -0.78, 0, 0.32, 1.20, 0.32], hex: HORSE_DARK },
  { bone: 'legBL', p: [0, -1.36, 0, 0.24, 0.55, 0.24], hex: HORSE_COAT },
  { bone: 'legBR', p: [0, -1.36, 0, 0.24, 0.55, 0.24], hex: HORSE_COAT },
  { bone: 'legFL', p: [0, -1.53, 0, 0.32, 0.20, 0.32], hex: HOOF_DARK },
  { bone: 'legFR', p: [0, -1.53, 0, 0.32, 0.20, 0.32], hex: HOOF_DARK },
  { bone: 'legBL', p: [0, -1.55, 0, 0.34, 0.20, 0.34], hex: HOOF_DARK },
  { bone: 'legBR', p: [0, -1.55, 0, 0.34, 0.20, 0.34], hex: HOOF_DARK },
  // tail
  { bone: 'tail', p: [0, -0.50, -0.18, 0.28, 1.15, 0.28], hex: HORSE_MANE },
]);

// Leg phase multipliers: front-left moves with back-right (a diagonal gait),
// and the two sides oppose. Multiplying one `legSwing` by these is the whole
// gallop.
export const LEG_PHASE = Object.freeze({
  legFL: +1, legBR: +1, legFR: -1, legBL: -1,
});
export const LEG_SWING_RADIANS = 0.85;

// Dust ball: puffs on two counter-rotating rings, same idea the painted
// version used, but now actual boxes in space so limbs can pass in front of
// and behind them.
// The painted version drew the grapple as a dust BALL because overlapping 2D
// limbs would have read as mush. In 3D the limbs sort correctly, so the fight
// is the thing to look at and the dust exists to sit UNDER it — the first
// render of this pass kept the old ball and it swallowed both animals whole.
// Wide, low, and thin.
export const DUST = Object.freeze({
  // Many small puffs, not a few big ones: at 0.6 model units a translucent
  // cube is a grey SQUARE on the sky, and eighteen of them is a pile of grey
  // squares. Halved in size and doubled in count, they blur into a low haze.
  rings: [
    { count: 16, radius: 1.75, size: 0.34, hex: 0xe2d8c8, dir: +1 },
    { count: 11, radius: 1.05, size: 0.30, hex: 0xf0e9dc, dir: -1 },
  ],
  coreSize: 0.42,
  coreHex: 0xebe3d4,
  flatten: 0.42,      // squashed on Y: kicked-up snow, not a smoke bomb
  maxAlpha: 0.40,     // never opaque — you must still see who is winning
});

// Dazed stars over a head.
export const STARS = Object.freeze({
  count: 5,
  radius: 1.35,
  size: 0.62,     // 0.34 rendered as a yellow speck at 140 m
  hex: EYE_HOT,
  heightBull: 3.5,
  heightHorse: 3.9,
});
