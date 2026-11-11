







const D = 'assets/art/biome/l15-comic';


export const GORGE_SLOTS = {
  'silkspan-far': { kind: 'plate', file: 'silkspan-far.webp', ready: true },
  'moss-ledge': { kind: 'texture', file: 'texture.png', ready: true }, 
  'gorge-rock': { kind: 'texture', file: 'texture.png', ready: true }, 
  'leaf-near': { kind: 'prop', ready: true },
  'rock-near': { kind: 'prop', ready: false },
  'fern-tuft': { kind: 'prop', ready: true }, 
  'root-tangle': { kind: 'prop', ready: false },
  'rock-spire': { kind: 'prop', ready: false },
  'mushroom-shelf': { kind: 'prop', ready: false },
  cocoon: { kind: 'prop', ready: false },
  'dew-strand': { kind: 'prop', ready: false },
  'dandelion-seed': { kind: 'prop', ready: false },
};






const PROPS = [
  { name: 'leaf-back', src: 'leaf-near', layer: 'back', every: 9, h: 3.4, clip: true, tint: 0x8a7fb8 },
  { name: 'leaf-sprig', src: 'leaf-near', layer: 'ground', every: 11, h: 1.3, clip: true },
  { name: 'leaf-front', src: 'leaf-near', layer: 'front', every: 7, h: 2.6, clip: true, tint: 0x3a2d5c },
  
  { name: 'fern-tuft', layer: 'ground', every: 13, h: 1.5, clip: true },
  { name: 'fern-back', src: 'fern-tuft', layer: 'ground', every: 15, h: 2.8, clip: true, tint: 0x8a7fb8 },
];








export function gardenNightSway(tint, seed) {
  const items = [
    { name: 'leaf-back', src: 'leaf-near', layer: 'back', every: 10, h: 2.6, clip: true, tint, haze: NIGHT_HAZE }, 
    { name: 'fern-back', src: 'fern-tuft', layer: 'back', every: 14, h: 2.4, clip: true, tint, haze: NIGHT_HAZE },
  ];
  return { dir: D, clips: 'assets/anim/scenery/l15/clips', seed, items: items.filter((p) => GORGE_SLOTS[p.src].ready) };
}

const NIGHT_HAZE = 0.6;











export function gardenFrontLeaf(tint) {
  if (!GORGE_SLOTS['leaf-near'].ready) return [];
  const clips = 'assets/anim/scenery/l15/clips';
  return [
    { name: 'leaf-near-front', src: 'leaf-near', dir: D, clips, layer: 'front', every: 9, h: 2.4, clip: true, tint, haze: FRONT_HAZE },
  ];
}

const FRONT_HAZE = 0.85;

export const GORGE = {
  plate: `${D}/silkspan-far/silkspan-far.webp`,
  plateAspect: 16 / 9,
  plateZoom: 1.5, 
  
  plateNight: 0x5a4c8c,
  sky: 0xd9a6d8,
  top: { map: `${D}/moss-ledge/texture.png`, normal: `${D}/moss-ledge/normal.png`, tint: 0xffffff, unit: 2 },
  
  solid: { map: `${D}/gorge-rock/texture.png`, normal: `${D}/gorge-rock/normal.png`, tint: 0xffffff, unit: 3 },
  props: {
    dir: D,
    clips: 'assets/anim/scenery/l15/clips',
    seed: 15,
    items: PROPS.filter((p) => GORGE_SLOTS[p.src ?? p.name].ready),
  },
};
