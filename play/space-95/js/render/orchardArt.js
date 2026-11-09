








const D = 'assets/art/biome/l01-comic';


export const ORCHARD_SLOTS = {
  'orchard-far': { kind: 'plate', file: 'orchard-far.webp', ready: true }, 
  'orchard-turf': { kind: 'texture', file: 'texture.png', ready: false }, 
  'orchard-bark': { kind: 'texture', file: 'texture.png', ready: false }, 
  apple: { kind: 'prop', ready: true }, 
  'apple-branch': { kind: 'prop', ready: true }, 
  'grass-tuft': { kind: 'prop', ready: false },
  toadstool: { kind: 'prop', ready: false },
  pebble: { kind: 'prop', ready: false },
  'wreck-fin': { kind: 'prop', ready: false },
  'blossom-petal': { kind: 'prop', ready: false },
};




const BACK = 0xcdbfe0; 
const PROPS = [
  
  { name: 'apple-branch', layer: 'back', every: 10, h: 2.0, clip: true, tint: BACK },
  { name: 'pebble-back', src: 'pebble', layer: 'back', every: 13, h: 0.9, tint: BACK },
  { name: 'wreck-fin', layer: 'back', every: 45, h: 3.0, tint: BACK },
  { name: 'grass-tuft', layer: 'ground', every: 5, h: 0.9, clip: true },
  { name: 'apple-fallen', src: 'apple', layer: 'ground', every: 17, h: 0.6 },
  { name: 'toadstool', layer: 'ground', every: 19, h: 1.0 },
  { name: 'apple-hang', src: 'apple', layer: 'hang', every: 14, h: 0.8, clip: true },
  { name: 'blossom-petal', layer: 'air', every: 9, h: 0.4, clip: true },
  { name: 'grass-front', src: 'grass-tuft', layer: 'front', every: 8, h: 2.2, clip: true, tint: 0x2f3d24 },
];

const ready = (name) => ORCHARD_SLOTS[name].ready;
const skin = (name, unit) => ({ map: `${D}/${name}/texture.png`, normal: `${D}/${name}/normal.png`, tint: 0xffffff, unit });


export const ORCHARD_COMIC = {
  plate: ready('orchard-far') ? `${D}/orchard-far/orchard-far.webp` : null,
  
  plateZoom: ready('orchard-far') ? 1.5 : null,
  
  
  plateHaze: ready('orchard-far') ? { color: 0xeee4f7, opacity: 0.5 } : null,
  top: ready('orchard-turf') ? skin('orchard-turf', 2) : null,
  solid: ready('orchard-bark') ? skin('orchard-bark', 3) : null,
  props: {
    dir: D,
    clips: 'assets/anim/scenery/l01/clips',
    seed: 1,
    items: PROPS.filter((p) => ready(p.src ?? p.name)),
  },
};
