









import { audio } from './unlock.js';
import { gunSfx, sfxSheet } from './sheets.js';

export function sparkSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;

  
  
  
  
  
  
  
  
  
  if (sfxSheet.play('spark', {
    dest: out, gain: 0.85, rate: 0.90 + Math.random() * 0.24,
  })) return;
  const t = ctx.currentTime + 0.01;
  
  
  
  for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k += 1) {
    const at = t + k * (0.03 + Math.random() * 0.07);
    const b = ctx.createBuffer(1, 1024, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = ctx.createBufferSource(); n.buffer = b;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16 + Math.random() * 0.12, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    n.connect(hp); hp.connect(g); g.connect(out);
    n.start(at); n.stop(at + 0.06);
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'square'; o.frequency.value = 3200 + Math.random() * 2600;
    og.gain.setValueAtTime(0.05, at);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    o.connect(og); og.connect(out); o.start(at); o.stop(at + 0.05);
  }
}












export function creakSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  
  
  
  
  {
    const out = audio.at(x, z);
    if (out && sfxSheet.play('creak', {
      dest: out, gain: 0.7, rate: 0.85 + Math.random() * 0.3,
    })) return;
  }
  const out = audio.at(x, z);
  if (!out) return;
  const t = ctx.currentTime + 0.02;
  const dur = 1.4 + Math.random() * 2.0;
  const base = 52 + Math.random() * 70;

  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(base, t);
  o.frequency.linearRampToValueAtTime(base * (1.1 + Math.random() * 0.5), t + dur);

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(base * 7, t);
  bp.frequency.linearRampToValueAtTime(base * 11, t + dur);
  bp.Q.value = 14;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  
  
  let at = t;
  while (at < t + dur) {
    const stepLen = 0.045 + Math.random() * 0.16;
    g.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.10, at + stepLen * 0.35);
    g.gain.exponentialRampToValueAtTime(0.004, at + stepLen);
    at += stepLen;
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);

  o.connect(bp); bp.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.3);
}












export function settleSfx(x, z) {
  const out = audio.at(x, z);
  if (!out) return false;
  return !!sfxSheet.play('settle', {
    dest: out, gain: 0.34, rate: 0.9 + Math.random() * 0.2,
  });
}




export function hideSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;
  const thump = ctx.createOscillator(); const tg = ctx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(180, t);
  thump.frequency.exponentialRampToValueAtTime(48, t + 0.13);
  tg.gain.setValueAtTime(0.4, t);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  thump.connect(tg); tg.connect(audio.sfxBus); thump.start(t); thump.stop(t + 0.25);

  const at = t + 0.16;
  const b = ctx.createBuffer(1, 512, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  n.start(at); n.stop(at + 0.06);
}






export function doorSfx(opening) {
  
  
  
  
  
  if (sfxSheet.play(opening ? 'doorOpen' : 'doorClose', {
    gain: 0.8, rate: 0.94 + Math.random() * 0.12,
  })) return;
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;

  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
  og.gain.setValueAtTime(0.26, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(og); og.connect(audio.sfxBus); o.start(t); o.stop(t + 0.18);

  
  
  const dur = 1.15;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) {
    const u = i / d.length;
    d[i] = (Math.random() * 2 - 1) * Math.sin(u * Math.PI) * 0.8;
  }
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(opening ? 380 : 900, t + 0.05);
  bp.frequency.linearRampToValueAtTime(opening ? 900 : 340, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t + 0.05);
  g.gain.linearRampToValueAtTime(0.14, t + 0.2);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  n.start(t + 0.05); n.stop(t + dur + 0.05);
}







export let liftVoice = null;

export function liftHum(on) {
  const ctx = audio.ensure();
  if (!ctx) return;
  if (!on) {
    if (liftVoice) {
      liftVoice.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5);
      const dying = liftVoice;
      setTimeout(() => { try { dying.stop(); } catch {  } }, 2000);
      liftVoice = null;
    }
    return;
  }
  if (liftVoice) return;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  g.connect(audio.musicBus);
  const stops = [];

  
  
  
  
  
  const drone = sfxSheet.play('liftLoop', {
    loop: true, dest: g, gain: 0.9, rate: 0.94 + Math.random() * 0.1,
  });
  if (drone) {
    stops.push(() => drone.stop(0.1));
  } else {
    
    
    
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 46;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 190; lp.Q.value = 3;
    const wob = ctx.createOscillator(); const wg = ctx.createGain();
    wob.frequency.value = 2.7; wg.gain.value = 5;
    wob.connect(wg); wg.connect(o.frequency);
    o.connect(lp); lp.connect(g);
    o.start(); wob.start();
    stops.push(() => { try { o.stop(); wob.stop(); } catch {  } });
  }

  
  
  
  
  for (const [hz, lvl] of [[196, 0.05], [294, 0.035], [392, 0.022]]) {
    const v = ctx.createOscillator(); const vg = ctx.createGain();
    v.type = 'sine'; v.frequency.value = hz; vg.gain.value = lvl;
    v.connect(vg); vg.connect(g); v.start();
    stops.push(() => { try { v.stop(); } catch {  } });
  }
  g.gain.setTargetAtTime(0.55, ctx.currentTime, 0.6);
  liftVoice = { gain: g, stop() { for (const s of stops) s(); } };
}









export let tone = null;































export const TONE_BED = 0.08;

export const TONE_SAFE = 0.016;

export function startRecordedTone() {
  const h = sfxSheet.play('roomTone', {
    loop: true, gain: TONE_BED, rate: 0.97 + Math.random() * 0.06,
  });
  if (!h) return false;
  tone = {
    recorded: true,
    setLevel(quiet) {
      if (!audio.ctx) return;
      h.gain.gain.setTargetAtTime(quiet ? TONE_SAFE : TONE_BED, audio.ctx.currentTime, 0.8);
    },
    stop() { h.stop(1.0); },
  };
  return true;
}

export function roomTone() {
  const ctx = audio.ensure();
  if (!ctx || tone) return;
  if (startRecordedTone()) return;

  
  
  
  
  

  
  
  const n = Math.floor(ctx.sampleRate * 8);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  
  
  
  let last = 0;
  for (let i = 0; i < n; i += 1) {
    last = (last + (Math.random() * 2 - 1) * 0.09) * 0.985;
    d[i] = last;
  }
  
  
  const fade = Math.floor(ctx.sampleRate * 0.25);
  for (let i = 0; i < fade; i += 1) {
    const k = i / fade;
    d[i] = d[i] * k + d[n - fade + i] * (1 - k);
  }

  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.7;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.055;                 
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 140;
  lfo.connect(lfoGain); lfoGain.connect(lp.frequency);

  const g = ctx.createGain(); g.gain.value = 0.0001;
  src.connect(lp); lp.connect(g); g.connect(audio.sfxBus);
  src.start(); lfo.start();
  g.gain.setTargetAtTime(0.5, ctx.currentTime, 2.5);   

  
  const hum = ctx.createOscillator(); const hg = ctx.createGain();
  hum.type = 'sine'; hum.frequency.value = 38;
  hg.gain.value = 0.0001;
  hum.connect(hg); hg.connect(audio.sfxBus); hum.start();
  hg.gain.setTargetAtTime(0.10, ctx.currentTime, 3.5);

  tone = {
    recorded: false,
    setLevel(quiet) {
      if (!audio.ctx) return;
      g.gain.setTargetAtTime(quiet ? 0.10 : 0.5, audio.ctx.currentTime, 0.8);
      hg.gain.setTargetAtTime(quiet ? 0.02 : 0.10, audio.ctx.currentTime, 0.8);
    },
    stop() {
      if (!audio.ctx) return;
      g.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.6);
      hg.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.6);
      setTimeout(() => {
        try { src.stop(); lfo.stop(); hum.stop(); } catch {  }
      }, 2500);
    },
  };

  
  
  
  
  
  
  
  
  
  
  
  
  let upTries = 60;
  const up = setInterval(() => {
    upTries -= 1;
    if (!tone || tone.recorded || upTries <= 0) { clearInterval(up); return; }
    if (!sfxSheet.ready) return;
    const synth = tone;
    tone = null;
    if (!startRecordedTone()) { tone = synth; return; }
    synth.stop();
    clearInterval(up);
  }, 1000);
}








export function roomToneLevel(quiet) {
  if (tone) tone.setLevel(quiet);
}












export function breathSfx(hard) {
  
  
  
  
  
  
  
  if (sfxSheet.play('breath', {
    gain: hard ? 0.38 : 0.2, rate: (hard ? 1.02 : 0.9) + Math.random() * 0.08,
  })) return;
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;
  const dur = hard ? 0.34 : 0.5;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) {
    
    const u = i / d.length;
    d[i] = (Math.random() * 2 - 1) * Math.sin(u * Math.PI) ** 1.4;
  }
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = hard ? 620 : 420;
  bp.Q.value = 1.1;
  const g = ctx.createGain();
  g.gain.value = hard ? 0.16 : 0.075;
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  n.start(t); n.stop(t + dur + 0.05);
}




export function meatSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;
  
  
  if (sfxSheet.play('meat', {
    dest: out, gain: 0.85, rate: 0.92 + Math.random() * 0.18,
  })) return;
  const t = ctx.currentTime + 0.005;

  const b = ctx.createBuffer(1, 2600, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) {
    const u = i / d.length;
    d[i] = (Math.random() * 2 - 1) * (1 - u) ** 3;
  }
  const n = ctx.createBufferSource(); n.buffer = b;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.42, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  n.connect(lp); lp.connect(g); g.connect(out);
  n.start(t); n.stop(t + 0.16);

  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(64, t + 0.09);
  og.gain.setValueAtTime(0.26, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.17);
}







































export const FLOOR_SURFACE = Object.freeze({ stock: 'straw', processing: 'wet', dark: 'grate' });

const SURFACE_SET = Object.freeze({
  deck: { heel: 'heelDeck', toe: 'toeDeck' },
  grate: { heel: 'heelGrate', toe: 'toeGrate' },
  wet: { heel: 'heelWet', toe: 'toeWet' },
  straw: { heel: 'heelStraw', toe: 'toeStraw' },
});

export function footSfx(x, z, running, surface = 'deck') {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const set = SURFACE_SET[surface] || SURFACE_SET.deck;
  const rate = (running ? 0.94 : 1.0) * (0.94 + Math.random() * 0.12);
  if (sfxSheet.play(set.heel, {
    dest: out,
    gain: (running ? 1.0 : 0.62) * (0.9 + Math.random() * 0.2),
    rate,
  })) {
    sfxSheet.play(set.toe, {
      dest: out,
      when: running ? 0.055 : 0.085,
      gain: (running ? 0.62 : 0.4) * (0.9 + Math.random() * 0.2),
      rate: rate * (0.97 + Math.random() * 0.06),
    });
    return;
  }
  const t = ctx.currentTime + 0.005;
  const v = 0.9 + Math.random() * 0.25;
  const hard = running ? 1.5 : 1;

  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150 * v, t);
  o.frequency.exponentialRampToValueAtTime(52 * v, t + 0.075);
  og.gain.setValueAtTime(0.22 * hard, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.16);

  const r = ctx.createOscillator(); const rg = ctx.createGain();
  r.type = 'triangle';
  r.frequency.value = (running ? 320 : 260) * v;
  rg.gain.setValueAtTime(0.09 * hard, t + 0.004);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  r.connect(rg); rg.connect(out); r.start(t); r.stop(t + 0.11);

  const b = ctx.createBuffer(1, 1600, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const n = ctx.createBufferSource(); n.buffer = b;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1900;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.085 / hard, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.08);
}






























export function shotSfx() {
  
  
  
  if (sfxSheet.play('shot', { gain: 1.0, rate: 0.97 + Math.random() * 0.06 })) { gunSfx.shots += 1; gunSfx.fromSheet += 1; return; }
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.005;

  
  
  const cd = 0.05;
  const cb = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * cd)), ctx.sampleRate);
  const cdat = cb.getChannelData(0);
  for (let i = 0; i < cdat.length; i += 1) {
    const u = i / cdat.length;
    cdat[i] = (Math.random() * 2 - 1) * (1 - u) ** 2.2;
  }
  const cn = ctx.createBufferSource(); cn.buffer = cb;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 1300; hp.Q.value = 0.7;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.42, t);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + cd);
  cn.connect(hp); hp.connect(cg); cg.connect(audio.sfxBus);
  cn.start(t); cn.stop(t + cd + 0.01);

  
  
  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.07);
  og.gain.setValueAtTime(0.3, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 900;
  o.connect(lp); lp.connect(og); og.connect(audio.sfxBus);
  o.start(t); o.stop(t + 0.13);

  
  
  const hd = 0.34;
  const hb = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * hd)), ctx.sampleRate);
  const hdat = hb.getChannelData(0);
  for (let i = 0; i < hdat.length; i += 1) hdat[i] = Math.random() * 2 - 1;
  const hn = ctx.createBufferSource(); hn.buffer = hb;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(4200, t + 0.02);
  bp.frequency.exponentialRampToValueAtTime(1500, t + hd);
  const hg = ctx.createGain();
  hg.gain.setValueAtTime(0.0001, t + 0.015);
  hg.gain.linearRampToValueAtTime(0.13, t + 0.045);
  hg.gain.exponentialRampToValueAtTime(0.0001, t + hd);
  hn.connect(bp); bp.connect(hg); hg.connect(audio.sfxBus);
  hn.start(t + 0.015); hn.stop(t + hd + 0.02);

  
  
  const r = ctx.createOscillator(); const rg = ctx.createGain();
  r.type = 'triangle';
  r.frequency.setValueAtTime(1720 + Math.random() * 90, t + 0.02);
  rg.gain.setValueAtTime(0.055, t + 0.02);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  r.connect(rg); rg.connect(audio.sfxBus);
  r.start(t + 0.02); r.stop(t + 0.32);
  gunSfx.shots += 1;
}







export function dryClickSfx() {
  
  if (sfxSheet.play('dryClick', { gain: 0.8, rate: 0.96 + Math.random() * 0.09 })) { gunSfx.dry += 1; gunSfx.fromSheet += 1; return; }
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.005;
  for (const [at, gain] of [[0, 0.16], [0.055, 0.1]]) {
    const d = 0.02;
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * d)), ctx.sampleRate);
    const dat = b.getChannelData(0);
    for (let i = 0; i < dat.length; i += 1) {
      dat[i] = (Math.random() * 2 - 1) * (1 - i / dat.length) ** 3;
    }
    const n = ctx.createBufferSource(); n.buffer = b;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
    n.connect(hp); hp.connect(g); g.connect(audio.sfxBus);
    n.start(t + at); n.stop(t + at + d + 0.01);
  }
  gunSfx.dry += 1;
}




















export function ricochetSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;

  
  
  if (sfxSheet.play('ricochet', {
    dest: out, gain: 0.55, rate: 0.95 + Math.random() * 0.5,
  })) return;

  const t = ctx.currentTime + 0.004;
  
  const d = 0.03;
  const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * d)), ctx.sampleRate);
  const dat = b.getChannelData(0);
  for (let i = 0; i < dat.length; i += 1) dat[i] = (Math.random() * 2 - 1) * (1 - i / dat.length) ** 2;
  const n = ctx.createBufferSource(); n.buffer = b;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.30, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(hp); hp.connect(g); g.connect(out);
  n.start(t); n.stop(t + d + 0.01);

  
  
  
  const base = 1900 + Math.random() * 1500;
  for (const [mult, gain, dur] of [[1, 0.085, 0.16], [2.41, 0.05, 0.12]]) {
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(base * mult, t);
    
    o.frequency.exponentialRampToValueAtTime(base * mult * 0.88, t + dur);
    og.gain.setValueAtTime(gain, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og); og.connect(out);
    o.start(t); o.stop(t + dur + 0.02);
  }
}

export function hitSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.005;
  const b = ctx.createBuffer(1, 2048, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const n = ctx.createBufferSource(); n.buffer = b;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  n.connect(lp); lp.connect(g); g.connect(audio.sfxBus);
  n.start(t); n.stop(t + 0.18);
}

export function kickSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  
  
  
  
  
  
  
  if (sfxSheet.play('kick', { gain: 1.0, rate: 0.94 + Math.random() * 0.12 })) return;
  const t = ctx.currentTime + 0.01;
  
  
  const b = ctx.createBuffer(1, 2048, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 1.1;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus); n.start(t); n.stop(t + 0.16);

  
  
  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(1250, t + 0.07);
  o.frequency.exponentialRampToValueAtTime(300, t + 0.42);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
  o.connect(og); og.connect(hp); hp.connect(audio.sfxBus);
  o.start(t); o.stop(t + 0.5);
}

export function liftChime() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.05;
  
  
  [392.0, 493.9, 587.3, 880.0].forEach((f, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const at = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.1);
    o.connect(g); g.connect(audio.musicBus); o.start(at); o.stop(at + 2.2);
  });
}
