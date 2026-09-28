
























import { fieldInWorker } from './paintCache.js';
import { within, WORKER_WAIT_MS } from '../play/warmWait.js';

















export function createPathMasks({ makeTexture, bakeInline, bakeOffThread = fieldInWorker, waitMs = WORKER_WAIT_MS }) {
  const textures = new Map();
  const pending = new Map();
  const families = new Map();
  const stats = { baked: 0, offThread: 0, inline: 0, swaps: 0, failed: 0 };
  let seq = 0;
  const familyOf = (name) => {
    let f = families.get(name);
    if (!f) families.set(name, (f = { uniform: { value: null }, shown: -1 }));
    return f;
  };
  const bake = (key, job) => {
    if (pending.has(key)) return pending.get(key);
    const p = (async () => {
      try {
        let img = null;
        try {
          
          
          img = await within(bakeOffThread(job), waitMs, null);
          if (img) stats.offThread++;
        } catch {
          img = null;
        }
        if (!img) { img = bakeInline(job); stats.inline++; }
        const texture = makeTexture(img);
        textures.set(key, texture);
        stats.baked++;
        return texture;
      } finally {
        pending.delete(key);
      }
    })();
    pending.set(key, p);
    return p;
  };
  const show = (fam, n, texture) => {
    if (n <= fam.shown) return;
    fam.shown = n;
    if (fam.uniform.value !== texture) { fam.uniform.value = texture; stats.swaps++; }
  };
  function request(family, key, job) {
    const fam = familyOf(family);
    const n = seq++;
    if (textures.has(key)) {
      show(fam, n, textures.get(key));
      return { uniform: fam.uniform, ready: Promise.resolve(fam.uniform.value) };
    }
    const ready = bake(key, job).then(
      (texture) => { show(fam, n, texture); return fam.uniform.value; },
      () => { stats.failed++; return fam.uniform.value; },
    );
    return { uniform: fam.uniform, ready };
  }
  return { request, textures, stats };
}
