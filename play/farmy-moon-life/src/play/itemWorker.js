




















import { generate, itemOf } from '../../../../web-engine/moon/art/item.mjs';
import { generate as generateGuest, guestDraws } from '../../../../web-engine/moon/art/guest.mjs';
import { buildClips } from '../../../../web-engine/moon/rig/clips.mjs';
import { generate as generateForage } from '../../../../web-engine/moon/art/forageSpot.mjs';
import { toPayload, payloadBuffers } from '../../../../web-engine/moon/mesh/meshPayload.mjs';
import { toRaw, rawBuffers } from '../../../../web-engine/moon/mesh/meshRaw.mjs';





self.onmessage = (e) => {
  const { id, spec } = e.data || {};
  if (id === undefined) return;
  try {
    const { good, seed = 1, season = 'summer', lod = 0 } = spec || {};
    const art = (spec && spec.art) || 'item';
    const t0 = performance.now();
    let data;
    if (art === 'guest') data = generateGuest({ kind: spec.kind, seed, season, lod });
    else if (art === 'forage') data = generateForage({ type: spec.type, seed, season, stage: spec.stage, lod });
    else { const { kind, variant } = itemOf(good); data = generate({ kind, variant, seed, season, lod }); }
    const problems = data.validate();
    if (problems.length) throw new Error(problems.join('; '));
    let payload, buffers;
    if (art === 'forage') {
      payload = toRaw(data);
      buffers = rawBuffers(payload);
    } else {
      payload = toPayload(data);
      buffers = payloadBuffers(payload);
      
      
      
      if (art === 'guest') { payload.draws = guestDraws(data); payload.clips = buildClips(data.rig); }
    }
    const ms = Math.round((performance.now() - t0) * 10) / 10;
    self.postMessage({ id, payload, ms }, buffers);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
