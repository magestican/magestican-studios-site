












export const VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

const ZOOM_KEYS = new Set(['+', '=', '-', '_', '0']);

export function isZoomKey(e) {
  return !!(e && (e.ctrlKey || e.metaKey) && ZOOM_KEYS.has(e.key));
}

export function blockZoom(win = globalThis.window) {
  const doc = win && win.document;
  if (!win || !doc) return () => {};
  const stop = (e) => { if (e.cancelable !== false) e.preventDefault(); };
  const opts = { passive: false };
  const bound = [
    [doc, 'gesturestart', stop],
    [doc, 'gesturechange', stop],
    [doc, 'gestureend', stop],
    [doc, 'touchmove', (e) => { if (e.touches && e.touches.length > 1) stop(e); }],
    [win, 'wheel', (e) => { if (e.ctrlKey) stop(e); }],
    [win, 'keydown', (e) => { if (isZoomKey(e)) stop(e); }],
  ];
  for (const [target, type, fn] of bound) target.addEventListener(type, fn, opts);
  return () => { for (const [target, type, fn] of bound) target.removeEventListener(type, fn, opts); };
}
