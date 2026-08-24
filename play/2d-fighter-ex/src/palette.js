













export const BIOMES = Object.freeze({
  grass: Object.freeze({ floor: '#2d5a2e', wall: '#1e2b1f', door: '#8b6f2e', exit: '#f4c95d' }),
  cave: Object.freeze({ floor: '#4a3f36', wall: '#1a1512', door: '#6b533a', exit: '#d67c3e' }),
  desert: Object.freeze({ floor: '#c8a165', wall: '#5a4423', door: '#8a6a3a', exit: '#e8574a' }),
  ruins: Object.freeze({ floor: '#5a5560', wall: '#26232a', door: '#7a7280', exit: '#9dc6ff' }),
  forest: Object.freeze({ floor: '#324a2a', wall: '#14210f', door: '#6a4a2a', exit: '#b7e56a' }),
});


export const STAGE_BIOME = 'forest';




export const GRID_LINE = 'rgba(0, 0, 0, 0.10)';
export const CELL_PX = 24;





export const FIGHTERS = Object.freeze({
  light: Object.freeze({
    body: BIOMES.desert.floor,
    limb: BIOMES.desert.door,
    head: BIOMES.desert.floor,
    trim: BIOMES.forest.exit,
    edge: BIOMES.desert.wall,
  }),
  dark: Object.freeze({
    body: BIOMES.cave.wall,
    limb: BIOMES.ruins.floor,
    head: BIOMES.cave.wall,
    trim: BIOMES.cave.exit,
    edge: BIOMES.ruins.wall,
  }),
});



export const FX = Object.freeze({
  burst: BIOMES.grass.exit,
  burstCore: '#ffffff',
  slash: BIOMES.desert.exit,
});
