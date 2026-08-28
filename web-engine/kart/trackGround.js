









































import { nearestOnPath } from './trackPath.js';
import { chasmDepthAt } from './trackHazards.js';
import { terrainOffsetAt } from './trackTerrain.js';




export const SHOULDER = 7;
export const KERB_WIDTH = 1.6;











export const FLAT_OUT = 46;
export const HILL_OUT = 150;
export const HILL_HEIGHT = 3.2;


















export const GROUND_SEG = 128;







export function groundGrid(path) {
  const b = path.bounds;
  
  
  const w = (b.maxX - b.minX) + 900;
  const h = (b.maxZ - b.minZ) + 900;
  return {
    w, h, seg: GROUND_SEG,
    cx: (b.minX + b.maxX) / 2,
    cz: (b.minZ + b.maxZ) / 2,
  };
}
























export function roadDip(out) {
  const FULL = 2.4;             
  const FADE = SHOULDER + KERB_WIDTH + 5;
  if (out >= FADE) return 0;
  const u = Math.max(0, out) / FADE;
  
  return FULL * (1 - u * u * (3 - 2 * u));
}








export function hillsAt(x, z) {
  const a = Math.sin(x * 0.0121 + 1.7) * Math.cos(z * 0.0104 - 0.6);
  const b = Math.sin(x * 0.0298 - 2.3) * Math.cos(z * 0.0331 + 1.1) * 0.42;
  return (a + b) * HILL_HEIGHT;
}








export function groundFieldAt(path, x, z) {
  
  
  
  
  
  const near = nearestOnPath(path, x, z, null);
  const depth = chasmDepthAt(path.hazards, {
    frac: near.s / path.length, lateral: near.lateral, width: near.width,
  });
  if (depth != null) return { y: (near.y ?? 0) - depth, out: 0 };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const LANDFORM_CLEAR = FLAT_OUT + 4;
  const LANDFORM_FADE = 45;
  const hills = hillsAt(x, z);
  let best = hills;
  let bestOut = Infinity;
  const reach = HILL_OUT + 60;                 
  const reach2 = reach * reach;
  for (let i = 0; i < path.count; i += 1) {
    const p = path.pts[i];
    const dx = p.x - x; const dz = p.z - z;
    const d2 = dx * dx + dz * dz;
    if (d2 > reach2) continue;
    const out = Math.sqrt(d2) - p.width / 2;
    const roadY = p.y ?? 0;
    let h;
    if (out <= FLAT_OUT) h = roadY;
    else {
      
      
      
      
      const u = Math.min(1, (out - FLAT_OUT) / (HILL_OUT - FLAT_OUT));
      const ramp = u * u * (3 - 2 * u);
      h = roadY * (1 - ramp) + hills * ramp;
    }
    if (h < best) { best = h; bestOut = out; }
  }
  const lift = terrainOffsetAt(path.terrain, x, z);
  if (lift !== 0) {
    const nearOut = near.dist - near.width / 2;
    const u = Math.min(1, Math.max(0, (nearOut - LANDFORM_CLEAR) / LANDFORM_FADE));
    best += lift * u * u * (3 - 2 * u);
  }
  return { y: best, out: bestOut };
}


export const groundHeightAt = (path, x, z) => groundFieldAt(path, x, z).y;


export function groundMeshVertex(path, x, z) {
  const f = groundFieldAt(path, x, z);
  return f.y - roadDip(f.out);
}









const TABLES = new WeakMap();











export function groundTable(path) {
  const cached = TABLES.get(path);
  if (cached && cached.hazards === path.hazards && cached.terrain === path.terrain
      && cached.seg === GROUND_SEG) {
    return cached;
  }
  const g = groundGrid(path);
  const n = g.seg + 1;
  const y = new Float64Array(n * n);
  const x0 = g.cx - g.w / 2;
  const z0 = g.cz - g.h / 2;
  const dx = g.w / g.seg;
  const dz = g.h / g.seg;
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      y[j * n + i] = groundMeshVertex(path, x0 + i * dx, z0 + j * dz);
    }
  }
  const table = {
    y, n, x0, z0, dx, dz, seg: g.seg, w: g.w, h: g.h, cx: g.cx, cz: g.cz,
    hazards: path.hazards, terrain: path.terrain,
  };
  TABLES.set(path, table);
  return table;
}
















export function groundMeshHeightAt(path, x, z) {
  const t = groundTable(path);
  const fx = Math.min(t.seg - 1, Math.max(0, Math.floor((x - t.x0) / t.dx)));
  const fz = Math.min(t.seg - 1, Math.max(0, Math.floor((z - t.z0) / t.dz)));
  const ux = Math.min(1, Math.max(0, (x - (t.x0 + fx * t.dx)) / t.dx));
  const uz = Math.min(1, Math.max(0, (z - (t.z0 + fz * t.dz)) / t.dz));
  const y00 = t.y[fz * t.n + fx];
  const y10 = t.y[fz * t.n + fx + 1];
  const y01 = t.y[(fz + 1) * t.n + fx];
  const y11 = t.y[(fz + 1) * t.n + fx + 1];
  return (y00 * (1 - ux) + y10 * ux) * (1 - uz) + (y01 * (1 - ux) + y11 * ux) * uz;
}


















export function bodyGroundY(path, surf, x, z) {
  if (surf.onRoad) return surf.y;
  const ground = groundMeshHeightAt(path, x, z);
  
  
  
  const u = Math.min(1, (surf.overBy ?? 0) / SHOULDER);
  const ramp = u * u * (3 - 2 * u);
  return surf.y * (1 - ramp) + ground * ramp;
}
