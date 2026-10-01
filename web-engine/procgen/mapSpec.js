


































































import { VOX } from '../voxel/voxelGrid.js';

export const DEFAULT_MAP = 'snow-farm';



















export const SKIES = Object.freeze({
  
  
  
  
  'farm-day': {
    gradient: [
      { at: 0.00, hex: '#a8c4e0' },
      { at: 0.35, hex: '#c8dcf5' },
      { at: 0.55, hex: '#e6ecf5' },
      { at: 0.75, hex: '#8ec5ff' },
      { at: 1.00, hex: '#3a5a89' },
    ],
    fog: 0x8ec5ff, fogNear: 50, fogFar: 150,
    sunTint: 0xffffff, sunIntensity: 1.05,
    hemiSky: 0xc5dde5, hemiGround: 0x7e99b4,
    cloudAlpha: 1.0,
  },

  
  
  
  
  'alpine-thin-air': {
    gradient: [
      { at: 0.00, hex: '#1b437c' },
      { at: 0.35, hex: '#5f97cf' },
      { at: 0.55, hex: '#e4eef6' },
      { at: 0.75, hex: '#c6dcec' },
      { at: 1.00, hex: '#6f8ba6' },
    ],
    fog: 0xc6dcec, fogNear: 55, fogFar: 169,   
    sunTint: 0xffffff, sunIntensity: 1.18,   
    hemiSky: 0xd3e6f2, hemiGround: 0x8fa8be,
    cloudAlpha: 0.7,                         
  },

  
  
  'manhattan-dusk': {
    gradient: [
      { at: 0.00, hex: '#26365f' },
      { at: 0.35, hex: '#7b7ba6' },
      { at: 0.55, hex: '#f6cf9d' },
      { at: 0.75, hex: '#e0b48a' },
      { at: 1.00, hex: '#6d5f56' },
    ],
    fog: 0xe0b48a, fogNear: 43, fogFar: 140,   
    sunTint: 0xffcf96, sunIntensity: 0.92,   
    hemiSky: 0xf0cfae, hemiGround: 0x9a8b7c, 
    cloudAlpha: 1.0,
  },

  
  
  
  'polar-twilight': {
    gradient: [
      { at: 0.00, hex: '#1e2c63' },
      { at: 0.35, hex: '#5b67a4' },
      { at: 0.55, hex: '#f0c3b0' },
      { at: 0.75, hex: '#c9c2d8' },
      { at: 1.00, hex: '#4e5a83' },
    ],
    fog: 0xc9c2d8, fogNear: 48, fogFar: 153,   
    sunTint: 0xffc2a6, sunIntensity: 0.86,
    hemiSky: 0xd8d2e6, hemiGround: 0x8ea0bd,
    cloudAlpha: 0.55,
  },
});




















































export const BACKDROPS = Object.freeze({

  
  
  
  
  
  
  'manhattan-skyline': {
    id: 'manhattan-skyline',
    skirt: '#4a3f45',
    bands: [
      
      
      
      
      
      
      
      
      { id: 'park-trees', form: 'canopy', depth: 0,
        r: [78, 90], gap: [-1, 3], w: [4.5, 11], h: [10, 21],
        lit: '#544748', shade: '#151112' },

      
      
      
      { id: 'park-wall', form: 'tower', depth: 1,
        r: [96, 110], gap: [1, 6], w: [8, 15], d: [10, 18], h: [19, 33],
        lit: '#5b5568', shade: '#262437',
        setback: 0.25, crowns: ['flat', 'flat', 'flat', 'water-tower', 'penthouse'],
        windows: 0.5 },

      
      
      
      { id: 'midtown', form: 'tower', depth: 2,
        r: [134, 156], gap: [6, 22], w: [10, 19], d: [11, 20], h: [34, 66],
        lit: '#63617a', shade: '#3a3850',
        setback: 0.8, crowns: ['step', 'step', 'water-tower', 'spire', 'flat'],
        windows: 0.26 },

      
      
      { id: 'far-towers', form: 'tower', depth: 3,
        r: [180, 208], gap: [22, 62], w: [13, 24], d: [14, 24], h: [46, 92],
        lit: '#736f88', shade: '#56536c',
        setback: 0.7, crowns: ['spire', 'step', 'twin-mast', 'flat'],
        windows: 0 },
    ],
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    marks: [
      { form: 'suspension-bridge', turn: 0.39, r: 88,
        towerGap: 96, approach: 26, deckY: 38, towerH: 68, pierW: 27,
        
        
        
        
        lit: '#4a3a36', shade: '#1d1517',
        
        
        
        cableLit: '#8d7c6b', cableShade: '#5b4e45' },
    ],
    
    
    
    
    
    window: {
      floorPitch: 3.4, colPitch: 2.9, w: 1.15, h: 1.75, margin: 1.8, sill: 5.5,
      darkFloor: 0.18, bias: [0.45, 1.4], crownLit: 0.14,
      warm: ['#ffd88c', '#ffc167', '#fff1c8'],
      cool: '#c8dcff', coolMix: 0.12,
    },
  },

  
  
  
  
  
  'farm-horizon': {
    id: 'farm-horizon',
    skirt: '#cfdcec',
    bands: [
      { id: 'hedgerow', form: 'shrub', depth: 0,
        r: [84, 96], gap: [-0.5, 4], w: [2.5, 7], h: [3.5, 8],
        clump: [4, 14], clumpGap: [20, 70],
        lit: '#6d7d74', shade: '#2e3c37' },
      { id: 'shelter-belt', form: 'conifer', depth: 1,
        r: [108, 136], gap: [0, 8], w: [4, 8], h: [14, 30],
        clump: [3, 9], clumpGap: [34, 120],
        lit: '#6f8577', shade: '#3a4f45' },
      
      
      
      { id: 'far-woods', form: 'conifer', depth: 2,
        r: [152, 192], gap: [-3, 3], w: [5, 10], h: [12, 22],
        clump: [8, 26], clumpGap: [30, 150],
        lit: '#8b9a99', shade: '#65757a' },

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      { id: 'rolling-downs', form: 'downs', depth: 3,
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        r: [176, 194], gap: [-46, -12], w: [150, 230], h: [14, 46],
        depthOfW: 0.12, cols: 11,
        lit: '#b8bfc4', shade: '#95a0a9' },
    ],
    marks: [
      
      
      
      { form: 'silo',  turn: 0.13, r: 120, w: 5.5, h: 19, lit: '#a8b3bb', shade: '#6b7883' },
      { form: 'silo',  turn: 0.155, r: 124, w: 5, h: 16, lit: '#a8b3bb', shade: '#6b7883' },
      { form: 'barn',  turn: 0.20, r: 116, w: 20, d: 12, h: 9, lit: '#8a4b46', shade: '#4a2b2c' },
      { form: 'barn',  turn: 0.64, r: 140, w: 16, d: 10, h: 8, lit: '#7d5a4a', shade: '#452f2b' },

      
      
      
      
      
      
      
      
      
      
      
      

      
      
      
      { form: 'windmill', turn: 0.44, r: 128, w: 8, h: 17, sail: 13,
        lit: '#9a7a5c', shade: '#54402f',
        
        
        
        capLit: '#4a3a2c', capShade: '#241b14' },

      
      
      
      { form: 'grain-elevator', turn: 0.88, r: 152, silos: 6, w: 6.5, h: 26,
        lit: '#c2b49c', shade: '#7d7161' },

      
      
      
      
      { form: 'barn',  turn: 0.315, r: 132, w: 22, d: 13, h: 10,
        lit: '#96524a', shade: '#4f2d2b' },
      { form: 'silo',  turn: 0.325, r: 136, w: 5.2, h: 21,
        lit: '#b6a68d', shade: '#77685a' },
      { form: 'barn',  turn: 0.335, r: 128, w: 12, d: 8, h: 6,
        lit: '#7a6552', shade: '#41352b' },

      
      
      { form: 'barn',  turn: 0.52, r: 178, w: 18, d: 11, h: 8,
        lit: '#8d7565', shade: '#4d4038' },

      
      
      { form: 'barn',  turn: 0.02, r: 112, w: 24, d: 14, h: 11,
        lit: '#9c574c', shade: '#54302c' },
    ],
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    lines: [
      { turn: 0.06, from: 74, to: 168, postPitch: 5.4, drift: 0.05 },
      { turn: 0.23, from: 74, to: 196, postPitch: 5.6, drift: -0.04 },
      { turn: 0.42, from: 74, to: 150, postPitch: 5.4, drift: -0.07 },
      { turn: 0.58, from: 74, to: 204, postPitch: 5.5, drift: 0.06 },
      { turn: 0.77, from: 74, to: 176, postPitch: 5.4, drift: 0.09 },
    ],
    fence: { postW: 0.8, postH: 2.6, railH: 0.35, railY: 1.9,
             lit: '#6c7278', shade: '#333940' },
  },

  
  
  
  
  
  'alpine-range': {
    id: 'alpine-range',
    skirt: '#c3d3e4',
    bands: [
      
      
      
      
      { id: 'near-range', form: 'peak', depth: 0,
        r: [88, 112], gap: [-6, 20], w: [26, 46], h: [30, 54],
        lit: '#5a6274', shade: '#262d3a',
        cap: 0.5, capLit: '#b2c4d7', capShade: '#7f96b1' },
      { id: 'mid-range', form: 'peak', depth: 1,
        r: [132, 158], gap: [-8, 36], w: [38, 66], h: [54, 88],
        lit: '#6f7c92', shade: '#4a5568',
        cap: 0.62, capLit: '#a9bccf', capShade: '#8ba0b8' },
      
      
      { id: 'far-range', form: 'peak', depth: 2,
        r: [162, 180], gap: [-10, 54], w: [48, 64], h: [74, 118],
        lit: '#9aa8bc', shade: '#7f8da2', cap: 0 },
    ],
  },

  
  
  
  
  
  
  
  'floe-horizon': {
    id: 'floe-horizon',
    skirt: '#c2ccdf',
    bands: [
      { id: 'pressure-ridges', form: 'ridge', depth: 0,
        r: [84, 102], gap: [14, 58], w: [10, 26], h: [1.6, 4.2],
        lit: '#8493ae', shade: '#3f4a66' },
      { id: 'bergs', form: 'berg', depth: 1,
        r: [128, 192], gap: [46, 150], w: [14, 34], h: [8, 22],
        lit: '#93a0b8', shade: '#5b6884',
        cap: '#b99a92' },
      { id: 'far-bergs', form: 'berg', depth: 2,
        r: [180, 206], gap: [90, 240], w: [22, 44], h: [12, 30],
        lit: '#97a3b8', shade: '#79869e', cap: '#a2999b' },
    ],
  },
});

export function getBackdrop(mapId) {
  return BACKDROPS[getMap(mapId).backdrop] ?? null;
}




export const MAPS = Object.freeze({

  'snow-farm': {
    id: 'snow-farm',
    name: 'Snow Farm',
    blurb: 'Two barns, a frozen field and a tractor lane. The original.',
    emoji: '🚜',
    sky: 'farm-day',
    backdrop: 'farm-horizon',
    ground: VOX.GRASS,
    patch: { vox: VOX.ICE, count: 24, size: [2, 4] },
    terrain: 'flat',
    centre: { vox: VOX.HILL, style: 'knoll' },
    base: { style: 'barn', sign: 'BARN' },
    cover: ['pillar', 'crate', 'wall'],
    
    
    hay: { count: 6 },
    wear: true,
    props: { snowman: 8, 'fence-post': 40, 'hay-bale': 6, barrel: 7, crate: 9 },
    kit: { trough: 5, 'milk-churn': 6, 'log-pile': 4, 'chopping-block': 3,
           wheelbarrow: 3, 'feed-sack': 7, scarecrow: 2, 'weather-vane': 2,
           'oil-drum': 4, kennel: 2, 'sandbag-wall': 6, 'ammo-crate': 5 },
    
    
    
    
    ambient: { kind: 'goose', count: 22, clusters: 5 },
  },

  'icy-mountain': {
    id: 'icy-mountain',
    name: 'Icy Mountain',
    blurb: 'Stepped granite terraces, a wind-scoured saddle and pines that '
         + 'grow out of the rock. Height is the cover.',
    emoji: '⛰️',
    sky: 'alpine-thin-air',
    backdrop: 'alpine-range',
    ground: VOX.GRASS,
    patch: { vox: VOX.ICE, count: 30, size: [3, 6] },
    
    
    
    terrain: 'terraces',
    centre: { vox: VOX.ROCK, style: 'summit' },
    base: { style: 'cabin', sign: 'CAMP' },
    
    
    
    
    
    
    
    cover: ['spire', 'iceWall', 'boulder', 'crate'],
    
    
    
    hay: { count: 5 },
    wear: false,
    props: { snowman: 3, barrel: 4, crate: 6 },
    kit: { pine: 16, cairn: 8, 'ski-pair': 5, 'oil-drum': 4, 'log-pile': 3,
           'ice-axe-rack': 3, sled: 3, 'sandbag-wall': 7, 'ammo-crate': 5 },
    
    
    
    
    
    
    ambient: { kind: 'goat', count: 18, clusters: 7, prefer: 'high' },
  },

  'central-park-rink': {
    id: 'central-park-rink',
    name: 'Central Park Rink',
    blurb: 'An outdoor rink in the middle of the park at dusk: dasher boards, '
         + 'hex-paver paths, bare trees and benches. The ice is the arena.',
    emoji: '⛸️',
    sky: 'manhattan-dusk',
    backdrop: 'manhattan-skyline',
    ground: VOX.PAVER,
    patch: { vox: VOX.GRASS, count: 22, size: [3, 6] },
    
    
    
    terrain: 'rink',
    
    
    
    
    
    
    centre: { vox: VOX.WOOD, style: 'bandstand' },
    base: { style: 'pavilion', sign: 'BOX' },
    cover: ['bench', 'planter', 'wall'],
    
    
    
    hay: { count: 5 },
    wear: false,
    props: { crate: 5, barrel: 3, snowman: 4 },
    kit: { 'lamp-post': 12, bench: 10, 'bare-tree': 14, 'hot-dog-cart': 2,
           'skate-rack': 4, bin: 6, 'pretzel-stand': 1,
           'sandbag-wall': 5, 'ammo-crate': 4 },
    
    
    
    
    
    
    
    
    
    ambient: { kind: 'pigeon', count: 22, clusters: 6, prefer: 'paved', spread: 2 },
  },

  arctic: {
    id: 'arctic',
    name: 'Arctic Floe',
    blurb: 'Pack ice under a sun that will not set, pressure ridges, two '
         + 'igloos — and penguins, standing very still, watching you.',
    emoji: '🐧',
    sky: 'polar-twilight',
    backdrop: 'floe-horizon',
    ground: VOX.ICE,
    patch: { vox: VOX.GRASS, count: 28, size: [3, 7] },
    
    
    terrain: 'floes',
    centre: { vox: VOX.IGLOO, style: 'berg' },
    base: { style: 'igloo', sign: 'IGLOO' },
    
    
    
    
    
    cover: ['berg', 'ridge', 'boulder', 'crate'],
    
    
    
    hay: { count: 5 },
    wear: false,
    props: { snowman: 5, crate: 4, barrel: 3 },
    kit: { 'ice-hole': 7, 'fish-crate': 6, 'ice-axe-rack': 2, sled: 5,
           'oil-drum': 4, 'radio-mast': 2, 'sandbag-wall': 6, 'ammo-crate': 4 },
    
    
    
    ambient: { kind: 'penguin', count: 26, clusters: 6 },
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  'farm-maze': {
    id: 'farm-maze',
    name: 'Farm Maze',
    short: 'Farm Maze',
    blurb: 'A corn maze you can only cross by double-jumping the hedges. '
         + 'Power-ups sit on top. Something is in here with you.',
    emoji: '🌽',
    sky: 'farm-day',
    backdrop: 'farm-horizon',
    ground: VOX.GRASS,
    
    
    
    patch: { vox: VOX.ICE, count: 14, size: [2, 3] },
    terrain: 'maze',
    
    
    
    
    navJump: 2,
    
    
    centre: { vox: VOX.HILL, style: 'knoll' },
    base: { style: 'barn', sign: 'BARN' },
    
    
    
    
    
    
    cover: [],
    coverFromTerrain: true,
    hay: { count: 4 },
    
    
    
    
    wear: false,
    props: { 'fence-post': 18, 'hay-bale': 8, barrel: 5, crate: 6 },
    
    
    
    
    
    
    
    kit: { minotaur: 2, medusa: 3, waymarker: 9, scarecrow: 5, 'log-pile': 3,
           'chopping-block': 2, wheelbarrow: 2, 'feed-sack': 5,
           'weather-vane': 2, 'sandbag-wall': 4, 'ammo-crate': 5 },
    ambient: { kind: 'goose', count: 14, clusters: 4 },
  },
});

export const MAP_IDS = Object.freeze(Object.keys(MAPS));

export function getMap(id) {
  return MAPS[id] ?? MAPS[DEFAULT_MAP];
}

export function getSky(mapId) {
  return SKIES[getMap(mapId).sky] ?? SKIES['farm-day'];
}








export const FRICTION = Object.freeze({
  'snow-farm': 0.96,
  'icy-mountain': 0.945,        
  'central-park-rink': 0.976,   
  
  
  
  
  
  'farm-maze': 0.93,
  arctic: 0.968,
});

export function frictionFor(mapId) {
  return FRICTION[mapId] ?? FRICTION[DEFAULT_MAP];
}
