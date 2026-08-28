
















































export const CONVERGE_M = 30;


export const MIN_AIM_DIST = 0.15;

function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function len(v) { return Math.hypot(v.x, v.y, v.z); }
function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }






























export function aimPoint({ eye, dir, targets = null, isSolid = null,
                           range = CONVERGE_M, step = 0.34 } = {}) {
  const at = (t) => ({ x: eye.x + dir.x * t, y: eye.y + dir.y * t, z: eye.z + dir.z * t });

  
  
  let best = Infinity;
  if (targets) {
    for (const g of targets) {
      if (!g) continue;
      const r = g.radius ?? 0.9;
      const t = (g.x - eye.x) * dir.x + (g.y - eye.y) * dir.y + (g.z - eye.z) * dir.z;
      if (t <= 0 || t >= best) continue;
      const p = at(t);
      if (Math.hypot(g.x - p.x, g.y - p.y, g.z - p.z) <= r) best = t;
    }
  }

  if (isSolid) {
    const steps = Math.max(1, Math.ceil(range / step));
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * range;
      
      
      if (t >= best) break;
      const p = at(t);
      if (isSolid(p.x, p.y, p.z)) return p;
    }
  }
  return at(Number.isFinite(best) ? best : range);
}














export function muzzleShot({ eye, dir, muzzle = null, target = null, isSolid = null } = {}) {
  const fallback = { origin: eye, dir, fromMuzzle: false };
  if (!muzzle || !eye || !dir) return fallback;

  
  if (isSolid && isSolid(muzzle.x, muzzle.y, muzzle.z)) return fallback;

  const aim = target || {
    x: eye.x + dir.x * CONVERGE_M,
    y: eye.y + dir.y * CONVERGE_M,
    z: eye.z + dir.z * CONVERGE_M,
  };
  const v = sub(aim, muzzle);
  const d = len(v);

  
  if (!Number.isFinite(d) || d < MIN_AIM_DIST) return fallback;

  const out = { x: v.x / d, y: v.y / d, z: v.z / d };

  
  if (dot(out, dir) <= 0) return fallback;

  return { origin: muzzle, dir: out, fromMuzzle: true };
}
