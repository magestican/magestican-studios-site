




























import { GENERATED_COUNT, SYSTEM_SEED, layoutOf, planetSystem } from './planets.mjs';
import { obstacleFor, penetration } from './collision.mjs';











const generated = (systemSeed, count) => planetSystem(systemSeed, count).filter((p) => p.id !== 0);





const KIND_OF_MODULE = Object.freeze({ tree: 'apple', peachTree: 'peach', pine: 'pine' });










const ECONOMY_STAGE = Object.freeze({ mature: 'fruiting' });
export const artStageOfPine = (stage) => (stage === 'fruiting' ? 'mature' : 'young');












export function wildOn(planet) {
  const trees = [];
  const rocks = [];
  const forage = [];
  layoutOf(planet).placements().forEach((p, index) => {
    if (p.role === 'tree') {
      const kind = KIND_OF_MODULE[p.module];
      
      
      
      if (!kind) throw new Error(`no tree kind for planet layout module '${p.module}'`);
      const stage = ECONOMY_STAGE[p.stage] || p.stage || 'fruiting';
      trees.push(Object.freeze({ kind, stage, spot: index, planet: planet.id }));
    } else if (p.role === 'rock') {
      rocks.push(Object.freeze({ spot: index, planet: planet.id }));
    } else if (p.role === 'forage') {
      forage.push(Object.freeze({ type: p.kind, spot: index, planet: planet.id }));
    }
  });
  return Object.freeze({ trees: Object.freeze(trees), rocks: Object.freeze(rocks), forage: Object.freeze(forage) });
}







export function systemWild(systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) {
  const trees = [];
  const rocks = [];
  const forage = [];
  for (const planet of generated(systemSeed, count)) {
    const w = wildOn(planet);
    trees.push(...w.trees);
    rocks.push(...w.rocks);
    forage.push(...w.forage);
  }
  return Object.freeze({ trees: Object.freeze(trees), rocks: Object.freeze(rocks), forage: Object.freeze(forage) });
}









function offsetIn(which, planetId, systemSeed, count) {
  let n = 0;
  for (const planet of generated(systemSeed, count)) {
    if (planet.id === planetId) return n;
    n += wildOn(planet)[which].length;
  }
  return n;
}

export const treeOffsetOf = (planetId, systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) => offsetIn('trees', planetId, systemSeed, count);
export const rockOffsetOf = (planetId, systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) => offsetIn('rocks', planetId, systemSeed, count);
export const forageOffsetOf = (planetId, systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) => offsetIn('forage', planetId, systemSeed, count);










export function wildBlocks(planet, x, z, r = 0.4) {
  if (!planet || planet.home || !Number.isFinite(x) || !Number.isFinite(z)) return false;
  
  for (const l of layoutOf(planet).LAKES || []) if (Math.hypot(x - l.x, z - l.z) < l.r + r) return true;
  for (const p of layoutOf(planet).placements()) {
    if (p.role !== 'tree' && p.role !== 'rock') continue;
    const ob = obstacleFor(p);
    if (ob && penetration(ob, x, z, r).depth > 0) return true;
  }
  return false;
}


export function describeWild(planet) {
  const w = wildOn(planet);
  const bits = [];
  if (w.trees.length) bits.push(`${w.trees.length} trees to fell`);
  if (w.rocks.length) bits.push(`${w.rocks.length} boulders to break`);
  if (w.forage.length) bits.push(`${w.forage.length} things growing`);
  if (!bits.length) return '';
  if (bits.length === 1) return bits[0];
  return `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}`;
}
