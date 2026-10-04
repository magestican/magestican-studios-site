




import { Batch, buildStats, setPointScale } from './kit.js';
import { clearPool } from '../../../engine/core/growBuf.js';
import { placeHuts } from './huts.js';
import { placeRimStones, placeLedges, placePillars } from './rocks.js';
import { placeSteps } from './steps.js';
import { placeTorches, createTorchFire } from './torches.js';
import { placeFences } from './fences.js';
import { placeFlowerBeds } from './flowerBeds.js';
import { placeSprings, createSpringWater } from './spring.js';
import { placeCraterRim, createLava } from './lavaCrater.js';
import { placeGrowth } from './growth.js';
import { placeTemple } from './temple.js';
import { placeDoorProps } from './doorProps.js';
import { placeLife } from './life.js';
import { placeCrystals } from './crystals.js';
import { placeFrost } from './frost.js';

const GROWTH_RUN = 120;

export const PLACERS = [placeHuts, placeRimStones, placeLedges, placePillars, placeSteps, placeTorches, placeFences, placeFlowerBeds, placeSprings, placeGrowth, placeTemple, placeDoorProps, placeLife, placeCrystals, placeFrost];



export async function buildScenery(stage, W, { crater, craterRadius, lavaHeight, craterSection = 'kazan', sections }, slice = async () => {}) {
  const { scene } = stage;
  const groups = {};
  for (const id of sections) {
    const batch = new Batch('scenery-' + id);
    
    const view = Object.create(W);
    view.objects = W.objects.filter((o) => o.secs.includes(id));
    for (const place of PLACERS) {
      
      
      if (place === placeGrowth) for (let k = 0; k < view.objects.length; k += GROWTH_RUN) {
        const run = Object.create(view); run.objects = view.objects.slice(k, k + GROWTH_RUN);
        place(batch, run); await slice('place ' + id + ' growth');
      }
      else { place(batch, view); await slice('place ' + id + ' ' + place.name); }
    }
    if (id === craterSection && crater) placeCraterRim(batch, W, crater, craterRadius);
    const group = batch.toGroup();
    await slice('batch ' + id);
    scene.add(group);
    groups[id] = group;
  }
  clearPool(); 
  const fire = createTorchFire(scene, W);
  const water = createSpringWater(scene, W);
  const lava = crater ? createLava(scene, crater, craterRadius, lavaHeight) : { update() {} };
  const meshes = Object.values(groups).reduce((n, g) => n + g.children.length, 0);
  return {
    groups,
    stats: { ...buildStats, meshes },
    showSection(id) { for (const k in groups) groups[k].visible = k === id; },
    update(t) {
      setPointScale(stage);
      fire.update(t); water.update(t); lava.update(t);
    },
  };
}
