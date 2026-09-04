






























const same = (trail) => trail;














export function extendTrail(trail, index, { adjacent, onBreak = 'ignore' } = {}) {
  if (!Array.isArray(trail) || trail.length === 0) return [index];

  const last = trail[trail.length - 1];
  if (index === last) return same(trail);

  
  if (trail.length >= 2 && index === trail[trail.length - 2]) return trail.slice(0, -1);

  
  
  if (trail.includes(index)) return same(trail);

  if (!adjacent) return onBreak === 'restart' ? [index] : same(trail);

  return [...trail, index];
}






export const tapTrail = (trail, index, adjacent) => extendTrail(trail, index, { adjacent, onBreak: 'restart' });








export function trailPoints(trail, centreOfCell) {
  return trail.map((i) => centreOfCell(i));
}













export function pulseFront(trail, progress) {
  const p = Math.max(0, Math.min(1, progress));
  return p * trail.length;
}












export const DRAG_SLOP = 8;

export function isDrag(from, to, slop = DRAG_SLOP) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return dx * dx + dy * dy > slop * slop;
}
