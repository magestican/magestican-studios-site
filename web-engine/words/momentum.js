































export const TAU = 240;


export const GLIDE_MS = 900;











export function velocityOf(samples, window = 90) {
  if (!Array.isArray(samples) || samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  
  
  
  let first = last;
  for (let i = samples.length - 2; i >= 0; i -= 1) {
    if (last.at - samples[i].at > window) break;
    first = samples[i];
  }
  const dt = last.at - first.at;
  if (dt <= 0) return 0;
  return (last.y - first.y) / dt;
}








export function glide(v0, t, tau = TAU) {
  if (!Number.isFinite(v0) || v0 === 0) return 0;
  if (!(t > 0)) return 0;
  return v0 * tau * (1 - Math.exp(-t / tau));
}


export const reach = (v0, tau = TAU) => v0 * tau;







export const MIN_FLICK = 0.12;
export const isFlick = (v0) => Math.abs(v0) >= MIN_FLICK;











export const gliding = (v0, t, tau = TAU) => isFlick(v0) && t < GLIDE_MS
  && Math.abs(reach(v0, tau) - glide(v0, t, tau)) > 1;
