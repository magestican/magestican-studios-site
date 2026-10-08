






import { SPECIES } from './species.js';

export const WET = new Set(['fish', 'jelly', 'octopus', 'ray', 'crab', 'turtle', 'frog']);
export const DARK = new Set(['bat', 'ghost']);
export const WET_SHARE = 0.35, DARK_SHARE = 0.3;
export const WATER_TILES = new Set([0, 1, 12, 13]); 

let byHabitat = null;
const families = () => {
  if (!byHabitat) {
    byHabitat = { wet: [], dark: [], plan: {} };
    for (const s of SPECIES) if (s.stage === 1 && s.fam != null && s.fam < 100 && !(s.fam >= 1 && s.fam <= 3)) { 
      byHabitat.plan[s.fam] = s.look.plan;
      if (WET.has(s.look.plan)) byHabitat.wet.push(s.fam);
      if (DARK.has(s.look.plan)) byHabitat.dark.push(s.fam);
    }
  }
  return byHabitat;
};


export function habitatFamily(fam, at, rand) {
  const H = families();
  if (at.dark && !DARK.has(H.plan[fam]) && rand() < DARK_SHARE) return H.dark[Math.floor(rand() * H.dark.length)];
  if (at.wet && !WET.has(H.plan[fam]) && rand() < WET_SHARE) return H.wet[Math.floor(rand() * H.wet.length)];
  return fam;
}


export function nearWater(x, y, typeAt, r = 2) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const t = typeAt(Math.floor(x) + dx, Math.floor(y) + dy); if (t != null && WATER_TILES.has(t)) return true; }
  return false;
}
