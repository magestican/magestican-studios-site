













export const PAD = { A: 0, B: 1, X: 2, Y: 3, SELECT: 8, START: 9 };








export const PAD_TO_KEY = Object.freeze({
  'dpad-up': 38, 'dpad-down': 40, 'dpad-left': 37, 'dpad-right': 39,
  south: 32, west: 49, north: 50, east: 27,
});


export function padEdges(state, pad) {
  const now = pad && pad.buttons ? pad.buttons.map((b) => !!(b && (b.pressed || b.value > 0.5))) : [];
  const out = [];
  now.forEach((down, i) => { if (down && !state.prev[i]) out.push(i); });
  state.prev = now;
  return out;
}









export function actionFor(screen, { key = null, pad = null } = {}) {
  if (screen === 'start') {
    return pad === PAD.A || pad === PAD.START ? 'start' : null;
  }
  if (screen === 'play') {
    if (key === 'p' || key === 'P' || pad === PAD.START) return 'pause';
    return null;
  }
  if (screen === 'paused') {
    if (key === 'Escape' || key === 'p' || key === 'P') return 'resume';
    if (pad === PAD.B || pad === PAD.START) return 'resume';
    if (pad === PAD.A) return 'press';
  }
  return null;
}


export function progressText(got, total) {
  if (total > 0) {
    if (got >= total) return 'Starting';
    
    
    return `Loading ${Math.min(99, Math.round((got / total) * 100))}%`;
  }
  return `Loading ${(got / 1e6).toFixed(1)} MB`;
}


export function focusOnLoad(matchMedia) {
  if (typeof matchMedia !== 'function') return true;
  try { return !matchMedia('(pointer: coarse)').matches; } catch (_) { return true; }
}


export function isSwf(bytes) {
  if (!bytes || bytes.length < 4) return false;
  const [a, b, c] = bytes;
  return (a === 0x46 || a === 0x43 || a === 0x5a) && b === 0x57 && c === 0x53;
}

async function fetchOnce(url, fetchImpl, onProgress) {
  const res = await fetchImpl(url, { cache: 'default' });
  if (!res.ok) throw new Error(`SWF request failed: HTTP ${res.status}`);
  const encoded = !!res.headers.get('content-encoding');
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  if (onProgress) onProgress(0, total);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (onProgress) onProgress(got, encoded ? 0 : total);
  }
  if (!encoded && total && got !== total) {
    throw new Error(`SWF download incomplete: ${got} of ${total} bytes (short)`);
  }
  const out = new Uint8Array(got);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  if (!isSwf(out)) throw new Error('the download is not a SWF');
  return out;
}





export async function fetchSwf({ url, fetchImpl = globalThis.fetch, onProgress = null, tries = 2 }) {
  let last;
  for (let t = 0; t < tries; t++) {
    try {
      return await fetchOnce(url, fetchImpl, onProgress);
    } catch (e) {
      last = e;
      if (/not a SWF|HTTP 4\d\d/.test(String(e && e.message))) break;
    }
  }
  throw last;
}
