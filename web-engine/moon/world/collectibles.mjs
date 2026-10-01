
































import { draw } from '../economy/math.mjs';
import { CONTAINERS, FINDS } from '../economy/tables.mjs';
import { nameOf } from '../play/names.mjs';
import { CLEARING_RADIUS_M, ELEMENTS, GENERATED_COUNT, SYSTEM_SEED, layoutOf, planetSystem } from './planets.mjs';

const U32 = 2 ** 32;
const TAU = Math.PI * 2;
const unit = (seed, ...keys) => draw(seed, ...keys) / U32;





export const FINDS_BY_ELEMENT = Object.freeze({
  boulders: Object.freeze(['gem', 'moonRock', 'stone']),
  orchard: Object.freeze(['goldenApple', 'wood', 'berries']),
  pines: Object.freeze(['wood', 'mushroom', 'moonRock']),
  meadow: Object.freeze(['berries', 'mushroom', 'stone']),
});











export const FINDS_BY_BIOME = Object.freeze({
  rolling: 'berries',
  cratered: 'gem',
  mesa: 'stone',
  ridged: 'moonRock',
  dunes: 'wood',
  lakes: 'mushroom',
});
export const BIOME_FIND_K = 2;



export const FIND_KINDS = Object.freeze(Object.keys(FINDS));

export const COLLECTIBLES = Object.freeze({
  
  
  
  treasureDensity: 0.0022,
  commonDensity: 0.006,
  
  minPerKind: 1,
  maxPerKind: 6,
  
  edgeMarginM: 2.0,
  propClearM: 1.1,
  spacingM: 2.4,
  
  
  
  radiusM: 0.38,
  candidates: 400,
});

const cache = new Map();





export function findsOnPlanet(planet, cfg = COLLECTIBLES) {
  if (planet.home) return Object.freeze([]);
  const key = `${planet.id}|${planet.seed}|${cfg === COLLECTIBLES ? 'default' : JSON.stringify(cfg)}`;
  if (!cache.has(key)) cache.set(key, place(planet, cfg));
  return cache.get(key);
}


export function kindsOn(planet) {
  if (planet.home) return Object.freeze([]);
  const all = new Set();
  for (const e of planet.elements) for (const k of FINDS_BY_ELEMENT[ELEMENTS[e].id]) all.add(k);
  const own = biomeFindOn(planet);
  if (own) all.add(own);
  return Object.freeze(FIND_KINDS.filter((k) => all.has(k))
    .map((kind) => Object.freeze({ kind, treasure: Boolean(FINDS[kind].treasure), biome: kind === own })));
}


export function biomeFindOn(planet) {
  return (!planet.home && planet.biome && FINDS_BY_BIOME[planet.biome]) || null;
}


export function treasureOn(planet) {
  const t = kindsOn(planet).find((k) => k.treasure);
  return t ? t.kind : null;
}






export function describeFinds(planet) {
  const kinds = kindsOn(planet);
  if (!kinds.length) return null;
  const names = kinds.map((k) => nameOf(FINDS[k.kind].good));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `${list} lie about here`;
}

function place(planet, cfg) {
  const layout = layoutOf(planet);
  const props = layout.placements();
  const maxR = planet.radius - planet.rimWidth - cfg.edgeMarginM;
  const area = Math.PI * (maxR * maxR - CLEARING_RADIUS_M * CLEARING_RADIUS_M);
  const out = [];
  for (const { kind, treasure, biome } of kindsOn(planet)) {
    const density = (treasure ? cfg.treasureDensity : cfg.commonDensity) * (biome ? BIOME_FIND_K : 1);
    const want = Math.max(cfg.minPerKind, Math.min(cfg.maxPerKind, Math.round(area * density)));
    let found = 0;
    
    
    for (let k = 0; k < cfg.candidates && found < want; k++) {
      const a = unit(planet.seed, 'find', kind, k, 'angle') * TAU;
      const u = unit(planet.seed, 'find', kind, k, 'radius');
      const d = Math.sqrt(CLEARING_RADIUS_M ** 2 + u * (maxR ** 2 - CLEARING_RADIUS_M ** 2));
      const x = Math.round(Math.sin(a) * d * 100) / 100;
      const z = Math.round(Math.cos(a) * d * 100) / 100;
      
      
      if (props.some((p) => Math.hypot(p.x - x, p.z - z) < cfg.propClearM)) continue;
      if (out.some((f) => Math.hypot(f.x - x, f.z - z) < cfg.spacingM)) continue;
      
      
      
      const styles = CONTAINERS[FINDS[kind].container];
      out.push({ kind, x, z, r: cfg.radiusM, style: styles[draw(planet.seed, 'find', kind, k, 'style') % styles.length] });
      found += 1;
    }
  }
  return Object.freeze(out.map((f, id) => Object.freeze({
    id, ...f, container: FINDS[f.kind].container, y: layout.heightAt(f.x, f.z),
    
    
    rotY: Math.round(unit(planet.seed, 'find', f.kind, id, 'rotY') * TAU * 1000) / 1000,
  })));
}






export function systemFinds(systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) {
  const out = [];
  for (const planet of planetSystem(systemSeed, count)) {
    for (const f of findsOnPlanet(planet)) out.push(Object.freeze({ planet: planet.id, kind: f.kind }));
  }
  return Object.freeze(out);
}





export function offsetOf(planetId, systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) {
  let n = 0;
  for (const planet of planetSystem(systemSeed, count)) {
    if (planet.id === planetId) return n;
    n += findsOnPlanet(planet).length;
  }
  return n;
}
