



import { ORCHARD_COMIC } from './orchardArt.js';

const D = 'assets/art/biome/plates-comic';


export const PLATE_SLOTS = {
  orchardDusk: { name: 'dusk-far', ready: true }, 
  antTrail: { name: 'anttrail-far', ready: true }, 
  puddle: { name: 'puddle-far', ready: true }, 
  
  vault: { name: 'vault-far', ready: false }, 
  stripecat: { name: 'stripecat-far', ready: false }, 
  hive: { name: 'hive-far', ready: false }, 
  desk: { name: 'desk-far', ready: false }, 
  machine: { name: 'machine-far', ready: false }, 
};



const HAZE = {
  orchardDusk: 0xffe2c8,
  antTrail: 0xf3ecf8,
  puddle: 0xfff0e0,
  vault: 0xf0d8b8,
  stripecat: 0xffe8cc,
  hive: 0xffdc90,
  desk: 0xffd2b0,
  machine: 0xd8dcf0,
};


const ORCHARD_TILES = new Set(['orchardDusk', 'antTrail', 'puddle']);



export function comicPlate(biome, tiles = ORCHARD_COMIC) {
  const s = PLATE_SLOTS[biome];
  const out = {};
  if (s?.ready) {
    out.plate = `${D}/${s.name}/${s.name}.webp`;
    out.plateZoom = 1.5;
    out.plateHaze = { color: HAZE[biome], opacity: 0.5 };
  }
  if (ORCHARD_TILES.has(biome) && tiles.top) out.top = tiles.top;
  if (ORCHARD_TILES.has(biome) && tiles.solid) out.solid = tiles.solid;
  return out;
}
