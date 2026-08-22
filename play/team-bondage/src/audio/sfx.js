






























import { speakInto, PHRASES } from './announcerVoice.js';

let _ctx = null;
let _master = null;
let _limiter = null;
let _verb = null;
let _verbSend = null;
let _muted = () => localStorage.getItem('tb.muted') === '1';

function ensureCtx() {
  if (!_ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _ctx = new Ctx();
    _master = _ctx.createGain();
    _master.gain.value = 0.55;
    
    
    _limiter = _ctx.createDynamicsCompressor();
    _limiter.threshold.value = -8;
    _limiter.knee.value = 6;
    _limiter.ratio.value = 12;
    _limiter.attack.value = 0.002;
    _limiter.release.value = 0.15;
    _master.connect(_limiter).connect(_ctx.destination);
    
    
    _verb = _ctx.createConvolver();
    _verb.buffer = impulseResponse(_ctx, 1.9, 2.6);
    _verbSend = _ctx.createGain();
    _verbSend.gain.value = 1.0;
    const verbOut = _ctx.createGain();
    verbOut.gain.value = 0.55;
    _verbSend.connect(_verb).connect(verbOut).connect(_limiter);
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

export function setSfxMuted(muted) {
  _muted = () => muted;
  if (_master) _master.gain.value = muted ? 0 : 0.55;
}



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









export function explode({ loudness = 1.0, distance = 0, size = 1.0 } = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const dist = Math.max(0, distance);
  const level = loudness / (1 + dist * 0.10);
  if (level < 0.02) return;
  
  const airCut = Math.max(700, 16000 / (1 + dist * 0.55));

  const out = ctx.createGain();
  const air = ctx.createBiquadFilter();
  air.type = 'lowpass'; air.frequency.value = airCut;
  out.connect(air).connect(_master);
  
  const send = ctx.createGain();
  send.gain.value = 0.30 + Math.min(0.35, dist * 0.02);
  air.connect(send).connect(_verbSend);

  
  const crack = whiteNoise(ctx, 0.05);
  const cf = ctx.createBiquadFilter();
  cf.type = 'highpass'; cf.frequency.value = 1800;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.85 * level, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  crack.connect(cf).connect(cg).connect(out);
  crack.start(t); crack.stop(t + 0.06);

  
  const sub = ctx.createOscillator();
  const sg = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(130 * size, t);
  sub.frequency.exponentialRampToValueAtTime(24, t + 0.75 * size);
  sg.gain.setValueAtTime(0, t);
  sg.gain.linearRampToValueAtTime(0.75 * level, t + 0.012);
  sg.gain.exponentialRampToValueAtTime(0.001, t + 0.85 * size);
  sub.connect(sg).connect(out);
  sub.start(t); sub.stop(t + 0.9 * size);

  
  const sub2 = ctx.createOscillator();
  const s2g = ctx.createGain();
  sub2.type = 'triangle';
  sub2.frequency.setValueAtTime(210 * size, t);
  sub2.frequency.exponentialRampToValueAtTime(52, t + 0.45);
  s2g.gain.setValueAtTime(0.32 * level, t + 0.004);
  s2g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  sub2.connect(s2g).connect(out);
  sub2.start(t); sub2.stop(t + 0.55);

  
  const body = whiteNoise(ctx, 1.0 * size);
  const bf = ctx.createBiquadFilter();
  bf.type = 'lowpass';
  bf.frequency.setValueAtTime(2600, t);
  bf.frequency.exponentialRampToValueAtTime(180, t + 0.7 * size);
  bf.Q.value = 1.4;
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, t);
  bg.gain.linearRampToValueAtTime(0.60 * level, t + 0.02);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.85 * size);
  body.connect(bf).connect(bg).connect(out);
  body.start(t); body.stop(t + 1.0 * size);

  
  const grains = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < grains; i++) {
    const at = t + 0.09 + Math.random() * 0.45;
    const g = whiteNoise(ctx, 0.05);
    const gf = ctx.createBiquadFilter();
    gf.type = 'bandpass';
    gf.frequency.value = 700 + Math.random() * 2600;
    gf.Q.value = 3;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0.20 * level * (0.4 + Math.random() * 0.6), at);
    gg.gain.exponentialRampToValueAtTime(0.001, at + 0.06);
    g.connect(gf).connect(gg).connect(out);
    g.start(at); g.stop(at + 0.07);
  }
}


export function boom(loudness = 1.0) {
  explode({ loudness, size: 0.85 });
}




export function weaponFire(id, opts = {}) {
  switch (id) {
    case 'shotgun': return shotgunBlast(opts);
    case 'rocket':  return rocketLaunch(opts);
    case 'shovel':
    default:        return shovelFling(opts);
  }
}



export function shovelFling({ loudness = 1.0 } = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  
  const flick = whiteNoise(ctx, 0.07);
  const ff = ctx.createBiquadFilter();
  ff.type = 'bandpass';
  ff.frequency.setValueAtTime(1400, t);
  ff.frequency.exponentialRampToValueAtTime(420, t + 0.07);
  ff.Q.value = 2.2;
  const fg = ctx.createGain();
  fg.gain.setValueAtTime(0.34 * loudness, t);
  fg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  flick.connect(ff).connect(fg).connect(_master);
  flick.start(t); flick.stop(t + 0.09);
  
  for (const [f, a] of [[1180, 0.10], [1790, 0.06]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.86, t + 0.12);
    g.gain.setValueAtTime(a * loudness, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g).connect(_master);
    o.start(t); o.stop(t + 0.16);
  }
  
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(150, t + 0.09);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.13 * loudness, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  o.connect(g).connect(_master);
  o.start(t); o.stop(t + 0.13);
}


export function shotgunBlast({ loudness = 1.0 } = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(_master);
  const send = ctx.createGain(); send.gain.value = 0.22;
  out.connect(send).connect(_verbSend);

  const crack = whiteNoise(ctx, 0.04);
  const cf = ctx.createBiquadFilter();
  cf.type = 'highpass'; cf.frequency.value = 2400;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.80 * loudness, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  crack.connect(cf).connect(cg).connect(out);
  crack.start(t); crack.stop(t + 0.05);

  const thump = ctx.createOscillator();
  const tg = ctx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(180, t);
  thump.frequency.exponentialRampToValueAtTime(46, t + 0.22);
  tg.gain.setValueAtTime(0, t);
  tg.gain.linearRampToValueAtTime(0.62 * loudness, t + 0.008);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  thump.connect(tg).connect(out);
  thump.start(t); thump.stop(t + 0.3);

  const body = whiteNoise(ctx, 0.35);
  const bf = ctx.createBiquadFilter();
  bf.type = 'lowpass';
  bf.frequency.setValueAtTime(5200, t);
  bf.frequency.exponentialRampToValueAtTime(420, t + 0.26);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0.50 * loudness, t + 0.004);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
  body.connect(bf).connect(bg).connect(out);
  body.start(t); body.stop(t + 0.35);

  
  for (const [at, f] of [[0.26, 2100], [0.36, 1500]]) {
    const n = whiteNoise(ctx, 0.05);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = f; nf.Q.value = 4;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.16 * loudness, t + at);
    ng.gain.exponentialRampToValueAtTime(0.001, t + at + 0.05);
    n.connect(nf).connect(ng).connect(_master);
    n.start(t + at); n.stop(t + at + 0.06);
  }
}


export function rocketLaunch({ loudness = 1.0 } = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(_master);
  const send = ctx.createGain(); send.gain.value = 0.25;
  out.connect(send).connect(_verbSend);

  const ig = ctx.createOscillator();
  const igg = ctx.createGain();
  ig.type = 'sine';
  ig.frequency.setValueAtTime(150, t);
  ig.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  igg.gain.setValueAtTime(0, t);
  igg.gain.linearRampToValueAtTime(0.55 * loudness, t + 0.01);
  igg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  ig.connect(igg).connect(out);
  ig.start(t); ig.stop(t + 0.4);

  const jet = whiteNoise(ctx, 0.9);
  const jf = ctx.createBiquadFilter();
  jf.type = 'bandpass';
  jf.frequency.setValueAtTime(300, t);
  jf.frequency.exponentialRampToValueAtTime(2400, t + 0.55);
  jf.Q.value = 1.1;
  const jg = ctx.createGain();
  jg.gain.setValueAtTime(0, t);
  jg.gain.linearRampToValueAtTime(0.45 * loudness, t + 0.05);
  jg.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  jet.connect(jf).connect(jg).connect(out);
  jet.start(t); jet.stop(t + 0.9);

  const clank = whiteNoise(ctx, 0.04);
  const kf = ctx.createBiquadFilter();
  kf.type = 'bandpass'; kf.frequency.value = 900; kf.Q.value = 5;
  const kg = ctx.createGain();
  kg.gain.setValueAtTime(0.22 * loudness, t);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  clank.connect(kf).connect(kg).connect(out);
  clank.start(t); clank.stop(t + 0.06);
}


export function hitmarker({ loudness = 1.0 } = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  for (const [f, at] of [[2100, 0], [3150, 0.035]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(f, t + at);
    g.gain.setValueAtTime(0.10 * loudness, t + at);
    g.gain.exponentialRampToValueAtTime(0.001, t + at + 0.05);
    o.connect(g).connect(_master);
    o.start(t + at); o.stop(t + at + 0.06);
  }
}


export function weaponSwitch() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  for (const [at, f] of [[0, 1700], [0.07, 1150]]) {
    const n = whiteNoise(ctx, 0.04);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = f; nf.Q.value = 5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.13, t + at);
    g.gain.exponentialRampToValueAtTime(0.001, t + at + 0.045);
    n.connect(nf).connect(g).connect(_master);
    n.start(t + at); n.stop(t + at + 0.05);
  }
}






let _announceFreeAt = 0;

export function announce(key, opts = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return 0;
  if (!PHRASES[key]) return 0;
  const now = ctx.currentTime;
  
  if (_announceFreeAt - now > 1.6) return 0;
  const wait = Math.max(0, _announceFreeAt - now);
  const fire = () => speakInto(
    { ctx, dest: _master, verbSend: _verbSend, noiseBuffer: (d) => noiseBuffer(ctx, d) },
    key, opts,
  );
  let dur;
  if (wait < 0.01) {
    dur = fire();
  } else {
    dur = 0.9;   
    setTimeout(fire, wait * 1000);
  }
  _announceFreeAt = Math.max(now, _announceFreeAt) + dur + 0.28;
  return dur;
}


export function announcer(text = '') {
  return announce(text === 'STEAK ANIHILATION' ? 'HUMILIATION' : 'FIGHT');
}














export function explosion(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;

  
  const crack = whiteNoise(ctx, 0.09);
  const cHP = ctx.createBiquadFilter();
  cHP.type = 'highpass'; cHP.frequency.value = 1900;
  const cG = ctx.createGain();
  cG.gain.setValueAtTime(0.95 * loudness, t);
  cG.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  crack.connect(cHP).connect(cG).connect(_master);
  crack.start(t); crack.stop(t + 0.1);

  
  const body = whiteNoise(ctx, 1.1);
  const bLP = ctx.createBiquadFilter();
  bLP.type = 'lowpass';
  bLP.frequency.setValueAtTime(4200, t);
  bLP.frequency.exponentialRampToValueAtTime(190, t + 0.95);
  bLP.Q.value = 1.1;
  const bG = ctx.createGain();
  bG.gain.setValueAtTime(0, t);
  bG.gain.linearRampToValueAtTime(0.85 * loudness, t + 0.02);
  bG.gain.exponentialRampToValueAtTime(0.001, t + 1.05);
  body.connect(bLP).connect(bG).connect(_master);
  body.start(t); body.stop(t + 1.15);

  
  const sub = ctx.createOscillator();
  const sG = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(118, t);
  sub.frequency.exponentialRampToValueAtTime(24, t + 0.85);
  sG.gain.setValueAtTime(0.9 * loudness, t + 0.01);
  sG.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
  sub.connect(sG).connect(_master);
  sub.start(t); sub.stop(t + 1.0);

  
  const tail = whiteNoise(ctx, 1.6);
  const tBP = ctx.createBiquadFilter();
  tBP.type = 'bandpass'; tBP.frequency.value = 420; tBP.Q.value = 0.7;
  const tG = ctx.createGain();
  tG.gain.setValueAtTime(0, t);
  tG.gain.linearRampToValueAtTime(0.30 * loudness, t + 0.12);
  tG.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
  tail.connect(tBP).connect(tG).connect(_master);
  tail.start(t + 0.05); tail.stop(t + 1.7);
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


export function whoosh() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  
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






export function fart(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.30);
  
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
  
  const n1 = whiteNoise(ctx, 0.06);
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 260; f1.Q.value = 3.5;
  const gn1 = ctx.createGain();
  gn1.gain.setValueAtTime(0.35 * loudness, t);
  gn1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n1.connect(f1).connect(gn1).connect(_master);
  n1.start(t); n1.stop(t + 0.08);
  
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


export function moo(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  _envOsc(ctx, 0.55, 'sawtooth', 220, 110, 0.30 * loudness);
  _envOsc(ctx, 0.55, 'sine',     110, 60,  0.20 * loudness);
}


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


export function bheee(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime, dur = 0.50;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, t);
  
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


export function animalVoice(character, loudness = 1.0) {
  switch (character) {
    case 'cow':     return moo(loudness);
    case 'pig':     return oink(loudness);
    case 'sheep':   return bheee(loudness);
    case 'chicken': return cluck(loudness);
    default:        return moo(loudness);
  }
}

function noiseBuffer(ctx, dur) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function whiteNoise(ctx, dur) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  return src;
}





function impulseResponse(ctx, seconds, decay) {
  const n = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) {
      
      
      const t = i / n;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
    
    for (const [ms, amp] of [[17, 0.35], [29, 0.22]]) {
      const off = Math.floor(ctx.sampleRate * ms / 1000);
      if (off < n) d[off] += amp;
    }
  }
  return buf;
}
