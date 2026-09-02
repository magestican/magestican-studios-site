































import { PALETTE } from '../palette.js';












const MUD = {
  fog: { colour: 0xc9cdd2, near: 260, far: 820 },
  backdrop: { near: PALETTE.hillMud, fog: 0xc9cdd2 },
  hedge: PALETTE.hedgeMud,
  leaf: 0x3a5c2c,
  snowCaps: false,
  shoulder: PALETTE.mud,
  rock: PALETTE.rock,
  ash: 0x4c443c,
  cliff: { face: PALETTE.rock, lip: PALETTE.rockLip },
  marker: { post: PALETTE.marker, cap: PALETTE.markerWarn },
  bank: { bank: PALETTE.mud, crest: PALETTE.hedgeMud, face: PALETTE.rock },
  water: { deep: 0x1d3a38, shallow: 0x4a7d6f, foam: 0xcfd3b6 },
  dust: {
    road: { colour: 0x7a6a52, rate: 20, size: 0.22, life: 0.40, additive: false },
    off: { colour: PALETTE.mudDark, rate: 46, size: 0.48, life: 0.80, additive: false },
  },
  spray: { colour: 0xcfd3b6, additive: false, rate: 30, size: 0.32, life: 0.60 },
  bale: PALETTE.haybale,
  minimap: { ground: PALETTE.mudDark, tuft: PALETTE.hedgeMud },
  speedAdditive: false,
  shortcut: { seed: 0x5c07c2, base: PALETTE.mudDark, dark: PALETTE.mudWet, tuft: PALETTE.shortcutTuft },
  wet: null,
  rain: null,
};

export const THEMES = Object.freeze({
  summer: {
    fog: { colour: 0xd3e8fb, near: 340, far: 980 },
    backdrop: { near: PALETTE.hillNear, fog: 0xd3e8fb },
    hedge: PALETTE.hedge,
    leaf: PALETTE.tree,
    snowCaps: false,
    shoulder: PALETTE.shoulder,
    rock: PALETTE.rock,
    ash: 0x4c443c,
    cliff: { face: PALETTE.rock, lip: PALETTE.rockLip },
    marker: { post: PALETTE.marker, cap: PALETTE.markerWarn },
    bank: { bank: PALETTE.grassDark, crest: PALETTE.grass, face: PALETTE.rock },
    water: { deep: 0x1b4b6b, shallow: 0x59a8c4, foam: 0xe6f2fb },
    dust: {
      road: { colour: 0xb5a184, rate: 18, size: 0.22, life: 0.38, additive: false },
      off: { colour: PALETTE.dust, rate: 44, size: 0.50, life: 0.72, additive: false },
    },
    spray: { colour: 0xe8f0f4, additive: false, rate: 30, size: 0.30, life: 0.55 },
    bale: PALETTE.haybale,
    minimap: { ground: PALETTE.grass, tuft: PALETTE.grassDark },
    speedAdditive: false,
    shortcut: { seed: 0x5c07c1, base: PALETTE.shortcut, dark: PALETTE.shortcutDark, tuft: PALETTE.shortcutTuft },
    wet: null,
    rain: null,
  },

  mud: MUD,
  overcast: MUD,

  snow: {
    fog: { colour: 0xe9f2fb, near: 300, far: 900 },
    backdrop: { near: PALETTE.hillSnow, fog: 0xe9f2fb },
    hedge: 0x7f93a3,
    leaf: 0x4a6b52,
    snowCaps: true,
    shoulder: 0xccd9e6,
    rock: PALETTE.rockCold,
    ash: 0x8f9aa4,
    cliff: { face: PALETTE.rockCold, lip: PALETTE.rockLipCold },
    marker: { post: PALETTE.night, cap: PALETTE.barnRed },
    bank: { bank: PALETTE.packedSnow, crest: PALETTE.snowCrest, face: PALETTE.rockCold },
    water: { deep: 0x0c2740, shallow: 0x2d6d97, foam: 0xe6f2fb },
    
    
    
    
    
    
    
    
    
    
    
    dust: {
      road: { colour: PALETTE.snowHollow, rate: 22, size: 0.24, life: 0.42, additive: false },
      off: { colour: PALETTE.snowRut, rate: 44, size: 0.46, life: 0.72, additive: false },
    },
    spray: { colour: PALETTE.snowHollow, additive: false, rate: 32, size: 0.30, life: 0.58 },
    bale: 0xcbb87f,
    minimap: { ground: PALETTE.snowHollow, tuft: PALETTE.ice },
    
    
    
    speedAdditive: true,
    shortcut: { seed: 0x5c07c3, base: PALETTE.packedSnow, dark: PALETTE.snowRut, tuft: PALETTE.snowHollow },
    wet: null,
    rain: null,
  },

  

















  rain: {
    fog: { colour: 0xa8b1b8, near: 130, far: 540 },
    backdrop: { near: 0x6c7a80, fog: 0xa8b1b8 },
    hedge: 0x3d5240,
    leaf: 0x35492f,
    snowCaps: false,
    shoulder: 0x4f5457,
    rock: 0x6b6560,
    ash: 0x3f3f3b,
    cliff: { face: 0x6b6560, lip: 0x7d766f },
    marker: { post: PALETTE.marker, cap: PALETTE.markerWarn },
    bank: { bank: 0x36492f, crest: 0x4a6440, face: 0x6b6560 },
    water: { deep: 0x142c3a, shallow: 0x39647a, foam: 0xdfe8ee },
    
    
    
    
    dust: {
      road: { colour: 0x8a9196, rate: 6, size: 0.20, life: 0.28, additive: false },
      off: { colour: 0x6c7466, rate: 15, size: 0.40, life: 0.46, additive: false },
    },
    spray: { colour: 0xdfe8ee, additive: false, rate: 58, size: 0.34, life: 0.62 },
    
    bale: 0x9c8a5e,
    
    
    
    minimap: { ground: 0x566b62, tuft: 0x3f4f48 },
    speedAdditive: false,
    shortcut: { seed: 0x5c07c4, base: 0x574f42, dark: 0x3b352c, tuft: 0x4e5a3f },
    





    wet: { roughness: 0.22, envMapIntensity: 1.45 },
    





    rain: {
      streaks: 1900, radius: 26, height: 22,
      
      
      
      
      speed: 34, lean: 0.6, length: 1.5, width: 0.035,
      
      
      
      colour: 0xc8d4dc, opacity: 0.44,
    },
  },
});


export const THEME_KEYS = Object.freeze(Object.keys(THEMES.summer));










export function themeOf(id) {
  if (id === undefined || id === null || id === '') return THEMES.summer;
  const row = THEMES[id];
  if (!row) {
    throw new Error(`unknown theme "${id}" - add a row to render/themes.js THEMES`
      + ` (have: ${Object.keys(THEMES).join(', ')})`);
  }
  return row;
}
