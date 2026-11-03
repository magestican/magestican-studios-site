
const MARGIN = 0.2; 
const SLACK = 1.5; 
const HUD_RESERVE_PX = 88; 








export function labelShift(centre, half, viewHalf, margin) {
  if (Math.abs(centre) > viewHalf) return Math.sign(centre) * (viewHalf + half + margin) - centre;
  const room = viewHalf - margin - half;
  if (room <= 0) return -centre;
  return Math.max(-room, Math.min(room, centre)) - centre;
}







export function labelDrop(centre, half, top, bottom) {
  if (centre > top + SLACK || centre < bottom - SLACK) return 0;
  return Math.max(bottom + half, Math.min(top - half, centre)) - centre;
}








export function clampLabelToView(renderer, _scene, camera) {
  const m = this.matrixWorld.elements;
  const inv = camera.matrixWorldInverse.elements;
  const viewX = inv[0] * m[12] + inv[4] * m[13] + inv[8] * m[14] + inv[12];
  const viewY = inv[1] * m[12] + inv[5] * m[13] + inv[9] * m[14] + inv[13];
  const depth = -(inv[2] * m[12] + inv[6] * m[13] + inv[10] * m[14] + inv[14]);
  if (depth <= 0) return;
  const halfY = Math.tan((camera.fov * Math.PI) / 360) * depth;
  const reserve = (HUD_RESERVE_PX * 2 * halfY) / (renderer.domElement.clientHeight || 1);
  const dx = labelShift(viewX, this.scale.x / 2, halfY * camera.aspect, MARGIN);
  const dy = labelDrop(viewY, this.scale.y / 2, halfY - reserve, -halfY + MARGIN);
  
  const axes = camera.matrixWorld.elements;
  m[12] += dx * axes[0] + dy * axes[4];
  m[13] += dx * axes[1] + dy * axes[5];
  m[14] += dx * axes[2] + dy * axes[6];
}
