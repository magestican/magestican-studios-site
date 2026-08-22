

















export function computeWishDelta(forward, right, wish) {
  const w = { x: 0, z: 0 };
  if (wish.forward) { w.x += forward.x; w.z += forward.z; }
  if (wish.back)    { w.x -= forward.x; w.z -= forward.z; }
  if (wish.right)   { w.x += right.x;   w.z += right.z; }
  if (wish.left)    { w.x -= right.x;   w.z -= right.z; }
  
  const len = Math.hypot(w.x, w.z);
  if (len > 0) { w.x /= len; w.z /= len; }
  return w;
}




export function cameraHorizontalAxes(camera, THREE) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1);  
  forward.normalize();
  
  
  
  
  
  
  
  
  
  
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  return { forward, right };
}
