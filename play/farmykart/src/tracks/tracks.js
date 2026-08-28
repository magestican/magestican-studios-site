
















































export const TRACKS = [
  {
    id: 'sunflower',
    name: 'Sunflower Circuit',
    tagline: 'Wide, fast, forgiving. Learn the karts here.',
    theme: 'summer',
    laps: 3,
    
    
    
    
    defaultWidth: 28,
    control: [
      { x: 0, z: 0, width: 30 },
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      { x: 52, z: -2.6 },
      { x: 70, z: -3.5, y: 4.4 },      
      { x: 82, z: -4.1, y: 1.2 },      
      { x: 98, z: -4.9 },
      { x: 120, z: -6 },               
      { x: 200, z: 30 },
      
      
      
      { x: 232, z: 110, y: 4.5 },
      { x: 190, z: 178, y: 6.2 },
      { x: 100, z: 196, y: 3.4 },
      { x: 30, z: 168, width: 21 },
      { x: 8, z: 118, width: 18 },     
      { x: 40, z: 78, width: 19 },
      { x: 6, z: 40, width: 23 },
      { x: -80, z: 46, y: -2.2 },      
      { x: -140, z: 10, y: -3.0 },
      { x: -120, z: -50, y: -1.4 },
      { x: -50, z: -46 },
    ],
    
    
    
    
    itemStops: [0.12, 0.38, 0.62, 0.86],
    
    
    
    
    jumps: [{ id: 'hay-ramp', at: 0.066, launch: 8.5 }],
    
    
    
    
    
    
    hazards: [{
      id: 'sunflower-fires', kind: 'fire', from: 0.30, to: 0.42,
      side: 'both', beyond: 1.22, until: 1.8,
    }],
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    shortcuts: [
      {
        id: 'sunflower-cut',
        name: 'The Sunflower Cut',
        entryAt: 0.57,
        exitAt: 0.66,
        entryLateral: 0.55,
        exitLateral: 0.35,
        width: 12,
        grip: 0.8,
        via: [{ x: 13, z: 94 }, { x: 9, z: 62 }],
      },
    ],
    
    
    
    
    
    
    scenery: {
      sunflowers: 260, trees: 44, bales: 26, fencePosts: 190, barns: 2, silos: 2,
      hedgerows: 16, landmark: { kind: 'windmill', at: 0.27, side: -1, out: 74 },
    },
    sky: 'day',
  },
  {
    id: 'muddybottom',
    name: 'Muddy Bottom',
    tagline: 'Narrow, technical, and the verges will take your race.',
    theme: 'mud',
    laps: 3,
    
    
    
    
    defaultWidth: 19,
    control: [
      
      
      
      
      
      
      { x: 0, z: 0, width: 23 },
      { x: 92, z: 4, y: 2.6 },
      { x: 146, z: 34, width: 17, y: 5.8 },
      { x: 150, z: 84, width: 15, y: 7.4 },    
      { x: 108, z: 96, width: 15, y: 7.1 },    
      { x: 96, z: 148, y: 6.0 },
      { x: 40, z: 172, width: 17, y: 4.2 },
      { x: 6, z: 140, width: 17, y: 3.0 },     
      { x: -34, z: 158, width: 17, y: 1.8 },
      { x: -84, z: 128, y: -0.6 },
      { x: -96, z: 66, width: 15, y: -2.4 },   
      { x: -52, z: 44, width: 15, y: -2.0 },
      { x: -74, z: -6, y: -0.8 },
      { x: -40, z: -34 },
    ],
    itemStops: [0.08, 0.3, 0.55, 0.78],
    
    
    
    
    hazards: [{
      id: 'muddy-ditch', kind: 'water', from: 0.62, to: 0.70,
      side: 'left', beyond: 1.30, depth: 3.4, bank: 0.45,
    }],
    
    
    
    
    
    
    
    
    
    shortcuts: [
      {
        id: 'cattle-gate',
        name: 'The Cattle Gate',
        entryAt: 0.195,
        exitAt: 0.3,
        entryLateral: -0.5,
        exitLateral: -0.4,
        width: 10,
        shoulder: 2,
        grip: 0.7,
        via: [{ x: 134, z: 56 }, { x: 126, z: 76 }],
      },
    ],
    scenery: {
      sunflowers: 40, trees: 76, bales: 40, fencePosts: 240, barns: 3, silos: 1,
      hedgerows: 13, landmark: { kind: 'watertower', at: 0.62, side: 1, out: 58 },
    },
    sky: 'overcast',
  },
  {
    id: 'frostfield',
    name: 'Frostfield Loop',
    tagline: 'The old snow farm. Everything slides here.',
    theme: 'snow',
    laps: 3,
    
    
    
    
    
    
    
    
    
    locked: true,
    surfaceGrip: 0.72,
    defaultWidth: 26,
    
    
    
    
    
    
    control: [
      { x: 0, z: 0, width: 29 },
      
      
      
      
      
      { x: 48, z: 5.3 },
      { x: 66, z: 7.3, y: 4.8 },       
      { x: 78, z: 8.7, y: 1.3 },
      { x: 94, z: 10.4 },
      { x: 108, z: 12 },
      { x: 178, z: 62, y: 3.2 },
      { x: 186, z: 128, width: 18, y: 1.2 },
      { x: 146, z: 158, width: 15 },   
      { x: 104, z: 132, width: 15 },   
      { x: 78, z: 174, width: 18 },
      { x: 20, z: 164, width: 19 },
      { x: 2, z: 100, width: 18 },
      { x: -56, z: 92 },
      { x: -112, z: 54, width: 22 },
      { x: -96, z: -14 },
      { x: -34, z: -34 },
    ],
    itemStops: [0.14, 0.42, 0.68, 0.9],
    
    
    
    
    
    hazards: [{
      id: 'frostfield-lake', kind: 'water', from: 0.14, to: 0.22,
      side: 'both', beyond: 1.25, depth: 5.0, bank: 0.5,
    }],
    
    
    
    jumps: [{ id: 'snow-bank', at: 0.077, launch: 9.5 }],
    
    
    
    
    
    
    
    
    
    
    
    
    shortcuts: [
      {
        id: 'frozen-creek',
        name: 'The Frozen Creek',
        entryAt: 0.295,
        exitAt: 0.425,
        entryLateral: -0.5,
        exitLateral: -0.3,
        width: 15,
        grip: 0.8,
        via: [{ x: 160, z: 124 }, { x: 130, z: 128 }],
      },
    ],
    scenery: {
      sunflowers: 0, trees: 58, bales: 30, fencePosts: 200, barns: 2, silos: 2, snowmen: 22,
      hedgerows: 10, landmark: { kind: 'church', at: 0.52, side: 1, out: 66 },
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
