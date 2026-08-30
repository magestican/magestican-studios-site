








































export const IDLE = Object.freeze({
  cow:     Object.freeze({ breathHz: 0.30, swayHz: 0.11, breathAmp: 0.030, swayDeg: 0.85 }),
  sheep:   Object.freeze({ breathHz: 0.34, swayHz: 0.13, breathAmp: 0.028, swayDeg: 1.00 }),
  pig:     Object.freeze({ breathHz: 0.26, swayHz: 0.09, breathAmp: 0.034, swayDeg: 0.70 }),
  chicken: Object.freeze({ breathHz: 0.55, swayHz: 0.19, breathAmp: 0.022, swayDeg: 1.30 }),
});






export const VOLUME_COMPENSATION = 0.45;






export const INHALE_FRACTION = 0.38;




export const MAX_SCALE_DEVIATION = 0.05;   
export const MAX_SWAY_DEG = 2.0;           




export const IDLE_OFF_SPEED = 2.5;




export function idleWeight(speed) {
  const s = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const t = Math.min(1, s / IDLE_OFF_SPEED);
  const ease = t * t * (3 - 2 * t);
  return 1 - ease;
}



















export function idlePhase(key) {
  let h = 0x811c9dc5;
  const s = String(key ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}



export function breathCurve(u) {
  const f = u - Math.floor(u);
  const p = f < INHALE_FRACTION
    ? (f / INHALE_FRACTION) * 0.5
    : 0.5 + ((f - INHALE_FRACTION) / (1 - INHALE_FRACTION)) * 0.5;
  return -Math.cos(2 * Math.PI * p);
}









export function idlePose(kind, t, phase = 0, weight = 1) {
  const cfg = IDLE[kind] || IDLE.cow;
  const w = Math.max(0, Math.min(1, Number.isFinite(weight) ? weight : 1));
  
  
  
  
  
  
  if (w === 0) return { scaleY: 1, scaleXZ: 1, rollRad: 0 };
  const b = breathCurve(cfg.breathHz * t + phase);
  
  
  
  const s = Math.sin(2 * Math.PI * (cfg.swayHz * t + phase * 1.7 + 0.25));
  const dy = cfg.breathAmp * b * w;
  return {
    scaleY: 1 + dy,
    scaleXZ: 1 - dy * VOLUME_COMPENSATION,
    rollRad: (cfg.swayDeg * Math.PI / 180) * s * w,
  };
}
