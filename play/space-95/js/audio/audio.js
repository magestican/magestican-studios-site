



import { v } from '../site/assetUrl.js';
import { createPicker } from './cues.js';
import { MUSIC_TRACKS } from './musicManifest.js';
import { SFX } from './sfxManifest.js';

const VOICES_PER_SOUND = 4;
const MUTE_KEY = 's95.muted';
const LOAD_POOL = 6; 
const AFTER_CAP_MS = 4000; 





export function createAudio(base = 'assets/audio/', { sounds = Object.keys(SFX), after = Promise.resolve() } = {}) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return nullAudio();
  const ctx = new Ctx();
  const master = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  master.connect(limiter).connect(ctx.destination);
  const bus = {};
  for (const [name, gain] of [
    ['music', 0.7],
    ['sfx', 0.9],
    ['ambience', 0.6],
    ['ui', 0.8],
  ]) {
    bus[name] = ctx.createGain();
    bus[name].gain.value = gain;
    bus[name].connect(master);
  }
  let muted = readMuted();
  master.gain.value = muted ? 0 : 1;

  const probe = document.createElement('audio');
  const ext = probe.canPlayType('audio/ogg; codecs="opus"') || probe.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'm4a';
  
  const buffers = new Map();
  
  const playing = new Map();
  const pick = createPicker();

  
  
  
  
  
  
  const requested = new Set();
  
  const firstQ = [];
  
  const restQ = [];
  let active = 0;
  let open = false;
  let firstLeft = 0;
  
  let firstDone = () => {};
  const ready = new Promise((r) => {
    firstDone = r;
  });
  const fetchOne = async ( t) => {
    const url = `${base}sfx/${t.name}/${t.file}.${ext}`;
    try {
      const res = await fetch(v(url));
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      const list = buffers.get(t.name) ?? [];
      list.push(buf);
      buffers.set(t.name, list);
    } catch (err) {
      console.warn('sfx', t.name,  (err).message);
    }
  };
  const pump = () => {
    while (open && active < LOAD_POOL && (firstQ.length || restQ.length)) {
      const t =  (firstQ.shift() ?? restQ.shift());
      active++;
      fetchOne(t).then(() => {
        active--;
        if (t.first && --firstLeft === 0) firstDone();
        pump();
      });
    }
  };
  
  const want = (name, urgent = false) => {
    const info = SFX[name];
    if (!info || requested.has(name)) return;
    requested.add(name);
    const [head, ...tail] = info.files;
    firstLeft++;
    (urgent ? firstQ.unshift.bind(firstQ) : firstQ.push.bind(firstQ))({ name, file: head, first: true });
    for (const file of tail) restQ.push({ name, file, first: false });
    pump();
  };
  for (const n of sounds) want(n);
  if (!firstLeft) firstDone();
  Promise.race([after, new Promise((r) => setTimeout(r, AFTER_CAP_MS))])
    .catch(() => {})
    .then(() => {
      open = true;
      pump();
    });

  
  
  
  let musicEl = null;
  let musicWanted = null;
  const startMusic = () => {
    if (!musicWanted || musicEl) return;
    musicEl = new Audio(v(`${base}music/${musicWanted}/${musicWanted}.${ext}`));
    musicEl.loop = true;
    musicEl.crossOrigin = 'anonymous';
    ctx.createMediaElementSource(musicEl).connect(bus.music);
    musicEl.play().catch(() => {
      musicEl = null; 
    });
  };

  const unlock = () => {
    if (ctx.state !== 'running') ctx.resume();
    startMusic();
    const b = ctx.createBuffer(1, 1, ctx.sampleRate); 
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start();
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { passive: true });

  return {
    ready,
    
    has: (name) => requested.has(name),
    
    want: (name) => want(name, true),
    
    music(id) {
      if (id === musicWanted) return;
      if (musicEl) {
        musicEl.pause(); 
        musicEl = null;
      }
      musicWanted = id;
      if (ctx.state === 'running') startMusic();
    },
    




    musicFirst(ids) {
      return this.music(ids.find((id) => MUSIC_TRACKS.includes(id)) ?? ids[ids.length - 1]);
    },
    
    play(name, o = {}) {
      const list = buffers.get(name);
      if (!list) want(name, true); 
      if (!list || muted || ctx.state !== 'running') return;
      const voices = playing.get(name) ?? [];
      if (voices.length >= VOICES_PER_SOUND) voices.shift()?.stop();
      const src = ctx.createBufferSource();
      src.buffer = list[pick(name, list.length)];
      src.playbackRate.value = o.rate ?? 1;
      const g = ctx.createGain();
      g.gain.value = o.volume ?? 1;
      src.connect(g).connect(bus[o.bus ?? 'sfx']);
      src.onended = () => {
        const i = voices.indexOf(src);
        if (i >= 0) voices.splice(i, 1);
      };
      voices.push(src);
      playing.set(name, voices);
      src.start();
    },
    toggleMute() {
      muted = !muted;
      master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
      try {
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
      } catch {}
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function nullAudio() {
  return {
    ready: Promise.resolve(),
    has: () => false,
    want() {},
    play() {},
    music() {},
    musicFirst() {},
    toggleMute: () => true,
    muted: true,
  };
}
