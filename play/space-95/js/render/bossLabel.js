

const GAP = 0.25; 
const HALF_HEIGHT = (72 * 0.011) / 2; 





export function bossLabelPosition(top) {
  return { x: 0, y: top + GAP + HALF_HEIGHT };
}
