





import { audio } from '../audio/unlock.js';
import { sfxSheet } from '../audio/sheets.js';

















export const CHICK_CALL = {
  
  idle:   { f0: 340, to: 260, dur: 0.16, gain: 0.16, q: 9 },
  alert:  { f0: 520, to: 980, dur: 0.34, gain: 0.42, q: 13 },
  windup: { f0: 300, to: 210, dur: 0.26, gain: 0.26, q: 8 },
  strike: { f0: 900, to: 1500, dur: 0.20, gain: 0.55, q: 16 },
  hurt:   { f0: 760, to: 300, dur: 0.38, gain: 0.50, q: 11 },
  die:    { f0: 430, to: 120, dur: 0.75, gain: 0.55, q: 7 },
};






























export const SHEET_VOICE = {
  chicken: {
    idle: 'chickIdle', alert: 'chickAlert', windup: 'chickAlert', strike: 'chickAttack', hurt: 'chickAlert', die: 'chickAttack',
  },
  porker: {
    idle: 'porkerIdle', alert: 'porkerAlert', windup: 'porkerAlert', strike: 'porkerAttack', hurt: 'porkerAlert', die: 'porkerAttack',
  },
  cow: {
    idle: 'cowIdle', alert: 'cowIdle', windup: 'cowIdle', strike: 'cowAttack', hurt: 'cowIdle', die: 'cowAttack',
  },
  horse: {
    idle: 'horseCry', alert: 'horseCry', windup: 'horseCry', strike: 'horseCry', hurt: 'horseCry', die: 'horseCry',
  },
};

export function sheetVoice(beast, kind) {
  const table = SHEET_VOICE[beast && beast.kind] || SHEET_VOICE.chicken;
  const effect = table[kind];
  if (!effect) return false;
  const out = audio.at(beast.x, beast.z);
  if (!out) return false;
  
  
  
  const seed = typeof beast.voice === 'number' ? beast.voice : 1;
  return sfxSheet.play(effect, {
    dest: out, gain: 0.95, rate: 0.92 + (seed - 0.78) * 0.30,
  });
}

export function chickVoice(bird, kind, dist) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  if (sheetVoice(bird, kind)) return;
  const spec = CHICK_CALL[kind];
  if (!spec) return;
  
  
  
  
  
  
  
  
  const out = audio.at(bird.x, bird.z);
  if (!out) return;
  const near = 1;
  const t = ctx.currentTime + 0.01;
  const v = bird.voice;
  const dur = spec.dur * (2 - v) * 0.9;

  
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(spec.f0 * v * 0.55, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, spec.to * v * 0.55), t + dur);

  
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.Q.value = spec.q;
  f1.frequency.setValueAtTime(spec.f0 * v, t);
  f1.frequency.exponentialRampToValueAtTime(Math.max(60, spec.to * v), t + dur);
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.Q.value = spec.q * 0.6;
  f2.frequency.setValueAtTime(spec.f0 * v * 2.4, t);
  f2.frequency.exponentialRampToValueAtTime(Math.max(120, spec.to * v * 2.1), t + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(spec.gain * near * near, t + dur * 0.14);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.05);
}





export const PORK_CALL = {
  idle:   { f0: 130, to: 96, dur: 0.34, gain: 0.22, squeal: 0.0 },
  alert:  { f0: 180, to: 420, dur: 0.62, gain: 0.46, squeal: 1.0 },
  windup: { f0: 150, to: 108, dur: 0.50, gain: 0.34, squeal: 0.2 },
  strike: { f0: 300, to: 780, dur: 0.34, gain: 0.60, squeal: 1.2 },
  hurt:   { f0: 480, to: 190, dur: 0.55, gain: 0.58, squeal: 1.4 },
  die:    { f0: 260, to: 62, dur: 1.10, gain: 0.58, squeal: 0.6 },
};

export function porkVoice(beast, kind, dist) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  if (sheetVoice(beast, kind)) return;
  const spec = PORK_CALL[kind];
  if (!spec) return;
  const out = audio.at(beast.x, beast.z);
  if (!out) return;
  const near = 1;
  const t = ctx.currentTime + 0.01;
  void dist;
  const v = beast.voice;
  const dur = spec.dur * (2 - v) * 0.9;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(spec.gain * near * near, t + dur * 0.10);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const air = ctx.createGain();
  air.connect(g); g.connect(out);

  
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(spec.f0 * v * 0.5, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, spec.to * v * 0.5), t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 4;
  o.connect(lp); lp.connect(air);
  o.start(t); o.stop(t + dur + 0.05);

  
  if (spec.squeal > 0) {
    const sq = ctx.createOscillator();
    sq.type = 'sawtooth';
    sq.frequency.setValueAtTime(spec.f0 * v * 3.1, t);
    sq.frequency.exponentialRampToValueAtTime(Math.max(80, spec.to * v * 3.6), t + dur * 0.8);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500 * v; bp.Q.value = 7;
    const sg = ctx.createGain();
    sg.gain.value = 0.34 * spec.squeal;
    sq.connect(bp); bp.connect(sg); sg.connect(air);
    sq.start(t); sq.stop(t + dur + 0.05);
  }
}
