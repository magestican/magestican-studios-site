// UT-style announcer -- a formant speech synthesiser.
//
// We ship no audio assets (GAME_DESIGN.md: "no feature may require a
// download"), and `speechSynthesis` sounds like a satnav, not an arena
// shooter. So this synthesises the voice: a glottal buzz + a noise source
// pushed through three swept bandpass "formant" filters, which is how vowels
// are actually distinguished. Consonants are noise bursts through a fourth
// filter. Words are hand-transcribed to phonemes in PHRASES below.
//
// The arena-announcer character comes from what's wrapped around it:
//   * low pitch (~86 Hz) with a falling contour -- authority
//   * three detuned glottal voices + a sub octave -- weight
//   * a waveshaper drive -- growl
//   * band-limited 180 Hz-3.6 kHz -- sounds like a PA horn, not a synth
//   * a long reverb tail -- an arena, not a room
//
// Phoneme set is ARPAbet-ish. Formant values are the standard adult-male
// measurements (Peterson & Barney-style); they are what makes IY read as
// "ee" and UW as "oo", so don't round them off.

// [F1, F2, F3, kind, seconds, amplitude]
//   kind: 'v' voiced (vowels, glides)  'n' nasal  'f' fricative (noise)
//         'p' plosive (silence then a burst)  'vp' voiced plosive  '.' pause
const PH = {
  //        F1    F2    F3   kind  dur    amp
  AA:     [ 730, 1090, 2440, 'v', 0.150, 1.00],   // f_a_ther
  AE:     [ 660, 1720, 2410, 'v', 0.150, 1.00],   // c_a_t
  AH:     [ 640, 1190, 2390, 'v', 0.120, 0.95],   // b_u_t
  AO:     [ 570,  840, 2410, 'v', 0.150, 1.00],   // th_ou_ght
  EH:     [ 530, 1840, 2480, 'v', 0.135, 1.00],   // b_e_t
  IH:     [ 390, 1990, 2550, 'v', 0.110, 0.95],   // b_i_t
  IY:     [ 270, 2290, 3010, 'v', 0.150, 0.95],   // b_ea_t
  OW:     [ 490,  910, 2450, 'v', 0.150, 1.00],   // b_oa_t
  UW:     [ 300,  870, 2240, 'v', 0.140, 0.95],   // b_oo_t
  ER:     [ 490, 1350, 1690, 'v', 0.150, 1.00],   // b_ir_d
  // Diphthongs: the glide IS the identity, so each carries a second target.
  EY:     [ 530, 1840, 2480, 'v', 0.170, 1.00, [ 350, 2100, 2750]],  // s_ay_
  AY:     [ 730, 1090, 2440, 'v', 0.190, 1.00, [ 330, 2100, 2800]],  // f_igh_t
  AW:     [ 730, 1090, 2440, 'v', 0.180, 1.00, [ 330,  900, 2300]],  // n_ow_
  // Nasals + liquids + glides
  M:      [ 250, 1100, 2100, 'n', 0.075, 0.60],
  N:      [ 250, 1700, 2600, 'n', 0.070, 0.60],
  NG:     [ 250, 1400, 2300, 'n', 0.085, 0.55],
  L:      [ 400, 1200, 2600, 'v', 0.080, 0.75],
  R:      [ 350, 1050, 1600, 'v', 0.080, 0.80],
  W:      [ 300,  850, 2200, 'v', 0.070, 0.70],
  Y:      [ 300, 2200, 3000, 'v', 0.060, 0.70],
  // Fricatives (noise). F2 doubles as the noise band centre.
  S:      [   0, 6000,    0, 'f', 0.110, 0.55],
  SH:     [   0, 2600,    0, 'f', 0.115, 0.60],
  F:      [   0, 4200,    0, 'f', 0.100, 0.40],
  TH:     [   0, 6500,    0, 'f', 0.090, 0.30],
  HH:     [   0, 1600,    0, 'f', 0.070, 0.30],
  V:      [ 350, 4000,    0, 'f', 0.075, 0.35],
  Z:      [ 300, 5200,    0, 'f', 0.095, 0.45],
  // Plosives: a beat of closure, then a burst at F2.
  P:      [   0,  900,    0, 'p', 0.075, 0.50],
  T:      [   0, 4000,    0, 'p', 0.070, 0.60],
  K:      [   0, 2000,    0, 'p', 0.080, 0.65],
  B:      [ 300,  900,    0, 'vp', 0.070, 0.50],
  D:      [ 300, 3000,    0, 'vp', 0.065, 0.55],
  G:      [ 300, 1800,    0, 'vp', 0.075, 0.55],
  JH:     [ 300, 2400,    0, 'vp', 0.100, 0.55],
  CH:     [   0, 2800,    0, 'p', 0.105, 0.60],
  '.':    [   0,    0,    0, '.', 0.075, 0.00],   // word gap
};

// The announcement bank. `text` is what the HUD banner shows.
export const PHRASES = {
  FIRST_BLOOD:  { text: 'FIRST BLOOD',  ph: 'F ER S T . B L AH D' },
  DOUBLE_KILL:  { text: 'DOUBLE KILL',  ph: 'D AH B AH L . K IH L' },
  MULTI_KILL:   { text: 'MULTI KILL',   ph: 'M AH L T IY . K IH L' },
  ULTRA_KILL:   { text: 'ULTRA KILL',   ph: 'AH L T R AH . K IH L' },
  MONSTER_KILL: { text: 'MONSTER KILL', ph: 'M AA N S T ER . K IH L' },
  KILLING_SPREE:{ text: 'KILLING SPREE',ph: 'K IH L IH NG . S P R IY' },
  RAMPAGE:      { text: 'RAMPAGE',      ph: 'R AE M P EY JH' },
  DOMINATING:   { text: 'DOMINATING',   ph: 'D AA M IH N EY T IH NG' },
  UNSTOPPABLE:  { text: 'UNSTOPPABLE',  ph: 'AH N S T AA P AH B AH L' },
  GODLIKE:      { text: 'GODLIKE',      ph: 'G AA D L AY K' },
  HUMILIATION:  { text: 'HUMILIATION',  ph: 'HH Y UW M IH L IY EY SH AH N' },
  PREPARE:      { text: 'PREPARE TO FIGHT', ph: 'P R IY P EH R . T UW . F AY T' },
  FIGHT:        { text: 'FIGHT!',       ph: 'F AY T' },
  REVENGE:      { text: 'REVENGE',      ph: 'R IY V EH N JH' },
  DENIED:       { text: 'DENIED',       ph: 'D IH N AY D' },
};

// Pure helper (unit-tested): expand a phrase into timed phoneme slots.
export function planPhrase(key, rate = 1) {
  const phrase = PHRASES[key];
  if (!phrase) return null;
  const slots = [];
  let t = 0;
  for (const name of phrase.ph.split(' ')) {
    const p = PH[name];
    if (!p) throw new Error(`unknown phoneme "${name}" in phrase ${key}`);
    const dur = p[4] / rate;
    slots.push({ name, start: t, dur, f1: p[0], f2: p[1], f3: p[2],
                 kind: p[3], amp: p[5], glide: p[6] || null });
    t += dur;
  }
  return { text: phrase.text, slots, total: t };
}

// -- synthesis --------------------------------------------------------------

// `deps` is injected by sfx.js so this module owns no AudioContext of its own:
//   { ctx, dest, verbSend, noiseBuffer(dur) }
export function speakInto(deps, key, opts = {}) {
  const { ctx, dest, verbSend } = deps;
  const plan = planPhrase(key, opts.rate || 1);
  if (!plan) return 0;
  const t0 = ctx.currentTime + 0.03;
  const pitch = opts.pitch || 86;
  const vol = opts.volume == null ? 1 : opts.volume;

  // --- output chain: drive -> PA band-limit -> dry + reverb send ----------
  const bus = ctx.createGain();
  bus.gain.value = 0.9 * vol;

  const drive = ctx.createWaveShaper();
  drive.curve = driveCurve(2.4);
  drive.oversample = '2x';

  const paLo = ctx.createBiquadFilter();
  paLo.type = 'highpass'; paLo.frequency.value = 180;
  const paHi = ctx.createBiquadFilter();
  paHi.type = 'lowpass'; paHi.frequency.value = 3600;
  // A presence bump so consonants cut through gunfire.
  const presence = ctx.createBiquadFilter();
  presence.type = 'peaking'; presence.frequency.value = 2200;
  presence.Q.value = 1.2; presence.gain.value = 6;

  bus.connect(drive).connect(paLo).connect(paHi).connect(presence);
  presence.connect(dest);
  if (verbSend) {
    const send = ctx.createGain();
    send.gain.value = 0.5;
    presence.connect(send).connect(verbSend);
  }

  // --- sources ------------------------------------------------------------
  const voiced = ctx.createGain(); voiced.gain.value = 0;
  const noisy  = ctx.createGain(); noisy.gain.value = 0;

  // Three detuned saws + a sub sine = a chest, not a beep.
  const oscs = [];
  for (const detune of [-7, 0, +7]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.detune.value = detune;
    contourPitch(o.frequency, t0, plan.total, pitch);
    const g = ctx.createGain(); g.gain.value = detune === 0 ? 0.5 : 0.28;
    o.connect(g).connect(voiced);
    oscs.push(o);
  }
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  contourPitch(sub.frequency, t0, plan.total, pitch / 2);
  const subG = ctx.createGain(); subG.gain.value = 0.45;
  sub.connect(subG).connect(voiced);
  oscs.push(sub);

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = deps.noiseBuffer(plan.total + 0.3);
  noiseSrc.connect(noisy);

  // --- formant filters ----------------------------------------------------
  // Three parallel bandpasses carry the voiced path; a fourth, wider one
  // carries fricative/plosive noise.
  const F = [];
  for (let i = 0; i < 3; i++) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = [9, 11, 13][i];
    bp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = [1.0, 0.7, 0.35][i];
    voiced.connect(bp).connect(g).connect(bus);
    F.push(bp);
  }
  const nBp = ctx.createBiquadFilter();
  nBp.type = 'bandpass'; nBp.Q.value = 1.6; nBp.frequency.value = 3000;
  noisy.connect(nBp).connect(bus);

  // --- automate the phoneme timeline --------------------------------------
  const vg = voiced.gain, ng = noisy.gain;
  vg.setValueAtTime(0, t0);
  ng.setValueAtTime(0, t0);
  for (const f of F) f.frequency.setValueAtTime(f.frequency.value, t0);
  nBp.frequency.setValueAtTime(3000, t0);

  for (const s of plan.slots) {
    const a = t0 + s.start;
    const b = a + s.dur;
    const voicedKind = s.kind === 'v' || s.kind === 'n' || s.kind === 'vp';

    if (s.f1) {
      // Formants GLIDE into place: a step change buzzes, a ramp speaks.
      const targets = [s.f1, s.f2, s.f3];
      for (let i = 0; i < 3; i++) {
        if (!targets[i]) continue;
        F[i].frequency.linearRampToValueAtTime(targets[i], a + Math.min(0.045, s.dur * 0.5));
        if (s.glide && s.glide[i]) {
          F[i].frequency.linearRampToValueAtTime(s.glide[i], b);
        }
      }
    }

    if (voicedKind) {
      const peak = 0.36 * s.amp;
      vg.linearRampToValueAtTime(peak, a + Math.min(0.03, s.dur * 0.4));
      vg.linearRampToValueAtTime(peak * 0.85, b);
      // Voiced plosives get a noise burst on top of the voicing.
      if (s.kind === 'vp') burst(ng, nBp, a, s, 0.5);
      else ng.linearRampToValueAtTime(0, a + 0.02);
    } else if (s.kind === 'f') {
      vg.linearRampToValueAtTime(s.name === 'V' || s.name === 'Z' ? 0.10 : 0.0, a + 0.02);
      nBp.frequency.setValueAtTime(s.f2, a);
      nBp.Q.setValueAtTime(s.name === 'S' || s.name === 'Z' ? 2.6 : 1.4, a);
      ng.linearRampToValueAtTime(0.30 * s.amp, a + 0.02);
      ng.linearRampToValueAtTime(0.02, b);
    } else if (s.kind === 'p') {
      // Closure (silence), then the burst.
      vg.linearRampToValueAtTime(0, a + 0.01);
      ng.linearRampToValueAtTime(0, a + 0.01);
      burst(ng, nBp, a + s.dur * 0.55, s, 1.0);
    } else {
      vg.linearRampToValueAtTime(0, a + 0.02);
      ng.linearRampToValueAtTime(0, a + 0.02);
    }
  }
  const end = t0 + plan.total;
  vg.linearRampToValueAtTime(0, end + 0.06);
  ng.linearRampToValueAtTime(0, end + 0.06);

  for (const o of oscs) { o.start(t0); o.stop(end + 0.25); }
  noiseSrc.start(t0); noiseSrc.stop(end + 0.25);
  return plan.total;
}

function burst(ng, nBp, at, s, scale) {
  nBp.frequency.setValueAtTime(s.f2, at);
  nBp.Q.setValueAtTime(1.1, at);
  ng.setValueAtTime(0, at);
  ng.linearRampToValueAtTime(0.55 * s.amp * scale, at + 0.006);
  ng.exponentialRampToValueAtTime(0.001, at + 0.045);
  ng.linearRampToValueAtTime(0, at + 0.05);
}

// Falling pitch = authority. Rises slightly into the first syllable so it
// lands rather than fades in.
function contourPitch(param, t0, total, base) {
  param.setValueAtTime(base * 1.04, t0);
  param.linearRampToValueAtTime(base * 1.10, t0 + total * 0.18);
  param.linearRampToValueAtTime(base * 0.86, t0 + total);
}

function driveCurve(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}
