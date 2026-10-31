






export const HFOV_DEG = 110;
export const VFOV_MIN_DEG = 55;
export const VFOV_MAX_DEG = 100;
const RAD = Math.PI / 180;


export function vfovFor(aspect) {
  const v = (2 * Math.atan(Math.tan((HFOV_DEG * RAD) / 2) / Math.max(1e-3, aspect))) / RAD;
  return Math.max(VFOV_MIN_DEG, Math.min(VFOV_MAX_DEG, v));
}


export function halfAngles(aspect) {
  const v = (vfovFor(aspect) * RAD) / 2;
  return { h: Math.atan(Math.tan(v) * aspect), v };
}


export const SCREENS = [
  [390, 844],
  [844, 390],
  [1440, 900],
];
export const REF_VIEW = (() => {
  const all = SCREENS.map(([w, h]) => halfAngles(w / h));
  return { h: Math.min(...all.map((a) => a.h)), v: Math.min(...all.map((a) => a.v)) };
})();


export const LOOK_DROP = 0.04;







export function inView(cam, p, view = REF_VIEW, inner = 0.92) {
  const s = screenPos(cam, p);
  if (!s) return false;
  return Math.abs(s.x) <= Math.tan(view.h) * inner && Math.abs(s.y) <= Math.tan(view.v) * inner;
}


export function screenPos(cam, p) {
  let fx = cam.fwd.x;
  let fy = cam.fwd.y - LOOK_DROP;
  let fz = cam.fwd.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;
  
  let rx = -fz;
  let rz = fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl;
  rz /= rl;
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;
  const dx = p.x - cam.pos.x;
  const dy = p.y - cam.pos.y;
  const dz = p.z - cam.pos.z;
  const depth = dx * fx + dy * fy + dz * fz;
  if (depth < 0.1) return null;
  const x = (dx * rx + dz * rz) / depth;
  const y = (dx * ux + dy * uy + dz * uz) / depth;
  
  const r = -(cam.roll ?? 0);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c + y * s, y: -x * s + y * c };
}
