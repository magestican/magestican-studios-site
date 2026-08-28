
























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
    
    
    
    
    const blip = {
      id: r.id, x: p.x, y: p.y, isPlayer: r.id === playerId,
      tint: r.tint, position: r.position,
      dir: r.heading == null ? null
        : projectDirection(proj, Math.sin(r.heading), Math.cos(r.heading)),
    };
    if (blip.isPlayer) mine = blip; else out.push(blip);
  }
  if (mine) out.push(mine);
  return out;
}









export function minimapSize(viewportW, viewportH) {
  const base = Math.min(viewportW, viewportH);
  return Math.round(Math.max(96, Math.min(210, base * 0.24)));
}























import { inSpan } from './trackHazards.js';


const fracAt = (path, i) => path.s[i] / path.length;











export function spanIndices(path, from, to, { step = 1 } = {}) {
  const n = path.count;
  let start = 0;
  for (let i = 0; i < n; i += 1) {
    if (fracAt(path, i) >= from) { start = i; break; }
  }
  const out = [];
  for (let k = 0; k < n; k += step) {
    const i = (start + k) % n;
    if (!inSpan(fracAt(path, i), from, to)) break;
    out.push(i);
  }
  return out;
}










export function projectDirection(proj, dx, dz) {
  const c = Math.cos(proj.rotate || 0);
  const s = Math.sin(proj.rotate || 0);
  const x = proj.rotate ? dx * c - dz * s : dx;
  const y = proj.rotate ? -(dx * s + dz * c) : -dz;
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, angle: Math.atan2(y, x) };
}


export function projectRoadEdges(proj, path, { step = 1, inflate = 1 } = {}) {
  const left = [];
  const right = [];
  for (let i = 0; i < path.count; i += step) {
    const p = path.pts[i];
    const t = path.tangents[i];
    
    
    const h = ((p.width ?? 16) / 2) * inflate;
    left.push(project(proj, p.x + t.z * h, p.z - t.x * h));
    right.push(project(proj, p.x - t.z * h, p.z + t.x * h));
  }
  return { left, right };
}


export function projectBranchEdges(proj, branch, { step = 1, inflate = 1 } = {}) {
  const left = [];
  const right = [];
  const centre = [];
  const h = ((branch.width ?? 9) / 2) * inflate;
  for (let i = 0; i < branch.count; i += step) {
    const p = branch.pts[i];
    const t = branch.tangents[i] ?? branch.tangents[branch.count - 1];
    centre.push(project(proj, p.x, p.z));
    left.push(project(proj, p.x + t.z * h, p.z - t.x * h));
    right.push(project(proj, p.x - t.z * h, p.z + t.x * h));
  }
  return { left, right, centre };
}
















export function projectHazardBands(proj, path, zone, { step = 1, taper = 0.16 } = {}) {
  const idx = spanIndices(path, zone.from, zone.to, { step });
  if (idx.length < 2) return [];
  const sides = zone.side === 'both' ? [1, -1] : [zone.side === 'left' ? 1 : -1];
  const beyond = zone.beyond ?? 1.1;
  const deep = (zone.depth ?? 0) >= 8;
  const n = idx.length;
  const out = [];
  for (const sign of sides) {
    const inner = [];
    const outer = [];
    for (let k = 0; k < n; k += 1) {
      const i = idx[k];
      const p = path.pts[i];
      const t = path.tangents[i];
      const half = (p.width ?? 16) / 2;
      
      const spread = (deep ? half * 1.85 : half * 0.55) * ease(k / (n - 1), taper);
      const a = half * beyond;
      const b = a + spread;
      inner.push(project(proj, p.x + t.z * a * sign, p.z - t.x * a * sign));
      outer.push(project(proj, p.x + t.z * b * sign, p.z - t.x * b * sign));
    }
    out.push({
      kind: zone.kind, side: sign > 0 ? 'left' : 'right', deep, inner, outer,
    });
  }
  return out;
}













function ease(u, edge) {
  if (edge <= 0) return 1;
  const t = Math.min(1, Math.min(u, 1 - u) / edge);
  return t * t * (3 - 2 * t);
}
