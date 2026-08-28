















const noteCache = new Map();

export function createAudio() {
  return {
    ctx: null,
    master: null,
    engine: null,
    muted: false,
    started: false,
  };
}

































export function resumeAudio(audio) {
  if (!audio.ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      audio.ctx = new Ctx();
    } catch {
      
      
      return false;
    }
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.55;
    audio.master.connect(audio.ctx.destination);
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  
  
  try {
    const buf = audio.ctx.createBuffer(1, 1, audio.ctx.sampleRate);
    const src = audio.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(audio.ctx.destination);
    src.start(0);
  } catch {  }
  audio.started = true;
  return true;
}














export function installAudioUnlock(audio) {
  
  
  
  
  
  
  
  const unlock = () => {
    if (audio.ctx && audio.ctx.state === 'running' && audio.silent && !audio.silent.paused) return;
    resumeAudio(audio);
    startSilentKeepAlive(audio);
  };
  for (const t of ['pointerdown', 'touchend', 'keydown', 'click']) {
    window.addEventListener(t, unlock, true);
  }

  const wake = () => {
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    if (audio.silent && audio.silent.paused && !audio.muted) {
      audio.silent.play().catch(() => {  });
    }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('focus', wake);
  window.addEventListener('pageshow', wake);
}








function startSilentKeepAlive(audio) {
  if (audio.silent) return;
  try {
    const el = document.createElement('audio');
    el.loop = true;
    
    
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.volume = 0;
    el.src = silentWavDataUrl();
    el.play().catch(() => {  });
    audio.silent = el;
  } catch {  }
}


function silentWavDataUrl() {
  const samples = 1024;
  const bytes = 44 + samples * 2;
  const b = new Uint8Array(bytes);
  const view = new DataView(b.buffer);
  const ascii = (off, str) => { for (let i = 0; i < str.length; i += 1) b[off + i] = str.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, bytes - 8, true); ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true); view.setUint32(28, 44100, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, samples * 2, true);
  let bin = '';
  for (let i = 0; i < bytes; i += 1) bin += String.fromCharCode(b[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}







export function audioState(audio) {
  
  
  
  
  
  
  
  const ua = typeof navigator !== 'undefined' ? navigator.userActivation : null;
  return {
    hasContext: !!audio.ctx,
    state: audio.ctx ? audio.ctx.state : 'none',
    engine: !!audio.engine,
    keepAlive: !!audio.silent && !audio.silent.paused,
    muted: !!audio.muted,
    activated: ua ? { sticky: ua.hasBeenActive, active: ua.isActive } : 'unsupported',
  };
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (audio.master) audio.master.gain.value = muted ? 0 : 0.55;
  
  
  
  
  if (audio.silent) {
    if (muted) audio.silent.pause();
    else audio.silent.play().catch(() => {  });
  }
}






















function engineWave(ctx) {
  const real = new Float32Array(17);
  const imag = new Float32Array(17);
  
  const amps = [0, 1.00, 0.86, 0.28, 0.64, 0.47, 0.16, 0.22, 0.19,
    0.13, 0.11, 0.08, 0.09, 0.05, 0.06, 0.04, 0.05];
  for (let i = 1; i < amps.length; i += 1) imag[i] = amps[i];
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

export function startEngine(audio) {
  if (!audio.ctx || audio.engine) return;
  const ctx = audio.ctx;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(audio.master);

  








  const body = ctx.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = 320;
  body.Q.value = 2.4;
  body.gain.value = 9;
  body.connect(out);

  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 1.1;
  filter.connect(body);

  const wave = engineWave(ctx);
  
  
  
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  oscA.setPeriodicWave(wave);
  oscB.setPeriodicWave(wave);
  oscA.frequency.value = 60;
  oscB.frequency.value = 60 * 1.007;
  oscA.connect(filter);
  oscB.connect(filter);
  oscA.start();
  oscB.start();

  
  
  
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 30;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.5;
  sub.connect(subGain).connect(filter);
  sub.start();

  








  const lump = ctx.createOscillator();
  lump.type = 'sine';
  lump.frequency.value = 11;
  const lumpDepth = ctx.createGain();
  lumpDepth.gain.value = 0.25;
  lump.connect(lumpDepth).connect(out.gain);
  lump.start();

  
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  noise.buffer = buf;
  noise.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1400;
  noise.connect(noiseFilter).connect(noiseGain).connect(audio.master);
  noise.start();

  
  
  
  const whine = ctx.createOscillator();
  whine.type = 'triangle';
  whine.frequency.value = 900;
  const whineGain = ctx.createGain();
  whineGain.gain.value = 0;
  whine.connect(whineGain).connect(audio.master);
  whine.start();

  audio.engine = {
    out, filter, body, oscA, oscB, sub, subGain,
    lump, lumpDepth, noiseGain, noiseFilter, whine, whineGain,
  };
}













export function updateEngine(audio, kart, { onRoad = true, throttle = 1 } = {}) {
  const e = audio.engine;
  if (!e || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  const speed = Math.abs(kart.speed ?? 0);
  const top = kart.tuning?.topSpeed ?? 30;
  const frac = Math.min(1.35, speed / top);

  const GEARS = 4;
  const gearSpan = 1 / GEARS;
  const gear = Math.min(GEARS - 1, Math.floor(frac / gearSpan));
  const withinGear = (frac - gear * gearSpan) / gearSpan;
  const revs = 0.35 + withinGear * 0.65;

  const base = 58 + revs * 118 + gear * 9;
  e.oscA.frequency.setTargetAtTime(base, t, 0.045);
  e.oscB.frequency.setTargetAtTime(base * 1.007, t, 0.045);
  e.sub.frequency.setTargetAtTime(base * 0.5, t, 0.05);

  
  
  
  
  
  const open = Math.max(0, throttle);
  const brightness = 420 + revs * 1500 + open * (700 + revs * 900) + (kart.boost ? 1100 : 0);
  e.filter.frequency.setTargetAtTime(brightness, t, 0.05);
  
  
  e.body.gain.setTargetAtTime(4 + open * 7, t, 0.08);
  
  
  e.lumpDepth.gain.setTargetAtTime(0.22 * (1 - Math.min(1, revs)) + 0.02, t, 0.1);
  e.lump.frequency.setTargetAtTime(7 + revs * 16, t, 0.1);

  const load = kart.spinTime > 0 ? 0.06 : 0.05 + Math.min(0.16, frac * 0.18);
  e.out.gain.setTargetAtTime(audio.muted ? 0 : load * (0.55 + open * 0.45), t, 0.08);

  
  const boosting = kart.boost ? 1 : 0;
  e.whine.frequency.setTargetAtTime(700 + revs * 1400, t, 0.12);
  e.whineGain.gain.setTargetAtTime(audio.muted ? 0 : boosting * 0.045, t, 0.06);

  
  
  
  
  const scrub = Math.min(1, Math.abs(kart.slip ?? 0) / 0.6);
  const noiseLevel = (onRoad ? 0.012 : 0.075) + scrub * 0.05;
  e.noiseGain.gain.setTargetAtTime(audio.muted ? 0 : noiseLevel, t, 0.09);
  e.noiseFilter.frequency.setTargetAtTime(700 + frac * 2200, t, 0.1);
}

export function stopEngine(audio) {
  const e = audio.engine;
  if (!e) return;
  
  
  
  for (const node of [e.sub, e.lump, e.whine]) {
    try { node.stop(); } catch {  }
  }
  try {
    e.oscA.stop(); e.oscB.stop();
  } catch {  }
  audio.engine = null;
}





function blip(audio, { freq, type = 'square', dur = 0.12, gain = 0.2, sweep = 0, delay = 0 }) {
  if (!audio.ctx || audio.muted) return;
  const ctx = audio.ctx;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(audio.master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(audio, { dur = 0.25, gain = 0.25, freq = 900, q = 0.8 }) {
  if (!audio.ctx || audio.muted) return;
  const ctx = audio.ctx;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(audio.master);
  src.start(t);
}

export const SFX = {
  countdown: (audio, beat) => blip(audio, { freq: 420, dur: 0.16, gain: 0.22, type: 'square' }),
  go: (audio) => {
    blip(audio, { freq: 660, dur: 0.3, gain: 0.28, type: 'square' });
    blip(audio, { freq: 990, dur: 0.34, gain: 0.18, type: 'triangle', delay: 0.04 });
  },
  
  
  
  miniTurbo: (audio, tier) => {
    blip(audio, { freq: 300 + tier * 120, dur: 0.28, gain: 0.26, type: 'sawtooth', sweep: 420 + tier * 220 });
    noiseBurst(audio, { dur: 0.22, gain: 0.14, freq: 1800 + tier * 500 });
  },
  
  
  
  jump: (audio, strength = 1) => {
    blip(audio, { freq: 240, dur: 0.34, gain: 0.2, type: 'triangle', sweep: 420 * strength });
    noiseBurst(audio, { dur: 0.42, gain: 0.10, freq: 900, q: 0.7 });
  },
  
  
  land: (audio, hard = 0.5) => {
    blip(audio, { freq: 150 - hard * 50, dur: 0.16, gain: 0.16 + hard * 0.12, type: 'sine', sweep: -80 });
    noiseBurst(audio, { dur: 0.2, gain: 0.10 + hard * 0.1, freq: 320, q: 0.8 });
  },
  
  
  
  
  
  emote: (audio, id) => {
    const voice = {
      happy: { freq: 620, sweep: 340, type: 'square', dur: 0.18 },
      boast: { freq: 300, sweep: 260, type: 'sawtooth', dur: 0.34 },
      rude:  { freq: 190, sweep: -90, type: 'sawtooth', dur: 0.30 },
      sulk:  { freq: 340, sweep: -180, type: 'triangle', dur: 0.40 },
    }[id] ?? { freq: 460, sweep: 120, type: 'square', dur: 0.2 };
    blip(audio, { ...voice, gain: 0.22 });
    blip(audio, { ...voice, freq: voice.freq * 1.5, gain: 0.12, delay: 0.07 });
  },
  itemGet: (audio) => {
    blip(audio, { freq: 520, dur: 0.09, gain: 0.2, type: 'square' });
    blip(audio, { freq: 780, dur: 0.11, gain: 0.2, type: 'square', delay: 0.08 });
  },
  itemUse: (audio) => blip(audio, { freq: 340, dur: 0.14, gain: 0.22, type: 'square', sweep: 240 }),
  hit: (audio) => {
    noiseBurst(audio, { dur: 0.4, gain: 0.32, freq: 400, q: 0.5 });
    blip(audio, { freq: 180, dur: 0.34, gain: 0.24, type: 'sawtooth', sweep: -120 });
  },
  shieldBlock: (audio) => blip(audio, { freq: 880, dur: 0.2, gain: 0.24, type: 'triangle', sweep: 400 }),
  lap: (audio) => {
    blip(audio, { freq: 620, dur: 0.13, gain: 0.2, type: 'square' });
    blip(audio, { freq: 830, dur: 0.16, gain: 0.2, type: 'square', delay: 0.1 });
  },
  finish: (audio) => {
    [523, 659, 784, 1046].forEach((f, i) => blip(audio, { freq: f, dur: 0.3, gain: 0.24, type: 'square', delay: i * 0.11 }));
  },
  thunder: (audio) => noiseBurst(audio, { dur: 0.9, gain: 0.34, freq: 220, q: 0.4 }),
  bump: (audio) => noiseBurst(audio, { dur: 0.13, gain: 0.16, freq: 260, q: 1.4 }),
};
