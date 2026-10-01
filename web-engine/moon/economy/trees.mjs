






import { TREES } from './tables.mjs';
import { MS } from './math.mjs';

export const GROWING = Object.freeze(['seed', 'sapling', 'young']);
const NEXT = Object.freeze({ seed: 'sapling', sapling: 'young', young: 'fruiting' });


export function growthMs(kind, stage) {
  const g = TREES[kind].growth_s;
  let ms = 0;
  for (const s of GROWING) {
    if (s === stage) return ms;
    ms += g[s] * MS;
  }
  if (stage === 'fruiting') return ms;
  throw new Error(`no growth stage '${stage}'`);
}







const grownFrom = (tree) => tree.plantedAt - (tree.waterShift_ms || 0);

export const fruitingAt = (tree) => grownFrom(tree) + growthMs(tree.kind, 'fruiting');

export function stageAt(tree, t) {
  if (tree.felledAt !== null && t >= tree.felledAt) return 'stump';
  const g = TREES[tree.kind].growth_s;
  let edge = grownFrom(tree);
  for (const s of GROWING) {
    edge += g[s] * MS;
    if (t < edge) return s;
  }
  return 'fruiting';
}



export function ripeAt(tree) {
  const since = tree.harvestedAt === null ? fruitingAt(tree) : Math.max(fruitingAt(tree), tree.harvestedAt);
  const cut = tree.wateredCrop !== undefined && tree.wateredCrop !== null && tree.wateredCrop === tree.crops ? tree.ripenShift_ms || 0 : 0;
  return since + TREES[tree.kind].ripen_s * MS - cut;
}



export function stageEndAt(tree, t) {
  if (tree.felledAt !== null && t >= tree.felledAt) return null;
  const g = TREES[tree.kind].growth_s;
  let edge = grownFrom(tree);
  for (const s of GROWING) {
    edge += g[s] * MS;
    if (t < edge) return edge;
  }
  return null;
}


export function waterReason(tree, t) {
  const stage = stageAt(tree, t);
  if (stage === 'stump') return 'A stump does not need water.';
  if (stage === 'fruiting') {
    if (isRipe(tree, t)) return 'The fruit is ripe - it is ready to pick.';
    if (tree.wateredCrop === tree.crops) return 'It has had its water for this crop.';
    return null;
  }
  return tree.wateredStage === stage ? 'It has had its water for now - let it grow a little.' : null;
}



export function waterTree(tree, t, cut_bp) {
  const stage = stageAt(tree, t);
  const spec = TREES[tree.kind];
  if (stage === 'fruiting') {
    const cut = Math.min(Math.floor((spec.ripen_s * MS * cut_bp) / 10000), ripeAt(tree) - t);
    tree.ripenShift_ms = cut;
    tree.wateredCrop = tree.crops;
    return { cut_ms: cut, stage, ripening: true };
  }
  const cut = Math.min(Math.floor((spec.growth_s[stage] * MS * cut_bp) / 10000), stageEndAt(tree, t) - t);
  tree.waterShift_ms = (tree.waterShift_ms || 0) + cut;
  tree.wateredStage = stage;
  return { cut_ms: cut, stage, ripening: false };
}

export const isRipe = (tree, t) => stageAt(tree, t) === 'fruiting' && t >= ripeAt(tree);


export function stageEdges(tree) {
  const g = TREES[tree.kind].growth_s;
  const edges = [];
  let edge = grownFrom(tree);
  for (const s of GROWING) {
    edge += g[s] * MS;
    edges.push([edge, NEXT[s]]);
  }
  return edges;
}




export function plantedAtFor(kind, stage, now) {
  if (stage === 'fruiting' || stage === 'stump') return now - growthMs(kind, 'fruiting') - TREES[kind].ripen_s * MS;
  return now - growthMs(kind, stage);
}
