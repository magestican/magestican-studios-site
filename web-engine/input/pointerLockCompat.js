


















































































export const POINTER_LOCK_TIMEOUT_MS = 10000;


const SHIM_FLAG = '__arbeloPointerLockPromiseShim';

const isThenable = (v) => !!v && typeof v.then === 'function';








function promiseFromEvents(doc, el, timeoutMs, setTimer, clearTimer) {
  const p = new Promise((resolve, reject) => {
    
    
    
    
    if (!doc || typeof doc.addEventListener !== 'function') { resolve(); return; }

    
    
    if (doc.pointerLockElement === el) { resolve(); return; }

    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer !== null) clearTimer(timer);
      doc.removeEventListener('pointerlockchange', onChange);
      doc.removeEventListener('pointerlockerror', onError);
    };
    const settle = (fn, arg) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(arg);
    };

    function onChange() {
      
      
      if (doc.pointerLockElement === el) settle(resolve, undefined);
    }
    function onError() {
      settle(reject, new Error('pointerlockerror: the browser refused the pointer lock request'));
    }

    doc.addEventListener('pointerlockchange', onChange);
    doc.addEventListener('pointerlockerror', onError);
    timer = setTimer(() => {
      settle(reject, new Error(`pointer lock request went unanswered for ${timeoutMs}ms`));
    }, timeoutMs);
  });

  
  
  
  
  
  
  p.catch(() => {});
  return p;
}











export function requestPointerLock(el, options, deps = {}) {
  const setTimer = deps.setTimeout || setTimeout;
  const clearTimer = deps.clearTimeout || clearTimeout;
  const timeoutMs = deps.timeoutMs ?? POINTER_LOCK_TIMEOUT_MS;

  if (!el || typeof el.requestPointerLock !== 'function') {
    return Promise.reject(new Error('pointer lock is not supported in this browser'));
  }

  let out;
  try {
    
    
    
    out = options === undefined ? el.requestPointerLock() : el.requestPointerLock(options);
  } catch (err) {
    return Promise.reject(err);
  }

  if (isThenable(out)) return out;   
  const doc = el.ownerDocument || deps.document || null;
  return promiseFromEvents(doc, el, timeoutMs, setTimer, clearTimer);
}









export function installPointerLockPromise(win, deps = {}) {
  const Element_ = win && win.Element;
  const proto = Element_ && Element_.prototype;
  if (!proto || typeof proto.requestPointerLock !== 'function') return false;

  const native = proto.requestPointerLock;
  if (native[SHIM_FLAG]) return false;

  const setTimer = deps.setTimeout || (win.setTimeout ? win.setTimeout.bind(win) : setTimeout);
  const clearTimer = deps.clearTimeout || (win.clearTimeout ? win.clearTimeout.bind(win) : clearTimeout);
  const timeoutMs = deps.timeoutMs ?? POINTER_LOCK_TIMEOUT_MS;

  function requestPointerLockShim(...args) {
    let out;
    try {
      out = native.apply(this, args);
    } catch (err) {
      return Promise.reject(err);
    }
    if (isThenable(out)) return out;
    const doc = this.ownerDocument || win.document || null;
    return promiseFromEvents(doc, this, timeoutMs, setTimer, clearTimer);
  }
  requestPointerLockShim[SHIM_FLAG] = true;
  
  
  requestPointerLockShim.nativeRequestPointerLock = native;

  proto.requestPointerLock = requestPointerLockShim;
  return true;
}






export function uninstallPointerLockPromise(win) {
  const proto = win && win.Element && win.Element.prototype;
  const current = proto && proto.requestPointerLock;
  if (!current || !current[SHIM_FLAG]) return false;
  proto.requestPointerLock = current.nativeRequestPointerLock;
  return true;
}
