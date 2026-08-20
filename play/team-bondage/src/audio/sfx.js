// Procedural sound effects synthesised via Web Audio.
//
// One-shot sounds only - the music uses HTMLAudio (see chiptune.js) for
// backgrounding, but SFX are transient and don't need to survive tab-switch.
//
// Sounds:
//   pew()      short square-wave pew for a poo bullet leaving the shovel
//   splat()    quick noise burst for a hit
//   boom(vol)  low sine + noise for hazard explosions - louder if near
//   snorkel()  bull-like "SNORTS" for chicken projectile whoosh
//   chirp()    pickup pling when the chicken slingshot lands
//
// AudioContext is lazily created on first call, and each call resumes it
// (needed on iOS Safari after backgrounding).

let _ctx = null;
let _master = null;
let _muted = () => localStorage.getItem('tb.muted') === '1';

function ensureCtx() {
  if (!_ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _ctx = new Ctx();
    _master = _ctx.createGain();
    _master.gain.value = 0.55;
    _master.connect(_ctx.destination);
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

export function setSfxMuted(muted) {
  _muted = () => muted;
  if (_master) _master.gain.value = muted ? 0 : 0.55;
}

// -- individual sounds -----------------------------------------------------

export function pew() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
  osc.connect(gain).connect(_master);
  osc.start(t); osc.stop(t + 0.12);
}

export function splat() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const noise = whiteNoise(ctx, 0.08);
  const gain = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 800;
  gain.gain.setValueAtTime(0.20, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  noise.connect(filt).connect(gain).connect(_master);
  noise.start(t); noise.stop(t + 0.1);
}

export function boom(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  // Sub sine sweep
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(90, t);
  sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);
  subGain.gain.setValueAtTime(0.35 * loudness, t);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  sub.connect(subGain).connect(_master);
  sub.start(t); sub.stop(t + 0.65);
  // Noise crack
  const noise = whiteNoise(ctx, 0.4);
  const nFilt = ctx.createBiquadFilter();
  nFilt.type = 'lowpass'; nFilt.frequency.value = 1200;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.28 * loudness, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  noise.connect(nFilt).connect(nGain).connect(_master);
  noise.start(t); noise.stop(t + 0.4);
}

export function chirp() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880 + i * 220, t + i * 0.05);
    gain.gain.setValueAtTime(0.18, t + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + i * 0.05 + 0.05);
    osc.connect(gain).connect(_master);
    osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.15);
  }
}

// Long descending whoosh for falling hazards ("WOOOOSHHH").
export function whoosh() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  // Descending sine + noise band that opens up.
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(140, t + 1.8);
  oscGain.gain.setValueAtTime(0, t);
  oscGain.gain.linearRampToValueAtTime(0.10, t + 0.2);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
  osc.connect(oscGain).connect(_master);
  osc.start(t); osc.stop(t + 1.9);
  // Noise bed
  const noise = whiteNoise(ctx, 1.9);
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.setValueAtTime(1800, t);
  filt.frequency.exponentialRampToValueAtTime(300, t + 1.8);
  filt.Q.value = 2;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0, t);
  nGain.gain.linearRampToValueAtTime(0.14, t + 0.2);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
  noise.connect(filt).connect(nGain).connect(_master);
  noise.start(t); noise.stop(t + 1.9);
}

// Gore-mode joke SFX: a wet, descending fart. Played on every player
// weapon fire when GORE mode is on. Kept short (~180ms) so it doesn't
// step on the pew/splat/boom chain.
// LOUD fart. Bryan complained he couldn't hear it, so this is boosted:
// longer duration (~300ms), higher gain, wet plosion at the front AND end.
export function fart(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  // Descending buzzy sawtooth "brrrrrpt" — 300ms so it's clearly audible.
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.30);
  // Deep splutter LFO.
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'square'; lfo.frequency.value = 22;
  lfoGain.gain.value = 60;
  lfo.connect(lfoGain).connect(osc.frequency);
  lfo.start(t); lfo.stop(t + 0.35);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.55 * loudness, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  osc.connect(g).connect(_master);
  osc.start(t); osc.stop(t + 0.35);
  // Front-end wet plosion so the fart CUTS THROUGH the pew.
  const n1 = whiteNoise(ctx, 0.06);
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 260; f1.Q.value = 3.5;
  const gn1 = ctx.createGain();
  gn1.gain.setValueAtTime(0.35 * loudness, t);
  gn1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n1.connect(f1).connect(gn1).connect(_master);
  n1.start(t); n1.stop(t + 0.08);
  // Trailing wet plosion at the end.
  const n2 = whiteNoise(ctx, 0.10);
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.frequency.value = 180; f2.Q.value = 4;
  const gn2 = ctx.createGain();
  gn2.gain.setValueAtTime(0.30 * loudness, t + 0.20);
  gn2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  n2.connect(f2).connect(gn2).connect(_master);
  n2.start(t + 0.20); n2.stop(t + 0.32);
}

export function snorkel() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const noise = whiteNoise(ctx, 0.2);
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 400; filt.Q.value = 5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  noise.connect(filt).connect(gain).connect(_master);
  noise.start(t); noise.stop(t + 0.25);
}

// -- Animal voices ---------------------------------------------------------
// Simple synthesised farm-animal sounds. Each takes an optional `loudness`.
// Played on double-jump + on death (see game.js). Every one is short (~350-
// 500ms) so it doesn't step on gunfire.

function _envOsc(ctx, dur, type, f0, f1, gain) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(_master);
  osc.start(t); osc.stop(t + dur + 0.05);
}

// Cow "MOOoooo" — low sustained sine descending.
export function moo(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  _envOsc(ctx, 0.55, 'sawtooth', 220, 110, 0.30 * loudness);
  _envOsc(ctx, 0.55, 'sine',     110, 60,  0.20 * loudness);
}

// Pig "OINK oink" — two short throaty grunts.
export function oink(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;
  for (const [start, dur, f0, f1] of [[0.00, 0.13, 380, 180], [0.18, 0.11, 340, 160]]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f0, t0 + start);
    osc.frequency.exponentialRampToValueAtTime(f1, t0 + start + dur);
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(0.30 * loudness, t0 + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
    osc.connect(g).connect(_master);
    osc.start(t0 + start); osc.stop(t0 + start + dur + 0.05);
  }
}

// Sheep "BHEEEEEE" — wavering triangle with vibrato around 500 Hz.
export function bheee(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime, dur = 0.50;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, t);
  // Vibrato
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine'; lfo.frequency.value = 14;
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain).connect(osc.frequency);
  lfo.start(t); lfo.stop(t + dur + 0.05);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.28 * loudness, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(_master);
  osc.start(t); osc.stop(t + dur + 0.05);
}

// Chicken "BAWK bawk bawk" — three fast rising squawks.
export function cluck(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;
  const parts = [
    [0.00, 0.10, 880, 1500],
    [0.14, 0.07, 780, 1200],
    [0.24, 0.07, 760, 1150],
  ];
  for (const [start, dur, f0, f1] of parts) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0, t0 + start);
    osc.frequency.exponentialRampToValueAtTime(f1, t0 + start + dur);
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(0.22 * loudness, t0 + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
    osc.connect(g).connect(_master);
    osc.start(t0 + start); osc.stop(t0 + start + dur + 0.05);
  }
}

// Dispatch: play the right voice for a given character kind.
export function animalVoice(character, loudness = 1.0) {
  switch (character) {
    case 'cow':     return moo(loudness);
    case 'pig':     return oink(loudness);
    case 'sheep':   return bheee(loudness);
    case 'chicken': return cluck(loudness);
    default:        return moo(loudness);
  }
}

function whiteNoise(ctx, dur) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}
