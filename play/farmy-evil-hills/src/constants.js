













import { palette, toHex } from '../../../web-engine/horror/tools/texturePaint.mjs';

export const XANDER_H = 1.80;

















export const CHICKEN_H = 0.72;

export const HALL_W = 3.2;

















export const HALL_H = 2.95;

   


























export const WALL_H = HALL_H;














export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
























export const FACE_SKIN = Object.freeze({
  SKIN: '#cf9d74',
  SKIN_LIT: '#e3b78d',
  SKIN_HI: '#eec9a2',
  SKIN_SH: '#a4744f',
  SKIN_DEEP: '#7c5439',
  SKIN_DARK: '#573925',
});


export const hexNum = (h) => parseInt(h.slice(1), 16);

export const XCOL = {
  top: 0x9c4436,      
  pant: 0x3a4f7d,     
  accent: 0xb5893f,   
  
  
  
  skin: hexNum(FACE_SKIN.SKIN_LIT),
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  hair: hexNum(toHex(palette('hair').by.base)),
  
  
  
  eye: 0x2f6fd0,      
};








export const WCOL = {
  torso: 0xb8b3ab, udder: 0xc19a92, head: 0x8f8a83,
  hornL: 0xcfc6ad, hornR: 0xcfc6ad, earL: 0x8f8a83, earR: 0x8f8a83,
  tentacleL: 0xc19a92, tentacleR: 0xb98f88,
  legL: 0x6e6a64, legR: 0x6e6a64, tail: 0x6e6a64,
  eyeL: 0x120f10, eyeR: 0x120f10,
};



export const HCOL = {
  barrel: 0x2b2724, tail: 0x1d1a18,
  neckC: 0x3a3531, neckL: 0x322d2a, neckR: 0x322d2a,
  legFL: 0x241f1d, legFR: 0x241f1d, legHL: 0x241f1d, legHR: 0x241f1d,
};

export const PCOL = {
  torso: 0xb08a86, head: 0xbe9691, earL: 0xa87f7c, earR: 0xa87f7c,
  snout: 0xc9a09a, armL: 0xb5908b, armR: 0xa17c78,
  legL: 0x9c7874, legR: 0x9c7874, eyeL: 0x1a1416, eyeR: 0x1a1416,
};

export const CCOL = {
  torso: 0xb9b07a, wingL: 0xa89a68, wingR: 0xa89a68, tail: 0x8d8352,
  head: 0xc9a98c, beak: 0xd8c27a, comb: 0x8e3b46,
  legL: 0xc4a06d, legR: 0xc4a06d, eyeL: 0x241a1c, eyeR: 0x241a1c,
};







export function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}







export const LIFT_FLOORS = 5;
