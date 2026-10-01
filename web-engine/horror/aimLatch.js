































export const AIM_LATCH = Object.freeze({
  raiseTime: 0.16,     
  lowerTime: 0.26,     
  dropDelay: 0.35,     
  acquireArc: 0.61,    
  releaseArc: 0.85,    
  releaseRange: 1.18,  
});

export function createAimLatch() {
  return { up: false, u: 0, lost: 0 };
}


export function stepAimLatch(l, dt, hasTarget) {
  const n = { ...l };
  if (hasTarget) { n.up = true; n.lost = 0; }
  else if (n.up) {
    n.lost += dt;
    if (n.lost >= AIM_LATCH.dropDelay) { n.up = false; n.lost = 0; }
  }
  n.u = Math.min(1, Math.max(0,
    n.u + (n.up ? dt / AIM_LATCH.raiseTime : -dt / AIM_LATCH.lowerTime)));
  return n;
}


export function acquires(d, off, range) {
  return d <= range && Math.abs(off) <= AIM_LATCH.acquireArc;
}


export function releases(d, off, range) {
  return !(d <= range * AIM_LATCH.releaseRange && Math.abs(off) <= AIM_LATCH.releaseArc);
}







export function raiseMix(stand, aim, k) {
  const e = k * k * (3 - 2 * k);
  const lerp = (a, b) => a + (b - a) * e;
  return {
    ...stand,
    ...aim,
    hands: [0, 1].map((j) => [
      lerp(stand.hands[j][0], aim.hands[j][0]),
      lerp(stand.hands[j][1], aim.hands[j][1]),
    ]),
    twist: lerp(stand.twist ?? 0, aim.twist ?? 0),
    lean: lerp(stand.lean ?? 0, aim.lean ?? 0),
    grip: e < 0.5 ? stand.grip : aim.grip,
  };
}
