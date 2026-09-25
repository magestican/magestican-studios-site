
import { state } from './state.js';
import { gains } from './logic.js';



let ac = null, master = null, fx = null, hum = null;

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  const g = gains(state.settings, state.muted);
  master = ac.createGain();
  master.gain.value = g.master;
  master.connect(ac.destination);
  fx = ac.createGain();
  fx.gain.value = g.sfx;
  fx.connect(master);
}

export function applyVolume() {
  if (!master) return;
  const g = gains(state.settings, state.muted);
  master.gain.setTargetAtTime(g.master, ac.currentTime, 0.02);
  fx.gain.setTargetAtTime(g.sfx, ac.currentTime, 0.02);
}

export function setMuted(m) {
  state.muted = m;
  applyVolume();
}

function tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slide = 0) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(fx);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, freq, q, vol = 0.3, when = 0) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(fx);
  src.start(t);
}

export const sfx = {
  click: () => tone(880, 0.05, 'triangle', 0.12),
  page: () => noise(0.18, 2400, 0.8, 0.25),
  snip: () => { noise(0.05, 5200, 3, 0.35); tone(2400, 0.04, 'square', 0.04, 0.01); },
  bobbinOut: () => { tone(420, 0.09, 'square', 0.06, 0, -180); tone(260, 0.16, 'triangle', 0.08, 0.08, -80); },
  wind: () => { tone(300, 0.45, 'sawtooth', 0.035, 0, 900); noise(0.4, 1800, 1.2, 0.08); tone(1175, 0.12, 'triangle', 0.1, 0.42); },
  coin: () => { tone(1320, 0.12, 'sine', 0.2); tone(1760, 0.3, 'sine', 0.18, 0.08); },
  error: () => tone(180, 0.18, 'sawtooth', 0.12, 0, -60),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.16, i * 0.12)),
  levelup: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.45, 'triangle', 0.15, i * 0.09)),
  sparkle: () => [2093, 2637, 3136].forEach((f, i) => tone(f, 0.25, 'sine', 0.06, i * 0.06)),
};


export function machineHum(speed) {
  if (!ac) return;
  if (!hum) {
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), trem = ac.createGain(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 900;
    
    lfo.frequency.value = 20; lg.gain.value = 0.5; trem.gain.value = 0.5;
    lfo.connect(lg); lg.connect(trem.gain);
    g.gain.value = 0;
    o.connect(f); f.connect(trem); trem.connect(g); g.connect(master);
    o.start(); lfo.start();
    hum = { o, lfo, g };
  }
  const t = ac.currentTime;
  hum.o.frequency.setTargetAtTime(60 + speed * 40, t, 0.05);
  hum.lfo.frequency.setTargetAtTime(8 + speed * 9, t, 0.05);
  hum.g.gain.setTargetAtTime(speed > 0 ? 0.05 + speed * 0.025 : 0, t, 0.05);
}
