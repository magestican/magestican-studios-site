






























































export const LIGHT_RIG = Object.freeze({
  
  
  sun: Object.freeze({ color: 0xffffff, intensity: 1.05, dir: Object.freeze([0.6, 1.0, 0.4]) }),

  
  
  
  ambient: Object.freeze({ color: 0xffffff, intensity: 0.34 }),

  
  
  
  
  
  
  
  
  
  
  hemi: Object.freeze({ sky: 0xc5dde5, ground: 0x7e99b4, intensity: 0.86 }),
});





















export function rigFromSky(sky) {
  if (!sky) return LIGHT_RIG;
  return Object.freeze({
    sun: Object.freeze({
      color: sky.sunTint ?? LIGHT_RIG.sun.color,
      intensity: sky.sunIntensity ?? LIGHT_RIG.sun.intensity,
      dir: LIGHT_RIG.sun.dir,
    }),
    ambient: LIGHT_RIG.ambient,
    hemi: Object.freeze({
      sky: sky.hemiSky ?? LIGHT_RIG.hemi.sky,
      ground: sky.hemiGround ?? LIGHT_RIG.hemi.ground,
      intensity: LIGHT_RIG.hemi.intensity,
    }),
  });
}

export const PREVIOUS_RIG = Object.freeze({
  sun: Object.freeze({ color: 0xffffff, intensity: 1.05, dir: Object.freeze([0.6, 1.0, 0.4]) }),
  ambient: Object.freeze({ color: 0xffffff, intensity: 0.55 }),
  hemi: Object.freeze({ sky: 0x9fd7ff, ground: 0x2a4a24, intensity: 0.55 }),
});
