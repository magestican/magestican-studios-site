























































export const BASE_HARMONICS = Object.freeze([
  0, 1.00, 0.86, 0.28, 0.64, 0.47, 0.16, 0.22, 0.19,
  0.13, 0.11, 0.08, 0.09, 0.05, 0.06, 0.04, 0.05,
]);





























export const VOICES = Object.freeze({
  
  
  sheep: Object.freeze({ cylinders: 2, bore: 1.00, rasp: 0.35, weight: 0.48, gears: 4 }),

  
  
  
  chicken: Object.freeze({ cylinders: 1, bore: 0.62, rasp: 0.92, weight: 0.05, gears: 3 }),

  
  
  cow: Object.freeze({ cylinders: 2, bore: 1.62, rasp: 0.18, weight: 1.00, gears: 3 }),

  
  
  pig: Object.freeze({ cylinders: 4, bore: 1.34, rasp: 0.30, weight: 0.82, gears: 4 }),

  
  goat: Object.freeze({ cylinders: 3, bore: 0.80, rasp: 0.62, weight: 0.30, gears: 5 }),

  
  
  
  duck: Object.freeze({ cylinders: 2, bore: 1.10, rasp: 0.08, weight: 0.44, gears: 4 }),

  
  
  
  donkey: Object.freeze({ cylinders: 1, bore: 1.45, rasp: 0.48, weight: 0.90, gears: 3 }),

  
  
  goose: Object.freeze({ cylinders: 5, bore: 0.72, rasp: 0.78, weight: 0.22, gears: 5 }),
});


export const DEFAULT_VOICE = VOICES.sheep;











export function voiceFor(id) {
  return VOICES[id] ?? DEFAULT_VOICE;
}




















export function harmonicsFor(voice) {
  const v = voice ?? DEFAULT_VOICE;
  const out = BASE_HARMONICS.slice();
  for (let n = 1; n < out.length; n += 1) {
    
    const onFiring = n % v.cylinders === 0;
    const firing = onFiring ? 1.35 : 0.88;
    
    
    const tilt = (v.rasp - 0.5) * 2;
    const odd = n % 2 === 1;
    const rasp = 1 + tilt * (odd ? 0.45 : -0.45);
    out[n] = Math.max(0, out[n] * firing * rasp);
  }
  
  
  const peak = Math.max(...out);
  if (peak > 0) for (let n = 1; n < out.length; n += 1) out[n] /= peak;
  return out;
}


export function airboxHz(voice) {
  return 320 / (voice ?? DEFAULT_VOICE).bore;
}








export function subLevel(voice) {
  return 0.18 + (voice ?? DEFAULT_VOICE).weight * 0.62;
}



















const WOBBLE_RATIOS = Object.freeze([1, 1.6180339887, 2.7182818285]);













export function firingWobble(voice, t, revs = 0.5) {
  const v = voice ?? DEFAULT_VOICE;
  const rate = lumpHz(v, revs);
  let sum = 0;
  for (let i = 0; i < WOBBLE_RATIOS.length; i += 1) {
    
    
    
    sum += Math.sin(2 * Math.PI * rate * WOBBLE_RATIOS[i] * t + i * 1.7) / 3;
  }
  return (sum + 1) / 2;
}








export function lumpHz(voice, revs) {
  const v = voice ?? DEFAULT_VOICE;
  const r = Math.min(1, Math.max(0, revs));
  return (4 + r * 11) * (v.cylinders * 0.5 + 0.5);
}








export function lumpDepth(voice, revs) {
  const v = voice ?? DEFAULT_VOICE;
  const r = Math.min(1, Math.max(0, revs));
  const perCylinder = 1 / Math.sqrt(v.cylinders);
  return (0.06 + 0.30 * (1 - r)) * perCylinder;
}











export function slowDrift(t, amount = 0.04) {
  
  
  const a = Math.sin(2 * Math.PI * t / 17.0);
  const b = Math.sin(2 * Math.PI * t / 27.5 + 0.9);
  return 1 + ((a + b) / 2) * amount;
}












export function enginePitch(voice, frac) {
  const v = voice ?? DEFAULT_VOICE;
  const f = Math.min(1.35, Math.max(0, frac));
  const span = 1 / v.gears;
  const gear = Math.min(v.gears - 1, Math.floor(f / span));
  const withinGear = (f - gear * span) / span;
  const revs = 0.35 + Math.min(1, withinGear) * 0.65;
  
  
  const hz = (58 + revs * 118 + gear * 9) / (0.72 + v.bore * 0.28);
  return { hz, gear, revs };
}
