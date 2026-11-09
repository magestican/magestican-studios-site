







const D = 'assets/art/biome/canopy-comic';


export const CANOPY_SLOTS = {
  
  
  'canopy-far': { kind: 'plate', file: 'canopy-far.webp', ready: true },
  
  'canopy-leaves': { kind: 'texture', file: 'texture.png', ready: true },
  
  
  'leaf-yellow': { kind: 'prop', ready: false },
  blossom: { kind: 'prop', ready: true }, 
  
  
  twig: { kind: 'prop', ready: false },
  'bracket-fungus': { kind: 'prop', ready: false },
};


const BACK = 0xe6d7c4; 
const PROPS = [
  { name: 'leaf-back', src: 'leaf-yellow', layer: 'back', every: 7, h: 3.0, clip: true, tint: BACK },
  { name: 'twig', layer: 'back', every: 11, h: 2.2, clip: true, tint: BACK },
  
  { name: 'bracket-fungus', layer: 'ground', every: 16, h: 0.7 },
  { name: 'blossom', layer: 'ground', every: 9, h: 0.5, clip: true },
  { name: 'leaf-front', src: 'leaf-yellow', layer: 'front', every: 10, h: 2.4, clip: true, tint: 0x3d3220 },
];

const ready = (name) => CANOPY_SLOTS[name].ready;


export const CANOPY_COMIC = {
  plate: ready('canopy-far') ? `${D}/canopy-far/canopy-far.webp` : null,
  
  plateZoom: ready('canopy-far') ? 1.5 : null,
  plateCropL: ready('canopy-far') ? 0.0125 : 0,
  
  plateHaze: ready('canopy-far') ? { color: 0xfff0dc, opacity: 0.5 } : null,
  top: ready('canopy-leaves')
    ? { map: `${D}/canopy-leaves/texture.png`, normal: `${D}/canopy-leaves/normal.png`, tint: 0xffffff, unit: 2 }
    : null,
  props: {
    dir: D,
    clips: 'assets/anim/scenery/canopy/clips',
    seed: 2,
    items: PROPS.filter((p) => ready(p.src ?? p.name)),
  },
};
