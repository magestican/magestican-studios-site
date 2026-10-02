





import { drape, bake, bakedBuffers } from './drape.js';
import { fabricMaps, mapBuffers } from './fabrics.js';

self.onmessage = (e) => {
  const { id, design, body, tier, maps } = e.data;
  try {
    const t0 = performance.now();
    if (maps) {
      const m = fabricMaps(maps.fab, maps.dye, maps.size);
      m.ms = Math.round(performance.now() - t0);
      self.postMessage({ id, baked: m }, mapBuffers(m));
      return;
    }
    const b = bake(drape(design, body, { tier }));
    b.ms = Math.round(performance.now() - t0);
    self.postMessage({ id, baked: b }, bakedBuffers(b));
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
