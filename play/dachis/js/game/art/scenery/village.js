




import { Batch, buildStats, setPointScale } from './kit.js';
import { placeHuts } from './huts.js';
import { placeRimStones, placeLedges } from './rocks.js';
import { placeSteps } from './steps.js';
import { placeTorches, createTorchFire } from './torches.js';
import { placeFences } from './fences.js';
import { placeFlowerBeds } from './flowerBeds.js';
import { placeSprings, createSpringWater } from './spring.js';
import { placeCraterRim, createLava } from './lavaCrater.js';
import { placeGrowth } from './growth.js';
import { placeTemple } from './temple.js';

const PLACERS = [placeHuts, placeRimStones, placeLedges, placeSteps, placeTorches, placeFences, placeFlowerBeds, placeSprings, placeGrowth, placeTemple];

export function buildScenery(stage, W, { crater, craterRadius, lavaHeight, sections }) {
  const { scene } = stage;
  const groups = {};
  for (const id of sections) {
    const batch = new Batch('scenery-' + id);
    
    const view = Object.create(W);
    view.objects = W.objects.filter((o) => o.secs.includes(id));
    for (const place of PLACERS) place(batch, view);
    if (id === 'kazan') placeCraterRim(batch, W, crater, craterRadius);
    const group = batch.toGroup();
    scene.add(group);
    groups[id] = group;
  }
  const fire = createTorchFire(scene, W);
  const water = createSpringWater(scene, W);
  const lava = createLava(scene, crater, craterRadius, lavaHeight);
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
