












export const LEAN_SIDE = 0.28; 

const r4 = (v) => Math.round(v * 1e4) / 1e4 || 0;
const wrap = (a) => r4(Math.atan2(Math.sin(a), Math.cos(a)));

export function slot(kind, x, z, heading, clip, extra = {}) {
  return Object.freeze({ kind, at: Object.freeze({ x: r4(x), z: r4(z) }), heading: wrap(heading), clip, count: 1, ...extra });
}




export function leanAt(postX, postZ, heading, forward = 0.1) {
  const fx = Math.sin(heading), fz = Math.cos(heading);
  
  const rx = -Math.cos(heading), rz = Math.sin(heading);
  return slot('lean', postX - rx * LEAN_SIDE + fx * forward, postZ - rz * LEAN_SIDE + fz * forward, heading, 'lean');
}


export function ring(n, r, a0, make) {
  return Array.from({ length: n }, (_, i) => {
    const a = a0 + (i * Math.PI * 2) / n;
    return make(Math.sin(a) * r, Math.cos(a) * r, a);
  });
}


export function turned(s, yaw) {
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  const { x, z } = s.at;
  return Object.freeze({ ...s, at: Object.freeze({ x: r4(x * c + z * sn), z: r4(-x * sn + z * c) }), heading: wrap(s.heading + yaw) });
}
