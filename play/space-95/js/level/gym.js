


import { TILE } from '../sim/constants.js';
import { gridWorld } from '../sim/world.js';

const W = 412;
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
  
  { id: 11, col: 266, label: 'Double jump: 8 u gap', proves: 'the second press adds ~2 u', bot: false },
  { id: 12, col: 296, label: 'Dash: 6 u gap', proves: 'jump + dash (Shift) carries the gap', bot: false },
  { id: 13, col: 322, label: 'Wall chimney', proves: 'wall slide + wall jump up a 2 u shaft', bot: false },
  { id: 14, col: 350, label: 'Bark climb', proves: 'hold up on the purple bark', bot: false },
  { id: 15, col: 362, label: 'Dew bounce', proves: 'land on the lens: higher than you aimed', bot: false },
  { id: 16, col: 378, label: 'Pound the soil', proves: 'down in the air digs 1 u per pound', bot: false },
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
  floor(238, 275); 
  floor(291, 305); 
  floor(317, 412); 
  
  
  
  b.fill(326, 328, FLOOR + 3, FLOOR + 14);
  b.fill(332, 334, FLOOR + 3, FLOOR + 12);
  b.fill(334, 344, FLOOR + 11, FLOOR + 12, '='); 
  b.fill(352, 354, FLOOR, FLOOR + 10, '|'); 
  b.fill(354, 360, FLOOR + 9, FLOOR + 10, '=');
  b.fill(368, 376, FLOOR + 9, FLOOR + 10, '='); 
  b.fill(380, 390, 2, FLOOR + 4, '%'); 
  b.fill(W - 2, W, FLOOR, H); 
  const world = gridWorld(b.rows());
  const spawn = { x: 2 * TILE + TILE / 2, y: FLOOR * TILE };
  const checkpoints = CHALLENGES.map((c) => ({ id: c.id, x: (c.col + 0.5) * TILE, y: groundY(world, c.col) }));
  const entities = [{ id: 'gym-dew-1', kind: 'dew', x: 365 * TILE, y: FLOOR * TILE }];
  return { world, spawn, checkpoints, entities, finishX: 404 * TILE };
}


function groundY(world, c) {
  for (let r = world.height - 1; r >= 0; r--) if (world.solid(c, r) || world.oneWay(c, r)) return (r + 1) * TILE;
  return FLOOR * TILE;
}
