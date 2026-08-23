




































export const SINK_TOLERANCE = 0.35;




export const RESCUE_CLEARANCE = 0.05;


















export const FALL_DEATH_Y = -20;      

































export function groundTopOrVoid(onMap, probedTop) {
  return onMap ? probedTop : NaN;
}






export function columnOnMap(grid, x, z) {
  if (!grid?.inBounds) return true;      
  return grid.inBounds(Math.floor(x), 0, Math.floor(z));
}







export function checkFloor({ centreY, capsuleTotal, groundTop }, {
  sinkTolerance = SINK_TOLERANCE,
  clearance = RESCUE_CLEARANCE,
} = {}) {
  if (!Number.isFinite(centreY) || !Number.isFinite(capsuleTotal)) return null;

  const half = capsuleTotal / 2;
  const feet = centreY - half;

  
  
  if (!Number.isFinite(groundTop)) return null;

  
  
  
  if (centreY - half > groundTop) return null;

  
  
  
  if (groundTop - feet > sinkTolerance) {
    return { y: groundTop + half + clearance, reason: 'sunk' };
  }
  return null;
}







export function safeCentreOnGround(groundTop, capsuleTotal, clearance = RESCUE_CLEARANCE) {
  return groundTop + capsuleTotal / 2 + clearance;
}




export function clampAboveFloor(proposedY, capsuleTotal, groundTop, clearance = RESCUE_CLEARANCE) {
  if (!Number.isFinite(groundTop) || !Number.isFinite(proposedY)) return proposedY;
  const lowest = safeCentreOnGround(groundTop, capsuleTotal, clearance);
  return proposedY < lowest ? lowest : proposedY;
}
