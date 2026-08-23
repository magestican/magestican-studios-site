











import { SeededRng } from '../rng/seededRng.js';
import { VoxelGrid, VOX, GROUND_VOX } from '../voxel/voxelGrid.js';
import { getMap, DEFAULT_MAP } from './mapSpec.js';
import {
  ZONE_HALF, ZONE_DECK_TOP, insideZone, zoneSpawn,
  buildPowerZones, powerZoneCentres as zoneCentresOf,
} from './powerUpZones.js';






export const WORLD_SIZE = { x: 80, y: 12, z: 80 };
export const BASE_SIZE  = { x: 10, y: 4,  z: 10 };








export const BASELINE_SIZE = 64;
export const AREA_SCALE =
  (WORLD_SIZE.x * WORLD_SIZE.z) / (BASELINE_SIZE * BASELINE_SIZE);
export function perArea(count) {
  return Math.max(1, Math.round(count * AREA_SCALE));
}


export function atFraction(v, axis = WORLD_SIZE.x) {
  return Math.round((v / BASELINE_SIZE) * axis);
}

export function generateWorld(seed, mapId = DEFAULT_MAP) {
  const map = getMap(mapId);
  const rng = new SeededRng(seed);
  const grid = new VoxelGrid(WORLD_SIZE.x, WORLD_SIZE.y, WORLD_SIZE.z);

  
  grid.fillBox(0, 0, 0, WORLD_SIZE.x - 1, 0, WORLD_SIZE.z - 1, map.ground);
  
  
  const patchRng = rng.child('ice-patch');
  const patchCount = perArea(map.patch.count);
  for (let i = 0; i < patchCount; i++) {
    const px = patchRng.rangeI(4, WORLD_SIZE.x - 6);
    const pz = patchRng.rangeI(4, WORLD_SIZE.z - 6);
    const w = patchRng.rangeI(map.patch.size[0], map.patch.size[1]);
    const h = patchRng.rangeI(map.patch.size[0], map.patch.size[1]);
    grid.fillBox(px, 0, pz, px + w, 0, pz + h, map.patch.vox);
  }

  const cx = Math.floor(WORLD_SIZE.x / 2);
  const cz = Math.floor(WORLD_SIZE.z / 2);

  
  
  
  const redBase = { x: 2,                       z: 2 };
  const blueBase = { x: WORLD_SIZE.x - BASE_SIZE.x - 2,
                     z: WORLD_SIZE.z - BASE_SIZE.z - 2 };

  
  
  
  
  buildTerrain(grid, rng.child('terrain'), map, { redBase, blueBase, cx, cz });

  
  
  const centreTop = buildCentre(grid, map, cx, cz);

  buildBase(grid, redBase.x,  redBase.z,  VOX.BASE_RED,  VOX.FLAG_STAND_RED,  map);
  buildBase(grid, blueBase.x, blueBase.z, VOX.BASE_BLUE, VOX.FLAG_STAND_BLUE, map);

  
  
  const powerUpZones = buildPowerZones(grid, WORLD_SIZE);

  
  const coverRng = rng.child('cover');
  const coverCount = perArea(coverRng.rangeI(20, 32));
  for (let i = 0; i < coverCount; i++) {
    const px = coverRng.rangeI(12, WORLD_SIZE.x - 13);
    const pz = coverRng.rangeI(12, WORLD_SIZE.z - 13);
    if (insideBase(px, pz, redBase) || insideBase(px, pz, blueBase)) continue;
    if (insideZone(px, pz, powerUpZones, 6)) continue;   
    
    
    
    
    
    if (occupied(grid, px, pz, 3)) continue;
    buildCover(grid, coverRng, coverRng.pick(map.cover), px, pz);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const wear = map.wear
    ? applyGroundWear(grid, rng.child('wear'), { redBase, blueBase, hillX: cx, hillZ: cz })
    : { tractorParking: [] };

  
  
  
  const hayStacks = placeHayStacks(grid, rng.child('hay'), map, {
    redBase, blueBase, powerUpZones, cx, cz, keepClear: wear.tractorParking,
  });

  const ambientSpots = placeAmbient(grid, rng.child('ambient'), map, { redBase, blueBase });

  const hillSpawn = { x: cx + 0.5, y: centreTop + 0.5, z: cz + 0.5 };

  
  
  
  const spawns = {
    red:  { x: redBase.x  + 2, y: 1, z: redBase.z  + Math.floor(BASE_SIZE.z / 2) },
    blue: { x: blueBase.x + BASE_SIZE.x - 3, y: 1, z: blueBase.z + Math.floor(BASE_SIZE.z / 2) },
  };

  const flags = {
    red:  { x: redBase.x  + BASE_SIZE.x / 2, y: 1, z: redBase.z  + BASE_SIZE.z / 2 },
    blue: { x: blueBase.x + BASE_SIZE.x / 2, y: 1, z: blueBase.z + BASE_SIZE.z / 2 },
  };

  const barnSigns = {
    red:  barnSignAnchor(redBase.x,  redBase.z),
    blue: barnSignAnchor(blueBase.x, blueBase.z),
  };

  return { seed, mapId: map.id, map, grid, spawns, flags, redBase, blueBase,
           hillSpawn, hayStacks, barnSigns,
           tractorParking: wear.tractorParking,
           powerUpZones,
           powerUpSpawns: {
             'protein-shake': zoneSpawn(powerUpZones.gym),
             'cheese-wheel':  zoneSpawn(powerUpZones.dairy),
           },
           ambientSpots };
}





function buildTerrain(grid, rng, map, { redBase, blueBase, cx, cz }) {
  const ambientSpots = [];
  
  
  
  
  
  const STANDOFF = 9;
  const nearBase = (x, z, b) =>
    x > b.x - STANDOFF && x < b.x + BASE_SIZE.x + STANDOFF
    && z > b.z - STANDOFF && z < b.z + BASE_SIZE.z + STANDOFF;
  
  
  
  
  const zones = Object.values(powerZoneCentres());
  const clearOfBases = (x, z) =>
    !nearBase(x, z, redBase) && !nearBase(x, z, blueBase)
    && !zones.some((c) => Math.abs(x - c.x) <= ZONE_HALF + 5
                       && Math.abs(z - c.z) <= ZONE_HALF + 5);

  if (map.terrain === 'terraces') {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const F = (v) => atFraction(v);
    const ridges = [
      { ax: F(rng.rangeI(6, 16)),  az: F(rng.rangeI(30, 42)),
        bx: F(rng.rangeI(30, 42)), bz: F(rng.rangeI(4, 14)) },
      { ax: F(rng.rangeI(22, 34)), az: F(rng.rangeI(50, 60)),
        bx: F(rng.rangeI(50, 60)), bz: F(rng.rangeI(22, 34)) },
    ];
    const distToSeg = (px, pz, s) => {
      const vx = s.bx - s.ax, vz = s.bz - s.az;
      const len2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((px - s.ax) * vx + (pz - s.az) * vz) / len2));
      return Math.hypot(px - (s.ax + t * vx), pz - (s.az + t * vz));
    };
    for (let x = 0; x < WORLD_SIZE.x; x++) {
      for (let z = 0; z < WORLD_SIZE.z; z++) {
        if (!clearOfBases(x, z)) continue;
        if (Math.abs(x - cx) < 6 && Math.abs(z - cz) < 6) continue;  
        const d = Math.min(...ridges.map((s) => distToSeg(x, z, s)));
        const h = Math.max(0, 4 - Math.floor(d / 3.2));
        for (let y = 1; y <= h; y++) grid.set(x, y, z, VOX.ROCK);
        if (h >= 3) grid.set(x, h, z, VOX.ICE);   
      }
    }

  } else if (map.terrain === 'rink') {
    
    
    
    const pad = { x0: 14, z0: 14, x1: WORLD_SIZE.x - 15, z1: WORLD_SIZE.z - 15 };
    grid.fillBox(pad.x0, 0, pad.z0, pad.x1, 0, pad.z1, VOX.RINK);
    const gateX = Math.floor((pad.x0 + pad.x1) / 2);
    const gateZ = Math.floor((pad.z0 + pad.z1) / 2);
    const isGate = (x, z) =>
      (Math.abs(x - gateX) <= 2 && (z === pad.z0 || z === pad.z1))
      || (Math.abs(z - gateZ) <= 2 && (x === pad.x0 || x === pad.x1));
    for (let x = pad.x0; x <= pad.x1; x++) {
      for (const z of [pad.z0, pad.z1]) {
        if (isGate(x, z)) continue;
        grid.set(x, 1, z, VOX.BOARDS); grid.set(x, 2, z, VOX.BOARDS);
      }
    }
    for (let z = pad.z0; z <= pad.z1; z++) {
      for (const x of [pad.x0, pad.x1]) {
        if (isGate(x, z)) continue;
        grid.set(x, 1, z, VOX.BOARDS); grid.set(x, 2, z, VOX.BOARDS);
      }
    }

  } else if (map.terrain === 'floes') {
    
    
    
    const ridges = perArea(rng.rangeI(5, 8));
    for (let r = 0; r < ridges; r++) {
      let x = rng.rangeI(8, WORLD_SIZE.x - 9);
      let z = rng.rangeI(8, WORLD_SIZE.z - 9);
      const alongX = rng.rangeF(0, 1) < 0.5;
      const len = rng.rangeI(10, 22);
      for (let i = 0; i < len; i++) {
        if (clearOfBases(x, z) && !(Math.abs(x - cx) < 5 && Math.abs(z - cz) < 5)) {
          
          
          
          
          
          grid.set(x, 1, z, VOX.IGLOO);
          if (rng.rangeF(0, 1) < 0.35) grid.set(x, 2, z, VOX.ICE);
        }
        if (alongX) { x += 1; z += rng.rangeI(-1, 1); }
        else        { z += 1; x += rng.rangeI(-1, 1); }
        if (x < 3 || z < 3 || x >= WORLD_SIZE.x - 3 || z >= WORLD_SIZE.z - 3) break;
      }
    }
  }

  return { ambientSpots };
}






function placeAmbient(grid, rng, map, { redBase, blueBase }) {
  const spots = [];
  if (!map.ambient) return spots;
  
  
  
  
  const wantsHigh = map.ambient.prefer === 'high';
  
  
  
  
  
  
  const wantsPaved = map.ambient.prefer === 'paved';
  
  
  
  
  
  const spread = map.ambient.spread ?? 4;
  
  
  
  const total = perArea(map.ambient.count);
  const clusters = perArea(map.ambient.clusters);
  const per = Math.ceil(total / clusters);
  
  
  const surfaceVox = (x, z) => grid.get(x, standY(grid, x, z) - 1, z);
  for (let c = 0; c < clusters; c++) {
    
    
    
    
    
    for (let attempt = 0; attempt < 18; attempt++) {
      const hx = rng.rangeI(8, WORLD_SIZE.x - 9);
      const hz = rng.rangeI(8, WORLD_SIZE.z - 9);
      const strict = (wantsHigh || wantsPaved) && attempt < 12;
      if (strict && wantsHigh && standY(grid, hx, hz) < 2) continue;
      if (strict && wantsPaved && surfaceVox(hx, hz) !== VOX.PAVER) continue;
      const got = [];
      for (let i = 0; i < per * 4 && got.length < per; i++) {
        const x = hx + rng.rangeI(-spread, spread);
        const z = hz + rng.rangeI(-spread, spread);
        if (x < 2 || z < 2 || x >= WORLD_SIZE.x - 2 || z >= WORLD_SIZE.z - 2) continue;
        if (insideBase(x, z, redBase) || insideBase(x, z, blueBase)) continue;
        const y = ledgeY(grid, x, z);
        if (y < 0) continue;
        if (strict && wantsHigh && y < 2) continue;
        if (strict && wantsPaved && grid.get(x, y - 1, z) !== VOX.PAVER) continue;
        if (got.some((g) => g.x === x + 0.5 && g.z === z + 0.5)) continue;
        got.push({ x: x + 0.5, y, z: z + 0.5 });
      }
      if (got.length) { spots.push(...got); break; }
    }
  }
  return spots;
}













export { ZONE_HALF, ZONE_DECK_TOP, insideZone, zoneSpawn };





export function powerZoneCentres(size = WORLD_SIZE) {
  return zoneCentresOf(size);
}



function occupied(grid, x, z, upTo = 3) {
  for (let y = 1; y <= upTo; y++) if (grid.get(x, y, z) !== VOX.AIR) return true;
  return false;
}











function standY(grid, x, z) {
  for (let y = WORLD_SIZE.y - 1; y >= 1; y--) if (grid.get(x, y, z) !== VOX.AIR) return y + 1;
  return 1;
}









function ledgeY(grid, x, z) {
  const y = standY(grid, x, z);
  if (y + 2 >= WORLD_SIZE.y) return -1;                       
  
  
  
  
  
  
  
  if (y > 1 && grid.get(x, y - 1, z) === VOX.HAY) return -1;
  for (let h = 0; h < 3; h++) if (grid.get(x, y + h, z) !== VOX.AIR) return -1;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!grid.inBounds(nx, 0, nz)) return -1;
    if (Math.abs(standY(grid, nx, nz) - y) > 1) return -1;    
  }
  return y;
}




function buildCentre(grid, map, cx, cz) {
  const vox = map.centre.vox;
  switch (map.centre.style) {
    case 'summit':
      
      
      grid.fillBox(cx - 3, 1, cz - 3, cx + 3, 1, cz + 3, vox);
      grid.fillBox(cx - 2, 2, cz - 2, cx + 2, 2, cz + 2, vox);
      grid.fillBox(cx - 1, 3, cz - 1, cx + 1, 3, cz + 1, VOX.ICE);
      return 4;
    case 'faceoff':
      
      
      grid.fillBox(cx - 3, 0, cz - 3, cx + 3, 0, cz + 3, vox);
      return 1;
    case 'berg':
      
      grid.fillBox(cx - 2, 1, cz - 2, cx + 2, 1, cz + 2, vox);
      grid.fillBox(cx - 2, 2, cz - 1, cx + 1, 2, cz + 2, vox);
      grid.fillBox(cx - 1, 3, cz - 1, cx, 3, cz, VOX.ICE);
      return 4;
    default:
      grid.fillBox(cx - 2, 1, cz - 2, cx + 2, 1, cz + 2, vox);
      grid.fillBox(cx - 1, 2, cz - 1, cx + 1, 2, cz + 1, vox);
      return 3;
  }
}

function buildCover(grid, rng, kind, x, z) {
  switch (kind) {
    case 'pillar': {
      const h = rng.rangeI(2, 4);
      grid.fillBox(x, 1, z, x, h, z, VOX.STONE);
      break;
    }
    case 'crate': {
      const stacks = rng.rangeI(1, 2);
      grid.fillBox(x, 1, z, x + 1, stacks, z + 1, VOX.WOOD);
      break;
    }
    case 'wall': {
      const len = rng.rangeI(3, 5);
      if (rng.pick(['x', 'z']) === 'x') grid.fillBox(x, 1, z, x + len, 2, z, VOX.STONE);
      else                              grid.fillBox(x, 1, z, x, 2, z + len, VOX.STONE);
      break;
    }
    case 'spire': {
      
      const h = rng.rangeI(3, 6);
      grid.fillBox(x, 1, z, x, h - 1, z, VOX.ROCK);
      grid.set(x, h, z, VOX.ICE);
      break;
    }
    case 'iceWall': {
      
      
      const len = rng.rangeI(3, 6);
      if (rng.pick(['x', 'z']) === 'x') grid.fillBox(x, 1, z, x + len, 2, z, VOX.ICE);
      else                              grid.fillBox(x, 1, z, x, 2, z + len, VOX.ICE);
      break;
    }
    case 'boulder': {
      grid.fillBox(x, 1, z, x + 1, 1, z + 1, VOX.ROCK);
      grid.set(x, 2, z, VOX.ROCK);
      break;
    }
    case 'berg': {
      const w = rng.rangeI(2, 3);
      grid.fillBox(x, 1, z, x + w, 1, z + w, VOX.IGLOO);
      grid.fillBox(x, 2, z, x + w - 1, 2, z + w - 1, VOX.ICE);
      break;
    }
    case 'ridge': {
      const len = rng.rangeI(4, 8);
      for (let i = 0; i < len; i++) grid.set(x + i, 1, z + (i % 2), VOX.ICE);
      break;
    }
    case 'bench': {
      const len = rng.rangeI(3, 5);
      const alongX = rng.pick(['x', 'z']) === 'x';
      for (let i = 0; i < len; i++) {
        grid.set(alongX ? x + i : x, 1, alongX ? z : z + i, VOX.WOOD);
      }
      break;
    }
    case 'planter': {
      
      grid.fillBox(x, 1, z, x + 1, 1, z + 1, VOX.STONE);
      grid.set(x, 2, z, VOX.PINE);
      grid.set(x + 1, 2, z + 1, VOX.PINE);
      break;
    }
  }
}




















export const WEAR = Object.freeze({
  apronDepth: 6,        
  apronHalfWidth: 4,    
  pathHalfWidth: 1,     
  pathWander: 0.42,     
                        
                        
  pathFray: 0.45,       
  hillRingInner: 3,     
  hillRingOuter: 5,     
  hillRingFray: 0.72,
  
  
  
  
  
  
  
  
  
  trackZ: atFraction(25, WORLD_SIZE.z),
  trackX0: 4,
  trackX1: WORLD_SIZE.x - 5,
  trackWander: 1.4,     
  trackWanderRate: 0.055,
  parkingX: Object.freeze([atFraction(12), atFraction(47)]),  
  parkingApron: 2,      
  holeFill: 6,          
                        
  scuffs: perArea(14),  
  scuffRadius: 2,
});






function troddenAt(x, z) {
  
  
  
  let h = (Math.imul(x, 0x9e3779b1) ^ Math.imul(z, 0x85ebca77)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h & 1) ? VOX.TRODDEN_B : VOX.TRODDEN;
}

const GROUND_SET = new Set(GROUND_VOX);











function wearTile(grid, x, z, vox) {
  if (!grid.inBounds(x, 0, z)) return false;
  const cur = grid.get(x, 0, z);
  if (!GROUND_SET.has(cur)) return false;
  const paint = vox === undefined ? troddenAt(x, z) : vox;
  if (cur === VOX.RUT && paint !== VOX.RUT) return false;
  grid.set(x, 0, z, paint);
  return true;
}

function wearDisc(grid, rng, x0, z0, r, fray = 0) {
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > r) continue;
      
      if (d > r - 1 && rng.rangeF(0, 1) > fray) continue;
      wearTile(grid, x0 + dx, z0 + dz);
    }
  }
}

export function applyGroundWear(grid, rng, { redBase, blueBase, hillX, hillZ }) {
  
  
  
  for (const base of [redBase, blueBase]) {
    const { faceX, midZ, nx } = barnDoorway(base.x, base.z);
    const x0 = nx > 0 ? faceX : faceX - 1;
    for (let d = 0; d < WEAR.apronDepth; d++) {
      const t = d / (WEAR.apronDepth - 1);
      const halfW = 1 + Math.round(t * (WEAR.apronHalfWidth - 1));
      for (let dz = -halfW; dz <= halfW; dz++) {
        
        
        if (Math.abs(dz) === halfW && rng.rangeF(0, 1) > 0.6) continue;
        if (d === WEAR.apronDepth - 1 && rng.rangeF(0, 1) > 0.55) continue;
        wearTile(grid, x0 + nx * d, midZ + dz);
      }
    }
  }

  
  
  for (const base of [redBase, blueBase]) {
    const { faceX, midZ, nx } = barnDoorway(base.x, base.z);
    walkPath(grid, rng, faceX + nx * WEAR.apronDepth, midZ, hillX, hillZ);
  }

  
  
  
  for (let dz = -WEAR.hillRingOuter; dz <= WEAR.hillRingOuter; dz++) {
    for (let dx = -WEAR.hillRingOuter; dx <= WEAR.hillRingOuter; dx++) {
      const d = Math.hypot(dx, dz);
      if (d < WEAR.hillRingInner || d > WEAR.hillRingOuter) continue;
      if (rng.rangeF(0, 1) > WEAR.hillRingFray) continue;
      wearTile(grid, hillX + dx, hillZ + dz);
    }
  }

  
  
  const phase = rng.rangeF(0, 6.28);
  const laneZ = (x) => WEAR.trackZ
    + Math.round(Math.sin(x * WEAR.trackWanderRate + phase) * WEAR.trackWander);
  for (let x = WEAR.trackX0; x <= WEAR.trackX1; x++) {
    const z = laneZ(x);
    
    
    
    
    const zs = new Set([z, laneZ(x - 1)]);
    for (const lz of zs) {
      wearTile(grid, x, lz,     VOX.RUT);
      wearTile(grid, x, lz + 1, troddenAt(x, lz + 1));
      wearTile(grid, x, lz + 2, VOX.RUT);
    }
  }

  
  
  
  
  
  const tractorParking = [];
  for (const px of WEAR.parkingX) {
    const pz = laneZ(px) + 1;
    wearDisc(grid, rng, px, pz, WEAR.parkingApron + 1, 0.5);
    
    
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++)
        grid.fillBox(px + dx, 1, pz + dz, px + dx, 3, pz + dz, VOX.AIR);
    tractorParking.push({ x: px, z: pz,
      yaw: px < WORLD_SIZE.x / 2 ? Math.PI / 2 : -Math.PI / 2 });
  }

  
  
  
  for (let i = 0; i < WEAR.scuffs; i++) {
    const x = rng.rangeI(6, WORLD_SIZE.x - 7), z = rng.rangeI(6, WORLD_SIZE.z - 7);
    wearDisc(grid, rng, x, z, rng.rangeI(1, WEAR.scuffRadius), 0.35);
  }

  
  
  
  
  
  
  closeWearHoles(grid);

  return { tractorParking };
}




function closeWearHoles(grid) {
  const worn = new Set([VOX.TRODDEN, VOX.TRODDEN_B, VOX.RUT]);
  const before = grid.data.slice();
  const at = (x, z) => worn.has(before[grid.idx(x, 0, z)]);
  for (let z = 1; z < WORLD_SIZE.z - 1; z++) {
    for (let x = 1; x < WORLD_SIZE.x - 1; x++) {
      if (at(x, z)) continue;
      let n = 0;
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++)
          if ((dx || dz) && at(x + dx, z + dz)) n++;
      if (n >= WEAR.holeFill) wearTile(grid, x, z);
    }
  }
}




function walkPath(grid, rng, x0, z0, tx, tz) {
  let x = x0, z = z0;
  let ang = Math.atan2(tz - z0, tx - x0);
  const maxSteps = (WORLD_SIZE.x + WORLD_SIZE.z) * 2;
  for (let i = 0; i < maxSteps; i++) {
    const toTarget = Math.atan2(tz - z, tx - x);
    
    
    let d = toTarget - ang;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    ang += d * 0.35 + rng.rangeF(-WEAR.pathWander, WEAR.pathWander);
    x += Math.cos(ang);
    z += Math.sin(ang);
    const ix = Math.round(x), iz = Math.round(z);
    const nx = -Math.sin(ang), nz = Math.cos(ang);
    for (let o = -WEAR.pathHalfWidth; o <= WEAR.pathHalfWidth; o++) {
      wearTile(grid, Math.round(x + nx * o), Math.round(z + nz * o));
    }
    
    if (rng.rangeF(0, 1) < WEAR.pathFray) {
      const side = rng.rangeF(0, 1) < 0.5 ? -1 : 1;
      const o = side * (WEAR.pathHalfWidth + 1);
      wearTile(grid, Math.round(x + nx * o), Math.round(z + nz * o));
    }
    if (Math.hypot(tx - ix, tz - iz) <= WEAR.hillRingOuter) break;
  }
}













function buildBase(grid, ox, oz, baseVox, standVox, map) {
  const style = map?.base?.style ?? 'barn';
  if (style === 'cabin')         buildCabin(grid, ox, oz, baseVox);
  else if (style === 'pavilion') buildPavilion(grid, ox, oz, baseVox);
  else if (style === 'igloo')    buildIgloo(grid, ox, oz, baseVox);
  else                           buildBarn(grid, ox, oz, baseVox);

  
  
  const cx = ox + Math.floor(BASE_SIZE.x / 2);
  const cz = oz + Math.floor(BASE_SIZE.z / 2);
  grid.set(cx, 1, cz, standVox);
}




function cutDoorway(grid, ox, oz, frameVox) {
  const { wallX, midZ } = barnDoorway(ox, oz);
  for (let z = midZ - 1; z <= midZ + 1; z++) {
    grid.set(wallX, 1, z, VOX.AIR);
    grid.set(wallX, 2, z, VOX.AIR);
  }
  if (frameVox == null) return;
  for (const jz of [midZ - 2, midZ + 2]) {
    grid.set(wallX, 1, jz, frameVox);
    grid.set(wallX, 2, jz, frameVox);
  }
  for (let z = midZ - 2; z <= midZ + 2; z++) grid.set(wallX, 3, z, frameVox);
}


function boxWalls(grid, ox, oz, vox, top = 3) {
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    for (let y = 1; y <= top; y++) {
      grid.set(x, y, oz, vox);
      grid.set(x, y, oz + BASE_SIZE.z - 1, vox);
    }
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let y = 1; y <= top; y++) {
      grid.set(ox, y, z, vox);
      grid.set(ox + BASE_SIZE.x - 1, y, z, vox);
    }
  }
}


function buildBarn(grid, ox, oz, baseVox) {
  
  
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, baseVox);
  boxWalls(grid, ox, oz, baseVox);
  cutDoorway(grid, ox, oz, VOX.WOOD);

  
  
  for (let y = 1; y <= 3; y++) {
    grid.set(ox, y, oz, VOX.WOOD);
    grid.set(ox + BASE_SIZE.x - 1, y, oz, VOX.WOOD);
    grid.set(ox, y, oz + BASE_SIZE.z - 1, VOX.WOOD);
    grid.set(ox + BASE_SIZE.x - 1, y, oz + BASE_SIZE.z - 1, VOX.WOOD);
  }
  
  
  const midX = ox + Math.floor(BASE_SIZE.x / 2);
  const halfWidth = Math.floor(BASE_SIZE.x / 2);
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let step = 0; step < halfWidth; step++) {
      const y = 4 + step;
      grid.set(midX - halfWidth + step, y, z, VOX.WOOD);
      grid.set(midX + halfWidth - step, y, z, VOX.WOOD);
      for (let fx = midX - halfWidth + step + 1; fx <= midX + halfWidth - step - 1; fx++) {
        grid.set(fx, y, z, VOX.GLASS);
      }
    }
    grid.set(midX, 4 + halfWidth, z, VOX.WOOD);
  }
  
  
  for (const gz of [oz, oz + BASE_SIZE.z - 1]) {
    for (let hx = midX - 1; hx <= midX + 1; hx++) grid.set(hx, 4, gz, VOX.HAY);
  }
}




function buildCabin(grid, ox, oz, baseVox) {
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, VOX.WOOD);
  boxWalls(grid, ox, oz, VOX.WOOD);
  
  
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    grid.set(x, 2, oz, baseVox);
    grid.set(x, 2, oz + BASE_SIZE.z - 1, baseVox);
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    grid.set(ox, 2, z, baseVox);
    grid.set(ox + BASE_SIZE.x - 1, 2, z, baseVox);
  }
  cutDoorway(grid, ox, oz, VOX.ROCK);

  
  
  
  const midX = ox + Math.floor(BASE_SIZE.x / 2);
  const half = Math.floor(BASE_SIZE.x / 2);
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    for (let step = 0; step < half; step += 2) {
      const y = 4 + step / 2;
      for (let fx = midX - half + step; fx <= midX + half - step; fx++) {
        grid.set(fx, y, z, fx === midX - half + step || fx === midX + half - step
          ? VOX.WOOD : VOX.GLASS);
      }
    }
    grid.set(midX, 4 + Math.ceil(half / 2), z, VOX.ICE);   
  }
  
  const chx = ox + 1, chz = oz + 1;
  for (let y = 1; y <= 6; y++) grid.set(chx, y, chz, VOX.ROCK);
}




function buildPavilion(grid, ox, oz, baseVox) {
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, VOX.PAVER);
  boxWalls(grid, ox, oz, VOX.BOARDS);
  
  
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    grid.set(x, 1, oz, baseVox);
    grid.set(x, 1, oz + BASE_SIZE.z - 1, baseVox);
  }
  for (let z = oz; z < oz + BASE_SIZE.z; z++) {
    grid.set(ox, 1, z, baseVox);
    grid.set(ox + BASE_SIZE.x - 1, 1, z, baseVox);
  }
  cutDoorway(grid, ox, oz, VOX.BOARDS);
  
  const benchZ = oz + BASE_SIZE.z - 2;
  for (let x = ox + 2; x < ox + BASE_SIZE.x - 2; x++) grid.set(x, 1, benchZ, VOX.WOOD);
  
  for (let x = ox; x < ox + BASE_SIZE.x; x++) {
    for (let z = oz; z < oz + BASE_SIZE.z; z++) {
      const edge = x === ox || z === oz
        || x === ox + BASE_SIZE.x - 1 || z === oz + BASE_SIZE.z - 1;
      grid.set(x, 4, z, edge ? VOX.BOARDS : VOX.GLASS);
    }
  }
  
  for (const lx of [ox, ox + BASE_SIZE.x - 1]) {
    for (let y = 5; y <= 6; y++) grid.set(lx, y, oz, VOX.STONE);
  }
}





function buildIgloo(grid, ox, oz, baseVox) {
  grid.fillBox(ox, 0, oz, ox + BASE_SIZE.x - 1, 0, oz + BASE_SIZE.z - 1, VOX.IGLOO);

  const cx = ox + (BASE_SIZE.x - 1) / 2;
  const cz = oz + (BASE_SIZE.z - 1) / 2;
  
  
  
  
  const R = 4.9;
  const H = 5.6;
  const SHELL = 0.78;   

  
  
  
  
  const e = (x, y, z) => Math.hypot((x - cx) / R, (z - cz) / R, (y - 1) / H);

  for (let y = 1; y <= Math.ceil(H); y++) {
    for (let x = ox - 1; x <= ox + BASE_SIZE.x; x++) {
      for (let z = oz - 1; z <= oz + BASE_SIZE.z; z++) {
        const d = e(x, y, z);
        if (d > 1.0) continue;
        if (d > SHELL) {
          
          
          
          grid.set(x, y, z, (y === 2 && (x + z) % 3 === 0) ? baseVox : VOX.IGLOO);
        } else {
          grid.set(x, y, z, VOX.AIR);   
        }
      }
    }
  }
  
  
  for (let x = Math.floor(cx) - 1; x <= Math.ceil(cx) + 1; x++) {
    for (let z = Math.floor(cz) - 1; z <= Math.ceil(cz) + 1; z++) {
      grid.set(x, Math.ceil(H) + 1, z, VOX.IGLOO);
    }
  }

  
  
  
  const { wallX, midZ, nx } = barnDoorway(ox, oz);
  const innerX = Math.round(cx - nx * (R - 1.6));   
  for (let step = -1; step <= 4; step++) {
    const x = wallX + nx * step;
    if (nx > 0 ? x < innerX : x > innerX) continue;
    for (let z = midZ - 1; z <= midZ + 1; z++) {
      grid.set(x, 0, z, VOX.IGLOO);
      grid.set(x, 1, z, VOX.AIR);
      grid.set(x, 2, z, VOX.AIR);
      if (step >= 0) grid.set(x, 3, z, VOX.IGLOO);
    }
    if (step >= 0) {
      for (const jz of [midZ - 2, midZ + 2]) {
        grid.set(x, 1, jz, VOX.IGLOO);
        grid.set(x, 2, jz, VOX.IGLOO);
      }
    }
  }
  
  
  const standX = ox + Math.floor(BASE_SIZE.x / 2);
  const lo = Math.min(standX, innerX), hi = Math.max(standX, innerX);
  for (let x = lo; x <= hi; x++) {
    for (let z = midZ - 1; z <= midZ + 1; z++) {
      grid.set(x, 1, z, VOX.AIR);
      grid.set(x, 2, z, VOX.AIR);
    }
  }
}









export function barnDoorway(ox, oz) {
  const midZ = oz + Math.floor(BASE_SIZE.z / 2);
  const facesPlusX = ox < 10;
  const wallX = facesPlusX ? ox + BASE_SIZE.x - 1 : ox;
  return {
    wallX, midZ,
    nx: facesPlusX ? 1 : -1,
    faceX: facesPlusX ? wallX + 1 : wallX,
  };
}





export function barnSignAnchor(ox, oz) {
  const { faceX, midZ, nx } = barnDoorway(ox, oz);
  return {
    x: faceX + nx * 0.06,
    y: 3.5,
    z: midZ + 0.5,
    yaw: nx > 0 ? Math.PI / 2 : -Math.PI / 2,
    nx,
  };
}

function insideBase(x, z, base) {
  return x >= base.x - 1 && x <= base.x + BASE_SIZE.x
      && z >= base.z - 1 && z <= base.z + BASE_SIZE.z;
}











































export const HAY_STACK = Object.freeze({
  span: 5,             
  half: 2,             
  bodyCourses: [2, 3], 
  minCourses: 4,       
  
  
  
  
  
  base: (dx, dz) => Math.abs(dx) <= 2 && Math.abs(dz) <= 2,
  body: (dx, dz) => Math.abs(dx) + Math.abs(dz) <= 3,
  cap:  (dx, dz) => Math.abs(dx) + Math.abs(dz) <= 1,
  
  
  isCore: (dx, dz) => Math.abs(dx) + Math.abs(dz) <= 1,
});




function hayCourses(rng) {
  const [lo, hi] = HAY_STACK.bodyCourses;
  return 1 + rng.rangeI(lo, hi) + 1;         
}









function buildHayStack(grid, ox, oz, y, courses) {
  const { half, base, body, cap } = HAY_STACK;
  let placed = 0;
  for (let c = 0; c < courses; c++) {
    const shape = c === 0 ? base : (c === courses - 1 ? cap : body);
    for (let dx = -half; dx <= half; dx++) {
      for (let dz = -half; dz <= half; dz++) {
        if (!shape(dx, dz)) continue;
        const x = ox + dx, z = oz + dz, yy = y + c;
        if (!grid.inBounds(x, yy, z)) continue;
        if (grid.get(x, yy, z) !== VOX.AIR) continue;
        grid.set(x, yy, z, VOX.HAY);
        placed++;
      }
    }
  }
  return placed;
}











function hayFootingAt(grid, ox, oz, courses) {
  const { half } = HAY_STACK;
  const y = standY(grid, ox, oz);
  if (y + courses >= WORLD_SIZE.y) return -1;      
  for (let dx = -half; dx <= half; dx++) {
    for (let dz = -half; dz <= half; dz++) {
      const x = ox + dx, z = oz + dz;
      if (!grid.inBounds(x, 0, z)) return -1;
      if (standY(grid, x, z) !== y) return -1;     
      for (let c = 0; c < courses; c++) {
        if (grid.get(x, y + c, z) !== VOX.AIR) return -1;
      }
    }
  }
  return y;
}



function placeHayStacks(grid, rng, map,
                        { redBase, blueBase, powerUpZones, cx, cz, keepClear = [] }) {
  const stacks = [];
  if (!map.hay) return stacks;
  const { half, span } = HAY_STACK;
  
  
  
  const want = perArea(rng.rangeI(map.hay.count - 2, map.hay.count + 2));
  
  
  
  
  
  
  
  const budget = want * 60;
  for (let n = 0; n < budget && stacks.length < want; n++) {
    const courses = hayCourses(rng);
    const hx = rng.rangeI(half + 3, WORLD_SIZE.x - half - 4);
    const hz = rng.rangeI(half + 3, WORLD_SIZE.z - half - 4);
    
    
    
    if (insideBase(hx - half, hz - half, redBase)  || insideBase(hx + half, hz + half, redBase)
     || insideBase(hx - half, hz + half, redBase)  || insideBase(hx + half, hz - half, redBase)
     || insideBase(hx - half, hz - half, blueBase) || insideBase(hx + half, hz + half, blueBase)
     || insideBase(hx - half, hz + half, blueBase) || insideBase(hx + half, hz - half, blueBase)) continue;
    if (insideZone(hx, hz, powerUpZones, half)) continue;
    if (Math.abs(hx - cx) < 4 + half && Math.abs(hz - cz) < 4 + half) continue;
    
    
    
    if (keepClear.some((k) => Math.abs(hx - k.x) <= half + 2 && Math.abs(hz - k.z) <= half + 2)) continue;
    const y = hayFootingAt(grid, hx, hz, courses);
    if (y < 0) continue;
    buildHayStack(grid, hx, hz, y, courses);
    
    
    
    
    
    stacks.push({ x: hx, z: hz, y, courses, top: y + courses, span });
  }
  return stacks;
}
