












import { BUILDINGS, GIFTS, GOODS, HAPPINESS, RECIPES, STAPLES, TREES } from './tables.mjs';
import { BP, MS } from './math.mjs';
import { isRipe, stageAt, waterReason } from './trees.mjs';
import { buildingSlots, ownedTreeCount, treeSlots, usedBuildingSlots } from './land.mjs';
import { discountAt, isLit, sellable, shelfRoom, shopOf, shopSpec, stockCount } from './shop.mjs';
import { giftBasePoints, warmthAt } from './happiness.mjs';
import { batchesDone, forageIsReady, jobSlotsOf, readyToCollect, whyCannot } from './world.mjs';

export const ACTION_TIME_s = Object.freeze({
  harvest: 3, fell: 5, clearStump: 4, plant: 3, mine: 3,
  startJob: 3, collect: 2, stock: 3, unstock: 2,
  buy: 3, buyParcel: 6, build: 5, upgrade: 5, gift: 5,
  
  
  
  
  water: 2, forage: 3, dig: 4,
  walk: 8, 
  wait: 4, 
});

export const AREA = Object.freeze({
  harvest: 'orchard', fell: 'orchard', clearStump: 'orchard', plant: 'orchard', water: 'orchard',
  mine: 'rocks', forage: 'forage', dig: 'forage',
  startJob: 'processor', collect: 'processor', stock: 'shop', unstock: 'shop',
  buy: 'cat', buyParcel: 'cat', build: 'cat', upgrade: 'cat', gift: 'village',
});


export const WALK_MPS = 1.3;







export const WALK_M = Object.freeze({
  'cat|orchard': 12.0,
  'cat|processor': 5.3,
  'cat|shop': 8.8,
  'orchard|processor': 14.5,
  'orchard|shop': 17.4,
  'processor|shop': 13.2,
});


export function walkTime_s(from, to) {
  if (from === to) return 0;
  const m = from ? WALK_M[[from, to].sort().join('|')] : undefined;
  return m === undefined ? ACTION_TIME_s.walk : Math.round(m / WALK_MPS);
}


export function areaOf(action, world) {
  if (action.type === 'build') return action.building === 'processor' ? 'processor' : 'shop';
  if (action.type === 'upgrade') {
    const b = world.buildings.find((x) => x.id === action.building);
    return b && b.type === 'shop' ? 'shop' : 'processor';
  }
  return AREA[action.type];
}






const COLLECT_TRIP_MIN = 8; 
const HARVEST_ROUND_MIN = 3; 
const FORAGE_ROUND_MIN = 4; 
const STOCK_TRIP_MIN = 4; 
const STOCK_TRIP_WAIT_MS = 90000;










const FRUIT_WAITING = 40;


const GIFT_SHARE_bp = 1000;






export function decide(world, t, memory = {}) {
  const processors = world.buildings.filter((b) => b.type === 'processor');
  const hasPress = processors.length > 0;
  const ripe = world.trees.filter((tree) => isRipe(tree, t));
  const anyReady = processors.find((p) => readyToCollect(p, t) > 0);
  const freeSlotJob = () => {
    for (const p of processors) {
      if (p.jobs.length >= jobSlotsOf(p)) continue;
      const job = bestJob(world, p, t);
      if (job) return job;
    }
    return null;
  };

  if (memory.leavingAt !== undefined && t >= memory.leavingAt) {
    if (anyReady) return { type: 'collect', processor: anyReady.id };
    return bestStock(world, t, hasPress, {}) || freeSlotJob() || (ripe.length ? { type: 'harvest', tree: ripe[0].id } : null);
  }

  
  const { shelves, shelfStack } = shopSpec(world);
  if (stockCount(world) * 3 < shelves * shelfStack) {
    const stock = bestStock(world, t, hasPress, {});
    if (stock) return stock;
  }
  const press = processors.find((p) => readyToCollect(p, t) >= COLLECT_TRIP_MIN
    || p.jobs.some((job) => job.collected < job.batches && batchesDone(job, t) === job.batches));
  if (press) return { type: 'collect', processor: press.id };
  if (ripe.length >= HARVEST_ROUND_MIN || (ripe.length > 0 && memory.area === 'orchard')) return { type: 'harvest', tree: ripe[0].id };
  const job = freeSlotJob();
  if (job) return job;
  const stock = bestStock(world, t, hasPress, memory);
  if (stock) return stock;
  const goal = nextGoal(world);
  if (goal && !whyCannot(world, goal, t)) return goal;
  
  
  
  
  
  
  
  
  
  const gift = giftMove(world, t, memory);
  if (gift) return gift;
  
  
  
  
  const pick = forageMove(world, t, memory);
  if (pick) return pick;
  const grow = orchardMove(world, t);
  if (grow) return grow;
  const drink = waterMove(world, t);
  if (drink) return drink;
  for (const rock of world.rocks) {
    const mine = { type: 'mine', rock: rock.id };
    if (!whyCannot(world, mine, t)) return mine;
  }
  if (anyReady) return { type: 'collect', processor: anyReady.id };
  if (ripe.length) return { type: 'harvest', tree: ripe[0].id };
  return null;
}

const giftingStarted = (world) => world.parcels >= 2;







function bestJob(world, processor, t) {
  let best = null;
  for (const [id, recipe] of Object.entries(RECIPES)) {
    if (processor.level < recipe.processorLevel) continue;
    let fruitBatches = BUILDINGS.processor.maxBatches;
    let stapleBatches = BUILDINGS.processor.maxBatches;
    let inputValue = 0;
    let fruitUsed = 0;
    let staple = null;
    for (const [good, n] of Object.entries(recipe.inputs)) {
      if (STAPLES[good]) {
        stapleBatches = Math.min(stapleBatches, Math.floor((world.pockets[good] || 0) / n));
        inputValue += STAPLES[good].buy_coins * n;
        staple = { good, n };
      } else {
        fruitBatches = Math.min(fruitBatches, Math.floor((world.pockets[good] || 0) / n));
        inputValue += GOODS[good].sell_coins * n;
        fruitUsed += n;
      }
    }
    if (fruitBatches < 1) continue;
    const outputValue = Math.floor((GOODS[recipe.output].sell_coins * (BP - discountAt(world, recipe.output, t))) / BP);
    const score = (outputValue - inputValue) / fruitUsed;
    if (score <= 0 || (best && score <= best.score)) continue;
    if (staple && stapleBatches < 1) {
      const bulk = Math.min(BUILDINGS.processor.maxBatches * staple.n, Math.floor(world.coins / STAPLES[staple.good].buy_coins));
      if (bulk < staple.n) continue; 
      best = { score, action: { type: 'buy', good: staple.good, count: bulk } };
    } else {
      best = { score, action: { type: 'startJob', processor: processor.id, recipe: id, batches: Math.min(fruitBatches, stapleBatches) } };
    }
  }
  return best ? best.action : null;
}



function bestStock(world, t, hasProcessor, memory) {
  let best = null;
  for (const [good, n] of Object.entries(world.pockets)) {
    if (!sellable(good)) continue;
    const kind = GOODS[good].kind;
    if (hasProcessor && kind === 'fruit') continue;
    if (kind === 'rare' && giftingStarted(world)) continue;
    const room = shelfRoom(world, good);
    if (room < 1) continue;
    if (!best || GOODS[good].sell_coins > GOODS[best.good].sell_coins) best = { good, count: Math.min(n, room), room };
  }
  if (!best) return null;
  const smallTrip = best.count < Math.min(STOCK_TRIP_MIN, best.room);
  if (smallTrip && memory.lastStockAt !== undefined && t - memory.lastStockAt < STOCK_TRIP_WAIT_MS) return null;
  return { type: 'stock', good: best.good, count: best.count };
}

const rawFruit = (world) => Object.entries(world.pockets).reduce((n, [good, count]) => n + (GOODS[good].kind === 'fruit' ? count : 0), 0);



export function nextGoal(world) {
  const processors = world.buildings.filter((b) => b.type === 'processor');
  const shop = shopOf(world);
  const buildingRoom = usedBuildingSlots(world) + BUILDINGS.processor.buildingSlots <= buildingSlots(world);
  const newPress = buildingRoom ? { type: 'build', building: 'processor' } : { type: 'buyParcel' };
  if (processors.length === 0) return newPress;
  if (!isLit(world)) return { type: 'build', building: 'lamp' };
  const lowest = processors.reduce((a, b) => (b.level < a.level ? b : a));
  if (lowest.level < 2) return { type: 'upgrade', building: lowest.id };
  if (shop.level < 2) return { type: 'upgrade', building: shop.id };
  if (rawFruit(world) >= FRUIT_WAITING) return newPress;
  if (world.parcels < 2) return { type: 'buyParcel' };
  if (world.parcels >= 3 && lowest.level < 3) return { type: 'upgrade', building: lowest.id };
  if (world.parcels >= 3 && shop.level < 3) return { type: 'upgrade', building: shop.id };
  return { type: 'buyParcel' };
}
















function forageMove(world, t, memory) {
  const ready = [];
  for (let i = 0; i < world.forage.length; i++) {
    const spot = world.forage[i];
    
    
    if ((spot.planet || 0) !== 0) continue;
    if (forageIsReady(spot, t)) ready.push(i);
  }
  if (!ready.length) return null;
  if (ready.length < FORAGE_ROUND_MIN && memory.area !== 'forage') return null;
  const spot = world.forage[ready[0]];
  return { type: spot.type === 'dig' ? 'dig' : 'forage', spot: ready[0] };
}

























const WATER_LOOKAHEAD_MS = 60 * MS;

function waterMove(world, t) {
  let growing = null;
  for (const tree of world.trees) {
    if ((tree.planet || 0) !== 0) continue;
    if (waterReason(tree, t) || waterReason(tree, t + WATER_LOOKAHEAD_MS)) continue;
    if (stageAt(tree, t) === 'fruiting') return { type: 'water', tree: tree.id };
    if (!growing) growing = tree;
  }
  return growing ? { type: 'water', tree: growing.id } : null;
}


function orchardMove(world, t) {
  const ownStump = world.trees.find((tree) => !tree.wild && stageAt(tree, t) === 'stump');
  if (ownStump) return { type: 'clearStump', tree: ownStump.id };
  const free = treeSlots(world) - ownedTreeCount(world);
  if (free <= 0) return null;
  for (const [kind, spec] of Object.entries(TREES)) {
    if ((world.pockets[spec.seed] || 0) > 0) return { type: 'plant', kind };
  }
  const standingWild = world.trees.filter((tree) => tree.wild && stageAt(tree, t) !== 'stump');
  const young = standingWild.find((tree) => ['sapling', 'young'].includes(stageAt(tree, t)));
  if (young) return { type: 'fell', tree: young.id };
  const seedsFromFruiting = TREES.apple.seedsWhenFelled.fruiting;
  if (free >= seedsFromFruiting && giftingStarted(world)) {
    const fruiting = standingWild.find((tree) => stageAt(tree, t) === 'fruiting');
    if (fruiting) return { type: 'fell', tree: fruiting.id };
    if (standingWild.length === 0) {
      const own = world.trees.filter((tree) => !tree.wild && stageAt(tree, t) === 'fruiting');
      if (own.length >= 4) return { type: 'fell', tree: own[0].id };
    }
  }
  return null;
}




function giftMove(world, t, memory) {
  if (!giftingStarted(world)) return null;
  const budget = Math.floor((world.stats.earned_coins * GIFT_SHARE_bp) / BP) - (memory.giftedCoins || 0);
  for (const villager of world.villagers) {
    if (villager.levels.length >= HAPPINESS.levels.length) continue;
    const room = HAPPINESS.warmthRoom_points - Math.ceil(warmthAt(villager, t) / 100);
    if (room < 20) continue;
    let best = null;
    for (const [good, n] of Object.entries(world.pockets)) {
      const spec = GOODS[good];
      if (!spec.gift_points || spec.kind === 'fruit') continue;
      const each = giftBasePoints(villager, { good, count: 1 });
      const perCoin = each / Math.max(1, spec.sell_coins);
      if (!best || perCoin > best.perCoin) best = { good, each, perCoin, n };
    }
    if (best) {
      const count = Math.max(1, Math.min(best.n, Math.floor(room / best.each)));
      return { type: 'gift', villager: villager.id, good: best.good, count };
    }
    const coins = room * GIFTS.coinsPerPoint;
    if (budget >= coins && world.coins >= coins) return { type: 'gift', villager: villager.id, coins };
  }
  return null;
}
