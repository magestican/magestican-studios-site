
















import { startFromPlacements } from '../economy/fromLayout.mjs';
import { placements } from './moonLayout.mjs';
import { forageSpots } from './forage.mjs';























export function homeMoon({ seed = 1, layout = placements(), spots = forageSpots(seed) } = {}) {
  const { wildTrees, rocks } = startFromPlacements(layout);
  return {
    wildTrees,
    rocks,
    
    
    forageSpots: spots.map(({ type }) => ({ type })),
  };
}
