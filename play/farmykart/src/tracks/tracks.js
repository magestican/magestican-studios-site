





























































































































































































export const TRACKS = [
  {
    id: 'sunflower',
    name: 'Sunflower Circuit',
    tagline: 'Wide, fast, and it goes over a volcano.',
    theme: 'summer',
    laps: 3,
    
    
    
    
    
    
    
    
    
    defaultWidth: 40,
    control: [
      
      
      
      
      
      { x: 0, z: 0, width: 40 },
      { x: 2.1, z: -41.7, width: 40 },
      { x: 17.8, z: -80.5, width: 40 },
      { x: 40.7, z: -109.4, width: 40 },
      { x: 55.2, z: -122, y: 0.4, width: 40 },
      { x: 70.9, z: -132.6, y: 5.3, width: 40 },     
      { x: 87.7, z: -141.5, y: 1.2, width: 40 },     
      { x: 105.4, z: -148.7, y: 0.4, width: 40 },
      { x: 123.6, z: -154.4, width: 40 },
      { x: 142, z: -158.8, width: 40 },
      { x: 160.5, z: -162.4, width: 40 },
      { x: 182.3, z: -166.2, width: 40 },
      
      { x: 218.3, z: -173.9, width: 39 },
      { x: 258.6, z: -185.3, y: 0.8, width: 38 },
      { x: 299.5, z: -194.9, y: 4.1, width: 37 },
      { x: 341.2, z: -197.9, y: 7.5, width: 35 },
      { x: 382.3, z: -190.9, y: 10.8, width: 35 },
      { x: 419.1, z: -171, y: 13.8, width: 34 },
      { x: 443.8, z: -137.6, y: 16.8, width: 33 },
      { x: 448.2, z: -96.5, y: 19.9, width: 32 },
      
      { x: 437.3, z: -64.1, y: 22.4, width: 29 },
      { x: 427, z: -47.7, y: 23.9, width: 28 },
      { x: 414.6, z: -32.8, y: 25.3, width: 26 },
      { x: 400.7, z: -19.5, y: 26.8, width: 25 },
      { x: 385.9, z: -7.4, y: 28.3, width: 25 },
      { x: 370.9, z: 4.2, y: 29.8, width: 24 },
      { x: 358.4, z: 18, y: 30.6, width: 24 },
      { x: 359.2, z: 36.1, y: 31.3, width: 25 },
      { x: 366.6, z: 53.5, y: 31.9, width: 25 },
      
      { x: 373.6, z: 71.3, y: 32.7, width: 26 },     
      { x: 378.3, z: 90, y: 27.6, width: 26 },
      { x: 379.7, z: 108.8, y: 16.4, width: 26 },
      { x: 377.3, z: 127.5, y: 6.5, width: 26 },
      
      { x: 370.7, z: 145.4, y: 2.9, width: 26 },
      { x: 360.5, z: 161.5, y: 2.7, width: 26 },
      { x: 347.3, z: 175.2, y: 2.4, width: 26 },
      { x: 331.9, z: 186.4, y: 2.2, width: 26 },
      { x: 314.9, z: 195.2, y: 2, width: 26 },
      
      { x: 296.8, z: 201.5, y: 3.4, width: 27 },
      { x: 278.3, z: 205.2, y: 5, width: 28 },
      { x: 259.1, z: 206.3, y: 6.6, width: 29 },
      { x: 240.4, z: 204.2, y: 8.2, width: 30 },
      { x: 222.4, z: 198.6, y: 8.5, width: 30 },
      { x: 205.8, z: 189, y: 7.6, width: 29 },
      { x: 192.1, z: 176.1, y: 6.7, width: 29 },
      
      { x: 181.3, z: 160.4, y: 5.8, width: 28 },
      { x: 173.4, z: 143.3, y: 4.9, width: 28 },
      { x: 166.8, z: 125.4, y: 4, width: 27 },
      { x: 158.8, z: 108.3, y: 3.1, width: 27 },
      { x: 143.6, z: 97.5, y: 2.6, width: 26 },
      { x: 125.2, z: 93.8, y: 2.1, width: 28 },
      { x: 106.2, z: 91.3, y: 1.6, width: 29 },
      { x: 87.2, z: 87.8, y: 1.2, width: 31 },
      { x: 68.8, z: 82.3, y: 0.7, width: 33 },
      { x: 51.2, z: 74.4, y: 0.3, width: 36 },
      { x: 35.5, z: 63.9, width: 38 },
      { x: 20.9, z: 49.3, width: 40 },
    ],
    
    
    
    
    itemStops: [0.20, 0.44, 0.66, 0.82],
    
    
    
    jumps: [
      { id: 'hay-ramp', at: 0.115, launch: 9.0 },
      
      
      
      
      
      
      { id: 'caldera-lip', at: 0.585, launch: 12.0 },
    ],
    
    glides: [
      {
        id: 'caldera-drop',
        name: 'The Caldera Drop',
        jump: 'caldera-lip',
        from: 0.585,
        to: 0.712,
        over: 'lava',
        drop: 30.5,
        floorY: 2.0,
      },
    ],
    hazards: [
      
      
      
      
      
      {
        id: 'sunflower-fires', kind: 'fire', from: 0.27, to: 0.37,
        side: 'both', beyond: 1.22, until: 1.8,
      },
      
      
      
      
      {
        id: 'sunflower-lava', kind: 'lava', from: 0.626, to: 0.712,
        side: 'both', beyond: 1.25, depth: 26, bank: 0.30, level: 17,
      },
    ],
    
    
    
    
    
    terrain: [
      {
        kind: 'volcano', id: 'mount-sunflower',
        x: 225, z: -30, radius: 84, height: 58,
        craterRadius: 34, craterDepth: 26, lavaLevel: 3,
      },
    ],
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    shortcuts: [
      {
        id: 'sunflower-cut',
        name: 'The Ash Track',
        entryAt: 0.36,
        exitAt: 0.47,
        entryLateral: -0.5,
        exitLateral: -0.35,
        width: 13,
        grip: 0.8,
        via: [{ x: 415.4, z: -120.5 }],
      },
    ],
    
    
    
    
    scenery: {
      sunflowers: 300, trees: 52, bales: 30, fencePosts: 220, barns: 2, silos: 2,
      hedgerows: 18, landmark: { kind: 'windmill', at: 0.14, side: -1, out: 74 },
    },
    sky: 'day',
  },
  {
    id: 'muddybottom',
    name: 'Muddy Bottom',
    tagline: 'Technical, and the lagoon at the bottom has teeth.',
    theme: 'mud',
    laps: 3,
    
    
    
    
    defaultWidth: 30,
    control: [
      { x: 0, z: 0, y: 4, width: 32 },
      { x: 4.7, z: -41.4, y: 4, width: 32 },
      { x: 19.2, z: -80.7, y: 4, width: 32 },
      { x: 41.5, z: -115.6, y: 4, width: 32 },
      { x: 71.9, z: -144, y: 4, width: 32 },
      { x: 108.7, z: -163.1, y: 4, width: 32 },
      { x: 149.4, z: -170.5, y: 4, width: 30 },
      
      { x: 189.6, z: -160.6, y: 5.2, width: 27 },
      { x: 208.8, z: -145.1, y: 6.1, width: 26 },
      { x: 219.7, z: -129.7, y: 6.7, width: 25 },
      { x: 227.9, z: -112.5, y: 7.4, width: 24 },
      { x: 235, z: -94.8, y: 8.1, width: 23 },
      { x: 247.7, z: -82.1, y: 8.8, width: 22 },
      { x: 266.6, z: -82.3, y: 10, width: 23 },
      { x: 285.3, z: -84.7, y: 11.4, width: 23 },
      { x: 304.2, z: -86, y: 12.9, width: 24 },
      { x: 323.1, z: -85.3, y: 14.4, width: 25 },
      { x: 341.7, z: -81.9, y: 15.8, width: 26 },
      
      { x: 360.6, z: -74.7, y: 17.4, width: 26 },
      { x: 386.4, z: -52.2, y: 20.1, width: 27 },
      { x: 398.1, z: -12.7, y: 22.4, width: 28 },
      { x: 388.3, z: 27.8, y: 24.8, width: 28 },
      { x: 366.7, z: 60.4, y: 26.5, width: 28 },
      
      { x: 353.3, z: 74.1, y: 27.3, width: 28 },     
      { x: 338.8, z: 86.3, y: 24.1, width: 28 },
      { x: 323.5, z: 97.4, y: 13.3, width: 26 },
      { x: 307.8, z: 107.9, y: 3.9, width: 24 },
      
      { x: 291.9, z: 118.1, y: 1.8, width: 24 },
      { x: 276.2, z: 128.7, y: 1.6, width: 24 },
      { x: 260.9, z: 139.7, y: 1.3, width: 24 },
      { x: 245.8, z: 150.9, y: 1.1, width: 24 },
      { x: 230.3, z: 161.7, y: 2.2, width: 25 },
      
      { x: 214, z: 171.3, y: 4.1, width: 26 },
      { x: 196.5, z: 178.7, y: 6, width: 27 },
      { x: 178.1, z: 182.3, y: 7.9, width: 28 },
      { x: 159.3, z: 180.4, y: 7.5, width: 27 },
      { x: 142.5, z: 172, y: 7, width: 26 },
      
      { x: 129.5, z: 158, y: 6.4, width: 25 },
      { x: 121, z: 141.2, y: 5.9, width: 24 },
      { x: 115.7, z: 122.9, y: 5.3, width: 22 },
      { x: 112.1, z: 104.4, y: 4.9, width: 21 },
      { x: 106.5, z: 86.6, y: 4.8, width: 21 },
      { x: 91.3, z: 76.5, y: 4.6, width: 24 },
      { x: 73, z: 72.6, y: 4.4, width: 27 },
      { x: 54.6, z: 68.1, y: 4.2, width: 28 },
      { x: 36.9, z: 60.8, y: 4, width: 29 },
      { x: 21.5, z: 50, y: 4, width: 30 },
    ],
    itemStops: [0.16, 0.42, 0.66, 0.84],
    
    
    
    jumps: [{ id: 'bluff-lip', at: 0.580, launch: 12.0 }],
    glides: [
      {
        id: 'shark-leap',
        name: 'The Shark Leap',
        jump: 'bluff-lip',
        from: 0.580,
        to: 0.712,
        over: 'sharks',
        drop: 26.2,
        floorY: 1.1,
      },
    ],
    
    
    
    
    
    
    
    
    
    
    hazards: [
      {
        id: 'muddy-lagoon', kind: 'water', from: 0.626, to: 0.712,
        side: 'both', beyond: 1.25, depth: 24, bank: 0.30, level: 15,
        creatures: { kind: 'shark', count: 11, lungeHeight: 6, period: 3.6 },
      },
    ],
    
    
    
    
    
    
    
    shortcuts: [
      {
        id: 'cattle-gate',
        name: 'The Cattle Gate',
        entryAt: 0.42,
        exitAt: 0.53,
        entryLateral: -0.5,
        exitLateral: -0.35,
        width: 11,
        shoulder: 2,
        grip: 0.7,
        via: [{ x: 368.5, z: -27.8 }],
      },
    ],
    scenery: {
      sunflowers: 40, trees: 86, bales: 44, fencePosts: 260, barns: 3, silos: 1,
      hedgerows: 15, landmark: { kind: 'watertower', at: 0.80, side: 1, out: 58 },
    },
    sky: 'overcast',
  },
  {
    id: 'frostfield',
    name: 'Frostfield Loop',
    tagline: 'The old snow farm, and the ravine at the back of it.',
    theme: 'snow',
    laps: 3,
    
    
    
    
    
    
    
    
    
    locked: true,
    surfaceGrip: 0.72,
    defaultWidth: 38,
    control: [
      
      { x: 0, z: 0, width: 38 },
      { x: 1.9, z: -41.8, width: 38 },
      { x: 11.5, z: -82.2, width: 38 },
      { x: 19.8, z: -102.3, width: 38 },
      { x: 29, z: -118.8, y: 4.2, width: 38 },       
      { x: 40, z: -134.2, y: 2.2, width: 38 },
      { x: 52.9, z: -148.3, y: 0.6, width: 38 },
      { x: 67.3, z: -160.8, width: 38 },
      { x: 82.9, z: -171.5, width: 38 },
      { x: 99.4, z: -180.5, width: 38 },
      { x: 123, z: -190.1, width: 37 },
      { x: 163.4, z: -199.9, width: 35 },
      { x: 205.2, z: -201.9, y: 1.6, width: 33 },
      
      { x: 245.7, z: -192.6, y: 4.9, width: 30 },
      { x: 273.3, z: -173.8, y: 7.7, width: 28 },
      { x: 285.3, z: -159.1, y: 9.2, width: 27 },
      { x: 294.5, z: -142.4, y: 10.9, width: 26 },
      { x: 301.6, z: -124.9, y: 12.5, width: 25 },
      { x: 308.4, z: -107.1, y: 14.2, width: 24 },
      { x: 317.2, z: -90.3, y: 15.9, width: 25 },
      { x: 329.3, z: -75.8, y: 17.5, width: 26 },
      { x: 343, z: -62.7, y: 19.2, width: 27 },
      { x: 356.1, z: -48.8, y: 20.9, width: 28 },
      
      { x: 366.8, z: -33, y: 22.4, width: 30 },
      { x: 373.3, z: -15.3, y: 23.6, width: 30 },
      { x: 374.3, z: 8.3, y: 25.2, width: 31 },
      { x: 360.8, z: 45.7, y: 27.8, width: 32 },
      { x: 338.1, z: 77.7, y: 29.4, width: 31 },
      
      { x: 326.4, z: 92.4, y: 30.2, width: 31 },     
      { x: 314.8, z: 107.5, y: 28.4, width: 30 },
      { x: 303.9, z: 122.8, y: 18.9, width: 29 },
      { x: 293.1, z: 138.4, y: 6.9, width: 27 },
      
      { x: 282.1, z: 154, y: 0.9, width: 26 },
      { x: 270.5, z: 168.9, y: 0.7, width: 26 },
      { x: 257.9, z: 183, y: 0.4, width: 26 },
      { x: 244.1, z: 196.1, y: 0.2, width: 26 },
      { x: 228.8, z: 207.7, y: 0.3, width: 26 },
      
      { x: 212.2, z: 217.3, y: 2.4, width: 27 },
      { x: 194.6, z: 224.2, y: 4.4, width: 28 },
      { x: 176.1, z: 228.1, y: 6.5, width: 29 },
      { x: 156.9, z: 228.2, y: 7.8, width: 30 },
      { x: 138.6, z: 223.8, y: 6.9, width: 29 },
      { x: 121.8, z: 214.9, y: 6.1, width: 29 },
      
      { x: 107.1, z: 201.4, y: 5.2, width: 29 },
      { x: 96.2, z: 185.8, y: 4.3, width: 28 },
      { x: 87.9, z: 168.5, y: 3.5, width: 27 },
      { x: 81.6, z: 150.7, y: 2.8, width: 26 },
      { x: 75.9, z: 132.4, y: 2.3, width: 24 },
      { x: 68.8, z: 114.7, y: 1.7, width: 26 },
      { x: 57.9, z: 99.4, y: 1.2, width: 29 },
      { x: 44, z: 86.5, y: 0.7, width: 32 },
      { x: 29.9, z: 73.5, y: 0.2, width: 33 },
      { x: 17.8, z: 58.8, width: 34 },
      { x: 8.8, z: 42.3, width: 35 },
    ],
    itemStops: [0.18, 0.46, 0.68, 0.88],
    jumps: [
      
      
      { id: 'snow-bank', at: 0.102, launch: 10.0 },
      
      
      { id: 'ravine-lip', at: 0.578, launch: 12.5 },
    ],
    glides: [
      {
        id: 'frozen-ravine',
        name: 'The Frozen Ravine',
        jump: 'ravine-lip',
        from: 0.578,
        to: 0.712,
        over: 'ice',
        drop: 29.9,
        floorY: 0.2,
      },
    ],
    hazards: [
      
      
      
      
      {
        id: 'frostfield-lake', kind: 'water', from: 0.17, to: 0.23,
        side: 'both', beyond: 1.30, depth: 5.0, bank: 0.5,
      },
      
      
      
      {
        id: 'frostfield-ravine', kind: 'water', from: 0.626, to: 0.712,
        side: 'both', beyond: 1.25, depth: 26, bank: 0.28, level: 17, frozen: true,
      },
    ],
    
    
    
    
    
    
    
    
    shortcuts: [
      {
        id: 'frozen-creek',
        name: 'The Frozen Creek',
        entryAt: 0.43,
        exitAt: 0.54,
        entryLateral: -0.5,
        exitLateral: -0.35,
        width: 15,
        grip: 0.8,
        via: [{ x: 347.5, z: -6.1 }],
      },
    ],
    scenery: {
      sunflowers: 0, trees: 66, bales: 34, fencePosts: 230, barns: 2, silos: 2, snowmen: 26,
      hedgerows: 12, landmark: { kind: 'church', at: 0.86, side: 1, out: 66 },
    },
    sky: 'snow',
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
];

export const DEFAULT_TRACK = 'sunflower';

export function trackById(id) {
  return TRACKS.find((t) => t.id === id) ?? TRACKS.find((t) => t.id === DEFAULT_TRACK);
}






export function itemStopsFor(track, pathLength) {
  return (track.itemStops ?? []).map((f) => f * pathLength);
}
