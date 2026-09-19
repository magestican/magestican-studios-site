

















import { VILLAGER_SPECIES } from 'moon/art/villager.mjs';
import { voiceOf } from 'moon/voice/voices.mjs';
import { toObject3D } from './toMesh.js';
import { bindCharacter } from './character.js';
import { villagerSource } from './villagerSource.js';

export { VILLAGER_SPECIES };







export async function villagerObject(species, { seed = 1, season = 'summer', lod = 0, build, source = null } = {}) {
  const data = await (source || villagerSource()).meshFor({ species, seed, season, lod, build });
  
  
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
