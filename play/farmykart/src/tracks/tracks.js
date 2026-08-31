





























































































































































































export const TRACKS = [
  {
    id: 'sunflower',
    cup: 'home-paddock',
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
    cup: 'home-paddock',
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
    cup: 'home-paddock',
    name: 'Frostfield Loop',
    tagline: 'The old snow farm, and the ravine at the back of it.',
    theme: 'snow',
    laps: 3,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
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
  {
    id: 'millrace',
    cup: 'long-paddock',
    
    
    
    
    locked: true,
    name: 'Harvest Millrace',
    tagline: 'Dusk over the mill, and the pond is deep enough to float you.',
    
    
    
    
    
    
    
    theme: 'summer',
    laps: 3,
    
    
    
    defaultWidth: 34,
    control: [
      { x: 0, z: 0, width: 34 },
      { x: 33.2, z: 0, y: 0.2, width: 34 },
      { x: 57, z: 0, y: 0.4, width: 34 },
      { x: 76.8, z: 0, y: 1, width: 34 },
      { x: 95.8, z: 0, y: 3.1, width: 34 },
      { x: 114.7, z: 0, y: 5.1, width: 34 },
      { x: 133.7, z: 0, y: 3.9, width: 34 },
      { x: 152.7, z: 0, y: 2.2, width: 34 },
      { x: 171.5, z: -2.5, y: 1, width: 33 },
      { x: 189.4, z: -8.7, y: 0.6, width: 33 },
      { x: 205.8, z: -18.3, y: 0.2, width: 33 },
      { x: 219.9, z: -31.1, y: 0.3, width: 32 },
      { x: 233.4, z: -47, y: 0.5, width: 32 },
      { x: 249.7, z: -68.3, y: 0.7, width: 32 },
      { x: 264.2, z: -102.4, y: 1.7, width: 32 },
      { x: 267.1, z: -144, y: 3.2, width: 32 },
      { x: 257.1, z: -181, y: 4.6, width: 32 },
      { x: 245.2, z: -206.6, y: 6.3, width: 27 },
      { x: 236.1, z: -226, y: 7.6, width: 24 },
      { x: 223.1, z: -239.7, y: 8.7, width: 22 },
      { x: 204.7, z: -244.3, y: 9.9, width: 23 },
      { x: 183.6, z: -242.5, y: 11.2, width: 24 },
      { x: 156, z: -240.1, y: 12.9, width: 27 },
      { x: 118, z: -236.8, y: 15.5, width: 30 },
      { x: 80.1, z: -234.3, y: 18.4, width: 30 },
      { x: 52.5, z: -236.1, y: 20.7, width: 30 },
      { x: 31.6, z: -239.8, y: 22.8, width: 30 },
      { x: 13.2, z: -244.8, y: 24.7, width: 29 },
      { x: -4.7, z: -251.2, y: 27.2, width: 29 },
      { x: -22.6, z: -257.7, y: 29, width: 28 },
      { x: -40.4, z: -264.2, y: 26.9, width: 28 },
      { x: -58.4, z: -270.4, y: 23.1, width: 27 },
      { x: -76.8, z: -274.9, y: 13.9, width: 26 },
      { x: -96, z: -277.2, y: 6, width: 26 },
      { x: -116.4, z: -277.4, y: 2.1, width: 26 },
      { x: -137.7, z: -274.9, y: 1.9, width: 26 },
      { x: -158.5, z: -271.2, y: 1.7, width: 26 },
      { x: -178.3, z: -267.7, y: 1.5, width: 26 },
      { x: -196.1, z: -261, y: 2.2, width: 26 },
      { x: -210.5, z: -248.6, y: 3.4, width: 27 },
      { x: -219.8, z: -232.2, y: 4.6, width: 28 },
      { x: -223.8, z: -213.7, y: 5.5, width: 29 },
      { x: -227.1, z: -195, y: 6.4, width: 28 },
      { x: -230.4, z: -176.3, y: 7.3, width: 28 },
      { x: -233.4, z: -157.5, y: 7.3, width: 27 },
      { x: -232.3, z: -138.6, y: 6.8, width: 26 },
      { x: -226.2, z: -120.7, y: 6.4, width: 25 },
      { x: -215.5, z: -105.1, y: 5.9, width: 24 },
      { x: -200.6, z: -91.7, y: 5.1, width: 25 },
      { x: -181.9, z: -76.1, y: 4.1, width: 27 },
      { x: -155.4, z: -54.7, y: 2.9, width: 29 },
      { x: -119.5, z: -34.3, y: 1.8, width: 31 },
      { x: -80.2, z: -19.6, y: 0.8, width: 32 },
      { x: -40.6, z: -5.6, y: 0.1, width: 34 },
    ],
    itemStops: [0.16, 0.40, 0.63, 0.88],
    jumps: [
      { id: 'granary-ramp', at: 0.090, launch: 9.5 },
      
      
      
      { id: 'weir-lip', at: 0.550, launch: 12.0 },
    ],
    glides: [
      {
        id: 'weir-drop',
        name: 'The Weir Drop',
        jump: 'weir-lip',
        from: 0.550,
        to: 0.680,
        
        
        
        
        
        over: 'water',
        drop: 28.0,
        floorY: 1.4,
      },
    ],
    hazards: [
      
      
      
      
      
      {
        id: 'millrace-pond', kind: 'water', from: 0.21, to: 0.30,
        side: 'left', beyond: 1.25, depth: 6, bank: 0.70, level: 2.2,
        drivable: true, shores: [{ from: 0.275, to: 0.300 }],
      },
      
      
      
      {
        id: 'millrace-tailrace', kind: 'water', from: 0.598, to: 0.672,
        side: 'both', beyond: 1.25, depth: 25, bank: 0.30, level: 16,
      },
    ],
    
    
    
    
    shortcuts: [
      {
        id: 'sluice-gate',
        name: 'The Sluice Gate',
        entryAt: 0.30,
        exitAt: 0.42,
        entryLateral: 0.5,
        exitLateral: 0.35,
        width: 12,
        shoulder: 2,
        grip: 0.75,
        via: [{ x: 211, z: -225.2 }],
      },
    ],
    scenery: {
      sunflowers: 120, trees: 60, bales: 52, fencePosts: 240, barns: 2, silos: 2,
      hedgerows: 16, landmark: { kind: 'windmill', at: 0.26, side: 1, out: 70 },
    },
    sky: 'dusk',
  },
  {
    id: 'saltmarsh',
    cup: 'long-paddock',
    
    
    
    
    locked: true,
    name: 'Saltmarsh Run',
    tagline: 'Off the sea wall in the first ten seconds, then out onto the flats.',
    
    
    
    theme: 'snow',
    laps: 3,
    
    
    
    
    
    
    
    
    
    surfaceGrip: 0.90,
    defaultWidth: 32,
    control: [
      { x: 45.8, z: 0, y: 14.8, width: 31 },
      { x: 80.9, z: 0, y: 16.6, width: 30 },
      { x: 110.2, z: -0.6, y: 19.3, width: 29 },
      { x: 131.9, z: -3.4, y: 21.4, width: 29 },
      { x: 150.7, z: -7.8, y: 23.4, width: 28 },
      { x: 168.7, z: -13.9, y: 25.3, width: 28 },
      { x: 186, z: -21.7, y: 26.2, width: 27 },
      { x: 202.4, z: -31.1, y: 22.9, width: 27 },
      { x: 218, z: -42, y: 16.3, width: 27 },
      { x: 232.9, z: -53.7, y: 8.3, width: 26 },
      { x: 247.8, z: -65.5, y: 3.5, width: 26 },
      { x: 262.7, z: -77.2, y: 1.3, width: 26 },
      { x: 277.7, z: -88.9, y: 1.2, width: 26 },
      { x: 292.4, z: -100.9, y: 1.1, width: 26 },
      { x: 303.9, z: -115.8, y: 0.9, width: 26 },
      { x: 310.5, z: -133.7, y: 0.8, width: 26 },
      { x: 313.8, z: -154.6, y: 1.9, width: 28 },
      { x: 318.1, z: -181.6, y: 3.1, width: 30 },
      { x: 322.3, z: -219.2, y: 3.8, width: 31 },
      { x: 317.6, z: -260.7, y: 4.4, width: 32 },
      { x: 303.6, z: -298.5, y: 4.5, width: 32 },
      { x: 286.9, z: -324.9, y: 4.5, width: 32 },
      { x: 271.8, z: -341.9, y: 4.6, width: 32 },
      { x: 258, z: -355.6, y: 5, width: 32 },
      { x: 244.5, z: -369, y: 6.8, width: 32 },
      { x: 231, z: -382.3, y: 7.7, width: 32 },
      { x: 215.9, z: -393.8, y: 5.4, width: 32 },
      { x: 198.8, z: -401.9, y: 5, width: 32 },
      { x: 180.4, z: -406.4, y: 4.8, width: 31 },
      { x: 161.2, z: -407, y: 4.6, width: 31 },
      { x: 139.4, z: -405.6, y: 4.4, width: 30 },
      { x: 112, z: -403.9, y: 4.3, width: 28 },
      { x: 82.6, z: -402, y: 4.3, width: 25 },
      { x: 58.7, z: -400.5, y: 4.2, width: 23 },
      { x: 39, z: -397.8, y: 4.2, width: 22 },
      { x: 23.2, z: -387.7, y: 4.3, width: 22 },
      { x: 11.9, z: -372.5, y: 4.4, width: 24 },
      { x: 0.9, z: -357, y: 4.5, width: 26 },
      { x: -10, z: -341.5, y: 4.5, width: 25 },
      { x: -21, z: -326, y: 4.6, width: 24 },
      { x: -29.9, z: -309.4, y: 4.8, width: 23 },
      { x: -31.4, z: -290.6, y: 5.1, width: 22 },
      { x: -24.8, z: -272.9, y: 5.3, width: 25 },
      { x: -12.5, z: -258.6, y: 5.6, width: 27 },
      { x: 0.5, z: -244.7, y: 5.8, width: 28 },
      { x: 10.9, z: -228.9, y: 6.2, width: 29 },
      { x: 16.5, z: -210.9, y: 6.6, width: 29 },
      { x: 16.7, z: -192, y: 7.1, width: 30 },
      { x: 11.6, z: -173.8, y: 7.6, width: 30 },
      { x: 1.5, z: -157.8, y: 8.1, width: 30 },
      { x: -12.2, z: -144.6, y: 8.6, width: 30 },
      { x: -26.1, z: -131.7, y: 9.3, width: 30 },
      { x: -38.8, z: -117.6, y: 9.9, width: 30 },
      { x: -48.4, z: -101.3, y: 10.5, width: 30 },
      { x: -54.5, z: -83.4, y: 11.1, width: 30 },
      { x: -57.6, z: -64.7, y: 11.7, width: 31 },
      { x: -56.7, z: -45.8, y: 12.3, width: 31 },
      { x: -49.8, z: -28.2, y: 12.9, width: 32 },
      { x: -37.5, z: -13.8, y: 13.6, width: 32 },
      { x: -21.3, z: -4.1, y: 13.9, width: 32 },
      { x: -2.8, z: -0.1, y: 14, width: 32 },
      { x: 18.4, z: 0, y: 14.1, width: 32 },
    ],
    itemStops: [0.07, 0.28, 0.50, 0.79],
    jumps: [
      { id: 'seawall-lip', at: 0.110, launch: 12.5 },
      
      
      
      
      
      
      
      
      { id: 'staithe-ramp', at: 0.445, launch: 9.0 },
    ],
    glides: [
      {
        id: 'tidal-drop',
        name: 'The Tidal Drop',
        jump: 'seawall-lip',
        from: 0.110,
        to: 0.240,
        over: 'water',
        drop: 25.1,
        floorY: 0.8,
      },
    ],
    hazards: [
      
      
      
      
      {
        id: 'saltmarsh-channel', kind: 'water', from: 0.160, to: 0.240,
        side: 'both', beyond: 1.25, depth: 24, bank: 0.28, level: 15,
      },
      
      
      
      
      
      
      
      
      
      
      
      
      
      {
        id: 'saltmarsh-saltings', kind: 'water', from: 0.250, to: 0.400,
        side: 'left', beyond: 1.25, depth: 5.5, bank: 0.75, level: 2.0,
        drivable: true, shores: [{ from: 0.360, to: 0.400 }],
      },
    ],
    shortcuts: [
      {
        id: 'oyster-beds',
        name: 'The Oyster Beds',
        entryAt: 0.57,
        exitAt: 0.67,
        entryLateral: 0.5,
        exitLateral: 0.35,
        width: 13,
        shoulder: 2,
        grip: 0.70,
        via: [{ x: 27.9, z: -357 }],
      },
    ],
    scenery: {
      sunflowers: 0, trees: 34, bales: 18, fencePosts: 280, barns: 2, silos: 1,
      snowmen: 0, hedgerows: 22,
      landmark: { kind: 'watertower', at: 0.45, side: 1, out: 62 },
    },
    sky: 'day',
  },
  {
    id: 'canyon',
    cup: 'long-paddock',
    
    
    
    
    locked: true,
    name: 'Copperhead Canyon',
    tagline: 'Off the arch, along the river, and home along the shelf.',
    
    
    theme: 'mud',
    laps: 3,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    defaultWidth: 36,
    control: [
      { x: 65.6, z: 0, y: 12.2, width: 36 },
      { x: 106.3, z: 0, y: 14.2, width: 36 },
      { x: 148, z: -0.6, y: 18, width: 35 },
      { x: 187.4, z: -9.6, y: 22.3, width: 34 },
      { x: 216.4, z: -24.2, y: 26, width: 33 },
      { x: 235, z: -38.5, y: 28.5, width: 33 },
      { x: 248.7, z: -52.5, y: 30.3, width: 32 },
      { x: 260.1, z: -67.5, y: 32, width: 31 },
      { x: 270.9, z: -83, y: 32.9, width: 31 },
      { x: 281.6, z: -98.4, y: 33.2, width: 30 },
      { x: 292.4, z: -113.9, y: 28.9, width: 29 },
      { x: 303.2, z: -129.3, y: 21.5, width: 27 },
      { x: 313.7, z: -145.6, y: 11.4, width: 26 },
      { x: 323.1, z: -166.4, y: 4.4, width: 26 },
      { x: 330.2, z: -196.9, y: 3.8, width: 26 },
      { x: 329.3, z: -236.9, y: 3.2, width: 26 },
      { x: 316.5, z: -276.4, y: 3.2, width: 27 },
      { x: 299.4, z: -314.3, y: 3.2, width: 28 },
      { x: 281.1, z: -351.6, y: 3.6, width: 29 },
      { x: 253.4, z: -382.5, y: 5.1, width: 30 },
      { x: 217.4, z: -403.1, y: 6.6, width: 30 },
      { x: 176.9, z: -411.5, y: 8.7, width: 30 },
      { x: 139.6, z: -415.2, y: 10.9, width: 28 },
      { x: 112.5, z: -417.8, y: 12.4, width: 25 },
      { x: 91.6, z: -419.8, y: 13.7, width: 23 },
      { x: 73, z: -417, y: 14.9, width: 22 },
      { x: 57, z: -407.3, y: 16.2, width: 23 },
      { x: 44.7, z: -392.7, y: 17.4, width: 25 },
      { x: 32.9, z: -377.6, y: 18.7, width: 26 },
      { x: 20.9, z: -362.4, y: 20, width: 27 },
      { x: 9, z: -347.2, y: 20.8, width: 28 },
      { x: -2.6, z: -332.1, y: 21.7, width: 29 },
      { x: -11.9, z: -315.8, y: 22.6, width: 30 },
      { x: -18.2, z: -298.1, y: 23.4, width: 30 },
      { x: -21.3, z: -279.5, y: 24.3, width: 30 },
      { x: -21.2, z: -260.7, y: 25.1, width: 30 },
      { x: -17.7, z: -242.2, y: 26, width: 30 },
      { x: -11.1, z: -224.6, y: 26.2, width: 30 },
      { x: -3.2, z: -207.5, y: 26.3, width: 30 },
      { x: 2.5, z: -189.6, y: 26.5, width: 29 },
      { x: 4.5, z: -170.9, y: 26.7, width: 29 },
      { x: 2.9, z: -152.2, y: 26.9, width: 28 },
      { x: -2.4, z: -134.2, y: 26.6, width: 28 },
      { x: -11.2, z: -117.6, y: 25.4, width: 29 },
      { x: -23.1, z: -103, y: 24.2, width: 29 },
      { x: -36.5, z: -89.8, y: 23, width: 30 },
      { x: -47.3, z: -74.5, y: 21.8, width: 30 },
      { x: -52.1, z: -56.4, y: 20.1, width: 32 },
      { x: -50.2, z: -37.8, y: 17.4, width: 33 },
      { x: -41.9, z: -21, y: 14.8, width: 34 },
      { x: -28.2, z: -8.3, y: 13.4, width: 35 },
      { x: -10.9, z: -1.1, y: 12.2, width: 36 },
      { x: 8.7, z: 0, y: 12, width: 36 },
      { x: 32.5, z: 0, y: 12.1, width: 36 },
    ],
    itemStops: [0.095, 0.355, 0.615, 0.835],
    jumps: [
      { id: 'arch-lip', at: 0.195, launch: 12.5 },
    ],
    glides: [
      {
        id: 'arch-drop',
        name: 'The Copperhead Drop',
        jump: 'arch-lip',
        from: 0.195,
        to: 0.315,
        over: 'water',
        drop: 29.4,
        floorY: 3.2,
      },
    ],
    hazards: [
      
      {
        id: 'copperhead-river', kind: 'water', from: 0.243, to: 0.300,
        side: 'both', beyond: 1.25, depth: 28, bank: 0.30, level: 18,
      },
      
      
      
      
      
      {
        id: 'copperhead-ford', kind: 'water', from: 0.310, to: 0.380,
        side: 'left', beyond: 1.25, depth: 5.0, bank: 0.80, level: 1.8,
        drivable: true, shores: [{ from: 0.350, to: 0.380 }],
      },
    ],
    
    
    
    shortcuts: [
      {
        id: 'the-slot',
        name: 'The Slot',
        entryAt: 0.515,
        exitAt: 0.615,
        entryLateral: 0.5,
        exitLateral: 0.35,
        width: 11,
        shoulder: 2,
        grip: 0.85,
        via: [{ x: 84.8, z: -403.3 }],
      },
    ],
    scenery: {
      sunflowers: 0, trees: 26, bales: 12, fencePosts: 210, barns: 1, silos: 1,
      hedgerows: 8, landmark: { kind: 'church', at: 0.735, side: 1, out: 68 },
    },
    sky: 'day',
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

];









































export const CUPS = [
  {
    id: 'home-paddock',
    name: 'Home Paddock',
    blurb: 'The three circuits on the farm itself. Wide, fast, and where you learn the kart.',
  },
  {
    id: 'long-paddock',
    name: 'Long Paddock',
    blurb: 'Out past the boundary fence: a millpond, a tidal marsh and a canyon with a river in it.',
  },
];

export const DEFAULT_CUP = 'home-paddock';

export function cupById(id) {
  return CUPS.find((c) => c.id === id) ?? CUPS.find((c) => c.id === DEFAULT_CUP);
}


export function tracksInCup(cupId) {
  return TRACKS.filter((t) => t.cup === cupId);
}










export function cupLocked(cupId) {
  const inCup = tracksInCup(cupId);
  return inCup.length > 0 && inCup.every((t) => t.locked === true);
}


export function cupOf(trackId) {
  return TRACKS.find((t) => t.id === trackId)?.cup ?? DEFAULT_CUP;
}

export const DEFAULT_TRACK = 'sunflower';

export function trackById(id) {
  return TRACKS.find((t) => t.id === id) ?? TRACKS.find((t) => t.id === DEFAULT_TRACK);
}






export function itemStopsFor(track, pathLength) {
  return (track.itemStops ?? []).map((f) => f * pathLength);
}
