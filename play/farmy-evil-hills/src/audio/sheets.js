








import { audio } from './unlock.js';













export const gunSfx = { shots: 0, dry: 0, fromSheet: 0 };






































export const voxSheet = (() => {
  let manifest = null;
  let buffer = null;
  let loading = null;
  let failed = null;
  let played = 0;
  let lastId = null;

  async function load() {
    const ctx = audio.ensure();
    if (!ctx) return false;
    if (buffer) return true;
    if (failed) return false;
    if (!loading) {
      loading = (async () => {
        const r = await fetch(new URL('../../assets/sfx/vox.json', import.meta.url));
        if (!r.ok) throw new Error(`vox manifest ${r.status}`);
        manifest = await r.json();
        const a = await fetch(new URL('../../assets/sfx/vox.webm', import.meta.url));
        if (!a.ok) throw new Error(`vox.webm ${a.status}`);
        buffer = await ctx.decodeAudioData(await a.arrayBuffer());
        return true;
      })().catch((e) => { failed = String(e && e.message ? e.message : e); loading = null; return false; });
    }
    return loading;
  }

  
  function speak(id, gain = 0.85) {
    const ctx = audio.ensure();
    if (!ctx || !audio.running || !buffer || !manifest) return 0;
    const clip = manifest.clips[id];
    if (!clip) return 0;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(audio.sfxBus);
    src.start(ctx.currentTime + 0.01, clip.offset, clip.duration);
    played += 1;
    lastId = id;
    return clip.duration;
  }

  return {
    load,
    speak,
    get ready() { return !!buffer; },
    get failure() { return failed; },
    get played() { return played; },
    get lastId() { return lastId; },
  };
})();

export const sfxSheet = (() => {
  const MANIFEST = '../../assets/sfx/sfx.json';
  let manifest = null;
  let buffer = null;
  let loading = null;
  let failed = null;
  
  
  
  const last = new Map();
  let played = 0;
  
  
  
  const byEffect = Object.create(null);

  async function load() {
    const ctx = audio.ensure();
    if (!ctx) return false;
    if (buffer) return true;
    if (failed) return false;
    if (!loading) {
      loading = (async () => {
        const r = await fetch(new URL(MANIFEST, import.meta.url));
        if (!r.ok) throw new Error(`sfx manifest ${r.status}`);
        manifest = await r.json();
        const a = await fetch(new URL('../../assets/sfx/sfx.webm', import.meta.url));
        if (!a.ok) throw new Error(`sfx.webm ${a.status}`);
        buffer = await ctx.decodeAudioData(await a.arrayBuffer());
        return true;
      })().catch((e) => { failed = String(e && e.message ? e.message : e); loading = null; return false; });
    }
    return loading;
  }

  

















  function play(effect, {
    gain = 1, rate = 1, dest = null, when = 0, loop = false,
  } = {}) {
    const ctx = audio.ensure();
    if (!ctx || !audio.running || !buffer || !manifest) return false;
    const names = manifest.effects[effect];
    if (!names || !names.length) return false;
    let name;
    if (names.length === 1) {
      [name] = names;
    } else {
      const prev = last.get(effect);
      const pool = names.filter((n) => n !== prev);
      name = pool[Math.floor(Math.random() * pool.length)];
    }
    last.set(effect, name);
    const clip = manifest.clips[name];
    if (!clip) return false;
    if (loop && !clip.wrap) return false;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(dest || audio.sfxBus);
    const t = ctx.currentTime + Math.max(0, when) + 0.002;
    if (loop) {
      src.loop = true;
      src.loopStart = clip.offset;
      src.loopEnd = clip.offset + clip.duration - clip.wrap;
      
      
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(gain, t, 0.4);
      src.start(t, clip.offset);
      played += 1;
      byEffect[effect] = (byEffect[effect] || 0) + 1;
      return {
        gain: g,
        stop(fadeSec = 0.6) {
          g.gain.setTargetAtTime(0.0001, ctx.currentTime, Math.max(0.02, fadeSec / 3));
          
          
          
          setTimeout(() => { try { src.stop(); } catch {  } }, fadeSec * 1000 + 400);
        },
      };
    }
    
    
    src.start(t, clip.offset, clip.duration / rate);
    played += 1;
    byEffect[effect] = (byEffect[effect] || 0) + 1;
    return true;
  }

  return {
    load,
    play,
    get ready() { return !!buffer; },
    get failure() { return failed; },
    get played() { return played; },
    get byEffect() { return { ...byEffect }; },
    
    
    get effectNames() { return manifest ? Object.keys(manifest.effects) : null; },
  };
})();
