


























export const BPM = 70;
export const BEATS_PER_BAR = 4;
export const BARS_PER_SECTION = 8;
export const SECTIONS = 5;

export const BEAT_SECONDS = 60 / BPM;
export const BAR_SECONDS = BEAT_SECONDS * BEATS_PER_BAR;
export const LOOP_BARS = BARS_PER_SECTION * SECTIONS;
export const LOOP_SECONDS = LOOP_BARS * BAR_SECONDS;









export const SWING = 0.62;







export const BASS_FLOOR = 36;








export const KEY_CEILING = 84;


export function swingAt(sixteenth) {
  const beat = Math.floor(sixteenth / 4);
  const within = sixteenth % 4;
  const pairs = [0, SWING / 2, 0.5, 0.5 + SWING / 2];
  return beat + pairs[within];
}











const Gm9 = [65, 69, 72, 74];      
const C13 = [64, 69, 70, 74];      
const Fmaj9 = [65, 67, 69, 72];    
const Dm7 = [65, 69, 72, 77];      

const PROGRESSION = [Gm9, C13, Fmaj9, Dm7];
const ROOTS = [43, 36, 41, 38];    









const SECTION_SHAPE = [
  { keys: 1, octave: 0, hats: true, kick: 'full', open: false },
  { keys: 1, octave: 0, hats: true, kick: 'full', open: true },
  { keys: 0.8, octave: 12, hats: false, kick: 'sparse', open: false },
  { keys: 1, octave: 0, hats: true, kick: 'full', open: true },
  
  
  
  
  { keys: 0.85, octave: 0, hats: true, kick: 'busy', open: true },
];


export function shapeAt(bar) {
  const b = ((bar % LOOP_BARS) + LOOP_BARS) % LOOP_BARS;
  return {
    section: Math.floor(b / BARS_PER_SECTION),
    barInSection: b % BARS_PER_SECTION,
    ...SECTION_SHAPE[Math.floor(b / BARS_PER_SECTION)],
  };
}


export function chordAt(bar) {
  const { section, barInSection, octave } = shapeAt(bar);
  const at = Math.floor(barInSection / 2) % PROGRESSION.length;
  return {
    notes: PROGRESSION[at].map((n) => n + octave),
    root: ROOTS[at],
    section,
    at,
  };
}


export function noteHz(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}









export function eventsForBar(bar) {
  const shape = shapeAt(bar);
  const chord = chordAt(bar);
  const out = [];
  const at = (sixteenth) => swingAt(sixteenth);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const voicing = new Set(chord.notes);
  const key = (note) => {
    if (note <= KEY_CEILING) return note;
    const down = note - 12;
    return voicing.has(down) ? down - 12 : down;
  };
  if (chord.at !== undefined && shape.barInSection % 2 === 0) {
    chord.notes.forEach((n, i) => {
      out.push({
        kind: 'key', note: key(n), at: at(2) + i * 0.012,
        gain: 0.075 * shape.keys, length: BAR_SECONDS * 1.9,
      });
    });
  } else {
    
    
    chord.notes.slice(2).forEach((n, i) => {
      out.push({
        kind: 'key', note: key(n), at: at(6) + i * 0.012,
        gain: 0.045 * shape.keys, length: BAR_SECONDS * 0.9,
      });
    });
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const bass = (note) => Math.max(BASS_FLOOR, note);
  out.push({ kind: 'bass', note: bass(chord.root), at: at(0), gain: 0.30, length: BEAT_SECONDS * 1.6 });
  out.push({ kind: 'bass', note: bass(chord.root + 7), at: at(11), gain: 0.20, length: BEAT_SECONDS * 0.7 });
  if (shape.barInSection % 4 === 3) {
    out.push({ kind: 'bass', note: bass(chord.root - 12), at: at(14), gain: 0.24, length: BEAT_SECONDS });
  }

  
  
  const kicks = shape.kick === 'sparse' ? [0, 8]
    : shape.kick === 'busy' ? [0, 6, 8, 14] : [0, 6, 8];
  for (const k of kicks) out.push({ kind: 'kick', at: at(k), gain: 0.55 });

  
  
  
  for (const s of [4, 12]) out.push({ kind: 'rim', at: at(s), gain: 0.26 });

  
  if (shape.hats) {
    for (let i = 1; i < 16; i += 2) {
      out.push({ kind: 'hat', at: at(i), gain: i % 4 === 1 ? 0.075 : 0.05 });
    }
  }
  
  if (shape.open && shape.barInSection === BARS_PER_SECTION - 1) {
    out.push({ kind: 'openhat', at: at(14), gain: 0.10 });
  }

  return out.sort((a, b) => a.at - b.at);
}


export function wholeLoop() {
  const out = [];
  for (let bar = 0; bar < LOOP_BARS; bar += 1) {
    for (const e of eventsForBar(bar)) out.push({ ...e, bar });
  }
  return out;
}
