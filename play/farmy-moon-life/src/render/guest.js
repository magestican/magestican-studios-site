






import { generate, guestDraws } from 'moon/art/guest.mjs';
import { fromPayload } from 'moon/mesh/meshPayload.mjs';
import { animPhase } from 'moon/rig/locomotion.mjs';
import { voiceOf } from 'moon/voice/voices.mjs';
import { toObject3D } from './toMesh.js';
import { bindCharacter } from './character.js';









let offThread = null;
export function setGuestWorker(run) { offThread = run; }


export async function guestMesh(kind, { seed = 1, season = 'summer', lod = 1 } = {}) {
  if (offThread) {
    try {
      const { payload } = await offThread({ art: 'guest', kind, seed, season, lod });
      if (payload && Number.isInteger(payload.draws)) return { data: fromPayload(payload), cost: payload.draws, clips: payload.clips || null };
    } catch {  }
  }
  const data = generate({ kind, seed, season, lod });
  return { data, cost: guestDraws(data), clips: null };
}

export async function guestObject(kind, { seed = 1, season = 'summer', lod = 1 } = {}) {
  const { data, cost, clips } = await guestMesh(kind, { seed, season, lod });
  const problems = data.validate();
  if (problems.length) throw new Error(`guest ${kind}: ${problems.join('; ')}`);
  const object = await toObject3D(data);
  object.name = `guest:${kind}`;
  const v = bindCharacter(data, object, { phase: animPhase(seed), life: seed, clips });
  v.kind = kind;
  v.height_m = data.rig.height_m;
  v.cost = cost;
  v.voice = voiceOf(kind); 
  return v;
}
