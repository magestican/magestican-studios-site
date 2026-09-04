




































export const MASTER = 0.35;


export const CEILING = 0.22;


export const TOP_HZ = 900;


export const MAX_MS = 200;















export const CUES = Object.freeze({
  
  lift: { wave: 'triangle', hz: 300, ms: 45, gain: 0.11, attack: 0.004, release: 0.04 },
  
  
  place: { wave: 'triangle', hz: 450, ms: 55, gain: 0.14, attack: 0.005, release: 0.05, step: 22 },
  
  recall: { wave: 'triangle', hz: 260, ms: 45, gain: 0.11, attack: 0.004, release: 0.04 },
  
  score: { wave: 'triangle', hz: 523.25, ms: 110, gain: 0.17, attack: 0.006, release: 0.1, chord: [0, 4, 7] },
  
  
  
  bingo: { wave: 'triangle', hz: 523.25, ms: 190, gain: 0.2, attack: 0.008, release: 0.18, chord: [0, 4, 7, 12, 16] },
  
  refuse: { wave: 'sine', hz: 150, ms: 130, gain: 0.16, attack: 0.008, release: 0.12 },
  
  swap: { wave: 'triangle', hz: 340, ms: 90, gain: 0.12, attack: 0.006, release: 0.08, chord: [0, -5] },
  
  
  
  turn: { wave: 'triangle', hz: 392, ms: 120, gain: 0.15, attack: 0.006, release: 0.11, chord: [0, 5] },
  
  over: { wave: 'triangle', hz: 349.23, ms: 190, gain: 0.18, attack: 0.01, release: 0.18, chord: [0, 4, 7, 12] },
});


export const semitone = (n) => 2 ** (n / 12);









export function placePitch(index, spec = CUES.place) {
  const hz = spec.hz + (spec.step ?? 0) * Math.max(0, index);
  return Math.min(TOP_HZ, hz);
}









export function gainFor(cue, { muted = false, master = MASTER } = {}) {
  if (muted) return 0;
  const raw = (cue?.gain ?? 0) * master;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(CEILING, raw);
}


export function voicesOf(cue, hz = null) {
  const root = hz ?? cue.hz;
  if (!cue.chord) return [Math.min(TOP_HZ, root)];
  return cue.chord.map((n) => Math.min(TOP_HZ, root * semitone(n)));
}










export function cueFor(event) {
  switch (event) {
    case 'lift':
    case 'press': return 'lift';
    case 'place':
    case 'type': return 'place';
    case 'recall': return 'recall';
    case 'play': return 'score';
    case 'bingo': return 'bingo';
    case 'reject': return 'refuse';
    case 'swap':
    case 'pass': return 'swap';
    case 'turn': return 'turn';
    case 'over': return 'over';
    default: return null;
  }
}









export const MUTE_KEY = 'farmy-scrabble:muted';









export const soundLabel = (muted) => `Sound: ${muted ? 'off' : 'on'}`;
