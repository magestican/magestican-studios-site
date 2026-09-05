







import mudgeeFlats from './mudgeeFlats.js';

export const MAPS = Object.freeze({
  mudgeeFlats,
});


export const MAP_IDS = Object.freeze(Object.keys(MAPS).sort());


export function mapsForPlayers(n) {
  return MAP_IDS.filter((id) => MAPS[id].players >= n);
}

export const DEFAULT_MAP = 'mudgeeFlats';
