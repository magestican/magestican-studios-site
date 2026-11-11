






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








export function sightClamp(cam, p, view, inner) {
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
  const cx = dx * rx + dz * rz;
  const cy = dx * ux + dy * uy + dz * uz;
  const Z = dx * fx + dy * fy + dz * fz;
  const r = -(cam.roll ?? 0);
  const c = Math.cos(r);
  const s = Math.sin(r);
  
  const X = cx * c + cy * s;
  const Y = -cx * s + cy * c;
  const tx = Math.tan(view.h) * inner;
  const ty = Math.tan(view.v) * inner;
  const ahead = Z > 0.1;
  if (ahead && Math.abs(X / Z) <= tx && Math.abs(Y / Z) <= ty) return p;
  const lim = (v, t) => Math.max(-t, Math.min(t, v));
  const sx = ahead ? lim(X / Z, tx) : X < 0 ? -tx : tx;
  const sy = lim(Y / Math.max(ahead ? Z : Math.hypot(X, Z), 0.1), ty);
  const k = Math.hypot(dx, dy, dz) / Math.hypot(sx, sy, 1);
  const nx = (sx * c - sy * s) * k;
  const ny = (sx * s + sy * c) * k;
  return { x: cam.pos.x + rx * nx + ux * ny + fx * k, y: cam.pos.y + uy * ny + fy * k, z: cam.pos.z + rz * nx + uz * ny + fz * k };
}
