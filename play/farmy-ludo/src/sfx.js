













import { MASTER, cueFor, voicesOf, MUTE_KEY } from '../../../web-engine/board/ludoSound.js';
import { createAudioUnlock } from '../../shared/audio/iosUnlock.js';

let ctx = null;
let master = null;
let muted = false;
let played = 0;
let failed = 0;

try { muted = globalThis.localStorage?.getItem(MUTE_KEY) === '1'; } catch { muted = false; }

function ensureContext() {
  if (ctx) return ctx;
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(ctx.destination);
  return ctx;
}

const unlock = createAudioUnlock({
  ensureContext,
  currentContext: () => ctx,
  isMuted: () => muted,
});


export function install() { unlock.install(); }


export function wake() { unlock.wake(); }


function knock({ hz, gain, ms }, at) {
  const seconds = ms / 1000;
  const buf = ctx.createBuffer(1, Math.max(1, Math.ceil(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = hz;
  band.Q.value = 1.1;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(band);
  band.connect(g);
  g.connect(master);
  src.start(at);
  src.stop(at + seconds + 0.02);
}


function tone({ hz, gain, ms }, at) {
  const seconds = ms / 1000;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  
  
  osc.type = 'triangle';
  osc.frequency.value = hz;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(g);
  g.connect(master);
  osc.start(at);
  osc.stop(at + seconds + 0.05);
}


export function play(name) {
  if (muted) return;
  if (!ensureContext()) return;
  const voices = voicesOf(name);
  if (!voices.length) return;
  const now = ctx.currentTime;
  for (const v of voices) {
    try {
      if (name === 'roll' || name === 'settle') knock(v, now + v.at / 1000);
      else tone(v, now + v.at / 1000);
      played += 1;
    } catch { failed += 1; }
  }
}


export function playEvent(event) {
  const cue = cueFor(event);
  if (cue) play(cue);
}

export function isMuted() { return muted; }

export function setMuted(value) {
  muted = !!value;
  try { globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {  }
  if (muted) unlock.stopKeepAlive();
  return muted;
}








export function state() {
  return {
    muted,
    context: ctx ? ctx.state : 'none',
    played,
    failed,
    ...unlock.report(),
  };
}
