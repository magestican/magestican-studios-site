













export const CURVE_K = 0.012;


export function bendDrop(dx, dz, k = CURVE_K) {
  return (dx * dx + dz * dz) * k;
}



export function cullPad(farDistance, k = CURVE_K) {
  return bendDrop(farDistance, 0, k);
}












export function unbend(p, focus, k = CURVE_K) {
  return { x: p.x, y: p.y + bendDrop(p.x - focus.x, p.z - focus.z, k), z: p.z };
}







export function marchRay(origin, dir, focus, inside, { k = CURVE_K, stepM = 0.2, maxM = 250, refineM = 0.001 } = {}) {
  const len = Math.hypot(dir.x, dir.y, dir.z);
  if (!(len > 0)) return null;
  const d = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
  const at = (t) => unbend({ x: origin.x + d.x * t, y: origin.y + d.y * t, z: origin.z + d.z * t }, focus, k);
  if (inside(at(0))) return null;
  let t0 = 0;
  for (let t = stepM; t <= maxM + 1e-9; t += stepM) {
    if (!inside(at(t))) { t0 = t; continue; }
    let lo = t0, hi = t;
    while (hi - lo > refineM) {
      const mid = (lo + hi) / 2;
      if (inside(at(mid))) hi = mid; else lo = mid;
    }
    return { t: hi, ...at(hi) };
  }
  return null;
}







export function pickGround(origin, dir, focus, heightAt, { radius = Infinity, ...opts } = {}) {
  const r2 = radius * radius;
  return marchRay(origin, dir, focus, (q) => q.x * q.x + q.z * q.z <= r2 && q.y <= heightAt(q.x, q.z), opts);
}






export function horizonDip(height, distance, k = CURVE_K) {
  if (k <= 0) return 0;
  const t = (-4 * k * distance + Math.sqrt(16 * k * k * distance * distance + 16 * k * height)) / 2;
  return -t / Math.sqrt(1 + t * t);
}
