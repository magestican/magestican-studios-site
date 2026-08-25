



















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







export const ANIME = Object.freeze({
  primary: '#e0c48f',    
  secondary: '#f8f4e6',  
  accent: '#7fa8d4',     
  shadow: '#221812',     
  highlight: '#ffffff',  
});


export const LINE = ANIME.shadow;

const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh) => {
    const x = (pa >> sh) & 255;
    const y = (pb >> sh) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${[16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('')}`;
};



export const KITS = Object.freeze({
  light: Object.freeze({
    skin: ANIME.primary,
    hair: mix(ANIME.primary, ANIME.shadow, 0.45),   
    top: ANIME.secondary,                            
    legs: mix(ANIME.accent, ANIME.shadow, 0.35),     
    limb: ANIME.primary,
    shoe: mix(ANIME.secondary, ANIME.shadow, 0.20),
    iris: mix(ANIME.accent, ANIME.shadow, 0.30),
  }),
  dark: Object.freeze({
    skin: mix(ANIME.primary, ANIME.secondary, 0.35),
    hair: ANIME.shadow,                              
    top: mix(ANIME.accent, ANIME.shadow, 0.62),      
    legs: mix(ANIME.shadow, ANIME.secondary, 0.28),
    limb: mix(ANIME.primary, ANIME.secondary, 0.35),
    shoe: mix(ANIME.secondary, ANIME.shadow, 0.10),
    iris: mix(ANIME.accent, ANIME.shadow, 0.55),
  }),
});


export const FX = Object.freeze({
  burst: mix(ANIME.secondary, ANIME.primary, 0.45),
  burstCore: ANIME.highlight,
  slash: mix(BIOMES.desert.exit, ANIME.shadow, 0.15),
});

export { mix };
