






























import { BUILDINGS, FINDS, FORAGE, GIFTS, GOODS, GUEST_GIFTS, LAND, RECIPES, ROCKS, STAPLES, START, STUMP, TREES, UNDERGROUND, WATER } from './tables.mjs';
import { MS, chance, draw, pickWeighted } from './math.mjs';
import { isRipe, plantedAtFor, ripeAt, stageAt, stageEndAt, stageEdges, waterReason, waterTree } from './trees.mjs';
import { buildingSlots, freeParcelId, nextParcelPrice, ownedTreeCount, ownsParcel, treeSlots, usedBuildingSlots } from './land.mjs';
import { putOnShelves, runCustomers, sellable, shelfRoom } from './shop.mjs';
import { applyGift, giftBasePoints } from './happiness.mjs';
import { CRAFTABLES } from './craftables.mjs';
import { craftPlan, craftedName } from './crafting.mjs';
import { CALENDAR, STORES, TOWN_HALL, isBirthday, isMayor, marketPrice, newTown, noticeBoard, storeOpen, storePrice } from './town.mjs';
import { hourAt } from './clock.mjs';

export const WORLD_VERSION = 1;

const byId = (list, id) => list.find((x) => x.id === id);
const held = (world, good) => world.pockets[good] || 0;
const isCount = (n) => Number.isInteger(n) && n >= 1;
const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const listOfGood = (good) => good.replace(/([A-Z])/g, (m) => ` ${m.toLowerCase()}`);
const shutReason = (counter) => `${cap(counter.label)} is shut - it opens at ${counter.openHour} and closes at ${counter.closeHour}.`;








function grantWish(world, wish, t, dry = false) {
  let moved = 0;
  for (const tree of world.trees) {
    if (planetOf(tree) !== HOME_PLANET) continue;
    const stage = stageAt(tree, t);
    if (stage === 'stump') continue;
    if (wish === 'ripen' && stage === 'fruiting' && !isRipe(tree, t)) {
      if (dry) { moved += 1; continue; }
      const had = tree.wateredCrop === tree.crops ? tree.ripenShift_ms || 0 : 0;
      tree.ripenShift_ms = had + (ripeAt(tree) - t);
      tree.wateredCrop = tree.crops;
      moved += 1;
    } else if (wish === 'growth' && stage !== 'fruiting') {
      if (!dry) tree.waterShift_ms = (tree.waterShift_ms || 0) + (stageEndAt(tree, t) - t);
      moved += 1;
    }
  }
  return moved;
}

function give(world, good, n) {
  if (n > 0) world.pockets[good] = held(world, good) + n;
}

function take(world, good, n) {
  const left = held(world, good) - n;
  if (left > 0) world.pockets[good] = left;
  else delete world.pockets[good];
}

function spend(world, coins, invested) {
  world.coins -= coins;
  world.stats.spent_coins += coins;
  if (invested) world.stats.invested_coins += coins;
}

function nextId(world) {
  return world.nextId++;
}

const newTree = (fields) => ({ ...fields, waterShift_ms: 0, wateredStage: null, wateredCrop: null, ripenShift_ms: 0 });









export const HOME_PLANET = 0;
const planetOf = (e) => (Number.isInteger(e && e.planet) ? e.planet : HOME_PLANET);

export function newWorld({ seed = 1, now, wildTrees = [], rocks = 0, forageSpots = [], finds = [], villagers = START.villagers, coins = START.coins, tzOffsetMin = 0, planetLayout = 1 } = {}) {
  if (!Number.isInteger(seed) || seed <= 0 || seed >= 2 ** 32) throw new Error(`seed must be a positive 32-bit integer, got ${seed}`);
  if (!Number.isInteger(now)) throw new Error(`now must be integer milliseconds, got ${now}`);
  if (!Number.isInteger(planetLayout) || planetLayout < 1) throw new Error(`planetLayout must be a positive integer, got ${planetLayout}`);
  const world = {
    version: WORLD_VERSION,
    seed,
    createdAt: now,
    clockAt: now,
    
    
    
    
    planetLayout,
    
    
    
    tzOffsetMin,
    coins,
    pockets: {},
    
    parcels: LAND.startingParcels,
    land: Array.from({ length: LAND.startingParcels }, (_, id) => id),
    nextId: 1,
    trees: [],
    rocks: [],
    forage: [],
    
    
    
    
    finds: [],
    
    
    luck: null,
    
    
    
    guestDay: null,
    guest: null,
    
    
    
    
    made: {},
    placed: [],
    buildings: [],
    villagers: [],
    
    
    town: newTown(),
    shop: { shelves: new Array(BUILDINGS.shop.levels[0].shelves).fill(null), saturation: {}, slot: 0 },
    stats: { earned_coins: 0, spent_coins: 0, invested_coins: 0, customers: 0, sold: {}, soldFor_coins: {}, market_coins: 0, requests: 0 },
    
    
    
    
    
    
    deeds: { picked: {}, planted: {}, felled: 0, crafted: {}, planets: [] },
    
    
    
    
    goals: { active: null, done: [] },
    
    
    
    
    
    
    
    terrain: {},
    
    
    
    assembly: { open: null, meetings: [], works: [] },
    
    
    
    
    
    
    paths: [],
    lights: [],
    cleared: [],
  };
  
  world.buildings.push({ id: nextId(world), type: 'shop', level: 1, builtAt: now });
  for (const entry of wildTrees) {
    const { kind, stage = 'fruiting', spot = null } = entry;
    if (!TREES[kind]) throw new Error(`unknown tree kind '${kind}'`);
    world.trees.push(newTree({
      id: nextId(world), kind, wild: true, spot, planet: planetOf(entry),
      plantedAt: plantedAtFor(kind, stage, now), harvestedAt: null, crops: 0, felledAt: stage === 'stump' ? now : null,
    }));
  }
  
  const rockList = Number.isInteger(rocks) ? Array.from({ length: rocks }, () => ({})) : rocks;
  for (const entry of rockList) {
    world.rocks.push({ id: nextId(world), planet: planetOf(entry), minedAt: null, hits: 0, dayHits: 0 });
  }
  forageSpots.forEach((entry, id) => {
    const { type } = entry;
    if (!FORAGE[type]) throw new Error(`unknown forage spot type '${type}'`);
    world.forage.push({ id, type, planet: planetOf(entry), pickedAt: null, picks: 0 });
  });
  finds.forEach(({ planet, kind }, id) => {
    if (!FINDS[kind]) throw new Error(`unknown find kind '${kind}'`);
    if (!Number.isInteger(planet) || planet < 0) throw new Error(`a find needs a planet id, got ${JSON.stringify(planet)}`);
    world.finds.push({ id, planet, kind, takenAt: null, takes: 0 });
  });
  for (const v of villagers) {
    
    
    
    const levels = v.home ? [{ at: now, doneAt: now }] : [];
    world.villagers.push({ id: nextId(world), species: v.species, favourite: v.favourite, home: v.home || null, points: 0, warmth_cp: 0, warmthAt: now, levels });
  }
  return world;
}



export const jobSlotsOf = (building) => BUILDINGS.processor.levels[building.level - 1].jobSlots;

export function batchesDone(job, t) {
  const each = RECIPES[job.recipe].time_s * MS;
  return Math.max(0, Math.min(job.batches, Math.floor((t - job.startedAt) / each)));
}

export function readyToCollect(building, t) {
  let ready = 0;
  for (const job of building.jobs) ready += batchesDone(job, t) - job.collected;
  return ready;
}

export function buildCost(type) {
  const spec = BUILDINGS[type];
  return spec.levels ? spec.levels[0].cost_coins : spec.cost_coins;
}

export function upgradeCost(building) {
  const next = BUILDINGS[building.type].levels && BUILDINGS[building.type].levels[building.level];
  return next ? next.cost_coins : null;
}




export function netWorth(world) {
  const value = (good, n) => GOODS[good].sell_coins * n;
  let goods = 0;
  for (const [good, n] of Object.entries(world.pockets)) goods += value(good, n);
  for (const shelf of world.shop.shelves) if (shelf) goods += value(shelf.good, shelf.count);
  for (const b of world.buildings) {
    if (b.type !== 'processor') continue;
    for (const job of b.jobs) goods += value(RECIPES[job.recipe].output, job.batches - job.collected);
  }
  return world.coins + goods + world.stats.invested_coins;
}



export function advance(world, now) {
  const from = world.clockAt;
  const t = Math.max(now, from);
  const events = [];
  if (t > from) notices(world, from, t, events);
  runCustomers(world, t, events);
  world.clockAt = t;
  return events.sort((a, b) => a.at - b.at);
}


function notices(world, from, to, events) {
  const within = (at) => at > from && at <= to;
  for (const tree of world.trees) {
    if (tree.felledAt !== null) continue;
    for (const [at, stage] of stageEdges(tree)) if (within(at)) events.push({ type: 'grew', at, tree: tree.id, stage });
    const ripe = ripeAt(tree);
    if (within(ripe)) events.push({ type: 'ripe', at: ripe, tree: tree.id });
  }
  for (const b of world.buildings) {
    if (b.type !== 'processor') continue;
    for (const job of b.jobs) {
      const each = RECIPES[job.recipe].time_s * MS;
      const first = Math.floor((from - job.startedAt) / each) + 1;
      for (let i = Math.max(1, first); i <= batchesDone(job, to); i++) {
        events.push({ type: 'batchDone', at: job.startedAt + i * each, processor: b.id, good: RECIPES[job.recipe].output });
      }
    }
  }
  for (const v of world.villagers) {
    v.levels.forEach((level, i) => {
      if (within(level.doneAt)) events.push({ type: 'built', at: level.doneAt, villager: v.id, level: i + 1 });
    });
  }
  for (const rock of world.rocks) {
    if (!rockResting(rock)) continue;
    const ready = rock.minedAt + ROCKS.cooldown_s * MS;
    if (within(ready)) events.push({ type: 'rockReady', at: ready, rock: rock.id });
  }
  for (const spot of world.forage) {
    if (spot.pickedAt === null) continue;
    const ready = forageReadyAt(spot);
    if (within(ready)) events.push({ type: 'forageReady', at: ready, spot: spot.id });
  }
}


const rockResting = (rock) => rock.minedAt !== null && rock.dayHits >= ROCKS.hitsPerDay;


export function rockReadyAt(rock) {
  return rockResting(rock) ? rock.minedAt + ROCKS.cooldown_s * MS : null;
}


export function forageReadyAt(spot) {
  return spot.pickedAt === null ? -Infinity : spot.pickedAt + FORAGE[spot.type].regrow_s * MS;
}

export const forageIsReady = (spot, t) => t >= forageReadyAt(spot);


export function findReadyAt(find) {
  return find.takenAt === null ? -Infinity : find.takenAt + FINDS[find.kind].regrow_s * MS;
}

export const findIsReady = (find, t) => t >= findReadyAt(find);


export const findsOn = (world, planet) => (world.finds || []).filter((f) => f.planet === planet);












const onPlanet = (list, planet) => (list || []).filter((e) => (Number.isInteger(e.planet) ? e.planet : HOME_PLANET) === planet);

export const treesOn = (world, planet) => onPlanet(world.trees, planet);
export const rocksOn = (world, planet) => onPlanet(world.rocks, planet);
export const forageOn = (world, planet) => onPlanet(world.forage, planet);
export const placedOn = (world, planet) => onPlanet(world.placed, planet);


export function summarize(events) {
  const out = { coins: 0, sales: 0, sold: {}, ripe: 0, grew: 0, batches: 0, built: 0 };
  for (const e of events) {
    if (e.type === 'sale') {
      out.coins += e.coins;
      out.sales += 1;
      out.sold[e.good] = (out.sold[e.good] || 0) + 1;
    } else if (e.type === 'ripe') out.ripe += 1;
    else if (e.type === 'grew') out.grew += 1;
    else if (e.type === 'batchDone') out.batches += 1;
    else if (e.type === 'built') out.built += 1;
  }
  return out;
}



export function whyCannot(world, action, now) {
  const rule = action && RULES[action.type];
  if (!rule) return `There is no action '${action && action.type}'.`;
  return rule.check(world, action, Math.max(now, world.clockAt));
}

export function act(world, action, now) {
  const events = advance(world, now);
  const t = world.clockAt;
  const reason = whyCannot(world, action, t);
  if (reason) throw new Error(reason);
  RULES[action.type].apply(world, action, t, events);
  return events;
}

function pickCrop(world, tree, t, event) {
  const spec = TREES[tree.kind];
  give(world, spec.fruit, spec.fruitPerCrop);
  event.good = spec.fruit;
  event.count = spec.fruitPerCrop;
  if (spec.rare && chance(spec.rare.chance_bp, world.seed, 'rare', tree.id, tree.crops)) {
    give(world, spec.rare.good, 1);
    event.rare = spec.rare.good;
  }
  tree.crops += 1;
  tree.harvestedAt = t;
}

function treeReason(world, id) {
  return byId(world.trees, id) ? null : 'That tree is not here.';
}


function forageCheck(world, a, t, digging) {
  const spot = Number.isInteger(a.spot) ? world.forage[a.spot] : undefined;
  if (!spot) return 'Nothing grows there.';
  if (digging && spot.type !== 'dig') return 'There is nothing to dig up there - pick it by hand.';
  if (!digging && spot.type === 'dig') return 'Something is growing under the soil - the shovel will find it.';
  if (forageIsReady(spot, t)) return null;
  return spot.type === 'dig' ? 'The soil is resting - come back a little later.' : 'It is still growing back - come back a little later.';
}

function forageApply(world, a, t, type) {
  const spot = world.forage[a.spot];
  const spec = FORAGE[spot.type];
  let good = spec.good;
  if (!good) {
    const goods = Object.keys(spec.weights);
    good = goods[pickWeighted(goods.map((g) => spec.weights[g]), world.seed, spot.type, spot.id, spot.picks, 'good')];
  }
  const count = spec.min + (draw(world.seed, spot.type, spot.id, spot.picks, 'count') % (spec.max - spec.min + 1));
  give(world, good, count);
  spot.picks += 1;
  spot.pickedAt = t;
  return { type, at: t, spot: spot.id, good, count };
}


export const LUCK_MS = 86400000;
export const LUCK_ODDS = 1 / 8;
const TREASURES = Object.freeze(Object.keys(FINDS).filter((k) => FINDS[k].treasure).map((k) => FINDS[k].good));






export function luckFor(world, t) {
  const luck = world.luck;
  if (!luck || !Number.isInteger(luck.key) || !(t <= luck.until)) return null;
  const lucky = (luck.key >>> 0) / 2 ** 32 < LUCK_ODDS;
  return { lucky, treasure: TREASURES[draw(luck.key, 'treasure') % TREASURES.length] };
}


export function undergroundCost(a) {
  const spec = UNDERGROUND[a.good];
  if (!spec) return 0;
  return a.first ? 0 : spec.buy_coins * a.count;
}

const RULES = {
  harvest: {
    check(world, a, t) {
      const tree = byId(world.trees, a.tree);
      if (!tree) return treeReason(world, a.tree);
      
      
      
      if (!TREES[tree.kind].fruit) return `A ${tree.kind} bears no fruit - but it is good timber.`;
      const stage = stageAt(tree, t);
      if (stage === 'stump') return 'Only a stump is left.';
      if (stage !== 'fruiting') return 'This tree is too young to bear fruit.';
      if (!isRipe(tree, t)) return 'The fruit is not ripe yet.';
      return null;
    },
    apply(world, a, t, events) {
      const tree = byId(world.trees, a.tree);
      const event = { type: 'harvest', at: t, tree: tree.id };
      pickCrop(world, tree, t, event);
      events.push(event);
    },
  },

  fell: {
    check(world, a, t) {
      const tree = byId(world.trees, a.tree);
      if (!tree) return treeReason(world, a.tree);
      const stage = stageAt(tree, t);
      if (stage === 'stump') return 'It is already a stump.';
      if (stage === 'seed') return 'There is nothing to fell yet - it is only a seed.';
      return null;
    },
    apply(world, a, t, events) {
      const tree = byId(world.trees, a.tree);
      const spec = TREES[tree.kind];
      const stage = stageAt(tree, t);
      const event = { type: 'fell', at: t, tree: tree.id, seed: spec.seed, seeds: spec.seedsWhenFelled[stage], wood: spec.woodWhenFelled[stage] };
      if (isRipe(tree, t)) pickCrop(world, tree, t, event); 
      give(world, spec.seed, event.seeds);
      give(world, 'wood', event.wood);
      tree.felledAt = t;
      events.push(event);
    },
  },

  clearStump: {
    check(world, a, t) {
      const tree = byId(world.trees, a.tree);
      if (!tree) return treeReason(world, a.tree);
      return stageAt(tree, t) === 'stump' ? null : 'Only a stump can be dug up.';
    },
    apply(world, a, t, events) {
      world.trees = world.trees.filter((tree) => tree.id !== a.tree);
      give(world, 'wood', STUMP.wood);
      events.push({ type: 'clearStump', at: t, tree: a.tree, wood: STUMP.wood });
    },
  },

  
  
  
  water: {
    check(world, a, t) {
      const tree = byId(world.trees, a.tree);
      if (!tree) return treeReason(world, a.tree);
      return waterReason(tree, t);
    },
    apply(world, a, t, events) {
      const tree = byId(world.trees, a.tree);
      const { cut_ms, stage, ripening } = waterTree(tree, t, WATER.cut_bp);
      events.push({ type: 'water', at: t, tree: tree.id, stage, ripening, cut_ms });
      
      
      if (!ripening && stageAt(tree, t) !== stage) events.push({ type: 'grew', at: t, tree: tree.id, stage: stageAt(tree, t) });
      if (ripening && isRipe(tree, t)) events.push({ type: 'ripe', at: t, tree: tree.id });
    },
  },

  forage: {
    check(world, a, t) {
      return forageCheck(world, a, t, false);
    },
    apply(world, a, t, events) {
      events.push(forageApply(world, a, t, 'forage'));
    },
  },

  dig: {
    check(world, a, t) {
      return forageCheck(world, a, t, true);
    },
    apply(world, a, t, events) {
      events.push(forageApply(world, a, t, 'dig'));
    },
  },

  
  
  
  
  
  
  pickUpFind: {
    check(world, a, t) {
      const find = Number.isInteger(a.find) ? (world.finds || [])[a.find] : undefined;
      if (!find) return 'There is nothing there.';
      if (findIsReady(find, t)) return null;
      return 'You have taken this one already - something else will settle here in time.';
    },
    apply(world, a, t, events) {
      const find = world.finds[a.find];
      const spec = FINDS[find.kind];
      const count = spec.min + (draw(world.seed, 'find', find.id, find.takes, 'count') % (spec.max - spec.min + 1));
      give(world, spec.good, count);
      find.takes += 1;
      find.takenAt = t;
      const event = { type: 'pickUpFind', at: t, find: find.id, planet: find.planet, good: spec.good, count };
      
      
      const luck = luckFor(world, t);
      if (luck) {
        world.luck = null;
        if (luck.lucky) {
          give(world, luck.treasure, 1);
          event.treasure = luck.treasure;
        }
      }
      events.push(event);
    },
  },

  
  
  
  
  
  
  tossCoin: {
    check(world) {
      if (world.coins < 1) return 'You have no coin to toss.';
      return null;
    },
    apply(world, a, t, events) {
      world.coins -= 1;
      world.stats.coinsTossed = (world.stats.coinsTossed || 0) + 1;
      world.luck = { key: draw(world.seed, 'luck', world.stats.coinsTossed), until: t + LUCK_MS };
      events.push({ type: 'tossCoin', at: t, coins: -1 });
    },
  },

  plant: {
    check(world, a) {
      const spec = TREES[a.kind];
      if (!spec) return `There is no ${a.kind} tree.`;
      
      
      if (!spec.seed) return `A ${a.kind} cannot be planted - they grow wild.`;
      if (held(world, spec.seed) < 1) return `You have no ${a.kind} seeds.`;
      
      
      
      
      
      
      if (planetOf(a) === HOME_PLANET && ownedTreeCount(world) >= treeSlots(world)) {
        return 'Your land has no room for another tree - the cat sells more.';
      }
      return null;
    },
    apply(world, a, t, events) {
      const spec = TREES[a.kind];
      take(world, spec.seed, 1);
      const tree = newTree({
        id: nextId(world), kind: a.kind, wild: false, spot: a.spot ?? null, planet: planetOf(a),
        plantedAt: t, harvestedAt: null, crops: 0, felledAt: null,
      });
      world.trees.push(tree);
      events.push({ type: 'plant', at: t, tree: tree.id, kind: a.kind, planet: tree.planet });
    },
  },

  mine: {
    check(world, a, t) {
      const rock = byId(world.rocks, a.rock);
      if (!rock) return 'That rock is not here.';
      if (rockResting(rock) && t < rock.minedAt + ROCKS.cooldown_s * MS) return 'This rock needs a day to settle.';
      return null;
    },
    apply(world, a, t, events) {
      const rock = byId(world.rocks, a.rock);
      if (rockResting(rock)) rock.dayHits = 0; 
      const event = { type: 'mine', at: t, rock: rock.id, good: 'stone', count: ROCKS.stonePerHit };
      give(world, 'stone', ROCKS.stonePerHit);
      if (chance(ROCKS.moonRockChance_bp, world.seed, 'moonRock', rock.id, rock.hits)) {
        give(world, 'moonRock', 1);
        event.moonRock = 1;
      }
      if (chance(ROCKS.gemChance_bp, world.seed, 'gem', rock.id, rock.hits)) {
        give(world, 'gem', 1);
        event.rare = 'gem';
      }
      rock.hits += 1;
      rock.dayHits += 1;
      rock.minedAt = t;
      event.hitsLeft = ROCKS.hitsPerDay - rock.dayHits;
      events.push(event);
    },
  },

  build: {
    check(world, a) {
      const spec = BUILDINGS[a.building];
      if (!spec || a.building === 'shop') return `You cannot build a ${a.building}.`;
      if (usedBuildingSlots(world) + spec.buildingSlots > buildingSlots(world)) return 'Your land has no room for another building - the cat sells more.';
      const cost = buildCost(a.building);
      if (world.coins < cost) return `That costs ${cost} coins.`;
      return null;
    },
    apply(world, a, t, events) {
      const cost = buildCost(a.building);
      spend(world, cost, true);
      const building = { id: nextId(world), type: a.building, level: 1, builtAt: t };
      if (a.building === 'processor') building.jobs = [];
      world.buildings.push(building);
      events.push({ type: 'build', at: t, building: building.id, kind: a.building, coins: cost });
    },
  },

  upgrade: {
    check(world, a) {
      const building = byId(world.buildings, a.building);
      if (!building || !BUILDINGS[building.type].levels) return 'That cannot be upgraded.';
      const cost = upgradeCost(building);
      if (cost === null) return 'It is already as big as it gets.';
      if (world.coins < cost) return `That costs ${cost} coins.`;
      return null;
    },
    apply(world, a, t, events) {
      const building = byId(world.buildings, a.building);
      const cost = upgradeCost(building);
      spend(world, cost, true);
      building.level += 1;
      if (building.type === 'shop') {
        const shelves = world.shop.shelves;
        while (shelves.length < BUILDINGS.shop.levels[building.level - 1].shelves) shelves.push(null);
      }
      events.push({ type: 'upgrade', at: t, building: building.id, level: building.level, coins: cost });
    },
  },

  startJob: {
    check(world, a) {
      const building = byId(world.buildings, a.processor);
      if (!building || building.type !== 'processor') return 'That is not a processing building.';
      const recipe = RECIPES[a.recipe];
      if (!recipe) return `There is no recipe for ${a.recipe}.`;
      if (building.level < recipe.processorLevel) return 'This building needs an upgrade to make that.';
      if (!isCount(a.batches) || a.batches > BUILDINGS.processor.maxBatches) return `A job is 1 to ${BUILDINGS.processor.maxBatches} batches.`;
      if (building.jobs.length >= jobSlotsOf(building)) return 'Every slot is busy.';
      for (const [good, n] of Object.entries(recipe.inputs)) {
        if (held(world, good) < n * a.batches) return `That needs ${n * a.batches} ${good}.`;
      }
      return null;
    },
    apply(world, a, t, events) {
      const building = byId(world.buildings, a.processor);
      const recipe = RECIPES[a.recipe];
      for (const [good, n] of Object.entries(recipe.inputs)) take(world, good, n * a.batches);
      building.jobs.push({ recipe: a.recipe, batches: a.batches, startedAt: t, collected: 0 });
      events.push({ type: 'startJob', at: t, processor: building.id, recipe: a.recipe, batches: a.batches, doneAt: t + a.batches * recipe.time_s * MS });
    },
  },

  collect: {
    check(world, a, t) {
      const building = byId(world.buildings, a.processor);
      if (!building || building.type !== 'processor') return 'That is not a processing building.';
      return readyToCollect(building, t) > 0 ? null : 'Nothing is ready yet.';
    },
    apply(world, a, t, events) {
      const building = byId(world.buildings, a.processor);
      const goods = {};
      for (const job of building.jobs) {
        const ready = batchesDone(job, t) - job.collected;
        if (ready <= 0) continue;
        const output = RECIPES[job.recipe].output;
        give(world, output, ready);
        goods[output] = (goods[output] || 0) + ready;
        job.collected += ready;
      }
      building.jobs = building.jobs.filter((job) => job.collected < job.batches);
      events.push({ type: 'collect', at: t, processor: building.id, goods });
    },
  },

  stock: {
    check(world, a) {
      if (!sellable(a.good)) return 'Customers do not buy that.';
      if (!isCount(a.count)) return 'Stock at least one.';
      if (held(world, a.good) < a.count) return `You have ${held(world, a.good)}.`;
      if (shelfRoom(world, a.good) < 1) return 'The shelves are full.';
      return null;
    },
    
    apply(world, a, t, events) {
      const placed = putOnShelves(world, a.good, a.count);
      take(world, a.good, placed);
      events.push({ type: 'stock', at: t, good: a.good, count: placed });
    },
  },

  unstock: {
    check(world, a) {
      return Number.isInteger(a.shelf) && world.shop.shelves[a.shelf] ? null : 'That shelf is empty.';
    },
    apply(world, a, t, events) {
      const shelf = world.shop.shelves[a.shelf];
      give(world, shelf.good, shelf.count);
      world.shop.shelves[a.shelf] = null;
      events.push({ type: 'unstock', at: t, good: shelf.good, count: shelf.count });
    },
  },

  buy: {
    check(world, a) {
      const staple = STAPLES[a.good];
      if (!staple) return 'The cat does not sell that.';
      if (!isCount(a.count)) return 'Buy at least one.';
      if (world.coins < staple.buy_coins * a.count) return `That costs ${staple.buy_coins * a.count} coins.`;
      return null;
    },
    apply(world, a, t, events) {
      const coins = STAPLES[a.good].buy_coins * a.count;
      spend(world, coins, false);
      give(world, a.good, a.count);
      events.push({ type: 'buy', at: t, good: a.good, count: a.count, coins });
    },
  },

  
  
  
  
  
  
  
  buyUnderground: {
    check(world, a) {
      const spec = UNDERGROUND[a.good];
      if (!spec) return 'Nothing like that comes up from down there.';
      if (!isCount(a.count)) return 'Take at least one.';
      const coins = undergroundCost(a);
      if (world.coins < coins) return `That costs ${coins} coins.`;
      return null;
    },
    apply(world, a, t, events) {
      const coins = undergroundCost(a);
      if (coins > 0) spend(world, coins, false);
      give(world, a.good, a.count);
      events.push({ type: 'buyUnderground', at: t, good: a.good, count: a.count, coins });
    },
  },

  
  
  
  
  
  
  guestGift: {
    check(world, a, t) {
      const g = world.guest;
      const spec = GUEST_GIFTS[a.kind];
      if (!spec || !g || g.kind !== a.kind) return 'There is nobody like that here.';
      if (g.gave) return 'You have had your gift today.';
      if (spec.wishes && !spec.wishes.includes(a.wish)) return 'That is not a wish she can grant.';
      if (spec.wishes && grantWish(world, a.wish, t, true) === 0) {
        return a.wish === 'ripen' ? 'Every fruiting tree at home is ripe already.' : 'Nothing at home is young enough to grow.';
      }
      for (const [good, n] of Object.entries(spec.price || {})) {
        if (held(world, good) < n) return `That costs ${n === 1 ? 'one' : n} ${listOfGood(good)}${n === 1 ? '' : 's'}, and you have ${held(world, good) ? 'too few' : 'none'}.`;
      }
      return null;
    },
    apply(world, a, t, events) {
      const spec = GUEST_GIFTS[a.kind];
      const g = world.guest;
      const event = { type: 'guestGift', at: t, kind: a.kind, good: null, count: 0, paid: null, wish: null, trees: 0 };
      for (const [good, n] of Object.entries(spec.price || {})) take(world, good, n);
      if (spec.price) event.paid = { ...spec.price };
      if (spec.wishes) {
        event.wish = a.wish;
        event.trees = grantWish(world, a.wish, t);
      } else {
        const [lo, hi] = spec.count;
        event.good = spec.good;
        event.count = lo + (draw(world.seed, 'guestGift', a.kind, g.day, g.planet) % (hi - lo + 1));
        give(world, spec.good, event.count);
      }
      g.gave = true;
      events.push(event);
    },
  },

  
  
  
  
  buyParcel: {
    check(world, a) {
      if (world.parcels >= LAND.maxParcels) return 'The cat has no more land to sell on this moon.';
      if (a.parcel !== undefined) {
        if (!Number.isInteger(a.parcel)) return 'That is not a parcel of land.';
        if (a.parcel < 0 || a.parcel >= LAND.maxParcels) return 'There is no such parcel on this moon.';
        if (ownsParcel(world, a.parcel)) return 'You already own that land.';
      }
      const price = nextParcelPrice(world);
      return world.coins < price ? `The next parcel costs ${price} coins.` : null;
    },
    apply(world, a, t, events) {
      const price = nextParcelPrice(world);
      const parcel = a.parcel ?? freeParcelId(world);
      spend(world, price, true);
      world.land.push(parcel);
      world.land.sort((x, y) => x - y);
      world.parcels = world.land.length;
      events.push({ type: 'buyParcel', at: t, coins: price, parcels: world.parcels, parcel });
    },
  },

  gift: {
    check(world, a) {
      if (!byId(world.villagers, a.villager)) return 'Nobody like that lives here.';
      if (a.coins !== undefined) {
        if (a.good !== undefined) return 'A gift is coins or goods, not both.';
        if (!Number.isInteger(a.coins) || a.coins < GIFTS.coinsPerPoint) return `A money gift is at least ${GIFTS.coinsPerPoint} coins.`;
        return world.coins < a.coins ? 'You do not have that many coins.' : null;
      }
      if (!GOODS[a.good] || GOODS[a.good].gift_points <= 0) return 'That would not make a nice gift.';
      if (!isCount(a.count)) return 'Give at least one.';
      return held(world, a.good) < a.count ? `You have ${held(world, a.good)}.` : null;
    },
    apply(world, a, t, events) {
      const villager = byId(world.villagers, a.villager);
      
      const birthday = isBirthday(world, villager.id, t);
      const base = giftBasePoints(villager, a) * (birthday ? CALENDAR.birthdayGift_x : 1);
      if (a.coins !== undefined) spend(world, a.coins, false);
      else take(world, a.good, a.count);
      const event = { type: 'gift', at: t, villager: villager.id, base, points: 0, birthday };
      events.push(event);
      event.points = applyGift(villager, base, t, events);
    },
  },

  
  
  
  
  
  craft: {
    check(world, a) {
      return craftPlan(world, a.item, a.count ?? 1).why || null;
    },
    apply(world, a, t, events) {
      const plan = craftPlan(world, a.item, a.count ?? 1);
      for (const { good, n } of plan.goods) take(world, good, n);
      if (plan.coins > 0) spend(world, plan.coins, true);
      world.made[a.item] = (world.made[a.item] || 0) + plan.count;
      events.push({ type: 'craft', at: t, item: a.item, count: plan.count, goods: plan.goods, coins: plan.coins });
    },
  },

  place: {
    check(world, a) {
      if (!CRAFTABLES[a.item]) return `There is no '${a.item}' to place.`;
      if ((world.made[a.item] || 0) < 1) return `You have no ${craftedName(a.item)} to place - make one first.`;
      return null;
    },
    apply(world, a, t, events) {
      world.made[a.item] -= 1;
      if (world.made[a.item] === 0) delete world.made[a.item];
      const placed = { id: nextId(world), item: a.item, spot: a.spot ?? null, planet: planetOf(a), placedAt: t };
      world.placed.push(placed);
      events.push({ type: 'place', at: t, placed: placed.id, item: a.item, planet: placed.planet });
    },
  },

  

  
  
  buyFrom: {
    check(world, a, t) {
      const store = STORES[a.store];
      if (!store) return 'There is no such store in town.';
      if (!store.sells) return `${cap(store.label)} does not sell, it buys.`;
      if (!storeOpen(hourAt(world, t), store)) return shutReason(store);
      const price = storePrice(a.store, a.good);
      if (!price) return `${cap(store.label)} does not stock that.`;
      if (!isCount(a.count)) return 'Buy at least one.';
      if (world.coins < price * a.count) return `That costs ${price * a.count} coins.`;
      return null;
    },
    apply(world, a, t, events) {
      const coins = storePrice(a.store, a.good) * a.count;
      spend(world, coins, false);
      give(world, a.good, a.count);
      events.push({ type: 'buyFrom', at: t, store: a.store, good: a.good, count: a.count, coins });
    },
  },

  
  
  
  sellTo: {
    check(world, a, t) {
      const store = STORES[a.store];
      if (!store) return 'There is no such store in town.';
      if (!store.buys) return `${cap(store.label)} does not buy, it sells.`;
      if (!storeOpen(hourAt(world, t), store)) return shutReason(store);
      if (!marketPrice(a.good)) return `${cap(store.label)} has no use for that.`;
      if (!isCount(a.count)) return 'Sell at least one.';
      if (held(world, a.good) < a.count) return `You have ${held(world, a.good)}.`;
      return null;
    },
    apply(world, a, t, events) {
      const coins = marketPrice(a.good) * a.count;
      take(world, a.good, a.count);
      world.coins += coins;
      world.stats.earned_coins += coins;
      world.stats.market_coins += coins;
      events.push({ type: 'sellTo', at: t, store: a.store, good: a.good, count: a.count, coins });
    },
  },

  
  
  fillRequest: {
    check(world, a, t) {
      const hour = hourAt(world, t);
      const board = noticeBoard(world, t, hour);
      if (!board.up) return 'The board is bare - the notice goes up later this morning.';
      if (board.filled) return 'That notice is filled - there will be another tomorrow.';
      if (!storeOpen(hour, TOWN_HALL)) return shutReason(TOWN_HALL);
      if (board.held < board.count) return `The town wants ${board.count} ${listOfGood(board.good)} - you have ${board.held}.`;
      return null;
    },
    apply(world, a, t, events) {
      const hour = hourAt(world, t);
      const board = noticeBoard(world, t, hour);
      take(world, board.good, board.count);
      world.coins += board.coins;
      world.stats.earned_coins += board.coins;
      world.stats.requests += 1;
      world.town.points += board.points;
      world.town.filled += 1;
      world.town.lastDay = board.day;
      
      
      
      
      const asker = board.villager === null ? null : byId(world.villagers, board.villager);
      const villagerPoints = asker && GOODS[board.good].gift_points > 0
        ? applyGift(asker, giftBasePoints(asker, { good: board.good, count: board.count }), t, events) : 0;
      events.push({ type: 'fillRequest', at: t, good: board.good, count: board.count, coins: board.coins, points: board.points, standing: world.town.points, villager: board.villager, villagerPoints });
    },
  },

  
  
  takeBack: {
    check(world, a) {
      return byId(world.placed, a.placed) ? null : 'There is nothing of yours there.';
    },
    apply(world, a, t, events) {
      const placed = byId(world.placed, a.placed);
      world.placed = world.placed.filter((p) => p.id !== a.placed);
      world.made[placed.item] = (world.made[placed.item] || 0) + 1;
      events.push({ type: 'takeBack', at: t, placed: a.placed, item: placed.item });
    },
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  terraform: {
    check(world, a) {
      if (!Number.isInteger(a.parcel) || a.parcel < 0) return 'That is not a piece of land.';
      const land = Array.isArray(world.land) ? world.land : [];
      
      
      if (!land.includes(a.parcel) && !isMayor(world)) return 'This is not your land yet - buy it from the cat first.';
      if (!a.cells || typeof a.cells !== 'object' || Array.isArray(a.cells)) return 'There is nothing to shape there.';
      return null;
    },
    apply(world, a, t, events) {
      if (!world.terrain || typeof world.terrain !== 'object') world.terrain = {};
      const ponds = (Array.isArray(a.ponds) ? a.ponds : []).map((p) => ({ x: p.x, z: p.z, r: p.r, y: p.y }));
      world.terrain[a.parcel] = { cells: { ...a.cells }, ponds };
      events.push({
        type: 'terraform', at: t, parcel: a.parcel, brush: typeof a.brush === 'string' ? a.brush : null,
        nodes: Object.keys(a.cells).length, ponds: ponds.length,
      });
    },
  },

  
  
  
  
  
  layPath: {
    check(world, a) {
      if (!isMayor(world)) return 'Only the Mayor lays new paths - raise the town\'s standing first.';
      if (!isLine(a.pts)) return 'Choose where the path starts and ends.';
      return null;
    },
    apply(world, a, t, events) {
      const paths = Array.isArray(world.paths) ? world.paths : [];
      const id = paths.reduce((m, p) => Math.max(m, Number.isInteger(p.id) ? p.id : 0), 0) + 1;
      world.paths = [...paths, { id, kind: 'laid', pts: a.pts.map((p) => [p[0], p[1]]) }];
      events.push({ type: 'layPath', at: t, path: id });
    },
  },
  erasePath: {
    check(world, a) {
      if (!isMayor(world)) return 'Only the Mayor changes the paths.';
      const p = (Array.isArray(world.paths) ? world.paths : []).find((q) => q.id === a.path);
      if (!p) return 'There is no path of yours there.';
      if (p.kind !== 'laid') return 'That path leads to a villager\'s home - it stays.';
      return null;
    },
    apply(world, a, t, events) {
      world.paths = world.paths.filter((p) => p.id !== a.path);
      events.push({ type: 'erasePath', at: t, path: a.path });
    },
  },
  
  
  spurHomes: {
    check(world, a) {
      if (!Array.isArray(a.spurs) || !a.spurs.every((s) => s && s.home !== undefined && isLine(s.pts))) return 'There is no path to lay.';
      return null;
    },
    apply(world, a, t, events) {
      const paths = Array.isArray(world.paths) ? world.paths.slice() : [];
      const have = new Set(paths.filter((p) => p.kind === 'spur').map((p) => String(p.home)));
      for (const s of a.spurs) {
        if (have.has(String(s.home))) continue;
        const id = paths.reduce((m, p) => Math.max(m, Number.isInteger(p.id) ? p.id : 0), 0) + 1;
        paths.push({ id, kind: 'spur', home: s.home, pts: s.pts.map((p) => [p[0], p[1]]) });
        have.add(String(s.home));
        events.push({ type: 'spurHome', at: t, path: id, home: s.home });
      }
      world.paths = paths;
    },
  },
  placeLight: {
    check(world, a) {
      if (!isMayor(world)) return 'Only the Mayor puts up the town\'s lamps.';
      if (!Number.isFinite(a.x) || !Number.isFinite(a.z)) return 'There is no ground there.';
      return null;
    },
    apply(world, a, t, events) {
      const lights = Array.isArray(world.lights) ? world.lights : [];
      const id = lights.reduce((m, l) => Math.max(m, Number.isInteger(l.id) ? l.id : 0), 0) + 1;
      world.lights = [...lights, { id, x: a.x, z: a.z }];
      events.push({ type: 'placeLight', at: t, light: id });
    },
  },
  removeLight: {
    check(world, a) {
      if (!isMayor(world)) return 'Only the Mayor takes the town\'s lamps down.';
      if (Number.isInteger(a.light)) return (world.lights || []).some((l) => l.id === a.light) ? null : 'There is no lamp of yours there.';
      if (typeof a.layout === 'string' && a.layout.startsWith('lamp@')) return (world.cleared || []).includes(a.layout) ? 'That lamp is already gone.' : null;
      return 'There is no lamp there.';
    },
    apply(world, a, t, events) {
      if (Number.isInteger(a.light)) world.lights = world.lights.filter((l) => l.id !== a.light);
      else world.cleared = [...(Array.isArray(world.cleared) ? world.cleared : []), a.layout];
      events.push({ type: 'removeLight', at: t, light: Number.isInteger(a.light) ? a.light : a.layout });
    },
  },
};


function isLine(pts) {
  return Array.isArray(pts) && pts.length >= 2 && pts.length <= 64
    && pts.every((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
}












export const ACTION_TYPES = Object.freeze(Object.keys(RULES));
