// Pure movement math extracted for unit testing.
//
// Given a camera-forward vector, a camera-right vector, and a wish (which
// keys are held), returns the world-space horizontal delta the player wants
// to move. Y is always 0 (gravity/jump handled elsewhere).
//
// Conventions:
//   forward = normalized world-space direction the camera is looking (y=0
//             component); this is what THREE.PerspectiveCamera.getWorld-
//             Direction() gives after zeroing y.
//   right   = cross(forward, worldUp).normalized. For up = +Y and the
//             right-hand rule, this gives the vector pointing to the
//             screen's right-hand side.
//   wish    = { forward: bool, back: bool, left: bool, right: bool }.
//
// Testability: no THREE dependency, plain arrays. Node's test runner picks
// this up fine.

export function computeWishDelta(forward, right, wish) {
  const w = { x: 0, z: 0 };
  if (wish.forward) { w.x += forward.x; w.z += forward.z; }
  if (wish.back)    { w.x -= forward.x; w.z -= forward.z; }
  if (wish.right)   { w.x += right.x;   w.z += right.z; }
  if (wish.left)    { w.x -= right.x;   w.z -= right.z; }
  // Normalise on the diagonal so W+D isn't faster than W.
  const len = Math.hypot(w.x, w.z);
  if (len > 0) { w.x /= len; w.z /= len; }
  return w;
}

// Given a THREE.Camera-like object exposing getWorldDirection() and up,
// returns { forward, right } in the horizontal (XZ) plane. Zeros y so the
// player can't accidentally moon-jump by looking straight up.
export function cameraHorizontalAxes(camera, THREE) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1);  // fallback if looking straight up/down
  forward.normalize();
  // right = forward x up.
  // THREE.js's Matrix4.makeLookAt computes camera's local +X axis as
  // (up x -viewDir), i.e. the camera's local right in world coords ends up
  // as -(up x forward) = forward x up. Matching that convention here means
  // pressing D moves the player in the direction that visually LOOKS like
  // screen-right on the rendered image, which is what a user expects.
  //
  // Empirically verified 2026-08-20 by Bryan: "pressing forward takes me
  // to the right" was the symptom of using the OTHER cross-product order.
  // Locked in by movementMath.test.js.
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  return { forward, right };
}
