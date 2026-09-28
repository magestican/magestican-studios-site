












import { generate, itemOf } from '../../../../web-engine/moon/art/item.mjs';
import { toPayload, payloadBuffers } from '../../../../web-engine/moon/mesh/meshPayload.mjs';


self.onmessage = (e) => {
  const { id, spec } = e.data || {};
  if (id === undefined) return;
  try {
    const { good, seed = 1, season = 'summer', lod = 0 } = spec || {};
    const t0 = performance.now();
    const { kind, variant } = itemOf(good);
    const data = generate({ kind, variant, seed, season, lod });
    const problems = data.validate();
    if (problems.length) throw new Error(problems.join('; '));
    const payload = toPayload(data);
    const ms = Math.round((performance.now() - t0) * 10) / 10;
    self.postMessage({ id, payload, ms }, payloadBuffers(payload));
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
