





export function supportY(def, x, z) {
  for (const p of def.props) {
    if (p.support != null && Math.hypot(p.x - x, p.z - z) < 0.3) return p.support;
  }
  for (const q of def.platforms ?? []) {
    if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return q.y;
  }
  return 0;
}
