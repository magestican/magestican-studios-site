


























































export const WARN_AFTER_MS = 500;









export const STOP_AFTER_MS = 5000;




export function createFrameGuard(opts = {}) {
  return {
    warnAfterMs: opts.warnAfterMs ?? WARN_AFTER_MS,
    stopAfterMs: opts.stopAfterMs ?? STOP_AFTER_MS,
    
    consecutive: 0,
    
    total: 0,
    
    since: null,
    
    warned: false,
    
    stopped: false,
    
    seen: new Map(),
  };
}






export function frameOk(guard) {
  const recovered = guard.warned && !guard.stopped;
  const failures = guard.consecutive;
  guard.consecutive = 0;
  guard.since = null;
  guard.warned = false;
  return { recovered, failures };
}


















export function restartFrameGuard(guard) {
  guard.consecutive = 0;
  guard.since = null;
  guard.warned = false;
  guard.stopped = false;
  return guard;
}
















export function frameFailed(guard, err, now) {
  guard.total += 1;
  guard.consecutive += 1;
  if (guard.since === null) guard.since = now;
  
  
  
  
  
  const forMs = Math.max(0, now - guard.since);

  const signature = signatureOf(err);
  const seenCount = (guard.seen.get(signature) ?? 0) + 1;
  guard.seen.set(signature, seenCount);
  const novel = seenCount === 1;

  const stop = !guard.stopped && forMs >= guard.stopAfterMs;
  if (stop) guard.stopped = true;
  
  
  
  const warn = !stop && !guard.warned && !guard.stopped && forMs >= guard.warnAfterMs;
  if (warn) guard.warned = true;

  return {
    novel, signature, seenCount,
    consecutive: guard.consecutive,
    total: guard.total,
    forMs,
    warn, stop,
    message: stop ? STOP_MESSAGE : (warn ? WARN_MESSAGE : null),
  };
}








export const WARN_MESSAGE = 'Farmy Kart hit a snag and is trying to keep going.';
export const STOP_MESSAGE = 'Farmy Kart had to stop. Reload to get back on track.';













export function signatureOf(err) {
  if (err === null || err === undefined) return `thrown:${String(err)}`;
  const name = err.name ? String(err.name) : '';
  const message = err.message !== undefined ? String(err.message) : String(err);
  const stack = typeof err.stack === 'string' ? err.stack : '';
  
  
  const frame = stack.split('\n').map((l) => l.trim()).find((l) => l.startsWith('at ')) ?? '';
  return [name, message, frame].filter(Boolean).join(' | ') || 'unknown';
}
