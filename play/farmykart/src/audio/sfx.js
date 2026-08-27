















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
    audio.master.gain.value = 0.55;
    audio.master.connect(audio.ctx.destination);
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  audio.started = true;
  return true;
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (audio.master) audio.master.gain.value = muted ? 0 : 0.55;
}





export function startEngine(audio) {
  if (!audio.ctx || audio.engine) return;
  const ctx = audio.ctx;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(audio.master);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 1.2;
  filter.connect(out);

  
  
  
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  oscA.type = 'sawtooth';
  oscB.type = 'sawtooth';
  oscA.frequency.value = 60;
  oscB.frequency.value = 60 * 1.008;
  oscA.connect(filter);
  oscB.connect(filter);
  oscA.start();
  oscB.start();

  
  
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

  audio.engine = { out, filter, oscA, oscB, noiseGain, noiseFilter };
}









export function updateEngine(audio, kart, { onRoad = true } = {}) {
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
  e.oscB.frequency.setTargetAtTime(base * 1.008, t, 0.045);
  e.filter.frequency.setTargetAtTime(500 + revs * 2100 + (kart.boost ? 900 : 0), t, 0.05);

  const load = kart.spinTime > 0 ? 0.06 : 0.05 + Math.min(0.16, frac * 0.18);
  e.out.gain.setTargetAtTime(audio.muted ? 0 : load, t, 0.08);

  
  
  
  const scrub = Math.min(1, Math.abs(kart.slip ?? 0) / 0.6);
  const noiseLevel = (onRoad ? 0.012 : 0.075) + scrub * 0.05;
  e.noiseGain.gain.setTargetAtTime(audio.muted ? 0 : noiseLevel, t, 0.09);
  e.noiseFilter.frequency.setTargetAtTime(700 + frac * 2200, t, 0.1);
}

export function stopEngine(audio) {
  const e = audio.engine;
  if (!e) return;
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
