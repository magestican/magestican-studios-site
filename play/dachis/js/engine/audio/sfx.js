



import { createAudioUnlock } from '../../vendor/arbelo/audio/iosUnlock.js';
import { readMuted, writeMuted } from '../../vendor/arbelo/ui/muteButton.js';

export function createSfx({ key, recipes }) {
  let ctx = null, master = null;
  let muted = readMuted(key, false);
  
  
  
  
  const playbackSession = () => { try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) {  } };
  playbackSession();
  
  
  let keepAlive = null;
  const silentLoop = () => {
    if (keepAlive || navigator.audioSession || !/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) || !('ontouchend' in document)) return;
    const n = 4410, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    keepAlive = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' })));
    keepAlive.loop = true; keepAlive.setAttribute('playsinline', ''); keepAlive.play().catch(() => { keepAlive = null; });
  };
  const ensure = () => {
    playbackSession(); silentLoop();
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const unlock = createAudioUnlock({ ensureContext: ensure, currentContext: () => ctx, isMuted: () => muted });
  if (unlock && unlock.install) unlock.install();
  else ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.addEventListener(ev, ensure, { once: true, capture: true }));

  const tone = (f, d, type = 'square', vol = 0.05, slide = 0, delay = 0) => {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(master); o.start(t0); o.stop(t0 + d + 0.02);
  };
  const noise = (d, vol = 0.05, freq = 1200, delay = 0) => {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay, n = Math.floor(ctx.sampleRate * d), buf = ctx.createBuffer(1, n, ctx.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(f).connect(g).connect(master); src.start(t0);
  };
  
  
  
  const files = {}, bufs = {}, sets = {};
  const decode = (name) => {
    if (bufs[name] || !ctx || !files[name]) return bufs[name];
    bufs[name] = files[name].then((ab) => ctx.decodeAudioData(ab.slice(0))).catch(() => { delete files[name]; return null; });
    return bufs[name];
  };
  const S = {
    load(name, url) { files[name] = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(url)))); files[name].catch(() => { delete files[name]; }); },
    
    
    takes(name, list) { sets[name] = { list, last: -1 }; },
    play(name) {
      ensure();
      const set = sets[name];
      if (set) { let i = Math.floor(Math.random() * set.list.length); if (i === set.last && set.list.length > 1) i = (i + 1) % set.list.length; set.last = i; if (files[set.list[i]]) name = set.list[i]; }
      const b = files[name] && decode(name);
      if (b && ctx && !muted) {
        const t = ctx.currentTime;
        b.then((buf) => { if (!buf || muted) { if (!buf && recipes[name]) recipes[name]({ tone, noise }); return; } const s = ctx.createBufferSource(); s.buffer = buf; s.connect(master); s.start(Math.max(t, ctx.currentTime)); });
        return;
      }
      const r = recipes[name]; if (r) r({ tone, noise });
    },
    warm(name) { ensure(); decode(name); }, 
    get muted() { return muted; },
    setMuted(m) { muted = m; writeMuted(key, m); if (master) master.gain.value = m ? 0 : 0.9; },
    context: () => ctx,
  };
  return S;
}
