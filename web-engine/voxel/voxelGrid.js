// 3D voxel data grid. Just data — mesh generation is in game code.
//
// Cell ids are small ints:
//   0 = AIR (walkable)
//   1 = GRASS      (ground)
//   2 = STONE      (wall)
//   3 = DIRT       (floor/ramp)
//   4 = ICE        (visual only in Team Bondage; the game is ice-drift always-on)
//   5 = WOOD       (obstacles, crates)
//   6 = BASE_RED
//   7 = BASE_BLUE
//   8 = FLAG_STAND_RED
//   9 = FLAG_STAND_BLUE

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
  HILL: 11,   // centre-map elevated tile where the chicken slingshot spawns
});

// Base RGB palette for each voxel type. Actual final colouring in the game
// slightly perturbs these per-instance for a hand-drawn feel.
export const VOX_COLOR = Object.freeze({
  [VOX.AIR]:            [0, 0, 0],
  [VOX.GRASS]:          [0xe8, 0xf3, 0xff],   // snowy ground (was green grass)
  [VOX.STONE]:          [0x6d, 0x70, 0x76],
  [VOX.DIRT]:           [0x7a, 0x5c, 0x3d],
  [VOX.ICE]:            [0xb8, 0xe0, 0xef],
  [VOX.WOOD]:           [0x8a, 0x5a, 0x2b],
  [VOX.BASE_RED]:       [0xb7, 0x3a, 0x2a],
  [VOX.BASE_BLUE]:      [0x33, 0x6b, 0xbf],
  [VOX.FLAG_STAND_RED]: [0xd0, 0x50, 0x3e],
  [VOX.FLAG_STAND_BLUE]:[0x4f, 0x8a, 0xdb],
  [VOX.HAY]:            [0xd7, 0xb8, 0x3d],
  [VOX.HILL]:           [0x6a, 0x54, 0x38],
});

export class VoxelGrid {
  constructor(sizeX, sizeY, sizeZ) {
    this.sx = sizeX; this.sy = sizeY; this.sz = sizeZ;
    // Flat Uint8Array indexed as x + y*sx + z*sx*sy.
    this.data = new Uint8Array(sizeX * sizeY * sizeZ);
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  idx(x, y, z) { return x + y * this.sx + z * this.sx * this.sy; }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return VOX.STONE;   // out of bounds = solid
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
