




const PAD = 0.04; 
const FADE = 0.25; 







export function boxesTouch(a, b) {
  return Math.abs(a.x - b.x) < a.hw + b.hw + PAD && Math.abs(a.y - b.y) < a.hh + b.hh + PAD;
}





export function yieldOpacity(current, blocked) {
  return blocked ? Math.max(0, current - FADE) : Math.min(1, current + FADE);
}






export function mustYield(box, names, frame) {
  for (const n of names) {
    const { box: nb, frame: f } = n.userData;
    if (!n.parent || !nb || f === undefined || frame - f > 1) continue;
    if (boxesTouch(box, nb)) return true;
  }
  return false;
}
