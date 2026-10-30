



import { BUDGET, MIX, MUSIC, musicFile, SFX, sfxFiles } from './audioManifest.js';

const MUTE_KEY = 'rr-muted';


export function createSound(opts = {}) {
  const probe = document.createElement('audio');
  const opus = probe.canPlayType('audio/webm; codecs="opus"') !== '' && probe.canPlayType('audio/ogg; codecs="opus"') !== '';
  const musicExt = opus ? 'webm' : 'm4a';
  const sfxExt = opus ? 'ogg' : 'm4a';
  let muted = opts.muted ?? readMuted();
  
  let ctx = null;
  
  let master = null;
  
  const buffers = new Map();
  
  const playing = new Map();
  
  const nextVariant = new Map();
  
  let music = null;
  
  let wantedCue = null;
  
  const loops = fetch(new URL('../../audio/imported.json', import.meta.url))
    .then((r) => r.json())
    .then((j) => j.music ?? {})
    .catch(() => ({}));

  function readMuted() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function load(url) {
    let p = buffers.get(url);
    if (!p) {
      const c =  (ctx);
      p = fetch(new URL(`../../${url}`, import.meta.url))
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
        .then((b) => c.decodeAudioData(b))
        .catch(() => null);
      buffers.set(url, p);
    }
    return p;
  }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext ??  (window).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      for (const name of Object.keys(SFX)) for (const f of sfxFiles(name, sfxExt)) load(f);
      if (wantedCue) startMusic(wantedCue);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlock, { capture: true, passive: true });

  async function startMusic(cue) {
    const c =  (ctx);
    const url = musicFile(cue, musicExt);
    if (music) {
      const old = music;
      old.gain?.gain.setTargetAtTime(0, c.currentTime, 0.25);
      setTimeout(() => old.src?.stop(), 1500);
    }
    music = { cue, src: null, gain: null };
    if (!url) return;
    const mine = music;
    const buf = await load(url);
    if (!buf || music !== mine) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = cue !== 'stage_clear';
    
    const info = (await loops)[MUSIC[cue]];
    if (info?.seconds && info.seconds < buf.duration) src.loopEnd = info.seconds;
    if (info?.loopStart) src.loopStart = info.loopStart; 
    const gain = c.createGain();
    gain.gain.value = MIX.music;
    src.connect(gain).connect( (master));
    src.start();
    mine.src = src;
    mine.gain = gain;
  }

  return {
    
    music(cue) {
      if (wantedCue === cue) return;
      wantedCue = cue;
      if (ctx) startMusic(cue);
    },
    
    play(names) {
      if (!ctx || muted) return;
      const c = ctx;
      for (const name of new Set(names)) {
        const files = sfxFiles(name, sfxExt);
        if (!files.length || (playing.get(name) ?? 0) >= BUDGET.voicesPerSound) continue;
        const i = nextVariant.get(name) ?? 0;
        nextVariant.set(name, (i + 1) % files.length);
        load(files[i]).then((buf) => {
          if (!buf || muted) return;
          const src = c.createBufferSource();
          src.buffer = buf;
          const gain = c.createGain();
          gain.gain.value = MIX.sfx;
          src.connect(gain).connect( (master));
          playing.set(name, (playing.get(name) ?? 0) + 1);
          src.onended = () => playing.set(name, Math.max(0, (playing.get(name) ?? 1) - 1));
          src.start();
        });
      }
    },
    muted: () => muted,
    
    setMuted(on) {
      muted = on;
      try {
        localStorage.setItem(MUTE_KEY, on ? '1' : '0');
      } catch {}
      if (ctx && master) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.02);
    },
    
    state: () => ({ running: ctx?.state === 'running', cue: music?.src ? music.cue : null, wanted: wantedCue, muted }),
  };
}
