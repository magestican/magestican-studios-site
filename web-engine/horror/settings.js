





















export const SETTINGS_KEYS = Object.freeze(['camDistance', 'sensitivity', 'subtitleScale', 'invertStick']);

export const SETTINGS_DEFAULTS = Object.freeze({
  
  
  
  
  
  
  camDistance: 1,
  
  
  
  sensitivity: 1,
  
  subtitleScale: 1,
  
  
  
  
  invertStick: false,
});

export const SETTINGS_RANGE = Object.freeze({
  camDistance: [0.7, 1.5],
  sensitivity: [0.5, 1.8],
  subtitleScale: [0.85, 1.9],
});

const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));








export function resolveSettings(saved) {
  const out = { ...SETTINGS_DEFAULTS };
  if (!saved || typeof saved !== 'object') return out;
  for (const k of SETTINGS_KEYS) {
    const v = saved[k];
    if (k === 'invertStick') {
      if (typeof v === 'boolean') out[k] = v;
      continue;
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const [lo, hi] = SETTINGS_RANGE[k];
    out[k] = clamp(v, lo, hi);
  }
  return out;
}


export function cameraBack(s, base) {
  return base * clamp(s.camDistance, ...SETTINGS_RANGE.camDistance);
}








export function stickRadius(s, base) {
  return Math.max(22, base / clamp(s.sensitivity, ...SETTINGS_RANGE.sensitivity));
}






export function stickForward(s, dy) {
  return s.invertStick ? dy : -dy;
}








export function voxScale(s, accessScale = 1) {
  return Math.max(accessScale, clamp(s.subtitleScale, ...SETTINGS_RANGE.subtitleScale));
}


export const toPercent = (v) => Math.round(v * 100);
export const fromPercent = (p) => Number(p) / 100;
