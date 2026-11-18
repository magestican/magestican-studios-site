






const D = 'assets/art/biome/phase-f';


export const PHASE_F_READY = {
  'stampede-house-far': false,
  'stampede-garden-far': false,
  'kitchen-tiles': false,
  'hallway-rug': false,
};


export const STAMPEDE_SWAP_X = 420;

const HOUSE_SKY = 0xe8c8a0;
const GARDEN_SKY = 0x9fdcff;


const plateUrl = (name) => `${D}/${name}/plate.webp`;






export function stampedeArt(ready = PHASE_F_READY) {
  const house = ready['stampede-house-far'];
  const garden = ready['stampede-garden-far'];
  if (!house && !garden) return null;
  return {
    ...(house ? { plate: plateUrl('stampede-house-far') } : {}),
    ...(garden ? { planePlate: plateUrl('stampede-garden-far') } : {}),
    plateAspect: 16 / 9,
    sky: HOUSE_SKY,
    planeSky: GARDEN_SKY,
    swapX: STAMPEDE_SWAP_X,
    top: null,
    solid: null,
  };
}


const texSpec = (name) => ({ map: `${D}/${name}/texture.png`, normal: `${D}/${name}/normal.png`, tint: 0xffffff });






export function trainFloorArt(ready = PHASE_F_READY) {
  return {
    tiles: ready['kitchen-tiles'] ? texSpec('kitchen-tiles') : null,
    rug: ready['hallway-rug'] ? texSpec('hallway-rug') : null,
  };
}


export function phaseFFiles(name) {
  return name.startsWith('stampede-') ? [plateUrl(name)] : [texSpec(name).map, texSpec(name).normal];
}
