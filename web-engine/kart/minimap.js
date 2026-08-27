
























export function createProjection(bounds, { w = 160, h = 160, pad = 10, rotate = 0 } = {}) {
  const spanX = Math.max(1e-6, bounds.maxX - bounds.minX);
  const spanZ = Math.max(1e-6, bounds.maxZ - bounds.minZ);
  
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanZ);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  return { scale, cx, cz, w, h, rotate };
}










export function project(proj, x, z) {
  const dx = (x - proj.cx) * proj.scale;
  const dz = (z - proj.cz) * proj.scale;
  if (!proj.rotate) return { x: proj.w / 2 + dx, y: proj.h / 2 - dz };
  const c = Math.cos(proj.rotate);
  const s = Math.sin(proj.rotate);
  return {
    x: proj.w / 2 + (dx * c - dz * s),
    y: proj.h / 2 - (dx * s + dz * c),
  };
}


export function projectPath(proj, path, { step = 1 } = {}) {
  const out = [];
  for (let i = 0; i < path.count; i += step) {
    const p = path.pts[i];
    out.push(project(proj, p.x, p.z));
  }
  return out;
}







export function projectRacers(proj, racers, playerId) {
  const out = [];
  let mine = null;
  for (const r of racers) {
    const p = project(proj, r.x, r.z);
    const blip = { id: r.id, x: p.x, y: p.y, isPlayer: r.id === playerId, tint: r.tint, position: r.position };
    if (blip.isPlayer) mine = blip; else out.push(blip);
  }
  if (mine) out.push(mine);
  return out;
}









export function minimapSize(viewportW, viewportH) {
  const base = Math.min(viewportW, viewportH);
  return Math.round(Math.max(96, Math.min(210, base * 0.24)));
}
