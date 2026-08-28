





























import { SeededRng } from '../rng/seededRng.js';








export const ROOT_MIDI = 45;





export const SCALE_SEMITONES = Object.freeze([0, 2, 3, 5, 7, 8, 10]);

export const N = Object.freeze({
  E2: 40, F2: 41, G2: 43, A2: 45, B2: 47, C3: 48, D3: 50, E3: 52, F3: 53,
  G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69,
  B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84,
});










export function inScale(midi, mode = 'aeolian') {
  if (midi == null) return true;                 
  const scale = MODES_LAZY()[mode] || SCALE_SEMITONES;
  const d = (((midi - ROOT_MIDI) % 12) + 12) % 12;
  return scale.includes(d);
}


function MODES_LAZY() { return MODES; }

export function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}











export const PREVIOUS_BPM = 150;












export const MIN_BPM = 150;














export const VOICES = Object.freeze({
  lead:    Object.freeze({ wave: 'square',   gain: 0.16, gate: 0.78, bus: 'lead'  }),
  guitar:  Object.freeze({ wave: 'square',   gain: 0.19, gate: 0.42, bus: 'amp'   }),
  bass:    Object.freeze({ wave: 'sawtooth', gain: 0.22, gate: 0.55, bus: 'amp'   }),
  harmony: Object.freeze({ wave: 'square',   gain: 0.10, gate: 0.62, bus: 'clean' }),
});

export const VOICE_NAMES = Object.freeze(['lead', 'guitar', 'bass', 'harmony']);












const RIFF_PEDAL = [
  
  [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5],
  [N.C3, 0.5], [N.D3, 0.5], [N.E3, 1.0],
  
  [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5],
  [N.E3, 0.5], [N.D3, 0.5], [N.C3, 0.5], [N.A2, 0.5],
  
  [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.F3, 0.5], [N.E3, 0.5],
  [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.D3, 0.5], [N.C3, 0.5],
  
  [N.A2, 0.5], [N.G2, 0.5], [N.A2, 0.5], [N.C3, 0.5],
  [N.D3, 0.25], [N.E3, 0.25], [N.G3, 0.5], [N.A3, 1.0],
];

const RIFF_GALLOP = [
  
  [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25],
  [N.C3, 0.5], [N.C3, 0.25], [N.C3, 0.25], [N.D3, 0.5], [N.E3, 0.5],
  [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25],
  [N.E3, 0.5], [N.D3, 0.25], [N.D3, 0.25], [N.C3, 0.5], [N.A2, 0.5],
  [N.F3, 0.5], [N.F3, 0.25], [N.F3, 0.25], [N.E3, 0.5], [N.E3, 0.25], [N.E3, 0.25],
  [N.D3, 0.5], [N.D3, 0.25], [N.D3, 0.25], [N.C3, 0.5], [N.B2, 0.5],
  [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25], [N.G2, 0.5], [N.G2, 0.5],
  [N.A2, 0.25], [N.B2, 0.25], [N.C3, 0.25], [N.D3, 0.25], [N.E3, 0.5], [N.A3, 0.5],
];

const RIFF_CLIMB = [
  
  [N.A2, 0.25], [N.A2, 0.25], [N.C3, 0.25], [N.A2, 0.25], [N.D3, 0.25], [N.A2, 0.25], [N.E3, 0.5],
  [N.A2, 0.25], [N.A2, 0.25], [N.C3, 0.25], [N.A2, 0.25], [N.D3, 0.25], [N.A2, 0.25], [N.E3, 0.5],
  [N.A2, 0.25], [N.A2, 0.25], [N.C3, 0.25], [N.A2, 0.25], [N.E3, 0.25], [N.A2, 0.25], [N.G3, 0.5],
  [N.A2, 0.25], [N.A2, 0.25], [N.C3, 0.25], [N.A2, 0.25], [N.E3, 0.25], [N.A2, 0.25], [N.G3, 0.5],
  [N.F3, 0.5], [N.E3, 0.5], [N.D3, 0.5], [N.C3, 0.5], [N.B2, 0.5], [N.C3, 0.5], [N.D3, 0.5], [N.E3, 0.5],
  [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.A2, 0.25], [N.A2, 0.25], [N.A2, 0.5], [N.A3, 1.0], [N.E3, 1.0],
];

export const RIFFS = Object.freeze({
  pedal:  Object.freeze(RIFF_PEDAL),
  gallop: Object.freeze(RIFF_GALLOP),
  climb:  Object.freeze(RIFF_CLIMB),
});
export const RIFF_NAMES = Object.freeze(Object.keys(RIFFS));
export const RIFF_BARS = 4;








const CHORDS = Object.freeze({
  Am: Object.freeze({ root: N.A2, oct: N.A3, fifth: N.E3, third: 3 }),
  F:  Object.freeze({ root: N.F2, oct: N.F3, fifth: N.C3, third: 4 }),
  C:  Object.freeze({ root: N.C3, oct: N.C4, fifth: N.G3, third: 4 }),
  G:  Object.freeze({ root: N.G2, oct: N.G3, fifth: N.D3, third: 4 }),
  Dm: Object.freeze({ root: N.D3, oct: N.D4, fifth: N.A3, third: 3 }),
  Em: Object.freeze({ root: N.E2, oct: N.E3, fifth: N.B3, third: 3 }),
});





export const totalBeats = (seq) => seq.reduce((s, [, b]) => s + b, 0);






function assertBeats(seq, bars, what) {
  const got = totalBeats(seq);
  const want = bars * 4;
  if (Math.abs(got - want) > 1e-9) {
    throw new Error(`${what}: ${got} beats, expected ${want} (${bars} bars)`);
  }
  return seq;
}

const rest = (bars) => [[null, bars * 4]];





const VERSE_LEAD = [
  [N.A4, 0.5], [N.C5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.C5, 0.5], [N.E5, 1.0],
  [N.F4, 0.5], [N.A4, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.F4, 0.5], [N.A4, 0.5], [N.C5, 1.0],
  [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5], [N.D5, 0.5], [N.E5, 0.5], [N.G5, 0.5], [N.E5, 1.0],
  [N.D5, 0.5], [N.B4, 0.5], [N.G4, 0.5], [N.B4, 0.5], [N.D5, 0.5], [N.B4, 0.5], [N.D5, 1.0],
];

const HOOK_LEAD = [
  [N.E5, 0.25], [N.E5, 0.25], [N.E5, 0.5], [N.C5, 0.5], [N.E5, 0.5], [N.A5, 1.0], [N.G5, 0.5], [N.E5, 0.5],
  [N.F5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.F5, 0.5], [N.E5, 0.5], [N.C5, 1.0],
  [N.G5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.E5, 0.5], [N.G5, 0.5], [N.A5, 0.5], [N.G5, 1.0],
  [N.B4, 0.25], [N.C5, 0.25], [N.D5, 0.5], [N.G5, 0.5], [N.F5, 0.5], [N.D5, 0.5], [N.B4, 0.5], [N.G4, 1.0],
];



const BRIDGE_LEAD = [
  [N.D5, 1.0], [N.F5, 1.0], [N.A5, 2.0],
  [N.A5, 0.5], [N.G5, 0.5], [N.F5, 0.5], [N.D5, 0.5], [N.F5, 2.0],
  [N.A4, 1.0], [N.C5, 1.0], [N.E5, 2.0],
  [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5], [N.A4, 0.5], [N.C5, 2.0],
  [N.F5, 0.5], [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5], [N.D5, 0.5], [N.E5, 0.5], [N.F5, 1.0],
  [N.A5, 2.0], [N.G5, 1.0], [N.F5, 1.0],
  [N.G5, 0.5], [N.F5, 0.5], [N.D5, 0.5], [N.B4, 0.5], [N.D5, 0.5], [N.F5, 0.5], [N.G5, 1.0],
  [N.B5, 0.25], [N.A5, 0.25], [N.G5, 0.25], [N.F5, 0.25], [N.D5, 0.5], [N.B4, 0.5],
  [N.D5, 0.5], [N.G5, 0.5], [N.A5, 1.0],
];



const OUTRO_LEAD = [
  [N.A4, 0.5], [N.C5, 0.5], [N.E5, 0.5], [N.A5, 0.5], [N.G5, 0.5], [N.E5, 0.5], [N.C5, 0.5], [N.A4, 0.5],
  [N.A4, 0.25], [null, 0.25], [N.A4, 0.25], [null, 0.25], [N.A4, 0.5], [null, 0.5], [N.A4, 2.0],
];













const PROG_4 = ['Am', 'F', 'C', 'G'];
const PROG_BRIDGE = ['Dm', 'Dm', 'Am', 'Am', 'F', 'F', 'G', 'G'];

const down8ve = (seq) => seq.map(([n, b]) => [n == null ? null : n - 12, b]);













function bassBar(chord) {
  const { root, fifth } = CHORDS[chord];
  return [
    [root, 0.5], [root, 0.5], [root, 0.5], [fifth, 0.5],
    [root, 0.5], [root, 0.5], [fifth, 0.25], [fifth, 0.25], [root, 0.5],
  ];
}

function harmonyArpBar(chord) {
  const c = CHORDS[chord];
  const third = c.oct + c.third;
  const fifth = c.oct + 7;
  const top = c.oct + 12;
  const shape = [c.oct, third, fifth, top, fifth, third, c.oct, third];
  
  
  
  
  return shape.map((n) => [n, 0.5]);
}


function harmonyStabBar(chord) {
  const c = CHORDS[chord];
  return [
    [c.oct, 0.25], [null, 0.75], [c.oct, 0.25], [null, 0.75],
    [c.fifth + 12, 0.25], [null, 0.75], [c.oct, 0.25], [null, 0.75],
  ];
}

const flat = (arr) => arr.reduce((a, b) => a.concat(b), []);



function riffPrefixBars(riff, bars) {
  let beats = 0;
  for (let i = 0; i < riff.length; i++) {
    beats += riff[i][1];
    if (Math.abs(beats - bars * 4) < 1e-9) return i + 1;
  }
  throw new Error(`riff has no clean ${bars}-bar prefix`);
}

const SECTION_BUILDERS = Object.freeze({
  
  
  intro: (riff) => ({
    bars: 2,
    drums: 'intro',
    lead: rest(2),
    guitar: riff.slice(0, riffPrefixBars(riff, 2)),
    bass: down8ve(riff.slice(0, riffPrefixBars(riff, 2))),
    harmony: rest(2),
  }),

  
  riff: (riff) => ({
    bars: RIFF_BARS,
    drums: 'drive',
    lead: rest(RIFF_BARS),
    guitar: riff.slice(),
    bass: down8ve(riff),
    harmony: rest(RIFF_BARS),
  }),

  
  verse: (riff) => ({
    bars: 4,
    drums: 'drive',
    lead: VERSE_LEAD,
    guitar: riff.slice(),
    bass: flat(PROG_4.map(bassBar)),
    harmony: rest(4),
  }),

  hook: () => ({
    bars: 4,
    drums: 'hook',
    lead: HOOK_LEAD,
    guitar: flat(PROG_4.map(harmonyStabBar)),
    bass: flat(PROG_4.map(bassBar)),
    harmony: flat(PROG_4.map(harmonyArpBar)),
  }),

  bridge: () => ({
    bars: 8,
    drums: 'bridge',
    lead: BRIDGE_LEAD,
    guitar: flat(PROG_BRIDGE.map(harmonyStabBar)),
    bass: flat(PROG_BRIDGE.map(bassBar)),
    harmony: flat(PROG_BRIDGE.map(harmonyStabBar)),
  }),

  
  
  
  breakdown: () => ({
    bars: 2,
    drums: 'breakdown',
    lead: rest(2),
    guitar: new Array(32).fill(null).map((_, i) => [i % 8 === 7 ? N.C3 : N.A2, 0.25]),
    bass: new Array(16).fill(null).map(() => [N.A2 - 12, 0.5]),
    harmony: rest(2),
  }),

  outro: () => ({
    bars: 2,
    drums: 'outro',
    lead: OUTRO_LEAD,
    guitar: [
      [N.A2, 0.5], [N.A2, 0.5], [N.G2, 0.5], [N.G2, 0.5],
      [N.F2, 0.5], [N.F2, 0.5], [N.E2, 0.5], [N.E2, 0.5],
      [N.A2, 0.25], [null, 0.25], [N.A2, 0.25], [null, 0.25],
      [N.A2, 0.5], [null, 0.5], [N.A2, 2.0],
    ],
    bass: [
      [N.A2 - 12, 0.5], [N.A2 - 12, 0.5], [N.G2 - 12, 0.5], [N.G2 - 12, 0.5],
      [N.F2 - 12, 0.5], [N.F2 - 12, 0.5], [N.E2 - 12, 0.5], [N.E2 - 12, 0.5],
      [N.A2 - 12, 0.25], [null, 0.25], [N.A2 - 12, 0.25], [null, 0.25],
      [N.A2 - 12, 0.5], [null, 0.5], [N.A2 - 12, 2.0],
    ],
    harmony: rest(2),
  }),
});

export const SECTION_NAMES = Object.freeze(Object.keys(SECTION_BUILDERS));








function drumBar(style, barInSection, sectionBars) {
  const ev = [];
  const k = (at, gain = 0.55) => ev.push({ drum: 'kick', at, gain });
  const s = (at, gain = 0.34) => ev.push({ drum: 'snare', at, gain });
  const h = (at, gain) => ev.push({ drum: 'hat', at, gain });
  const oh = (at) => ev.push({ drum: 'openhat', at, gain: 0.16 });
  const cr = (at) => ev.push({ drum: 'crash', at, gain: 0.30 });
  const eighthHats = () => { for (let e = 0; e < 8; e++) h(e * 0.5, e % 2 ? 0.10 : 0.15); };
  const sixteenthHats = () => { for (let e = 0; e < 16; e++) h(e * 0.25, e % 4 === 0 ? 0.15 : 0.08); };
  const last = barInSection === sectionBars - 1;

  switch (style) {
    case 'intro':
      if (barInSection === 0) cr(0);
      k(0); k(2); eighthHats();
      if (last) { s(3); s(3.5); }               
      break;
    case 'drive':
      k(0); k(0.75); k(2); k(2.5);              
      s(1); s(3);
      eighthHats();
      if (last) { k(3.5); s(3.75); }
      break;
    case 'hook':
      k(0); k(0.75); k(2); k(2.5); k(3.5);
      s(1); s(3);
      sixteenthHats();
      oh(3.5);
      if (barInSection === 0) cr(0);
      break;
    case 'bridge':
      if (barInSection < sectionBars / 2) {
        k(0); s(2); eighthHats();               
        if (barInSection === 0) cr(0);
      } else {
        k(0); k(1); k(2); k(3);
        s(1); s(3);
        sixteenthHats();
        if (last) { s(3.25); s(3.5); s(3.75); } 
      }
      break;
    case 'breakdown':
      if (barInSection === 0) cr(0);
      for (let e = 0; e < 16; e++) k(e * 0.25, 0.5);   
      s(1); s(3);
      break;
    case 'outro':
      cr(0); k(0); k(2); s(1); s(3); eighthHats();
      if (last) { for (let e = 0; e < 4; e++) s(3 + e * 0.25, 0.34); }
      break;
    default:
      throw new Error(`unknown drum style ${style}`);
  }
  return ev;
}

export const DRUM_STYLES = Object.freeze(
  ['intro', 'drive', 'hook', 'bridge', 'breakdown', 'outro'],
);
export const DRUM_KINDS = Object.freeze(['kick', 'snare', 'hat', 'openhat', 'crash']);










export const DEFAULT_MAP = 'snow-farm';

export const MAP_FLAVOUR = Object.freeze({
  'snow-farm':         Object.freeze({ bpm: 156, riff: 'pedal'  }),
  'icy-mountain':      Object.freeze({ bpm: 162, riff: 'gallop' }),
  'central-park-rink': Object.freeze({ bpm: 152, riff: 'climb'  }),
  'arctic':            Object.freeze({ bpm: 158, riff: 'gallop' }),
});

export function flavourFor(map) {
  return MAP_FLAVOUR[map] || MAP_FLAVOUR[DEFAULT_MAP];
}















































export const MODES = Object.freeze({
  aeolian:  Object.freeze([0, 2, 3, 5, 7, 8, 10]),
  phrygian: Object.freeze([0, 1, 3, 5, 7, 8, 10]),
  dorian:   Object.freeze([0, 2, 3, 5, 7, 9, 10]),
  harmonic: Object.freeze([0, 2, 3, 5, 7, 8, 11]),
});
export const MODE_NAMES = Object.freeze(Object.keys(MODES));













export function toMode(midi, mode = 'aeolian') {
  if (midi == null) return midi;
  const target = MODES[mode];
  if (!target || mode === 'aeolian') return midi;
  const rel = midi - ROOT_MIDI;
  const oct = Math.floor(rel / 12);
  const pc = ((rel % 12) + 12) % 12;
  const degree = SCALE_SEMITONES.indexOf(pc);
  if (degree < 0) return midi;                 
  return ROOT_MIDI + oct * 12 + target[degree];
}












export const TRACKS = Object.freeze({
  'hog-stomp':    Object.freeze({ mode: 'aeolian',  bpm: 156, riff: 'pedal',  mood: 'drive', gainScale: 1.00 }),
  'barn-burner':  Object.freeze({ mode: 'phrygian', bpm: 168, riff: 'gallop', mood: 'drive', gainScale: 1.00 }),
  
  
  
  
  
  
  'cold-open':    Object.freeze({ mode: 'dorian',   bpm: 151, riff: 'climb',  mood: 'stalk', gainScale: 0.78 }),
  'silo-crawl':   Object.freeze({ mode: 'phrygian', bpm: 152, riff: 'pedal',  mood: 'stalk', gainScale: 0.74 }),
  'wire-fence':   Object.freeze({ mode: 'harmonic', bpm: 162, riff: 'climb',  mood: 'drive', gainScale: 0.92 }),
  'last-light':   Object.freeze({ mode: 'dorian',   bpm: 158, riff: 'gallop', mood: 'drive', gainScale: 1.00 }),
});
export const TRACK_NAMES = Object.freeze(Object.keys(TRACKS));



export const MAP_OPENING_TRACK = Object.freeze({
  'snow-farm':         'hog-stomp',
  'icy-mountain':      'barn-burner',
  'central-park-rink': 'cold-open',
  'arctic':            'last-light',
  'farm-maze':         'silo-crawl',
});

export function openingTrackFor(map) {
  return MAP_OPENING_TRACK[map] || 'hog-stomp';
}













export function nextTrackName(current, rng) {
  const others = TRACK_NAMES.filter((n) => n !== current);
  if (!others.length) return current;
  const mood = TRACKS[current]?.mood;
  const different = others.filter((n) => TRACKS[n].mood !== mood);
  const pool = different.length ? different : others;
  return rng && typeof rng.pick === 'function'
    ? rng.pick(pool.slice())
    : pool[0];
}









export const SPINE_HEAD = Object.freeze(['intro', 'riff']);
export const SPINE_TAIL = Object.freeze(['outro']);
const CORE_MIDDLE = Object.freeze(['riff', 'verse', 'hook', 'breakdown', 'bridge']);
const SPICE = Object.freeze(['riff', 'verse', 'hook']);





export function noTripleRun(order) {
  const out = order.slice();
  for (let pass = 0; pass < out.length + 2; pass++) {
    let clean = true;
    for (let i = 2; i < out.length; i++) {
      if (out[i] !== out[i - 1] || out[i - 1] !== out[i - 2]) continue;
      clean = false;
      let j = i + 1;
      while (j < out.length && out[j] === out[i]) j++;
      if (j < out.length) {
        const t = out[i]; out[i] = out[j]; out[j] = t;
      } else {
        let m = i - 3;
        while (m >= 0 && out[m] === out[i]) m--;
        if (m < 0) throw new Error('cannot break a triple run: pool too uniform');
        const t = out[i]; out[i] = out[m]; out[m] = t;
      }
    }
    if (clean) return out;
  }
  throw new Error('noTripleRun did not converge');
}

export function buildSectionOrder(rng) {
  const spice = rng.pick(SPICE.slice());
  const middle = rng.shuffle([...CORE_MIDDLE, spice]);
  return noTripleRun([...SPINE_HEAD, ...middle, ...SPINE_TAIL]);
}










export function buildSong({ seed = 0, map = DEFAULT_MAP, track = null } = {}) {
  const parent = new SeededRng(seed);
  const resolvedSeed = parent.seed;
  const rng = parent.child('song');

  
  
  
  
  
  
  
  
  const name = track && TRACKS[track] ? track : openingTrackFor(map);
  const spec = TRACKS[name] || null;
  const flavour = spec || flavourFor(map);
  const mode = spec ? spec.mode : 'aeolian';
  const riff = RIFFS[flavour.riff].map(([m, b]) => [toMode(m, mode), b]);
  assertBeats(riff, RIFF_BARS, `riff ${flavour.riff}`);

  const order = buildSectionOrder(rng);

  const voices = { lead: [], guitar: [], bass: [], harmony: [] };
  const drums = [];
  const layout = [];
  let barCursor = 0;

  for (const sectionName of order) {
    const section = SECTION_BUILDERS[sectionName](riff);
    for (const v of VOICE_NAMES) {
      assertBeats(section[v], section.bars, `${sectionName}.${v}`);
      
      
      
      voices[v].push(...section[v].map(([m, dur]) => [toMode(m, mode), dur]));
    }
    for (let b = 0; b < section.bars; b++) {
      const barStart = (barCursor + b) * 4;
      for (const e of drumBar(section.drums, b, section.bars)) {
        drums.push({ drum: e.drum, beat: barStart + e.at, gain: e.gain });
      }
    }
    layout.push({ name: sectionName, startBar: barCursor, bars: section.bars, drums: section.drums });
    barCursor += section.bars;
  }

  drums.sort((a, b) => a.beat - b.beat);

  const bars = barCursor;
  const bpm = flavour.bpm;
  return Object.freeze({
    seed: resolvedSeed,
    map,
    bpm,
    beatSec: 60 / bpm,
    bars,
    durationSec: bars * 4 * (60 / bpm),
    rootMidi: ROOT_MIDI,
    track: name,
    mode,
    mood: spec ? spec.mood : 'drive',
    gainScale: spec ? spec.gainScale : 1,
    riffName: flavour.riff,
    riff,
    order: Object.freeze(order),
    layout: Object.freeze(layout),
    voices: Object.freeze(voices),
    drums: Object.freeze(drums),
  });
}








export function songSummary(song) {
  const counts = {};
  for (const d of song.drums) counts[d.drum] = (counts[d.drum] || 0) + 1;
  const notes = {};
  for (const v of VOICE_NAMES) {
    notes[v] = song.voices[v].filter(([n]) => n != null).length;
  }
  return {
    seed: song.seed,
    map: song.map,
    bpm: song.bpm,
    bars: song.bars,
    durationSec: Math.round(song.durationSec * 100) / 100,
    riff: song.riffName,
    order: song.order.join(' > '),
    notes,
    drums: counts,
    kicksPerBar: Math.round(((counts.kick || 0) / song.bars) * 100) / 100,
  };
}




export function songFingerprint(song) {
  let h = 2166136261 >>> 0;
  const push = (x) => { h ^= x >>> 0; h = Math.imul(h, 16777619) >>> 0; };
  for (const v of VOICE_NAMES) {
    for (const [n, b] of song.voices[v]) push((n == null ? 999 : n) * 97 + b * 1000);
  }
  for (const d of song.drums) push(d.beat * 100 + d.drum.length);
  push(song.bpm);
  return h.toString(16).padStart(8, '0');
}
