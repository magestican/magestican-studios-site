


































































export const REFERENCE_W = 390;


export const NARROW_W = 360;


export const FLOOR_W = 320;


export const MIN_TEXT_SCALE = 0.84;


export const MIN_TEXT_PX = 11;


export const REFUSAL_HOLD_S = 2;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round2 = (n) => Math.round(n * 100) / 100;





export function narrowAxis({ w, h }) {
  return Math.min(Number(w) || 0, Number(h) || 0);
}







export function textScale(vp) {
  const narrow = narrowAxis(vp);
  if (!(narrow > 0)) return 1;
  if (narrow >= NARROW_W) return 1;
  const t = clamp((NARROW_W - narrow) / (NARROW_W - FLOOR_W), 0, 1);
  return round2(1 - t * (1 - MIN_TEXT_SCALE));
}






export function scaledPx(basePx, vp) {
  const base = Number(basePx) || 0;
  if (base <= 0) return 0;
  const wanted = base * textScale(vp);
  return round2(clamp(wanted, Math.min(base, MIN_TEXT_PX), base));
}


export function isNarrow(vp) {
  return textScale(vp) < 1;
}







export function autoRequest() {
  return false;
}


export const FIT_KINDS = Object.freeze(['fullscreen', 'exit', 'standalone', 'install', 'none']);















export function fitOffer({
  hasFullscreen = false,
  isFullscreen = false,
  hasOrientationLock = false,
  locked = false,
  standalone = false,
  iosLike = false,
} = {}) {
  
  
  
  const whole = standalone || isFullscreen;
  const canLock = Boolean(hasOrientationLock) && whole;
  const lockLabel = locked ? 'Let it turn' : 'Keep this way up';
  const base = { canLock, lockLabel, routeTo: null, forced: false };

  if (isFullscreen) {
    return {
      ...base,
      kind: 'exit',
      label: 'Give the bars back',
      note: 'The moon has every pixel. Tap to put the browser back.',
    };
  }
  if (standalone) {
    return {
      ...base,
      kind: 'standalone',
      label: 'Full screen on',
      note: 'Farmy Moon is on your home screen, so it already has the whole phone.',
    };
  }
  if (hasFullscreen) {
    return {
      ...base,
      kind: 'fullscreen',
      label: 'Full screen',
      note: 'Fills the screen. Tap it again any time to give the bars back.',
    };
  }
  if (iosLike) {
    return {
      ...base,
      kind: 'install',
      label: 'Full screen',
      note: 'iPhone has no full screen button. Tap Share, then Add to Home Screen, and Farmy Moon opens with no bars at all.',
      routeTo: 'install',
    };
  }
  return { ...base, kind: 'none', label: 'Full screen', note: '', canLock: false };
}





export function lockTarget(vp) {
  const w = Number(vp && vp.w) || 0;
  const h = Number(vp && vp.h) || 0;
  if (!(w > 0) || !(h > 0)) return null;
  return w >= h ? 'landscape' : 'portrait';
}
