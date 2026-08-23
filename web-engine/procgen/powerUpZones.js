









































import { VOX } from '../voxel/voxelGrid.js';

export const ZONE_HALF = 4;          
export const ZONE_DECK_TOP = 3;      



export const ZONE_INSET = 0.115;



export function powerZoneCentres(size) {
  const inset = Math.round(size.x * ZONE_INSET);
  return {
    gym:   { x: size.x - 1 - inset, z: inset },
    dairy: { x: inset,              z: size.z - 1 - inset },
  };
}






export function insideZone(x, z, zones, margin = 0) {
  if (!zones) return false;
  const r = ZONE_HALF + margin;
  for (const zn of Object.values(zones)) {
    if (Math.abs(x - zn.x) <= r && Math.abs(z - zn.z) <= r) return true;
  }
  return false;
}




export function zoneSpawn(zone) {
  return { x: zone.x + 0.5, y: ZONE_DECK_TOP + 0.5, z: zone.z + 0.5 };
}

export function buildPowerZones(grid, size) {
  const c = powerZoneCentres(size);
  const gym   = { id: 'gym',   powerUp: 'protein-shake', name: 'THE GYM',   ...c.gym };
  const dairy = { id: 'dairy', powerUp: 'cheese-wheel',  name: 'THE DAIRY', ...c.dairy };
  buildGym(grid, gym.x, gym.z, size);
  buildDairy(grid, dairy.x, dairy.z, size);
  return { gym, dairy };
}



function buildDais(grid, x, z, vox, size) {
  
  
  
  grid.fillBox(x - ZONE_HALF, 1, z - ZONE_HALF,
               x + ZONE_HALF, size.y - 1, z + ZONE_HALF, VOX.AIR);
  grid.fillBox(x - 3, 1, z - 3, x + 3, 1, z + 3, vox);
  grid.fillBox(x - 2, 2, z - 2, x + 2, 2, z + 2, vox);
}





function buildGym(grid, x, z, size) {
  buildDais(grid, x, z, VOX.WOOD, size);
  
  
  
  
  
  for (const rz of [z - 2, z + 2]) {
    for (let y = ZONE_DECK_TOP; y <= ZONE_DECK_TOP + 3; y++) grid.set(x - 2, y, rz, VOX.STONE);
  }
  for (let bz = z - 2; bz <= z + 2; bz++) grid.set(x - 2, ZONE_DECK_TOP + 3, bz, VOX.STONE);
  
  
  for (let bz = z - 1; bz <= z + 1; bz++) grid.set(x + 2, ZONE_DECK_TOP, bz, VOX.STONE);
  for (const pz of [z - 2, z + 2]) {
    grid.set(x + 2, ZONE_DECK_TOP,     pz, VOX.STONE);
    grid.set(x + 2, ZONE_DECK_TOP + 1, pz, VOX.STONE);
  }
}





function buildDairy(grid, x, z, size) {
  buildDais(grid, x, z, VOX.STONE, size);
  
  
  
  
  
  
  
  
  
  for (let d = -3; d <= 3; d++) {
    if (d === 0) continue;   
    for (const [wx, wz] of [[x + d, z - 3], [x + d, z + 3], [x - 3, z + d], [x + 3, z + d]]) {
      grid.set(wx, 2, wz, VOX.HAY);
    }
  }
  
  
  for (const cx2 of [x - 2, x + 2]) {
    for (const cz2 of [z - 2, z + 2]) {
      grid.set(cx2, ZONE_DECK_TOP,     cz2, VOX.HAY);
      grid.set(cx2, ZONE_DECK_TOP + 1, cz2, VOX.HAY);
    }
  }
}
