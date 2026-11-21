







export const FIELD_W = 390;
export const FIELD_H = 844;


export const TILE_PX = 130;























export const NIGHT_MAX = 0.05;
export const STAGE_GROUND = Object.freeze([
  Object.freeze({ dir: 'stage1-ground/stage1_ground', base: 'dust_plain', strip: 'concrete_apron', tint: 0.095 }),
  Object.freeze({ dir: 'stages-ground/stage2_ground', base: 'salt_crust', strip: 'brine_stain', tint: 0.115 }),
  
  Object.freeze({ dir: 'stages-ground/stage3_ground', base: 'cinder_ash', strip: 'rust_deck', tint: 0.15 }),
  
  
  
  Object.freeze({ dir: 'stages-ground/stage4_ground', base: 'shallows', strip: 'shallows', tint: 0.095 }),
  Object.freeze({ dir: 'stages-ground/stage5_ground', base: 'crater_rock', strip: 'glass_scree', tint: 0.08 }),
]);


export const groundLum = (l, g) => l * g.tint * (1 - (g.veil || 0)) + (g.veil || 0) * (g.veilL || 0);


export const groundOf = (n) => STAGE_GROUND[Math.max(0, Math.min(STAGE_GROUND.length - 1, n | 0))];


export const GROUND_TILES = Object.freeze([STAGE_GROUND[0].base, STAGE_GROUND[0].strip]);



export function groundTileAt(col, row, stage = 0) {
  const g = groundOf(stage);
  const r = ((row % 6) + 6) % 6;
  if ((r === 2 || r === 3) && (col === 1 || col === 2)) return g.strip;
  return g.base;
}









export const FEATURE_EVERY = 4;






export const STAGE_FEATURES = Object.freeze([
  Object.freeze({ dir: 'ground-features/stage1_feat', tiles: Object.freeze(['cracked_mud']) }),
  Object.freeze({ dir: 'ground-features/stage2_feat', tiles: Object.freeze(['salt_ridges']) }),
  Object.freeze({ dir: 'ground-features/stage3_feat', tiles: Object.freeze(['slag_drift']) }),
  Object.freeze({ dir: 'ground-features/stage4_feat', tiles: Object.freeze([]),
    rejected: 'sandbar came back as blocky pixel steps and reef_shelf as flagstones; both poorer than shallows (versus.png 2026-11-21)' }),
  Object.freeze({ dir: 'ground-features/stage5_feat', tiles: Object.freeze(['fissure']) }),
]);
export const featuresOf = (n) => STAGE_FEATURES[Math.max(0, Math.min(STAGE_FEATURES.length - 1, n | 0))];






export function featureAt(col, row, stage = 0) {
  const f = featuresOf(stage);
  if (!f.tiles.length || groundTileAt(col, row, stage) !== groundOf(stage).base) return null;
  const pick = (c, r) => {
    let h = Math.imul(c + 11, 73856093) ^ Math.imul(r + 7919, 19349663) ^ Math.imul(stage + 1, 83492791);
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) % FEATURE_EVERY === 0 ? (h >>> 8) : -1;
  };
  const h = pick(col, row);
  if (h < 0) return null;
  
  if (pick(col - 1, row) >= 0 || pick(col, row - 1) >= 0) return null;
  return f.tiles[h % f.tiles.length];
}
