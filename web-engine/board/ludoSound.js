

























export const MASTER = 0.35;
export const CEILING = 0.22;
export const TOP_HZ = 900;
export const MAX_MS = 200;







export const CUES = Object.freeze({
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  roll: {
    kind: 'noise',
    voices: [
      { hz: 430, gain: 0.110, at: 0, ms: 42 },
      { hz: 360, gain: 0.095, at: 68, ms: 40 },
      { hz: 470, gain: 0.080, at: 130, ms: 36 },
      { hz: 340, gain: 0.068, at: 184, ms: 34 },
      { hz: 410, gain: 0.056, at: 232, ms: 30 },
      { hz: 320, gain: 0.046, at: 272, ms: 28 },
      { hz: 380, gain: 0.039, at: 308, ms: 26 },
      { hz: 300, gain: 0.035, at: 338, ms: 24 },
    ],
  },
  
  
  settle: { kind: 'noise', voices: [{ hz: 245, gain: 0.13, at: 0, ms: 85 }] },
  
  
  step: { kind: 'tone', voices: [{ hz: 520, gain: 0.055, at: 0, ms: 60 }] },
  
  
  capture: {
    kind: 'tone',
    voices: [
      { hz: 640, gain: 0.15, at: 0, ms: 90 },
      { hz: 400, gain: 0.13, at: 60, ms: 120 },
    ],
  },
  
  out: {
    kind: 'tone',
    voices: [
      { hz: 430, gain: 0.10, at: 0, ms: 70 },
      { hz: 645, gain: 0.10, at: 55, ms: 90 },
    ],
  },
  
  
  home: {
    kind: 'tone',
    voices: [
      { hz: 523, gain: 0.13, at: 0, ms: 90 },
      { hz: 659, gain: 0.13, at: 45, ms: 110 },
    ],
  },
  
  
  yours: { kind: 'tone', voices: [{ hz: 587, gain: 0.09, at: 0, ms: 80 }] },
  
  pass: { kind: 'tone', voices: [{ hz: 240, gain: 0.08, at: 0, ms: 110 }] },
  
  
  win: {
    kind: 'tone',
    voices: [
      { hz: 523, gain: 0.14, at: 0, ms: 140 },
      { hz: 659, gain: 0.13, at: 70, ms: 150 },
      { hz: 784, gain: 0.12, at: 140, ms: 190 },
    ],
  },
});


export function cueFor(event) {
  if (!event) return null;
  if (event.kind === 'pass' || event.kind === 'forfeit') return 'pass';
  if (event.captures?.length) return 'capture';
  if (event.kind === 'home') return 'home';
  if (event.kind === 'out') return 'out';
  if (event.kind === 'move') return 'step';
  return null;
}


export function voicesOf(name) {
  const cue = CUES[name];
  if (!cue) return [];
  return cue.voices.map((v) => ({
    ...v,
    hz: Math.min(TOP_HZ, Math.max(40, v.hz)),
    gain: Math.min(CEILING, Math.max(0, v.gain)),
    ms: Math.min(MAX_MS, Math.max(10, v.ms)),
  }));
}


export function gainFor(name) {
  return voicesOf(name).reduce((t, v) => t + v.gain, 0) * MASTER;
}


export const MUTE_KEY = 'farmy-ludo:v1:muted';
