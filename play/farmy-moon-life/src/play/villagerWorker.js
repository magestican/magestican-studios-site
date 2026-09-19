























import { generate } from '../../../../web-engine/moon/art/villager.mjs';
import { toPayload, payloadBuffers } from '../../../../web-engine/moon/mesh/meshPayload.mjs';






self.onmessage = (e) => {
  const { id, spec } = e.data || {};
  if (id === undefined) return;
  try {
    const { species, seed = 1, season = 'summer', lod = 0, build } = spec || {};
    
    
    
    const t0 = performance.now();
    const data = generate({ species, seed, season, lod, ...(build ? { build } : {}) });
    const problems = data.validate();
    
    
    if (problems.length) throw new Error(problems.join('; '));
    const payload = toPayload(data);
    const ms = Math.round((performance.now() - t0) * 10) / 10;
    self.postMessage({ id, payload, ms }, payloadBuffers(payload));
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
