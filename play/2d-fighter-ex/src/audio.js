






























































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

















export function voiceFor(event, index, { power = 1, big = false, who = 'a' } = {}) {
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
      
      
      
      
      const base = who === 'b' ? span(i, 71, 300, 380) : span(i, 71, 190, 250);
      return {
        event: 'say',
        dur: 0.07,
        gain: 0.13,
        layers: [TONE({
          wave: 'triangle', dur: 0.07, gain: 1, f0: base, f1: base * 0.86, attack: 0.006,
        })],
      };
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
    beats.push({ event: 'say', index: at, who: pose.say.who });
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









export function resumeAudio(audio) {
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
  audio.started = true;
  return true;
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
    return globalThis.localStorage.getItem(STORE_KEY) !== 'on';
  } catch {
    return true;
  }
}






export function playVoice(audio, voice, when = 0) {
  if (!audio.ctx || !audio.bus || !voice || !voice.layers || !voice.layers.length) return 0;
  
  
  
  
  
  if (audio.voices > 24) return 0;
  const { ctx } = audio;
  const t0 = Math.max(ctx.currentTime, when || ctx.currentTime);
  let built = 0;

  for (const layer of voice.layers) {
    const dur = Math.max(0.005, layer.dur);
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

















export function installAudio({ mount = null, search = '' } = {}) {
  const audio = createAudio();
  audio.muted = preferredMuted(search);
  let prev = null;

  const doc = globalThis.document;
  let button = null;
  const paint = () => {
    if (!button) return;
    button.textContent = audio.muted ? 'Sound: off' : 'Sound: on';
    button.setAttribute('aria-pressed', String(!audio.muted));
  };
  const toggle = () => {
    
    
    
    resumeAudio(audio);
    setMuted(audio, !audio.muted);
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
    
    
    
    
    
    const wake = () => { if (!audio.muted) resumeAudio(audio); };
    for (const t of ['pointerdown', 'touchend', 'keydown']) {
      globalThis.addEventListener(t, wake, true);
    }
    globalThis.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') toggle();
    });
  }

  return {
    audio,
    toggle,
    tick(pose) {
      
      
      
      if (audio.muted || !audio.ctx) { prev = null; return; }
      const { beats, state } = beatsFor(pose, prev);
      prev = state;
      for (const b of beats) playVoice(audio, voiceFor(b.event, b.index, b), 0);
      setCharge(audio, pose.charge ? pose.charge.level : 0);
    },
  };
}
