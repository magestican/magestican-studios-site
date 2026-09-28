























import { within, WORKER_WAIT_MS } from '../play/warmWait.js';





export function bleedTransparent(data) {
  let r = 0, g = 0, b = 0, n = 0, cut = false;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 127) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; } else if (data[i + 3] < 32) cut = true;
  }
  if (!cut || !n) return;
  r /= n; g /= n; b /= n;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) { data[i] = r; data[i + 1] = g; data[i + 2] = b; }
  }
}


export function paintPixels(mod, size) {
  const img = mod.paint({ size });
  bleedTransparent(img.data);
  return img;
}





let offThread = null;
let waitMs = WORKER_WAIT_MS;
export function setPaintWorker(run, { wait = WORKER_WAIT_MS } = {}) { offThread = typeof run === 'function' ? run : null; waitMs = wait; }


export async function paintInWorker(painterId, size) {
  if (!offThread) throw new Error('no paint worker');
  const { payload } = await offThread({ kind: 'paint', painter: painterId, size });
  if (!payload || !payload.data || !payload.width || !payload.height) throw new Error(`paint worker: no pixels for ${painterId}`);
  return payload;
}






export async function fieldInWorker(spec) {
  if (!offThread) throw new Error('no paint worker');
  const { payload } = await offThread(spec);
  if (!payload || !payload.data || !payload.width || !payload.height) throw new Error(`paint worker: no field for ${spec && spec.kind}`);
  return payload;
}







export function shareTexture(texture) {
  texture.userData.sharedPaint = true;
  texture.dispose = SHARED_DISPOSE;
  return texture;
}
export function SHARED_DISPOSE() {  }


export const paintKey = (painterId, size) => `${painterId}|${size}`;


export const PAINTED = new Map();
export const paintStats = { painted: 0, hits: 0, fromWorker: 0, fromMain: 0 };








export function paintOnce(painterId, mod, size, toTexture) {
  const key = paintKey(painterId, size);
  const hit = PAINTED.get(key);
  if (hit) { paintStats.hits++; return hit; }
  paintStats.painted++;
  const pending = (async () => {
    let img = null;
    if (offThread) {
      
      
      
      try { img = await within(paintInWorker(painterId, size), waitMs, null); } catch { img = null; }
      if (img) paintStats.fromWorker++; else paintStats.workerTimeouts = (paintStats.workerTimeouts || 0) + 1;
    }
    if (!img) { img = paintPixels(mod, size); paintStats.fromMain++; }
    return shareTexture(toTexture(img));
  })();
  PAINTED.set(key, pending);
  pending.catch(() => { if (PAINTED.get(key) === pending) PAINTED.delete(key); });
  return pending;
}
