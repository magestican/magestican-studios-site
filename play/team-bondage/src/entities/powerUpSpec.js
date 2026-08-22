// Power-ups — the rules, as PURE DATA AND MATH. No THREE, no DOM, no rapier,
// so every number below is node-testable (powerUps.test.mjs) and the runtime
// (powerUps.js, player.js, game.js) only has to obey it.
//
// Bryan, 2026-08-22:
//   "add 1 power up with the shape of a protein shake which makes you twice as
//    big, that should have its own identifiable voxel area in the map"
//   "another one which is a wheel of cheese which makes you about 80% smaller
//    and lets you fire 40% faster"
//   "These power up should have a 20 second timer"
//
// See docs/features/power-ups.md for the feature write-up and
// web-engine/procgen/voxelWorldGen.js (buildGym / buildDairy) for the two
// zones they spawn in.

export const POWER_UP_MS = 20_000;      // Bryan's 20-second timer, both of them

// ---------------------------------------------------------------------------
// The player, as the physics and the camera already have him
// ---------------------------------------------------------------------------
// These mirror entities/player.js. They live here because every size decision
// below is arithmetic ON them, and arithmetic on numbers copied into a second
// file is arithmetic that silently goes wrong the day the first file changes.
// player.js imports these rather than declaring its own.
export const CAPSULE_HALF_HEIGHT = 0.65;   // straight part of the capsule
export const CAPSULE_RADIUS      = 0.32;   // ...and its end caps
export const EYE_OFFSET          = 0.55;   // camera above the capsule's centre
export const BASE_HIT_RADIUS     = 0.7;    // the sphere _raycastPlayers tests

// A standing player is 1.94 m in a world of 1 m voxels.
export const PLAYER_HEIGHT_M = 2 * (CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS);
// ...and his eye is 1.52 m off the floor.
export const EYE_HEIGHT_M = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS + EYE_OFFSET;

// A voxel doorway is TWO courses of clear air — 2.0 m — on every base style on
// every map (cutDoorway() in voxelWorldGen.js). That single number is what
// makes "twice as big" a design problem rather than a multiplication.
export const DOORWAY_CLEARANCE_M = 2.0;

// Floors. A capsule whose radius approaches rapier's own controller offset
// (0.02 m) jitters and starts squeezing through seams, and a target you
// cannot hit is not a power-up, it is a bug with a timer. Both are the reason
// the shrunk player's COLLIDER and HITBOX stop shrinking before his model does.
export const MIN_CAPSULE_RADIUS      = 0.14;   // 7x rapier's controller offset
export const MIN_CAPSULE_HALF_HEIGHT = 0.16;
export const MIN_HIT_SCALE           = 0.6;    // never a smaller target than this
export const EYE_CEILING_GAP         = 0.35;   // keep the camera out of the roof

// ---------------------------------------------------------------------------
// The roster
// ---------------------------------------------------------------------------
export const POWER_UPS = Object.freeze({
  'protein-shake': Object.freeze({
    id: 'protein-shake',
    zone: 'gym',
    name: 'PROTEIN SHAKE',
    hud: 'GIANT',
    emoji: '🥤',
    tint: 0xff5fa2,
    blurb: 'Twice the size for 20 seconds — and twice the target.',
    visualScale: 2.0,
    fireRateMul: 1.0,
  }),
  'cheese-wheel': Object.freeze({
    id: 'cheese-wheel',
    zone: 'dairy',
    name: 'CHEESE WHEEL',
    hud: 'MINI',
    emoji: '🧀',
    tint: 0xf0b429,
    blurb: 'Knee-high and 40% faster on the trigger for 20 seconds.',
    // "about 80% smaller" = one fifth of your size.
    visualScale: 0.2,
    // "fire 40% faster" is a RATE, so the cooldown is divided by 1.4, not
    // multiplied by 0.6. The shovel goes 0.20 s -> 0.143 s between shots.
    fireRateMul: 1.4,
  }),
});

export const POWER_UP_IDS = Object.freeze(Object.keys(POWER_UPS));

// ---------------------------------------------------------------------------
// Size maths
// ---------------------------------------------------------------------------

// The physics capsule for a player at `scale`.
//
// RADIUS scales honestly, in both directions: a giant occupies twice the floor
// a normal player does (he cannot hide behind a one-metre crate any more) and
// a mouse occupies a fifth of it, down to MIN_CAPSULE_RADIUS.
//
// HEIGHT does not scale past 1x, and this is the deliberate call the whole
// feature turns on. A 2x capsule is 3.88 m tall; every doorway in the game is
// 2.0 m. A giant with an honest collider cannot enter ANY base on ANY map,
// which means a giant carrying the enemy flag cannot deliver it and a giant
// who drinks in his own barn is sealed in for twenty seconds. The two
// alternatives were rebuilding all four base architectures a course taller for
// the sake of a 20-second buff, or shipping the trap. So the giant's collider
// is SHORT AND WIDE — it keeps the standing player's own 1.94 m height, which
// is the one height already known to clear every door on every map — while his
// model, his eye line and his hitbox all go to 2x. A collider a little smaller
// than the model is what every shooter ships, and the failure mode (a shoulder
// clipping a door frame for a frame) is a rounding error next to the failure
// mode it replaces.
export function capsuleFor(scale) {
  const radius = Math.max(MIN_CAPSULE_RADIUS, CAPSULE_RADIUS * scale);
  const roomForHalf = (PLAYER_HEIGHT_M - 2 * radius) / 2;
  const halfHeight = Math.max(
    MIN_CAPSULE_HALF_HEIGHT,
    Math.min(CAPSULE_HALF_HEIGHT * scale, roomForHalf),
  );
  return { halfHeight, radius, total: 2 * (halfHeight + radius) };
}

// Growing or shrinking a capsule moves its CENTRE, and rapier positions a body
// by its centre. Resize without this and a giant is born with his feet a metre
// underground; a mouse is born hovering. Feet stay put, the centre moves.
export function centreKeepingFeet(centreY, oldTotal, newTotal) {
  return centreY - oldTotal / 2 + newTotal / 2;
}

// Where the camera sits above the player's feet.
//
// `headroom` is the clear air actually above him this frame (game.js probes
// the voxel column). Outdoors it is effectively infinite and the giant's eye
// really is 3.04 m up. Under a barn roof it is 2 m, and he DUCKS — which is
// both what a giant walking through a normal door looks like and the only way
// to keep the camera out of the inside of a roof voxel, where it would see
// straight through the world.
export function eyeHeightFor(scale, headroom = Infinity) {
  const want = EYE_HEIGHT_M * scale;
  if (!Number.isFinite(headroom)) return want;
  const cap = Math.max(EYE_HEIGHT_M * 0.35, headroom - EYE_CEILING_GAP);
  return Math.min(want, cap);
}

// The sphere other players shoot at. Floored, never zeroed: a mouse is a
// harder target than a normal player, never an impossible one.
export function hitRadiusFor(scale) {
  return BASE_HIT_RADIUS * Math.max(scale, MIN_HIT_SCALE);
}

// ---------------------------------------------------------------------------
// The 20-second clock
// ---------------------------------------------------------------------------
export function emptyPowerUpState() {
  return { id: null, endsAt: 0 };
}

// Exactly ONE power-up at a time. You cannot be twice as big and a fifth of
// your size at once, and "the last one you drank is the one you are" is the
// only stacking rule a player can hold in their head mid-fight. Drinking the
// one you already have refreshes the full 20 s rather than adding to it, so
// the pill on the HUD never counts past 20.
export function applyPowerUp(state, id, nowMs) {
  if (!POWER_UPS[id]) return state;
  return { id, endsAt: nowMs + POWER_UP_MS };
}

// Returns the state to keep plus the id that just ran out (or null).
export function expirePowerUp(state, nowMs) {
  if (state.id && nowMs >= state.endsAt) {
    return { state: emptyPowerUpState(), expired: state.id };
  }
  return { state, expired: null };
}

// Death drops the buff. A twenty-second timer that survives a respawn is a
// twenty-second timer the player cannot read off the world any more, and the
// steak poison already taught this project that lesson once.
export function clearOnDeath() {
  return emptyPowerUpState();
}

export function remainingMs(state, nowMs) {
  return state.id ? Math.max(0, state.endsAt - nowMs) : 0;
}

// What the HUD pill prints: 20 counts down to 1, then the pill goes.
export function remainingSeconds(state, nowMs) {
  return Math.ceil(remainingMs(state, nowMs) / 1000);
}

export function activeDef(state) {
  return state && state.id ? POWER_UPS[state.id] : null;
}

export function scaleFor(state) {
  return activeDef(state)?.visualScale ?? 1;
}

export function fireRateMulFor(state) {
  return activeDef(state)?.fireRateMul ?? 1;
}

// What WeaponSystem multiplies every cooldown by.
export function cooldownScaleFor(state) {
  return 1 / fireRateMulFor(state);
}
