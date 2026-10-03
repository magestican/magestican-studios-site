











export const UI_SOUND_KEY = 'magestican.ui.sound';

let session = null; 


export function uiSoundOn(store = null) {
  try {
    const s = store ?? globalThis.localStorage;
    const raw = s?.getItem?.(UI_SOUND_KEY);
    if (raw != null) return raw !== 'off';
  } catch {  }
  return session ?? true;
}


export function setUiSound(on, store = null) {
  const v = !!on;
  session = v;
  try {
    const s = store ?? globalThis.localStorage;
    s?.setItem?.(UI_SOUND_KEY, v ? 'on' : 'off');
  } catch {  }
  return v;
}


export function _resetUiSoundSession() { session = null; }






const GAME_PATH = /^\/(play|games)\/(?!shared\/)[^/]+\//;


export function gameTree(pathname) {
  const m = typeof pathname === 'string' ? GAME_PATH.exec(pathname) : null;
  return m ? m[1] : null;
}

export function isGamePage(pathname) {
  return gameTree(pathname) !== null;
}
