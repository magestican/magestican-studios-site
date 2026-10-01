


























export const MASTER = 0.35;
export const CEILING = 0.22;
export const TOP_HZ = 900;
export const MAX_MS = 200;








export const CUES = Object.freeze({
  
  
  lift: { kind: 'tone', voices: [{ hz: 520, gain: 0.05, at: 0, ms: 45 }] },
  
  
  move: { kind: 'noise', voices: [{ hz: 300, gain: 0.11, at: 0, ms: 60 }] },
  
  
  capture: {
    kind: 'noise',
    voices: [
      { hz: 380, gain: 0.13, at: 0, ms: 50 },
      { hz: 220, gain: 0.15, at: 55, ms: 90 },
    ],
  },
  
  
  castle: {
    kind: 'noise',
    voices: [
      { hz: 300, gain: 0.10, at: 0, ms: 55 },
      { hz: 300, gain: 0.10, at: 110, ms: 55 },
    ],
  },
  
  
  check: {
    kind: 'tone',
    voices: [
      { hz: 494, gain: 0.13, at: 0, ms: 80 },
      { hz: 740, gain: 0.12, at: 70, ms: 110 },
    ],
  },
  
  
  promote: {
    kind: 'tone',
    voices: [
      { hz: 523, gain: 0.11, at: 0, ms: 70 },
      { hz: 659, gain: 0.11, at: 60, ms: 80 },
      { hz: 784, gain: 0.12, at: 120, ms: 110 },
    ],
  },
  
  refuse: { kind: 'tone', voices: [{ hz: 210, gain: 0.09, at: 0, ms: 120 }] },
  
  
  
  over: {
    kind: 'tone',
    voices: [
      { hz: 392, gain: 0.13, at: 0, ms: 130 },
      { hz: 523, gain: 0.12, at: 90, ms: 150 },
      { hz: 659, gain: 0.11, at: 180, ms: 190 },
    ],
  },
});










export function cueFor(event) {
  if (!event) return null;
  if (event.over) return 'over';
  if (event.promotion) return 'promote';
  if (event.check) return 'check';
  if (event.castle) return 'castle';
  if (event.captured) return 'capture';
  if (event.from && event.to) return 'move';
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


export const MUTE_KEY = 'farmy-chess:v1:muted';
