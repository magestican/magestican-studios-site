





















import { SeededRng } from '../../rng/seededRng.js';
import { MeshData } from '../mesh/meshData.mjs';
import { SEASONS } from '../palette/seasons.mjs';
import { apple, peach, cherry, goldenApple } from './kit/items/fruit.mjs';
import { seed, sapling } from './kit/items/garden.mjs';
import { juice, jam, sugar } from './kit/items/preserves.mjs';
import { coin, giftBox, moonRock, gem } from './kit/items/treasure.mjs';
import { shovel, axe, pickaxe, wateringCan, TOOL_GRIP } from './kit/items/tools.mjs';
import { wood, stone } from './kit/items/resources.mjs';
import { mushroom, berries, carrot, potato } from './kit/items/forage.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];




export const TOOLS = Object.freeze(['shovel', 'axe', 'pickaxe', 'wateringCan']);
export { TOOL_GRIP };

export const KINDS = Object.freeze(['seed', 'sapling', 'apple', 'peach', 'cherry', 'goldenApple',
  'juice', 'jam', 'sugar', 'coin', 'giftBox', 'moonRock', 'gem', ...TOOLS,
  'wood', 'stone', 'mushroom', 'berries', 'carrot', 'potato']);

const BUILDERS = { seed, sapling, apple, peach, cherry, goldenApple, juice, jam, sugar, coin, giftBox, moonRock, gem, shovel, axe, pickaxe, wateringCan, wood, stone, mushroom, berries, carrot, potato };

const FRUITS = Object.freeze(['apple', 'peach', 'cherry']);

export const VARIANTS = Object.freeze({
  seed: FRUITS, sapling: FRUITS, juice: Object.freeze([...FRUITS, 'orchard']), jam: FRUITS,
  apple: [null], peach: [null], cherry: [null], goldenApple: [null], sugar: [null],
  coin: [null], giftBox: [null], moonRock: [null], gem: [null],
  shovel: [null], axe: [null], pickaxe: [null], wateringCan: [null],
  wood: [null], stone: [null], mushroom: [null], berries: [null], carrot: [null], potato: [null],
});


export const SEASONAL = Object.freeze(['sapling']);


export const ITEM_OF_GOOD = Object.freeze({
  apple: { kind: 'apple', variant: null },
  peach: { kind: 'peach', variant: null },
  cherry: { kind: 'cherry', variant: null },
  appleSeed: { kind: 'seed', variant: 'apple' },
  peachSeed: { kind: 'seed', variant: 'peach' },
  cherrySeed: { kind: 'seed', variant: 'cherry' },
  appleJuice: { kind: 'juice', variant: 'apple' },
  peachJuice: { kind: 'juice', variant: 'peach' },
  cherryJuice: { kind: 'juice', variant: 'cherry' },
  orchardJuice: { kind: 'juice', variant: 'orchard' },
  appleJam: { kind: 'jam', variant: 'apple' },
  peachJam: { kind: 'jam', variant: 'peach' },
  cherryJam: { kind: 'jam', variant: 'cherry' },
  sugar: { kind: 'sugar', variant: null },
  goldenApple: { kind: 'goldenApple', variant: null },
  moonRock: { kind: 'moonRock', variant: null },
  gem: { kind: 'gem', variant: null },
  
  wood: { kind: 'wood', variant: null },
  stone: { kind: 'stone', variant: null },
  mushroom: { kind: 'mushroom', variant: null },
  berries: { kind: 'berries', variant: null },
  carrot: { kind: 'carrot', variant: null },
  potato: { kind: 'potato', variant: null },
});


export function itemOf(goodOrKind) {
  if (Object.hasOwn(ITEM_OF_GOOD, goodOrKind)) return ITEM_OF_GOOD[goodOrKind];
  if (KINDS.includes(goodOrKind)) return { kind: goodOrKind, variant: VARIANTS[goodOrKind][0] };
  throw new Error(`no item draws '${goodOrKind}'`);
}

export function generate({ seed = 1, season = 'summer', lod = 0, kind, variant } = {}) {
  if (!KINDS.includes(kind)) throw new Error(`unknown item kind '${kind}' (kinds: ${KINDS.join(', ')})`);
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const d = lod | 0;
  if (!(d >= 0 && d <= 2)) throw new Error(`unknown lod ${lod}`);
  const variants = VARIANTS[kind];
  const v = variant === undefined || variant === null || variant === '' ? variants[0] : variant;
  if (!variants.includes(v)) throw new Error(`item '${kind}' has no variant '${variant}' (variants: ${variants.join(', ')})`);
  const seasonal = SEASONAL.includes(kind);
  const label = `${kind}${v ? `-${v}` : ''}`;
  const key = `${label}|${seed}${seasonal ? `|${season}` : ''}`;
  const name = `item-${label}-${seed}-${season}-lod${d}`;
  
  
  const cached = BUILT.get(`${key}|${d}`);
  if (cached) return new MeshData(name).append(cached);
  const mesh = BUILDERS[kind]({
    seed, season, lod: d, variant: v, name, key,
    baseKey: `${label}|${seed}`,
    rng: new SeededRng(seed).child(`item-${label}`),
  });
  if (BUILT.size >= BUILT_MAX) BUILT.delete(BUILT.keys().next().value);
  BUILT.set(`${key}|${d}`, mesh);
  return new MeshData(name).append(mesh);
}

const BUILT = new Map();
const BUILT_MAX = 320;
