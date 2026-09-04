






























export const MASTER = 0.35;


export const CEILING = 0.22;






export const TOP_HZ = 900;









export const CUES = Object.freeze({
  
  click: { wave: 'triangle', hz: 440, ms: 55, gain: 0.16, attack: 0.006, release: 0.05 },
  
  drag: { wave: 'triangle', hz: 330, ms: 45, gain: 0.13, attack: 0.004, release: 0.04, step: 34 },
  
  key: { wave: 'triangle', hz: 520, ms: 35, gain: 0.09, attack: 0.004, release: 0.03 },
  
  found: { wave: 'triangle', hz: 523.25, ms: 90, gain: 0.17, attack: 0.006, release: 0.09, chord: [0, 4, 7] },
  
  special: { wave: 'triangle', hz: 523.25, ms: 120, gain: 0.18, attack: 0.006, release: 0.12, chord: [0, 4, 7, 12] },
  
  refuse: { wave: 'sine', hz: 155, ms: 130, gain: 0.16, attack: 0.008, release: 0.12 },
  
  win: { wave: 'triangle', hz: 392, ms: 150, gain: 0.18, attack: 0.008, release: 0.16, chord: [0, 4, 7, 12, 16] },
});


export const semitone = (n) => 2 ** (n / 12);










export function dragPitch(index, spec = CUES.drag) {
  const hz = spec.hz + spec.step * Math.max(0, index);
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
  if (!cue.chord) return [root];
  return cue.chord.map((n) => root * semitone(n));
}









export function cueFor(event) {
  switch (event) {
    case 'press': return 'click';
    case 'type': return 'key';
    case 'trail': return 'drag';
    case 'word': return 'found';
    case 'pangram':
    case 'spangram': return 'special';
    case 'reject': return 'refuse';
    case 'win': return 'win';
    default: return null;
  }
}
















export const MUTE_KEY = 'farmy-crosswords:v2:muted';
