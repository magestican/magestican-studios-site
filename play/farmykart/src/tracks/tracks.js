

























export const TRACKS = [
  {
    id: 'sunflower',
    name: 'Sunflower Circuit',
    tagline: 'Wide, fast, forgiving. Learn the karts here.',
    theme: 'summer',
    laps: 3,
    
    
    
    
    defaultWidth: 20,
    control: [
      { x: 0, z: 0, width: 22 },
      { x: 120, z: -6 },
      { x: 200, z: 30 },
      { x: 232, z: 110 },
      { x: 190, z: 178 },
      { x: 100, z: 196 },
      { x: 30, z: 168, width: 15 },
      { x: 8, z: 118, width: 13 },     
      { x: 40, z: 78, width: 14 },
      { x: 6, z: 40, width: 17 },
      { x: -80, z: 46 },
      { x: -140, z: 10 },
      { x: -120, z: -50 },
      { x: -50, z: -46 },
    ],
    
    
    
    
    itemStops: [0.12, 0.38, 0.62, 0.86],
    scenery: { sunflowers: 260, trees: 34, bales: 26, fencePosts: 190, barns: 2, silos: 2 },
    sky: 'day',
  },
  {
    id: 'muddybottom',
    name: 'Muddy Bottom',
    tagline: 'Narrow, technical, and the verges will take your race.',
    theme: 'mud',
    laps: 3,
    
    
    
    
    defaultWidth: 14,
    control: [
      { x: 0, z: 0, width: 17 },
      { x: 92, z: 4 },
      { x: 146, z: 34, width: 12 },
      { x: 150, z: 84, width: 11 },    
      { x: 108, z: 96, width: 11 },    
      { x: 96, z: 148 },
      { x: 40, z: 172, width: 12 },
      { x: 6, z: 140, width: 12 },     
      { x: -34, z: 158, width: 12 },
      { x: -84, z: 128 },
      { x: -96, z: 66, width: 11 },    
      { x: -52, z: 44, width: 11 },
      { x: -74, z: -6 },
      { x: -40, z: -34 },
    ],
    itemStops: [0.08, 0.3, 0.55, 0.78],
    scenery: { sunflowers: 40, trees: 70, bales: 40, fencePosts: 240, barns: 3, silos: 1 },
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
    defaultWidth: 19,
    
    
    
    
    
    
    control: [
      { x: 0, z: 0, width: 21 },
      { x: 108, z: 12 },
      { x: 178, z: 62 },
      { x: 186, z: 128, width: 13 },
      { x: 146, z: 158, width: 11 },   
      { x: 104, z: 132, width: 11 },   
      { x: 78, z: 174, width: 13 },
      { x: 20, z: 164, width: 14 },
      { x: 2, z: 100, width: 13 },
      { x: -56, z: 92 },
      { x: -112, z: 54, width: 16 },
      { x: -96, z: -14 },
      { x: -34, z: -34 },
    ],
    itemStops: [0.14, 0.42, 0.68, 0.9],
    scenery: { sunflowers: 0, trees: 46, bales: 30, fencePosts: 200, barns: 2, silos: 2, snowmen: 22 },
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
