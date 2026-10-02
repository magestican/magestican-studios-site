





import { swatchPixels } from './swatch.js';

self.onmessage = (e) => {
  const { id, fab, dye, opts } = e.data;
  try {
    const t0 = performance.now();
    const px = swatchPixels(fab, dye, opts);
    self.postMessage({ id, px, w: opts.w, h: opts.h, ms: Math.round(performance.now() - t0) }, [px.buffer]);
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
