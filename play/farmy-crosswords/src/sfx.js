



























import { CUES, cueFor, gainFor, dragPitch, voicesOf, MUTE_KEY } from '../../../web-engine/words/soundSpec.js';
import { createAudioUnlock } from '../../shared/audio/iosUnlock.js';

let ctx = null;
let master = null;
let muted = false;
let played = 0;
let failed = 0;
let lastAt = 0;










try {
  muted = globalThis.localStorage?.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

function ensure() {
  if (ctx) return ctx;
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    
    
    failed += 1;
    return null;
  }
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  return ctx;
}










const unlocker = createAudioUnlock({
  ensureContext: ensure,
  
  
  currentContext: () => ctx,
  isMuted: () => muted,
});









export function wake() {
  try { unlocker.unlock(); } catch { failed += 1; }
}


export function install() {
  try { unlocker.install(); } catch { failed += 1; }
}









export function play(event, { index = 0 } = {}) {
  if (muted) return;
  const name = cueFor(event);
  if (!name) return;
  const cue = CUES[name];
  try {
    const c = ensure();
    if (!c) return;
    if (c.state !== 'running') { c.resume(); }

    
    
    
    
    const now = c.currentTime;
    if (name === 'drag' && now - lastAt < 0.025) return;
    lastAt = now;

    const level = gainFor(cue, { muted });
    if (level <= 0) return;

    const root = name === 'drag' ? dragPitch(index, cue) : cue.hz;
    const voices = voicesOf(cue, root);
    const seconds = cue.ms / 1000;

    for (const [i, hz] of voices.entries()) {
      if (!Number.isFinite(hz) || hz <= 0) continue;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = cue.wave;
      osc.frequency.setValueAtTime(hz, now);

      
      
      const start = now + i * 0.018;
      const per = level / Math.sqrt(voices.length);   
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(per, start + cue.attack);
      gain.gain.linearRampToValueAtTime(0, start + seconds + cue.release);

      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      
      
      
      
      osc.stop(start + seconds + cue.release + 0.02);
      osc.onended = () => { try { gain.disconnect(); osc.disconnect(); } catch {  } };
    }
    played += 1;
  } catch {
    failed += 1;
  }
}

export function isMuted() { return muted; }

export function setMuted(next) {
  muted = Boolean(next);
  try { globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {  }
  
  
  
  try { if (muted) unlocker.stopKeepAlive(); else unlocker.unlock(); } catch { failed += 1; }
  return muted;
}








export function state() {
  return {
    context: ctx ? ctx.state : 'none',
    played,
    failed,
    muted,
    
    
    
    
    
    ...unlocker.report(),
  };
}
