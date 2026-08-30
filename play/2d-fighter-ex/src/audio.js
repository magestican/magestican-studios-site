






























































export function hash01(n, salt = 0) {
  let x = (Math.imul(n | 0, 0x9e3779b1) ^ Math.imul((salt | 0) + 0x165667b1, 0x85ebca6b)) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x2545f491) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0x27d4eb2f) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}


const span = (index, salt, lo, hi) => lo + (hi - lo) * hash01(index, salt);


















const NOISE = (o) => ({ kind: 'noise', attack: 0.002, rate: 1, gain: 1, ...o });
const TONE = (o) => ({ kind: 'tone', attack: 0.003, wave: 'sine', gain: 1, ...o });

















export function voiceFor(event, index, { power = 1, big = false, who = 'a', text = '' } = {}) {
  const i = index | 0;
  const p = Math.max(0, Math.min(1.6, power));
  const kind = (event === 'hit' && big) ? 'bigHit' : event;

  switch (kind) {
    
    case 'hit': {
      
      
      
      
      
      
      
      
      const f0 = span(i, 1, 62, 104);
      
      
      
      
      const cut = span(i, 2, 1300, 3300);
      const noiseDur = span(i, 3, 0.045, 0.095);
      const toneDur = span(i, 4, 0.085, 0.160);
      const layers = [
        NOISE({
          dur: noiseDur,
          gain: 0.55 * (0.7 + 0.3 * p),
          
          
          
          rate: span(i, 5, 0.75, 1.40),
          filter: { type: 'lowpass', f0: cut, f1: span(i, 6, 240, 620), Q: span(i, 7, 0.7, 1.5) },
        }),
        TONE({
          dur: toneDur,
          gain: 0.85 * (0.6 + 0.4 * p),
          f0,
          
          
          
          f1: f0 * span(i, 8, 0.42, 0.58),
        }),
      ];
      
      
      
      
      
      
      
      if (hash01(i, 9) < 0.42) {
        layers.push(NOISE({
          dur: span(i, 10, 0.018, 0.035),
          gain: 0.30,
          attack: 0.001,
          rate: span(i, 11, 0.9, 1.6),
          filter: {
            type: 'bandpass', f0: span(i, 12, 2200, 4200), f1: span(i, 13, 1400, 2600), Q: 2.2,
          },
        }));
      }
      return {
        event: 'hit', dur: Math.max(noiseDur, toneDur), gain: 0.55 * (0.55 + 0.45 * p), layers,
      };
    }

    
    case 'bigHit': {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const sub = span(i, 21, 36, 52);
      const body = span(i, 22, 84, 126);
      return {
        event: 'bigHit',
        dur: span(i, 23, 0.75, 1.15),
        gain: 0.95,
        layers: [
          TONE({ dur: span(i, 24, 0.55, 0.85), gain: 1.0, f0: sub, f1: sub * 0.55, attack: 0.004 }),
          TONE({ dur: span(i, 25, 0.28, 0.44), gain: 0.6, f0: body, f1: body * 0.40 }),
          NOISE({
            dur: span(i, 26, 0.40, 0.68),
            gain: 0.7,
            attack: 0.001,
            rate: span(i, 27, 0.8, 1.2),
            filter: { type: 'lowpass', f0: span(i, 28, 2800, 4200), f1: 150, Q: 1.2 },
          }),
          NOISE({
            dur: span(i, 29, 0.75, 1.15),
            gain: 0.26,
            attack: 0.03,
            rate: 0.6,
            filter: { type: 'lowpass', f0: span(i, 30, 130, 260), f1: 90, Q: 0.9 },
          }),
        ],
      };
    }

    
    case 'swing': {
      
      
      
      
      
      
      
      
      
      const dur = span(i, 42, 0.10, 0.17);
      return {
        event: 'swing',
        dur,
        gain: 0.20 * (0.7 + 0.3 * p),
        layers: [NOISE({
          dur,
          gain: 1,
          attack: 0.02,
          rate: span(i, 43, 0.8, 1.3),
          filter: {
            type: 'bandpass',
            f0: span(i, 41, 1500, 2600),
            f1: span(i, 44, 380, 700),
            Q: span(i, 45, 1.6, 2.6),
          },
        })],
      };
    }

    
    case 'land': {
      
      
      
      
      
      const dur = span(i, 52, 0.14, 0.24);
      const f0 = span(i, 51, 48, 72);
      return {
        event: 'land',
        dur,
        gain: 0.5,
        layers: [
          TONE({ dur, gain: 1, f0, f1: f0 * span(i, 53, 0.45, 0.62) }),
          NOISE({
            dur: span(i, 54, 0.10, 0.18),
            gain: 0.34,
            rate: span(i, 55, 0.7, 1.15),
            filter: {
              type: 'lowpass', f0: span(i, 56, 900, 1500), f1: span(i, 57, 180, 320), Q: 0.8,
            },
          }),
        ],
      };
    }

    
    case 'step': {
      
      
      
      
      const dur = span(i, 61, 0.030, 0.055);
      return {
        event: 'step',
        dur,
        gain: 0.11,
        layers: [NOISE({
          dur,
          gain: 1,
          attack: 0.001,
          rate: span(i, 62, 0.7, 1.25),
          filter: {
            type: 'lowpass', f0: span(i, 63, 500, 1100), f1: span(i, 64, 150, 280), Q: 0.9,
          },
        })],
      };
    }

    
    case 'say': {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const line = String(text || '');
      const question = line.trim().endsWith('?');
      const n = Math.max(3, Math.min(9, Math.round(line.replace(/\s/g, '').length / 2.2) || 3));
      const base = who === 'b' ? span(i, 71, 300, 372) : span(i, 71, 186, 244);
      const layers = [];
      let t = 0;
      for (let k = 0; k < n; k += 1) {
        const u = n > 1 ? k / (n - 1) : 0;
        
        const contour = question ? 1 + 0.42 * u * u : 1 - 0.30 * u;
        const jitter = 0.86 + 0.28 * hash01(i * 13 + k, 41);
        const f = base * contour * jitter;
        const dur = 0.045 + 0.045 * hash01(i * 13 + k, 42);
        layers.push(TONE({
          wave: 'square',
          dur,
          delay: t,
          gain: 0.72 + 0.28 * hash01(i * 13 + k, 43),
          f0: f,
          f1: f * (0.90 + 0.06 * hash01(i * 13 + k, 44)),
          attack: 0.005,
          filter: { type: 'bandpass', Q: 5.5, f0: f * 2.6, f1: f * 1.9 },
        }));
        t += dur + 0.028 + 0.05 * hash01(i * 13 + k, 45);
      }
      return { event: 'say', dur: t, gain: 0.16, layers };
    }

    default:
      
      
      return { event: kind, dur: 0, gain: 0, layers: [] };
  }
}











export const CHARGE_DRONE = Object.freeze({
  f0: 55,
  detuneCents: 7,
  cutoffLow: 180,
  cutoffHigh: 1400,
  shimmer: 1180,
  gain: 0.30,
});























export const SWING_WINDUP = Object.freeze({
  'jab-mid': 'jab',
  'cross-mid': 'cross',
  'hook-mid': 'hook',
  'upper-mid': 'uppercut',
  'klow-mid': 'kick-low',
  'khigh-mid': 'kick-high',
  'knee-mid': 'knee',
  'finish-wind': 'finish-strike',
  
  
  
  
  'arch-mid': 'arch',
  'kbody-mid': 'kick-body',
  'round-mid': 'roundhouse',
  'spin-mid': 'spin-kick',
});



export const AIR_ATTACKS = Object.freeze(['air-punch', 'air-kick']);




export const STEP_POSES = Object.freeze(['step-in', 'step-back']);








export const SWING_POWER = Object.freeze({
  jab: 0.5,
  cross: 1,
  hook: 0.9,
  uppercut: 1,
  'kick-low': 0.8,
  'kick-high': 1,
  knee: 0.9,
  'finish-strike': 1.6,
  arch: 1,
  'kick-body': 0.9,
  roundhouse: 1,
  'spin-kick': 1,
  'air-punch': 1,
  'air-kick': 1,
});


























export function beatsFor(pose, prev = null) {
  const beats = [];
  const at = pose.index | 0;
  const last = prev || {};

  if (pose.hit) {
    const fresh = !last.hit
      || pose.hit.x !== last.hitX
      || (pose.hit.age || 0) < (last.hitAge || 0);
    if (fresh) {
      beats.push({
        event: 'hit', index: at, power: pose.hit.power || 1, big: !!pose.hit.big,
      });
    }
  }

  
  if (pose.land && (!last.land || pose.land.x !== last.landX)) {
    beats.push({ event: 'land', index: at, power: 1 });
  }

  
  
  
  
  
  
  
  
  for (const side of ['a', 'b']) {
    const spec = pose[side];
    if (!spec) continue;
    const now = spec.pose;
    const was = last[`pose_${side}`];
    if (now === was) continue;
    const seed = at + (side === 'b' ? 1 : 0);

    const strike = SWING_WINDUP[now];
    if (strike) {
      
      
      if (was !== strike) {
        beats.push({ event: 'swing', index: seed, power: SWING_POWER[strike] || 1 });
      }
    } else if (AIR_ATTACKS.includes(now)) {
      beats.push({ event: 'swing', index: seed, power: SWING_POWER[now] || 1 });
    } else if (STEP_POSES.includes(now)) {
      beats.push({ event: 'step', index: seed });
    }
  }

  
  
  const sayKey = pose.say ? `${pose.say.who}:${pose.say.text || ''}` : null;
  if (sayKey && sayKey !== last.sayKey) {
    beats.push({ event: 'say', index: at, who: pose.say.who, text: pose.say.text });
  }

  return {
    beats,
    state: {
      hit: !!pose.hit,
      hitX: pose.hit ? pose.hit.x : null,
      hitAge: pose.hit ? (pose.hit.age || 0) : 0,
      land: !!pose.land,
      landX: pose.land ? pose.land.x : null,
      pose_a: pose.a ? pose.a.pose : null,
      pose_b: pose.b ? pose.b.pose : null,
      sayKey,
      charge: pose.charge ? pose.charge.level : 0,
    },
  };
}

















const BUS = 0.42;


const STORE_KEY = 'fighter-ex-sound';

export function createAudio() {
  return {
    ctx: null,
    bus: null,
    comp: null,
    noise: null,
    drone: null,
    muted: true,
    started: false,
    silent: null,
    voices: 0,
  };
}










function noiseBuffer(audio) {
  if (audio.noise) return audio.noise;
  const { ctx } = audio;
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate)), ctx.sampleRate);
  const d = buf.getChannelData(0);
  
  
  for (let i = 0; i < d.length; i += 1) d[i] = hash01(i, 777) * 2 - 1;
  audio.noise = buf;
  return buf;
}


























function claimPlaybackSession() {
  try {
    const s = globalThis.navigator && globalThis.navigator.audioSession;
    if (s && s.type !== 'playback') s.type = 'playback';
  } catch {
    
  }
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
  return `data:audio/wav;base64,${globalThis.btoa(bin)}`;
}

export function startSilentKeepAlive(audio) {
  if (audio.silent || !globalThis.document) return;
  try {
    const el = globalThis.document.createElement('audio');
    el.loop = true;
    
    
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.volume = 0;
    el.src = silentWavDataUrl();
    el.play().catch(() => {  });
    audio.silent = el;
  } catch {  }
}

export function resumeAudio(audio) {
  claimPlaybackSession();
  if (!audio.ctx) {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return false;
    try {
      audio.ctx = new Ctx();
    } catch {
      return false;
    }
    try {
      audio.comp = audio.ctx.createDynamicsCompressor();
      audio.bus = audio.ctx.createGain();
      audio.bus.gain.value = audio.muted ? 0 : BUS;
      audio.bus.connect(audio.comp);
      audio.comp.connect(audio.ctx.destination);
    } catch {
      audio.ctx = null;
      return false;
    }
  }
  if (audio.ctx.state === 'suspended' && audio.ctx.resume) audio.ctx.resume();
  
  
  try {
    const src = audio.ctx.createBufferSource();
    src.buffer = audio.ctx.createBuffer(1, 1, audio.ctx.sampleRate);
    src.connect(audio.ctx.destination);
    src.start(0);
    
    
    
    
    src.stop(audio.ctx.currentTime + 0.02);
  } catch {  }
  startSilentKeepAlive(audio);
  audio.started = true;
  return true;
}


export function isAudible(audio) {
  return !!(audio && audio.ctx && audio.ctx.state === 'running' && !audio.muted);
}













export function setMuted(audio, muted) {
  audio.muted = !!muted;
  if (audio.bus && audio.ctx) {
    
    
    const t = audio.ctx.currentTime;
    audio.bus.gain.cancelScheduledValues(t);
    audio.bus.gain.setValueAtTime(audio.bus.gain.value, t);
    audio.bus.gain.linearRampToValueAtTime(audio.muted ? 0 : BUS, t + 0.05);
  }
  try {
    globalThis.localStorage.setItem(STORE_KEY, audio.muted ? 'off' : 'on');
  } catch {  }
}


export function preferredMuted(search = '') {
  const q = String(search);
  if (/[?&]sound=on(&|$)/.test(q)) return false;
  if (/[?&]sound=off(&|$)/.test(q)) return true;
  try {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    return globalThis.localStorage.getItem(STORE_KEY) === 'off';
  } catch {
    return false;
  }
}






export function playVoice(audio, voice, when = 0) {
  if (!audio.ctx || !audio.bus || !voice || !voice.layers || !voice.layers.length) return 0;
  
  
  
  
  
  if (audio.voices > 24) return 0;
  const { ctx } = audio;
  const tv = Math.max(ctx.currentTime, when || ctx.currentTime);
  let built = 0;

  for (const layer of voice.layers) {
    const dur = Math.max(0.005, layer.dur);
    
    
    
    
    
    const t0 = tv + (layer.delay || 0);
    const g = ctx.createGain();
    const peak = Math.max(0.0002, voice.gain * layer.gain);
    
    
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + Math.min(layer.attack, dur * 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(audio.bus);

    let filter = null;
    if (layer.filter) {
      filter = ctx.createBiquadFilter();
      filter.type = layer.filter.type;
      filter.Q.value = layer.filter.Q;
      filter.frequency.setValueAtTime(layer.filter.f0, t0);
      
      
      
      
      filter.frequency.exponentialRampToValueAtTime(Math.max(30, layer.filter.f1), t0 + dur);
      filter.connect(g);
    }
    const sink = filter || g;

    if (layer.kind === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(audio);
      if (src.playbackRate) src.playbackRate.value = layer.rate;
      src.connect(sink);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
      audio.voices += 1;
      src.onended = () => { audio.voices -= 1; };
    } else {
      const osc = ctx.createOscillator();
      osc.type = layer.wave;
      osc.frequency.setValueAtTime(layer.f0, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(12, layer.f1), t0 + dur);
      osc.connect(sink);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
      audio.voices += 1;
      osc.onended = () => { audio.voices -= 1; };
    }
    built += 1;
  }
  return built;
}


export function setCharge(audio, level) {
  if (!audio.ctx || !audio.bus) return;
  const lv = Math.max(0, Math.min(1, level || 0));
  if (!audio.drone) {
    if (lv <= 0) return;                    
    const { ctx } = audio;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(audio.bus);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = CHARGE_DRONE.cutoffLow;
    filter.Q.value = 1.4;
    filter.connect(gain);
    const oscs = [];
    for (const cents of [0, CHARGE_DRONE.detuneCents]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = CHARGE_DRONE.f0;
      if (o.detune) o.detune.value = cents;
      o.connect(filter);
      o.start();
      oscs.push(o);
    }
    
    
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = CHARGE_DRONE.shimmer;
    const sg = ctx.createGain();
    sg.gain.value = 0;
    shimmer.connect(sg);
    sg.connect(gain);
    shimmer.start();
    audio.drone = { gain, filter, oscs, shimmer, sg };
  }
  const t = audio.ctx.currentTime;
  const d = audio.drone;
  
  
  
  d.gain.gain.linearRampToValueAtTime(CHARGE_DRONE.gain * lv, t + 0.08);
  d.filter.frequency.linearRampToValueAtTime(
    CHARGE_DRONE.cutoffLow + (CHARGE_DRONE.cutoffHigh - CHARGE_DRONE.cutoffLow) * lv, t + 0.08,
  );
  
  
  
  d.sg.gain.linearRampToValueAtTime(0.05 * lv * lv, t + 0.08);
}












































const SCALE = [0, 3, 5, 7, 10];    












const MUSIC_LEVEL = 0.62;











const PROGRESSION = [0, 8, 3, 10];

const MUSIC = Object.freeze({
  feudal: { root: 55.00, bpm: 96, wave: 'triangle', arp: 0.0, drum: 'taiko', lead: 'fifth', pad: 'triangle' },
  neon: { root: 65.41, bpm: 132, wave: 'sawtooth', arp: 1.0, drum: 'machine', lead: 'saw', pad: 'sawtooth' },
  waste: { root: 49.00, bpm: 78, wave: 'square', arp: 0.35, drum: 'sparse', lead: 'detuned', pad: 'triangle' },
});


export function musicFor(world) {
  return MUSIC[world] || MUSIC.feudal;
}


function drumAt(audio, out, when, { freq, drop, dur, level, noiseLevel }) {
  const { ctx } = audio;
  const bus = out;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, when);
  osc.frequency.exponentialRampToValueAtTime(Math.max(24, freq * drop), when + dur);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(level, when + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g).connect(bus);
  osc.start(when);
  osc.stop(when + dur + 0.02);

  if (noiseLevel > 0) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(audio);
    const ng = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    ng.gain.setValueAtTime(noiseLevel, when);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.5);
    src.connect(hp).connect(ng).connect(bus);
    src.start(when);
    src.stop(when + dur);
  }
}


function noteAt(audio, out, when, freq, dur, level, type) {
  const { ctx } = audio;
  const bus = out;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(level, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(lp).connect(g).connect(bus);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}









export function createMusic(audio) {
  let world = 'feudal';
  let intensity = 0;
  let timer = null;
  let step = 0;
  let next = 0;

  const LOOKAHEAD = 0.12;
  const TICK_MS = 25;

  
  
  
  let out = null;
  function output() {
    if (!audio.ctx || !audio.bus) return null;
    if (!out) {
      out = audio.ctx.createGain();
      out.gain.value = MUSIC_LEVEL;
      out.connect(audio.bus);
    }
    return out;
  }

  function schedule() {
    if (!audio.ctx || audio.muted) return;
    const bed = output();
    if (!bed) return;
    const cfg = musicFor(world);
    const beat = 60 / cfg.bpm / 2;              
    if (next < audio.ctx.currentTime) next = audio.ctx.currentTime + 0.05;
    while (next < audio.ctx.currentTime + LOOKAHEAD) {
      const bar = Math.floor(step / 8) % 4;
      const s = step % 8;
      const lift = 0.62 + 0.38 * intensity;

      
      
      const chord = cfg.root * (2 ** (PROGRESSION[bar] / 12));

      
      if (cfg.drum === 'taiko') {
        if (s === 0 || s === 3 || s === 6) {
          drumAt(audio, bed, next, { freq: 110, drop: 0.32, dur: 0.30, level: 0.52 * lift, noiseLevel: 0.03 });
        }
        
        if (s === 2 || s === 7) {
          drumAt(audio, bed, next, { freq: 320, drop: 0.6, dur: 0.09, level: 0.10 * lift, noiseLevel: 0.10 * lift });
        }
      } else if (cfg.drum === 'machine') {
        if (s % 2 === 0) drumAt(audio, bed, next, { freq: 130, drop: 0.28, dur: 0.16, level: 0.46 * lift, noiseLevel: 0 });
        if (s === 4) drumAt(audio, bed, next, { freq: 220, drop: 0.5, dur: 0.14, level: 0.20 * lift, noiseLevel: 0.22 * lift });
        if (s % 2 === 1) drumAt(audio, bed, next, { freq: 900, drop: 0.9, dur: 0.05, level: 0.03, noiseLevel: 0.07 * lift });
      } else {
        if (s === 0 || (s === 5 && bar % 2 === 1)) {
          drumAt(audio, bed, next, { freq: 84, drop: 0.35, dur: 0.42, level: 0.48 * lift, noiseLevel: 0.05 });
        }
        if (s === 4) drumAt(audio, bed, next, { freq: 260, drop: 0.7, dur: 0.11, level: 0.09 * lift, noiseLevel: 0.13 * lift });
      }

      
      const passing = SCALE[(bar * 2 + (s === 6 ? 3 : 0)) % SCALE.length];
      const bassHz = s === 6 ? chord * (2 ** (passing / 12)) : chord;
      if (s === 0 || s === 4 || s === 6 || (cfg.arp > 0.5 && s % 2 === 0)) {
        noteAt(audio, bed, next, bassHz, beat * (cfg.arp > 0.5 ? 1.1 : 1.9), 0.30 * lift, cfg.wave);
      }

      
      
      
      
      if (s === 0) {
        noteAt(audio, bed, next, chord * 2, beat * 7.4, 0.085 * lift, cfg.pad);
        noteAt(audio, bed, next, chord * 3, beat * 7.4, 0.055 * lift, cfg.pad);
      }

      
      
      if (intensity > 0.3 && (s === 2 || s === 6)) {
        const up = chord * (cfg.lead === 'fifth' ? 3 : 4);
        noteAt(audio, bed, next, up, beat * 1.6, 0.11 * intensity, cfg.lead === 'saw' ? 'sawtooth' : 'triangle');
        if (cfg.lead === 'detuned') noteAt(audio, bed, next, up * 1.006, beat * 1.6, 0.08 * intensity, 'triangle');
      }

      next += beat;
      step += 1;
    }
  }

  return {
    setWorld(id) { world = id || 'feudal'; },
    setIntensity(v) { intensity = Math.max(0, Math.min(1, v)); },
    start() {
      if (timer || !audio.ctx) return;
      next = audio.ctx.currentTime + 0.06;
      timer = globalThis.setInterval(schedule, TICK_MS);
      schedule();
    },
    stop() {
      if (timer) globalThis.clearInterval(timer);
      timer = null;
    },
    get running() { return timer !== null; },
  };
}

export function installAudio({ mount = null, search = '' } = {}) {
  const audio = createAudio();
  audio.muted = preferredMuted(search);
  const music = createMusic(audio);
  let prev = null;
  
  let heat = 0;

  
  const wakeMusic = () => {
    if (audio.muted || !audio.ctx) { music.stop(); return; }
    music.start();
  };

  const doc = globalThis.document;
  let button = null;
  const paint = () => {
    if (!button) return;
    
    
    
    
    
    
    
    
    
    
    
    
    if (!audio.muted && !isAudible(audio)) button.textContent = 'Tap for sound';
    else button.textContent = audio.muted ? 'Sound: off' : 'Sound: on';
    button.setAttribute('aria-pressed', String(isAudible(audio)));
  };
  const toggle = () => {
    
    
    
    const wasAudible = isAudible(audio);
    resumeAudio(audio);
    
    
    
    if (wasAudible || audio.muted) setMuted(audio, !audio.muted);
    wakeMusic();
    paint();
  };

  if (doc) {
    const host = mount || doc.querySelector('.controls');
    if (host) {
      button = doc.createElement('button');
      button.id = 'sound';
      button.type = 'button';
      button.title = 'Synthesised fight audio: impacts, swings, footfalls and the charge. Shortcut: m';
      button.addEventListener('click', toggle);
      host.appendChild(button);
      paint();
    }
    
    
    
    
    
    const wake = () => { if (!audio.muted) { resumeAudio(audio); wakeMusic(); } paint(); };
    for (const t of ['pointerdown', 'touchend', 'keydown', 'click']) {
      globalThis.addEventListener(t, wake, true);
    }
    
    
    
    const back = () => {
      if (audio.muted) return;
      if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
      if (audio.silent && audio.silent.paused) audio.silent.play().catch(() => {});
      wakeMusic();
      paint();
    };
    globalThis.addEventListener('focus', back);
    globalThis.addEventListener('pageshow', back);
    
    
    
    
    if (doc.addEventListener) {
      doc.addEventListener('visibilitychange', () => {
        if (doc.visibilityState === 'visible' && !audio.muted) {
          resumeAudio(audio);
          wakeMusic();
        }
        paint();
      });
    }
    globalThis.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') toggle();
    });
  }

  return {
    audio,
    toggle,
    music,
    
    setWorld(id) { music.setWorld(id); },
    tick(pose) {
      
      
      
      if (audio.muted || !audio.ctx) { prev = null; return; }
      const { beats, state } = beatsFor(pose, prev);
      prev = state;
      for (const b of beats) playVoice(audio, voiceFor(b.event, b.index, b), 0);
      setCharge(audio, pose.charge ? pose.charge.level : 0);

      
      
      
      
      heat = Math.max(heat * 0.985, pose.hit ? 1 : 0);
      music.setIntensity(heat);
      wakeMusic();
    },
  };
}
