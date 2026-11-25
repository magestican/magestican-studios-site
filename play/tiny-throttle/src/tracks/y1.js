



















const DECKW = 1.4; 
const CONN = 0.9; 
const TURN = 0.9; 
const SIDE = 1.45; 
const OVER = 1.7; 


const PX = 8;
const PZ = -6;
const SIDE_Z = -3.1; 


import { skittles, spill } from './loose.js';

export const Y1 = Object.freeze({
  id: 'Y1',
  name: 'Deep End Dash',
  blurb: 'Race a toy RC car round a giant garden pool, along its edge and right over the water.', 
  world: 'yard',
  laps: 3,
  
  
  lineMargin: 0.6,
  
  parLap: 19,
  control: Object.freeze([
    
    { x: -11, z: SIDE_Z, width: DECKW, surface: 'deck' },
    { x: -7, z: SIDE_Z, width: DECKW, surface: 'deck' },
    { x: -3.6, z: SIDE_Z, width: DECKW, surface: 'deck' },
    
    { x: -2.4, z: SIDE_Z, y: 0.0, width: CONN, surface: 'connector', connector: true },
    { x: -0.4, z: SIDE_Z, y: 0.42, width: CONN, surface: 'connector', connector: true },
    { x: 1.6, z: SIDE_Z, y: 0.9, width: CONN, surface: 'connector', connector: true },
    { x: 3.4, z: SIDE_Z, y: SIDE, width: CONN, surface: 'connector', connector: true },
    { x: 6, z: SIDE_Z, y: SIDE, width: CONN, surface: 'connector', connector: true },
    { x: 9, z: SIDE_Z, y: SIDE, width: CONN, surface: 'connector', connector: true },
    { x: 11.6, z: SIDE_Z - 0.05, y: SIDE, width: CONN, surface: 'connector', connector: true },
    
    
    
    
    
    { x: 13.8, z: -3.3, y: 1.5, width: TURN, surface: 'connector', connector: true },
    { x: 15.6, z: -4.3, y: 1.55, width: TURN, surface: 'connector', connector: true },
    { x: 16.5, z: -6.2, y: 1.6, width: TURN, surface: 'connector', connector: true },
    { x: 15.9, z: -8.3, y: 1.65, width: TURN, surface: 'connector', connector: true },
    { x: 14.2, z: -9.5, y: OVER, width: TURN, surface: 'connector', connector: true },
    
    { x: 12, z: -9.3, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: 9, z: -8.2, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: 6, z: -7.1, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: 4, z: -6.6, y: OVER, width: CONN, surface: 'connector', connector: true },
    
    { x: 2.2, z: -6.45, y: 1.3, width: CONN, surface: 'connector', connector: true },
    { x: 0.3, z: -6.45, y: 0.8, width: CONN, surface: 'connector', connector: true },
    { x: -1.6, z: -6.5, y: 0.3, width: CONN, surface: 'connector', connector: true },
    { x: -3.0, z: -6.6, y: 0.0, width: CONN, surface: 'connector', connector: true },
    
    { x: -4.6, z: -7.5, width: DECKW, surface: 'lawn' },
    { x: -7, z: -8.4, width: DECKW, surface: 'lawn' },
    { x: -10, z: -8.6, width: DECKW, surface: 'lawn' },
    { x: -12.8, z: -7.6, width: DECKW, surface: 'lawn' },
    { x: -14.2, z: -5.6, width: DECKW, surface: 'lawn' },
    { x: -13.6, z: -3.8, width: DECKW, surface: 'lawn' },
  ]),
  basinY: 0, 
  
  room: Object.freeze({ x0: -17, x1: 18, z0: -12, z1: 1.5, floor: 'lawn', walls: ['z1'], sky: 0xbfe3f5 }),
  
  rugs: Object.freeze([{ x0: -15.5, x1: 3.2, z0: -4.4, z1: -1.4, color: 0xa8774a, border: 0x86592f, boards: true }]),
  
  platforms: Object.freeze([{ x0: PX - 4, x1: PX + 4, z0: PZ - 2, z1: PZ + 2, y: OVER }]),
  
  
  loose: Object.freeze([
    
    { model: 'soda_can_red', u: 0.2, side: 0.2 },
    ...spill('marble', 0.45, 0, 2),
    ...skittles(0.74, -0.3),
    ...spill('toy_block', 0.88, 0.25, 2),
  ]),
  props: Object.freeze([
    
    { model: 'pool', x: PX, z: PZ },
    { model: 'pool_ladder', x: PX - 4.25, z: PZ + 0.9, rot: Math.PI },
    { model: 'pool_ring', x: 7.5, z: -7.0, y: 1.05 }, 
    { model: 'ball', x: PX - 2.2, z: PZ + 0.6, y: 1.08 },
    
    { model: 'watering_can', x: -6, z: -0.9, rot: 0.6 },
    { model: 'sprinkler', x: -9.5, z: -5.6 },
    { model: 'hose_coil', x: -8, z: -6.1, rot: 0.3 },
    
    { model: 'flower_bed', x: -10, z: -10.1, rot: Math.PI / 2 },
    { model: 'flower_bed', x: -7, z: -10.0, rot: Math.PI / 2 },
    { model: 'flower_bed', x: -16.0, z: -5.4 },
    { model: 'hedge', x: -3.5, z: -11.2, rot: Math.PI / 2 },
    { model: 'hedge', x: 0.5, z: -11.2, rot: Math.PI / 2 },
    { model: 'hedge', x: 4.5, z: -11.2, rot: Math.PI / 2 },
    
    { model: 'fence_panel', x: 9, z: -11.8, rot: Math.PI / 2 },
    { model: 'fence_panel', x: 10.9, z: -11.8, rot: Math.PI / 2 },
    { model: 'fence_panel', x: 12.8, z: -11.8, rot: Math.PI / 2 },
    { model: 'fence_panel', x: 14.7, z: -11.8, rot: Math.PI / 2 },
    { model: 'fence_panel', x: 17.9, z: -9.9 },
    { model: 'fence_panel', x: 17.9, z: -8.0 },
    { model: 'fence_panel', x: 17.9, z: -6.1 },
    { model: 'fence_panel', x: 17.9, z: -4.2 },
    { model: 'fence_panel', x: 17.9, z: -2.3 },
    { model: 'ball', x: 16, z: -9.5 },
    { model: 'bucket', x: 15.6, z: -1.2 },
  ]),
});
