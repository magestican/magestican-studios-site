



































































export const SOUND_ON_LABEL = 'Sound: on';
export const SOUND_OFF_LABEL = 'Sound: off';


export function soundLabel(muted) {
  return muted ? SOUND_OFF_LABEL : SOUND_ON_LABEL;
}








export function soundDescription(muted) {
  return muted
    ? 'Sound is off. Press to turn the sound on.'
    : 'Sound is on. Press to turn the sound off.';
}

















const session = new Map();


export function readMuted(key, fallback = false, store = null) {
  try {
    const s = store ?? globalThis.localStorage;
    const raw = s?.getItem?.(key);
    if (raw != null) return raw === '1';
  } catch {  }
  if (session.has(key)) return session.get(key);
  return fallback;
}


export function writeMuted(key, muted, store = null) {
  const on = !!muted;
  session.set(key, on);
  try {
    const s = store ?? globalThis.localStorage;
    s?.setItem?.(key, on ? '1' : '0');
  } catch {  }
  return on;
}


export function _resetSessionMemory() { session.clear(); }




















const toggles = new Set();







const listeners = new Set();


export function onSoundChange(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}






let syncing = false;


export function syncSoundToggles() {
  if (syncing) return;
  syncing = true;
  try {
    for (const t of toggles) t.sync();
  
  
  
  
    for (const fn of listeners) {
      try { fn(); } catch {  }
    }
  } finally { syncing = false; }
}


export function _mountedCount() { return toggles.size; }




























export function mountSoundToggle({
  host, isMuted, setMuted, className = '', id = '', title = '', prepend = false,
  label = soundLabel, describe = soundDescription, doc = null,
}) {
  const d = doc || host?.ownerDocument || globalThis.document;
  if (!host || !d?.createElement) return null;

  const button = d.createElement('button');
  
  
  
  button.type = 'button';
  if (id) button.id = id;
  if (className) button.className = className;

  const entry = {
    sync() {
      
      
      
      
      const muted = !!isMuted();
      button.textContent = label(muted);
      button.setAttribute('aria-label', describe(muted));
      button.title = title || describe(muted);
      
      
      button.dataset.muted = muted ? '1' : '0';
    },
    dispose() {
      toggles.delete(entry);
      button.remove?.();
    },
    button,
  };

  button.addEventListener('click', (e) => {
    e?.preventDefault?.();
    setMuted(!isMuted());
    
    syncSoundToggles();
  });

  if (prepend && host.firstChild) host.insertBefore(button, host.firstChild);
  else host.appendChild(button);

  toggles.add(entry);
  entry.sync();
  return entry;
}
