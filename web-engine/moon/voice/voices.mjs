





















const voice = (v) => Object.freeze({
  ...v,
  sylDur: Object.freeze(v.sylDur),
  sylGap: Object.freeze(v.sylGap),
  onset: Object.freeze(v.onset),
  vibrato: v.vibrato ? Object.freeze(v.vibrato) : null,
});

export const VOICES = Object.freeze({
  
  
  cat: voice({
    id: 'cat', label: 'The cat',
    f0: 300, f0Seed: 10, declination: 0.96, questionRise: 1.3, exclaimLift: 1.08,
    lilt: 0.06, glide: 0.05, formant: 1.14,
    sylDur: [0.05, 0.078], sylGap: [0.008, 0.02], commaPause: 0.11, stopPause: 0.2,
    stressGain: 1.18, stressDur: 1.12, wobble: 0.03, maxSPerChar: 0.045,
    wave: 'sawtooth', onset: { kind: 'purr', dur: 0.04, gain: 0.35, band: 700, rateHz: 32 }, vibrato: null, gain: 0.9,
  }),
  
  cow: voice({
    id: 'cow', label: 'cow',
    f0: 145, f0Seed: 6, declination: 0.9, questionRise: 1.22, exclaimLift: 1.05,
    lilt: 0.025, glide: -0.03, formant: 0.88,
    sylDur: [0.085, 0.125], sylGap: [0.015, 0.035], commaPause: 0.15, stopPause: 0.28,
    stressGain: 1.2, stressDur: 1.2, wobble: 0.03, maxSPerChar: 0.07,
    wave: 'sawtooth', onset: { kind: 'noise', dur: 0.03, gain: 0.18, band: 900 }, vibrato: { rateHz: 4.5, depth: 0.025 }, gain: 1,
  }),
  
  pig: voice({
    id: 'pig', label: 'pig',
    f0: 205, f0Seed: 8, declination: 0.92, questionRise: 1.26, exclaimLift: 1.1,
    lilt: 0.045, glide: 0, formant: 0.97,
    sylDur: [0.06, 0.09], sylGap: [0.01, 0.025], commaPause: 0.12, stopPause: 0.22,
    stressGain: 1.22, stressDur: 1.15, wobble: 0.04, maxSPerChar: 0.05,
    wave: 'sawtooth', onset: { kind: 'purr', dur: 0.035, gain: 0.3, band: 450, rateHz: 18 }, vibrato: null, gain: 0.95,
  }),
  
  goat: voice({
    id: 'goat', label: 'goat',
    f0: 235, f0Seed: 9, declination: 0.9, questionRise: 1.24, exclaimLift: 1.08,
    lilt: 0.03, glide: -0.02, formant: 1.0,
    sylDur: [0.065, 0.095], sylGap: [0.01, 0.025], commaPause: 0.12, stopPause: 0.22,
    stressGain: 1.2, stressDur: 1.15, wobble: 0.035, maxSPerChar: 0.05,
    wave: 'square', onset: { kind: 'noise', dur: 0.025, gain: 0.2, band: 1800 }, vibrato: { rateHz: 10, depth: 0.1 }, gain: 0.7,
  }),
  
  sheep: voice({
    id: 'sheep', label: 'sheep',
    f0: 265, f0Seed: 9, declination: 0.94, questionRise: 1.28, exclaimLift: 1.06,
    lilt: 0.05, glide: 0.02, formant: 1.05,
    sylDur: [0.065, 0.095], sylGap: [0.01, 0.024], commaPause: 0.12, stopPause: 0.22,
    stressGain: 1.15, stressDur: 1.15, wobble: 0.03, maxSPerChar: 0.05,
    wave: 'sawtooth', onset: { kind: 'noise', dur: 0.025, gain: 0.15, band: 1400 }, vibrato: { rateHz: 7, depth: 0.07 }, gain: 0.9,
  }),
  
  duck: voice({
    id: 'duck', label: 'duck',
    f0: 340, f0Seed: 12, declination: 0.93, questionRise: 1.3, exclaimLift: 1.1,
    lilt: 0.05, glide: -0.07, formant: 1.25,
    sylDur: [0.045, 0.07], sylGap: [0.008, 0.02], commaPause: 0.1, stopPause: 0.2,
    stressGain: 1.2, stressDur: 1.1, wobble: 0.04, maxSPerChar: 0.045,
    wave: 'square', onset: { kind: 'click', dur: 0.012, gain: 0.3, band: 2600 }, vibrato: null, gain: 0.6,
  }),
  
  
  elephant: voice({
    id: 'elephant', label: 'elephant',
    f0: 152, f0Seed: 6, declination: 0.94, questionRise: 1.26, exclaimLift: 1.14,
    lilt: 0.07, glide: 0.06, formant: 0.86,
    sylDur: [0.08, 0.115], sylGap: [0.014, 0.03], commaPause: 0.14, stopPause: 0.26,
    stressGain: 1.22, stressDur: 1.2, wobble: 0.03, maxSPerChar: 0.065,
    wave: 'sawtooth', onset: { kind: 'noise', dur: 0.03, gain: 0.16, band: 700 }, vibrato: { rateHz: 5.5, depth: 0.03 }, gain: 1,
  }),
  
  panda: voice({
    id: 'panda', label: 'panda',
    f0: 188, f0Seed: 7, declination: 0.95, questionRise: 1.25, exclaimLift: 1.06,
    lilt: 0.04, glide: 0.02, formant: 0.95,
    sylDur: [0.09, 0.125], sylGap: [0.016, 0.032], commaPause: 0.16, stopPause: 0.28,
    stressGain: 1.12, stressDur: 1.18, wobble: 0.025, maxSPerChar: 0.068,
    wave: 'triangle', onset: { kind: 'purr', dur: 0.03, gain: 0.2, band: 500, rateHz: 14 }, vibrato: null, gain: 1,
  }),
  
  human: voice({
    id: 'human', label: 'human',
    f0: 228, f0Seed: 9, declination: 0.95, questionRise: 1.28, exclaimLift: 1.1,
    lilt: 0.05, glide: 0.03, formant: 1.0,
    sylDur: [0.06, 0.088], sylGap: [0.01, 0.024], commaPause: 0.12, stopPause: 0.22,
    stressGain: 1.18, stressDur: 1.14, wobble: 0.035, maxSPerChar: 0.05,
    wave: 'sawtooth', onset: { kind: 'noise', dur: 0.02, gain: 0.12, band: 1200 }, vibrato: null, gain: 0.9,
  }),
  
  giraffe: voice({
    id: 'giraffe', label: 'giraffe',
    f0: 262, f0Seed: 9, declination: 0.96, questionRise: 1.28, exclaimLift: 1.06,
    lilt: 0.06, glide: 0.04, formant: 1.08,
    sylDur: [0.07, 0.1], sylGap: [0.012, 0.026], commaPause: 0.13, stopPause: 0.24,
    stressGain: 1.1, stressDur: 1.12, wobble: 0.025, maxSPerChar: 0.055,
    wave: 'triangle', onset: { kind: 'noise', dur: 0.04, gain: 0.22, band: 2400 }, vibrato: { rateHz: 6, depth: 0.02 }, gain: 1,
  }),
  
  
  
  
  
  mole: voice({
    id: 'mole', label: 'mole',
    f0: 168, f0Seed: 7, declination: 0.88, questionRise: 1.18, exclaimLift: 1.04,
    lilt: 0.03, glide: -0.04, formant: 0.84,
    sylDur: [0.085, 0.13], sylGap: [0.018, 0.038], commaPause: 0.16, stopPause: 0.3,
    stressGain: 1.12, stressDur: 1.2, wobble: 0.045, maxSPerChar: 0.07,
    wave: 'triangle', onset: { kind: 'noise', dur: 0.035, gain: 0.26, band: 520 }, vibrato: null, gain: 0.95,
  }),
  
  chicken: voice({
    id: 'chicken', label: 'chicken',
    f0: 430, f0Seed: 14, declination: 0.94, questionRise: 1.32, exclaimLift: 1.1,
    lilt: 0.09, glide: -0.08, formant: 1.3,
    sylDur: [0.035, 0.055], sylGap: [0.006, 0.016], commaPause: 0.09, stopPause: 0.18,
    stressGain: 1.25, stressDur: 1.1, wobble: 0.04, maxSPerChar: 0.04,
    wave: 'sawtooth', onset: { kind: 'click', dur: 0.01, gain: 0.35, band: 3200 }, vibrato: null, gain: 0.75,
  }),
});





export const VILLAGER_SPECIES = Object.freeze(['elephant', 'giraffe', 'panda', 'human', 'pig']);

export function voiceOf(id) {
  const v = VOICES[id];
  if (!v) throw new Error(`no voice '${id}' (voices: ${Object.keys(VOICES).join(', ')})`);
  return v;
}
