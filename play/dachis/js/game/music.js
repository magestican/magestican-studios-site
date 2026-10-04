











import * as lofi from '../vendor/arbelo/audio/lofi.js';
import { Chiptune } from '../vendor/arbelo/audio/chiptune.js';
import { cueFor, isLoop, preloadFor, fileFor } from './musicCues.js';

const KEY = 'dachis:music';
const VOL = 0.55, FADE_MS = 700;
const pref = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
let on = pref();
const els = {};          
const failed = new Set(); 
let current = null;      
let fallback = null;     
let chip = null, waiting = false;

const base = () => new URL('.', document.baseURI).href;
const canPlay = (t) => { try { return new Audio().canPlayType(t); } catch { return ''; } };
const build = () => document.querySelector('meta[name=build]')?.content;

function el(cue) {
  if (els[cue] || failed.has(cue)) return els[cue] || null;
  const f = fileFor(cue, canPlay);
  if (!f) { failed.add(cue); return null; }
  const b = build(), a = new Audio(base() + f + (b && b !== 'dev' ? '?v=' + encodeURIComponent(b) : ''));
  a.preload = 'auto'; a.loop = isLoop(cue); a.volume = 0;
  a.addEventListener('error', () => { failed.add(cue); delete els[cue]; if (current === cue) start(cue); });
  els[cue] = a;
  return a;
}



function studioLofi(want) {
  let keep = null;
  try { keep = localStorage.getItem('magestican:v1:music'); } catch {  }
  try { lofi.setOn(want); } catch (e) { console.warn('[music]', e); }
  try { if (keep === null) localStorage.removeItem('magestican:v1:music'); else localStorage.setItem('magestican:v1:music', keep); } catch {  }
}
function stopFallback() {
  if (fallback === 'lofi') studioLofi(false);
  if (fallback === 'chip' && chip) chip.stop();
  fallback = null;
}

const fades = new Map();
function fadeTo(a, v, then) {
  clearInterval(fades.get(a));
  const from = a.volume, t0 = performance.now();
  fades.set(a, setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / FADE_MS);
    a.volume = Math.max(0, Math.min(1, from + (v - from) * k));
    if (k >= 1) { clearInterval(fades.get(a)); fades.delete(a); if (then) then(); }
  }, 40));
}

function retryOnGesture() {
  if (waiting) return;
  waiting = true;
  const go = () => { waiting = false; removeEventListener('pointerdown', go, true); removeEventListener('keydown', go, true); if (on && current) start(current, true); };
  addEventListener('pointerdown', go, true); addEventListener('keydown', go, true);
}

let pinned = null; 
let held = null; 
function start(cue, again = false) {
  
  
  const st = Object.entries(els).find(([c, a]) => !isLoop(c) && c !== cue && !a.paused && !a.ended);
  if (st && isLoop(cue)) {
    held = cue;
    st[1].addEventListener('ended', () => { if (held === cue && current === cue && on) { held = null; start(cue); } }, { once: true });
    return;
  }
  held = null;
  for (const [c, a] of Object.entries(els)) if (c !== cue && !a.paused) fadeTo(a, 0, () => a.pause());
  if (cue === 'stop') { stopFallback(); return; }
  for (const c of preloadFor(cue)) el(c);
  const a = el(cue);
  if (a) {
    stopFallback();
    if (!again && !isLoop(cue)) a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => retryOnGesture());
    fadeTo(a, VOL);
    return;
  }
  
  const want = cue === 'battle' || cue === 'boss' ? 'chip' : isLoop(cue) ? 'lofi' : null;
  if (want === fallback) return;
  stopFallback();
  try {
    if (want === 'lofi') studioLofi(true);
    if (want === 'chip') { if (!chip) chip = new Chiptune({ seed: 1992 }); chip.start(); }
    fallback = want;
  } catch (e) { console.warn('[music]', e); }
}

function setOn(v) {
  on = !!v;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {  }
  if (!on) { for (const a of Object.values(els)) fadeTo(a, 0, () => a.pause()); stopFallback(); }
  else if (current) start(current);
  return on;
}




addEventListener('visibilitychange', () => {
  if (document.hidden) { for (const a of Object.values(els)) { clearInterval(fades.get(a)); fades.delete(a); a.pause(); } }
  else if (on && current) { const a = els[current]; if (a && isLoop(current)) { a.play().then(() => fadeTo(a, VOL)).catch(() => retryOnGesture()); } else if (isLoop(current)) start(current, true); }
});

export const music = {
  
  lofi: { isOn: () => on, toggle: () => setOn(!on), setOn, wasOn: pref },
  
  
  update(mode, B, sec, mood = null) {
    const cue = pinned || cueFor({ mode, battle: B ? { boss: !!(B.boss || B.script === 'guardian'), state: B.state, result: B.result } : null, sec, mood });
    if (cue === null || cue === current) return;
    current = cue;
    if (on) start(cue);
  },
  
  
  listen(cue) {
    pinned = cue || null;
    if (pinned) { current = pinned; start(pinned); return; }
    current = null;
    if (!on) { for (const a of Object.values(els)) fadeTo(a, 0, () => a.pause()); stopFallback(); }
  },
  listening: () => pinned,
  battle() {  },
  
  state: () => ({ on, current, fallback, playing: Object.entries(els).filter(([, a]) => !a.paused).map(([c, a]) => c + '@' + a.currentTime.toFixed(1) + ' v' + a.volume.toFixed(2)), failed: [...failed] }),
};
