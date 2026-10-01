


























export const ACCESS_KEYS = Object.freeze(['reducedMotion', 'noFlash', 'holdStruggle', 'bigText']);

export const ACCESS_DEFAULTS = Object.freeze({
  reducedMotion: false,
  noFlash: false,
  holdStruggle: false,
  bigText: false,
});










export function resolveAccess(saved, platform = {}) {
  const out = { ...ACCESS_DEFAULTS };
  if (platform.prefersReducedMotion) {
    out.reducedMotion = true;
    out.noFlash = true;
  }
  if (saved && typeof saved === 'object') {
    for (const k of ACCESS_KEYS) {
      if (typeof saved[k] === 'boolean') out[k] = saved[k];
    }
  }
  return out;
}







export function shakeScale(a) {
  return a.reducedMotion ? 0.33 : 1;
}







export function flashScale(a) {
  if (a.noFlash) return 0.25;
  return a.reducedMotion ? 0.6 : 1;
}


export function flashGap(a) {
  return a.noFlash ? 0.5 : 0;
}


export function struggleMode(a, base = 'reduced') {
  return a.holdStruggle ? 'hold' : base;
}


export function textScale(a) {
  return a.bigText ? 1.45 : 1;
}
