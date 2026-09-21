

























import {
  CUES, MASTER, MUTE_KEY, cueFor, gainFor, placePitch, voicesOf,
} from '../../../web-engine/words/scrabbleSound.js';
import { createAudioUnlock } from '../../shared/audio/iosUnlock.js';
import { duck } from '../../shared/audio/lofi.js';

let ctx = null;
let master = null;
let played = 0;
let failed = 0;
let lastError = '';







let muted = (() => {
  try { return globalThis.localStorage?.getItem(MUTE_KEY) === '1'; } catch { return false; }
})();


function ensure() {
  if (ctx) return ctx;
  try {
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  } catch (e) {
    failed += 1;
    lastError = String(e?.message ?? e);
    ctx = null;
  }
  return ctx;
}

const unlock = createAudioUnlock({
  ensureContext: ensure,
  currentContext: () => ctx,
  isMuted: () => muted,
});


export function install() {
  try { unlock.install(); } catch {  }
}








export function wake() {
  try { unlock.wake(); } catch {  }
}








export function play(event, { index = 0 } = {}) {
  const name = cueFor(event);
  if (!name || muted) return;
  
  
  
  
  
  
  duck();
  const cue = CUES[name];
  const audio = ctx ?? ensure();
  if (!audio || !master) return;
  try {
    if (audio.state === 'suspended') audio.resume();
    const now = audio.currentTime;
    const level = gainFor(cue, { muted, master: MASTER });
    if (level <= 0) return;
    const root = cue.step ? placePitch(index, cue) : cue.hz;
    const voices = voicesOf(cue, root);
    
    
    const each = level / Math.sqrt(voices.length);
    for (const hz of voices) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = cue.wave;
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, each), now + cue.attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.ms / 1000 + cue.release);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + cue.ms / 1000 + cue.release + 0.02);
    }
    played += 1;
  } catch (e) {
    
    
    failed += 1;
    lastError = String(e?.message ?? e);
  }
}

export function isMuted() { return muted; }

export function setMuted(next) {
  muted = !!next;
  try { globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {  }
  
  
  
  
  try {
    if (muted) unlock.stopKeepAlive();
    else unlock.wake();
  } catch {  }
}








export function state() {
  return {
    context: ctx?.state ?? 'none',
    muted,
    played,
    failed,
    lastError,
    unlocked: !!ctx && ctx.state === 'running',
    
    
    
    
    ...(() => { try { return { ios: unlock.report() }; } catch { return {}; } })(),
  };
}
