









import { panOf, levelAt, makeImpulse } from '../../../../web-engine/horror/audioSpace.js';





























export let silentEl = null;


export function silentWavDataUrl() {
  const samples = 1024;
  const bytes = 44 + samples * 2;
  const b = new Uint8Array(bytes);
  const view = new DataView(b.buffer);
  const ascii = (off, str) => { for (let i = 0; i < str.length; i += 1) b[off + i] = str.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, bytes - 8, true); ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true); view.setUint32(28, 44100, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, samples * 2, true);
  let bin = '';
  for (let i = 0; i < bytes; i += 1) bin += String.fromCharCode(b[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export function startSilentKeepAlive() {
  if (silentEl) return;
  try {
    const el = document.createElement('audio');
    el.loop = true;
    
    
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.volume = 0;
    el.src = silentWavDataUrl();
    el.play().catch(() => {  });
    silentEl = el;
  } catch {  }
}

export function installAudioUnlock() {
  const unlock = () => {
    const ctx = audio.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    
    try {
      const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {  }
    startSilentKeepAlive();
  };
  for (const t of ['pointerdown', 'touchend', 'keydown', 'click']) {
    window.addEventListener(t, unlock, true);
  }
  const wake = () => {
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    if (silentEl && silentEl.paused) silentEl.play().catch(() => {});
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('focus', wake);
  window.addEventListener('pageshow', wake);
}

export const audio = (() => {
  let ctx = null; let music = null; let sfx = null; let verb = null; let verbIn = null;
  let master = null;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let muted = false;
  const BUS = { music: 0.50, sfx: 0.85 };
  const applyMute = () => { if (master) master.gain.value = muted ? 0 : 1; };
  
  
  const ear = { px: 0, pz: 0, cx: 0, cz: -1, fx: 0, fz: 1 };
  return {
    get ctx() { return ctx; },
    get muted() { return muted; },
    get masterBus() { return master; },
    setMuted(on) { muted = !!on; applyMute(); return muted; },
    get musicBus() { return music; },
    get sfxBus() { return sfx; },
    get ear() { return ear; },
    ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = BUS.music; music.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = BUS.sfx; sfx.connect(master);
      
      applyMute();

      
      
      
      
      
      
      
      
      try {
        const ir = makeImpulse(ctx.sampleRate);
        const buf = ctx.createBuffer(2, ir.length, ctx.sampleRate);
        buf.copyToChannel(ir.left, 0);
        buf.copyToChannel(ir.right, 1);
        verb = ctx.createConvolver();
        verb.normalize = true;
        verb.buffer = buf;
        const wet = ctx.createGain(); wet.gain.value = 0.9;
        verb.connect(wet); wet.connect(sfx);
        verbIn = ctx.createGain(); verbIn.gain.value = 1;
        verbIn.connect(verb);
      } catch (e) {
        
        verb = null; verbIn = null;
      }
      return ctx;
    },

    











    at(x, z) {
      if (!ctx || !sfx) return null;
      const dist = Math.hypot(x - ear.px, z - ear.pz);
      const lv = levelAt(dist);
      if (!lv) return null;
      const air = ctx.createBiquadFilter();
      air.type = 'lowpass';
      air.frequency.value = lv.air;
      const pan = ctx.createStereoPanner
        ? ctx.createStereoPanner()
        : null;
      const dry = ctx.createGain();
      dry.gain.value = lv.gain;
      if (pan) {
        pan.pan.value = panOf({ x, z }, { x: ear.cx, z: ear.cz }, { x: ear.fx, z: ear.fz });
        air.connect(pan); pan.connect(dry);
      } else {
        air.connect(dry);
      }
      dry.connect(sfx);
      if (verbIn) {
        const send = ctx.createGain();
        send.gain.value = lv.wet * lv.gain;
        (pan || air).connect(send);
        send.connect(verbIn);
      }
      return air;
    },

    
    listen(px, pz, cam, target) {
      ear.px = px; ear.pz = pz;
      ear.cx = cam.x; ear.cz = cam.z;
      const fx = target.x - cam.x; const fz = target.z - cam.z;
      const m = Math.hypot(fx, fz) || 1;
      ear.fx = fx / m; ear.fz = fz / m;
    },
    get running() { return !!ctx && ctx.state === 'running'; },
    
    
    duck(on) {
      if (music && ctx) music.gain.setTargetAtTime(on ? 0.18 : 0.50, ctx.currentTime, 0.4);
    },
  };
})();
