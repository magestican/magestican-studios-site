



import { drape, bake, bakedBuffers } from './drape.js';

self.onmessage = (e) => {
  const { id, design, body, tier } = e.data;
  try {
    const t0 = performance.now();
    const b = bake(drape(design, body, { tier }));
    b.ms = Math.round(performance.now() - t0);
    self.postMessage({ id, baked: b }, bakedBuffers(b));
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
