














export const LEAN_DEG = 15;
export const LEAN_CELLS = 2;
export const ROLL_CELLS = 3; 
export const ROLL_DEG = 90;


export function turnAngle(u) {
  if (!(u > -LEAN_CELLS)) return 0;
  if (u < 0) {
    const x = (u + LEAN_CELLS) / LEAN_CELLS;
    return LEAN_DEG * x * x; 
  }
  if (u >= ROLL_CELLS) return ROLL_DEG;
  
  const x = u / ROLL_CELLS;
  const m0 = (2 * LEAN_DEG / LEAN_CELLS) * ROLL_CELLS;
  const x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * LEAN_DEG + (x3 - 2 * x2 + x) * m0 + (-2 * x3 + 3 * x2) * ROLL_DEG;
}






export const preCrossU = (dist) => 1 - dist;






export const postCrossU = (ticks, alpha) => 1 + ticks + alpha;


export const residualAngle = (ticks, alpha) => turnAngle(postCrossU(ticks, alpha)) - ROLL_DEG;
