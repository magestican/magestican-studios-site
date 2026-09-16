

















import { generate, VILLAGER_SPECIES } from 'moon/art/villager.mjs';
import { voiceOf } from 'moon/voice/voices.mjs';
import { toObject3D } from './toMesh.js';
import { bindCharacter } from './character.js';

export { VILLAGER_SPECIES };


export async function villagerObject(species, { seed = 1, season = 'summer', lod = 0, build } = {}) {
  const data = generate({ species, seed, season, lod, ...(build ? { build } : {}) });
  const problems = data.validate();
  if (problems.length) throw new Error(`villager ${species} seed ${seed}: ${problems.join('; ')}`);
  const object = await toObject3D(data);
  object.name = `villager:${species}:${seed}`;
  const v = bindCharacter(data, object);
  v.species = species;
  v.height_m = data.rig.height_m;
  v.top_m = data.rig.top_m;
  v.build = data.rig.build;
  v.voice = voiceOf(species);
  return v;
}
