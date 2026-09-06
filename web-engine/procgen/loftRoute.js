


































































import { chokePoints } from './laneSpec.js';
import { JUMP } from '../movement/jump.js';



















export const FREE_RISE = (JUMP.speed ** 2) / (2 * -JUMP.gravity)
                       + ((JUMP.speed * JUMP.airSpeedFactor) ** 2) / (2 * -JUMP.gravity);


export const FREE_HOP_VOX = Math.floor(FREE_RISE);











export const PERCH_REACH = 6;









export const DECK_TOP = 2;










export const PERCH_TOP = 6;


export const DECK_HALF = 1;
export const PERCH_HALF = 1;

















export const PERCH_CAP_HALF = 2;









export const DECK_ALONG = 10;








export const DECK_OFFSET = 5;









export const PERCH_OFFSET = 16;










export function loftSites(lanes) {
  const out = [];
  for (const choke of chokePoints(lanes || [])) {
    
    
    
    const ax = choke.hx, az = choke.hz;
    const px = -choke.hz, pz = choke.hx;
    for (const side of [-1, 1]) {
      for (const along of [-DECK_ALONG, DECK_ALONG]) {
        out.push({
          x: choke.x + ax * along + px * DECK_OFFSET * side,
          z: choke.z + az * along + pz * DECK_OFFSET * side,
          kind: 'deck',
          laneId: choke.laneId,
          side: side > 0 ? 'left' : 'right',
        });
      }
      out.push({
        x: choke.x + px * PERCH_OFFSET * side,
        z: choke.z + pz * PERCH_OFFSET * side,
        
        
        dx: px * side,
        dz: pz * side,
        kind: 'perch',
        laneId: choke.laneId,
        side: side > 0 ? 'left' : 'right',
      });
    }
  }
  return out;
}















export const PERCH_OFFSET_MAX = 26;


export const PERCH_OFFSET_STEP = 2;


export function topFor(kind) {
  return kind === 'perch' ? PERCH_TOP : DECK_TOP;
}



















export function placeLofts(lanes, {
  surfaceAt, worldHeight, worldSize, blocked = () => false,
}) {
  const out = [];
  
  
  
  
  const inWorld = (x, z, pad) => x >= 1 + pad && z >= 1 + pad
    && x < worldSize.x - 1 - pad && z < worldSize.z - 1 - pad;
  for (const site of loftSites(lanes)) {
    const half = halfFor(site.kind);
    if (site.kind === 'deck') {
      const x = Math.round(site.x), z = Math.round(site.z);
      if (!inWorld(x, z, half) || blocked(x, z)) continue;
      out.push({ ...site, x, z, top: DECK_TOP, half });
      continue;
    }
    
    const cx = site.x - site.dx * PERCH_OFFSET;
    const cz = site.z - site.dz * PERCH_OFFSET;
    for (let off = PERCH_OFFSET; off <= PERCH_OFFSET_MAX; off += PERCH_OFFSET_STEP) {
      const x = Math.round(cx + site.dx * off);
      const z = Math.round(cz + site.dz * off);
      if (!inWorld(x, z, PERCH_CAP_HALF) || blocked(x, z)) continue;
      
      
      const scan = PERCH_REACH + PERCH_CAP_HALF;
      let hi = 0;
      for (let dx = -scan; dx <= scan; dx += 1) {
        for (let dz = -scan; dz <= scan; dz += 1) {
          const s = surfaceAt(x + dx, z + dz);
          if (Number.isFinite(s) && s > hi) hi = s;
        }
      }
      
      
      
      
      
      
      
      
      
      
      
      const top = perchTopFor(hi);
      if (!perchFits(top, worldHeight)) continue;
      out.push({ ...site, x, z, top, half });
      break;
    }
  }
  return out;
}



















export function perchTopFor(maxNeighbourSurface) {
  if (!Number.isFinite(maxNeighbourSurface)) return PERCH_TOP;
  return Math.max(PERCH_TOP, maxNeighbourSurface + FREE_HOP_VOX);
}










export function perchFits(top, worldHeight) {
  return top + 3 < worldHeight;
}


export function halfFor(kind) {
  return kind === 'perch' ? PERCH_HALF : DECK_HALF;
}
