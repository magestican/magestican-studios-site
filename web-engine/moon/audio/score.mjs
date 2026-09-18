








































export const ROOT_MIDI = 60;




export const MODES = Object.freeze({
  ionian: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
  lydian: Object.freeze([0, 2, 4, 6, 7, 9, 11]),
});
export const MODE_NAMES = Object.freeze(Object.keys(MODES));

export const BEATS_PER_BAR = 4;


export const pitchClass = (midi) => (((midi - ROOT_MIDI) % 12) + 12) % 12;







export function inKey(midi, mode, borrowed = []) {
  if (midi == null) return true;               
  const scale = MODES[mode];
  if (!scale) return false;
  const d = pitchClass(midi);
  return scale.includes(d) || borrowed.includes(d);
}






export function degreeToMidi(deg, mode, octave = 0) {
  const scale = MODES[mode] || MODES.ionian;
  const n = scale.length;
  const i = ((deg % n) + n) % n;
  const oct = Math.floor(deg / n) + octave;
  return ROOT_MIDI + scale[i] + 12 * oct;
}

export const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);










export const MOTIF = Object.freeze([
  { deg: 4, at: 0, dur: 1 },
  { deg: 2, at: 1, dur: 0.5 },
  { deg: 4, at: 1.5, dur: 0.5 },
  { deg: 7, at: 2, dur: 1.5 },
  { deg: 5, at: 4, dur: 1 },
  { deg: 4, at: 5, dur: 0.5 },
  { deg: 2, at: 5.5, dur: 0.5 },
  { deg: 0, at: 6, dur: 2 },
].map(Object.freeze));

export const MOTIF_BEATS = 8;








export const INSTRUMENTS = Object.freeze(['pluck', 'pad', 'bass', 'shaker']);




export const NIGHT_INSTRUMENTS = Object.freeze(['pluck', 'pad']);



export const SECTIONS = Object.freeze([
  Object.freeze({ name: 'A', atBar: 0, bars: 4 }),
  Object.freeze({ name: 'B', atBar: 4, bars: 4 }),
  Object.freeze({ name: 'A2', atBar: 8, bars: 4 }),
  Object.freeze({ name: 'C', atBar: 12, bars: 4 }),
]);

export const BARS = SECTIONS.reduce((n, s) => n + s.bars, 0);









const chord = (deg, semis = null) => Object.freeze({ deg, semis: semis ? Object.freeze(semis) : null });

export const SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);

export const SEASON_SPECS = Object.freeze({
  
  
  spring: Object.freeze({
    mode: 'lydian',
    bpm: 96,
    borrowed: Object.freeze([]),
    prog: Object.freeze([chord(0), chord(1), chord(4), chord(0)]),
    octaves: Object.freeze([0, 0, 1, 0]),
    answers: true,
    shaker: true,
    padVoices: 3,
    bassPerBar: 2,
  }),
  
  
  summer: Object.freeze({
    mode: 'ionian',
    bpm: 92,
    borrowed: Object.freeze([]),
    prog: Object.freeze([chord(0), chord(3), chord(5), chord(4)]),
    octaves: Object.freeze([0, 1, 0, 1]),
    answers: true,
    shaker: true,
    padVoices: 4,
    bassPerBar: 2,
  }),
  
  
  
  autumn: Object.freeze({
    mode: 'ionian',
    bpm: 84,
    borrowed: Object.freeze([8]),
    prog: Object.freeze([chord(0), chord(4), chord(5), chord(3, [0, 3, 7])]),
    octaves: Object.freeze([0, 0, 0, 0]),
    answers: true,
    shaker: true,
    padVoices: 3,
    bassPerBar: 2,
  }),
  
  
  winter: Object.freeze({
    mode: 'ionian',
    bpm: 80,
    borrowed: Object.freeze([]),
    prog: Object.freeze([chord(0), chord(5), chord(3), chord(4)]),
    octaves: Object.freeze([0, 0, 0, 0]),
    answers: false,
    shaker: false,
    padVoices: 3,
    bassPerBar: 1,
  }),
});





const LEVELS = Object.freeze({ pluck: 0.5, pad: 0.26, bass: 0.34, shaker: 0.12 });


const NIGHT_LEVELS = Object.freeze({ pluck: 0.42, pad: 0.2 });



export const BARS_PER_CHORD = 2;


export function chordMidi(c, mode, octave = 0, voices = 3) {
  const out = [];
  if (c.semis) {
    const root = degreeToMidi(c.deg, mode, octave);
    for (const s of c.semis) out.push({ deg: s === 0 ? c.deg : null, midi: root + s });
  } else {
    for (let i = 0; i < 3; i += 1) out.push({ deg: c.deg + i * 2, midi: degreeToMidi(c.deg + i * 2, mode, octave) });
  }
  
  
  if (voices > 3) out.push({ deg: out[0].deg == null ? null : out[0].deg + 7, midi: out[0].midi + 12 });
  return out;
}


export const chordAtBar = (spec, bar) => spec.prog[Math.floor(bar / BARS_PER_CHORD) % spec.prog.length];

const PLUCK_OCTAVE = 1;    
const PAD_OCTAVE = 0;
const BASS_OCTAVE = -2;

const note = (n) => Object.freeze({
  deg: n.deg ?? null, midi: n.midi ?? null, at: n.at, dur: n.dur, gain: n.gain,
});





function pluckTrack(spec, night) {
  const notes = [];
  const level = (night ? NIGHT_LEVELS : LEVELS).pluck;
  SECTIONS.forEach((sec, i) => {
    
    
    const oct = PLUCK_OCTAVE + (night ? 0 : spec.octaves[i]);
    const base = sec.atBar * BEATS_PER_BAR;
    for (const m of MOTIF) {
      notes.push(note({ deg: m.deg, midi: degreeToMidi(m.deg, spec.mode, oct), at: base + m.at, dur: m.dur, gain: level }));
    }
    if (!spec.answers) return;
    
    
    
    
    
    for (let b = sec.atBar + 2; b < sec.atBar + sec.bars; b += 1) {
      const c = chordMidi(chordAtBar(spec, b), spec.mode, PLUCK_OCTAVE, 3);
      c.forEach((cn, k) => {
        notes.push(note({ deg: cn.deg, midi: cn.midi, at: b * BEATS_PER_BAR + k * 1.5, dur: 1, gain: level * 0.55 }));
      });
    }
  });
  notes.sort((a, b) => a.at - b.at);
  return Object.freeze({ instrument: 'pluck', notes: Object.freeze(notes) });
}

function padTrack(spec, night) {
  const notes = [];
  const level = (night ? NIGHT_LEVELS : LEVELS).pad;
  for (let bar = 0; bar < BARS; bar += BARS_PER_CHORD) {
    const c = chordMidi(chordAtBar(spec, bar), spec.mode, PAD_OCTAVE, spec.padVoices);
    for (const cn of c) {
      notes.push(note({
        deg: cn.deg, midi: cn.midi, at: bar * BEATS_PER_BAR, dur: BARS_PER_CHORD * BEATS_PER_BAR, gain: level,
      }));
    }
  }
  return Object.freeze({ instrument: 'pad', notes: Object.freeze(notes) });
}

function bassTrack(spec) {
  const notes = [];
  for (let bar = 0; bar < BARS; bar += 1) {
    const c = chordAtBar(spec, bar);
    const root = degreeToMidi(c.deg, spec.mode, BASS_OCTAVE);
    notes.push(note({ deg: c.deg, midi: root, at: bar * BEATS_PER_BAR, dur: 1.5, gain: LEVELS.bass }));
    
    
    if (spec.bassPerBar > 1) {
      notes.push(note({ deg: c.deg, midi: root, at: bar * BEATS_PER_BAR + 2.5, dur: 1, gain: LEVELS.bass * 0.7 }));
    }
  }
  return Object.freeze({ instrument: 'bass', notes: Object.freeze(notes) });
}

function shakerTrack() {
  const notes = [];
  for (let bar = 0; bar < BARS; bar += 1) {
    for (const beat of [1.5, 3.5]) {
      notes.push(note({ deg: null, midi: null, at: bar * BEATS_PER_BAR + beat, dur: 0.25, gain: LEVELS.shaker }));
    }
  }
  return Object.freeze({ instrument: 'shaker', notes: Object.freeze(notes) });
}

export const arrangementId = (season, night) => `${season}-${night ? 'night' : 'day'}`;


export function buildArrangement(season, night) {
  const spec = SEASON_SPECS[season];
  if (!spec) throw new Error(`no such season: ${season}`);
  const tracks = [pluckTrack(spec, night), padTrack(spec, night)];
  if (!night) {
    tracks.push(bassTrack(spec));
    if (spec.shaker) tracks.push(shakerTrack());
  }
  return Object.freeze({
    id: arrangementId(season, night),
    season,
    night: Boolean(night),
    mode: spec.mode,
    bpm: spec.bpm,
    borrowed: spec.borrowed,
    bars: BARS,
    beatsPerBar: BEATS_PER_BAR,
    sections: SECTIONS,
    tracks: Object.freeze(tracks),
  });
}


export const ARRANGEMENTS = Object.freeze(Object.fromEntries(
  SEASONS.flatMap((s) => [false, true].map((n) => [arrangementId(s, n), buildArrangement(s, n)])),
));

export const ARRANGEMENT_IDS = Object.freeze(Object.keys(ARRANGEMENTS));







export function arrangementFor(season, night) {
  return ARRANGEMENTS[arrangementId(season, night)] || ARRANGEMENTS[arrangementId('summer', night)];
}


export const notesOf = (arr) => arr.tracks.flatMap((t) => t.notes);







export function hasMotif(arr) {
  const track = arr.tracks.find((t) => t.instrument === 'pluck');
  if (!track) return false;
  const ns = track.notes;
  for (let i = 0; i + MOTIF.length <= ns.length; i += 1) {
    const at0 = ns[i].at;
    let ok = true;
    for (let k = 0; k < MOTIF.length; k += 1) {
      const n = ns[i + k];
      if (n.deg !== MOTIF[k].deg || n.at - at0 !== MOTIF[k].at || n.dur !== MOTIF[k].dur) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}





export const secondsPerBeat = (bpm) => 60 / bpm;


export const beatSeconds = (beats, bpm) => beats * secondsPerBeat(bpm);






export const barSamples = (sampleRate, bpm, beatsPerBar = BEATS_PER_BAR) => Math.round(sampleRate * secondsPerBeat(bpm) * beatsPerBar);







export const loopSamplesOf = (arr, sampleRate) => arr.bars * barSamples(sampleRate, arr.bpm, arr.beatsPerBar);


export const loopSecondsOf = (arr, sampleRate) => loopSamplesOf(arr, sampleRate) / sampleRate;













export function foldTail(samples, loop) {
  if (!(loop > 0) || samples.length <= loop) return 0;
  const extra = samples.length - loop;
  for (let i = 0; i < extra; i += 1) samples[i % loop] += samples[loop + i];
  return extra;
}



















export function seamOf(samples, loop, window = 512) {
  const n = Math.max(1, Math.min(window, Math.floor(loop / 2)));
  const rms = (from) => {
    let s = 0;
    for (let i = 0; i < n; i += 1) { const v = samples[from + i]; s += v * v; }
    return Math.sqrt(s / n);
  };
  let worst = 0;
  let energy = 0;
  for (let i = 1; i < loop; i += 1) {
    const d = Math.abs(samples[i] - samples[i - 1]);
    if (d > worst) worst = d;
    energy += samples[i] * samples[i];
  }
  energy += samples[0] * samples[0];
  return {
    step: Math.abs(samples[0] - samples[loop - 1]),
    worst,
    before: rms(loop - n),
    after: rms(0),
    overall: Math.sqrt(energy / loop),
    last: samples[loop - 1],
    first: samples[0],
  };
}
