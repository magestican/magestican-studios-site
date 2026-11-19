














const FLOOR = 1.4; 
const COUNTER = 0.8; 
const DECK = 0.9; 
const TOP = 0.905; 

export const H1 = Object.freeze({
  id: 'H1',
  name: 'Countertop Canyon',
  world: 'house',
  laps: 4,
  parLap: 28,
  control: Object.freeze([
    
    { x: 0, z: 0, width: FLOOR, surface: 'tile' },
    { x: 0, z: -7, width: FLOOR, surface: 'tile' },
    { x: 0, z: -14, width: FLOOR, surface: 'tile' },
    { x: 1.8, z: -19, width: FLOOR, surface: 'tile' },
    { x: 5, z: -21.2, width: 1.1, surface: 'tile' },
    
    { x: 8, z: -21.8, y: 0.03, width: DECK, surface: 'floorboards' },
    { x: 10.5, z: -21.8, y: 0.48, width: DECK, surface: 'floorboards' },
    
    
    
    
    { x: 13, z: -21.8, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 16, z: -21.6, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 19, z: -22.0, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 22, z: -21.7, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 24.3, z: -21.7, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 25.5, z: -21.0, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 25.8, z: -19.6, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 25.8, z: -17, y: TOP, width: COUNTER, surface: 'tile' },
    { x: 25.8, z: -14, y: TOP, width: COUNTER, surface: 'tile' },
    
    
    
    { x: 25.6, z: -12, y: 1.15, width: DECK, surface: 'connector', connector: true },
    { x: 25.6, z: -10.1, y: 1.25, width: DECK, surface: 'connector', connector: true, gap: true },
    { x: 25.6, z: -9.55, y: 1.25, width: DECK, surface: 'connector', connector: true },
    { x: 25.6, z: -8, y: 1.15, width: DECK, surface: 'connector', connector: true },
    
    { x: 25.2, z: -5.5, y: 0.95, width: DECK, surface: 'connector', connector: true },
    { x: 23.5, z: -3.2, y: 0.75, width: DECK, surface: 'connector', connector: true },
    { x: 21, z: -2, y: 0.62, width: DECK, surface: 'connector', connector: true },
    { x: 18, z: -1.6, y: 0.52, width: DECK, surface: 'connector', connector: true },
    { x: 15, z: -2.2, y: 0.55, width: DECK, surface: 'connector', connector: true },
    { x: 12, z: -2.0, y: 0.3, width: DECK, surface: 'connector', connector: true },
    
    { x: 9.5, z: -1.2, y: 0.0, width: FLOOR, surface: 'tile' },
    { x: 6, z: 0.5, width: FLOOR, surface: 'tile' },
    { x: 3, z: 2.4, width: FLOOR, surface: 'tile' },
    { x: 0.8, z: 3.0, width: FLOOR, surface: 'tile' },
  ]),
  
  
  basinY: 0.72, 
  
  
  
  
  props: Object.freeze([
    ...counterRows(),
    { model: 'fridge', x: -1.35, z: -4, rot: 0 },
    
    
    
    { model: 'bookshelf', x: -1.25, z: -7.2, rot: 0 },
    { model: 'floor_lamp', x: -1.3, z: -9.0 },
    { model: 'armchair', x: -1.55, z: -10.9, rot: 0 },
    { model: 'cat_bed', x: -1.25, z: -12.6 },
    { model: 'bookshelf', x: -1.25, z: -15.0, rot: 0 },
    { model: 'book_stack', x: 1.1, z: -8.2, rot: 0.3 },
    { model: 'book_stack', x: 1.12, z: -8.18, y: 0.12, rot: -0.2 },
    { model: 'coffee_table', x: 1.75, z: -12.2, rot: Math.PI / 2 },
    { model: 'sofa', x: 3.0, z: -12.2, rot: Math.PI },
    { model: 'floor_lamp', x: 3.1, z: -14.6 },
    { model: 'cutting_board', x: 10.4, z: -21.8, lean: { fromY: 0.0, toY: TOP, run: 5.0 }, rot: 0 },
    { model: 'soda_can_red', x: 16.0, z: -22.2, y: TOP },
    { model: 'soda_can_green', x: 19.2, z: -21.45, y: TOP },
    { model: 'soda_can_blue', x: 22.3, z: -22.25, y: TOP },
    { model: 'jar', x: 14.4, z: -22.25, y: TOP },
    { model: 'toaster', x: 20.6, z: -22.25, y: TOP, rot: Math.PI / 2 },
    { model: 'cereal_box', x: 23.6, z: -21.25, y: TOP, rot: 0.3 },
    { model: 'mug', x: 26.15, z: -15.6, y: TOP },
    { model: 'dining_table', x: 18, z: -0.9, rot: 0 },
    { model: 'dining_chair', x: 21, z: -2, rot: Math.PI / 2, support: 0.45 },
    { model: 'dining_chair', x: 15, z: -2.2, rot: Math.PI / 2, support: 0.45 },
    { model: 'dining_chair', x: 18, z: 0.25, rot: -Math.PI / 2 },
    { model: 'plant_pot', x: -1.4, z: 4.2 },
    { model: 'toy_block', x: 3.0, z: -10.5, rot: 0.4 },
    { model: 'toy_block', x: 3.1, z: -10.42, y: 0.048, rot: 0.9 },
    { model: 'marble', x: 1.6, z: -6.2 },
    { model: 'pencil', x: 7.5, z: 2.4, rot: 1.1 },
  ]),
});


function counterRows() {
  const out = [];
  
  
  for (let x = 25.18 - 0.6; x > 12.5; x -= 1.2) {
    out.push({ model: 'counter_unit', x, z: -21.8 + 0.31, rot: -Math.PI / 2 });
    out.push({ model: 'counter_unit', x, z: -21.8 - 0.31, rot: Math.PI / 2 });
  }
  
  
  for (let z = -22.42 + 0.6; z < -4.6; z += 1.2) {
    const sink = Math.abs(z - -9.82) < 0.3;
    out.push({ model: sink ? 'sink' : 'counter_unit', x: 25.8 - 0.31, z, rot: Math.PI });
    out.push({ model: 'counter_unit', x: 25.8 + 0.31, z, rot: 0 });
  }
  return out;
}
