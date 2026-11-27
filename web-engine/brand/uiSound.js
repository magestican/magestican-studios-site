





























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


function loadKey(c, key, url) {
  if (buffers.has(key)) return buffers.get(key);
  let p;
  try {
    p = globalThis.fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => decode(c, ab))
      .then((buf) => { buffers.set(key, buf); return buf; }, () => { buffers.set(key, null); return null; });
  } catch {
    buffers.set(key, null);
    return Promise.resolve(null);
  }
  buffers.set(key, p);
  return p;
}

function load(c, name) {
  let url;
  try { url = new URL(UI_SOUNDS[name].file, import.meta.url).href; } catch { buffers.set(name, null); return Promise.resolve(null); }
  return loadKey(c, name, url);
}








const fileUrls = new Set();


export function preloadFiles(urls) {
  for (const u of urls || []) {
    const url = String(u);
    fileUrls.add(url);
    if (ctx && typeof globalThis.fetch === 'function') loadKey(ctx, url, url);
  }
}





let ownPlayer = null;
let ownExplicit = false;


export function useOwnUiSounds(fn) {
  ownPlayer = typeof fn === 'function' ? fn : null;
  ownExplicit = ownPlayer !== null;
}






export function claimUiSounds(fn) {
  if (ownExplicit || typeof fn !== 'function') return;
  ownPlayer = fn;
}

function preloadAll(c) {
  if (typeof globalThis.fetch !== 'function') return;
  if (!ownPlayer) for (const name of Object.keys(UI_SOUNDS)) load(c, name);
  for (const url of fileUrls) loadKey(c, url, url);
}






const live = new Map();
const pending = new Map();

function start(c, buf, gain = 1, key = null, rate = 1) {
  const src = c.createBufferSource();
  
  if (rate !== 1 && Number.isFinite(rate) && rate > 0) src.playbackRate.value = rate;
  if (key !== null) {
    if (!live.has(key)) live.set(key, new Set());
    live.get(key).add(src);
    src.onended = () => { live.get(key)?.delete(src); };
  }
  src.buffer = buf;
  if (gain !== 1 && Number.isFinite(gain) && gain >= 0) {
    const g = c.createGain();
    g.gain.value = gain;
    g.connect(bus);
    src.connect(g);
  } else {
    src.connect(bus);
  }
  src.start(c.currentTime + 0.005);
}

function silenced() {
  return !isGamePage(here()) || !uiSoundOn() || gameMuted();
}


function play(key, fetchIt, gain = 1, rate = 1) {
  if (silenced()) return false;
  const c = ensureContext();
  if (!c || !bus) return false;
  if (c.state === 'suspended') {
    try { c.resume()?.catch?.(() => {}); } catch {  }
  }
  const have = buffers.get(key);
  if (have && typeof have.then !== 'function') { start(c, have, gain, key, rate); return true; }
  if (have === null || typeof globalThis.fetch !== 'function') return false;
  const asked = Date.now();
  const ask = Symbol('ask');
  if (!pending.has(key)) pending.set(key, new Set());
  pending.get(key).add(ask);
  fetchIt(c).then((buf) => {
    try {
      const skipped = !pending.get(key)?.delete(ask);
      if (buf && !skipped && Date.now() - asked <= LATE_MS && !silenced()) start(c, buf, gain, key, rate);
    } catch {  }
  });
  return true;
}


export function playUi(name) {
  try {
    if (!Object.prototype.hasOwnProperty.call(UI_SOUNDS, name)) return false;
    if (ownPlayer) {
      if (silenced()) return false;
      ownPlayer(name);
      return true;
    }
    return play(name, (c) => load(c, name));
  } catch {
    return false;
  }
}





export function playFile(url, gain = 1, rate = 1) {
  try {
    const key = String(url ?? '');
    if (!key) return false;
    fileUrls.add(key);
    return play(key, (c) => loadKey(c, key, key), gain, rate);
  } catch {
    return false;
  }
}


export function stopFile(url) {
  try {
    const key = String(url ?? '');
    pending.delete(key);
    for (const src of live.get(key) || []) {
      try { src.stop(); } catch {  }
    }
    live.delete(key);
  } catch {  }
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


export function _resetUiSoundPlayer() { ownPlayer = null; ownExplicit = false; ctx = null; bus = null; muteSources.clear(); buffers.clear(); fileUrls.clear(); live.clear(); pending.clear(); }
