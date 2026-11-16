







export const FIELD_W = 390;
export const FIELD_H = 844;


export const TILE_PX = 130;





export const GROUND_TINT = 0.70;

export const GROUND_TILES = Object.freeze(['dust_plain', 'concrete_apron']);



export function groundTileAt(col, row) {
  const r = ((row % 6) + 6) % 6;
  if ((r === 2 || r === 3) && (col === 1 || col === 2)) return 'concrete_apron';
  return 'dust_plain';
}
