





import { ambienceFor, AMBIENCE_LAYERS } from './musicCues.js';

const MASTER = 0.2;
let ctx = null, master = null, noise = null, layers = null, key = '', mix = null, timer = null, muted = () => false;

function make() {
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise = buf;
  const src = (f) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.playbackRate.value = f; s.start(); return s; };
  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const lfo = (hz, depth, target) => { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = hz; o.connect(g); g.connect(target); o.start(); };
  layers = {};
  for (const name of AMBIENCE_LAYERS) { layers[name] = gain(0); layers[name].connect(master); }
  
  { const w = gain(0.5); src(1).connect(filt('bandpass', 420, 0.6)).connect(w); w.connect(layers.wind); lfo(0.07, 0.35, w.gain); }
  
  { const s = gain(0.2); src(0.8).connect(filt('lowpass', 650)).connect(s); s.connect(layers.surf); layers.surfSwell = s; }
  
  { const b = gain(0.12); src(1.3).connect(filt('bandpass', 5200, 9)).connect(b); b.connect(layers.bugs); lfo(18, 0.1, b.gain); }
  
  { const r = gain(1.2); src(0.5).connect(filt('lowpass', 85)).connect(r); r.connect(layers.rumble); lfo(0.11, 0.5, r.gain); }
  return true;
}

function chirp(at, level) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = 2100 + Math.random() * 1400;
  o.type = 'sine'; o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f * (1.25 + Math.random() * 0.4), at + 0.07);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.08 * level, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
  o.connect(g); g.connect(layers.birds); o.start(at); o.stop(at + 0.13);
}
const BELLS = [1046.5, 1174.7, 1318.5, 1568, 1760];
function bell(at, level) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = BELLS[Math.floor(Math.random() * BELLS.length)];
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.06 * level, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
  o.connect(g); g.connect(layers.chimes); o.start(at); o.stop(at + 2.5);
}
let nextBird = 0, nextBell = 0, nextWave = 0;
function tick() {
  if (!ctx || !mix || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (mix.birds > 0 && now >= nextBird) { const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) chirp(now + 0.05 + i * 0.13, mix.birds); nextBird = now + 1.6 + Math.random() * 4; }
  if (mix.chimes > 0 && now >= nextBell) { bell(now + 0.05, mix.chimes); if (Math.random() < 0.5) bell(now + 0.35, mix.chimes * 0.7); nextBell = now + 2.2 + Math.random() * 4; }
  if (mix.surf > 0 && now >= nextWave) {
    const g = layers.surfSwell.gain, len = 4.5 + Math.random() * 3;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(1.1, now + len * 0.35); g.linearRampToValueAtTime(0.18, now + len);
    nextWave = now + len;
  }
}

export const ambience = {
  
  init(isMuted) { muted = isMuted; },
  
  update(mode, sec) {
    const k = mode + '|' + sec + '|' + (muted() ? 'm' : '') + (document.hidden ? 'h' : '');
    if (k === key) return;
    key = k;
    mix = ambienceFor(mode, sec);
    const want = !muted() && !document.hidden && AMBIENCE_LAYERS.some((l) => mix[l] > 0);
    if (!ctx) { if (!want) return; if (!make()) return; timer = setInterval(tick, 250); }
    if (want && ctx.state === 'suspended') ctx.resume().catch(() => { key = ''; });
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(want ? MASTER : 0, t, 0.5);
    for (const l of AMBIENCE_LAYERS) layers[l].gain.setTargetAtTime(mix[l], t, 0.6);
  },
  
  retry() { key = ''; if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
};
addEventListener('pointerdown', () => ambience.retry(), true);
addEventListener('keydown', () => ambience.retry(), true);
