














































import { VOX } from '../voxel/voxelGrid.js';















export const SURFACE_GRIP = Object.freeze({
  
  
  
  
  
  
  
  
  
  [VOX.TRODDEN]: 0.978,
  [VOX.TRODDEN_B]: 0.978,
  [VOX.RUT]: 0.974,        
  [VOX.PAVER]: 0.978,      
  [VOX.TRACK]: 0.978,      

  
  
  [VOX.GRASS]: 1,

  
  
  [VOX.ICE]: 1.012,
  [VOX.RINK]: 1.016,       
});


export const MAX_FRICTION = 0.995;

export const MIN_FRICTION = 0.90;









export function frictionOn(baseFriction, vox) {
  const mul = SURFACE_GRIP[vox];
  const f = baseFriction * (mul === undefined ? 1 : mul);
  return Math.max(MIN_FRICTION, Math.min(MAX_FRICTION, f));
}











export function surfaceUnder(grid, x, y, z, maxDrop = 6) {
  if (!grid || typeof grid.get !== 'function') return null;
  const gx = Math.floor(x);
  const gz = Math.floor(z);
  const gy = Math.floor(y);
  for (let d = 0; d <= maxDrop; d += 1) {
    const v = grid.get(gx, gy - d, gz);
    if (v) return v;
  }
  return null;
}


































export const LANE_SURFACE = Object.freeze({
  'snow-farm': VOX.TRACK,
  'icy-mountain': VOX.TRACK,
  'central-park-rink': VOX.PAVER,
  arctic: VOX.TRACK,
  'farm-maze': null,
});

export function laneSurfaceFor(mapId) {
  return LANE_SURFACE[mapId] ?? null;
}









export const ROAD_HALF = 3.5;
