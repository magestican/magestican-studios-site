










export function screenTargets(enemies, project, w, h, volume) {
  const out = [];
  for (const e of enemies) {
    if (e.dead) continue;
    const p = project(e.pos);
    if (!(p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1)) continue;
    
    const top = project({ x: e.pos.x, y: e.pos.y + e.r * volume, z: e.pos.z });
    out.push({
      x: ((p.x + 1) / 2) * w,
      y: ((1 - p.y) / 2) * h,
      r: (Math.abs(top.y - p.y) / 2) * h,
      kind: e.kind,
      id: e.id,
    });
  }
  return out;
}
