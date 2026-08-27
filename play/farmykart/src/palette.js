




















export const HOUSE = Object.freeze({
  night:   0x1c1a17,
  gold:    0xf4c95d,
  barnRed: 0xb73a2a,
  skyBlue: 0x7cb0ff,
  snow:    0xe8f3ff,
  hay:     0xf5d53a,
  floor:   0x0f0e0c,   
  ceiling: 0xf6f1e6,   
});

export const PALETTE = Object.freeze({
  
  
  
  
  
  
  
  
  
  
  night:      0x1c1a17,
  ceiling:    0xf6f1e6,
  barnRed:    0xb73a2a,
  gold:       0xf4c95d,

  
  
  
  
  
  road:       0x6d5b45,
  roadDark:   0x5a4a37,   
  roadLight:  0x87735a,   
  kerbA:      0xb73a2a,   
  kerbB:      0xf6f1e6,
  shoulder:   0x7d8a4a,   
  line:       0xf6f1e6,

  
  grass:      0x5f8b3f,
  grassDark:  0x4a6f31,
  grassLight: 0x7ba750,
  stubble:    0xc7a94f,   
  mud:        0x6b5741,
  water:      0x3f6f86,

  
  
  
  
  
  
  
  
  
  
  
  
  
  snow:       0xdce9f7,
  snowCrest:  0xf2f8ff,
  snowHollow: 0x93b2d1,
  ice:        0xb8e0ef,

  
  barn:       0xb73a2a,
  barnRoof:   0x3f3a33,
  fence:      0x8d7551,
  fenceDark:  0x6b5940,
  hay:        0xf5d53a,
  haybale:    0xd8bb4a,
  sunflower:  0xf4c95d,
  sunflowerC: 0x5a4326,
  tree:       0x3d6b2e,
  treeTrunk:  0x5b4630,
  silo:       0xc8c2b4,

  
  skyTop:     0x4f92e8,
  skyHaze:    0xbcd9f7,
  sun:        0xfff3d0,
  cloud:      0xf6f1e6,

  
  
  
  
  tyre:       0x2b2723,
  chrome:     0xd8d2c4,
  engine:     0x4a4239,
  
  
  
  spark0:     0xf6f1e6,
  spark1:     0xf4c95d,
  spark2:     0xff8b3d,
  spark3:     0x7cb0ff,   
                          
  boostFlame: 0xf4c95d,
  dust:       0xc9b48f,
  shieldGlow: 0x7cb0ff,
  hitStar:    0xf4c95d,
});


export const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;






export const DRIFT_TIER_COLOURS = Object.freeze([
  PALETTE.spark0, PALETTE.spark1, PALETTE.spark2, PALETTE.spark3,
]);
