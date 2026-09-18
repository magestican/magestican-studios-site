































import { installPlatform, offlineLine, offlineList } from 'moon/play/install.mjs';











const SWEEP_DEBOUNCE_MS = 1200;












const RETRY_MS = 1000;
const RETRY_LIMIT = 30;












try {
  if (typeof performance !== 'undefined' && performance.setResourceTimingBufferSize) {
    performance.setResourceTimingBufferSize(3000);
  }
} catch {  }

export function createOffline({ onChange = () => {} } = {}) {
  const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    && typeof window !== 'undefined' && window.isSecureContext !== false;
  const wanted = !/(^|[?&])sw=off(&|$)/.test(String(window.location.search));

  const state = {
    supported, wanted, registered: false, controlling: false,
    files: 0, kept: 0, failed: 0, sweeps: 0, error: null,
    canPrompt: false, prompted: 0, outcome: null,
    standalone: isStandalone(),
    platform: installPlatform({
      userAgent: navigator.userAgent,
      standalone: isStandalone(),
      touchPoints: navigator.maxTouchPoints || 0,
    }),
  };

  let deferredPrompt = null;
  let registration = null;
  let sweptOnce = false;
  let debounce = 0;
  let tries = 0;
  
  
  
  
  
  const seen = new Set();
  const sent = new Set();
  
  state.controlling = Boolean(supported && navigator.serviceWorker.controller);
  
  
  
  if (supported && wanted) watchResources();

  function changed() {
    state.controlling = Boolean(supported && navigator.serviceWorker.controller);
    
    
    
    
    
    if (state.controlling && sweptOnce && state.files === 0) sweep();
    onChange(state);
  }

  
  
  
  if (supported) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.type !== 'kept-offline') return;
      state.files = Number(d.files) || 0;
      state.kept = Number(d.kept) || 0;
      state.failed = Number(d.failed) || 0;
      state.sweeps += 1;
      changed();
    });
    navigator.serviceWorker.addEventListener('controllerchange', changed);
  }

  
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    state.canPrompt = true;
    changed();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    state.canPrompt = false;
    state.outcome = 'installed';
    changed();
  });

  const api = {
    state,
    get line() {
      return offlineLine({ supported, controlling: state.controlling || state.registered, files: state.files });
    },
    get steps() { return state.platform; },

    
    async register() {
      if (!supported || !wanted || registration) return null;
      try {
        registration = await navigator.serviceWorker.register('sw.js');
        state.registered = true;
        changed();
      } catch (e) {
        
        
        state.error = String((e && e.message) || e);
        changed();
      }
      return registration;
    },

    



    gameReady() {
      if (!supported || !wanted || sweptOnce) return false;
      sweptOnce = true;
      keepTrying();
      return true;
    },

    
    async promptInstall() {
      if (!deferredPrompt) return null;
      state.prompted += 1;
      const e = deferredPrompt;
      deferredPrompt = null;
      state.canPrompt = false;
      e.prompt();
      const choice = await e.userChoice.catch(() => null);
      state.outcome = (choice && choice.outcome) || null;
      changed();
      return state.outcome;
    },
  };

  
  function keepTrying() {
    sweep();
    if (state.files > 0 || tries >= RETRY_LIMIT) return;
    tries += 1;
    window.setTimeout(keepTrying, RETRY_MS);
  }

  







  function watchResources() {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) seen.add(e.name);
        
        
        
        
        if (!sweptOnce || debounce) return;
        debounce = window.setTimeout(() => { debounce = 0; sweep(); }, SWEEP_DEBOUNCE_MS);
      });
      obs.observe({ type: 'resource', buffered: true });
    } catch {  }
  }

  







  function sweep() {
    const worker = navigator.serviceWorker.controller;
    
    
    if (!worker) return;
    try {
      for (const e of performance.getEntriesByType('resource')) seen.add(e.name);
    } catch {  }
    const list = offlineList([...seen], { origin: window.location.origin }).filter((u) => !sent.has(u));
    if (!list.length) return;
    for (const u of list) sent.add(u);
    worker.postMessage({ type: 'keep-offline', urls: list });
  }

  return api;
}


export function isStandalone() {
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) return true;
  } catch {  }
  
  return Boolean(window.navigator && window.navigator.standalone);
}
