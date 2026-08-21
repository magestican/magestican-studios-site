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
  GLASS: 12,  // see-through, solid to bodies + bullets; used to close barn roofs
  // -- ground WEAR (2026-08-21). The map is a working snow farm and until
  // now nothing on it showed that anyone had ever walked across it. These
  // three are ground-layer variants of GRASS/"snow": they sit at y=0, are
  // solid exactly like the snow they replace, and differ only in paint.
  TRODDEN:   13,  // churned packed snow + boot prints (path/apron variant A)
  TRODDEN_B: 14,  // ...variant B. Two tiles, because a recognisable feature
                  // repeated on a grid reads as wallpaper, and a boot print
                  // is the most recognisable feature we have ever painted.
  RUT:       15,  // one tractor tyre rut, running along +X
  // -- Materials the non-farm maps are made of (2026-08-21). Team Bondage
  // had exactly one map, so every voxel type in this list was a farm noun.
  // See web-engine/procgen/mapSpec.js.
  ROCK:      16,  // dark mountain granite — icy-mountain terraces and spires
  RINK:      17,  // polished rink ice, with the blue line and the face-off dot
  BOARDS:    18,  // rink dasher boards: white ply over a team kickplate
  PINE:      19,  // conifer needles, snow-laden
  PAVER:     20,  // Central Park hexagonal paver path
  IGLOO:     21,  // cut and stacked snow block
});

// The ground layer. Anything in here is a flat y=0 surface tile that ground
// wear is allowed to paint over — and, just as importantly, everything NOT
// in here (barn floors, hill, cover) is off limits to it.
export const GROUND_VOX = Object.freeze([
  VOX.GRASS, VOX.ICE, VOX.TRODDEN, VOX.TRODDEN_B, VOX.RUT,
  // The other maps' ground tiles. Membership here is what makes a tile
  // eligible for ground wear and for prop scatter, so a new map's floor has
  // to join or nothing will ever be placed on it.
  VOX.RINK, VOX.PAVER,
]);

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
  [VOX.HAY]:            [0xf5, 0xd5, 0x3a],   // brighter saturated yellow so hay bales are unmistakably distinct from grey/brown cover
  [VOX.HILL]:           [0x6a, 0x54, 0x38],
  [VOX.GLASS]:          [0xa8, 0xd8, 0xf0],   // pale ice-blue; rendered with alpha in voxelMesh.js
  // Wear tiles paint their own hue (they are in voxelMesh's SELF_COLOURED),
  // so these are reference values only — the renderer tints them white.
  [VOX.TRODDEN]:        [0xc2, 0xcd, 0xda],
  [VOX.TRODDEN_B]:      [0xc2, 0xcd, 0xda],
  [VOX.RUT]:            [0xb3, 0xc0, 0xcf],
  // Non-farm materials. All of these paint their own hue (they are in
  // voxelMesh's SELF_COLOURED), so these are reference values only.
  [VOX.ROCK]:           [0x4c, 0x4f, 0x57],
  [VOX.RINK]:           [0xdf, 0xf0, 0xfa],
  [VOX.BOARDS]:         [0xf0, 0xef, 0xe8],
  [VOX.PINE]:           [0x24, 0x4b, 0x38],
  [VOX.PAVER]:          [0x9b, 0x94, 0x88],
  [VOX.IGLOO]:          [0xe4, 0xee, 0xf6],
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
