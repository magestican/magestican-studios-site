











































import { CEILING, dbToGain } from './mix.mjs';

export const BED_IDS = Object.freeze(['wind', 'birds', 'crickets', 'water', 'rain', 'hush', 'fire']);
export const TEXTURE_IDS = Object.freeze(['wind', 'water', 'rain', 'hush', 'fire']);
export const SCHEDULED_IDS = Object.freeze(['birds']);
export const TONAL_IDS = Object.freeze(['crickets']);











export const BED_DB = Object.freeze({ wind: 0, birds: -2, crickets: -13, water: 0, rain: -1, hush: -5, fire: -6 });


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






export const FIRE_NEAR_M = 1.5;

export const FIRE_FAR_M = 9;


export function fireGain(distanceM) {
  const d = Number(distanceM);
  if (!Number.isFinite(d) || d >= FIRE_FAR_M) return 0;
  if (d <= FIRE_NEAR_M) return 1;
  const x = 1 - (d - FIRE_NEAR_M) / (FIRE_FAR_M - FIRE_NEAR_M);
  return x * x;
}






export function popTimes({ seconds, perS, dur_s }, seed) {
  const rand = lcg(seed);
  const out = [];
  let t = 0.05 + rand() * 0.1;
  while (t + dur_s < seconds) {
    out.push(Math.round(t * 10000) / 10000);
    t += 1 / (perS[0] + rand() * (perS[1] - perS[0]));
  }
  return Object.freeze(out);
}






export const TOWN_WATER_R = Object.freeze({ fountain: 1.6, well: 0.9 });


export function nearestWaterEdgeM(sources, x, z) {
  let best = Infinity;
  for (const s of sources || []) {
    const d = Math.max(0, Math.hypot(s.x - x, s.z - z) - (s.r || 0));
    if (d < best) best = d;
  }
  return best;
}


export const WATER_FIELD_MAX = 4;





export function siteWater({ x = 0, z = 0, sources = [] } = {}) {
  return Object.freeze((sources || [])
    .map((s) => ({ x: s.x, z: s.z, r: s.r || 0, d: Math.max(0, Math.hypot(s.x - x, s.z - z) - (s.r || 0)) }))
    .filter((s) => s.d < WATER_FAR_M)
    .sort((a, b) => a.d - b.d)
    .slice(0, WATER_FIELD_MAX)
    .map((s) => Object.freeze({ x: s.x, z: s.z, r: s.r })));
}






export function waterField(pool, { x = 0, z = 0, heading = 0 } = {}) {
  const n = (pool || []).length;
  const share = n ? 1 / Math.sqrt(n) : 0;
  return Object.freeze((pool || []).map((s) => {
    const dx = s.x - x, dz = s.z - z;
    const distanceM = Math.max(0, Math.hypot(dx, dz) - (s.r || 0));
    return Object.freeze({ x: s.x, z: s.z, distanceM, pan: cricketPan(dx, dz, heading), gain: waterGain(distanceM) * share });
  }));
}

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));






export function bedsFor({ season = 'summer', night = false, weather = 'clear', waterM = Infinity, fireM = Infinity } = {}) {
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
    fire: clamp01(fireGain(fireM)),
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
  
  
  fire: Object.freeze({
    ...texture(5, [layer('lowpass', 900, 0.5, 1), layer('bandpass', 2600, 2.5, 0.35)], [lfo(1.7, 0.28), lfo(4.3, 0.18)], 5505),
    pops: Object.freeze({ perS: Object.freeze([3, 6]), dur_s: 0.012, gain: 0.8, attack_s: 0.002 }),
  }),
});


export const texturePops = (id) => {
  const t = TEXTURES[id];
  return t && t.pops ? popTimes({ seconds: t.seconds, perS: t.pops.perS, dur_s: t.pops.dur_s }, t.seed + 1) : Object.freeze([]);
};


export const fieldsArePositional = (tier) => tier !== 'low';


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
  Object.freeze({ hz: 4150, pulseHz: 27, pulses: 4, gapS: 1.1, gain: 1 }),
  Object.freeze({ hz: 4620, pulseHz: 33, pulses: 3, gapS: 1.57, gain: 0.5 }),
]);


export const CHIRP_ATTACK_S = 0.004;
export const CHIRP_DECAY_S = 0.018;







export function chirpGap(c, index) {
  const wobble = 1 + 0.22 * Math.sin((Number(index) || 0) * 2.399963229728653);
  return c.gapS * wobble;
}


export const chirpLength = (c) => (c.pulses - 1) / c.pulseHz + CHIRP_ATTACK_S + CHIRP_DECAY_S;








































export const CRICKET_FIELD = Object.freeze({
  
  
  
  min: 4,
  max: 6,
  
  
  
  nearM: 3.5,
  farM: 13,
  
  
  spacingM: 2.0,
  
  candidates: 16,
  
  
  
  
  resiteM: 18,
});


export const CRICKET_NEAR_M = 4;

export const CRICKET_FAR_M = 20;







export function cricketGain(distanceM) {
  const d = Number(distanceM);
  if (!Number.isFinite(d) || d >= CRICKET_FAR_M) return 0;
  if (d <= CRICKET_NEAR_M) return 1;
  const x = 1 - (d - CRICKET_NEAR_M) / (CRICKET_FAR_M - CRICKET_NEAR_M);
  return x * x;
}

const wrapPi = (a) => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

















export function cricketPan(dx, dz, heading = 0) {
  const x = Number(dx) || 0;
  const z = Number(dz) || 0;
  if (x === 0 && z === 0) return 0;
  return Math.sin(wrapPi(Math.atan2(x, z) - (Number(heading) || 0)));
}










export function siteCrickets({ x = 0, z = 0, seed = 1, isGrass = null, count = CRICKET_FIELD.max, field = CRICKET_FIELD } = {}) {
  const rand = lcg(seed);
  const want = Math.max(0, Math.min(field.max, Math.round(count)));
  const out = [];
  const grass = typeof isGrass === 'function' ? isGrass : () => true;
  for (let i = 0; i < want; i += 1) {
    for (let k = 0; k < field.candidates; k += 1) {
      const a = rand() * Math.PI * 2;
      
      
      const r = Math.sqrt(field.nearM ** 2 + rand() * (field.farM ** 2 - field.nearM ** 2));
      const sx = Math.round((x + Math.sin(a) * r) * 100) / 100;
      const sz = Math.round((z + Math.cos(a) * r) * 100) / 100;
      if (out.some((s) => Math.hypot(s.x - sx, s.z - sz) < field.spacingM)) continue;
      let ok = false;
      try { ok = grass(sx, sz) === true; } catch { ok = false; }
      if (!ok) continue;
      out.push(Object.freeze({ x: sx, z: sz, spec: out.length % CRICKETS.length }));
      break;
    }
  }
  return Object.freeze(out);
}







export function cricketField(pool, { x = 0, z = 0, heading = 0 } = {}) {
  return Object.freeze((pool || []).map((s) => {
    const dx = s.x - x;
    const dz = s.z - z;
    const distanceM = Math.hypot(dx, dz);
    return Object.freeze({
      x: s.x, z: s.z, spec: s.spec, distanceM,
      pan: cricketPan(dx, dz, heading),
      gain: cricketGain(distanceM) * (CRICKETS[s.spec] ? CRICKETS[s.spec].gain : 1),
    });
  }));
}


export function poolIsStale(pool, at, { x = 0, z = 0 } = {}, field = CRICKET_FIELD) {
  if (!pool || pool.length === 0) return true;
  if (!at) return true;
  return Math.hypot(x - at.x, z - at.z) > field.resiteM;
}






export const cricketsArePositional = (tier) => tier !== 'low';
