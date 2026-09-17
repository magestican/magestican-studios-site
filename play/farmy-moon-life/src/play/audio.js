




































export const BUS_NAMES = Object.freeze(['music', 'sfx', 'ambience', 'voice']);
export const AUDIO_KEY = 'fml.audio';
export const DEFAULT_SETTINGS = Object.freeze({ master: 0.9, music: 0.7, sfx: 1, ambience: 0.6, voice: 1 });




export const DUCK_DB = -6;
export const DUCK = Math.pow(10, DUCK_DB / 20);   
export const DUCK_IN_S = 0.08;
export const DUCK_OUT_S = 0.4;
export const DUCKED = Object.freeze(['music', 'ambience']);

const FADE_S = 0.02;

export const clampLevel = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
};






export const duckedLevel = (level, speaking) => (speaking ? level * DUCK : level);


export function readSettings(storage) {
  const out = { ...DEFAULT_SETTINGS, muted: false };
  try {
    const raw = storage && storage.getItem(AUDIO_KEY);
    if (!raw) return out;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return out;
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      if (saved[k] !== undefined) out[k] = clampLevel(saved[k], DEFAULT_SETTINGS[k]);
    }
    out.muted = Boolean(saved.muted);
  } catch {  }
  return out;
}

export function writeSettings(storage, settings) {
  try {
    if (!storage) return false;
    const out = { muted: Boolean(settings.muted) };
    for (const k of Object.keys(DEFAULT_SETTINGS)) out[k] = clampLevel(settings[k], DEFAULT_SETTINGS[k]);
    storage.setItem(AUDIO_KEY, JSON.stringify(out));
    return true;
  } catch { return false; }
}

const defaultStorage = () => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function createAudio({
  muted = false,
  target = typeof window === 'undefined' ? null : window,
  doc = typeof document === 'undefined' ? null : document,
  storage = defaultStorage(),
} = {}) {
  const stored = readSettings(storage);
  const levels = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) levels[k] = stored[k];
  
  
  const state = { unlocked: false, muted: Boolean(muted) || stored.muted, speaking: false, suspends: 0, resumes: 0 };

  let ctx = null, master = null;
  const buses = {};

  const gainOf = (name) => (name === 'master'
    ? (state.muted ? 0 : levels.master)
    : duckedLevel(levels[name], state.speaking && DUCKED.includes(name)));

  function ramp(node, to, seconds) {
    if (!node || !ctx) return;
    const now = ctx.currentTime;
    try {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(node.gain.value, now);
      node.gain.linearRampToValueAtTime(to, now + seconds);
    } catch {  }
  }

  function unlock() {
    if (ctx) return;
    const w = target || (typeof window === 'undefined' ? null : window);
    const AC = w && (w.AudioContext || w.webkitAudioContext);
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = gainOf('master');
      master.connect(ctx.destination);
      for (const name of BUS_NAMES) {
        const bus = ctx.createGain();
        bus.gain.value = gainOf(name);
        bus.connect(master);
        buses[name] = bus;
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      state.unlocked = true;
    } catch {
      ctx = null;
      master = null;
      for (const name of BUS_NAMES) delete buses[name];
    }
  }

  
  
  
  const GESTURES = ['pointerdown', 'keydown', 'touchend'];
  let armed = false;
  function disarm() {
    if (!armed || !target) return;
    armed = false;
    for (const type of GESTURES) target.removeEventListener(type, onGesture, true);
  }
  function onGesture() {
    unlock();
    if (ctx && ctx.state === 'suspended') { state.resumes += 1; ctx.resume().catch(() => {}); }
    if (ctx && ctx.state !== 'suspended') disarm();
  }
  function arm() {
    if (armed || !target) return;
    armed = true;
    for (const type of GESTURES) target.addEventListener(type, onGesture, true);
  }
  arm();

  function onVisibility() {
    if (!ctx) return;
    if (doc && doc.hidden) {
      state.suspends += 1;
      try { ctx.suspend(); } catch {  }
      return;
    }
    
    
    
    state.resumes += 1;
    try { ctx.resume().catch(() => {}); } catch {  }
    arm();
  }
  if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', onVisibility);

  function persist() {
    writeSettings(storage, { ...levels, muted: state.muted });
  }

  return {
    unlock,
    get ctx() { return ctx; },
    get master() { return master; },
    get music() { return buses.music || null; },
    get sfx() { return buses.sfx || null; },
    get ambience() { return buses.ambience || null; },
    get voice() { return buses.voice || null; },
    bus(name) { return buses[name] || null; },
    get unlocked() { return state.unlocked; },
    get muted() { return state.muted; },
    get speaking() { return state.speaking; },
    get levels() { return { ...levels }; },
    get contextState() { return ctx ? ctx.state : 'none'; },
    get state() {
      return { unlocked: state.unlocked, muted: state.muted, speaking: state.speaking, ctx: ctx ? ctx.state : 'none',
        levels: { ...levels }, suspends: state.suspends, resumes: state.resumes };
    },

    setMuted(m) {
      state.muted = Boolean(m);
      ramp(master, gainOf('master'), FADE_S);
      persist();
      return state.muted;
    },

    
    setLevel(name, v) {
      if (!(name in levels)) return false;
      levels[name] = clampLevel(v, levels[name]);
      if (name === 'master') ramp(master, gainOf('master'), FADE_S);
      else ramp(buses[name], gainOf(name), FADE_S);
      persist();
      return true;
    },

    



    duck(speaking) {
      const want = Boolean(speaking);
      if (want === state.speaking) return false;
      state.speaking = want;
      const seconds = want ? DUCK_IN_S : DUCK_OUT_S;
      for (const name of DUCKED) ramp(buses[name], gainOf(name), seconds);
      return true;
    },
  };
}
