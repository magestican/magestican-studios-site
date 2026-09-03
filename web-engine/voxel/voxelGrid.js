













export const VOX = Object.freeze({
  AIR: 0,
  GRASS: 1,
  STONE: 2,
  DIRT: 3,
  ICE: 4,
  WOOD: 5,
  BASE_RED: 6,
  BASE_BLUE: 7,
  FLAG_STAND_RED: 8,
  FLAG_STAND_BLUE: 9,
  HAY: 10,
  HILL: 11,   
  GLASS: 12,  
  
  
  
  
  TRODDEN:   13,  
  TRODDEN_B: 14,  
                  
                  
  RUT:       15,  
  
  
  
  ROCK:      16,  
  RINK:      17,  
  BOARDS:    18,  
  PINE:      19,  
  PAVER:     20,  
  IGLOO:     21,  
  
  
  
  
  
  
  HEDGE:     22,
  
  
  
  
  
  
  
  
  
  
  
  
  
  TRACK:     23,
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  CRATE:     24,
});




export const GROUND_VOX = Object.freeze([
  VOX.GRASS, VOX.ICE, VOX.TRODDEN, VOX.TRODDEN_B, VOX.RUT,
  
  
  
  VOX.RINK, VOX.PAVER, VOX.TRACK,
]);



export const VOX_COLOR = Object.freeze({
  [VOX.AIR]:            [0, 0, 0],
  [VOX.GRASS]:          [0xe8, 0xf3, 0xff],   
  [VOX.STONE]:          [0x6d, 0x70, 0x76],
  [VOX.DIRT]:           [0x7a, 0x5c, 0x3d],
  [VOX.ICE]:            [0xb8, 0xe0, 0xef],
  [VOX.WOOD]:           [0x8a, 0x5a, 0x2b],
  
  
  
  [VOX.CRATE]:          [0xc9, 0x9a, 0x5c],
  [VOX.BASE_RED]:       [0xb7, 0x3a, 0x2a],
  [VOX.BASE_BLUE]:      [0x33, 0x6b, 0xbf],
  [VOX.FLAG_STAND_RED]: [0xd0, 0x50, 0x3e],
  [VOX.FLAG_STAND_BLUE]:[0x4f, 0x8a, 0xdb],
  [VOX.HAY]:            [0xf5, 0xd5, 0x3a],   
  [VOX.HILL]:           [0x6a, 0x54, 0x38],
  [VOX.GLASS]:          [0xa8, 0xd8, 0xf0],   
  
  
  [VOX.TRODDEN]:        [0xc2, 0xcd, 0xda],
  [VOX.TRODDEN_B]:      [0xc2, 0xcd, 0xda],
  [VOX.RUT]:            [0xb3, 0xc0, 0xcf],
  
  
  [VOX.ROCK]:           [0x4c, 0x4f, 0x57],
  [VOX.RINK]:           [0xdf, 0xf0, 0xfa],
  [VOX.BOARDS]:         [0xf0, 0xef, 0xe8],
  [VOX.PINE]:           [0x24, 0x4b, 0x38],
  [VOX.PAVER]:          [0x9b, 0x94, 0x88],
  
  
  
  
  [VOX.TRACK]:          [0xa9, 0xb3, 0xc0],
  [VOX.IGLOO]:          [0xe4, 0xee, 0xf6],
  
  
  
  [VOX.HEDGE]:          [0x33, 0x5c, 0x2e],
});

export class VoxelGrid {
  constructor(sizeX, sizeY, sizeZ) {
    this.sx = sizeX; this.sy = sizeY; this.sz = sizeZ;
    
    this.data = new Uint8Array(sizeX * sizeY * sizeZ);
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  idx(x, y, z) { return x + y * this.sx + z * this.sx * this.sy; }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return VOX.STONE;   
    return this.data[this.idx(x, y, z)];
  }

  set(x, y, z, v) {
    if (!this.inBounds(x, y, z)) return;
    this.data[this.idx(x, y, z)] = v;
  }

  fillBox(x0, y0, z0, x1, y1, z1, v) {
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
    const za = Math.min(z0, z1), zb = Math.max(z0, z1);
    for (let z = za; z <= zb; z++)
      for (let y = ya; y <= yb; y++)
        for (let x = xa; x <= xb; x++)
          this.set(x, y, z, v);
  }

  isSolid(x, y, z) {
    const v = this.get(x | 0, y | 0, z | 0);
    return v !== VOX.AIR;
  }
}
