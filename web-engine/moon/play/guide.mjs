













































import { BUILDINGS, FINDS, GOODS, RECIPES } from '../economy/tables.mjs';
import {
  findIsReady, findsOn, forageIsReady, forageOn, jobSlotsOf, readyToCollect, treesOn,
} from '../economy/world.mjs';
import { freeParcelId, nextParcelPrice } from '../economy/land.mjs';
import { sellable, shelfRoom, stockCount } from '../economy/shop.mjs';
import { GROWING, isRipe, stageAt, waterReason } from '../economy/trees.mjs';
import { processorOf } from './processing.mjs';
import { CAT_NAME, villagerName } from './people.mjs';
import { HOME_NAME, flightsHome, planetAt } from '../world/planets.mjs';

const held = (world, good) => (world.pockets && world.pockets[good]) || 0;


export function sellableHeld(world) {
  return Object.keys(world.pockets || {})
    .filter((good) => held(world, good) > 0 && sellable(good))
    .sort((a, b) => GOODS[b].sell_coins - GOODS[a].sell_coins);
}


export function recipesReady(world, level) {
  return Object.entries(RECIPES)
    .filter(([, r]) => r.processorLevel <= level)
    .filter(([, r]) => Object.entries(r.inputs).every(([good, n]) => held(world, good) >= n))
    .sort((a, b) => GOODS[b[1].output].sell_coins - GOODS[a[1].output].sell_coins)
    .map(([id]) => id);
}


export const label = (good) => String(good).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();



const step = (id, text, place = null) => Object.freeze({ id, text, place });





function awayStep(world, t, planet) {
  const lying = findsOn(world, planet).filter((f) => findIsReady(f, t));
  if (lying.length) {
    
    const best = lying.find((f) => FINDS[f.kind].treasure) || lying[0];
    const what = FINDS[best.kind].container === 'chest' ? 'A chest is waiting to be opened' : 'There is something to pick up';
    return step(`find:${best.id}`, `${what} on ${planetAt(planet).name}.`, { type: 'find', id: best.id });
  }
  const patch = forageOn(world, planet).find((f) => forageIsReady(f, t));
  if (patch) return step(`forage:${patch.id}`, 'There is still something growing here.', { type: 'forage', id: patch.id });
  const flights = flightsHome(planet);
  return step('home',
    `Nothing left here. Hold Jump to fly straight home to ${HOME_NAME} - it is ${flights} ${flights === 1 ? 'flight' : 'flights'} the long way round.`,
    { type: 'home' });
}




function firstDayStep(world, t) {
  if (world.stats.customers > 0) return null;
  const carrying = sellableHeld(world);
  if (!carrying.length && stockCount(world) === 0) {
    const ripe = treesOn(world, 0).find((tree) => isRipe(tree, t));
    return ripe ? step('first:pick', 'Pick the fruit off a tree - it is the start of everything.', { type: 'tree', id: ripe.id }) : null;
  }
  if (carrying.length && shelfRoom(world, carrying[0]) > 0) {
    return step('first:stock', 'Take the fruit to the shop and put it on a shelf.', { type: 'shop' });
  }
  if (stockCount(world) > 0) {
    return step('first:wait', 'Customers come by while there is something on the shelves. Have a wander.', null);
  }
  return null;
}









export function nextStep(world, t, { planet = 0 } = {}) {
  if (planet !== 0) return awayStep(world, t, planet);

  const first = firstDayStep(world, t);
  if (first) return first;

  
  const press = processorOf(world);
  if (press && readyToCollect(press, t) > 0) {
    const n = readyToCollect(press, t);
    return step('collect', `The press has finished ${n === 1 ? 'a batch' : `${n} batches`}.`, { type: 'press' });
  }

  
  const carrying = sellableHeld(world);
  const toShelve = carrying.find((good) => shelfRoom(world, good) > 0) || null;
  if (toShelve && stockCount(world) === 0) {
    return step('stock', 'The shelves are empty - stock the shop and the customers will come.', { type: 'shop' });
  }

  
  
  
  if (press && press.jobs.length < jobSlotsOf(press)) {
    const ready = recipesReady(world, press.level);
    if (ready.length) {
      return step(`press:${ready[0]}`, `You have enough for ${label(RECIPES[ready[0]].output)} - the press is free.`, { type: 'press' });
    }
  }

  const ripe = treesOn(world, 0).filter((tree) => isRipe(tree, t));
  if (ripe.length) {
    return step(`harvest:${ripe[0].id}`,
      ripe.length === 1 ? 'A tree is ripe.' : `${ripe.length} trees are ripe.`,
      { type: 'tree', id: ripe[0].id });
  }

  
  
  for (const villager of world.villagers) {
    if (held(world, villager.favourite) > 0) {
      return step(`gift:${villager.id}`,
        `${villagerName(villager, world.villagers)} would love the ${label(villager.favourite)} you are carrying.`,
        { type: 'villager', id: villager.id });
    }
  }

  
  
  
  
  
  
  if (toShelve) {
    return step('stock', `There is room on the shelves for the ${label(toShelve)} you are carrying.`, { type: 'shop' });
  }

  
  const price = nextParcelPrice(world);
  if (freeParcelId(world) !== null && world.coins >= price) {
    return step('land', `${CAT_NAME} will sell you the next parcel for ${price} coins.`, { type: 'cat' });
  }

  
  
  
  
  
  const thirsty = treesOn(world, 0).find((tree) => GROWING.includes(stageAt(tree, t)) && waterReason(tree, t) === null);
  if (thirsty) return step(`water:${thirsty.id}`, 'A young tree would grow faster for a drink.', { type: 'tree', id: thirsty.id });

  return null;
}









export function guideView(world, t, { planet = 0, dismissed = null } = {}) {
  const next = nextStep(world, t, { planet });
  if (!next || next.id === dismissed) return null;
  return next;
}


export const PRESS_SLOTS = Object.freeze(BUILDINGS.processor.levels.map((l) => l.jobSlots));
