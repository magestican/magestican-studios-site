// Vertical movement — PURE. No THREE, no rapier, no input bus, no DOM.
//
// Bryan 2026-08-22: "i now also get stuck jumping on a loop, make an
// assessment and find a way for this to never happen again, maybe with tests,
// maybe with a different code architecture, and maybe by separating game
// engine from game implementation."
//
// He is right that this is an architecture problem, not a bug to patch. Jump
// state lived inside `player.js` as four loose fields (`_grounded`,
// `_jumpingDown`, `_airJumpsLeft`, `vel.y`) mutated in the middle of a
// 90-line update() that also does input, friction, speed caps, rapier
// character-controller calls and camera work. Rules that only exist as the
// emergent behaviour of scattered `if`s in a function that cannot be imported
// without a browser cannot be tested, so every change to jumping has been
// verified by a human jumping.
//
// So: the RULES live here, in the engine layer, as one pure transition
// function over an explicit state. The game layer (player.js) keeps the parts
// that genuinely need rapier and three — reading `grounded` off the character
// controller and applying the resulting velocity — and nothing else.
//
// The invariants this exists to guarantee, each one locked by a test:
//
//   1. Holding the jump key produces exactly ONE ground jump. Not one per
//      frame. This is the "stuck jumping on a loop" class of bug: a held key
//      re-triggering every tick.
//   2. At most TWO jumps between landings — one from the ground, one in the
//      air. Never a third, however the input is mashed.
//   3. The air jump is restored by LANDING, and by nothing else.
//   4. Upward velocity is bounded. No input sequence can accumulate it.
//   5. Falling speed is clamped, so a long fall cannot tunnel the collider.

export const JUMP = Object.freeze({
  speed: 9.0,          // m/s imparted by a grounded jump
  airSpeedFactor: 0.95, // the mid-air jump is a hair weaker
  airJumps: 1,         // one double-jump per landing
  gravity: -30.0,
  terminalVelocity: -30.0,
});

export function newJumpState() {
  return {
    airJumpsLeft: JUMP.airJumps,
    // TRUE while the jump control has been held continuously since the press
    // that last produced a jump. This latch is the whole defence against
    // invariant 1: it is set when a jump fires and cleared ONLY by the control
    // being released.
    latched: false,
  };
}

// One frame of vertical movement.
//
//   state    from newJumpState(), mutated in place
//   velY     current vertical velocity
//   grounded is the character standing on something THIS frame
//   jumpDown is the control held right now
//   dt       seconds
//
// Returns { velY, jumped } where `jumped` is 'ground' | 'air' | null.
//
// Note the deliberate absence of an "edge" input. Callers used to pass both a
// `wasPressed` edge and an `isDown` level and OR them together, which meant
// two sources could each independently satisfy the condition — and a synthetic
// press that arrived without a matching release (as touch controls can
// produce) re-fired forever. Level alone plus the latch is strictly simpler
// and cannot get into that state.
export function stepJump(state, { velY, grounded, jumpDown, dt }) {
  let jumped = null;

  // Landing is the only thing that restores the air jump.
  if (grounded) state.airJumpsLeft = JUMP.airJumps;

  // Releasing is the only thing that clears the latch.
  if (!jumpDown) state.latched = false;

  if (jumpDown && !state.latched) {
    if (grounded) {
      velY = JUMP.speed;
      state.latched = true;
      jumped = 'ground';
    } else if (state.airJumpsLeft > 0) {
      // Overwrite rather than add: adding lets a well-timed second press
      // stack on the first and fling the player, which is invariant 4.
      velY = JUMP.speed * JUMP.airSpeedFactor;
      state.airJumpsLeft--;
      state.latched = true;
      jumped = 'air';
    }
    // No jump available: the latch is deliberately NOT set, so continuing to
    // hold through a landing still jumps on the frame you touch down. That is
    // a deliberate affordance (jump-buffering), not an oversight — but it can
    // only ever spend a jump the rules already allow.
  }

  // Gravity, then clamp. Clamping matters for more than feel: an unbounded
  // fall speed means a frame's movement can exceed the collider's own height
  // and tunnel through the floor.
  velY += JUMP.gravity * dt;
  if (velY < JUMP.terminalVelocity) velY = JUMP.terminalVelocity;

  // Standing still on the ground should not accumulate downward velocity —
  // otherwise `grounded` flickers as the controller pushes back out each
  // frame, which reads as a permanent shudder.
  if (grounded && velY < 0) velY = 0;

  return { velY, jumped };
}
