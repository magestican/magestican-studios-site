





























export const CONCEAL_FADE_OUT_MS = 120;
export const CONCEAL_FADE_IN_MS = 70;

export function emptyConcealment() {
  return { concealed: false, alpha: 1 };
}








export function stepConcealment(state, concealedNow, dtMs) {
  const target = concealedNow ? 0 : 1;
  const over = concealedNow ? CONCEAL_FADE_OUT_MS : CONCEAL_FADE_IN_MS;
  const step = over <= 0 ? 1 : Math.max(0, dtMs) / over;
  let alpha = state?.alpha ?? 1;
  if (alpha < target) alpha = Math.min(target, alpha + step);
  else if (alpha > target) alpha = Math.max(target, alpha - step);
  return { concealed: !!concealedNow, alpha };
}






















export function concealmentDraw(state) {
  const alpha = state?.alpha ?? 1;
  return {
    bodyVisible: alpha > 0,
    haloOpacity: alpha,
    ringOpacity: alpha,
    nameplateOpacity: alpha,
  };
}
