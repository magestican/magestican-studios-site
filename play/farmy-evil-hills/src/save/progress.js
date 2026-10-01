








import { trackEvent } from 'arbelo/analytics';




export function loadAccess() {
  try { return JSON.parse(localStorage.getItem('feh.access') || 'null'); } catch { return null; }
}

export function saveAccess(a) {
  try { localStorage.setItem('feh.access', JSON.stringify(a)); } catch {  }
}






export function loadSettings() {
  try { return JSON.parse(localStorage.getItem('feh.settings') || 'null'); } catch { return null; }
}

export function saveSettings(s) {
  try { localStorage.setItem('feh.settings', JSON.stringify(s)); } catch {  }
}



















export function feh_track(name, props) {
  try { trackEvent(name, { game: 'farmy-evil-hills', ...props }); } catch {  }
}

export const PROGRESS_KEY = 'feh.progress';

export function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (!p || typeof p.deck !== 'number' || !(p.deck >= 1)) return null;
    return { deck: Math.min(99, Math.floor(p.deck)), seenIntro: !!p.seenIntro };
  } catch { return null; }
}

export function saveProgress(next) {
  try {
    const was = loadProgress() || { deck: 1, seenIntro: false };
    
    
    const merged = {
      deck: Math.max(was.deck, next.deck ?? was.deck),
      seenIntro: was.seenIntro || !!next.seenIntro,
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
  } catch {  }
}
