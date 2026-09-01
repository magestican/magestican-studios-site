









































import { nearestOnPath } from './trackPath.js';
import { chasmDepthAt } from './trackHazards.js';
import { terrainOffsetAt } from './trackTerrain.js';
import { planEdgeGuards, guardGroundY } from './edgeGuard.js';
import { planRails } from './trackRails.js';








export {
  GUARD_FLAT, GUARD_RISE, GUARD_CAP, GUARD_BROW, GUARD_WIDTH, GUARD_PROBE,
  GUARD_TIERS, guardLift, guardSection, guardHeightFor, tierForDrop,
  
  
  
  
  GUARD_DRESS_TOP, GUARD_DRESS_MIN, dressTop,
} from './edgeGuard.js';







export {
  COLUMN_T, CAMBER_COLS, CAMBER_START, CAMBER_MAX_RISE, CAMBER_GRIP,
  roadCrossSection, camberLiftAt, camberSlopeAt, camberEdgeY, camberProfile,
  planCamber,
} from './trackCamber.js';






export {
  RAIL_AT, RAIL_HEIGHT, RAIL_RADIUS, RAIL_CATCH, railContact, railMetres,
} from './trackRails.js';
export {
  
  
  
  
  DRAFT, WATER_SPEED, IMPACT_KILL, waterSurface, isWaterAt, isAdrift, boatCruise,
} from './water.js';




export const SHOULDER = 7;
export const KERB_WIDTH = 1.6;











export const FLAT_OUT = 46;
export const HILL_OUT = 150;
export const HILL_HEIGHT = 3.2;

















export const SHELF_OUT = 24;
export const RIM_SLOPE = 1.4;


















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
  let land = -Infinity;
  let ceiling = Infinity;
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
    if (h > land) land = h;
    const c = roadY + RIM_SLOPE * Math.max(0, out - SHELF_OUT);
    if (c < ceiling) ceiling = c;
  }
  
  if (land === -Infinity) land = hills;
  let best = Math.min(land, ceiling);
  
  
  
  
  
  const bestOut = near.dist - near.width / 2;

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









const GUARDS = new WeakMap();
















export function trackGuards(path, track) {
  const cached = GUARDS.get(path);
  if (cached && cached.hazards === path.hazards && cached.terrain === path.terrain
      && cached.track === track) {
    return cached.plan;
  }
  const plan = planEdgeGuards(path, track ?? {}, (x, z) => groundMeshHeightAt(path, x, z));
  GUARDS.set(path, {
    plan, track, hazards: path.hazards, terrain: path.terrain,
  });
  return plan;
}






const RAILS = new WeakMap();













export function trackRails(path, track) {
  const cached = RAILS.get(path);
  if (cached && cached.hazards === path.hazards && cached.terrain === path.terrain
      && cached.track === track) {
    return cached.plan;
  }
  const plan = planRails(path, track ?? {}, { guards: trackGuards(path, track) });
  RAILS.set(path, {
    plan, track, hazards: path.hazards, terrain: path.terrain,
  });
  return plan;
}


























export function bodyGroundY(path, surf, x, z, track = null) {
  const edge = vergeBaseY(surf);
  if (surf.onRoad) return edge;
  const blended = blendToGround(path, surf, x, z);
  if (!track) return blended;
  
  
  
  const guard = guardGroundY(trackGuards(path, track), surf, edge);
  return guard === null ? blended : Math.max(blended, guard);
}












export function vergeBaseY(surf) {
  return surf.roadY ?? surf.y ?? 0;
}










































export function vergeRamp(overBy) {
  const u = Math.min(1, Math.max(0, overBy ?? 0) / SHOULDER);
  return u * u * (3 - 2 * u);
}

export function blendToGround(path, surf, x, z) {
  const edge = vergeBaseY(surf);
  const ground = groundMeshHeightAt(path, x, z);
  
  
  
  
  
  
  
  
  
  const ramp = vergeRamp(surf.overBy ?? 0);
  return edge * (1 - ramp) + ground * ramp;
}
