


import { TILE } from '../sim/constants.js';
import { gridWorld } from '../sim/world.js';

const W = 260;
const H = 32;
const FLOOR = 4; 

function builder() {
  const g = Array.from({ length: H }, () => new Array(W).fill('.'));
  
  const fill = (c0, c1, r0, r1, ch = '#') => {
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) g[r][c] = ch;
  };
  const rows = () => g.map((row) => row.join('')).reverse();
  return { fill, rows };
}


export const CHALLENGES = [
  { id: 1, col: 4, label: 'Hop: 2 u gap', proves: 'tap jump clears a small gap' },
  { id: 2, col: 30, label: 'Gap: 4 u', proves: 'a medium jump with run speed' },
  { id: 3, col: 50, label: 'Long gap: 5 u', proves: 'full hold + hold carry' },
  { id: 4, col: 71, label: 'Step: 1.5 u', proves: 'variable height (more than a tap)' },
  { id: 5, col: 84, label: 'Tall step: 3 u', proves: 'full-hold apex height' },
  { id: 6, col: 102, label: 'Ledge assist: come in short', proves: 'feet up to 0.25 u under a lip still mantle' },
  { id: 7, col: 124, label: 'Ceiling corner', proves: 'corner correction slides the head around' },
  { id: 8, col: 146, label: 'Coyote: 6.5 u', proves: 'a late jump off the edge still fires' },
  { id: 9, col: 170, label: 'One-way stack', proves: 'jump up through, land on top' },
  { id: 10, col: 188, label: 'Buffer islands', proves: 'early presses fire on landing' },
];

export function gymWorld() {
  const b = builder();
  const floor = (c0, c1) => b.fill(c0, c1, 0, FLOOR);
  floor(0, 20); 
  floor(24, 40); 
  floor(48, 60); 
  floor(70, 82);
  b.fill(76, 82, FLOOR, FLOOR + 3); 
  floor(82, 100);
  b.fill(90, 100, FLOOR, FLOOR + 6); 
  floor(100, 122);
  
  b.fill(100, 106, FLOOR, FLOOR + 9);
  b.fill(112, 122, FLOOR, FLOOR + 7);
  floor(122, 142);
  b.fill(131, 136, FLOOR + 6, FLOOR + 7); 
  floor(142, 154); 
  floor(167, 192);
  b.fill(176, 180, FLOOR + 3, FLOOR + 4, '='); 
  b.fill(180, 184, FLOOR + 6, FLOOR + 7, '=');
  b.fill(176, 180, FLOOR + 9, FLOOR + 10, '=');
  b.fill(184, 192, FLOOR, FLOOR + 9); 
  
  for (let c = 196, i = 0; i < 6; i++, c += 7) b.fill(c, c + 2, 0, FLOOR - 2);
  floor(238, W); 
  b.fill(W - 2, W, FLOOR, H); 
  const world = gridWorld(b.rows());
  const spawn = { x: 2 * TILE + TILE / 2, y: FLOOR * TILE };
  const checkpoints = CHALLENGES.map((c) => ({ id: c.id, x: (c.col + 0.5) * TILE, y: groundY(world, c.col) }));
  return { world, spawn, checkpoints, finishX: 240 * TILE };
}


function groundY(world, c) {
  for (let r = world.height - 1; r >= 0; r--) if (world.solid(c, r) || world.oneWay(c, r)) return (r + 1) * TILE;
  return FLOOR * TILE;
}
