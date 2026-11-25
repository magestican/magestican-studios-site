















const FLOOR = 1.4; 
const NARROW = 0.9; 
const DECK = 0.9; 
const ARM = 0.95; 
const OVER = 1.0; 
const CHICANE = 1.1;


const CX = 21;
const ARM_A = -7.6;
const TABLE = -5.72; 
const ARM_B = -3.8;

import { skittles, canPair, spill, padRow } from './loose.js';

export const H2 = Object.freeze({
  id: 'H2',
  name: 'Lounge Loop',
  blurb: 'Race a toy RC car round a giant lounge, behind the sofas and over the coffee table.', 
  world: 'house',
  laps: 3,
  
  
  parLap: 21,
  control: Object.freeze([
    
    { x: 0, z: 0, width: FLOOR, surface: 'floorboards' },
    { x: 0, z: -5, width: FLOOR, surface: 'floorboards' },
    
    { x: 0.5, z: -8, width: FLOOR, surface: 'rug' },
    { x: 0.5, z: -11, width: FLOOR, surface: 'rug' },
    { x: 2.2, z: -14.1, width: FLOOR, surface: 'rug' },
    { x: 4.8, z: -15.5, width: FLOOR, surface: 'rug' },
    { x: 7.2, z: -16.2, width: 1.1, surface: 'floorboards' },
    
    { x: 9, z: -16.9, width: NARROW, surface: 'floorboards' },
    { x: 12, z: -16.9, width: NARROW, surface: 'floorboards' },
    { x: 15, z: -16.9, width: NARROW, surface: 'floorboards' },
    { x: 17, z: -16.8, width: 1.0, surface: 'floorboards' },
    { x: 19, z: -16.2, width: 1.0, surface: 'floorboards' },
    { x: 20.6, z: -14.6, width: 1.0, surface: 'floorboards' },
    { x: 21, z: -12.6, width: 1.0, surface: 'floorboards' },
    
    { x: CX, z: -11.3, y: 0.0, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: -9.9, y: 0.3, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: -8.7, y: 0.68, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: ARM_A, y: ARM, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: -6.8, y: OVER, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: -6.0, y: OVER, width: DECK, surface: 'connector', connector: true, gap: true },
    { x: CX, z: -5.45, y: OVER, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: -4.7, y: OVER, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: ARM_B, y: ARM, width: DECK, surface: 'connector', connector: true },
    { x: CX, z: -2.8, y: 0.68, width: DECK, surface: 'connector', connector: true },
    { x: 20.6, z: -1.7, y: 0.36, width: DECK, surface: 'connector', connector: true },
    { x: 19.8, z: -0.8, y: 0.08, width: DECK, surface: 'connector', connector: true },
    
    { x: 18.2, z: -0.1, width: FLOOR, surface: 'floorboards' },
    { x: 15, z: 0.7, width: FLOOR, surface: 'floorboards' },
    { x: 11, z: 1.1, width: FLOOR, surface: 'floorboards' },
    { x: 7.5, z: 1.2, width: FLOOR, surface: 'floorboards' },
    
    { x: 5.5, z: 1.1, width: CHICANE, surface: 'floorboards' },
    { x: 4.0, z: 0.35, width: CHICANE, surface: 'floorboards' },
    { x: 2.6, z: 0.8, width: CHICANE, surface: 'floorboards' },
    { x: 1.2, z: 1.9, width: CHICANE, surface: 'floorboards' },
  ]),
  
  basinY: 0.42,
  
  room: Object.freeze({ x0: -2.6, x1: 22.8, z0: -17.8, z1: 2.9, floor: 'boards' }),
  
  rugs: Object.freeze([{ x0: -1.1, x1: 6.3, z0: -16.5, z1: -6.9, color: 0x9c3b3b, border: 0xe0b45a }]),
  
  platforms: Object.freeze([]),
  
  
  
  pads: Object.freeze([...padRow(0.24, [-0.22, 0.22]), ...padRow(0.92)]),
  
  
  events: Object.freeze([]),
  loose: Object.freeze([
    ...skittles(0.12, -0.3),
    ...spill('marble', 0.36, 0),
    ...canPair(0.70, 0.25),
    ...spill('toy_block', 0.85, -0.25, 2),
  ]),
  props: Object.freeze([
    
    { model: 'sofa', x: 10.5, z: -15.9, rot: -Math.PI / 2 },
    { model: 'sofa', x: 12.5, z: -15.9, rot: -Math.PI / 2 },
    { model: 'sofa', x: 14.5, z: -15.9, rot: -Math.PI / 2 },
    
    { model: 'armchair', x: CX, z: ARM_A, rot: -Math.PI / 2, support: 0.45 },
    { model: 'coffee_table', x: CX, z: TABLE, rot: Math.PI / 2, support: 0.42 },
    { model: 'armchair', x: CX, z: ARM_B, rot: Math.PI / 2, support: 0.45 },
    { model: 'mug', x: CX + 0.15, z: TABLE + 0.2, y: 0.42, rot: 0.6 },
    { model: 'book_stack', x: CX - 0.12, z: TABLE - 0.3, y: 0.42, rot: 0.2 },
    { model: 'floor_lamp', x: 22.35, z: TABLE }, 
    
    { model: 'bookshelf', x: 9, z: 2.6, rot: Math.PI / 2 },
    { model: 'bookshelf', x: 11, z: 2.6, rot: Math.PI / 2 },
    { model: 'bookshelf', x: 13, z: 2.6, rot: Math.PI / 2 },
    { model: 'bookshelf', x: 15, z: 2.6, rot: Math.PI / 2 },
    { model: 'book_stack', x: 10, z: 0.2, rot: 0.1 },
    { model: 'book_stack', x: 12.5, z: 0.1, rot: -0.2 },
    { model: 'book_stack', x: 14.5, z: -0.15, rot: 0.3 },
    { model: 'plant_pot', x: 17.8, z: 2.4 },
    
    { model: 'cat_bed', x: 3.6, z: 1.65 },
    
    { model: 'marble', x: 2.1, z: -9.5 },
    { model: 'marble', x: 3.6, z: -12.6 },
    { model: 'marble', x: 5.6, z: -13.8 },
    { model: 'toy_block', x: 3.4, z: -7.8, rot: 0.4 },
    { model: 'toy_block', x: 3.45, z: -7.75, y: 0.048, rot: 1.0 },
    { model: 'floor_lamp', x: -1.6, z: -3 },
    { model: 'armchair', x: -1.7, z: -6.2, rot: 0 },
    { model: 'plant_pot', x: -1.9, z: -17.1 },
    { model: 'pencil', x: 6.5, z: -1.8, rot: 0.7 },
  ]),
});
