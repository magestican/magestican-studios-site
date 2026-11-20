























const LANE = 1.4; 
const CONN = 0.9; 
const OVER = 1.0; 
const TOP = 1.7; 


const PIT_Y = 0.18; 
const CROSS_X = -2;

const SLIDE_X = 5.5;
const SLIDE_Z = 2.6;

export const Y2 = Object.freeze({
  id: 'Y2',
  name: 'Sandpit Summit',
  blurb: 'Race a toy RC car round a giant playground, over the sandpit and up the slide.', 
  world: 'yard',
  laps: 3,
  
  
  lineMargin: 0.6,
  
  parLap: 23,
  control: Object.freeze([
    
    { x: 12, z: -1.6, width: LANE, surface: 'tile' },
    { x: 8, z: -1.6, width: LANE, surface: 'tile' },
    { x: 4, z: -1.8, width: LANE, surface: 'tile' },
    
    { x: 1, z: -2.4, width: LANE, surface: 'lawn' },
    { x: -3, z: -2.6, width: LANE, surface: 'lawn' },
    { x: -6, z: -2.6, width: LANE, surface: 'lawn' },
    { x: -8.5, z: -2.8, width: LANE, surface: 'lawn' },
    { x: -11, z: -3.7, width: LANE, surface: 'lawn' },
    { x: -12.3, z: -6.6, width: LANE, surface: 'lawn' },
    { x: -11.2, z: -9.3, width: LANE, surface: 'lawn' },
    
    
    { x: -9.6, z: -10.4, width: LANE, surface: 'lawn' },
    
    { x: -7.8, z: -10.4, y: 0.0, width: CONN, surface: 'connector', connector: true },
    { x: -5, z: -10.4, y: 0.65, width: CONN, surface: 'connector', connector: true },
    { x: -2.88, z: -9.52, y: 0.85, width: CONN, surface: 'connector', connector: true },
    { x: CROSS_X, z: -7.4, y: OVER, width: CONN, surface: 'connector', connector: true },
    
    { x: CROSS_X, z: -6.6, y: OVER, width: CONN, surface: 'connector', connector: true, gap: true },
    { x: CROSS_X, z: -6.0, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: CROSS_X, z: -4.6, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: CROSS_X, z: -2.6, y: OVER, width: CONN, surface: 'connector', connector: true },
    
    { x: CROSS_X, z: -0.4, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: -1.12, z: 1.72, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: 1, z: SLIDE_Z, y: OVER, width: CONN, surface: 'connector', connector: true },
    
    { x: 2.8, z: SLIDE_Z, y: OVER, width: CONN, surface: 'connector', connector: true },
    { x: 4.4, z: SLIDE_Z, y: 1.2, width: CONN, surface: 'connector', connector: true },
    { x: 5.8, z: SLIDE_Z, y: 1.45, width: CONN, surface: 'connector', connector: true },
    { x: 6.9, z: SLIDE_Z, y: TOP, width: CONN, surface: 'connector', connector: true },
    
    { x: 8.4, z: SLIDE_Z, y: 1.55, width: CONN, surface: 'connector', connector: true },
    { x: 10.2, z: 2.8, y: 1.1, width: CONN, surface: 'connector', connector: true },
    { x: 12, z: 3.2, y: 0.6, width: CONN, surface: 'connector', connector: true },
    { x: 13.4, z: 3.7, y: 0.2, width: CONN, surface: 'connector', connector: true },
    { x: 14.6, z: 4.2, y: 0.0, width: CONN, surface: 'connector', connector: true },
    
    { x: 16, z: 4.6, width: LANE, surface: 'sand' },
    { x: 17.6, z: 4.0, width: LANE, surface: 'sand' },
    { x: 18.5, z: 2.4, width: LANE, surface: 'lawn' },
    { x: 18.5, z: 0.5, width: LANE, surface: 'lawn' },
    { x: 18, z: -1.0, width: LANE, surface: 'lawn' },
    { x: 16.4, z: -1.7, width: LANE, surface: 'lawn' },
  ]),
  
  basinY: PIT_Y,
  
  room: Object.freeze({ x0: -15, x1: 21, z0: -13, z1: 7.5, floor: 'lawn', walls: ['z0'], sky: 0xbfe3f5 }),
  
  rugs: Object.freeze([
    { x0: 2.6, x1: 14.6, z0: -3.0, z1: -0.3, color: 0xb9b2a6, border: 0x8f887c },
    { x0: 13.4, x1: 18.6, z0: 3.0, z1: 6.0, color: 0xe2c98f, border: 0xc9ab6c },
  ]),
  
  
  platforms: Object.freeze([
    { x0: CROSS_X - 0.7, x1: CROSS_X + 0.7, z0: -3.7, z1: -1.5, y: OVER },
    { x0: -8, x1: 0, z0: -8, z1: -4, y: PIT_Y },
    { x0: SLIDE_X - 1.9, x1: SLIDE_X + 1.62, z0: SLIDE_Z - 0.6, z1: SLIDE_Z + 0.6, y: 5 },
  ]),
  props: Object.freeze([
    
    ...[-7, -5, -3, -1].flatMap((x) => [-7, -5].map((z) => ({ model: 'sandpit', x, z }))),
    { model: 'bucket', x: CROSS_X, z: -6.3, y: PIT_Y },
    { model: 'ball', x: -6.2, z: -5.4, y: PIT_Y },
    
    { model: 'slide', x: SLIDE_X, z: SLIDE_Z, rot: Math.PI },
    { model: 'swing_set', x: 18.5, z: 1.0, rot: Math.PI / 2, straddle: true },
    
    { model: 'sprinkler', x: 15.6, z: -3.6 },
    { model: 'hose_coil', x: 14.4, z: -3.8, rot: 0.4 },
    { model: 'watering_can', x: 9, z: 0.6, rot: 0.6 },
    { model: 'flower_bed', x: -13.6, z: -1.6 },
    { model: 'flower_bed', x: -14.2, z: -9.6 },
    { model: 'hedge', x: -10, z: -12.4, rot: Math.PI / 2 },
    { model: 'hedge', x: -6, z: -12.4, rot: Math.PI / 2 },
    { model: 'hedge', x: -2, z: -12.4, rot: Math.PI / 2 },
    
    ...[4, 5.9, 7.8, 9.7, 11.6, 13.5].map((x) => ({ model: 'fence_panel', x, z: 7.3, rot: Math.PI / 2 })),
    ...[-0.6, 1.3, 3.2, 5.1].map((z) => ({ model: 'fence_panel', x: 20.8, z })),
    { model: 'ball', x: 20.3, z: 5.6 },
    { model: 'bucket', x: 0.6, z: -0.6 },
  ]),
});
