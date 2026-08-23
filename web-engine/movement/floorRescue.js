




































export const SINK_TOLERANCE = 0.35;




export const RESCUE_CLEARANCE = 0.05;




export const VOID_Y = -4;







export function checkFloor({ centreY, capsuleTotal, groundTop }, {
  sinkTolerance = SINK_TOLERANCE,
  clearance = RESCUE_CLEARANCE,
  voidY = VOID_Y,
} = {}) {
  if (!Number.isFinite(centreY) || !Number.isFinite(capsuleTotal)) return null;

  const half = capsuleTotal / 2;
  const feet = centreY - half;

  
  
  
  if (centreY < voidY) {
    const surface = Number.isFinite(groundTop) ? groundTop : 0;
    return { y: surface + half + clearance, reason: 'void' };
  }

  if (!Number.isFinite(groundTop)) return null;

  
  
  
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
