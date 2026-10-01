


























































export const TILT = (48 * Math.PI) / 180;








export function cameraDir(angle = 0) {
  const s = Math.sin(TILT);
  const c = Math.cos(TILT);
  
  
  
  const d = [0, -s, c];
  const ca = Math.cos(-angle);
  const sa = Math.sin(-angle);
  return [d[0] * ca - d[1] * sa, d[0] * sa + d[1] * ca, d[2]];
}

const EPS = 1e-9;









function rayTri(o, d, a, b, c) {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2],
    d[0] * e2[1] - d[1] * e2[0]];
  const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
  if (det > -EPS && det < EPS) return -1;
  const inv = 1 / det;
  const t = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
  const u = (t[0] * p[0] + t[1] * p[1] + t[2] * p[2]) * inv;
  if (u < 0 || u > 1) return -1;
  const q = [t[1] * e1[2] - t[2] * e1[1], t[2] * e1[0] - t[0] * e1[2],
    t[0] * e1[1] - t[1] * e1[0]];
  const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) * inv;
  if (v < 0 || u + v > 1) return -1;
  const dist = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
  return dist > EPS ? dist : -1;
}


function* triangles(part) {
  const { positions, indices } = part.mesh;
  const at = (i) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
  for (let i = 0; i < indices.length; i += 3) {
    yield [at(indices[i]), at(indices[i + 1]), at(indices[i + 2])];
  }
}


export function partCentre(part) {
  const pos = part.mesh.positions;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      if (pos[i + a] < min[a]) min[a] = pos[i + a];
      if (pos[i + a] > max[a]) max[a] = pos[i + a];
    }
  }
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
}










export function occluded(point, angle, occluders) {
  const d = cameraDir(angle);
  const o = [point[0] + d[0] * 1e-4, point[1] + d[1] * 1e-4, point[2] + d[2] * 1e-4];
  for (const part of occluders) {
    for (const [a, b, c] of triangles(part)) {
      if (rayTri(o, d, a, b, c) > 0) return true;
    }
  }
  return false;
}



















export function visibleFacings(parts, target, opts = {}) {
  const facings = opts.facings || 8;
  const skip = new Set(opts.ignore || []);
  const others = parts.filter((p) => p !== target && !skip.has(p));
  const centre = partCentre(target);
  let n = 0;
  for (let f = 0; f < facings; f += 1) {
    const angle = (f * Math.PI * 2) / facings;
    
    
    
    
    const d = cameraDir(angle);
    const from = [centre[0] + d[0] * 0.5, centre[1] + d[1] * 0.5, centre[2] + d[2] * 0.5];
    
    
    let hit = 0.5;
    for (const [a, b, c] of triangles(target)) {
      const t = rayTri(from, [-d[0], -d[1], -d[2]], a, b, c);
      if (t > 0 && t < hit) hit = t;
    }
    if (hit >= 0.5) continue; 
    const surface = [from[0] - d[0] * hit, from[1] - d[1] * hit, from[2] - d[2] * hit];
    if (!occluded(surface, angle, others)) n += 1;
  }
  return n;
}


export function partsColoured(parts, colours) {
  const want = new Set(colours.map((c) => c.toLowerCase()));
  return parts.filter((p) => want.has(p.colour.toLowerCase()));
}
