
































































import { CELLS_PER_SIDE, CELL_MM } from '../maps/mapFormat.js';




import { CLIFF_STEP_DM, slopeDm } from '../maps/elevation.js';
import { FIELD_MM } from '../fixed.js';






import { PROP_CATALOGUE as PROPS, PROP_IDS, propDraw } from './propCatalogue.js';


export const SPAWN_CLEAR_MM = 70_000;











export const SURROUND_MM = 650_000;


const SURROUND_STEP_MM = 55_000;












export const MAX_PROPS = 6000;








export const SURROUND_RESERVE = 1200;


export function hash(a, b, c) {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (b >>> 0), 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h ^ (c >>> 0), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h >>> 0;
}


const pick = (a, b, c, n) => hash(a, b, c) % n;









const jitter = (a, b, c, span) => Math.trunc((hash(a, b, c) % (span * 2 + 1)) - span);


const WANDER_MM = 75_000;



















export function wander(seed, line, atMm, span) {
  const i = Math.floor(atMm / WANDER_MM);
  const f = (atMm - i * WANDER_MM) / WANDER_MM;
  const sm = f * f * (3 - 2 * f);
  const a = (hash(seed ^ 0x6a09e667, line, i) % (span * 2 + 1)) - span;
  const b = (hash(seed ^ 0x6a09e667, line, i + 1) % (span * 2 + 1)) - span;
  return Math.trunc(a + (b - a) * sm);
}









export function seedOf(mapId) {
  let h = 0x811c9dc5;
  const s = String(mapId);
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

































export const DRESSINGS = Object.freeze([
  { id: 'hedge', share: 26, prop: 'hedge', per100m: 9, gapIn: 6 },
  { id: 'hedgeLow', share: 14, prop: 'hedgeLow', per100m: 9, gapIn: 6 },
  { id: 'fence', share: 24, prop: 'fence', per100m: 9, gapIn: 7 },
  { id: 'treeline', share: 15, prop: 'cypress', per100m: 6, gapIn: 3 },
  { id: 'bare', share: 21, prop: null, per100m: 0, gapIn: 0 },
]);















export function stepsOnEdge(per100m, seed, edgeId) {
  const milli = Math.trunc((per100m * CELL_MM) / 100);
  const whole = Math.trunc(milli / 1000);
  const frac = milli - whole * 1000;
  return whole + (frac > 0 && hash(seed ^ 0x7f4a7c15, edgeId, 5) % 1000 < frac ? 1 : 0);
}

const DRESS_TOTAL = DRESSINGS.reduce((n, d) => n + d.share, 0);


export function dressingFor(seed, sa, sb) {
  const lo = Math.min(sa, sb);
  const hi = Math.max(sa, sb);
  let r = hash(seed ^ 0x5bd1e995, lo, hi) % DRESS_TOTAL;
  for (const d of DRESSINGS) {
    if (r < d.share) return d;
    r -= d.share;
  }
  return DRESSINGS[DRESSINGS.length - 1];
}









const LOOSE = Object.freeze({
  land: ['saltbush', 'saltbush', 'stump', 'boulder', 'wattle', 'gumYoung', 'gum', 'haystack'],
  keystone: ['boulder', 'boulder', 'rockPile', 'rockPile', 'saltbush', 'stump'],
  water: ['reeds'],
});


const SHORE = Object.freeze(['reeds', 'reeds', 'reeds', 'logPile', 'saltbush']);
const SHORE_PER_100M = 11;


const COPSE = Object.freeze(['gum', 'gum', 'gumOld', 'ironbark', 'gumYoung', 'deadGum', 'cypress']);


const LANDMARK = Object.freeze(['windmill', 'windmill', 'silo']);
const STEADING = Object.freeze(['tank', 'shed', 'shedRust', 'haystack', 'trough', 'logPile', 'gate']);


const SURROUND_KIT = Object.freeze([
  'gum', 'gum', 'gumOld', 'ironbark', 'cypress', 'cypress', 'gumYoung',
  'saltbush', 'deadGum', 'hedge', 'hedge', 'saltbush',
]);






















const CHARACTERS = Object.freeze([
  {
    id: 'wooded',
    groves: 4,
    
    looseIn: 6,
    kit: ['saltbush', 'gumYoung', 'gumYoung', 'wattle', 'stump', 'gum', 'saltbush'],
  },
  {
    id: 'stony',
    groves: 2,
    looseIn: 5,
    kit: ['boulder', 'boulder', 'rockPile', 'saltbush', 'stump', 'deadGum'],
  },
  {
    id: 'grazed',
    groves: 2,
    looseIn: 10,
    kit: ['saltbush', 'trough', 'stump', 'wattle', 'saltbush', 'boulder'],
  },
  {
    id: 'cropped',
    groves: 1,
    looseIn: 13,
    kit: ['haystack', 'haystack', 'saltbush', 'stump', 'logPile'],
  },
]);


export function characterOf(seed, sectorId) {
  return CHARACTERS[hash(seed ^ 0x1b873593, sectorId, 77) % CHARACTERS.length];
}
















const OUTCROP = Object.freeze(['boulder', 'rockPile', 'rockPile', 'deadGum', 'stump', 'boulder']);


const OUTCROP_IN = 2;




















const SCREE = Object.freeze(['boulder', 'saltbush', 'stump', 'rockPile', 'saltbush', 'boulder']);
const SCREE_STEP_DM = 25;
const SCREE_IN = 6;







const RING12 = Object.freeze([
  [1000, 0], [866, 500], [500, 866], [0, 1000], [-500, 866], [-866, 500],
  [-1000, 0], [-866, -500], [-500, -866], [0, -1000], [500, -866], [866, -500],
]);





















export const DEFAULT_FACINGS = 4;






const DIR_ALONG_X = () => 0;
const DIR_ALONG_Z = (facings) => facings / 4;



























export function scatterProps(map, opts = {}) {
  const seed = opts.seed === undefined ? seedOf(map.id) : (opts.seed >>> 0);
  const max = opts.max === undefined ? MAX_PROPS : opts.max;
  const wantSurround = opts.surround !== false;
  const facings = opts.facings || DEFAULT_FACINGS;
  if (facings % 4 !== 0) {
    
    
    
    
    throw new Error('scatter: ' + facings + ' facings is not a multiple of 4');
  }
  const dirX = DIR_ALONG_X(facings);
  const dirZ = DIR_ALONG_Z(facings);
  const props = [];
  let dropped = 0;

  const cells = map.sectorOfCell;
  const sectors = map.sectors;
  const spawns = (map.spawns || []).map((s) => [s.x, s.y]);

  
  const clear = (x, y) => {
    for (let i = 0; i < spawns.length; i += 1) {
      const dx = x - spawns[i][0];
      const dy = y - spawns[i][1];
      if (dx * dx + dy * dy < SPAWN_CLEAR_MM * SPAWN_CLEAR_MM) return false;
    }
    return true;
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  let cap = max - SURROUND_RESERVE;

  const add = (x, y, kind, variant, scale, sector) => {
    if (props.length >= cap) { dropped += 1; return; }
    if (!PROPS[kind]) throw new Error(`scatter: no prop '${kind}'`);
    
    
    
    
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`scatter: '${kind}' has a non-finite position (${x}, ${y})`);
    }
    if (sector >= 0 && !clear(x, y)) return;
    props.push({
      x: Math.trunc(x),
      y: Math.trunc(y),
      kind,
      variant: ((variant % facings) + facings) % facings,
      
      
      
      
      
      
      scale: Math.round(scale * propDraw(kind)),
      sector,
    });
  };

  const sizeAt = (a, b, c) => 850 + (hash(a, b, c) % 351);

  
  
  
  
  
  
  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      const here = cells[cy * CELLS_PER_SIDE + cx];
      for (let e = 0; e < 2; e += 1) {
        const nx = cx + (e === 0 ? 1 : 0);
        const ny = cy + (e === 0 ? 0 : 1);
        if (nx >= CELLS_PER_SIDE || ny >= CELLS_PER_SIDE) continue;
        const there = cells[ny * CELLS_PER_SIDE + nx];
        if (there === here) continue;

        const kindA = sectors[here].kind;
        const kindB = sectors[there].kind;
        
        
        
        
        
        
        if (kindA === 'water' && kindB === 'water') continue;
        const wet = kindA === 'water' || kindB === 'water';
        const dress = wet ? null : dressingFor(seed, here, there);
        
        
        
        const edgeId = (cy * CELLS_PER_SIDE + cx) * 2 + e;
        
        
        const steps = stepsOnEdge(wet ? SHORE_PER_100M : dress.per100m, seed, edgeId);
        if (steps === 0) continue;

        for (let k = 0; k < steps; k += 1) {
          
          
          const gapIn = wet ? 3 : dress.gapIn;
          const g = hash(seed ^ 0x243f6a88, edgeId, k) % gapIn;
          if (g === 0) {
            
            
            if (!wet && hash(seed ^ 0x13198a2e, edgeId, k) % 4 === 0) {
              const t = ((k + 0.5) / steps);
              const ax = e === 0 ? (cx + 1) * CELL_MM : (cx + t) * CELL_MM;
              const az = e === 0 ? (cy + t) * CELL_MM : (cy + 1) * CELL_MM;
              add(ax, az, 'gate', e === 0 ? dirZ : dirX,
                sizeAt(seed, edgeId, k + 90), here);
            }
            continue;
          }

          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          const t = (k + 0.5) / steps;
          const along = jitter(seed ^ 0x85a308d3, edgeId, k, 3200);
          const pair = Math.min(here, there) * 256 + Math.max(here, there);
          const runMm = e === 0 ? (cy + t) * CELL_MM : (cx + t) * CELL_MM;
          const off = wander(seed, pair, runMm, 9000)
            + jitter(seed ^ 0x03707344, edgeId, k + 40, 2200);
          let x;
          let z;
          let dir;
          if (e === 0) {
            x = (cx + 1) * CELL_MM + off;
            z = (cy + t) * CELL_MM + along;
            dir = dirZ;
          } else {
            x = (cx + t) * CELL_MM + along;
            z = (cy + 1) * CELL_MM + off;
            dir = dirX;
          }

          if (wet) {
            
            const landIsHere = kindA !== 'water';
            const push = landIsHere ? -2600 : 2600;
            if (e === 0) x += push; else z += push;
            const kind = SHORE[hash(seed ^ 0x299f31d0, edgeId, k) % SHORE.length];
            const variant = PROPS[kind].role === 'line' ? dir : pick(seed, edgeId, k + 7, facings);
            add(x, z, kind, variant, sizeAt(seed, edgeId, k), landIsHere ? here : there);
            continue;
          }

          if (dress.id === 'treeline') {
            
            
            
            const kind = hash(seed ^ 0x082efa98, edgeId, k) % 3 === 0
              ? COPSE[hash(seed ^ 0xec4e6c89, edgeId, k) % COPSE.length]
              : 'cypress';
            add(x, z, kind, pick(seed, edgeId, k + 11, facings), sizeAt(seed, edgeId, k), here);
          } else {
            add(x, z, dress.prop, dir, sizeAt(seed, edgeId, k), here);
          }
        }
      }
    }
  }

  
  
  
  
  
  
  for (let s = 0; s < sectors.length; s += 1) {
    const sec = sectors[s];
    if (sec.kind === 'water') continue;
    const h = hash(seed ^ 0x38d01377, s, 3);
    
    if (h % 4 === 0) continue;
    const dir = RING12[h % 12];
    const r = 55_000 + (h >>> 8) % 40_000;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const cxm = sec.cx + Math.trunc((dir[0] * r) / 1000);
    const czm = sec.cy + Math.trunc((dir[1] * r) / 1000);
    const mark = LANDMARK[hash(seed, s, 17) % LANDMARK.length];
    add(cxm, czm, mark, pick(seed, s, 19, facings), sizeAt(seed, s, 21), s);
    
    
    
    
    
    
    const n = 3 + (h >>> 16) % 5;
    for (let k = 0; k < n; k += 1) {
      const d2 = RING12[hash(seed ^ 0x2e0b4482, s, k) % 12];
      const r2 = 16_000 + hash(seed, s, k + 60) % 30_000;
      const kind = STEADING[hash(seed ^ 0xa4093822, s, k) % STEADING.length];
      const variant = PROPS[kind].role === 'line'
        ? pick(seed, s, k + 31, facings) : pick(seed, s, k + 33, facings);
      add(cxm + Math.trunc((d2[0] * r2) / 1000), czm + Math.trunc((d2[1] * r2) / 1000),
        kind, variant, sizeAt(seed, s, k + 41), s);
    }
  }

  
  
  
  
  
  for (let s = 0; s < sectors.length; s += 1) {
    const sec = sectors[s];
    if (sec.kind === 'water') continue;
    
    
    
    
    const groves = characterOf(seed, s).groves + hash(seed ^ 0x03707344, s, 5) % 2;
    for (let g = 0; g < groves; g += 1) {
      const h = hash(seed ^ 0x64f98fa7, s, g);
      const dir = RING12[h % 12];
      const r = 30_000 + (h >>> 6) % 95_000;
      const gx = sec.cx + Math.trunc((dir[0] * r) / 1000);
      const gz = sec.cy + Math.trunc((dir[1] * r) / 1000);
      
      
      const n = 4 + (h >>> 18) % 5;
      for (let k = 0; k < n; k += 1) {
        const d2 = RING12[hash(seed ^ 0xbe5466cf, s * 8 + g, k) % 12];
        
        
        
        
        const r2 = 6000 + hash(seed, s * 8 + g, k + 70) % 30_000;
        add(gx + Math.trunc((d2[0] * r2) / 1000) + jitter(seed, s * 8 + g, k, 3000),
          gz + Math.trunc((d2[1] * r2) / 1000) + jitter(seed, s * 8 + g, k + 5, 3000),
          COPSE[hash(seed ^ 0x34e90c6c, s * 8 + g, k) % COPSE.length],
          pick(seed, s * 8 + g, k + 3, facings), sizeAt(seed, s * 8 + g, k), s);
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (map.heightOfCell) {
    const hgt = map.heightOfCell;
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const here = cy * CELLS_PER_SIDE + cx;
        for (let e = 0; e < 2; e += 1) {
          const nx = cx + (e === 0 ? 1 : 0);
          const ny = cy + (e === 0 ? 0 : 1);
          if (nx >= CELLS_PER_SIDE || ny >= CELLS_PER_SIDE) continue;
          const there = ny * CELLS_PER_SIDE + nx;
          const drop = hgt[here] - hgt[there];
          if ((drop < 0 ? -drop : drop) < CLIFF_STEP_DM) continue;
          const edgeId = here * 2 + e + 0x40000;
          if (hash(seed ^ 0x0801f2e2, edgeId, 1) % OUTCROP_IN !== 0) continue;
          
          const topX = drop > 0 ? cx : nx;
          const topY = drop > 0 ? cy : ny;
          const kind = OUTCROP[hash(seed ^ 0xd2e0eb15, edgeId, 2) % OUTCROP.length];
          add(topX * CELL_MM + CELL_MM / 2 + jitter(seed, edgeId, 3, 4200),
            topY * CELL_MM + CELL_MM / 2 + jitter(seed, edgeId, 4, 4200),
            kind, pick(seed, edgeId, 5, facings), sizeAt(seed, edgeId, 6),
            cells[topY * CELLS_PER_SIDE + topX]);
        }
      }
    }
  }

  
  
  
  
  
  if (map.heightOfCell) {
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const idx = cy * CELLS_PER_SIDE + cx;
        const sec = sectors[cells[idx]];
        if (sec.kind === 'water') continue;
        const slope = slopeDm(map, cx, cy);
        
        
        
        if (slope < SCREE_STEP_DM || slope >= CLIFF_STEP_DM) continue;
        const h = hash(seed ^ 0x5c3ee2f1, idx, 2);
        if (h % SCREE_IN !== 0) continue;
        const kind = SCREE[(h >>> 9) % SCREE.length];
        add(cx * CELL_MM + CELL_MM / 2 + jitter(seed, idx, 6, 4600),
          cy * CELL_MM + CELL_MM / 2 + jitter(seed, idx, 7, 4600),
          kind, pick(seed, idx, 8, facings), sizeAt(seed, idx, 9), cells[idx]);
      }
    }
  }

  
  
  
  
  
  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      const idx = cy * CELLS_PER_SIDE + cx;
      const s = cells[idx];
      const sec = sectors[s];
      if (sec.kind === 'water') continue;
      const h = hash(seed ^ 0x452821e6, idx, 1);
      
      
      
      const ch = characterOf(seed, s);
      if (h % (sec.kind === 'keystone' ? 12 : ch.looseIn) !== 0) continue;
      const table = sec.kind === 'keystone' ? LOOSE.keystone : ch.kit;
      const kind = table[(h >>> 8) % table.length];
      add(cx * CELL_MM + CELL_MM / 2 + jitter(seed, idx, 2, 9000),
        cy * CELL_MM + CELL_MM / 2 + jitter(seed, idx, 3, 9000),
        kind, pick(seed, idx, 4, facings), sizeAt(seed, idx, 5), s);
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  if (wantSurround) {
    cap = max;                 
    const lo = -SURROUND_MM;
    const hi = FIELD_MM + SURROUND_MM;
    const n = Math.ceil((hi - lo) / SURROUND_STEP_MM);
    for (let gy = 0; gy < n; gy += 1) {
      for (let gx = 0; gx < n; gx += 1) {
        const x = lo + gx * SURROUND_STEP_MM + SURROUND_STEP_MM / 2;
        const z = lo + gy * SURROUND_STEP_MM + SURROUND_STEP_MM / 2;
        
        
        
        
        
        
        
        
        
        
        
        if (x > 25_000 && x < FIELD_MM - 25_000
          && z > 25_000 && z < FIELD_MM - 25_000) continue;
        const h = hash(seed ^ 0x9216d5d9, gy * 512 + gx, 9);
        if (h % 8 >= 5) continue;                    
        const kind = SURROUND_KIT[(h >>> 7) % SURROUND_KIT.length];
        const variant = (h >>> 12) % facings;
        
        
        
        
        
        const jx = x + jitter(seed, gy * 512 + gx, 10, 22_000);
        const jz = z + jitter(seed, gy * 512 + gx, 11, 22_000);
        if (jx > 25_000 && jx < FIELD_MM - 25_000
          && jz > 25_000 && jz < FIELD_MM - 25_000) continue;
        add(jx, jz, kind, variant, sizeAt(seed, gy * 512 + gx, 12), -1);
      }
    }
  }

  return { props, dropped };
}





















export function columnFor(prop, yawSteps, facings = DEFAULT_FACINGS) {
  const step = facings / 4;
  return ((prop.variant + yawSteps * step) % facings + facings) % facings;
}












export function depthKey(prop, yawSteps) {
  
  
  
  
  
  
  
  
  
  
  switch (yawSteps & 3) {
    case 1: return prop.x;      
    case 2: return -prop.y;     
    case 3: return -prop.x;     
    default: return prop.y;     
  }
}


export const SCATTER_KINDS = Object.freeze([...new Set([
  ...DRESSINGS.map((d) => d.prop).filter(Boolean),
  ...Object.values(LOOSE).flat(), ...SHORE, ...COPSE, ...LANDMARK,
  ...STEADING, ...SURROUND_KIT, 'gate',
])].sort());


export const SCATTER_KINDS_OK = SCATTER_KINDS.every((k) => PROP_IDS.includes(k));
