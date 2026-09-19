











































import { CEILING, dbToGain } from './mix.mjs';

export const BED_IDS = Object.freeze(['wind', 'birds', 'crickets', 'water', 'rain', 'hush']);
export const TEXTURE_IDS = Object.freeze(['wind', 'water', 'rain', 'hush']);
export const SCHEDULED_IDS = Object.freeze(['birds']);
export const TONAL_IDS = Object.freeze(['crickets']);








export const BED_DB = Object.freeze({ wind: 0, birds: -2, crickets: -9, water: 0, rain: -1, hush: -5 });


export const bedPeak = (id) => CEILING.ambience * dbToGain(BED_DB[id] ?? -60);


export const FADE_S = 2.5;


export const SILENT_STOP_S = 6;





export const BIRDS_BY_SEASON = Object.freeze({ spring: 1, summer: 0.8, autumn: 0.4, winter: 0 });
export const CRICKETS_BY_SEASON = Object.freeze({ spring: 0.3, summer: 1, autumn: 0.7, winter: 0 });




export const WIND_BY_WEATHER = Object.freeze({ clear: 0.7, windy: 1, misty: 0.5, rainy: 0.7, snowy: 0.55 });
export const WIND_AT_NIGHT = 0.6;
export const BIRDS_IN_RAIN = 0.2;


export const WATER_NEAR_M = 2.5;

export const WATER_FAR_M = 16;








export function waterGain(distanceM) {
  const d = Number(distanceM);
  if (!Number.isFinite(d) || d >= WATER_FAR_M) return 0;
  if (d <= WATER_NEAR_M) return 1;
  const x = 1 - (d - WATER_NEAR_M) / (WATER_FAR_M - WATER_NEAR_M);
  return x * x;
}

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));






export function bedsFor({ season = 'summer', night = false, weather = 'clear', waterM = Infinity } = {}) {
  const wind = WIND_BY_WEATHER[weather] ?? WIND_BY_WEATHER.clear;
  const rain = weather === 'rainy' ? 1 : 0;
  const snow = weather === 'snowy' ? 1 : 0;
  const birds = BIRDS_BY_SEASON[season] ?? BIRDS_BY_SEASON.summer;
  const crickets = CRICKETS_BY_SEASON[season] ?? CRICKETS_BY_SEASON.summer;
  return Object.freeze({
    wind: clamp01(night ? wind * WIND_AT_NIGHT : wind),
    birds: clamp01(night ? 0 : birds * (rain ? BIRDS_IN_RAIN : 1)),
    crickets: clamp01(night && !rain && !snow ? crickets : 0),
    water: clamp01(waterGain(waterM)),
    rain,
    hush: clamp01(snow ? 1 : (season === 'winter' ? 0.5 : 0)),
  });
}


export const liveBedsOf = (targets) => BED_IDS.filter((id) => targets[id] > 0);













const layer = (filter, f, q, gain) => Object.freeze({ filter, f, q, gain });
const lfo = (hz, depth) => Object.freeze({ hz, depth });
const texture = (seconds, layers, lfos, seed) => Object.freeze({ seconds, layers: Object.freeze(layers), lfo: Object.freeze(lfos), seed });

export const TEXTURES = Object.freeze({
  wind: texture(8, [layer('lowpass', 320, 0.7, 1), layer('bandpass', 820, 1.4, 0.3)], [lfo(0.07, 0.3), lfo(0.13, 0.18)], 1101),
  water: texture(6, [layer('bandpass', 1500, 0.8, 1), layer('bandpass', 3100, 1.6, 0.45)], [lfo(3.1, 0.22), lfo(5.3, 0.18)], 2202),
  rain: texture(8, [layer('bandpass', 4200, 0.6, 1), layer('lowpass', 500, 0.5, 0.4)], [lfo(0.21, 0.14)], 3303),
  hush: texture(8, [layer('lowpass', 140, 0.6, 1)], [lfo(0.05, 0.3)], 4404),
});


export const BLEND_S = 0.25;





export const GUST = Object.freeze([lfo(0.047, 0.22), lfo(0.083, 0.14)]);








export function blendLoop(samples, loop, blend) {
  if (!(loop > 0) || !(blend > 0) || samples.length < loop + blend) return 0;
  for (let i = 0; i < blend; i += 1) {
    const x = (i + 0.5) / blend;                  
    const a = Math.cos(x * Math.PI * 0.5);        
    const b = Math.sin(x * Math.PI * 0.5);        
    samples[i] = samples[i] * b + samples[loop + i] * a;
  }
  return blend;
}






export function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}


export const CHIRP_HZ = Object.freeze({ min: 1700, max: 4600 });
export const CHIRP_NOTE_S = Object.freeze({ min: 0.045, max: 0.13 });
export const PHRASE_NOTES = Object.freeze({ min: 2, max: 5 });

export const PHRASE_GAP_S = Object.freeze({ min: 1.4, max: 4.5 });





export function birdVoice(rand) {
  return Object.freeze({
    f0: 1900 + rand() * 1500,           
    span: 1.18 + rand() * 0.42,         
    noteS: 0.05 + rand() * 0.05,        
    gapS: 0.05 + rand() * 0.08,         
  });
}






export function chirpPhrase(rand, voice) {
  const count = PHRASE_NOTES.min + Math.floor(rand() * (PHRASE_NOTES.max - PHRASE_NOTES.min + 1));
  const notes = [];
  let at = 0;
  for (let i = 0; i < count; i += 1) {
    const up = rand() < 0.6;
    const base = voice.f0 * (0.92 + rand() * 0.16);
    const far = Math.min(CHIRP_HZ.max, base * voice.span);
    const dur = Math.max(CHIRP_NOTE_S.min, Math.min(CHIRP_NOTE_S.max, voice.noteS * (0.8 + rand() * 0.5)));
    notes.push(Object.freeze({
      at, dur,
      hz0: up ? base : far,
      hz1: up ? far : base,
      gain: 0.55 + rand() * 0.45,
    }));
    at += dur + voice.gapS * (0.7 + rand() * 0.6);
  }
  return Object.freeze(notes);
}


export function phraseGap(rand, density) {
  const d = clamp01(density);
  const spread = PHRASE_GAP_S.max - PHRASE_GAP_S.min;
  return PHRASE_GAP_S.min + spread * (1 - d) + rand() * spread * 0.6;
}






export const CRICKETS = Object.freeze([
  Object.freeze({ hz: 4150, trillHz: 24, gain: 1 }),
  Object.freeze({ hz: 4620, trillHz: 31, gain: 0.7 }),
]);
