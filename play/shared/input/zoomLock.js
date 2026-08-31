













































export const DOUBLE_TAP_MS = 320;








export function lockZoom(target = (typeof document !== 'undefined' ? document : null)) {
  if (!target || typeof target.addEventListener !== 'function') return () => {};

  const kill = (e) => { if (e.cancelable) e.preventDefault(); };

  let lastTouchEnd = 0;
  const onTouchEnd = (e) => {
    const now = (e.timeStamp ?? 0) || Date.now();
    
    
    if (now - lastTouchEnd <= DOUBLE_TAP_MS && e.cancelable) e.preventDefault();
    lastTouchEnd = now;
  };

  
  
  
  const opts = { passive: false };
  const pairs = [
    ['gesturestart', kill],
    ['gesturechange', kill],
    ['gestureend', kill],
    ['touchend', onTouchEnd],
  ];
  for (const [name, fn] of pairs) target.addEventListener(name, fn, opts);

  return () => {
    for (const [name, fn] of pairs) target.removeEventListener(name, fn, opts);
  };
}
