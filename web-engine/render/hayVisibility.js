




import { hasVisionLine } from '../physics/lineOfSight.js';
import { EYE_TARGET } from '../ai/targetAcquisition.js';

export function hayOpacityFor(insideHay) {
  return insideHay ? 0.04 : 0.72;
}




















export function isBodyConcealedFrom(grid, eye, bodyFeet) {
  if (!grid || !eye || !bodyFeet) return false;   
  return !hasVisionLine(
    grid,
    { x: eye.x, y: eye.y, z: eye.z },
    { x: bodyFeet.x, y: bodyFeet.y + EYE_TARGET, z: bodyFeet.z },
  );
}
