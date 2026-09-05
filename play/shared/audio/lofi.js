



























import {
  BAR_SECONDS, LOOP_BARS, eventsForBar, noteHz,
} from '../../../web-engine/words/lofi.js';
import { createAudioUnlock } from './iosUnlock.js';






const KEY = 'magestican:v1:music';

let ctx = null;
let master = null;      
let tone = null;        
let bus = null;         
let noise = null;       
let timer = null;
let bar = 0;            
let nextAt = 0;         
let on = false;
let played = 0;
let failed = 0;


const AHEAD = 0.9;
const TICK_MS = 220;

const remembered = () => {
  try { return globalThis.localStorage?.getItem(KEY) === 'on'; } catch { return false; }
};
const remember = (value) => {
  try { globalThis.localStorage?.setItem(KEY, value ? 'on' : 'off'); } catch {  }
};

function ensureContext() {
  if (ctx) return ctx;
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();

  master = ctx.createGain();
  master.gain.value = 0;   
  master.connect(ctx.destination);

  
  
  
  
  
  tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2100;
  tone.Q.value = 0.6;
  tone.connect(master);

  bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(tone);

  
  
  
  const wow = ctx.createOscillator();
  const wowDepth = ctx.createGain();
  wow.frequency.value = 0.21;
  wowDepth.gain.value = 0.02;
  wow.connect(wowDepth);
  wowDepth.connect(bus.gain);
  wow.start();

  return ctx;
}


function hit(at, { kind, gain }) {
  const dur = kind === 'openhat' ? 0.26 : kind === 'rim' ? 0.13 : 0.06;
  const buf = ctx.createBuffer(1, Math.max(1, Math.ceil(ctx.sampleRate * dur)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;

  const band = ctx.createBiquadFilter();
  if (kind === 'rim') { band.type = 'bandpass'; band.frequency.value = 900; band.Q.value = 1.4; }
  else { band.type = 'highpass'; band.frequency.value = kind === 'openhat' ? 5200 : 6800; }

  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(band);
  band.connect(g);
  g.connect(bus);
  src.start(at);
  src.stop(at + dur + 0.02);
}


function kick(at, gain) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, at);
  osc.frequency.exponentialRampToValueAtTime(42, at + 0.11);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
  osc.connect(g);
  g.connect(bus);
  osc.start(at);
  osc.stop(at + 0.3);
}


























function voice(at, { kind, note, gain, length }) {
  const hz = noteHz(note);
  const isBass = kind === 'bass';

  const g = ctx.createGain();
  const attack = isBass ? 0.012 : 0.05;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(attack + 0.05, length));

  if (isBass) {
    g.connect(bus);
  } else {
    
    
    const colour = ctx.createBiquadFilter();
    colour.type = 'lowpass';
    colour.frequency.value = Math.min(2000, hz * 3.1);
    colour.Q.value = 0.5;
    g.connect(colour);
    colour.connect(bus);
  }

  const osc = ctx.createOscillator();
  
  
  
  osc.type = isBass ? 'sine' : 'triangle';
  osc.frequency.value = hz;
  
  
  osc.detune.value = (Math.random() - 0.5) * 9;
  osc.connect(g);
  osc.start(at);
  osc.stop(at + length + 0.1);

  if (isBass) {
    const up = ctx.createOscillator();
    const upGain = ctx.createGain();
    up.type = 'triangle';   
    up.frequency.value = hz * 2;
    up.detune.value = (Math.random() - 0.5) * 6;
    upGain.gain.setValueAtTime(0.0001, at);
    upGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.34), at + 0.02);
    upGain.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.1, length * 0.85));
    up.connect(upGain);
    upGain.connect(bus);
    up.start(at);
    up.stop(at + length + 0.1);
  }
}


function startCrackle() {
  const seconds = 3;
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    
    
    data[i] = Math.random() < 0.0016 ? (Math.random() * 2 - 1) * 0.55 : 0;
  }
  noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.value = 0.06;
  noise.connect(hp);
  hp.connect(g);
  g.connect(tone);
  noise.start();
}


function pump() {
  if (!on || !ctx) return;
  const horizon = ctx.currentTime + AHEAD;
  let guard = 0;
  while (nextAt < horizon && guard < 64) {
    guard += 1;
    for (const e of eventsForBar(bar)) {
      const at = nextAt + e.at * (BAR_SECONDS / 4);
      try {
        if (e.kind === 'kick') kick(at, e.gain);
        else if (e.kind === 'bass' || e.kind === 'key') voice(at, e);
        else hit(at, e);
        played += 1;
      } catch { failed += 1; }
    }
    bar = (bar + 1) % LOOP_BARS;
    nextAt += BAR_SECONDS;
  }
}

const unlock = createAudioUnlock({
  ensureContext,
  currentContext: () => ctx,
  isMuted: () => !on,
});

export function isOn() { return on; }

export function setOn(value) {
  const want = !!value;
  remember(want);
  if (want === on) return on;
  on = want;

  if (!on) {
    if (timer) { clearInterval(timer); timer = null; }
    
    
    if (master && ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }
    try { noise?.stop(ctx.currentTime + 0.5); } catch {  }
    noise = null;
    return on;
  }

  if (!ensureContext()) { on = false; return false; }
  unlock.unlock();
  try { ctx.resume?.(); } catch {  }

  
  
  bar = 0;
  nextAt = ctx.currentTime + 0.12;
  if (!noise) startCrackle();
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.34, ctx.currentTime + 1.2);
  pump();
  timer = setInterval(pump, TICK_MS);
  return on;
}





















export function duck(depth = 0.42, ms = 260) {
  if (!on || !master || !ctx) return;
  const now = ctx.currentTime;
  const full = 0.34;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  
  
  master.gain.linearRampToValueAtTime(full * depth, now + 0.03);
  master.gain.linearRampToValueAtTime(full, now + 0.03 + ms / 1000);
}

export function toggle() { return setOn(!on); }


export function wasOn() { return remembered(); }








export function state() {
  return {
    on,
    context: ctx ? ctx.state : 'none',
    
    
    
    
    gain: master ? Math.round(master.gain.value * 1000) / 1000 : null,
    bar,
    played,
    failed,
    loopBars: LOOP_BARS,
  };
}
