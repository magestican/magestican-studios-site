






import { BOSS_LEVEL } from '../../data/species.js';

export const BAND_UNDER = 2;       
export const REGION_CAP_OVER = 4;  


export function regionBand(chapter) {
  if (!(chapter >= 2) || chapter > BOSS_LEVEL.length) return null;
  return [BOSS_LEVEL[chapter - 2] - BAND_UNDER, BOSS_LEVEL[chapter - 1] - BAND_UNDER];
}



export function wildLevel({ far = 0, caught = 0, rand = Math.random(), top = 1, initiated = false, floor = 0, chapter = 1 } = {}) {
  if (floor) return floor;   
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
