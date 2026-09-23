



export const BUDGETS = Object.freeze({
  heroCharacter: 6000,
  heroBuilding: 8000,
  tree: 3000,
  house: 4000,
  
  
  interior: 9000,
  dressing: 800,
  groundClump: 60,
});

export const LOD_RATIO = Object.freeze([1, 0.5, 0.15]);

export function budgetFor(tier, lod = 0) {
  if (!(tier in BUDGETS)) throw new Error(`unknown budget tier '${tier}'`);
  if (!(lod in LOD_RATIO)) throw new Error(`unknown lod ${lod}`);
  return Math.floor(BUDGETS[tier] * LOD_RATIO[lod]);
}
