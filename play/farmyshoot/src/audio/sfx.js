






























import { speakInto, PHRASES } from './announcerVoice.js';

import { WEAPON_LEVEL } from '../../../../web-engine/audio/weaponSfxSpec.js';
import { voiceGain } from '../../../../web-engine/audio/animalVoice.js';

let _ctx = null;
let _master = null;
let _voice = null;        
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
    _master.gain.value = SFX_LEVEL;
    
    
    _limiter = _ctx.createDynamicsCompressor();
    _limiter.threshold.value = -8;
    _limiter.knee.value = 6;
    _limiter.ratio.value = 12;
    _limiter.attack.value = 0.002;
    _limiter.release.value = 0.15;
    _master.connect(_limiter).connect(_ctx.destination);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    _voice = _ctx.createGain();
    _voice.gain.value = 1.0;
    _voice.connect(_limiter);
    
    
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














export function sfxBus({ create = false } = {}) {
  
  
  
  
  
  
  
  if (create) ensureCtx();
  return { ctx: _ctx, master: _master };
}

export function setSfxMuted(muted) {
  _muted = () => muted;
  _sfxDuckUntil = 0;
  if (_master) _master.gain.value = muted ? 0 : SFX_LEVEL;
  if (_voice) _voice.gain.value = muted ? 0 : 1.0;
}


const SFX_LEVEL = 0.55;




const SFX_DUCK_DEPTH = 0.45;
let _sfxDuckUntil = 0;
let _sfxDuckTimer = null;




export function duckSfx(seconds = 1.1) {
  if (!_ctx || !_master || _muted()) return;
  _sfxDuckUntil = Math.max(_sfxDuckUntil, Date.now() + (Number(seconds) || 0) * 1000 + 260);
  _master.gain.setTargetAtTime(SFX_LEVEL * SFX_DUCK_DEPTH, _ctx.currentTime, 0.04);
  clearTimeout(_sfxDuckTimer);
  _sfxDuckTimer = setTimeout(() => {
    _sfxDuckUntil = 0;
    if (_master && _ctx && !_muted()) {
      _master.gain.setTargetAtTime(SFX_LEVEL, _ctx.currentTime, 0.12);
    }
  }, Math.max(0, _sfxDuckUntil - Date.now()));
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
  
  
  
  
  
  
  
  
  const snap = whiteNoise(ctx, 0.012);
  const sf = ctx.createBiquadFilter();
  sf.type = 'bandpass'; sf.frequency.value = 2600; sf.Q.value = 1.2;
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.95, t);
  sg.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
  snap.connect(sf).connect(sg).connect(_master);
  snap.start(t); snap.stop(t + 0.016);

  const noise = whiteNoise(ctx, 0.10);
  const gain = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(1500, t);
  filt.frequency.exponentialRampToValueAtTime(420, t + 0.09);
  gain.gain.setValueAtTime(1.45, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  noise.connect(filt).connect(gain).connect(_master);
  noise.start(t); noise.stop(t + 0.12);
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







































function shotBus(ctx, sound) {
  const out = ctx.createGain();
  out.gain.value = 1;
  const air = ctx.createBiquadFilter();
  air.type = 'lowpass';
  air.frequency.value = sound.cutoffHz;
  air.Q.value = 0.7;
  out.connect(air).connect(_master);
  const send = ctx.createGain();
  send.gain.value = sound.wet;
  air.connect(send).connect(_verbSend);
  return out;
}



function transient(ctx, t, out, { gain = 0.5, hz = 3800 } = {}) {
  const n = whiteNoise(ctx, 0.006);
  const f = ctx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = hz;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.006);
  n.connect(f).connect(g).connect(out);
  n.start(t); n.stop(t + 0.008);
}





export function weaponFire(id, sound = null) {
  const s = sound || {
    pitch: 1, loudness: 1, cutoffHz: 18000, wet: 0.10, timeJitter: 0, audible: true,
  };
  if (s.audible === false || s.loudness <= 0.004) return;
  switch (id) {
    case 'shotgun': return shotgunBlast(s);
    case 'rocket':  return rocketLaunch(s);
    case 'shovel':
    default:        return shovelFling(s);
  }
}



export function shovelFling(sound = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const { pitch = 1, timeJitter = 0 } = sound;
  const loudness = (sound.loudness ?? 1) * WEAPON_LEVEL;
  const t = ctx.currentTime;
  const out = shotBus(ctx, { cutoffHz: 18000, wet: 0.10, ...sound });

  
  
  transient(ctx, t, out, { gain: 0.55 * loudness, hz: 4200 });

  
  const flick = whiteNoise(ctx, 0.07);
  const ff = ctx.createBiquadFilter();
  ff.type = 'bandpass';
  ff.frequency.setValueAtTime(1400 * pitch, t);
  ff.frequency.exponentialRampToValueAtTime(420 * pitch, t + 0.07);
  ff.Q.value = 2.2;
  const fg = ctx.createGain();
  fg.gain.setValueAtTime(0.62 * loudness, t);
  fg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  flick.connect(ff).connect(fg).connect(out);
  flick.start(t); flick.stop(t + 0.09);

  
  
  const clangs = [[1180, 0.22, 0], [1790, 0.14, 0.004 + timeJitter]];
  for (const [f, a, at] of clangs) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * pitch, t + at);
    o.frequency.exponentialRampToValueAtTime(f * pitch * 0.86, t + at + 0.12);
    g.gain.setValueAtTime(a * loudness, t + at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + at + 0.14);
    o.connect(g).connect(out);
    o.start(t + at); o.stop(t + at + 0.16);
  }

  
  
  
  
  
  
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(520 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(150 * pitch, t + 0.09);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.30 * loudness, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.18);

  
  
  
  
  
  
  
  
  const thud = whiteNoise(ctx, 0.22);
  const tf = ctx.createBiquadFilter();
  tf.type = 'lowpass';
  tf.frequency.setValueAtTime(900 * pitch, t);
  tf.frequency.exponentialRampToValueAtTime(180 * pitch, t + 0.20);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0, t);
  tg.gain.linearRampToValueAtTime(0.52 * loudness, t + 0.012);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
  thud.connect(tf).connect(tg).connect(out);
  thud.start(t); thud.stop(t + 0.24);
}


export function shotgunBlast(sound = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const { pitch = 1, timeJitter = 0 } = sound;
  const loudness = (sound.loudness ?? 1) * WEAPON_LEVEL;
  const t = ctx.currentTime;
  const out = shotBus(ctx, { cutoffHz: 18000, wet: 0.22, ...sound });

  transient(ctx, t, out, { gain: 0.70 * loudness, hz: 5000 });

  const crack = whiteNoise(ctx, 0.04);
  const cf = ctx.createBiquadFilter();
  cf.type = 'highpass'; cf.frequency.value = 2400 * pitch;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.80 * loudness, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  crack.connect(cf).connect(cg).connect(out);
  crack.start(t); crack.stop(t + 0.05);

  const thump = ctx.createOscillator();
  const tg = ctx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(180 * pitch, t);
  thump.frequency.exponentialRampToValueAtTime(46 * pitch, t + 0.22);
  tg.gain.setValueAtTime(0, t);
  tg.gain.linearRampToValueAtTime(0.62 * loudness, t + 0.008);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  thump.connect(tg).connect(out);
  thump.start(t); thump.stop(t + 0.3);

  const body = whiteNoise(ctx, 0.35);
  const bf = ctx.createBiquadFilter();
  bf.type = 'lowpass';
  bf.frequency.setValueAtTime(5200 * pitch, t);
  bf.frequency.exponentialRampToValueAtTime(420 * pitch, t + 0.26);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0.50 * loudness, t + 0.004);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
  body.connect(bf).connect(bg).connect(out);
  body.start(t); body.stop(t + 0.35);

  
  
  
  for (const [at, f] of [[0.26 + timeJitter, 2100], [0.36 + timeJitter * 2, 1500]]) {
    const n = whiteNoise(ctx, 0.05);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = f * pitch; nf.Q.value = 4;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.16 * loudness, t + at);
    ng.gain.exponentialRampToValueAtTime(0.001, t + at + 0.05);
    n.connect(nf).connect(ng).connect(out);
    n.start(t + at); n.stop(t + at + 0.06);
  }
}


export function rocketLaunch(sound = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const { pitch = 1, timeJitter = 0 } = sound;
  const loudness = (sound.loudness ?? 1) * WEAPON_LEVEL;
  const t = ctx.currentTime;
  const out = shotBus(ctx, { cutoffHz: 18000, wet: 0.25, ...sound });

  transient(ctx, t, out, { gain: 0.42 * loudness, hz: 3200 });

  const ig = ctx.createOscillator();
  const igg = ctx.createGain();
  ig.type = 'sine';
  ig.frequency.setValueAtTime(150 * pitch, t);
  ig.frequency.exponentialRampToValueAtTime(40 * pitch, t + 0.3);
  igg.gain.setValueAtTime(0, t);
  igg.gain.linearRampToValueAtTime(0.55 * loudness, t + 0.01);
  igg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  ig.connect(igg).connect(out);
  ig.start(t); ig.stop(t + 0.4);

  const jet = whiteNoise(ctx, 0.9);
  const jf = ctx.createBiquadFilter();
  jf.type = 'bandpass';
  jf.frequency.setValueAtTime(300 * pitch, t);
  jf.frequency.exponentialRampToValueAtTime(2400 * pitch, t + 0.55);
  jf.Q.value = 1.1;
  const jg = ctx.createGain();
  jg.gain.setValueAtTime(0, t);
  jg.gain.linearRampToValueAtTime(0.45 * loudness, t + 0.05);
  jg.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  jet.connect(jf).connect(jg).connect(out);
  jet.start(t); jet.stop(t + 0.9);

  
  
  
  const dop = ctx.createOscillator();
  const dg = ctx.createGain();
  dop.type = 'sawtooth';
  dop.frequency.setValueAtTime(420 * pitch, t + 0.02);
  dop.frequency.exponentialRampToValueAtTime(120 * pitch, t + 0.5);
  dg.gain.setValueAtTime(0, t + 0.02);
  dg.gain.linearRampToValueAtTime(0.10 * loudness, t + 0.06);
  dg.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  dop.connect(dg).connect(out);
  dop.start(t + 0.02); dop.stop(t + 0.6);

  const clank = whiteNoise(ctx, 0.04);
  const kf = ctx.createBiquadFilter();
  kf.type = 'bandpass'; kf.frequency.value = 900 * pitch; kf.Q.value = 5;
  const kg = ctx.createGain();
  kg.gain.setValueAtTime(0.22 * loudness, t + Math.max(0, timeJitter));
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  clank.connect(kf).connect(kg).connect(out);
  clank.start(t); clank.stop(t + 0.06);
}


export function hitmarker({ loudness = 1.0 } = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  
  
  
  
  for (const [f, at, a] of [[2100, 0, 0.95], [3150, 0.035, 0.62]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t + at);
    g.gain.setValueAtTime(a * loudness, t + at);
    g.gain.exponentialRampToValueAtTime(0.001, t + at + 0.06);
    o.connect(g).connect(_master);
    o.start(t + at); o.stop(t + at + 0.07);
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





let _ducker = null;
export function setMusicDucker(fn) { _ducker = typeof fn === 'function' ? fn : null; }









const ANNOUNCE_VOLUME = 2.2;

export function announce(key, opts = {}) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return 0;
  if (!PHRASES[key]) return 0;
  const now = ctx.currentTime;
  
  if (_announceFreeAt - now > 1.6) return 0;
  const wait = Math.max(0, _announceFreeAt - now);
  const fire = () => speakInto(
    { ctx, dest: _voice ?? _master, verbSend: _verbSend, noiseBuffer: (d) => noiseBuffer(ctx, d) },
    key, { volume: ANNOUNCE_VOLUME, ...opts },
  );
  let dur;
  if (wait < 0.01) {
    dur = fire();
  } else {
    dur = 0.9;   
    setTimeout(fire, wait * 1000);
  }
  _announceFreeAt = Math.max(now, _announceFreeAt) + dur + 0.28;
  
  
  if (_ducker) { try { _ducker(wait + dur); } catch (_) {} }
  
  
  duckSfx(wait + dur);
  return dur;
}


export function announcer(text = '') {
  return announce(text === 'STEAK ANIHILATION' ? 'HUMILIATION' : 'FIGHT');
}
























export function explosion(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;

  
  
  
  explode({ loudness: 1.3 * loudness, size: 1.5, distance: 0 });

  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(_master);
  
  const send = ctx.createGain();
  send.gain.value = 0.75;
  out.connect(send).connect(_verbSend);

  
  
  const rum = ctx.createOscillator();
  const rg = ctx.createGain();
  rum.type = 'sine';
  rum.frequency.setValueAtTime(58, t);
  rum.frequency.exponentialRampToValueAtTime(19, t + 2.2);
  rg.gain.setValueAtTime(0.0001, t);
  rg.gain.exponentialRampToValueAtTime(0.70 * loudness, t + 0.12);
  rg.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
  rum.connect(rg).connect(out);
  rum.start(t); rum.stop(t + 2.5);

  
  
  const roar = whiteNoise(ctx, 2.2);
  const rf = ctx.createBiquadFilter();
  rf.type = 'lowpass';
  rf.frequency.setValueAtTime(900, t);
  rf.frequency.exponentialRampToValueAtTime(120, t + 1.8);
  const rog = ctx.createGain();
  rog.gain.setValueAtTime(0, t);
  rog.gain.linearRampToValueAtTime(0.34 * loudness, t + 0.15);
  rog.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
  roar.connect(rf).connect(rog).connect(out);
  roar.start(t); roar.stop(t + 2.2);

  
  for (let i = 0; i < 14; i++) {
    const at = t + 0.25 + Math.random() * 1.3;
    const g = whiteNoise(ctx, 0.06);
    const gf = ctx.createBiquadFilter();
    gf.type = 'bandpass';
    gf.frequency.value = 500 + Math.random() * 2400;
    gf.Q.value = 3.5;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0.16 * loudness * (0.3 + Math.random() * 0.7), at);
    gg.gain.exponentialRampToValueAtTime(0.001, at + 0.07);
    g.connect(gf).connect(gg).connect(out);
    g.start(at); g.stop(at + 0.08);
  }
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



























function _formant(ctx, src, f, f2, q, gain, t0, dur, dest) {
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(f, t0);
  if (f2 && f2 !== f) bp.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(dest);
  return g;
}


function _voiceSource(ctx, t0, dur, f0, f1, peak, vibHz, vibDepth) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
  if (vibHz) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = vibHz; lg.gain.value = vibDepth;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t0); lfo.stop(t0 + dur + 0.05);
  }
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(peak, t0 + dur * 0.14);
  amp.gain.setValueAtTime(peak, t0 + dur * 0.55);
  amp.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  osc.connect(amp);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
  return amp;
}

function _wetSend(ctx, amount) {
  const g = ctx.createGain();
  g.gain.value = amount;
  if (_verbSend) g.connect(_verbSend);
  return g;
}




export function moo(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime, dur = 1.15;
  const src = _voiceSource(ctx, t, dur, 138, 96, 0.42 * loudness, 5.5, 3);
  const out = ctx.createGain(); out.gain.value = 1;
  _formant(ctx, src, 320, 620, 7, 1.00, t, dur, out);      
  _formant(ctx, src, 780, 1010, 9, 0.55, t, dur, out);     
  _formant(ctx, src, 2400, 2400, 14, 0.12, t, dur, out);   
  out.connect(_master);
  out.connect(_wetSend(ctx, 0.35 * loudness));
}




export function oink(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;
  const grunts = [[0, 0.20, 260, 150, 0.40], [0.26, 0.15, 225, 130, 0.32]];
  for (const [start, dur, f0, f1, amp] of grunts) {
    const t = t0 + start;
    const src = _voiceSource(ctx, t, dur, f0, f1, amp * loudness, 22, 12);
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx, dur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.10 * loudness, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(ng);
    n.start(t); n.stop(t + dur + 0.02);
    const out = ctx.createGain(); out.gain.value = 1;
    for (const s of [src, ng]) {
      _formant(ctx, s, 520, 700, 5, 1.00, t, dur, out);
      _formant(ctx, s, 1180, 950, 6, 0.60, t, dur, out);
    }
    out.connect(_master);
    out.connect(_wetSend(ctx, 0.22 * loudness));
  }
}



export function bheee(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime, dur = 0.85;
  const src = _voiceSource(ctx, t, dur, 430, 360, 0.34 * loudness, 8.5, 26);
  const trem = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  lfo.type = 'sine'; lfo.frequency.value = 8.5; lg.gain.value = 0.45;
  trem.gain.value = 0.55;
  lfo.connect(lg).connect(trem.gain);
  lfo.start(t); lfo.stop(t + dur + 0.05);
  src.connect(trem);
  const out = ctx.createGain(); out.gain.value = 1;
  _formant(ctx, trem, 650, 700, 8, 1.00, t, dur, out);     
  _formant(ctx, trem, 1900, 1750, 10, 0.70, t, dur, out);  
  _formant(ctx, trem, 2900, 2900, 12, 0.20, t, dur, out);
  out.connect(_master);
  out.connect(_wetSend(ctx, 0.28 * loudness));
}




export function cluck(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;
  [0, 0.13, 0.26].forEach((start, i) => {
    const t = t0 + start, dur = 0.07;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx, dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.30 * loudness, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(g);
    n.start(t); n.stop(t + dur + 0.02);
    const out = ctx.createGain(); out.gain.value = 1;
    _formant(ctx, g, 900 + i * 120, 1500 + i * 150, 4, 1.0, t, dur, out);
    _formant(ctx, g, 2200, 2600, 6, 0.5, t, dur, out);
    out.connect(_master);
  });
  const t = t0 + 0.40, dur = 0.30;
  const src = _voiceSource(ctx, t, dur, 620, 900, 0.30 * loudness, 30, 40);
  const out = ctx.createGain(); out.gain.value = 1;
  _formant(ctx, src, 1100, 2100, 5, 1.00, t, dur, out);
  _formant(ctx, src, 2600, 3200, 7, 0.55, t, dur, out);
  out.connect(_master);
  out.connect(_wetSend(ctx, 0.25 * loudness));
}









export function quack(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;
  const barks = [[0, 0.14, 420, 300, 0.34], [0.19, 0.11, 380, 250, 0.26]];
  for (const [start, dur, f0, f1, amp] of barks) {
    const t = t0 + start;
    const src = _voiceSource(ctx, t, dur, f0, f1, amp * loudness, 34, 30);
    const out = ctx.createGain(); out.gain.value = 1;
    _formant(ctx, src, 950, 780, 4, 1.00, t, dur, out);      
    _formant(ctx, src, 2150, 1900, 7, 0.55, t, dur, out);
    _formant(ctx, src, 3300, 3100, 9, 0.18, t, dur, out);
    out.connect(_master);
    out.connect(_wetSend(ctx, 0.22 * loudness));
  }
}






export function bleat(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime, dur = 0.55;
  const src = _voiceSource(ctx, t, dur, 540, 420, 0.32 * loudness, 15, 34);
  const trem = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  lfo.type = 'sine'; lfo.frequency.value = 15; lg.gain.value = 0.55;
  trem.gain.value = 0.45;
  lfo.connect(lg).connect(trem.gain);
  lfo.start(t); lfo.stop(t + dur + 0.05);
  src.connect(trem);
  const out = ctx.createGain(); out.gain.value = 1;
  _formant(ctx, trem, 820, 900, 7, 1.00, t, dur, out);       
  _formant(ctx, trem, 2050, 1900, 9, 0.60, t, dur, out);     
  _formant(ctx, trem, 3050, 3050, 12, 0.20, t, dur, out);
  out.connect(_master);
  out.connect(_wetSend(ctx, 0.26 * loudness));
}








export function bray(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;

  
  const d1 = 0.30;
  const hee = _voiceSource(ctx, t0, d1, 210, 330, 0.30 * loudness, 26, 16);
  const o1 = ctx.createGain(); o1.gain.value = 1;
  _formant(ctx, hee, 1150, 1400, 8, 1.00, t0, d1, o1);
  _formant(ctx, hee, 2500, 2700, 10, 0.45, t0, d1, o1);
  o1.connect(_master);
  o1.connect(_wetSend(ctx, 0.24 * loudness));

  
  
  const t1 = t0 + 0.32, d2 = 0.62;
  const haw = _voiceSource(ctx, t1, d2, 300, 96, 0.40 * loudness, 30, 26);
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx, d2);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.09 * loudness, t1);
  ng.gain.exponentialRampToValueAtTime(0.001, t1 + d2);
  n.connect(ng);
  n.start(t1); n.stop(t1 + d2 + 0.02);
  const o2 = ctx.createGain(); o2.gain.value = 1;
  for (const s of [haw, ng]) {
    _formant(ctx, s, 620, 480, 6, 1.00, t1, d2, o2);
    _formant(ctx, s, 1500, 1150, 8, 0.50, t1, d2, o2);
  }
  o2.connect(_master);
  o2.connect(_wetSend(ctx, 0.30 * loudness));
}










export function honk(loudness = 1.0) {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t0 = ctx.currentTime;
  const honks = [[0, 0.20, 330, 250, 0.38], [0.27, 0.17, 300, 220, 0.30]];
  for (const [start, dur, f0, f1, amp] of honks) {
    const t = t0 + start;
    const src = _voiceSource(ctx, t, dur, f0, f1, amp * loudness, 19, 14);
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx, 0.05);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.14 * loudness, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(ng);
    n.start(t); n.stop(t + 0.07);
    const out = ctx.createGain(); out.gain.value = 1;
    for (const s of [src, ng]) _formant(ctx, s, 1120, 980, 5, 1.00, t, dur, out);
    _formant(ctx, src, 2400, 2200, 8, 0.45, t, dur, out);
    _formant(ctx, src, 3600, 3400, 10, 0.15, t, dur, out);
    out.connect(_master);
    out.connect(_wetSend(ctx, 0.20 * loudness));
  }
}


export function animalVoice(character, loudness = 1.0) {
  
  
  
  
  
  const g = voiceGain(character, loudness);
  switch (character) {
    case 'cow':     return moo(g);
    case 'pig':     return oink(g);
    case 'sheep':   return bheee(g);
    case 'chicken': return cluck(g);
    case 'goat':    return bleat(g);
    case 'duck':    return quack(g);
    case 'donkey':  return bray(g);
    case 'goose':   return honk(g);
    
    
    
    
    
    
    default:        return moo(g);
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



























export function wormSummon() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(_master);

  
  
  for (const [mul, det] of [[1, 0], [1.5, 7], [2.01, -11]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.detune.value = det;
    o.frequency.setValueAtTime(190 * mul, t);
    o.frequency.exponentialRampToValueAtTime(34 * mul, t + 1.05);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + 1.1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.30, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
    o.connect(lp).connect(g).connect(out);
    o.start(t); o.stop(t + 1.3);
  }

  
  
  const n = whiteNoise(ctx, 1.2);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(1500, t);
  bp.frequency.exponentialRampToValueAtTime(180, t + 0.9);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(0.5, t + 0.08);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  n.connect(bp).connect(ng).connect(out);
  n.start(t); n.stop(t + 1.2);

  
  
  duckSfx(1.2);
}










export function wormShot() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.34;
  out.connect(_master);

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(72, t + 0.16);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(3200, t);
  lp.frequency.exponentialRampToValueAtTime(600, t + 0.18);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.42, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  o.connect(lp).connect(g).connect(out);
  o.start(t); o.stop(t + 0.22);

  const n = whiteNoise(ctx, 0.12);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 900;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.30, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  n.connect(hp).connect(ng).connect(out);
  n.start(t); n.stop(t + 0.12);
}








export function wormEarned() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.55;
  out.connect(_master);
  
  
  [[0, 330], [0.10, 392], [0.20, 494]].forEach(([dt, hz]) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(hz, t + dt);
    g.gain.setValueAtTime(0, t + dt);
    g.gain.linearRampToValueAtTime(0.26, t + dt + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.22);
    o.connect(g).connect(out);
    o.start(t + dt); o.stop(t + dt + 0.24);
  });
}


export function deny() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(180, t);
  o.frequency.setValueAtTime(120, t + 0.06);
  g.gain.setValueAtTime(0.10, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g).connect(_master);
  o.start(t); o.stop(t + 0.13);
}













export function haySpring() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.7;
  out.connect(_master);

  
  
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(520, t + 0.13);
  o.frequency.exponentialRampToValueAtTime(300, t + 0.30);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.34, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.36);

  
  
  const n = whiteNoise(ctx, 0.22);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3200;
  bp.Q.value = 0.6;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.22, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  n.connect(bp).connect(ng).connect(out);
  n.start(t); n.stop(t + 0.22);
}









export function crateBreak() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.6;
  out.connect(_master);

  
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.10);
  g.gain.setValueAtTime(0.30, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.16);

  
  
  const n = whiteNoise(ctx, 0.26);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(1100, t);
  bp.frequency.exponentialRampToValueAtTime(2800, t + 0.16);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(0.34, t + 0.006);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
  n.connect(bp).connect(ng).connect(out);
  n.start(t); n.stop(t + 0.26);
}









export function wormSwallow() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.85;
  out.connect(_master);

  
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(420, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.13);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2600, t);
  lp.frequency.exponentialRampToValueAtTime(320, t + 0.16);
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  o.connect(lp).connect(g).connect(out);
  o.start(t); o.stop(t + 0.22);

  
  
  const n = whiteNoise(ctx, 0.18);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(900, t);
  bp.frequency.exponentialRampToValueAtTime(180, t + 0.15);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.34, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  n.connect(bp).connect(ng).connect(out);
  n.start(t); n.stop(t + 0.19);
}








export function thunderStrike() {
  const ctx = ensureCtx(); if (!ctx || _muted()) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 1.0;
  out.connect(_master);

  
  const crack = whiteNoise(ctx, 0.20);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(2400, t);
  hp.frequency.exponentialRampToValueAtTime(600, t + 0.18);
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0, t);
  cg.gain.linearRampToValueAtTime(0.85, t + 0.004);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  crack.connect(hp).connect(cg).connect(out);
  crack.start(t); crack.stop(t + 0.22);

  
  
  const roll = whiteNoise(ctx, 1.6);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.exponentialRampToValueAtTime(120, t + 1.5);
  const rg = ctx.createGain();
  rg.gain.setValueAtTime(0, t);
  rg.gain.linearRampToValueAtTime(0.55, t + 0.06);
  rg.gain.exponentialRampToValueAtTime(0.001, t + 1.55);
  
  const wob = ctx.createOscillator();
  const wobGain = ctx.createGain();
  wob.frequency.value = 5.5;
  wobGain.gain.value = 0.16;
  wob.connect(wobGain).connect(rg.gain);
  wob.start(t); wob.stop(t + 1.6);
  roll.connect(lp).connect(rg).connect(out);
  roll.start(t); roll.stop(t + 1.6);

  duckSfx(1.4);
}
