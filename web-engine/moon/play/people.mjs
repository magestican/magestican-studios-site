















import { seedOf } from '../voice/mumble.mjs';


export const CAT_NAME = 'Felice';





export const MOLE_NAME = 'Cosimo';



export const PLAYER_BUILDS = Object.freeze(['female', 'male']);
export const PLAYER_NAMES = Object.freeze({ female: 'Aurora', male: 'Luca' });
export const PLAYER_DEFAULT_NAME = PLAYER_NAMES[PLAYER_BUILDS[0]];


export const FIRST_NAMES = Object.freeze({
  elephant: 'Beatrice',
  giraffe: 'Giulia',
  panda: 'Pietro',
  human: 'Lorenzo',
  pig: 'Peppino',
});



export const ITALIAN_NAMES = Object.freeze([
  'Alessandra', 'Alberto', 'Bianca', 'Carlo', 'Chiara', 'Dario', 'Elena', 'Enzo',
  'Francesca', 'Giorgio', 'Ilaria', 'Leonardo', 'Lucia', 'Marco', 'Martina', 'Matteo',
  'Nicoletta', 'Ottavio', 'Paola', 'Riccardo', 'Rosa', 'Salvatore', 'Serena', 'Sofia',
  'Tommaso', 'Valentina', 'Vittoria', 'Arturo', 'Caterina', 'Fabrizio', 'Graziella', 'Massimo',
]);



export const NAMES_OF_BUILD = Object.freeze({
  female: Object.freeze(['Alessandra', 'Bianca', 'Chiara', 'Elena', 'Francesca', 'Ilaria', 'Lucia', 'Martina', 'Nicoletta',
    'Paola', 'Rosa', 'Serena', 'Sofia', 'Valentina', 'Vittoria', 'Caterina', 'Graziella']),
  male: Object.freeze(['Alberto', 'Carlo', 'Dario', 'Enzo', 'Giorgio', 'Leonardo', 'Marco', 'Matteo', 'Ottavio',
    'Riccardo', 'Salvatore', 'Tommaso', 'Arturo', 'Fabrizio', 'Massimo']),
});


const pick = (key, build) => {
  const list = NAMES_OF_BUILD[build] || ITALIAN_NAMES;
  return list[seedOf(key) % list.length];
};







export function villagerName(villager, villagers = []) {
  if (!villager) return 'Someone';
  if (villager.name) return villager.name;
  const first = FIRST_NAMES[villager.species];
  const earlier = villagers.some((v) => v.species === villager.species && v.id < villager.id);
  if (first && !earlier) return first;
  return pick(`villager:${villager.species}:${villager.id}`, villagerBuild(villager, villagers));
}


export const customerName = (key, build) => pick(`customer:${key}`, build);




export const BUILDS_OF = Object.freeze({ human: PLAYER_BUILDS });

export const FIRST_BUILDS = Object.freeze({ human: 'male' });







export function villagerBuild(villager, villagers = []) {
  if (!villager) return undefined;
  const builds = BUILDS_OF[villager.species];
  if (!builds) return undefined;
  if (builds.includes(villager.build)) return villager.build;
  const earlier = villagers.some((v) => v.species === villager.species && v.id < villager.id);
  if (!earlier && builds.includes(FIRST_BUILDS[villager.species])) return FIRST_BUILDS[villager.species];
  return builds[seedOf(`build:villager:${villager.species}:${villager.id}`) % builds.length];
}





export const CUSTOMER_SPECIES = Object.freeze(['human', 'pig', 'panda', 'human', 'elephant', 'giraffe']);
export const CUSTOMER_SEED_BASE = 101;






export function customerLooks(n, { worldSeed = 1 } = {}) {
  const start = seedOf(`customer-looks:${worldSeed}`) % CUSTOMER_SPECIES.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const species = CUSTOMER_SPECIES[(start + i) % CUSTOMER_SPECIES.length];
    const builds = BUILDS_OF[species];
    const build = builds ? builds[seedOf(`customer-build:${worldSeed}:${i}`) % builds.length] : undefined;
    out.push({ key: i, species, build, seed: CUSTOMER_SEED_BASE + i });
  }
  return out;
}



export const PLAYER_BUILD_KEY = 'fml.player.build';








export function choosePlayerBuild({ param = null, choose = false, stored = null } = {}) {
  if (PLAYER_BUILDS.includes(param)) return { build: param, ask: false, from: 'url' };
  const kept = PLAYER_BUILDS.includes(stored) ? stored : null;
  if (choose) return { build: kept || PLAYER_BUILDS[0], ask: true, from: 'choose' };
  if (kept) return { build: kept, ask: false, from: 'stored' };
  return { build: PLAYER_BUILDS[0], ask: true, from: 'first' };
}


export function customerLookFor(visitId, free) {
  if (!free || free.length === 0) return null;
  return free[seedOf(`customer-visit:${visitId}`) % free.length];
}
