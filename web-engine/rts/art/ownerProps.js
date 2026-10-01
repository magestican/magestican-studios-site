














































import { PROP_CATALOGUE } from './propCatalogue.js';
import { CELLS_PER_SIDE, CELL_MM } from '../maps/mapFormat.js';










export const OWNER_PROPS = Object.freeze({
  yield: Object.freeze({
    land: Object.freeze([
      'fence', 'fence', 'fence', 'gate', 'haystack', 'haystack',
      'trough', 'tank', 'stockyard', 'logPile', 'powerPole', 'shed', 'shedRust',
    ]),
    
    water: Object.freeze(['tank', 'trough', 'powerPole', 'fence']),
  }),
  herd: Object.freeze({
    land: Object.freeze([
      'wattle', 'wattle', 'saltbush', 'saltbush', 'gumYoung', 'gumYoung',
      'hedgeLow', 'rockPile', 'stump', 'boulder',
    ]),
    
    
    water: Object.freeze(['reeds', 'reeds', 'reeds', 'saltbush']),
  }),
});

for (const side of Object.keys(OWNER_PROPS)) {
  for (const kind of Object.keys(OWNER_PROPS[side])) {
    for (const id of OWNER_PROPS[side][kind]) {
      if (!PROP_CATALOGUE[id]) throw new Error(`ownerProps: no such prop '${id}'`);
    }
  }
}









export const PROPS_PER_100_CELLS = 22;












export const MAX_OWNER_PROPS = 1800;


const CENTRE_CLEAR_MM = 26000;


function cellHash(cx, cy, salt) {
  let h = (cx * 73856093) ^ (cy * 19349663) ^ (salt * 83492791);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}











export function ownerPropsFor(map, sIdx, faction) {
  const table = OWNER_PROPS[faction];
  const sector = map.sectors[sIdx];
  if (!table || !sector) return [];
  const list = sector.kind === 'water' ? table.water : table.land;
  const out = [];

  
  
  
  const want = Math.max(3, Math.round((sector.cells * PROPS_PER_100_CELLS) / 100));
  const step = Math.max(1, Math.floor(sector.cells / want));
  let seen = 0;

  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      if (map.sectorOfCell[cy * CELLS_PER_SIDE + cx] !== sIdx) continue;
      seen += 1;
      if (seen % step !== 0) continue;

      
      
      const h = cellHash(cx, cy, sIdx + 1);
      const jx = ((h & 1023) / 1023 - 0.5) * (CELL_MM * 0.7);
      const jy = (((h >>> 10) & 1023) / 1023 - 0.5) * (CELL_MM * 0.7);
      const x = Math.trunc(cx * CELL_MM + CELL_MM / 2 + jx);
      const y = Math.trunc(cy * CELL_MM + CELL_MM / 2 + jy);

      
      
      
      const dx = x - sector.cx;
      const dy = y - sector.cy;
      if (dx * dx + dy * dy < CENTRE_CLEAR_MM * CENTRE_CLEAR_MM) continue;

      out.push({
        kind: list[(h >>> 20) % list.length],
        x,
        y,
        
        
        scale: 900 + (((h >>> 6) & 255) * 250) / 255,
      });
    }
  }
  return out;
}








export function allOwnerProps(map, sectors) {
  const out = [];
  for (let i = 0; i < sectors.length && out.length < MAX_OWNER_PROPS; i += 1) {
    const s = sectors[i];
    if (s.owner === null || !s.ownerFaction) continue;
    for (const p of ownerPropsFor(map, i, s.ownerFaction)) {
      if (out.length >= MAX_OWNER_PROPS) break;
      out.push(p);
    }
  }
  return out;
}
