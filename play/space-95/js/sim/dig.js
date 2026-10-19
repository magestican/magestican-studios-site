



const DIG_W = 2; 
const DIG_D = 2; 


export function stepDig(s) {
  const p = s.player;
  if (!s.world.mutable || !p.events.some((e) => e.type === 'pound')) return;
  const T = s.world.tile;
  const cMid = Math.round(p.x / T);
  const rTop = Math.round(p.y / T) - 1;
  const broken = [];
  for (let r = rTop; r > rTop - DIG_D; r--) {
    for (let c = cMid - DIG_W / 2; c < cMid + DIG_W / 2; c++) if (s.world.breakSoil(c, r)) broken.push([c, r]);
  }
  if (!broken.length) return;
  p.grounded = false; 
  s.events.push({ type: 'dig', cells: broken, x: cMid * T, y: (rTop + 1) * T });
}
