












export const MOTION = Object.freeze({
  enterMs: 220, leaveMs: 160, reducedMs: 120, pulseMs: 2000, pressMs: 80, liftPx: 2, sinkPx: 4, staggerMs: 40,
});


export function screenTimes(reduced) {
  return reduced ? { enter: MOTION.reducedMs, leave: MOTION.reducedMs, slide: false, pulse: false }
    : { enter: MOTION.enterMs, leave: MOTION.leaveMs, slide: true, pulse: true };
}



export const BACK = Object.freeze({ race: 'pause', pause: 'race', results: 'title', title: null });


export function focusStep(index, count, key) {
  if (count <= 0) return -1;
  const d = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 0;
  if (index < 0) return d < 0 ? count - 1 : 0;
  return (index + d + count) % count;
}

const KEY = 'tinyThrottle.menu.v1';


export function loadSettings(storage) {
  try {
    const v = JSON.parse(storage?.getItem(KEY) ?? 'null');
    return { muted: v?.muted === true, best: v && typeof v.best === 'object' && v.best ? { ...v.best } : {} };
  } catch {
    return { muted: false, best: {} };
  }
}

export function saveSettings(storage, settings) {
  try { storage?.setItem(KEY, JSON.stringify({ muted: !!settings.muted, best: settings.best ?? {} })); } catch {  }
}


export function recordBest(settings, trackId, place) {
  if (!Number.isInteger(place) || place < 1) return false;
  const old = settings.best[trackId];
  if (Number.isInteger(old) && old <= place) return false;
  settings.best[trackId] = place;
  return true;
}
