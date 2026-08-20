// Tiny chiptune loop synthesised at runtime via Web Audio - no assets.
//
// Two voices:
//   * Lead:  square-wave melody (classic Game Boy tone)
//   * Bass:  sawtooth root on beat 1 of each bar
//
// The whole tune is exactly 60 seconds and loops seamlessly. Muteable via
// setMuted(). AudioContext creation is deferred until the first user gesture
// so iOS Safari's autoplay policy accepts it.

// A minor scale note frequencies (Hz)
const NOTE = {
  A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
  A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
};

// 60-second tune at 120 BPM (0.5s per beat). 120 beats total.
// Melody is 8 phrases of 4 bars each; each bar = 4 beats. 8 phrases x 4 bars
// x 4 beats x 0.5s = 64s. We'll trim to 60s and hold last note.

const BPM = 120;
const BEAT = 60 / BPM;   // 0.5s

// Melody: array of [note, beats]. null note = rest.
// One phrase = 8 beats. 15 phrases = 120 beats = 60s.
const MELODY = flatten([
  phraseA(), phraseB(), phraseA(), phraseC(),
  phraseA(), phraseB(), phraseA(), phraseC(),
  phraseD(), phraseD(), phraseE(), phraseE(),
  phraseA(), phraseB(), phraseF(),
]);

const BASS = flatten([
  // 60s of bass on beat 1 of each bar (bar = 4 beats, so bass every 2s)
  ...Array.from({ length: 30 }, (_, i) => bassBarFor(i)),
]);

function flatten(arrays) { return arrays.flat(); }

function phraseA() {  // 8 beats
  return [
    [NOTE.A4, 1], [NOTE.C5, 1], [NOTE.E5, 1], [NOTE.D5, 1],
    [NOTE.C5, 1], [NOTE.B4, 1], [NOTE.A4, 2],
  ];
}
function phraseB() {
  return [
    [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.C5, 1], [NOTE.B4, 1],
    [NOTE.A4, 1], [NOTE.G4, 1], [NOTE.E4, 2],
  ];
}
function phraseC() {
  return [
    [NOTE.E4, 0.5], [NOTE.F4, 0.5], [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.C5, 1],
    [NOTE.B4, 0.5], [NOTE.A4, 0.5], [NOTE.G4, 1], [null, 2],
  ];
}
function phraseD() {
  return [
    [NOTE.D5, 1], [NOTE.C5, 1], [NOTE.B4, 1], [NOTE.A4, 1],
    [NOTE.G4, 1], [NOTE.A4, 1], [NOTE.C5, 2],
  ];
}
function phraseE() {
  return [
    [NOTE.A4, 0.5], [NOTE.B4, 0.5], [NOTE.C5, 0.5], [NOTE.D5, 0.5],
    [NOTE.E5, 1], [NOTE.D5, 1], [NOTE.C5, 1], [NOTE.A4, 2],
  ];
}
function phraseF() {
  return [
    [NOTE.A4, 1], [NOTE.C5, 1], [NOTE.E5, 1], [NOTE.A4, 1],
    [NOTE.C5, 1], [NOTE.B4, 1], [NOTE.A4, 2],
  ];
}
function bassBarFor(barIdx) {
  // Rotate through A / F / G / E for a familiar Am-F-G-Em progression.
  const roots = [NOTE.A2, NOTE.C3, NOTE.G3, NOTE.E3];
  const root = roots[barIdx % 4];
  return [[root, 2], [null, 2]];   // 2 beats bass, 2 beats rest, per bar
}

export class Chiptune {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = localStorage.getItem('tb.muted') === '1';
    this._playing = false;
    this._loopTimer = null;
  }

  ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.12;
    this.master.connect(this.ctx.destination);
  }

  start() {
    this.ensureContext();
    if (!this.ctx || this._playing) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._playing = true;
    this._scheduleLoop();
  }

  _scheduleLoop() {
    if (!this._playing) return;
    const startAt = this.ctx.currentTime + 0.05;
    // Melody voice (square)
    let t = startAt;
    for (const [note, beats] of MELODY) {
      if (note != null) this._playNote(note, t, beats * BEAT * 0.95, 'square', 0.10);
      t += beats * BEAT;
    }
    // Bass voice (saw)
    t = startAt;
    for (const [note, beats] of BASS) {
      if (note != null) this._playNote(note, t, beats * BEAT * 0.95, 'sawtooth', 0.14);
      t += beats * BEAT;
    }
    // Loop after 60 seconds
    this._loopTimer = setTimeout(() => this._scheduleLoop(), 60 * 1000);
  }

  _playNote(freq, when, dur, type, peakGain) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peakGain, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  stop() {
    this._playing = false;
    if (this._loopTimer) { clearTimeout(this._loopTimer); this._loopTimer = null; }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('tb.muted', muted ? '1' : '0');
    if (this.master) this.master.gain.value = muted ? 0 : 0.12;
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }
}
