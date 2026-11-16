







export const FIELD_W = 390;
export const FIELD_H = 844;


export const TILE_PX = 130;





export const GROUND_TINT = 0.70;






export const STAGE_GROUND = Object.freeze([
  Object.freeze({ dir: 'stage1-ground/stage1_ground', base: 'dust_plain', strip: 'concrete_apron', tint: GROUND_TINT }),
  Object.freeze({ dir: 'stages-ground/stage2_ground', base: 'salt_crust', strip: 'brine_stain', tint: 0.70 }),
]);


export const groundOf = (n) => STAGE_GROUND[Math.max(0, Math.min(STAGE_GROUND.length - 1, n | 0))];


export const GROUND_TILES = Object.freeze([STAGE_GROUND[0].base, STAGE_GROUND[0].strip]);



export function groundTileAt(col, row, stage = 0) {
  const g = groundOf(stage);
  const r = ((row % 6) + 6) % 6;
  if ((r === 2 || r === 3) && (col === 1 || col === 2)) return g.strip;
  return g.base;
}
