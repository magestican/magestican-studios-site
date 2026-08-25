













export const ANIME = Object.freeze({
  primary: '#e0c48f',    
  secondary: '#f8f4e6',  
  accent: '#7fa8d4',     
  shadow: '#221812',     
  highlight: '#ffffff',  
});





export const LINE = ANIME.shadow;

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh) => {
    const x = (pa >> sh) & 255;
    const y = (pb >> sh) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${[16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('')}`;
}



export const KITS = Object.freeze({
  light: Object.freeze({
    skin: ANIME.primary,
    hair: mix(ANIME.primary, ANIME.shadow, 0.45),
    hairDark: mix(ANIME.primary, ANIME.shadow, 0.66),
    hairLit: mix(ANIME.primary, ANIME.secondary, 0.30),
    top: ANIME.secondary,
    topShade: mix(ANIME.secondary, ANIME.accent, 0.32),
    trim: mix(ANIME.accent, ANIME.shadow, 0.30),
    legs: mix(ANIME.accent, ANIME.shadow, 0.35),
    legsShade: mix(ANIME.accent, ANIME.shadow, 0.55),
    limb: ANIME.primary,
    shoe: mix(ANIME.secondary, ANIME.shadow, 0.20),
    iris: mix(ANIME.accent, ANIME.shadow, 0.30),
    blush: mix(ANIME.primary, ANIME.secondary, 0.15),
  }),
  dark: Object.freeze({
    skin: mix(ANIME.primary, ANIME.secondary, 0.35),
    hair: ANIME.shadow,
    hairDark: ANIME.shadow,
    hairLit: mix(ANIME.shadow, ANIME.accent, 0.38),
    top: mix(ANIME.accent, ANIME.shadow, 0.62),
    topShade: mix(ANIME.accent, ANIME.shadow, 0.78),
    trim: mix(ANIME.secondary, ANIME.accent, 0.25),
    legs: mix(ANIME.shadow, ANIME.secondary, 0.28),
    legsShade: mix(ANIME.shadow, ANIME.secondary, 0.14),
    limb: mix(ANIME.primary, ANIME.secondary, 0.35),
    shoe: mix(ANIME.secondary, ANIME.shadow, 0.10),
    iris: mix(ANIME.accent, ANIME.shadow, 0.55),
    blush: mix(ANIME.primary, ANIME.secondary, 0.05),
  }),
});



export const FX = Object.freeze({
  burst: mix(ANIME.secondary, ANIME.primary, 0.45),
  burstCore: ANIME.highlight,
  ring: mix(ANIME.secondary, ANIME.accent, 0.30),
  speed: mix(ANIME.secondary, ANIME.highlight, 0.5),
  slash: mix(ANIME.secondary, ANIME.highlight, 0.55),
  shock: mix(ANIME.accent, ANIME.shadow, 0.25),
});
