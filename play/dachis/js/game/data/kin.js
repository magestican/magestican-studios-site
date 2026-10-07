





import { FAMILY_COUNT } from './species.js';

export const KIN_SHARE = 0.35;   
export const KIN_RADIUS = 1.6;   




export function kinSpecies(sp) {
  if (!sp || typeof sp.fam !== 'number' || sp.fam < 0 || sp.fam >= FAMILY_COUNT) return null; 
  return sp.fam * 3 + 1; 
}
