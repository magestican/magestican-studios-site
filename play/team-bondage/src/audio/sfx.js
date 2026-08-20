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

function whiteNoise(ctx, dur) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}
