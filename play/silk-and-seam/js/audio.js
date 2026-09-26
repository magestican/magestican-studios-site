



















import { state } from './state.js';
import { gains, silenceOf, musicBar, tuneOf, babblePlan } from './logic.js';

const DEAD_S = 3, QUIET = 1e-4;
let ac = null, master = null, fx = null, music = null, amb = null, outdoor = null, outLp = null, machine = null, tap = null, taps = null;
let hum = null, breeze = null;
const snd = { dead: false, quietSince: null, deaths: 0 };
const scene = { night: false, open: false, wind: 0 };
const listeners = new Set();

export function onSoundStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function soundStatus() {
  const g = gains(state.settings, false);
  return silenceOf({ muted: state.muted, unlocked: !!ac, ctxState: ac ? ac.state : 'none', master: g.master, dead: snd.dead });
}
let lastReason;
function notify() {
  const s = soundStatus();
  if (s.reason === lastReason) return;
  lastReason = s.reason;
  for (const fn of listeners) { try { fn(s); } catch (e) {  } }
}

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    ac = new AC();
    const g = gains(state.settings, state.muted);
    master = ac.createGain(); master.gain.value = g.master;
    master.connect(ac.destination);
    try { tap = ac.createAnalyser(); tap.fftSize = 1024; master.connect(tap); taps = new Float32Array(tap.fftSize); } catch (e) { tap = null; }
    const bus = (v, to = master) => { const n = ac.createGain(); n.gain.value = v; n.connect(to); return n; };
    fx = bus(g.sfx); music = bus(g.music * 0.8); amb = bus(g.ambience); machine = bus(1);
    outLp = ac.createBiquadFilter(); outLp.type = 'lowpass'; outLp.frequency.value = scene.open ? 9000 : 1400; outLp.connect(amb);
    outdoor = bus(scene.open ? 1 : 0.3, outLp);
    ac.onstatechange = () => { settle(); notify(); };
    hum = null; breeze = null; nextCall = 0;
    return true;
  } catch (e) { ac = null; return false; }
}


const GESTURES = ['pointerdown', 'keydown', 'touchend'];
let armed = false;
function onGesture() { unlockAudio(); }
function arm() { if (armed) return; armed = true; for (const t of GESTURES) window.addEventListener(t, onGesture, true); }
function disarm() { if (!armed) return; armed = false; for (const t of GESTURES) window.removeEventListener(t, onGesture, true); }
function settle() { if (ac && ac.state === 'running' && !snd.rebuild) disarm(); else arm(); }
arm();

export function unlockAudio() {
  if (snd.rebuild) { snd.rebuild = false; try { ac && ac.close(); } catch (e) {  } ac = null; }
  if (!ac) { if (!build()) return; startMusic(); }
  if (ac.state !== 'running') { try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {  } }
  settle(); notify();
}
function onShown() { if (!ac) return; try { ac.resume().catch(() => {}); } catch (e) {  } arm(); notify(); }
document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) { try { ac.suspend(); } catch (e) {  } arm(); notify(); return; }
  onShown();
});
window.addEventListener('pageshow', onShown);
window.addEventListener('focus', onShown);


setInterval(() => {
  if (!ac || !tap || document.hidden) return;
  const g = gains(state.settings, state.muted);
  const expecting = g.master > 0 && g.music > 0 && ac.state === 'running';
  let peak = 0;
  try { tap.getFloatTimeDomainData(taps); for (let i = 0; i < taps.length; i++) { const v = Math.abs(taps[i]); if (v > peak) peak = v; } } catch (e) { return; }
  const now = performance.now() / 1000;
  snd.peak = peak;
  if (!expecting || peak > QUIET) { snd.quietSince = null; if (snd.dead) { snd.dead = false; notify(); } return; }
  if (snd.quietSince === null) snd.quietSince = now;
  if (now - snd.quietSince >= DEAD_S && !snd.dead) {
    snd.dead = true; snd.deaths++; notify();
    
    snd.rebuild = true;
    try { ac.close(); } catch (e) {  }
    ac = null; snd.rebuild = false;
    if (build()) { startMusic(); try { ac.resume().catch(() => {}); } catch (e) {  } }
    snd.quietSince = null;
    settle();
  }
}, 250);

export function applyVolume() {
  if (!master) { notify(); return; }
  const g = gains(state.settings, state.muted), t = ac.currentTime;
  master.gain.setTargetAtTime(g.master, t, 0.02);
  fx.gain.setTargetAtTime(g.sfx, t, 0.02);
  music.gain.setTargetAtTime(g.music * 0.8, t, 0.05);
  amb.gain.setTargetAtTime(g.ambience, t, 0.05);
  notify();
}
export function setMuted(m) { state.muted = m; applyVolume(); }


function tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slide = 0, to = fx) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(to);
  o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf = null;
function noiseBuffer() {
  if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
  const len = ac.sampleRate * 2;
  noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function noise(dur, freq, q, vol = 0.3, when = 0, to = fx, attack = 0.005) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const src = ac.createBufferSource(); src.buffer = noiseBuffer();
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(to);
  src.start(t, Math.random()); src.stop(t + dur + 0.05);
}



let talking = [];
export function speak(voice, text, emotion) {
  if (!ac || ac.state !== 'running') return;
  for (const o of talking) { try { o.stop(); } catch (e) {  } }
  talking = [];
  const plan = babblePlan(voice, text, emotion);
  const t0 = ac.currentTime + 0.03;
  for (const n of plan.notes) {
    const t = t0 + n.t;
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = plan.wave;
    o.frequency.setValueAtTime(n.freq * (1 + plan.vib), t);
    o.frequency.linearRampToValueAtTime(n.freq * (1 - plan.vib), t + n.dur);
    f.type = 'bandpass'; f.frequency.value = n.formant; f.Q.value = 1.6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(n.vol * 2.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
    o.connect(f); f.connect(g); g.connect(fx);
    o.start(t); o.stop(t + n.dur + 0.02);
    talking.push(o);
  }
}
export const stopSpeaking = () => { for (const o of talking) { try { o.stop(); } catch (e) {  } } talking = []; };

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
  
  windowOpen: () => { tone(1900, 0.03, 'square', 0.05); tone(340, 0.5, 'sawtooth', 0.02, 0.05, 180); noise(1.1, 900, 0.6, 0.18, 0.12, fx, 0.35); },
  windowClose: () => { noise(0.35, 700, 0.7, 0.14, 0, fx, 0.08); tone(120, 0.12, 'triangle', 0.2, 0.28, -40); tone(1700, 0.03, 'square', 0.05, 0.36); },
  lampOn: () => { tone(2200, 0.02, 'square', 0.07); tone(90, 0.05, 'triangle', 0.1, 0.01); tone(120, 0.9, 'sine', 0.012, 0.05); },
  toNight: () => [880, 740, 587, 494].forEach((f, i) => tone(f, 0.9, 'sine', 0.07, i * 0.16)),
  toDay: () => [494, 587, 740, 880, 1175].forEach((f, i) => tone(f, 0.7, 'sine', 0.07, i * 0.12)),
  dust: () => [3520, 4186, 3951].forEach((f, i) => tone(f, 0.5, 'sine', 0.012, i * 0.11)),
  shelf: () => { tone(620, 0.06, 'triangle', 0.12); tone(410, 0.1, 'triangle', 0.08, 0.04); noise(0.12, 3000, 1, 0.05, 0.02); },
  rustle: (amt = 1) => noise(0.35 + amt * 0.3, 3200, 0.7, 0.03 + amt * 0.05, 0, fx, 0.12),
  pin: () => { tone(3100, 0.05, 'sine', 0.08); tone(4200, 0.08, 'sine', 0.04, 0.03); },
};


export function machineHum(speed) {
  if (!ac) return;
  if (!hum) {
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), trem = ac.createGain(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 900;
    
    lfo.frequency.value = 20; lg.gain.value = 0.5; trem.gain.value = 0.5;
    lfo.connect(lg); lg.connect(trem.gain);
    g.gain.value = 0;
    o.connect(f); f.connect(trem); trem.connect(g); g.connect(machine);
    o.start(); lfo.start();
    hum = { o, lfo, g };
  }
  const t = ac.currentTime;
  hum.o.frequency.setTargetAtTime(60 + speed * 40, t, 0.05);
  hum.lfo.frequency.setTargetAtTime(8 + speed * 9, t, 0.05);
  hum.g.gain.setTargetAtTime(speed > 0 ? 0.05 + speed * 0.025 : 0, t, 0.05);
  
  music.gain.setTargetAtTime(gains(state.settings, state.muted).music * (speed > 0 ? 0.35 : 0.8), t, 0.3);
}


const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function voice(v, midi, t, dur, vel) {
  const f = mtof(midi);
  if (v === 'bell') {
    
    [[1, 1, dur], [2, 0.22, dur * 0.5], [3.01, 0.08, dur * 0.3]].forEach(([k, a, d]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f * k;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28 * a * vel, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.4);
      o.connect(g); g.connect(music); o.start(t); o.stop(t + d + 0.5);
    });
  } else if (v === 'harp') {
    const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    o.connect(lp); lp.connect(g); g.connect(music); o.start(t); o.stop(t + dur + 0.7);
  } else {
    
    const g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = scene.night ? 700 : 1000;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * vel, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
    for (const det of [-6, 7]) { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 1.3); }
    lp.connect(g); g.connect(music);
  }
}
let musicTimer = 0, nextBar = 0, barNo = 0;
function startMusic() {
  clearInterval(musicTimer);
  nextBar = 0; barNo = 0;
  musicTimer = setInterval(() => {
    if (!ac || ac.state !== 'running') return;
    const mood = scene.night ? 'night' : 'day';
    const T = tuneOf(mood), beat = 60 / T.bpm, barLen = beat * 3;
    if (nextBar < ac.currentTime) nextBar = ac.currentTime + 0.1;
    while (nextBar < ac.currentTime + 0.8) {
      for (const n of musicBar(mood, barNo)) voice(n.voice, n.midi, nextBar + n.t * beat, n.dur * beat, n.vel);
      nextBar += barLen; barNo++;
    }
    ambienceTick();
  }, 150);
}


let nextCall = 0;
function birdCall(t) {
  const base = 2600 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const s = t + i * (0.09 + Math.random() * 0.05), o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), s);
    o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), s + 0.05);
    o.frequency.exponentialRampToValueAtTime(base * 0.85, s + 0.09);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.04, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.1);
    o.connect(g); g.connect(outdoor); o.start(s); o.stop(s + 0.12);
  }
}



export const CRICKET_PEAK = 0.006;
function cricket(t) {
  const f = 3900 + Math.random() * 400, n = 2 + (Math.random() < 0.4 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const s = t + k * 0.16;
    const o = ac.createOscillator(), am = ac.createOscillator(), ag = ac.createGain(), trill = ac.createGain(), g = ac.createGain();
    o.frequency.value = f; am.frequency.value = 42;
    trill.gain.value = 0.5; ag.gain.value = 0.5;   
    am.connect(ag); ag.connect(trill.gain);
    g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(CRICKET_PEAK, s + 0.02); g.gain.linearRampToValueAtTime(0.0001, s + 0.1);
    o.connect(trill); trill.connect(g); g.connect(outdoor); o.start(s); am.start(s); o.stop(s + 0.12); am.stop(s + 0.12);
  }
}
function ambienceTick() {
  const t = ac.currentTime;
  if (t >= nextCall) {
    if (scene.night) cricket(t + 0.05); else birdCall(t + 0.05);
    nextCall = t + (scene.night ? 2.4 + Math.random() * 3.2 : 1.8 + Math.random() * 4.5) / (scene.open ? 1.3 : 1);
  }
  
  if (scene.open && !breeze) {
    const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuffer(); src.loop = true;
    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.5; g.gain.value = 0;
    src.connect(bp); bp.connect(g); g.connect(amb); src.start();
    breeze = { src, bp, g };
  }
  if (breeze) {
    const w = scene.open ? scene.wind : 0;
    breeze.g.gain.setTargetAtTime(0.02 + w * 0.09, t, 0.3);
    breeze.bp.frequency.setTargetAtTime(380 + w * 700, t, 0.4);
    if (!scene.open && breeze.g.gain.value < 0.003) { try { breeze.src.stop(); } catch (e) {  } breeze = null; }
  }
}


export function setScene({ night, open }) {
  if (night !== undefined) scene.night = !!night;
  if (open !== undefined) scene.open = !!open;
  if (!ac) return;
  const t = ac.currentTime;
  outLp.frequency.setTargetAtTime(scene.open ? 9000 : 1400, t, 0.25);
  outdoor.gain.setTargetAtTime(scene.open ? 1 : 0.3, t, 0.25);
  if (!scene.open && breeze) breeze.g.gain.setTargetAtTime(0, t, 0.4);
}
export function setWind(w) { scene.wind = w; }


window.__sound = () => ({ ...soundStatus(), ctx: ac ? ac.state : 'none', peak: snd.peak || 0, deaths: snd.deaths, night: scene.night, open: scene.open });
