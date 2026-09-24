






import { generate, guestDraws } from 'moon/art/guest.mjs';
import { animPhase } from 'moon/rig/locomotion.mjs';
import { voiceOf } from 'moon/voice/voices.mjs';
import { toObject3D } from './toMesh.js';
import { bindCharacter } from './character.js';

export async function guestObject(kind, { seed = 1, season = 'summer', lod = 1 } = {}) {
  const data = generate({ kind, seed, season, lod });
  const problems = data.validate();
  if (problems.length) throw new Error(`guest ${kind}: ${problems.join('; ')}`);
  const object = await toObject3D(data);
  object.name = `guest:${kind}`;
  const v = bindCharacter(data, object, { phase: animPhase(seed), life: seed });
  v.kind = kind;
  v.height_m = data.rig.height_m;
  v.cost = guestDraws(data);
  v.voice = voiceOf(kind); 
  return v;
}
