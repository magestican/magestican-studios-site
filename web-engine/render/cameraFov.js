




























export const FOV_DESKTOP = 75;











export const FOV_TOUCH = 110;





export const FOV_MIN = 40;
export const FOV_MAX = 150;

export function clampFov(deg) {
  if (!Number.isFinite(deg)) return FOV_DESKTOP;
  return Math.min(FOV_MAX, Math.max(FOV_MIN, deg));
}


export function fovFor(isTouch) {
  return clampFov(isTouch ? FOV_TOUCH : FOV_DESKTOP);
}







export function horizontalFov(verticalFovDeg, aspect) {
  if (!Number.isFinite(verticalFovDeg) || !Number.isFinite(aspect) || aspect <= 0) return NaN;
  const v = (verticalFovDeg * Math.PI) / 180;
  return (2 * Math.atan(Math.tan(v / 2) * aspect) * 180) / Math.PI;
}




export function fovDiagnostics(width, height, isTouch) {
  const aspect = width / height;
  const vertical = fovFor(isTouch);
  return {
    aspect: Number(aspect.toFixed(3)),
    vertical,
    horizontal: Number(horizontalFov(vertical, aspect).toFixed(1)),
  };
}



















export function detectTouch(win) {
  if (!win) return false;
  try {
    return ('ontouchstart' in win)
      || ((win.navigator?.maxTouchPoints ?? 0) > 0)
      || !!win.matchMedia?.('(pointer: coarse)')?.matches;
  } catch (_) {
    
    return false;
  }
}
