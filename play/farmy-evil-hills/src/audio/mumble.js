









import { compileMumble, seedOf } from '../../../../web-engine/horror/mumble.js';
import { audio } from './unlock.js';
import { sfxSheet } from './sheets.js';
















export const FORMANTS = {
  oh: [[500, 860], [0.95, 0.5]],
  no: [[400, 1100], [1.0, 0.55]],
  ah: [[730, 1150], [1.0, 0.6]],
  sob: [[430, 1250], [0.7, 0.45]],
};














export let mumbleStop = null;

export let lastMumbleKey = null;

export let mumbleCount = 0;

export function mumbleSay(text) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return 0;
  if (mumbleStop) { mumbleStop(); mumbleStop = null; }
  const { events, total } = compileMumble(text, seedOf(text));
  const t0 = ctx.currentTime + 0.03;
  const out = ctx.createGain();
  
  
  
  out.gain.value = 0.34;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 2600;
  out.connect(lp); lp.connect(audio.sfxBus);
  const nodes = [];
  for (const e of events) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(e.f0, t0 + e.at);
    
    
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, e.f0 * 0.94), t0 + e.at + e.dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0 + e.at);
    env.gain.linearRampToValueAtTime(e.amp, t0 + e.at + 0.018);
    env.gain.setValueAtTime(e.amp, t0 + e.at + e.dur * 0.7);
    env.gain.linearRampToValueAtTime(0.0001, t0 + e.at + e.dur);
    
    
    osc.connect(env);
    for (const [freq, q, gn] of [[e.f1, 8, 1.0], [e.f2, 10, 0.5]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const bg = ctx.createGain(); bg.gain.value = gn;
      env.connect(bp); bp.connect(bg); bg.connect(out);
    }
    
    if (e.burst) {
      const nb = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, Math.floor(0.02 * ctx.sampleRate), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      nb.buffer = buf;
      const ng = ctx.createGain(); ng.gain.value = 0.35 * e.amp;
      const nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 1200;
      nb.connect(nf); nf.connect(ng); ng.connect(out);
      nb.start(t0 + e.at); nb.stop(t0 + e.at + 0.02);
      nodes.push(nb);
    }
    osc.start(t0 + e.at);
    osc.stop(t0 + e.at + e.dur + 0.01);
    nodes.push(osc);
  }
  mumbleCount += 1;
  mumbleStop = () => {
    for (const n of nodes) { try { n.stop(); } catch {  } }
    try { out.gain.setValueAtTime(0, ctx.currentTime); } catch {  }
  };
  return total;
}

export function paVoice(kind) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (sfxSheet.play('tannoy', { gain: 0.8, rate: 0.94 + Math.random() * 0.12 })) return;
  const [freqs, amps] = FORMANTS[kind] || FORMANTS.oh;
  const t0 = ctx.currentTime + 0.03;
  const dur = kind === 'sob' ? 0.42 : 1.1 + Math.random() * 0.8;

  const speaker = ctx.createBiquadFilter();
  speaker.type = 'bandpass'; speaker.frequency.value = 1500; speaker.Q.value = 0.7;
  const crunch = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 2.6); }
  crunch.curve = curve;
  const out = ctx.createGain(); out.gain.value = 0.5;
  speaker.connect(crunch); crunch.connect(out); out.connect(audio.sfxBus);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = 115 + Math.random() * 95;
  osc.frequency.setValueAtTime(base * 1.15, t0);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, t0 + dur);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(0.45, t0 + (kind === 'sob' ? 0.05 : 0.2));
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  freqs.forEach((f, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 8;
    const g = ctx.createGain(); g.gain.value = amps[i];
    amp.connect(bp); bp.connect(g); g.connect(speaker);
  });
  osc.start(t0); osc.stop(t0 + dur + 0.12);

  for (const at of [t0 - 0.02, t0 + dur + 0.03]) {
    const c = ctx.createOscillator(); const cg = ctx.createGain();
    c.frequency.value = 1900;
    cg.gain.setValueAtTime(0.05, at);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    c.connect(cg); cg.connect(audio.sfxBus); c.start(at); c.stop(at + 0.05);
  }
}

export const PA_KINDS = ['oh', 'no', 'ah', 'sob', 'sob'];




export const mumbleState = {
  get stop() { return mumbleStop; },
  set stop(v) { mumbleStop = v; },
  get lastKey() { return lastMumbleKey; },
  set lastKey(v) { lastMumbleKey = v; },
  get count() { return mumbleCount; },
};
