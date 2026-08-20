// Pure hit-direction math. Given the shooter's world position, victim's
// world position, and the victim's yaw, returns the CSS rotate degrees the
// on-screen "you were shot from here" arrow should use so its point
// indicates the attacker relative to the victim's view.
//
// Convention: CSS rotate positive = clockwise on screen. Arrow at 0deg
// points STRAIGHT UP (attacker is in front of me). +90 = attacker is to
// my SCREEN-RIGHT. -90 (or +270) = attacker is SCREEN-LEFT.
//
// The subtle bit: with THREE's lookAt-flipped local axes (screen-right =
// world -X when the camera looks +Z, per movementMath.js), positive world-
// X is actually screen-LEFT. So the bearing sign needs to flip.

export function hitBearingDeg(attackerPos, victimPos, victimYaw) {
  const dx = attackerPos.x - victimPos.x;
  const dz = attackerPos.z - victimPos.z;
  // World bearing of the attacker measured as "atan2 of the X component
  // over the Z component". +Z is forward-of-yaw-0.
  const worldBearing = Math.atan2(dx, dz);
  // Relative to my view: subtract my yaw.
  const rel = worldBearing - victimYaw;
  // Convert to CSS rotation degrees. NEGATE because +world-X visually shows
  // on the LEFT of the screen under Three lookAt convention.
  let deg = -rel * 180 / Math.PI;
  deg = ((deg + 540) % 360) - 180;   // normalise to -180..180
  return deg;
}
