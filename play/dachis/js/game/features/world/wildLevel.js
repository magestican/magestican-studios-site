






import { BOSS_LEVEL } from '../../data/species.js';

export const BAND_UNDER = 2;       
export const REGION_CAP_OVER = 4;  



export const POCKET_UNDER = 4, POCKET_CAP_OVER = 5;
export function pocketBand(chapter) {
  if (!(chapter >= 1) || chapter > BOSS_LEVEL.length) return null;
  return [BOSS_LEVEL[chapter - 1] - POCKET_UNDER, BOSS_LEVEL[chapter - 1]];
}


export function regionBand(chapter) {
  if (!(chapter >= 2) || chapter > BOSS_LEVEL.length) return null;
  return [BOSS_LEVEL[chapter - 2] - BAND_UNDER, BOSS_LEVEL[chapter - 1] - BAND_UNDER];
}



export function wildLevel({ far = 0, caught = 0, rand = Math.random(), top = 1, initiated = false, floor = 0, chapter = 1, train = false } = {}) {
  if (floor) return floor;   
  if (train && pocketBand(chapter)) { 
    const [lo, hi] = pocketBand(chapter), cap = Math.min(hi, Math.max(lo, top + POCKET_CAP_OVER));
    return Math.min(cap, lo + Math.floor(rand * (hi - lo + 1)));
  }
  const band = regionBand(chapter);
  if (band) {
    const [lo, hi] = band;
    
    const cap = Math.min(hi, Math.max(lo, top + REGION_CAP_OVER));
    return Math.min(cap, lo + Math.floor(rand * (hi - lo + 1)));
  }
  const lvl = Math.floor(2 + far / 6.75 + caught * 0.15 + rand * 2.5);
  const max = top + (initiated ? 2 : 0);
  return lvl < 2 ? 2 : lvl > max ? max : lvl;
}






export const STAGE_MIX = { 1: [0.15, 0.085], 2: [0.17, 0.09], 3: [0.2, 0.1], 4: [0.23, 0.12], 5: [0.26, 0.14], 6: [0.3, 0.17], 7: [0.33, 0.21], 8: [0.35, 0.25] }; 

export function wildStage(chapter, lvl, r) {
  const [s2, s3] = STAGE_MIX[Math.max(1, Math.min(8, chapter | 0))] || STAGE_MIX[1];
  if (lvl > 30 && r < s3) return 3;
  if (lvl > 9 && r < s3 + s2) return 2;
  return 1;
}
