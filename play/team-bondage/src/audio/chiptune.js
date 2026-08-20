// Fast chiptune loop via Web Audio scheduling.
//
// Design:
//   * On EVERY gesture the caller sends our way (via game.js' tryStartAudio),
//     we (re)create the AudioContext if needed, resume it, and re-schedule
//     the next loop worth of notes. This makes the audio robust to iOS
//     Safari's aggressive AudioContext-suspend behaviour when tabs
//     background.
//   * Notes are scheduled ~200ms ahead of currentTime and a look-ahead
//     scheduler keeps queueing more so we never run out.
//
// Web Audio does NOT keep playing when the tab backgrounds on iOS Safari;
// that's a browser policy limit. It will resume automatically on the next
// gesture we get.

const NOTE = {
  A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
  A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

const BPM = 168;
const BEAT = 60 / BPM;

const HOOKS = () => [
  // hookA
  [NOTE.A4, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5],
  [NOTE.B4, 0.5], [NOTE.D5, 0.5], [NOTE.A4, 0.5], [NOTE.C5, 0.5],
  // hookA'
  [NOTE.A4, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.G5, 0.5],
  [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 1.0],
  // hookB
  [NOTE.A4, 0.25], [NOTE.B4, 0.25], [NOTE.C5, 0.25], [NOTE.D5, 0.25],
  [NOTE.E5, 0.5],  [NOTE.D5, 0.5],  [NOTE.C5, 0.5],  [NOTE.B4, 0.5],
  // hookC
  [NOTE.E5, 0.5], [NOTE.D5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 0.5],
  [NOTE.G4, 0.5], [NOTE.A4, 0.5], [NOTE.E4, 1.0],
];

const BASS_ROOTS = [NOTE.A2, NOTE.C3, NOTE.G3, NOTE.E3];

export class Chiptune {
  constructor() {
    this.muted = localStorage.getItem('tb.muted') === '1';
    this.ctx = null;
    this.master = null;
    this._playing = false;
    this._nextScheduleAt = 0;   // ctx.currentTime at which next batch starts
    this._pumpTimer = null;
  }

  ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.16;
    this.master.connect(this.ctx.destination);
  }

  start() {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this._playing) return;
    this._playing = true;
    this._nextScheduleAt = this.ctx.currentTime + 0.05;
    this._pump();
  }

  _pump() {
    if (!this._playing || !this.ctx) return;
    // Schedule notes up to ~2 seconds ahead of the audio clock, then check
    // back every 500ms to top it up.
    const AHEAD = 2.0;
    while (this._nextScheduleAt < this.ctx.currentTime + AHEAD) {
      this._scheduleOneBar(this._nextScheduleAt);
      this._nextScheduleAt += 4 * BEAT;   // one bar of 4 beats
    }
    if (this._pumpTimer) clearTimeout(this._pumpTimer);
    this._pumpTimer = setTimeout(() => this._pump(), 500);
  }

  // Schedule ONE bar (4 beats) at startTime. We use the bar index to pick a
  // hook segment and a bass root, so the tune sounds cohesive across bars.
  _scheduleOneBar(startTime) {
    if (!this._barIdx) this._barIdx = 0;
    const bar = this._barIdx++;
    // 8-bar full hook: index into HOOKS array with wrapping so it loops.
    const hook = HOOKS();
    // Take 4 beats worth of notes from hook starting at (bar % totalHookLen)
    // Simpler: play each 8-beat hook segment across 2 bars, cycled.
    const twoBarStart = (bar % 4) * 8;  // 4 hook segments, each 8 beats-ish
    let t = startTime;
    let beatsLeft = 4;
    let idx = twoBarStart;
    while (beatsLeft > 0 && idx < hook.length) {
      const [note, beats] = hook[idx++];
      if (beats > beatsLeft) break;
      if (note != null) this._playNote(note, t, beats * BEAT * 0.92, 'square', 0.14);
      t += beats * BEAT;
      beatsLeft -= beats;
    }
    // Bass: straight 8ths on the root for this bar.
    const root = BASS_ROOTS[bar % 4];
    for (let e = 0; e < 8; e++) {
      this._playNote(root, startTime + e * (BEAT / 2), (BEAT / 2) * 0.92, 'sawtooth', 0.18);
    }
  }

  _playNote(freq, when, dur, type, peakGain) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peakGain, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  stop() {
    this._playing = false;
    if (this._pumpTimer) { clearTimeout(this._pumpTimer); this._pumpTimer = null; }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('tb.muted', muted ? '1' : '0');
    if (this.master) this.master.gain.value = muted ? 0 : 0.16;
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }
}
