
















































export const DOUBLE_TAP_MS = 300;









export const TAP_DEBOUNCE_MS = 45;


export function createTapTracker() {
  return { lastDownAt: -Infinity, armed: false };
}











export function tapDown(tracker, now) {
  const gap = now - tracker.lastDownAt;
  const isDouble = gap >= TAP_DEBOUNCE_MS && gap <= DOUBLE_TAP_MS;
  
  
  
  tracker.lastDownAt = isDouble ? -Infinity : now;
  tracker.armed = isDouble;
  return isDouble;
}


export function tapReset(tracker) {
  tracker.lastDownAt = -Infinity;
  tracker.armed = false;
}














export const TAP_FLASH_MS = 260;

export function tapFlash(ms) {
  if (!(ms >= 0) || ms > TAP_FLASH_MS) return 0;
  const u = ms / TAP_FLASH_MS;
  
  return (1 - u) * (1 - u);
}
