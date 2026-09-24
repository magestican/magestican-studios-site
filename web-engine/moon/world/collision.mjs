



















import { placements as layoutPlacements, ISLAND_RADIUS, RIM_WIDTH } from './moonLayout.mjs';


export const PLAYER_RADIUS_M = 0.3;




export const EDGE_MARGIN_M = 0.25;
export const WALK_EDGE_M = ISLAND_RADIUS - RIM_WIDTH - EDGE_MARGIN_M;


export const MOVE_PIECE_RADII = 0.5;
export const RESOLVE_ITERATIONS = 6;



export const FENCE_JOINT_OVERLAP_M = 0.05;







const trunk = (radiusM) => Object.freeze({ shape: 'circle', radiusM, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.1, 0.6]) });
const APPLE_STAGES = Object.freeze({
  fruiting: trunk(0.39),
  young: trunk(0.23),
  sapling: trunk(0.45),
  seed: trunk(0.18),
  stump: trunk(0.4),
});
const PEACH_STAGES = Object.freeze({
  fruiting: trunk(0.39),
  young: trunk(0.24),
  sapling: trunk(0.5),
  seed: trunk(0.16),
  stump: trunk(0.41),
});














const PINE_STAGES = Object.freeze({
  fruiting: trunk(0.22),
  young: trunk(0.11),
  
  
  sapling: trunk(0.14),
  seed: trunk(0.1),
  stump: trunk(0.41),
});




export const FOOTPRINTS = Object.freeze({
  
  
  cottage: Object.freeze({ shape: 'box', halfXM: 2.68, halfZM: 2.24, offsetXM: 0, offsetZM: 0.06, bandM: Object.freeze([0.15, 1.0]) }),
  
  cat: Object.freeze({ shape: 'circle', radiusM: 0.46, offsetXM: 0.01, offsetZM: -0.05, bandM: Object.freeze([0.1, 1.0]) }),
  tree: APPLE_STAGES,
  peachTree: PEACH_STAGES,
  pine: PINE_STAGES,
  
  
  fence: Object.freeze({ shape: 'box', halfXM: null, halfZM: 0.14, offsetXM: 0, offsetZM: 0.02, bandM: Object.freeze([0.1, 1.0]) }),
  
  lamp: Object.freeze({ shape: 'circle', radiusM: 0.22, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]) }),
  
  firepit: Object.freeze({ shape: 'circle', radiusM: 0.64, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]) }),
  
  rock: Object.freeze({ shape: 'circle', radiusM: 0.48, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]), scaled: true }),
  
  
  
  
  crystalCluster: Object.freeze({ shape: 'circle', radiusM: 0.69, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]) }),
  iceSpike: Object.freeze({ shape: 'circle', radiusM: 0.66, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]) }),
  cactus: Object.freeze({ shape: 'circle', radiusM: 0.27, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 0.5]) }),
  deadTree: Object.freeze({ shape: 'circle', radiusM: 0.27, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]) }),
  giantMushroom: Object.freeze({ shape: 'circle', radiusM: 0.22, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.0]) }),
  
  
  
  
  
  
  
  shop: Object.freeze({ level1: building(1.66, 0.91), level2: building(2.4, 1.814), level3: building(3.654, 2.007) }),
  processor: Object.freeze({ level1: building(2.12, 2.272), level2: building(2.845, 2.272), level3: building(3.5, 2.272) }),
  
  
  parcelSign: Object.freeze({ shape: 'box', halfXM: 0.42, halfZM: 0.1, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.1, 0.6]) }),
  
  
  
  
  
  
  townBuilding: Object.freeze({ emporium: building(2.8, 2.36), market: building(3.25, 1.895), townHall: building(3.593, 2.785) }),
  
  
  
  
  'kit/decor/fountain': Object.freeze({ shape: 'circle', radiusM: 0.893, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.8]), anchored: true }),
  
  'kit/decor/well': Object.freeze({ shape: 'circle', radiusM: 0.875, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 1.8]), anchored: true }),
  'kit/decor/picnicTable': Object.freeze({ shape: 'circle', radiusM: 0.873, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 0.8]), anchored: true }),
  
  
  
  'kit/decor/signpost': Object.freeze({ shape: 'box', halfXM: 0.363, halfZM: 0.124, offsetXM: 0.295, offsetZM: -0.022, bandM: Object.freeze([0.0, 1.6]) }),
  
  
  
  
  
  
  villagerHome: Object.freeze({ shape: 'box', halfXM: 2.01, halfZM: 1.56, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.15, 1.0]), anchored: true }),
});





export const HOME_STAND_IN_SCALE = 0.6;
export const HOME_ROOM = Object.freeze({ shape: 'box', halfXM: 3.0, halfZM: 3.0, offsetXM: 0, offsetZM: 0 });
export const HOME_DOOR_M = 1.56 + 0.75;

function building(halfXM, halfZM) {
  return Object.freeze({ shape: 'box', halfXM, halfZM, offsetXM: 0, offsetZM: 0, bandM: Object.freeze([0.0, 2.0]), anchored: true });
}





export const BUILDING_ROOM = Object.freeze({ shop: FOOTPRINTS.shop.level3, processor: FOOTPRINTS.processor.level3 });



export const TOWN_ROLES = Object.freeze(['town', 'townDecor']);








export function townBlockObstacles(p, blocks) {
  return blocks.map((b, i) => buildingObstacle({ ...p, ...toWorld(p, b.x, b.z) }, { hx: b.hx, hz: b.hz, key: `${p.module}:${p.stage}:${i}` }));
}



export const PLOT_SIGN = Object.freeze({ radiusM: 0.2, xM: -1.5, zM: 2.45 });

export const BUILDING_ROLES = Object.freeze(['shop', 'processor']);



export const SCENE_SCALE_CLAMP = Object.freeze([0.6, 1.5]);
export const sceneScale = (p) => (p.scale ? Math.max(SCENE_SCALE_CLAMP[0], Math.min(SCENE_SCALE_CLAMP[1], p.scale)) : 1);


export function footprintEntry(p) {
  const entry = FOOTPRINTS[p.module];
  if (!entry) return null;
  if (entry.shape) return entry;
  return entry[p.stage || 'fruiting'] || null;
}


export function obstacleFor(p) {
  const f = footprintEntry(p);
  if (!f) return null;
  const rot = p.rotY || 0;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const s = f.scaled ? sceneScale(p) : 1;
  const x = p.x + (f.offsetXM * cos + f.offsetZM * sin) * s;
  const z = p.z + (-f.offsetXM * sin + f.offsetZM * cos) * s;
  if (f.shape === 'circle') {
    const r = f.radiusM * s;
    
    return p.stage && !FOOTPRINTS[p.module].shape ? { shape: 'circle', module: p.module, stage: p.stage, x, z, r, reach: r } : { shape: 'circle', module: p.module, x, z, r, reach: r };
  }
  const hx = (f.halfXM ?? ((p.segment || 2) / 2 + FENCE_JOINT_OVERLAP_M)) * s;
  const hz = f.halfZM * s;
  return { shape: 'box', module: p.module, x, z, cos, sin, hx, hz, reach: Math.hypot(hx, hz) };
}

export function obstaclesFrom(list = layoutPlacements()) {
  return list.map(obstacleFor).filter(Boolean);
}






export const TREE_MODULE = Object.freeze({ apple: 'tree', peach: 'peachTree', pine: 'pine' });


export function treeObstacle({ x, z, kind, stage }) {
  const module = TREE_MODULE[kind];
  if (!module) throw new Error(`no tree footprint for kind '${kind}'`);
  return obstacleFor({ module, stage, x, z, rotY: 0 });
}


export const obstaclesWithoutTrees = (list = layoutPlacements()) => obstaclesFrom(list.filter((p) => p.role !== 'tree'));







export const obstaclesWithoutRuntime = (list = layoutPlacements()) =>
  obstaclesFrom(list.filter((p) => p.role !== 'tree' && !BUILDING_ROLES.includes(p.role)));


export function buildingObstacle(p, footprint) {
  const cos = Math.cos(p.rotY || 0), sin = Math.sin(p.rotY || 0);
  const { hx, hz } = footprint;
  return { shape: 'box', module: p.module, x: p.x, z: p.z, cos, sin, hx, hz, reach: Math.hypot(hx, hz) };
}


export function toWorld(p, lx, lz) {
  const cos = Math.cos(p.rotY || 0), sin = Math.sin(p.rotY || 0);
  return { x: p.x + lx * cos + lz * sin, z: p.z - lx * sin + lz * cos };
}


export function plotObstacle(p) {
  const c = toWorld(p, PLOT_SIGN.xM, PLOT_SIGN.zM);
  return { shape: 'circle', module: 'plot', x: c.x, z: c.z, r: PLOT_SIGN.radiusM, reach: PLOT_SIGN.radiusM };
}


export function roomObstacle(p) {
  const room = BUILDING_ROOM[p.module];
  return buildingObstacle(p, { hx: room.halfXM, hz: room.halfZM });
}






export const homeObstacle = (home) => obstacleFor({ module: 'villagerHome', x: home.x, z: home.z, rotY: home.rotY || 0 });


export const homeRoomObstacle = (home) => buildingObstacle({ ...home, module: 'villagerHome' }, { hx: HOME_ROOM.halfXM, hz: HOME_ROOM.halfZM });


export const homeDoor = (home) => toWorld(home, 0, HOME_DOOR_M);






export const BERRY_BUSH = Object.freeze({ shape: 'circle', radiusM: 0.46 });


export function forageObstacle(spot) {
  if (spot.type !== 'berries') return null;
  return { shape: 'circle', module: 'berryBush', x: spot.x, z: spot.z, r: BERRY_BUSH.radiusM, reach: BERRY_BUSH.radiusM };
}





export function penetration(ob, x, z, radius) {
  const dx = x - ob.x, dz = z - ob.z;
  if (ob.shape === 'circle') {
    const d = Math.hypot(dx, dz);
    const depth = ob.r + radius - d;
    if (d < 1e-12) return { depth, nx: 0, nz: 1 };
    return { depth, nx: dx / d, nz: dz / d };
  }
  const lx = dx * ob.cos - dz * ob.sin;
  const lz = dx * ob.sin + dz * ob.cos;
  const qx = Math.max(-ob.hx, Math.min(ob.hx, lx));
  const qz = Math.max(-ob.hz, Math.min(ob.hz, lz));
  let nlx = lx - qx, nlz = lz - qz;
  const d = Math.hypot(nlx, nlz);
  let depth;
  if (d > 1e-12) {
    depth = radius - d;
    nlx /= d;
    nlz /= d;
  } else {
    
    const px = ob.hx - Math.abs(lx), pz = ob.hz - Math.abs(lz);
    if (px < pz) { nlx = lx < 0 ? -1 : 1; nlz = 0; depth = px + radius; } else { nlx = 0; nlz = lz < 0 ? -1 : 1; depth = pz + radius; }
  }
  return { depth, nx: nlx * ob.cos + nlz * ob.sin, nz: -nlx * ob.sin + nlz * ob.cos };
}

export function createCollisionWorld({ obstacles = obstaclesFrom(), walkEdgeM = WALK_EDGE_M } = {}) {
  function resolve(x, z, radius = PLAYER_RADIUS_M) {
    let hit = false;
    for (let iter = 0; iter < RESOLVE_ITERATIONS; iter++) {
      let moved = false;
      for (const ob of obstacles) {
        const dx = x - ob.x, dz = z - ob.z;
        const reach = ob.reach + radius;
        if (dx * dx + dz * dz >= reach * reach) continue;
        const p = penetration(ob, x, z, radius);
        if (p.depth > 1e-9) {
          x += p.nx * p.depth;
          z += p.nz * p.depth;
          moved = true;
        }
      }
      const r = Math.hypot(x, z);
      const edge = walkEdgeM - radius;
      if (r > edge) {
        x *= edge / r;
        z *= edge / r;
        moved = true;
      }
      if (!moved) break;
      hit = true;
    }
    return { x, z, hit };
  }

  function move(x0, z0, x1, z1, radius = PLAYER_RADIUS_M) {
    const dist = Math.hypot(x1 - x0, z1 - z0);
    const pieces = Math.max(1, Math.ceil(dist / (radius * MOVE_PIECE_RADII)));
    let x = x0, z = z0, hit = false;
    const sx = (x1 - x0) / pieces, sz = (z1 - z0) / pieces;
    for (let i = 0; i < pieces; i++) {
      const r = resolve(x + sx, z + sz, radius);
      x = r.x;
      z = r.z;
      hit = hit || r.hit;
    }
    return { x, z, hit };
  }

  




  function deepest(x, z, radius = PLAYER_RADIUS_M) {
    let best = null;
    for (const ob of obstacles) {
      const p = penetration(ob, x, z, radius);
      if (p.depth > 1e-6 && (!best || p.depth > best.depth)) best = { depth: p.depth, obstacle: ob };
    }
    return best;
  }

  
  
  
  const keyed = new Map();
  function remove(key) {
    const ob = keyed.get(key);
    if (!ob) return false;
    keyed.delete(key);
    const i = obstacles.indexOf(ob);
    if (i >= 0) obstacles.splice(i, 1);
    return true;
  }
  function add(key, ob) {
    remove(key);
    if (!ob) return null;
    const entry = { ...ob, key };
    keyed.set(key, entry);
    obstacles.push(entry);
    return entry;
  }

  return { obstacles, walkEdgeM, resolve, move, deepest, add, remove, get: (key) => keyed.get(key) || null };
}
