













export function qualityFor({ coarse = false, dpr = 1 } = {}) {
  if (coarse) {
    return { tier: 'phone', pixelRatio: Math.min(dpr, 1), maxPixelRatio: Math.min(dpr, 1.5), minPixelRatio: 0.5,
      antialias: false, shadowMap: 1024, softShadows: false, propShadows: false };
  }
  return { tier: 'desktop', pixelRatio: Math.min(dpr, 2), maxPixelRatio: Math.min(dpr, 2), minPixelRatio: 0.75,
    antialias: true, shadowMap: 2048, softShadows: true, propShadows: true };
}



export const SCALER = { SLOW_MS: 40, FAST_MS: 20, SLOW_S: 0.75, FAST_S: 4, STEP: 0.25 };





export function createScaler(q) {
  let ratio = q.pixelRatio;
  let slow = 0;
  let fast = 0;
  let ema = 1 / 60;
  return {
    get ratio() { return ratio; },
    get frameMs() { return ema * 1000; },
    step(frameS) {
      if (!(frameS > 0) || frameS > 1) return ratio; 
      ema += (frameS - ema) * 0.1;
      const ms = ema * 1000;
      if (ms > SCALER.SLOW_MS) { slow += frameS; fast = 0; } else if (ms < SCALER.FAST_MS) { fast += frameS; slow = 0; } else { slow = 0; fast = 0; }
      if (slow >= SCALER.SLOW_S && ratio > q.minPixelRatio) {
        ratio = Math.max(q.minPixelRatio, +(ratio - SCALER.STEP).toFixed(2));
        slow = 0;
      } else if (fast >= SCALER.FAST_S && ratio < q.maxPixelRatio) {
        ratio = Math.min(q.maxPixelRatio, +(ratio + SCALER.STEP).toFixed(2));
        fast = 0;
      }
      return ratio;
    },
  };
}
