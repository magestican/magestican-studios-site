































































export const PROBE_UP_RADIANCE = {
  day: [0.1736, 0.3287, 0.7819],
  snow: [0.2746, 0.4261, 0.6719],
  overcast: [0.3114, 0.3824, 0.4608],
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  rain: [0.1664, 0.2071, 0.2480],
  dusk: [0.2849, 0.1532, 0.2025],
};
























export const ENV_INTENSITY = 0.45;










export const PAINT_ENV_INTENSITY = 0.72;


export const RUBBER_ENV_INTENSITY = 0.30;









export const DRIVER_ENV_INTENSITY = 0.45;



























































export const LIGHT_RIG = {
  day: {
    sky: 'day',
    keyColour: 0xfff3d0, keyIntensity: 3.00, keyPos: [-150, 110, 105],
    hemiSky: 0xcfe6ff, hemiGround: 0x9c9a5e, hemiIntensity: 0.30,
    bounceColour: 0xe0bf8a, bounceIntensity: 0.16, bouncePos: [80, -40, -60],
    envIntensity: ENV_INTENSITY,
  },
  snow: {
    sky: 'snow',
    
    
    
    
    
    
    
    
    
    
    
    
    
    keyColour: 0xfaf6ff, keyIntensity: 3.00, keyPos: [-150, 110, 105],
    hemiSky: 0xe6f1ff, hemiGround: 0xc8dcef, hemiIntensity: 0.24,
    bounceColour: 0xd8e8f6, bounceIntensity: 0.16, bouncePos: [80, -40, -60],
    envIntensity: ENV_INTENSITY,
  },
  overcast: {
    sky: 'overcast',
    
    
    
    
    
    
    keyColour: 0xf0ead8, keyIntensity: 3.00, keyPos: [-150, 110, 105],
    hemiSky: 0xcfe6ff, hemiGround: 0x9c9a5e, hemiIntensity: 0.40,
    bounceColour: 0xe0bf8a, bounceIntensity: 0.16, bouncePos: [80, -40, -60],
    envIntensity: ENV_INTENSITY,
  },
  rain: {
    sky: 'rain',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    keyColour: 0xd7dee4, keyIntensity: 2.30, keyPos: [-150, 110, 105],
    hemiSky: 0xb9c2c9, hemiGround: 0x7f8a72, hemiIntensity: 0.46,
    bounceColour: 0xa8b1b8, bounceIntensity: 0.14, bouncePos: [80, -40, -60],
    envIntensity: ENV_INTENSITY,
  },
  dusk: {
    sky: 'dusk',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    keyColour: 0xffd2a0, keyIntensity: 2.70, keyPos: [-150, 110, 105],
    hemiSky: 0xf0a978, hemiGround: 0x6b5a44, hemiIntensity: 0.32,
    bounceColour: 0xe8b892, bounceIntensity: 0.16, bouncePos: [80, -40, -60],
    envIntensity: ENV_INTENSITY,
  },
};




















export function rigFor(sky) {
  return LIGHT_RIG[sky] ?? LIGHT_RIG.day;
}















export const SHADOW = {
  mapSize: 2048, half: 52, near: 1, far: 520,
  bias: -0.00018, normalBias: 0.028, lead: 14,
};

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;


export function srgbHexToLinear(hex) {
  const out = [];
  for (const shift of [16, 8, 0]) {
    const c = ((hex >> shift) & 255) / 255;
    out.push(c < 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  }
  return out;
}


export function linearTo8Bit(v) {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, c)) * 255);
}












export function shadingTerms(rig, { albedo = 0xffffff, exposure = 1.55 } = {}) {
  void exposure;
  const alb = srgbHexToLinear(albedo);
  const albL = luma(...alb);
  
  
  const [kx, ky, kz] = rig.keyPos;
  const len = Math.hypot(kx, ky, kz);
  const dotNL = Math.max(0, ky / len);
  const keyL = luma(...srgbHexToLinear(rig.keyColour)) * rig.keyIntensity;
  
  
  
  const hemiL = luma(...srgbHexToLinear(rig.hemiSky)) * rig.hemiIntensity;
  const probe = PROBE_UP_RADIANCE[rig.sky] ?? PROBE_UP_RADIANCE.day;
  const envL = luma(...probe) * rig.envIntensity;
  return {
    key: (dotNL * keyL * albL) / Math.PI,
    hemi: (hemiL * albL) / Math.PI,
    
    env: envL * albL,
    dotNL,
  };
}








export function keyToFill(rig) {
  const t = shadingTerms(rig);
  return t.key / (t.hemi + t.env);
}


function aces(x) {
  const v = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return Math.max(0, Math.min(1, v));
}







export function shadeUpFacing(albedo, rig, { shadowed = false, exposure = 1.55 } = {}) {
  const t = shadingTerms(rig, { albedo });
  const lin = (shadowed ? 0 : t.key) + t.hemi + t.env;
  return linearTo8Bit(aces(lin * exposure));
}


export function shadowDepth(albedo, rig, opts = {}) {
  return shadeUpFacing(albedo, rig, { ...opts, shadowed: false })
    - shadeUpFacing(albedo, rig, { ...opts, shadowed: true });
}
