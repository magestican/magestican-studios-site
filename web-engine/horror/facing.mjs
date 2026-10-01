

























export function inwardYaw(lx, lz) {
  return Math.atan2(-lx, -lz);
}


export function facingOf(yaw) {
  return [Math.sin(yaw), Math.cos(yaw)];
}





export function lateralOf(dx, dz, sgn) {
  return [-dz * sgn, dx * sgn];
}
