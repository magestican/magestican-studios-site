





























export const dbToGain = (db) => Math.pow(10, db / 20);
export const gainToDb = (g) => (g > 0 ? 20 * Math.log10(g) : -Infinity);


export const MUSIC_UNDER_SFX_DB = -14;

export const AMBIENCE_UNDER_MUSIC_DB = -6;

export const VOICE_OVER_SFX_DB = 3;


export const SFX_CEILING_DB = -6;

export const CEILING_DB = Object.freeze({
  voice: SFX_CEILING_DB + VOICE_OVER_SFX_DB,
  sfx: SFX_CEILING_DB,
  music: SFX_CEILING_DB + MUSIC_UNDER_SFX_DB,
  ambience: SFX_CEILING_DB + MUSIC_UNDER_SFX_DB + AMBIENCE_UNDER_MUSIC_DB,
});


export const CEILING = Object.freeze(Object.fromEntries(
  Object.entries(CEILING_DB).map(([bus, db]) => [bus, dbToGain(db)]),
));


export const BUS_ORDER = Object.freeze(['voice', 'sfx', 'music', 'ambience']);


export const ceilingOf = (bus) => CEILING[bus] ?? 0;











export const LIMITER = Object.freeze({
  threshold: -2,
  knee: 6,
  ratio: 4,
  attack: 0.004,
  release: 0.25,
});









export function peakOfCue(cue, patch) {
  if (!cue || !patch) return 0;
  return cue.gain * patch.layers.reduce((m, l) => Math.max(m, l.gain), 0);
}


export function peakOf(samples, count = samples.length) {
  let p = 0;
  const n = Math.min(count, samples.length);
  for (let i = 0; i < n; i += 1) { const v = Math.abs(samples[i]); if (v > p) p = v; }
  return p;
}














export function normalizePeak(samples, target, count = samples.length) {
  const p = peakOf(samples, count);
  if (!(p > 0) || !(target > 0)) return 1;
  const k = target / p;
  for (let i = 0; i < samples.length; i += 1) samples[i] *= k;
  return k;
}
