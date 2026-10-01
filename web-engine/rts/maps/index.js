







import bindiRidge from './bindiRidge.js';
import mudgeeFlats from './mudgeeFlats.js';
import theReservoir from './theReservoir.js';

export const MAPS = Object.freeze({
  bindiRidge,
  mudgeeFlats,
  theReservoir,
});


export const MAP_IDS = Object.freeze(Object.keys(MAPS).sort());
















export const PLAYABLE_MAP_IDS = Object.freeze(
  MAP_IDS.filter((id) => MAPS[id].playable !== false),
);


export function mapsForPlayers(n) {
  return PLAYABLE_MAP_IDS.filter((id) => MAPS[id].players >= n);
}

export const DEFAULT_MAP = 'mudgeeFlats';
