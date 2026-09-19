















































































































export const BUS_NAMES = Object.freeze(['music', 'sfx', 'ambience', 'voice']);




export const RUNNING = 'running';






export const DEAD_S = 3;


export const QUIET = 1e-4;
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
  limiter = null,
  
  
  
  
  
  silenceRule = null,
  
  
  onDead = null,
} = {}) {
  const stored = readSettings(storage);
  const levels = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) levels[k] = stored[k];
  
  
  const state = { unlocked: false, muted: Boolean(muted) || stored.muted, speaking: false, suspends: 0, resumes: 0,
    
    level: 0, quietSince: null, deadS: 0, dead: false, deaths: 0 };

  let ctx = null, master = null, limit = null, tap = null, taps = null;
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
      
      
      
      limit = limiter ? ctx.createDynamicsCompressor() : null;
      if (limit) {
        for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) {
          if (limiter[k] !== undefined) limit[k].value = limiter[k];
        }
        master.connect(limit);
        limit.connect(ctx.destination);
      } else {
        master.connect(ctx.destination);
      }
      
      
      
      
      tap = null;
      try {
        tap = ctx.createAnalyser();
        tap.fftSize = 2048;
        (limit || master).connect(tap);
        taps = new Float32Array(tap.fftSize);
      } catch { tap = null; }   
      for (const name of BUS_NAMES) {
        const bus = ctx.createGain();
        bus.gain.value = gainOf(name);
        bus.connect(master);
        buses[name] = bus;
      }
      watchContext();
      if (ctx.state !== RUNNING) { try { ctx.resume().catch(() => {}); } catch {  } }
      state.unlocked = true;
    } catch {
      ctx = null;
      master = null;
      limit = null;
      tap = null;
      for (const name of BUS_NAMES) delete buses[name];
    }
  }

  
  
  
  const GESTURES = ['pointerdown', 'keydown', 'touchend'];
  let armed = false;
  
  
  
  const isRunning = () => Boolean(ctx) && ctx.state === RUNNING;
  function disarm() {
    if (!armed || !target) return;
    armed = false;
    for (const type of GESTURES) target.removeEventListener(type, onGesture, true);
  }
  function arm() {
    if (armed || !target) return;
    armed = true;
    for (const type of GESTURES) target.addEventListener(type, onGesture, true);
  }
  
  function settle() {
    if (isRunning()) disarm(); else arm();
  }
  function tryResume() {
    if (!ctx || isRunning()) return false;
    state.resumes += 1;
    try {
      const r = ctx.resume();
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch {  }
    
    settle();
    return true;
  }
  function onGesture() {
    unlock();
    tryResume();
    settle();
  }
  arm();

  
  
  
  function watchContext() {
    if (!ctx) return;
    try { ctx.onstatechange = settle; } catch {  }
  }

  
  
  
  
  function onShown() {
    if (!ctx) return;
    tryResume();
    arm();
  }
  function onVisibility() {
    if (!ctx) return;
    if (doc && doc.hidden) {
      state.suspends += 1;
      try { ctx.suspend(); } catch {  }
      arm();
      return;
    }
    onShown();
  }
  if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', onVisibility);
  if (target && target.addEventListener) {
    target.addEventListener('pageshow', onShown);
    target.addEventListener('focus', onShown);
  }

  function silenceNow() {
    const now = { muted: state.muted, unlocked: state.unlocked, ctxState: ctx ? ctx.state : 'none', master: levels.master, dead: state.dead };
    return silenceRule ? silenceRule(now) : { silent: state.muted, reason: state.muted ? 'muted' : null, short: '', line: '' };
  }

  





  function listen(nowS, { expecting = false } = {}) {
    if (!tap || !taps || !Number.isFinite(nowS)) return state;
    let peak = 0;
    try {
      tap.getFloatTimeDomainData(taps);
      for (let i = 0; i < taps.length; i++) { const v = taps[i] < 0 ? -taps[i] : taps[i]; if (v > peak) peak = v; }
    } catch { return state; }
    state.level = peak;
    
    
    
    
    const shouldHear = expecting && !state.muted && levels.master > 0 && isRunning();
    if (!shouldHear || peak > QUIET) {
      state.quietSince = null;
      state.deadS = 0;
      state.dead = false;
      return state;
    }
    if (state.quietSince === null) state.quietSince = nowS;
    state.deadS = Math.max(0, nowS - state.quietSince);
    if (state.deadS >= DEAD_S && !state.dead) {
      state.dead = true;
      state.deaths += 1;
      
      if (onDead) { try { onDead(); } catch {  } }
    }
    return state;
  }

  function persist() {
    writeSettings(storage, { ...levels, muted: state.muted });
  }

  return {
    unlock,
    get ctx() { return ctx; },
    get master() { return master; },
    get limiter() { return limit; },
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
    




    get silence() { return silenceNow(); },
    listen,
    get analyser() { return tap; },
    get state() {
      
      
      
      return { unlocked: state.unlocked, muted: state.muted, speaking: state.speaking, ctx: ctx ? ctx.state : 'none',
        levels: { ...levels }, suspends: state.suspends, resumes: state.resumes,
        limited: Boolean(limit), reduction: limit && typeof limit.reduction === 'number' ? limit.reduction : 0,
        silence: silenceNow(),
        level: state.level, deadS: state.deadS, dead: state.dead, deaths: state.deaths };
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
