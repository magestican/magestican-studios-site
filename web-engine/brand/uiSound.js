





























import { UI_SOUNDS } from './uiSounds.js';
import { uiSoundOn, setUiSound, gameTree, isGamePage, UI_SOUND_KEY } from './uiSoundPref.js';

export { uiSoundOn, setUiSound, UI_SOUND_KEY };

const muteSources = new Set();


export function addUiMuteSource(fn) {
  if (typeof fn !== 'function') return () => {};
  muteSources.add(fn);
  return () => { muteSources.delete(fn); };
}


export function gameMuted() {
  for (const fn of muteSources) {
    try { if (fn()) return true; } catch {  }
  }
  return false;
}

let ctx = null;
let bus = null;

const buffers = new Map();
export const LATE_MS = 250;

function here() {
  try { return globalThis.location?.pathname ?? ''; } catch { return ''; }
}

function currentContext() { return ctx; }

function ensureContext() {
  if (ctx) return ctx;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (typeof AC !== 'function') return null;
    ctx = new AC();
    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(ctx.destination);
    preloadAll(ctx);
  } catch { ctx = null; bus = null; }
  return ctx;
}

function decode(c, ab) {
  
  return new Promise((res, rej) => {
    try {
      const p = c.decodeAudioData(ab, res, rej);
      if (p && typeof p.then === 'function') p.then(res, rej);
    } catch (e) { rej(e); }
  });
}

function load(c, name) {
  if (buffers.has(name)) return buffers.get(name);
  let p;
  try {
    const url = new URL(UI_SOUNDS[name].file, import.meta.url).href;
    p = globalThis.fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => decode(c, ab))
      .then((buf) => { buffers.set(name, buf); return buf; }, () => { buffers.set(name, null); return null; });
  } catch {
    buffers.set(name, null);
    return Promise.resolve(null);
  }
  buffers.set(name, p);
  return p;
}

function preloadAll(c) {
  if (typeof globalThis.fetch !== 'function') return;
  for (const name of Object.keys(UI_SOUNDS)) load(c, name);
}

function start(c, buf) {
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(bus);
  src.start(c.currentTime + 0.005);
}

function silenced() {
  return !isGamePage(here()) || !uiSoundOn() || gameMuted();
}


export function playUi(name) {
  try {
    if (silenced()) return false;
    const spec = Object.prototype.hasOwnProperty.call(UI_SOUNDS, name) ? UI_SOUNDS[name] : null;
    if (!spec) return false;
    const c = ensureContext();
    if (!c || !bus) return false;
    if (c.state === 'suspended') {
      try { c.resume()?.catch?.(() => {}); } catch {  }
    }
    const have = buffers.get(name);
    if (have && typeof have.then !== 'function') { start(c, have); return true; }
    if (have === null || typeof globalThis.fetch !== 'function') return false;
    const asked = Date.now();
    load(c, name).then((buf) => {
      try {
        if (buf && Date.now() - asked <= LATE_MS && !silenced()) start(c, buf);
      } catch {  }
    });
    return true;
  } catch {
    return false;
  }
}



let unlockStarted = false;
function bootUnlock() {
  if (unlockStarted) return;
  const tree = gameTree(here());
  if (!tree) return;
  unlockStarted = true;
  try {
    const url = new URL(`../../${tree}/shared/audio/iosUnlock.js`, import.meta.url).href;
    import(url).then((m) => {
      const u = m.createAudioUnlock({
        ensureContext: () => (silenced() ? null : ensureContext()),
        currentContext,
        isMuted: silenced,
      });
      u.install();
    }, () => {  });
  } catch {  }
}
bootUnlock();


export function _resetUiSoundPlayer() { ctx = null; bus = null; muteSources.clear(); buffers.clear(); }
