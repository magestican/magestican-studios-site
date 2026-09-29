






















































export function silentWavDataUrl(samples = 1024, rate = 22050) {
  const bytes = 44 + samples * 2;
  const b = new Uint8Array(bytes);
  const view = new DataView(b.buffer);
  const ascii = (off, str) => { for (let i = 0; i < str.length; i += 1) b[off + i] = str.charCodeAt(i); };
  ascii(0, 'RIFF');
  view.setUint32(4, bytes - 8, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);        
  view.setUint16(20, 1, true);         
  view.setUint16(22, 1, true);         
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);  
  view.setUint16(32, 2, true);         
  view.setUint16(34, 16, true);        
  ascii(36, 'data');
  view.setUint32(40, samples * 2, true);
  let bin = '';
  for (let i = 0; i < bytes; i += 1) bin += String.fromCharCode(b[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}


export const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'keydown', 'click'];


export const WAKE_EVENTS = ['visibilitychange', 'focus', 'pageshow'];





















export function createAudioUnlock({
  ensureContext, currentContext = () => null, isMuted = () => false,
}) {
  let keepAlive = null;
  let installed = false;

  
  function feed(ctx) {
    try {
      const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {  }
  }

  
  function startKeepAlive() {
    if (isMuted()) return;
    
    
    
    try {
      if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = 'playback';
    } catch {  }

    if (keepAlive && !keepAlive.paused) return;
    try {
      if (!keepAlive) {
        const el = document.createElement('audio');
        el.loop = true;
        
        
        el.setAttribute('playsinline', '');
        el.setAttribute('webkit-playsinline', '');
        el.volume = 0;
        el.src = silentWavDataUrl();
        keepAlive = el;
      }
      keepAlive.play().catch(() => {  });
    } catch {  }
  }

  function stopKeepAlive() {
    try { keepAlive?.pause(); } catch {  }
  }

  
  function unlock() {
    const ctx = ensureContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    feed(ctx);
    startKeepAlive();
    return true;
  }

  





  function wake() {
    const ctx = currentContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (keepAlive && keepAlive.paused && !isMuted()) {
      keepAlive.play().catch(() => {  });
    }
  }

  return {
    unlock,
    wake,
    stopKeepAlive,
    








    install() {
      if (installed) return;
      installed = true;
      for (const type of UNLOCK_EVENTS) {
        globalThis.addEventListener?.(type, unlock, true);
      }
      globalThis.document?.addEventListener('visibilitychange', () => {
        if (!globalThis.document.hidden) wake();
      });
      globalThis.addEventListener?.('focus', wake);
      globalThis.addEventListener?.('pageshow', wake);
    },
    







    report() {
      const ua = globalThis.navigator?.userActivation ?? null;
      return {
        keepAlive: !!keepAlive && !keepAlive.paused,
        session: globalThis.navigator?.audioSession?.type ?? 'unsupported',
        activated: ua ? { sticky: ua.hasBeenActive, active: ua.isActive } : 'unsupported',
      };
    },
  };
}
