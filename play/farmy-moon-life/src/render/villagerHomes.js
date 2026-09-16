



















import * as home from 'moon/art/villagerHome.mjs';
import { toObject3D } from './toMesh.js';

export const VILLAGER_HOME_SPECIES = home.SPECIES;
export const VILLAGER_HOME_STAGES = home.STAGES;
const PROGRESS_STEP = 0.05;

const built = new Map();

function checked(species, stage) {
  if (!home.SPECIES.includes(species)) throw new Error(`unknown villager home species '${species}' (species: ${home.SPECIES.join(', ')})`);
  if (!home.STAGES.includes(stage)) throw new Error(`unknown villager home stage '${stage}' (stages: ${home.STAGES.join(', ')})`);
}

const stepProgress = (stage, progress) => (stage === 'building' ? Math.round(Math.min(1, Math.max(0, progress)) / PROGRESS_STEP) * PROGRESS_STEP : 0);

export function villagerHomeKey(species, { seed = 1, season = 'summer', stage = 'house', progress = home.DEFAULT_PROGRESS, lod = 1 } = {}) {
  checked(species, stage);
  return `${species}|${seed}|${season}|${stage}|${lod}|${stepProgress(stage, progress).toFixed(2)}`;
}


export function villagerHomeAnchors(species, { seed = 1, stage = 'house' } = {}) {
  checked(species, stage);
  return home.anchors({ seed, species, stage });
}

export function villagerHomeFootprint(species, { seed = 1, stage = 'house' } = {}) {
  return villagerHomeAnchors(species, { seed, stage }).footprint;
}

export async function villagerHomeObject(species, { seed = 1, season = 'summer', stage = 'house', progress = home.DEFAULT_PROGRESS, lod = 1 } = {}) {
  const key = villagerHomeKey(species, { seed, season, stage, progress, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = home.generate({ seed, season, lod, species, stage, progress: stage === 'building' ? stepProgress(stage, progress) : undefined });
      const problems = data.validate();
      if (problems.length) throw new Error(`villager home ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `villagerHome:${key}`;
      Object.assign(obj.userData, { home: { species, stage, key, anchors: home.anchors({ seed, species, stage }) }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  const obj = (await built.get(key)).clone();
  obj.userData.home = { ...obj.userData.home, anchors: structuredClone(obj.userData.home.anchors) };
  return obj;
}
