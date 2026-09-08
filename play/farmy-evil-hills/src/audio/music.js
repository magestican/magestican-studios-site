








import { audio } from './unlock.js';



































export const tape = (() => {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const MANIFEST = '../../assets/music/music.json';
  let manifest = null;
  let loading = null;
  const buffers = new Map();
  let source = null;
  let side = -1;             
  let paused = -1;           
  let gain = null;

  async function load() {
    const ctx = audio.ensure();
    if (!ctx) return false;
    if (!manifest) {
      const r = await fetch(new URL(MANIFEST, import.meta.url));
      if (!r.ok) throw new Error(`music manifest ${r.status}`);
      manifest = await r.json();
    }
    
    
    
    await Promise.all(manifest.tracks.map(async (t) => {
      if (buffers.has(t.id)) return;
      const res = await fetch(new URL(`../../assets/music/${t.file}`, import.meta.url));
      if (!res.ok) throw new Error(`${t.file} ${res.status}`);
      buffers.set(t.id, await ctx.decodeAudioData(await res.arrayBuffer()));
    }));
    return true;
  }

  function stop() {
    if (source) { try { source.stop(); } catch {  } source.disconnect(); }
    source = null;
  }

  function play(i) {
    const ctx = audio.ensure();
    const track = manifest?.tracks?.[i];
    const buf = track && buffers.get(track.id);
    if (!ctx || !buf) return false;
    stop();
    if (!gain) { gain = ctx.createGain(); gain.gain.value = 0.85; gain.connect(audio.musicBus); }
    source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.loopStart = 0;
    
    
    
    
    source.loopEnd = (manifest.loopSamples ?? buf.length) / (manifest.sampleRate ?? ctx.sampleRate);
    source.connect(gain);
    source.start();
    return true;
  }

  return {
    
    toggle() {
      const ctx = audio.ensure();
      if (!ctx) return false;
      if (ctx.resume) ctx.resume();
      if (side >= 0 && side < 1) { side = 1; play(side); return true; }
      if (side === 1) { side = -1; stop(); return false; }
      side = 0;
      if (!loading) {
        loading = load().catch((e) => {
          
          
          
          console.warn('cassette:', e.message);
          side = -1;
          return false;
        });
      }
      loading.then((ok) => { if (ok !== false && side === 0) play(0); });
      return true;
    },
    
    
    
    
    
    
    pause() {
      if (!source || side < 0) return false;
      paused = side;
      stop();
      return true;
    },
    resume() {
      if (paused < 0) return false;
      const was = paused; paused = -1;
      if (!buffers.size) return false;
      side = was;
      return play(was);
    },
    playSide(i) {
      const ctx = audio.ensure();
      if (!ctx) return false;
      if (ctx.resume) ctx.resume();
      side = i;
      if (!loading) {
        loading = load().catch((e) => { console.warn('cassette:', e.message); side = -1; return false; });
      }
      loading.then((ok) => { if (ok !== false && side === i) play(i); });
      return true;
    },
    off() { side = -1; paused = -1; stop(); },
    
    get audible() { return !!source && audio.running; },
    get sideName() { return side === 1 ? 'SIDE B' : (side === 0 ? 'SIDE A' : 'OFF'); },
    get title() { return manifest?.tracks?.[side]?.title ?? ''; },
  };
})();
