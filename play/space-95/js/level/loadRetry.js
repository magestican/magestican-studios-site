





const RELOAD_FLAG = 's95-level-reload';


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));





export async function withRetry(load, { delays = [500, 1500, 3000], wait = sleep } = {}) {
  for (let i = 0; ; i++) {
    try {
      return await load();
    } catch (err) {
      if (i >= delays.length) throw err;
      await wait(delays[i]);
    }
  }
}








export async function loadLevelRecovering(load, { storage = safeSession(), reload = () => location.reload(), delays, wait } = {}) {
  try {
    const out = await withRetry(load, { delays, wait });
    tryStore(() => storage?.removeItem(RELOAD_FLAG));
    return out;
  } catch (err) {
    const reloaded = tryStore(() => storage?.getItem(RELOAD_FLAG)) === '1';
    if (!storage) {
      tryStore(() => storage?.removeItem(RELOAD_FLAG));
      throw err;
    }
    tryStore(() => storage.setItem(RELOAD_FLAG, '1'));
    reload();
    return new Promise(() => {}); 
  }
}


function tryStore(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

function safeSession() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}
