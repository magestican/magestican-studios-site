



import { ORCHARD_COMIC } from './orchardArt.js';

const D = 'assets/art/biome/plates-comic';


export const PLATE_SLOTS = {
  orchardDusk: { name: 'dusk-far', ready: true }, 
  antTrail: { name: 'anttrail-far', ready: true }, 
  puddle: { name: 'puddle-far', ready: false }, 
};



const HAZE = { orchardDusk: 0xffe2c8, antTrail: 0xf3ecf8, puddle: 0xfff0e0 };



export function comicPlate(biome) {
  const s = PLATE_SLOTS[biome];
  const out = {};
  if (s?.ready) {
    out.plate = `${D}/${s.name}/${s.name}.webp`;
    out.plateZoom = 1.5;
    out.plateHaze = { color: HAZE[biome], opacity: 0.5 };
  }
  if (ORCHARD_COMIC.top) out.top = ORCHARD_COMIC.top;
  if (ORCHARD_COMIC.solid) out.solid = ORCHARD_COMIC.solid;
  return out;
}
