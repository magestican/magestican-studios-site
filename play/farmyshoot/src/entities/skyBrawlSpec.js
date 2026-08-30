





















































export const CAMERA_FAR = 340;

export const SKY = Object.freeze({
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  radius: 165,
  elevationDeg: 30,      
  azimuthDeg: 0,         
                         
  modelScale: 16.5,      
  
  
  
  
  
  faceTheEye: true,
  cycleSeconds: 9.0,     
  
  
  fogged: false,
});






export const FRAMING = Object.freeze({
  neutralViewTopDeg: 27,
  maxCraneDeg: 55,
});






export const PHASES = Object.freeze([
  { name: 'charge',  until: 0.20 },
  { name: 'clash',   until: 0.28 },
  { name: 'grapple', until: 0.64 },
  { name: 'throw',   until: 0.78 },
  { name: 'stagger', until: 1.00 },
]);



export const REST_SEPARATION = 5.0;




export const LOCK_SEPARATION = 1.55;

export const GALLOP_HZ = 2.6;      
export const SHOVE_HZ = 0.9;       
export const SHOVE_AMPLITUDE = 0.7; 
export const THROW_HEIGHT = 6.5;   

const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

const easeIn = (t) => t * t;

const easeOut = (t) => 1 - (1 - t) * (1 - t);


export function phaseAt(tNorm) {
  const p = ((tNorm % 1) + 1) % 1;
  let from = 0;
  for (const ph of PHASES) {
    if (p < ph.until) {
      return { name: ph.name, p: (p - from) / (ph.until - from) };
    }
    from = ph.until;
  }
  const last = PHASES[PHASES.length - 1];
  return { name: last.name, p: 1 };
}













export function poseAt(t) {
  const tNorm = (t % SKY.cycleSeconds) / SKY.cycleSeconds;
  const { name, p } = phaseAt(tNorm);

  const bull  = blank(+Math.PI / 2);
  const horse = blank(-Math.PI / 2);
  const dust  = { x: 0, y: 0.55, z: 0, scale: 0, spin: t * 1.6, alpha: 0 };
  const stars = { alpha: 0, spin: t * 3.0, over: 'none' };
  let impact = 0;

  if (name === 'charge') {
    
    
    const e = easeIn(p);
    const sep = lerp(REST_SEPARATION, LOCK_SEPARATION + 0.5, e);
    bull.x = -sep; horse.x = +sep;
    
    
    const gp = t * GALLOP_HZ * TAU;
    bull.legSwing  = Math.sin(gp);
    horse.legSwing = Math.sin(gp + Math.PI * 0.6);   
    bull.y  = Math.abs(Math.sin(gp)) * 0.35;
    horse.y = Math.abs(Math.sin(gp + Math.PI * 0.6)) * 0.30;
    bull.headTilt  = -0.35 * e;
    horse.headTilt = -0.25 * e;
    bull.pitch  = -0.10 * e;
    horse.pitch = -0.08 * e;

  } else if (name === 'clash') {
    
    
    
    const hit = Math.exp(-p * 7);            
    impact = hit;
    bull.x  = -(LOCK_SEPARATION - 0.25 * hit);
    horse.x = +(LOCK_SEPARATION - 0.25 * hit);
    bull.squash  = 1 - 0.18 * hit;
    horse.squash = 1 - 0.22 * hit;
    bull.roll  = +0.20 * hit;
    horse.roll = -0.26 * hit;
    horse.pitch = -0.30 * hit;               
    horse.y = 0.6 * hit;
    bull.headTilt = -0.40;
    horse.headTilt = -0.30;
    dust.scale = easeOut(clamp01(p * 3)) * 3.2;
    dust.alpha = 1;

  } else if (name === 'grapple') {
    
    
    
    
    
    const shove = Math.sin(t * SHOVE_HZ * TAU) * SHOVE_AMPLITUDE;
    const strain = Math.sin(t * SHOVE_HZ * TAU * 3) * 0.06;
    
    
    const rear = 0.5 + 0.5 * Math.sin(t * SHOVE_HZ * TAU * 2 - Math.PI / 2);

    bull.x  = -LOCK_SEPARATION + shove;
    bull.pitch = -0.26 - Math.max(0, -shove) * 0.14 + strain;
    bull.headTilt = -0.5;
    bull.legSwing = Math.sin(t * 9) * 0.5;
    bull.y = Math.abs(Math.sin(t * 9)) * 0.08;

    horse.x = +LOCK_SEPARATION + 0.35 + shove * 0.7;
    horse.pitch = -0.20 - rear * 0.95;       
    horse.y = rear * 0.55;
    horse.headTilt = 0.15 + rear * 0.25;     
    horse.legSwing = Math.sin(t * 6) * 0.18; 
    horse.frontSwing = -0.9 * rear + Math.sin(t * 13) * 0.35 * rear;  

    dust.x = shove * 0.5;
    dust.scale = 2.2 + Math.sin(t * 3.1) * 0.30;
    dust.alpha = 1;

  } else if (name === 'throw') {
    
    
    
    
    
    
    
    
    const e = p;
    const arc = Math.sin(e * Math.PI);       
    horse.x = lerp(+LOCK_SEPARATION, +REST_SEPARATION * 1.12, e);
    horse.y = arc * THROW_HEIGHT;
    horse.roll  = e * TAU * 0.85;            
    horse.pitch = -0.5 + e * 1.4;
    horse.yaw = -Math.PI / 2 - e * 0.9;      
    horse.legSwing = Math.sin(t * 14) * 1.2; 
    bull.x = -LOCK_SEPARATION + easeOut(e) * 1.1;
    bull.pitch = -0.9 * Math.sin(e * Math.PI * 0.9);   
    bull.y = Math.sin(e * Math.PI * 0.9) * 0.5;
    bull.headTilt = -0.2 + e * 0.5;
    dust.scale = 2.4 * (1 - e);
    dust.alpha = 0.8 * (1 - e);
    stars.alpha = e;
    stars.over = 'horse';

  } else {
    
    
    const e = easeOut(p);
    const wobble = (1 - p);
    horse.x = lerp(+REST_SEPARATION * 1.12, +REST_SEPARATION, e);
    horse.y = Math.max(0, Math.sin((1 - p) * Math.PI * 2) * 0.25 * wobble);
    horse.roll  = Math.sin(t * 7) * 0.22 * wobble;
    horse.yaw   = lerp(-Math.PI / 2 - 0.9, -Math.PI / 2, e);
    horse.pitch = 0.9 * (1 - e);
    bull.x = lerp(-LOCK_SEPARATION + 1.1, -REST_SEPARATION, e);
    bull.roll  = Math.sin(t * 6 + 1) * 0.18 * wobble;
    bull.pitch = 0.15 * wobble;
    bull.legSwing  = Math.sin(t * 4) * 0.3 * wobble;
    horse.legSwing = Math.sin(t * 4.5) * 0.35 * wobble;
    bull.headTilt  = 0.15 * wobble;
    horse.headTilt = 0.20 * wobble;
    stars.alpha = wobble;
    stars.over = 'both';
    dust.alpha = 0.35 * wobble;
    dust.scale = 2.0 * wobble;
  }

  return { phase: name, phaseP: p, bull, horse, dust, stars, impact };
}

function blank(yaw) {
  
  
  
  return { x: 0, y: 0, z: 0, yaw, pitch: 0, roll: 0,
           legSwing: 0, frontSwing: null, headTilt: 0, squash: 1 };
}







export function separationAt(t) {
  const { bull, horse } = poseAt(t);
  return horse.x - bull.x;
}




export function centreDistanceAt(t) {
  const { bull, horse } = poseAt(t);
  return Math.hypot(horse.x - bull.x, horse.y - bull.y, horse.z - bull.z);
}



















const BULL_HIDE   = 0x2b1d14;
const BULL_DARK   = 0x1c130d;
const BULL_MUZZLE = 0x6b5540;
const HORN        = 0xf6f1e6;





const HOOF_PALE   = 0xa2937c;   
const HOOF_DARK   = 0x241a12;   
const HORSE_COAT  = 0xb5793d;
const HORSE_DARK  = 0x8f5c2a;
const HORSE_MANE  = 0x33230f;
const EYE_HOT     = 0xf4c95d;

export const BONE_PIVOTS = Object.freeze({
  bull: {
    body:  [0, 0, 0],
    head:  [0, 1.72, 1.15],
    legFL: [ 0.42, 1.20,  0.72], legFR: [-0.42, 1.20,  0.72],
    legBL: [ 0.44, 1.20, -0.78], legBR: [-0.44, 1.20, -0.78],
    tail:  [0, 1.62, -1.25],
  },
  horse: {
    body:  [0, 0, 0],
    head:  [0, 3.35, 1.20],
    legFL: [ 0.34, 1.62,  0.70], legFR: [-0.34, 1.62,  0.70],
    legBL: [ 0.36, 1.62, -0.72], legBR: [-0.36, 1.62, -0.72],
    tail:  [0, 2.05, -1.25],
  },
});





export const BULL_PARTS = Object.freeze([
  
  { bone: 'body', p: [0, 1.55, 0,      1.70, 1.15, 2.60], hex: BULL_HIDE },
  
  { bone: 'body', p: [0, 2.28, 0.55,   1.35, 0.55, 1.10], hex: BULL_DARK },
  
  { bone: 'body', p: [0, 1.45, 1.05,   1.55, 1.05, 0.70], hex: BULL_DARK },
  
  { bone: 'body', p: [0, 1.85, 1.35,   0.95, 0.85, 0.60], hex: BULL_HIDE },
  
  { bone: 'head', p: [0, -0.06, 0.42,  0.95, 0.85, 1.00], hex: BULL_HIDE },
  { bone: 'head', p: [0, -0.20, 1.00,  0.62, 0.48, 0.35], hex: BULL_MUZZLE },
  
  { bone: 'head', p: [ 0.16, -0.18, 1.18, 0.14, 0.12, 0.06], hex: BULL_DARK },
  { bone: 'head', p: [-0.16, -0.18, 1.18, 0.14, 0.12, 0.06], hex: BULL_DARK },
  
  { bone: 'head', p: [ 0.62, 0.28, 0.35, 0.62, 0.20, 0.20], hex: HORN },
  { bone: 'head', p: [-0.62, 0.28, 0.35, 0.62, 0.20, 0.20], hex: HORN },
  { bone: 'head', p: [ 0.88, 0.30, 0.72, 0.20, 0.20, 0.62], hex: HORN },
  { bone: 'head', p: [-0.88, 0.30, 0.72, 0.20, 0.20, 0.62], hex: HORN },
  
  { bone: 'head', p: [ 0.55, 0.10, 0.10, 0.30, 0.16, 0.18], hex: BULL_HIDE },
  { bone: 'head', p: [-0.55, 0.10, 0.10, 0.30, 0.16, 0.18], hex: BULL_HIDE },
  
  { bone: 'head', p: [ 0.33, 0.10, 0.86, 0.16, 0.16, 0.06], hex: EYE_HOT },
  { bone: 'head', p: [-0.33, 0.10, 0.86, 0.16, 0.16, 0.06], hex: EYE_HOT },
  
  { bone: 'legFL', p: [0, -0.60, 0,  0.40, 1.20, 0.40], hex: BULL_HIDE },
  { bone: 'legFR', p: [0, -0.60, 0,  0.40, 1.20, 0.40], hex: BULL_HIDE },
  { bone: 'legBL', p: [0, -0.60, 0,  0.42, 1.20, 0.42], hex: BULL_HIDE },
  { bone: 'legBR', p: [0, -0.60, 0,  0.42, 1.20, 0.42], hex: BULL_HIDE },
  { bone: 'legFL', p: [0, -1.14, 0,  0.46, 0.22, 0.46], hex: HOOF_PALE },
  { bone: 'legFR', p: [0, -1.14, 0,  0.46, 0.22, 0.46], hex: HOOF_PALE },
  { bone: 'legBL', p: [0, -1.14, 0,  0.48, 0.22, 0.48], hex: HOOF_PALE },
  { bone: 'legBR', p: [0, -1.14, 0,  0.48, 0.22, 0.48], hex: HOOF_PALE },
  
  { bone: 'tail', p: [0, -0.35, -0.10, 0.16, 0.85, 0.16], hex: BULL_HIDE },
  { bone: 'tail', p: [0, -0.85, -0.10, 0.24, 0.30, 0.24], hex: BULL_DARK },
]);


export const HORSE_PARTS = Object.freeze([
  { bone: 'body', p: [0, 2.10, 0,      1.05, 0.95, 2.30], hex: HORSE_COAT },
  { bone: 'body', p: [0, 2.02, -1.05,  1.05, 1.05, 0.75], hex: HORSE_DARK },  
  { bone: 'body', p: [0, 2.10, 0.95,   0.95, 0.90, 0.60], hex: HORSE_COAT },  
  
  
  
  
  { bone: 'body', p: [0, 2.62, 1.02,   0.62, 0.95, 0.62], hex: HORSE_COAT },
  { bone: 'body', p: [0, 3.10, 1.14,   0.56, 0.85, 0.58], hex: HORSE_COAT },
  
  { bone: 'body', p: [0, 2.80, 0.78,   0.26, 1.30, 0.34], hex: HORSE_MANE },
  { bone: 'body', p: [0, 3.30, 0.92,   0.26, 0.60, 0.34], hex: HORSE_MANE },
  
  { bone: 'head', p: [0, 0.05, 0.32,   0.52, 0.62, 0.72], hex: HORSE_COAT },
  { bone: 'head', p: [0, -0.16, 0.86,  0.44, 0.44, 0.66], hex: HORSE_COAT },
  { bone: 'head', p: [0, -0.28, 1.20,  0.40, 0.28, 0.22], hex: HORSE_MANE },  
  { bone: 'head', p: [ 0.19, 0.48, 0.16, 0.15, 0.36, 0.15], hex: HORSE_COAT }, 
  { bone: 'head', p: [-0.19, 0.48, 0.16, 0.15, 0.36, 0.15], hex: HORSE_COAT },
  { bone: 'head', p: [0, 0.50, 0.42,   0.32, 0.32, 0.30], hex: HORSE_MANE },   
  { bone: 'head', p: [ 0.26, 0.12, 0.62, 0.14, 0.14, 0.06], hex: EYE_HOT },
  { bone: 'head', p: [-0.26, 0.12, 0.62, 0.14, 0.14, 0.06], hex: EYE_HOT },
  
  { bone: 'legFL', p: [0, -0.80, 0, 0.26, 1.62, 0.26], hex: HORSE_COAT },
  { bone: 'legFR', p: [0, -0.80, 0, 0.26, 1.62, 0.26], hex: HORSE_COAT },
  { bone: 'legBL', p: [0, -0.78, 0, 0.32, 1.20, 0.32], hex: HORSE_DARK },
  { bone: 'legBR', p: [0, -0.78, 0, 0.32, 1.20, 0.32], hex: HORSE_DARK },
  { bone: 'legBL', p: [0, -1.36, 0, 0.24, 0.55, 0.24], hex: HORSE_COAT },
  { bone: 'legBR', p: [0, -1.36, 0, 0.24, 0.55, 0.24], hex: HORSE_COAT },
  { bone: 'legFL', p: [0, -1.53, 0, 0.32, 0.20, 0.32], hex: HOOF_DARK },
  { bone: 'legFR', p: [0, -1.53, 0, 0.32, 0.20, 0.32], hex: HOOF_DARK },
  { bone: 'legBL', p: [0, -1.55, 0, 0.34, 0.20, 0.34], hex: HOOF_DARK },
  { bone: 'legBR', p: [0, -1.55, 0, 0.34, 0.20, 0.34], hex: HOOF_DARK },
  
  { bone: 'tail', p: [0, -0.50, -0.18, 0.28, 1.15, 0.28], hex: HORSE_MANE },
]);




export const LEG_PHASE = Object.freeze({
  legFL: +1, legBR: +1, legFR: -1, legBL: -1,
});
export const LEG_SWING_RADIANS = 0.85;









export const DUST = Object.freeze({
  
  
  
  rings: [
    { count: 16, radius: 1.75, size: 0.34, hex: 0xe2d8c8, dir: +1 },
    { count: 11, radius: 1.05, size: 0.30, hex: 0xf0e9dc, dir: -1 },
  ],
  coreSize: 0.42,
  coreHex: 0xebe3d4,
  flatten: 0.42,      
  maxAlpha: 0.40,     
});


export const STARS = Object.freeze({
  count: 5,
  radius: 1.35,
  size: 0.62,     
  hex: EYE_HOT,
  heightBull: 3.5,
  heightHorse: 3.9,
});
