































































































































































export function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const PITCH_CLASS = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });








export function n(name) {
  const m = /^([A-G])([#b]?)(-?\d+)$/.exec(name);
  if (!m) throw new Error(`kartSongSpec: bad note name ${JSON.stringify(name)}`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + PITCH_CLASS[m[1]] + acc;
}

const NAMES_SHARP = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);


export function noteName(midi) {
  if (midi == null) return '--';
  return `${NAMES_SHARP[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}


export const pc = (midi) => (((midi % 12) + 12) % 12);

const LETTERS = Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
const accName = (a) => (a === 0 ? '' : a > 0 ? '#'.repeat(a) : 'b'.repeat(-a));


















export function spellMode(rootPc, mode) {
  const scale = MODES[mode];
  if (!scale) throw new Error(`kartSongSpec: unknown mode ${JSON.stringify(mode)}`);
  let best = null;
  for (let li = 0; li < LETTERS.length; li += 1) {
    for (let acc = -1; acc <= 1; acc += 1) {
      if (((PITCH_CLASS[LETTERS[li]] + acc) % 12 + 12) % 12 !== ((rootPc % 12) + 12) % 12) continue;
      const names = [];
      let score = 0;
      for (let d = 0; d < scale.length; d += 1) {
        const letter = LETTERS[(li + d) % LETTERS.length];
        const want = (((rootPc + scale[d]) % 12) + 12) % 12;
        let a = want - PITCH_CLASS[letter];
        while (a > 6) a -= 12;
        while (a < -6) a += 12;
        names.push(letter + accName(a));
        score += Math.abs(a) + (Math.abs(a) > 1 ? 10 : 0);
      }
      if (!best || score < best.score) best = { score, names };
    }
  }
  return Object.freeze(best.names);
}


export function spellNote(midi, rootPc, mode) {
  const scale = MODES[mode];
  const names = spellMode(rootPc, mode);
  const d = scale.indexOf((((midi - rootPc) % 12) + 12) % 12);
  const octave = Math.floor(midi / 12) - 1;
  return d === -1 ? noteName(midi) : `${names[d]}${octave}`;
}


















export const MODES = Object.freeze({
  ionian: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
  mixolydian: Object.freeze([0, 2, 4, 5, 7, 9, 10]),
  lydian: Object.freeze([0, 2, 4, 6, 7, 9, 11]),
});

export const MODE_NAMES = Object.freeze(Object.keys(MODES));








export const BRIGHTNESS = Object.freeze({ lydian: 3, ionian: 2, mixolydian: 1 });


export function isBrightMode(mode) {
  const s = MODES[mode];
  if (!s) return false;
  return s.includes(4) && !s.includes(3);
}



















export const CHORD_QUALITIES = Object.freeze({
  maj: Object.freeze([0, 4, 7]),
  maj6: Object.freeze([0, 4, 7, 9]),
  maj7: Object.freeze([0, 4, 7, 11]),
  maj9: Object.freeze([0, 4, 7, 11, 14]),
  add9: Object.freeze([0, 4, 7, 14]),
  dom7: Object.freeze([0, 4, 7, 10]),
  dom9: Object.freeze([0, 4, 7, 10, 14]),
  dom7sus4: Object.freeze([0, 5, 7, 10]),
  sus2: Object.freeze([0, 7, 14]),
  sus4: Object.freeze([0, 5, 7]),
  min7: Object.freeze([0, 3, 7, 10]),
});

export const QUALITY_NAMES = Object.freeze(Object.keys(CHORD_QUALITIES));


export const isMinorQuality = (q) => (CHORD_QUALITIES[q] || []).some((i) => i % 12 === 3);


const QUALITY_SUFFIX = Object.freeze({
  maj: '', maj6: '6', maj7: 'maj7', maj9: 'maj9', add9: 'add9',
  dom7: '7', dom9: '9', dom7sus4: '7sus4', sus2: 'sus2', sus4: 'sus4', min7: 'm7',
});



















export const MIN_MIDI = 45;



















export const LOW_THIRD_MIDI = 52;








export const BASS_LO = 45;
export const BASS_HI = 56;











export const COMP_LO = 62;
export const COMP_HI = 73;


export function toRegister(midi, lo, hi) {
  let m = midi;
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  return m;
}














export function chordAt(rootMidi, mode, degree, quality, { octave = 0 } = {}) {
  const scale = MODES[mode];
  if (!scale) throw new Error(`kartSongSpec: unknown mode ${JSON.stringify(mode)}`);
  const stack = CHORD_QUALITIES[quality];
  if (!stack) throw new Error(`kartSongSpec: unknown chord quality ${JSON.stringify(quality)}`);

  const d = ((degree % scale.length) + scale.length) % scale.length;
  const oct = Math.floor(degree / scale.length);
  const chordRoot = toRegister(rootMidi + scale[d], BASS_LO, BASS_HI) + 12 * (oct + octave);

  const out = stack.map((interval) => {
    let note = chordRoot + interval;
    
    
    if (interval % 12 === 3 || interval % 12 === 4) {
      while (note < LOW_THIRD_MIDI) note += 12;
    }
    while (note < MIN_MIDI) note += 12;
    return note;
  });
  return Object.freeze([...new Set(out)].sort((a, b) => a - b));
}


export const chordPitchClasses = (notes) => [...new Set(notes.map(pc))].sort((a, b) => a - b);


export function scaleLadder(rootMidi, mode, lo, hi) {
  const scale = MODES[mode];
  const want = new Set(scale.map((s) => pc(rootMidi + s)));
  const out = [];
  for (let m = lo; m <= hi; m += 1) if (want.has(pc(m))) out.push(m);
  return out;
}





















export function swungBeat(beat, swing = 0) {
  if (!swing) return beat;
  const whole = Math.floor(beat);
  const frac = beat - whole;
  const pivot = (1 + swing) / 2;
  const f = frac < 0.5
    ? frac * (pivot / 0.5)
    : pivot + (frac - 0.5) * ((1 - pivot) / 0.5);
  return whole + f;
}









export function nextBarBoundary(pos, perBar) {
  return Math.ceil(pos / perBar) * perBar;
}












export const asNotes = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

export const totalBeats = (seq) => seq.reduce((s, [, b]) => s + b, 0);











export function assertBeats(seq, beats, what) {
  const got = totalBeats(seq);
  if (Math.abs(got - beats) > 1e-9) {
    throw new Error(`${what}: ${got} beats, expected ${beats}`);
  }
  return seq;
}










export function mel(str) {
  const t = str.trim().split(/\s+/);
  if (t.length % 2 !== 0) throw new Error(`kartSongSpec: unpaired note/duration in ${JSON.stringify(str)}`);
  const out = [];
  for (let i = 0; i < t.length; i += 2) {
    out.push([t[i] === '-' ? null : n(t[i]), Number(t[i + 1])]);
  }
  return out;
}














export function compVoicing(chordNotes) {
  const root = pc(chordNotes[0]);
  const out = [];
  for (const p of new Set(chordNotes.map(pc))) {
    if (p === root) continue;
    out.push(toRegister(60 + p, COMP_LO, COMP_HI));
  }
  return Object.freeze([...new Set(out)].sort((a, b) => a - b));
}

function compBar(style, chordNotes) {
  const v = compVoicing(chordNotes);
  switch (style) {
    
    
    
    
    
    case 'chop':
      return [[null, 0.5], [v, 0.5], [null, 0.5], [v, 0.5], [null, 0.5], [v, 0.5], [null, 0.5], [v, 0.5]];
    
    
    case 'shimmer':
      return [[v, 1.5], [null, 0.5], [v, 1.5], [null, 0.5]];
    
    case 'stab':
      return [[v, 0.25], [null, 0.75], [v, 0.25], [null, 0.75], [v, 0.25], [null, 0.75], [v, 0.25], [null, 0.75]];
    
    case 'pulse':
      return [[v, 0.5], [v, 0.5], [v, 0.5], [v, 0.5], [v, 0.5], [v, 0.5], [v, 0.5], [v, 0.5]];
    default:
      throw new Error(`kartSongSpec: unknown comp style ${JSON.stringify(style)}`);
  }
}


function approachNote(ladder, target) {
  let below = null;
  let above = null;
  for (const m of ladder) {
    if (m < target) below = m;
    if (m > target && above == null) above = m;
  }
  return below ?? above ?? target;
}

function bassBar(style, chordNotes, nextChordNotes, ladder, isLastOfPhrase) {
  const root = toRegister(chordNotes[0], BASS_LO, BASS_HI);
  const fifth = toRegister(root + 7, BASS_LO, BASS_HI);
  const third = toRegister(chordNotes[1] ?? root + 4, BASS_LO, BASS_HI);
  const nextRoot = toRegister((nextChordNotes ?? chordNotes)[0], BASS_LO, BASS_HI);

  switch (style) {
    
    
    
    
    
    case 'boomchuck':
      return isLastOfPhrase
        ? [[root, 1], [fifth, 1], [root, 1], [approachNote(ladder, nextRoot), 0.5], [nextRoot === root ? fifth : approachNote(ladder, nextRoot), 0.5]]
        : [[root, 1], [fifth, 1], [root, 1], [fifth, 1]];
    
    
    
    case 'walk':
      return [[root, 1], [third, 1], [fifth, 1], [approachNote(ladder, nextRoot), 1]];
    
    
    
    
    case 'pad':
      return [[root, 2], [fifth, 2]];
    
    
    case 'pump':
      return [[root, 0.5], [root, 0.5], [fifth, 0.5], [root, 0.5], [root, 0.5], [root, 0.5], [fifth, 0.5], [fifth, 0.5]];
    
    case 'stomp':
      return [[root, 1], [null, 0.5], [root, 0.5], [fifth, 1], [fifth, 0.5], [root, 0.5]];
    default:
      throw new Error(`kartSongSpec: unknown bass style ${JSON.stringify(style)}`);
  }
}

















export function drumBar(style, barIndex, bars) {
  const ev = [];
  const put = (drum, at, gain) => ev.push(Object.freeze({ drum, at, gain }));
  const first = barIndex === 0;
  const last = barIndex === bars - 1;
  const eighthHats = (skip) => {
    for (let e = 0; e < 8; e += 1) {
      const at = e * 0.5;
      if (skip != null && at === skip) continue;
      put('hat', at, e % 2 ? 0.085 : 0.125);
    }
  };
  const sixteenthShaker = (loud, soft) => {
    for (let s = 0; s < 16; s += 1) put('shaker', s * 0.25, s % 4 === 0 ? loud : soft);
  };

  switch (style) {
    
    
    
    case 'hoedown':
      if (first) put('crash', 0, 0.22);
      put('kick', 0, 0.60); put('kick', 2, 0.52);
      put('clap', 1, 0.42); put('clap', 3, 0.42);
      eighthHats(3.5);
      put('openhat', 3.5, 0.16);
      sixteenthShaker(0.050, 0.032);
      if (last) { put('snare', 3.25, 0.24); put('snare', 3.5, 0.28); put('snare', 3.75, 0.32); }
      break;
    
    
    
    case 'shuffle':
      if (first) put('crash', 0, 0.20);
      put('kick', 0, 0.60); put('kick', 2, 0.48);
      if (barIndex % 2 === 1) put('kick', 3.5, 0.34);   
      put('snare', 1, 0.38); put('snare', 3, 0.38);
      eighthHats(null);
      if (last) { put('snare', 3.25, 0.26); put('snare', 3.75, 0.34); }
      break;
    
    
    
    case 'glide':
      if (first) put('crash', 0, 0.24);
      put('kick', 0, 0.56); put('kick', 1, 0.40); put('kick', 2, 0.52); put('kick', 3, 0.40);
      put('clap', 1, 0.40); put('clap', 3, 0.40);
      sixteenthShaker(0.055, 0.034);
      put('openhat', 3.5, 0.14);
      if (last) { put('clap', 3.5, 0.30); put('clap', 3.75, 0.34); }
      break;
    
    case 'stomp':
      if (first) put('crash', 0, 0.22);
      put('kick', 0, 0.58); put('kick', 1, 0.38); put('kick', 2, 0.52); put('kick', 3, 0.38);
      put('snare', 1, 0.40); put('snare', 3, 0.40);
      eighthHats(3.5);
      put('openhat', 3.5, 0.15);
      if (last) { put('snare', 3.5, 0.30); put('snare', 3.75, 0.36); }
      break;
    
    
    
    case 'stick':
      put('kick', 0, 0.58); put('kick', 2.5, 0.44);
      put('stick', 1, 0.34); put('stick', 3, 0.34);
      for (let e = 0; e < 8; e += 1) put('shaker', e * 0.5, e % 2 ? 0.038 : 0.056);
      if (last) { put('stick', 3.5, 0.30); put('stick', 3.75, 0.34); }
      break;
    default:
      throw new Error(`kartSongSpec: unknown drum style ${JSON.stringify(style)}`);
  }
  return ev;
}


export const DRUM_KINDS = Object.freeze(['kick', 'snare', 'clap', 'hat', 'openhat', 'shaker', 'crash', 'stick']);















export const PREVIOUS_BPM = Object.freeze({ sunflower: 138, muddybottom: 112, frostfield: 124 });

const SUNFLOWER = {
  id: 'sunflower',
  name: 'Sunflower Hoedown',
  theme: 'summer',
  
  
  
  bpm: 146,
  root: n('D3'),
  
  
  
  
  
  mode: 'mixolydian',
  swing: 0,
  gainScale: 1.00,
  voices: { lead: 'pluck', comp: 'chop', bass: 'boomchuck' },
  drums: 'hoedown',
  
  
  
  
  
  
  
  
  
  
  progression: [
    { degree: 0, quality: 'maj6' },
    { degree: 0, quality: 'maj6' },
    { degree: 3, quality: 'add9' },
    { degree: 3, quality: 'add9' },
    { degree: 6, quality: 'maj' },
    { degree: 3, quality: 'add9' },
    { degree: 6, quality: 'maj' },
    { degree: 0, quality: 'maj6' },
  ],
  
  
  
  lead: [
    mel('A4 .5 B4 .5 D5 .5 B4 .5 A4 .5 F#4 .5 A4 1'),
    mel('D5 .25 E5 .25 F#5 .5 E5 .5 D5 .5 B4 .5 A4 .5 B4 1'),
    mel('G4 .5 B4 .5 D5 .5 G5 1 F#5 .5 E5 .5 D5 .5'),
    mel('B4 .5 D5 .5 E5 .5 D5 .5 B4 .5 A4 .5 B4 1'),
    mel('C5 .5 E5 .5 G5 1 E5 .5 D5 .5 C5 1'),
    mel('B4 .5 D5 .5 G5 1 F#5 .5 E5 .5 D5 1'),
    
    
    
    
    
    
    mel('G4 .5 E5 .5 D5 .5 C5 .5 D5 .5 E5 .5 G5 1'),
    mel('D5 .5 B4 .5 A4 .5 F#4 .5 A4 .5 B4 .5 D5 1'),
  ],
};

const MUDDYBOTTOM = {
  id: 'muddybottom',
  name: 'Muddy Bottom Shuffle',
  theme: 'mud',
  
  
  
  
  
  bpm: 132,
  root: n('A2'),
  
  
  mode: 'ionian',
  
  swing: 0.33,
  gainScale: 0.94,
  voices: { lead: 'reed', comp: 'chop', bass: 'walk' },
  drums: 'shuffle',
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  progression: [
    { degree: 0, quality: 'maj6' },
    { degree: 0, quality: 'maj6' },
    { degree: 3, quality: 'maj9' },
    { degree: 3, quality: 'maj9' },
    { degree: 0, quality: 'maj6' },
    { degree: 5, quality: 'min7' },
    { degree: 1, quality: 'min7' },
    { degree: 4, quality: 'dom7' },
  ],
  lead: [
    mel('E4 .5 A4 .5 C#5 .5 A4 .5 E4 .5 F#4 .5 E4 1'),
    mel('A4 .5 C#5 .5 E5 .5 C#5 .5 B4 .5 A4 .5 F#4 1'),
    mel('D5 .5 C#5 .5 A4 .5 F#4 .5 A4 .5 D5 .5 E5 1'),
    mel('F#5 .5 E5 .5 D5 .5 C#5 .5 D5 .5 E5 .5 C#5 1'),
    
    
    
    
    mel('A4 .5 F#5 .5 E5 .5 C#5 .5 A4 .5 B4 .5 C#5 1'),
    mel('F#4 .5 A4 .5 C#5 .5 E5 1 C#5 .5 A4 .5 B4 .5'),
    mel('B4 .5 D5 .5 F#5 .5 D5 .5 B4 .5 A4 .5 B4 1'),
    mel('E5 .5 D5 .5 B4 .5 G#4 .5 B4 .5 D5 .5 E5 1'),
  ],
};

const FROSTFIELD = {
  id: 'frostfield',
  name: 'Frostfield Glide',
  theme: 'snow',
  
  
  
  
  bpm: 152,
  root: n('E3'),
  
  
  mode: 'lydian',
  swing: 0,
  gainScale: 0.88,
  voices: { lead: 'bell', comp: 'shimmer', bass: 'pad' },
  drums: 'glide',
  
  
  
  
  
  
  
  
  
  
  
  progression: [
    { degree: 0, quality: 'maj7' },
    { degree: 0, quality: 'maj7' },
    { degree: 1, quality: 'maj' },
    { degree: 1, quality: 'maj' },
    { degree: 0, quality: 'maj7' },
    { degree: 1, quality: 'add9' },
    { degree: 4, quality: 'sus2' },
    { degree: 0, quality: 'maj6' },
  ],
  
  
  
  
  
  lead: [
    mel('E4 .5 G#4 .5 B4 .5 D#5 1 B4 .5 G#4 .5 B4 .5'),
    mel('C#5 .5 B4 .5 G#4 .5 F#4 .5 G#4 .5 B4 .5 E5 1'),
    mel('F#4 .5 A#4 .5 C#5 .5 E5 1 C#5 .5 A#4 .5 C#5 .5'),
    mel('D#5 .5 C#5 .5 A#4 .5 G#4 .5 A#4 .5 C#5 .5 F#5 1'),
    mel('E5 .5 G#5 .5 B5 1 G#5 .5 F#5 .5 E5 1'),
    mel('F#5 .5 A#5 .5 C#6 1 B5 .5 A#5 .5 G#5 1'),
    mel('B5 .5 F#5 .5 C#6 .5 B5 .5 A#5 .5 G#5 .5 F#5 1'),
    mel('E5 .5 C#5 .5 B4 .5 G#4 .5 B4 .5 C#5 .5 E5 1'),
  ],
};




const HARVEST_MOON = {
  id: 'harvest-moon-night',
  name: 'Harvest Moon Night',
  theme: 'night',
  bpm: 150,
  root: n('G3'),
  mode: 'ionian',
  swing: 0,
  gainScale: 0.96,
  voices: { lead: 'brass', comp: 'pulse', bass: 'pump' },
  drums: 'stomp',
  
  
  
  
  progression: [
    { degree: 0, quality: 'maj7' },
    { degree: 3, quality: 'add9' },
    { degree: 0, quality: 'maj7' },
    { degree: 4, quality: 'maj6' },
    { degree: 5, quality: 'min7' },
    { degree: 3, quality: 'add9' },
    { degree: 4, quality: 'dom7sus4' },
    { degree: 0, quality: 'maj6' },
  ],
  lead: [
    mel('D5 .5 G5 .5 F#5 .5 D5 .5 B4 .5 D5 .5 G5 1'),
    mel('E5 .5 D5 .5 C5 .5 E5 .5 G5 .5 E5 .5 D5 1'),
    mel('B4 .5 D5 .5 G5 1 F#5 .5 E5 .5 D5 1'),
    
    mel('A4 .5 F#5 .5 A5 1 F#5 .5 E5 .5 D5 1'),
    mel('E5 .5 G5 .5 B5 1 A5 .5 G5 .5 E5 1'),
    mel('G5 .5 E5 .5 C5 .5 E5 .5 G5 .5 A5 .5 G5 1'),
    mel('A5 .5 G5 .5 D5 .5 C5 .5 D5 .5 G5 .5 A5 1'),
    mel('B5 .5 A5 .5 G5 .5 E5 .5 D5 .5 B4 .5 G4 1'),
  ],
};

const DUST_BOWL = {
  id: 'dust-bowl-run',
  name: 'Dust Bowl Run',
  theme: 'dust',
  bpm: 144,
  root: n('C3'),
  mode: 'mixolydian',
  swing: 0,
  gainScale: 0.92,
  voices: { lead: 'pluck', comp: 'stab', bass: 'stomp' },
  drums: 'stick',
  
  
  
  
  progression: [
    { degree: 0, quality: 'maj6' },
    { degree: 6, quality: 'maj' },
    { degree: 3, quality: 'add9' },
    { degree: 0, quality: 'maj6' },
    { degree: 0, quality: 'maj6' },
    { degree: 6, quality: 'maj' },
    { degree: 3, quality: 'add9' },
    { degree: 0, quality: 'maj6' },
  ],
  lead: [
    mel('G4 .5 C5 .5 E5 .5 C5 .5 G4 .5 A4 .5 C5 1'),
    mel('Bb4 .5 D5 .5 F5 .5 D5 .5 Bb4 .5 C5 .5 D5 1'),
    
    
    mel('C5 .5 A5 .5 G5 .5 F5 .5 C5 .5 F5 .5 G5 1'),
    mel('E5 .5 G5 .5 A5 1 G5 .5 E5 .5 C5 1'),
    mel('C5 .25 D5 .25 E5 .5 G5 .5 E5 .5 C5 .5 G4 .5 C5 1'),
    mel('D5 .5 F5 .5 Bb5 1 A5 .5 F5 .5 D5 1'),
    mel('C5 .5 F5 .5 A5 .5 G5 .5 F5 .5 E5 .5 D5 1'),
    mel('C5 .5 Bb4 .5 A4 .5 G4 .5 A4 .5 C5 .5 E5 1'),
  ],
};




























const SALTMARSH = {
  id: 'saltmarsh',
  name: 'Saltmarsh Run',
  theme: 'marsh',
  bpm: 148,
  root: n('A3'),
  mode: 'lydian',
  swing: 0,
  gainScale: 0.90,
  voices: { lead: 'reed', comp: 'shimmer', bass: 'walk' },
  drums: 'glide',
  
  
  
  
  
  progression: [
    { degree: 0, quality: 'add9' },
    { degree: 1, quality: 'maj' },
    { degree: 0, quality: 'maj6' },
    { degree: 5, quality: 'min7' },
    { degree: 0, quality: 'maj7' },
    { degree: 4, quality: 'maj6' },
    { degree: 1, quality: 'add9' },
    { degree: 0, quality: 'maj6' },
  ],
  
  
  
  
  lead: [
    mel('A4 .5 C#5 .5 E5 .5 F#5 1 E5 .5 C#5 .5 A4 .5'),
    mel('B4 .5 D#5 .5 F#5 1 E5 .5 C#5 .5 B4 1'),
    mel('C#5 .5 E5 .5 A5 1 G#5 .5 F#5 .5 E5 1'),
    mel('F#4 .5 A4 .5 C#5 .5 E5 1 C#5 .5 A4 .5 F#4 .5'),
    mel('A4 .25 B4 .25 C#5 .5 E5 .5 G#5 .5 E5 .5 C#5 .5 A4 1'),
    mel('E5 .5 G#5 .5 B5 1 A5 .5 F#5 .5 E5 1'),
    mel('D#5 .5 F#5 .5 B5 1 A5 .5 F#5 .5 D#5 1'),
    mel('C#5 .5 B4 .5 A4 .5 G#4 .5 A4 .5 C#5 .5 E5 1'),
  ],
};

export const SONGS = Object.freeze({
  sunflower: Object.freeze(SUNFLOWER),
  muddybottom: Object.freeze(MUDDYBOTTOM),
  frostfield: Object.freeze(FROSTFIELD),
  'harvest-moon-night': Object.freeze(HARVEST_MOON),
  'dust-bowl-run': Object.freeze(DUST_BOWL),
  saltmarsh: Object.freeze(SALTMARSH),
});

export const SONG_NAMES = Object.freeze(Object.keys(SONGS));


export const TRACK_SONG = Object.freeze({
  
  sunflower: 'sunflower',
  muddybottom: 'muddybottom',
  frostfield: 'frostfield',
  
  
  
  
  
  millrace: 'harvest-moon-night',
  saltmarsh: 'saltmarsh',
  canyon: 'dust-bowl-run',
});




































export const THEME_SONG = Object.freeze({
  summer: 'sunflower',
  mud: 'muddybottom',
  overcast: 'muddybottom',
  snow: 'frostfield',
  night: 'harvest-moon-night',
  dust: 'dust-bowl-run',
});

export const DEFAULT_SONG = 'sunflower';






















export const FALLBACK_TRANSPOSE = Object.freeze([2, 5, 7, -5]);


export function hashId(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(str).length; i += 1) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}












export function kartSongFor(trackId, theme) {
  if (trackId && TRACK_SONG[trackId]) {
    return { songId: TRACK_SONG[trackId], transpose: 0, named: true };
  }
  if (trackId && SONGS[trackId]) {
    return { songId: trackId, transpose: 0, named: true };
  }
  if (theme && THEME_SONG[theme]) {
    return { songId: THEME_SONG[theme], transpose: 0, named: false };
  }
  const t = FALLBACK_TRANSPOSE[hashId(trackId ?? '') % FALLBACK_TRANSPOSE.length];
  return { songId: DEFAULT_SONG, transpose: t, named: false };
}





const BEATS_PER_BAR = 4;















export function buildKartSong({ trackId, theme, transpose } = {}) {
  const sel = kartSongFor(trackId, theme);
  const spec = SONGS[sel.songId];
  const shift = transpose == null ? sel.transpose : transpose;
  return assembleSong(spec, { shift, trackId: trackId ?? spec.id, theme: theme ?? spec.theme, named: sel.named });
}

function assembleSong(spec, { shift = 0, trackId, theme, named = true } = {}) {
  const root = spec.root + shift;
  const bars = spec.progression.length;
  if (bars !== spec.lead.length) {
    throw new Error(`${spec.id}: ${bars} chords but ${spec.lead.length} lead bars`);
  }
  const ladder = scaleLadder(root, spec.mode, BASS_LO, BASS_HI);
  const chords = spec.progression.map((c) => chordAt(root, spec.mode, c.degree, c.quality));

  const barEvents = [];
  for (let b = 0; b < bars; b += 1) {
    const lead = spec.lead[b].map(([note, beats]) => [note == null ? null : note + shift, beats]);
    assertBeats(lead, BEATS_PER_BAR, `${spec.id} lead bar ${b + 1}`);
    const comp = compBar(spec.voices.comp, chords[b]);
    assertBeats(comp, BEATS_PER_BAR, `${spec.id} comp bar ${b + 1}`);
    
    const bass = bassBar(spec.voices.bass, chords[b], chords[(b + 1) % bars], ladder, b % 4 === 3);
    assertBeats(bass, BEATS_PER_BAR, `${spec.id} bass bar ${b + 1}`);
    barEvents.push(Object.freeze({
      lead: Object.freeze(lead),
      comp: Object.freeze(comp),
      bass: Object.freeze(bass),
      drums: Object.freeze(drumBar(spec.drums, b, bars)),
    }));
  }

  const beatSec = 60 / spec.bpm;
  return Object.freeze({
    id: spec.id,
    name: shift ? `${spec.name} (+${shift})` : spec.name,
    trackId: trackId ?? spec.id,
    theme: theme ?? spec.theme,
    named,
    transpose: shift,
    bpm: spec.bpm,
    beatSec,
    bars,
    beatsPerBar: BEATS_PER_BAR,
    loopSec: bars * BEATS_PER_BAR * beatSec,
    root,
    mode: spec.mode,
    swing: spec.swing,
    gainScale: spec.gainScale,
    voices: Object.freeze({ ...spec.voices }),
    drumStyle: spec.drums,
    progression: Object.freeze(spec.progression.map((c, i) => Object.freeze({
      ...c,
      notes: chords[i],
      
      
      label: `${spellMode(pc(root), spec.mode)[c.degree % MODES[spec.mode].length]}${QUALITY_SUFFIX[c.quality]}`,
      spelled: Object.freeze(chords[i].map((m) => spellNote(m, pc(root), spec.mode))),
    }))),
    barEvents: Object.freeze(barEvents),
    finalLap: false,
  });
}




























export function finalLapVariant(song, { semitones = 2, tempoScale = 1.08 } = {}) {
  const lift = (v) => (v == null ? null : Array.isArray(v) ? Object.freeze(v.map((x) => x + semitones)) : v + semitones);
  const bpm = song.bpm * tempoScale;
  const beatSec = 60 / bpm;
  return Object.freeze({
    ...song,
    name: `${song.name} (final lap)`,
    bpm,
    beatSec,
    loopSec: song.bars * song.beatsPerBar * beatSec,
    root: song.root + semitones,
    
    
    
    
    progression: Object.freeze(song.progression.map((c) => {
      const notes = Object.freeze(c.notes.map((x) => x + semitones));
      const rootPc = pc(song.root + semitones);
      return Object.freeze({
        ...c,
        notes,
        label: `${spellMode(rootPc, song.mode)[c.degree % MODES[song.mode].length]}${QUALITY_SUFFIX[c.quality]}`,
        spelled: Object.freeze(notes.map((m) => spellNote(m, rootPc, song.mode))),
      });
    })),
    barEvents: Object.freeze(song.barEvents.map((bar) => Object.freeze({
      lead: Object.freeze(bar.lead.map(([v, b]) => [lift(v), b])),
      comp: Object.freeze(bar.comp.map(([v, b]) => [lift(v), b])),
      bass: Object.freeze(bar.bass.map(([v, b]) => [lift(v), b])),
      drums: bar.drums,
    }))),
    finalLap: true,
  });
}





export const VOICE_NAMES = Object.freeze(['lead', 'comp', 'bass']);


export function allNotes(song) {
  const out = [];
  for (const bar of song.barEvents) {
    for (const v of VOICE_NAMES) for (const [notes] of bar[v]) out.push(...asNotes(notes));
  }
  return out;
}


export function eventCount(song) {
  let notes = 0;
  let drums = 0;
  for (const bar of song.barEvents) {
    for (const v of VOICE_NAMES) for (const [n2] of bar[v]) notes += asNotes(n2).length;
    drums += bar.drums.length;
  }
  return { notes, drums, total: notes + drums };
}









export function kartSongSummary(song) {
  const notes = allNotes(song);
  const lowest = Math.min(...notes);
  const highest = Math.max(...notes);
  const drumCounts = {};
  let kicks = 0;
  for (const bar of song.barEvents) {
    for (const d of bar.drums) {
      drumCounts[d.drum] = (drumCounts[d.drum] || 0) + 1;
      if (d.drum === 'kick') kicks += 1;
    }
  }
  const perVoice = {};
  for (const v of VOICE_NAMES) {
    let c = 0;
    for (const bar of song.barEvents) for (const [n2] of bar[v]) c += asNotes(n2).length;
    perVoice[v] = c;
  }
  const ev = eventCount(song);
  return {
    id: song.id,
    name: song.name,
    trackId: song.trackId,
    bpm: Math.round(song.bpm * 10) / 10,
    bars: song.bars,
    loopSec: Math.round(song.loopSec * 100) / 100,
    mode: song.mode,
    brightness: BRIGHTNESS[song.mode],
    swing: song.swing,
    root: noteName(song.root),
    sixteenthMs: Math.round((song.beatSec / 4) * 10000) / 10,
    chords: song.progression.map((c, i) => `${i + 1}:${c.label}[${(c.spelled ?? c.notes.map(noteName)).join(' ')}]`),
    lowestMidi: lowest,
    lowestHz: Math.round(midiToHz(lowest) * 10) / 10,
    highestMidi: highest,
    highestHz: Math.round(midiToHz(highest) * 10) / 10,
    notes: perVoice,
    drums: drumCounts,
    kicksPerBar: Math.round((kicks / song.bars) * 100) / 100,
    events: ev.total,
    eventsPerSec: Math.round((ev.total / song.loopSec) * 10) / 10,
  };
}






export function kartSongFingerprint(song) {
  let h = 2166136261 >>> 0;
  const push = (x) => { h ^= Math.round(x) >>> 0; h = Math.imul(h, 16777619) >>> 0; };
  for (const bar of song.barEvents) {
    for (const v of VOICE_NAMES) {
      for (const [notes, beats] of bar[v]) {
        push(beats * 1000);
        for (const m of asNotes(notes)) push(m * 97 + 7);
      }
    }
    for (const d of bar.drums) push(d.at * 100 + d.drum.length * 13 + d.gain * 1000);
  }
  push(song.bpm * 10);
  push(song.root);
  push(song.swing * 1000);
  return h.toString(16).padStart(8, '0');
}
