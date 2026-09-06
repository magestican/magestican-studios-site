



























































import { HERD } from '../../../web-engine/rts/roster.js';
import { sharePct } from '../../../web-engine/rts/territory.js';
import {
  unitSpec, buildingSpec, slotOfUnitId, STATE,
} from '../../../web-engine/rts/sim/world.js';
import { createSheet, createStems } from './sfxSheet.js';


const CLOCK_STALL_SECONDS = 1;


























































export function resumeReason({ visible, state, ctxTime, lastCtxTime, wallElapsed }) {
  if (!visible) return null;
  if (state !== 'running') return 'state';
  
  
  if (wallElapsed >= CLOCK_STALL_SECONDS && ctxTime <= lastCtxTime) return 'clock';
  return null;
}








const ROOT = 146.83;                       
const PROGRESSION = [
  [0, 7, 12, 16],      
  [-3, 4, 9, 12],      
  [-5, 2, 7, 11],      
  [-7, 0, 5, 9],       
];
const BAR_SECONDS = 3.2;

const semis = (n) => ROOT * (2 ** (n / 12));


const MM = 1000;


const EVENT_SFX = {
  captured: 'captureDone',
  lost: 'sectorLost',
  faded: 'sectorLost',
  buildingDone: 'buildDone',
  unitSpawned: 'unitReady',
  unitLost: 'unitDown',
  buildingLost: 'shoulderCharge',
  waterPolluted: 'canisterHiss',
  waterCleaned: 'ducks',
  stockRecovered: 'hydraulics',
};










const WEAPON_SFX = {
  smallArms: 'rifleCrack',
  towerGun: 'rifleCrack',
  current: 'fenceSnap',
  pesticide: 'canisterHiss',
  stone: 'stoneOnSteel',
};


const IMPACT_SFX = { metal: 'hitMetal', structure: 'hitMetal' };












const WEAPON_IMPACT = { pesticide: 'canisterThump' };










const BUILDING_LOOP_SFX = { electricFence: 'fenceHum' };















const LOOP_SFX = {
  tractor: 'engineTractor',
  harvester: 'engineTractor',
  quadBike: 'engineQuad',
  poundWagon: 'engineTruck',
  foodTruck: 'engineTruck',
  bowser: 'engineTruck',
  combine: 'engineCombine',
  cropDuster: 'rotorDuster',
  
  
  wing: 'wingbeats',
};















const FOOTFALL = {
  flock: { sfx: 'hoofLight', hz: 9, gain: 0.20, rate: 1.25 },
  duckRaft: { sfx: 'hoofLight', hz: 7, gain: 0.16, rate: 1.35 },
  skulk: { sfx: 'hoofLight', hz: 8, gain: 0.18, rate: 1.10 },
  farmhand: { sfx: 'hoofLight', hz: 2.4, gain: 0.22, rate: 1.15 },
  sounder: { sfx: 'hoofMid', hz: 7, gain: 0.28, rate: 1.05 },
  
  
  
  
  
  horseHerd: { sfx: 'hoofHeavy', hz: 6, gain: 0.34, rate: 0.95 },
  pride: { sfx: 'hoofMid', hz: 5, gain: 0.30, rate: 0.90 },
  elephant: { sfx: 'elephantStep', hz: 1.6, gain: 0.55, rate: 1.00 },
};










const CULL_SCREENS = 3.5;


const COMBAT_PER_BATCH = 4;











const LOOP_VOICES_MAX = 6;

















const MOVE_STEPS_PER_PUMP = 4;
const MOVE_SCREENS = 2.0;

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let ambBus = null;
  let voiceBus = null;
  
  let synthPastoral = null;
  let synthIndustrial = null;

  let sheet = null;
  let vox = null;
  let stems = null;

  let musicOn = true;
  let sfxOn = true;
  let voiceOn = true;
  let muted = false;
  let bar = 0;
  let nextNoteAt = 0;
  let timer = null;
  let blend = 0.5;          
  let target = 0.5;
  let usingSynthMusic = false;
  let duckUntil = 0;
  let lastSpoken = null;
  
  let pumps = 0;
  
  
  let watchTime = -1;
  let watchWall = 0;
  
  let resumes = 0;
  let lastResumeReason = null;
  
  let wired = false;

  const LEVELS = { music: 0.5, sfx: 0.75, voice: 1.0 };

  
  
  
  
  
  
  const listener = { x: 600, y: 600, span: 320, yawSteps: 0 };
  let listenerWasSet = false;

  
  let lastMatch = null;

  
  
  
  
  
  
  
  
  const beds = Object.create(null);
  const bedTargets = { windA: 0, windB: 0, waterClean: 0, waterFouled: 0, engines: 0 };

  
  const spatialStats = { placed: 0, culled: 0, voicesPanned: 0, voicesFlat: 0 };
  
  const moveStats = { steps: 0, moving: 0 };
  const voiceLog = [];

  














  function wake() {
    if (!ctx) return;
    const nowWall = Date.now();
    const visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    
    
    
    
    
    
    
    
    
    const why = resumeReason({
      visible,
      state: ctx.state,
      ctxTime: ctx.currentTime,
      lastCtxTime: watchTime,
      wallElapsed: watchWall ? (nowWall - watchWall) / 1000 : 0,
    });
    
    
    if (ctx.currentTime > watchTime || watchWall === 0 || why) {
      watchTime = ctx.currentTime;
      watchWall = nowWall;
    }
    if (!why) return;
    resumes += 1;
    lastResumeReason = why;
    
    
    try { const r = ctx.resume(); if (r && r.catch) r.catch(() => {}); } catch {  }
  }

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);

      musicBus = ctx.createGain();
      sfxBus = ctx.createGain();
      voiceBus = ctx.createGain();
      musicBus.gain.value = LEVELS.music;
      sfxBus.gain.value = LEVELS.sfx;
      voiceBus.gain.value = LEVELS.voice;
      musicBus.connect(master);
      sfxBus.connect(master);
      voiceBus.connect(master);

      
      
      
      
      
      ambBus = ctx.createGain();
      ambBus.gain.value = 0.6;
      ambBus.connect(sfxBus);

      synthPastoral = ctx.createGain();
      synthIndustrial = ctx.createGain();
      synthPastoral.gain.value = 0.5;
      synthIndustrial.gain.value = 0.5;
      synthPastoral.connect(musicBus);
      synthIndustrial.connect(musicBus);

      
      
      sheet = createSheet(ctx, './assets/sfx');
      vox = createSheet(ctx, './assets/sfx');
      stems = createStems(ctx, './assets/music', ['pastoral', 'industrial']);

      
      
      
      
      
      
      
      
      
      if (!wired && typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') wake();
        });
        
        
        ctx.addEventListener('statechange', () => { wake(); });
        wired = true;
      }
      return true;
    } catch {
      
      
      return false;
    }
  }

  
  
  

  






  function relative(xMm, yMm) {
    const dx = xMm / MM - listener.x;
    const dz = yMm / MM - listener.y;
    
    
    
    
    
    
    const yaw = ((listener.yawSteps || 0) * Math.PI) / 2;
    const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const span = Math.max(1, listener.span);
    return { right: right / span, screens: Math.hypot(dx, dz) / span };
  }

  





  function placeEffect(xMm, yMm) {
    const { right, screens } = relative(xMm, yMm);
    if (screens > CULL_SCREENS) return null;

    
    
    
    
    const attenuation = 1 / (1 + (screens / 0.8) ** 2);

    let head = null;
    let tail = null;

    
    
    
    
    
    
    if (screens > 0.25) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = Math.max(800, 20000 * Math.exp(-0.85 * screens));
      head = lp;
      tail = lp;
    }

    
    
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, right * 0.85));
      if (tail) tail.connect(pan); else head = pan;
      tail = pan;
    }

    if (!head) return { input: sfxBus, head: null, attenuation };
    tail.connect(sfxBus);
    return { input: head, head, attenuation };
  }

  
  function effect(id, g = 1, at = null, rate = 1, when = 0) {
    if (!ctx || !sfxOn) return false;
    let dest = sfxBus;
    let level = g;
    let place = null;
    if (at) {
      place = placeEffect(at.x, at.y);
      if (!place) { spatialStats.culled += 1; return false; }
      dest = place.input;
      level = g * place.attenuation;
      spatialStats.placed += 1;
    }
    if (sheet) {
      const src = sheet.play(id, { dest, gain: level, rate, when });
      if (src) {
        
        
        
        if (place && place.head) {
          src.onended = () => { try { place.head.disconnect(); } catch {  } };
        }
        return true;
      }
    }
    const pitch = {
      captureDone: 900, sectorLost: 320, buildDone: 520,
      unitReady: 1400, unitDown: 240, uiTap: 2600, captureTick: 1320,
      rifleCrack: 2200, hitFlesh: 300, hitMetal: 900,
    }[id] || 700;
    tickNoise(ctx.currentTime, 0.12 * level, pitch, dest, 0.12);
    return true;
  }

  
  
  

  
  function pluck(freq, at, dur, g) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.value = freq;
    o.detune.value = (bar % 2 === 0 ? 4 : -4);
    f.type = 'lowpass';
    f.frequency.value = 2200;
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.exponentialRampToValueAtTime(g, at + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(gn); gn.connect(synthPastoral);
    o.start(at); o.stop(at + dur + 0.05);
  }

  
  function grind(freq, at, dur, g) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, at);
    f.frequency.linearRampToValueAtTime(1500, at + dur * 0.4);
    f.Q.value = 6;
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.linearRampToValueAtTime(g, at + 0.05);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(gn); gn.connect(synthIndustrial);
    o.start(at); o.stop(at + dur + 0.05);
  }

  
  function tickNoise(at, g, freq, dest, dur = 0.09) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    
    
    
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.4;
    const gn = ctx.createGain();
    gn.gain.value = g;
    src.connect(f); f.connect(gn); gn.connect(dest || sfxBus);
    src.start(at);
  }

  function scheduleBar() {
    if (!ctx || !musicOn || !usingSynthMusic) return;
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const a = nextNoteAt;
    const beat = BAR_SECONDS / 4;
    for (let i = 0; i < 4; i += 1) {
      pluck(semis(chord[i % chord.length]) * 2, a + i * beat, beat * 0.9, 0.075);
      if (i % 2 === 0) pluck(semis(chord[0]), a + i * beat, beat * 1.6, 0.05);
      tickNoise(a + i * beat, 0.03, 5200, synthPastoral, 0.05);
    }
    grind(semis(chord[0]) / 2, a, BAR_SECONDS * 0.95, 0.05);
    grind(semis(chord[2]), a, BAR_SECONDS * 0.95, 0.028);
    for (let i = 0; i < 8; i += 1) {
      tickNoise(a + i * (beat / 2), i % 2 === 0 ? 0.055 : 0.02, 180, synthIndustrial, 0.07);
    }
    nextNoteAt += BAR_SECONDS;
    bar += 1;
  }

  
  
  

  
  function startBed(name, id, { rate = 1, delay = 0 } = {}) {
    if (!sheet) return false;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ambBus);
    const src = sheet.play(id, {
      dest: g, gain: 1, loop: true, rate, when: ctx.currentTime + delay,
    });
    if (!src) { g.disconnect(); return false; }
    beds[name] = { id, src, gain: g, rate };
    return true;
  }

  










  function startAmbience() {
    if (!ctx || !sheet || sheet.status !== 'ready') return;
    if (beds.windA) return;
    startBed('windA', 'windGrass', { rate: 1 });
    startBed('windB', 'windGrass', { rate: 0.83, delay: 0.37 });
    startBed('waterClean', 'waterClean', { rate: 1 });
    startBed('waterFouled', 'waterFouled', { rate: 1.03, delay: 0.11 });
    
    
    
    
    startBed('engines', 'engineTractor', { rate: 1 });
  }

  function setBed(name, value, seconds = 1.2) {
    const b = beds[name];
    if (!b) return;
    const now = ctx.currentTime;
    b.gain.gain.cancelScheduledValues(now);
    b.gain.gain.setValueAtTime(b.gain.gain.value, now);
    b.gain.gain.linearRampToValueAtTime(Math.max(0, value), now + seconds);
  }

  











  function ambienceTargets() {
    const t = { windA: 0.55, windB: 0.30, waterClean: 0, waterFouled: 0, engines: 0 };
    const match = lastMatch;
    if (!match || !match.w) return t;
    const w = match.w;

    let clean = 0;
    let fouled = 0;
    for (const s of w.sectors) {
      if (s.kind !== 'water') continue;
      const near = 1 / (1 + relative(s.cx, s.cy).screens ** 2);
      
      
      
      
      
      const foulPct = Math.max(0, Math.min(1, (s.pollution || 0) / 3));
      clean += near * (1 - foulPct);
      fouled += near * foulPct;
    }
    t.waterClean = Math.min(0.55, clean * 0.30);
    t.waterFouled = Math.min(0.55, fouled * 0.30);

    
    
    
    
    
    
    
    
    t.engines = 0;
    return t;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  const loopVoices = new Map();

  
  function startLoopVoice(sfxId) {
    const g = ctx.createGain();
    g.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 20000;
    let tail = lp;
    lp.connect(g);
    let pan = null;
    if (ctx.createStereoPanner) {
      pan = ctx.createStereoPanner();
      g.connect(pan);
      pan.connect(ambBus);
      tail = pan;
    } else {
      g.connect(ambBus);
    }
    
    
    
    
    
    
    const slice = sheet.byEffect && sheet.byEffect[sfxId];
    const src = sheet.play(sfxId, {
      dest: lp,
      gain: 1,
      loop: true,
      when: ctx.currentTime + Math.random() * 0.05,
      offset: slice ? Math.random() * slice.dur : 0,
    });
    if (!src) {
      try { tail.disconnect(); } catch {  }
      return null;
    }
    return { sfx: sfxId, src, gain: g, lp, pan };
  }

  
  function releaseLoopVoice(v) {
    const now = ctx.currentTime;
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + 0.35);
      v.src.stop(now + 0.4);
      v.src.onended = () => {
        try { v.lp.disconnect(); } catch {  }
        try { v.gain.disconnect(); } catch {  }
        if (v.pan) { try { v.pan.disconnect(); } catch {  } }
      };
    } catch {  }
  }

  






  function aimLoopVoice(v, screens, right, level) {
    const now = ctx.currentTime;
    const to = now + 0.3;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.linearRampToValueAtTime(Math.max(0, level), to);
    v.lp.frequency.cancelScheduledValues(now);
    v.lp.frequency.setValueAtTime(v.lp.frequency.value, now);
    v.lp.frequency.linearRampToValueAtTime(
      Math.max(700, 20000 * Math.exp(-0.85 * screens)), to,
    );
    if (v.pan) {
      v.pan.pan.cancelScheduledValues(now);
      v.pan.pan.setValueAtTime(v.pan.pan.value, now);
      v.pan.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, right * 0.85)), to);
    }
  }

  





  function updateLoopVoices() {
    if (!sheet || sheet.status !== 'ready' || !lastMatch || !lastMatch.w) return 0;
    const w = lastMatch.w;
    const cand = [];
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i]) continue;
      const sfxId = LOOP_SFX[unitSpec(w, i).id];
      if (!sfxId) continue;
      const r = relative(w.u.x[i], w.u.y[i]);
      if (r.screens > CULL_SCREENS) continue;
      cand.push({ key: w.u.id[i], sfxId, screens: r.screens, right: r.right });
    }
    
    
    
    
    
    
    for (let i = 0; i < w.b.count; i += 1) {
      if (!w.b.alive[i] || w.b.building[i] > 0) continue;
      const sfxId = BUILDING_LOOP_SFX[buildingSpec(w, i).id];
      if (!sfxId) continue;
      const r = relative(w.b.x[i], w.b.y[i]);
      if (r.screens > CULL_SCREENS) continue;
      cand.push({ key: -1 - w.b.id[i], sfxId, screens: r.screens, right: r.right });
    }
    
    
    cand.sort((a, b) => a.screens - b.screens || a.key - b.key);

    const keep = cand.slice(0, LOOP_VOICES_MAX);
    const wanted = new Set(keep.map((c) => c.key));
    for (const [key, v] of loopVoices) {
      if (!wanted.has(key)) { releaseLoopVoice(v); loopVoices.delete(key); }
    }
    for (const c of keep) {
      let v = loopVoices.get(c.key);
      
      
      if (v && v.sfx !== c.sfxId) { releaseLoopVoice(v); loopVoices.delete(c.key); v = null; }
      if (!v) {
        v = startLoopVoice(c.sfxId);
        if (!v) continue;
        loopVoices.set(c.key, v);
      }
      aimLoopVoice(v, c.screens, c.right, 0.42 / (1 + (c.screens / 0.9) ** 2));
    }

    let residual = 0;
    for (const c of cand.slice(LOOP_VOICES_MAX)) residual += 1 / (1 + c.screens ** 2);
    return Math.min(0.34, residual * 0.11);
  }

  
  function releaseAllLoopVoices() {
    for (const [key, v] of loopVoices) { releaseLoopVoice(v); loopVoices.delete(key); }
  }

  





















  function footfalls(dtSec) {
    if (!ctx || !sfxOn || !sheet || sheet.status !== 'ready') return;
    if (!lastMatch || !lastMatch.w) return;
    const w = lastMatch.w;
    const movers = [];
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.state[i] !== STATE.MOVING) continue;
      const spec = FOOTFALL[unitSpec(w, i).id];
      if (!spec) continue;
      const r = relative(w.u.x[i], w.u.y[i]);
      if (r.screens > MOVE_SCREENS) continue;
      movers.push({ spec, screens: r.screens, x: w.u.x[i], y: w.u.y[i], key: w.u.id[i] });
    }
    moveStats.moving = movers.length;
    if (movers.length === 0) return;
    movers.sort((a, b) => a.screens - b.screens || a.key - b.key);

    let budget = MOVE_STEPS_PER_PUMP;
    let heavy = 1;                       
    for (const m of movers.slice(0, LOOP_VOICES_MAX)) {
      if (budget <= 0) break;
      const want = m.spec.hz * dtSec;
      let n = Math.floor(want);
      if (Math.random() < want - n) n += 1;
      while (n > 0 && budget > 0) {
        if (m.spec.sfx === 'elephantStep') {
          if (heavy <= 0) break;
          heavy -= 1;
        }
        const at = ctx.currentTime + Math.random() * dtSec;
        const rate = m.spec.rate * (0.94 + Math.random() * 0.12);
        if (effect(m.spec.sfx, m.spec.gain, { x: m.x, y: m.y }, rate, at)) {
          moveStats.steps += 1;
          budget -= 1;
        }
        n -= 1;
      }
    }
  }

  

  function pump() {
    if (!ctx) return;
    pumps += 1;
    
    
    
    
    wake();
    while (usingSynthMusic && nextNoteAt < ctx.currentTime + 2) scheduleBar();
    
    
    blend += (target - blend) * 0.08;

    
    
    
    const speaking = ctx.currentTime < duckUntil;
    const ducked = speaking ? 0.63 : 1;                        
    if (stems && stems.status === 'ready') {
      stems.setGain('pastoral', (1 - blend) * 0.9 * ducked, 0.3);
      stems.setGain('industrial', blend * 0.9 * ducked, 0.3);
    } else {
      if (synthPastoral) synthPastoral.gain.value = (1 - blend) * 0.85 * ducked;
      if (synthIndustrial) synthIndustrial.gain.value = blend * 0.85 * ducked;
    }

    startAmbience();
    
    
    
    const residualEngines = updateLoopVoices();
    if (beds.windA) {
      const t = ambienceTargets();
      t.engines = residualEngines;
      const under = speaking ? 0.71 : 1;                       
      for (const k of Object.keys(bedTargets)) {
        bedTargets[k] = t[k];
        setBed(k, t[k] * under, 1.2);
      }
    }
    
    
    
    
    footfalls(0.25);
    if (ambBus) ambBus.gain.value = sfxOn ? 0.6 : 0;
  }

  












  function combat(evs, match) {
    if (!ctx || !sfxOn || !match || !match.w) return;
    const w = match.w;
    let fired = 0;
    for (const ev of evs) {
      if (fired >= COMBAT_PER_BATCH) break;
      if (ev.type !== 'membersLost' && ev.type !== 'unitLost') continue;
      const vs = slotOfUnitId(w, ev.victim);
      if (vs < 0) continue;

      
      
      
      
      const rate = 0.94 + Math.random() * 0.12;

      const as = ev.by === undefined || ev.by < 0 ? -1 : slotOfUnitId(w, ev.by);
      if (as >= 0) {
        const report = WEAPON_SFX[unitSpec(w, as).damageClass];
        if (report) {
          effect(report, 0.5, { x: w.u.x[as], y: w.u.y[as] }, rate);
          fired += 1;
        }
      }
      const byClass = as >= 0 ? WEAPON_IMPACT[unitSpec(w, as).damageClass] : null;
      const impact = byClass || IMPACT_SFX[unitSpec(w, vs).armourClass] || 'hitFlesh';
      effect(impact, 0.45, { x: w.u.x[vs], y: w.u.y[vs] }, rate);
      fired += 1;
    }
  }

  
  function placeOf(ev, match) {
    if (!match || !match.w) return null;
    if (ev.sector !== undefined && ev.sector >= 0) {
      const s = match.w.sectors[ev.sector];
      if (s) return { x: s.cx, y: s.cy };
    }
    if (ev.victim !== undefined) {
      const slot = slotOfUnitId(match.w, ev.victim);
      if (slot >= 0) return { x: match.w.u.x[slot], y: match.w.u.y[slot] };
    }
    return null;
  }

  const api = {
    







    begin(match, seat) {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      
      
      watchTime = ctx.currentTime;
      watchWall = Date.now();
      bar = 0;
      nextNoteAt = ctx.currentTime + 0.1;
      blend = 0.5;
      target = 0.5;
      usingSynthMusic = false;
      lastMatch = match || null;
      voiceLog.length = 0;
      spatialStats.placed = 0;
      spatialStats.culled = 0;
      spatialStats.voicesPanned = 0;
      spatialStats.voicesFlat = 0;
      moveStats.steps = 0;
      moveStats.moving = 0;
      releaseAllLoopVoices();

      
      
      
      
      sheet.ready('fu-sfx.json').then(() => { startAmbience(); });
      vox.ready('fu-vox.json');
      stems.ready().then((status) => {
        if (status === 'ready') {
          stems.start(musicBus);
        } else {
          
          
          usingSynthMusic = true;
          nextNoteAt = ctx.currentTime + 0.1;
        }
      });

      if (timer) clearInterval(timer);
      timer = setInterval(pump, 250);
    },

    














    setListener(v) {
      if (!v) return;
      listener.x = v.x;
      listener.y = v.y;
      listener.span = v.span;
      listener.yawSteps = v.yawSteps || 0;
      listenerWasSet = true;
    },

    






    update(match, seat, view) {
      if (!ctx) return;
      lastMatch = match;
      if (view) api.setListener(view);
      else if (!listenerWasSet && typeof window !== 'undefined'
               && window.__fu && window.__fu.view && window.__fu.view.view) {
        const v = window.__fu.view.view;
        listener.x = v.x; listener.y = v.y;
        listener.span = v.span; listener.yawSteps = v.yawSteps || 0;
      }
      const mine = sharePct(match.w.sectors, seat);
      const meHerd = match.factions[seat] === HERD;
      const toward = meHerd ? 0 : 1;
      const away = meHerd ? 1 : 0;
      const t = Math.max(0, Math.min(1, mine / 60));
      target = away + (toward - away) * t;
    },

    events(evs, match) {
      if (!ctx || !sfxOn) return;
      if (match) lastMatch = match;
      for (const ev of evs) {
        const id = EVENT_SFX[ev.type];
        if (id) effect(id, ev.type === 'unitSpawned' ? 0.35 : 0.9, placeOf(ev, match));
      }
      combat(evs, match);
    },

    



















    say(clip, at) {
      if (!ctx || !voiceOn || !vox) return false;
      const table = vox.byEffect;
      const register = (table && table[clip] && table[clip].register) || null;
      const mayPan = register === 'plain' || register === 'radio';

      let dest = voiceBus;
      let level = 1;
      let head = null;
      if (mayPan && at && ctx.createStereoPanner) {
        const { right, screens } = relative(at.x, at.y);
        const pan = ctx.createStereoPanner();
        
        
        
        
        pan.pan.value = Math.max(-1, Math.min(1, right * 0.45));
        pan.connect(voiceBus);
        dest = pan;
        head = pan;
        level = 0.6 + 0.4 / (1 + screens * screens);
      }

      const src = vox.play(clip, { dest, gain: level });
      if (!src) return false;
      if (head) src.onended = () => { try { head.disconnect(); } catch {  } };
      lastSpoken = clip;
      if (head) spatialStats.voicesPanned += 1; else spatialStats.voicesFlat += 1;
      
      
      
      
      voiceLog.push({ clip, register, panned: !!head });
      if (voiceLog.length > 16) voiceLog.shift();
      duckUntil = ctx.currentTime + vox.durationOf(clip) + 0.15;
      return true;
    },

    








    ui(kind) {
      if (!ctx || !sfxOn) return;
      if (kind === 'deny') { effect('uiDeny', 0.7); return; }
      effect(kind === 'order' ? 'captureTick' : 'uiTap', kind === 'order' ? 0.8 : 0.6);
    },

    matchOver(won) {
      if (!ctx) return;
      effect(won ? 'captureDone' : 'sectorLost', 1);
      target = won ? target : 1 - target;
      
      
      
      
      for (const k of Object.keys(beds)) setBed(k, 0, 2.5);
      releaseAllLoopVoices();
    },

    setMusic(on) { musicOn = !!on; if (musicBus) musicBus.gain.value = on ? LEVELS.music : 0; },
    setSfx(on) { sfxOn = !!on; if (sfxBus) sfxBus.gain.value = on ? LEVELS.sfx : 0; },
    setVoice(on) { voiceOn = !!on; if (voiceBus) voiceBus.gain.value = on ? LEVELS.voice : 0; },

    
    setLevel(bus, value) {
      const v = Math.max(0, Math.min(1, Number(value) || 0));
      LEVELS[bus] = v;
      const node = { music: musicBus, sfx: sfxBus, voice: voiceBus }[bus];
      if (node) node.gain.value = v;
    },

    mute(on) { muted = !!on; if (master) master.gain.value = on ? 0 : 1; },
    get muted() { return muted; },
    get state() { return ctx ? ctx.state : 'none'; },

    







    get debug() {
      return {
        sfxSheet: sheet,
        voxSheet: vox,
        stems,
        state: ctx ? ctx.state : 'none',
        contextTime: ctx ? Number(ctx.currentTime.toFixed(3)) : -1,
        pumps,
        
        
        
        resumes,
        lastResumeReason,
        sfxStatus: sheet ? sheet.status : 'none',
        voxStatus: vox ? vox.status : 'none',
        musicStatus: stems ? stems.status : 'none',
        
        
        
        
        stemGains: stems ? Object.fromEntries(Object.entries(stems.gains)
          .map(([k, g]) => [k, Number(g.gain.value.toFixed(4))])) : {},
        
        stemVoices: stems ? stems.live : 0,
        usingSynthMusic,
        lastSpoken,
        missing: [...(sheet ? sheet.missing : []), ...(vox ? vox.missing : [])],
        levels: { ...LEVELS },

        
        
        
        
        
        ambience: {
          playing: Object.keys(beds),
          gains: Object.fromEntries(Object.entries(beds)
            .map(([k, b]) => [k, Number(b.gain.gain.value.toFixed(4))])),
          targets: { ...bedTargets },
        },

        
        
        
        spatial: {
          panner: !!(ctx && ctx.createStereoPanner),
          listener: { ...listener },
          listenerWasSet,
          cullScreens: CULL_SCREENS,
          ...spatialStats,
        },

        
        
        
        
        
        emitters: [...loopVoices].map(([unit, v]) => ({
          unit,
          sfx: v.sfx,
          pan: v.pan ? Number(v.pan.pan.value.toFixed(3)) : null,
          gain: Number(v.gain.gain.value.toFixed(4)),
        })),

        
        
        
        movement: {
          steps: moveStats.steps,
          moving: moveStats.moving,
          stepsPerPumpCap: MOVE_STEPS_PER_PUMP,
          screens: MOVE_SCREENS,
          voicesMax: LOOP_VOICES_MAX,
        },

        
        
        
        voiceLog: [...voiceLog],

        








        speak: (clip, at) => api.say(clip, at),

        









        play: (id, at) => effect(id, 1, at || null),
      };
    },
  };

  return api;
}
