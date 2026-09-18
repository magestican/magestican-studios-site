


































































import { whyCannot } from '../economy/world.mjs';
import { BUILDINGS, FINDS, GOODS, STAPLES, TREES } from '../economy/tables.mjs';
import { sellable, shelfRoom, shopOf } from '../economy/shop.mjs';
import { FOOTPRINTS, PLAYER_RADIUS_M, TREE_MODULE } from '../world/collision.mjs';
import { marchRay, CURVE_K } from '../world/curve.mjs';
import { spotAhead, whyNotPlantHere, PLANTING } from './planting.mjs';
import { pressSummary, processorOf } from './processing.mjs';
import { listOf, nameOf } from './names.mjs';
import { CAT_NAME, MOLE_NAME, villagerName } from './people.mjs';
import { toolFor } from './tools.mjs';
import { craftedName } from '../economy/crafting.mjs';
import { STORES, TOWN_HALL, noticeBoard, storeOpen } from '../economy/town.mjs';
import { hourAt } from '../economy/clock.mjs';
import { shutSentence } from './town.mjs';


const ID_PLACES = Object.freeze(['villager', 'rock', 'forage', 'placed', 'store', 'find']);

export const INTERACT = Object.freeze({
  
  
  reachM: 0.9,
  
  
  frontHalfDeg: 65,
  touchM: 0.15,
  
  
  keepExtraM: 0.35,
  keepHalfDeg: 100,
  switchMarginM: 0.3,
  
  
  bearingWeightM: 0.5,
  
  holdToFellS: 0.6,
  
  frontReachM: 0.8,
});




export const PICK_SHAPES = Object.freeze({
  fruiting: Object.freeze({ r: 1.45, h: 4.0 }),
  young: Object.freeze({ r: 0.95, h: 2.6 }),
  sapling: Object.freeze({ r: 0.45, h: 1.25 }),
  seed: Object.freeze({ r: 0.45, h: 0.4 }),
  stump: Object.freeze({ r: 0.55, h: 0.85 }),
});

const PLURAL = Object.freeze({ apple: 'apples', peach: 'peaches', cherry: 'cherries' });
const an = (word) => (/^[aeiou]/.test(word) ? `an ${word}` : `a ${word}`);
const TAU = Math.PI * 2;
const wrap = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

export function trunkRadius(v) {
  const table = FOOTPRINTS[TREE_MODULE[v.kind]];
  return (table && table[v.stage] && table[v.stage].radiusM) || 0.3;
}


export function measure(v, player) {
  const dx = v.x - player.x, dz = v.z - player.z;
  const gap = Math.hypot(dx, dz) - trunkRadius(v) - PLAYER_RADIUS_M;
  const bearing = Math.abs(wrap(Math.atan2(dx, dz) - (player.heading || 0)));
  return { gap, bearing };
}


export function measurePlace(place, player, cfg = INTERACT) {
  const bearing = Math.abs(wrap(Math.atan2(place.x - player.x, place.z - player.z) - (player.heading || 0)));
  if (place.front) return { gap: Math.hypot(place.front.x - player.x, place.front.z - player.z) - cfg.frontReachM, bearing };
  return { gap: Math.hypot(place.x - player.x, place.z - player.z) - (place.r || 0.3) - PLAYER_RADIUS_M, bearing };
}

function scoreGap({ gap, bearing }, keep, cfg) {
  const reach = cfg.reachM + (keep ? cfg.keepExtraM : 0);
  const half = ((keep ? cfg.keepHalfDeg : cfg.frontHalfDeg) * Math.PI) / 180;
  if (gap > reach) return null;
  if (bearing > half && gap > cfg.touchM) return null;
  return Math.max(0, gap) + bearing * cfg.bearingWeightM;
}

const scoreOf = (v, player, keep, cfg) => scoreGap(measure(v, player), keep, cfg);


function candidates(trees, places, player, keep, cfg) {
  const out = [];
  for (const v of trees) {
    const key = `tree:${v.id}`;
    const s = scoreOf(v, player, keep(key), cfg);
    if (s !== null) out.push({ key, target: { type: 'tree', id: v.id }, s });
  }
  for (const p of places) {
    const target = ID_PLACES.includes(p.type) ? { type: p.type, id: p.id } : { type: p.type };
    const key = targetKey(target);
    const s = scoreGap(measurePlace(p, player, cfg), keep(key), cfg);
    if (s !== null) out.push({ key, target, s });
  }
  return out;
}







export function chooseTarget(prev, trees, player, { canPlant = false, prefer = null, places = [] } = {}, cfg = INTERACT) {
  const prevKey = targetKey(prev);
  if (prefer !== null) {
    const preferKey = typeof prefer === 'string' ? prefer : `tree:${prefer}`;
    const hit = candidates(trees, places, player, (key) => key === preferKey, cfg).find((c) => c.key === preferKey);
    if (hit) return hit.target;
  }
  let best = null;
  for (const c of candidates(trees, places, player, () => false, cfg)) if (!best || c.s < best.s) best = c;
  const held = prevKey && prevKey !== 'ground'
    ? candidates(trees, places, player, (key) => key === prevKey, cfg).find((c) => c.key === prevKey)
    : null;
  if (held && !(best && best.key !== held.key && best.s < held.s - cfg.switchMarginM)) return held.target;
  if (best) return best.target;
  if (canPlant) {
    const s = spotAhead(player);
    return { type: 'ground', x: Math.round(s.x * 1000) / 1000, z: Math.round(s.z * 1000) / 1000 };
  }
  return null;
}


export function seedKinds(world) {
  return Object.keys(TREES).filter((kind) => (world.pockets[TREES[kind].seed] || 0) > 0);
}


export function nextSeedKind(current, world) {
  const kinds = seedKinds(world);
  if (!kinds.length) return null;
  const i = kinds.indexOf(current);
  return kinds[(i + 1) % kinds.length];
}


export function fellAction(target, world, t) {
  if (!target || target.type !== 'tree') return null;
  const action = { type: 'fell', tree: target.id };
  return whyCannot(world, action, t) ? null : action;
}







export function promptFor(target, ctx) {
  const out = promptOf(target, ctx);
  if (out) out.tool = toolFor(out);
  return out;
}


const NOTHING_HERE = Object.freeze({
  axe: 'There is nothing to chop here.', pickaxe: 'There is nothing to mine here.', wateringCan: 'There is nothing to water here.',
});

function promptOf(target, { world, t, trees, seedKind = null, obstacles = [], owned = null, forSale = null, tool = null, planet = 0 }) {
  if (!target) return null;
  const out = { target, verb: null, action: null, label: '', why: null, hold: null, holdLabel: '', open: null, chosen: null };
  if (target.type === 'shop') return shopPrompt(out, world, t);
  if (target.type === 'store') return storePrompt(out, world, t, target);
  if (target.type === 'townHall') return hallPrompt(out, world, t);
  if (target.type === 'processor') return pressPrompt(out, world, t);
  if (target.type === 'cat') return catPrompt(out, world, t);
  if (target.type === 'mole') return molePrompt(out);
  if (target.type === 'villager') return villagerPrompt(out, world, target);
  if (target.type === 'rock') return rockPrompt(out, world, t, target, tool);
  if (target.type === 'forage') return foragePrompt(out, world, t, target, tool);
  if (target.type === 'find') return findPrompt(out, world, t, target, tool);
  if (target.type === 'placed') return placedPrompt(out, world, t, target, tool);
  if (target.type === 'homeDoor') return homeDoorPrompt(out, tool);
  if (target.type === 'homeExit') return homeExitPrompt(out, tool);
  if (target.type === 'ground') {
    if (tool && tool !== 'shovel') return { ...out, chosen: tool, why: NOTHING_HERE[tool] };
    if (!seedKind) return { ...out, why: 'You have no seeds - fell a tree for some.' };
    
    
    
    const action = { type: 'plant', kind: seedKind, spot: { x: target.x, z: target.z }, planet };
    out.verb = 'plant';
    out.action = action;
    out.label = `Plant ${an(seedKind)} seed`;
    
    
    
    out.why = whyNotPlantHere(target.x, target.z, { obstacles, trees, owned, forSale }) || whyCannot(world, action, t);
    return out;
  }
  const v = trees.find((x) => x.id === target.id);
  if (!v) return null;
  if (tool) return treeToolPrompt(out, v, world, t, tool);
  if (v.stage === 'stump') return stumpPrompt(out, v, world, t);
  const harvest = { type: 'harvest', tree: v.id };
  const cannotPick = whyCannot(world, harvest, t);
  if (!cannotPick) {
    out.action = harvest;
    out.verb = 'harvest';
    out.label = `Pick the ${PLURAL[v.kind] || v.kind}`;
    return out;
  }
  const water = { type: 'water', tree: v.id };
  const cannotWater = whyCannot(world, water, t);
  if (!cannotWater) {
    out.action = water;
    out.verb = 'water';
    out.label = waterLabel(v);
  } else {
    
    
    
    out.why = v.stage === 'seed' ? 'A seed is growing here - give it time.' : v.stage === 'fruiting' ? cannotPick : cannotWater;
  }
  const fell = fellAction(target, world, t);
  if (fell) {
    out.hold = fell;
    out.holdLabel = `Hold to chop down the ${v.kind} tree`;
  }
  return out;
}

const waterLabel = (v) => (v.stage === 'seed' ? 'Water the seed' : `Water the ${v.kind} tree`);

function stumpPrompt(out, v, world, t) {
  out.action = { type: 'clearStump', tree: v.id };
  out.verb = 'clearStump';
  out.label = 'Dig up the stump';
  out.why = whyCannot(world, out.action, t);
  return out;
}


function treeToolPrompt(out, v, world, t, tool) {
  out.chosen = tool;
  if (tool === 'axe') {
    const fell = fellAction({ type: 'tree', id: v.id }, world, t);
    if (fell) {
      out.verb = 'fell';
      out.action = fell;
      out.label = `Chop down the ${v.kind} tree`;
    } else {
      out.why = v.stage === 'stump' ? 'It is already a stump - the shovel can dig it up.' : 'A seed is too small to chop - give it time.';
    }
    return out;
  }
  if (tool === 'wateringCan') {
    out.verb = 'water';
    out.action = { type: 'water', tree: v.id };
    out.label = waterLabel(v);
    out.why = whyCannot(world, out.action, t);
    return out;
  }
  if (tool === 'shovel') {
    if (v.stage === 'stump') return stumpPrompt(out, v, world, t);
    out.why = 'The shovel digs up stumps - this tree is still standing.';
    return out;
  }
  out.why = 'The pickaxe is for rocks - a tree needs the axe.';
  return out;
}



const ROCK_WRONG_TOOL = Object.freeze({
  axe: 'The axe is for trees - rocks need the pickaxe.',
  shovel: 'This rock is too hard to dig - try the pickaxe.',
  wateringCan: 'A rock does not need water - try the pickaxe.',
});

function rockPrompt(out, world, t, target, tool) {
  out.chosen = tool;
  if (tool && tool !== 'pickaxe') {
    out.why = ROCK_WRONG_TOOL[tool];
    return out;
  }
  out.verb = 'mine';
  out.action = { type: 'mine', rock: target.id };
  out.label = 'Mine the rock';
  out.why = whyCannot(world, out.action, t);
  return out;
}

const PICKED_BY_HAND = Object.freeze({ mushroom: 'Pick the mushrooms', berries: 'Pick the berries' });

function foragePrompt(out, world, t, target, tool) {
  const spot = (world.forage || [])[target.id];
  if (!spot) return null;
  out.chosen = tool;
  if (spot.type === 'dig') {
    if (tool && tool !== 'shovel') {
      out.why = 'Something is growing under the soil - the shovel will find it.';
      return out;
    }
    out.verb = 'dig';
    out.action = { type: 'dig', spot: spot.id };
    out.label = 'Dig here';
  } else {
    if (tool) {
      out.why = `${spot.type === 'mushroom' ? 'Mushrooms are' : 'Berries are'} picked by hand - no tool needed.`;
      return out;
    }
    out.verb = 'forage';
    out.action = { type: 'forage', spot: spot.id };
    out.label = PICKED_BY_HAND[spot.type];
  }
  out.why = whyCannot(world, out.action, t);
  return out;
}











const OPEN_LABEL = Object.freeze({ chest: 'Open the chest', crate: 'Take what is in the crate', barrel: 'Take what is on the barrel' });

function findPrompt(out, world, t, target, tool) {
  const find = (world.finds || [])[target.id];
  if (!find) return null;
  const spec = FINDS[find.kind];
  out.chosen = tool;
  if (tool) {
    out.why = `The ${spec.container} is opened by hand - no tool needed.`;
    return out;
  }
  out.verb = 'pickUpFind';
  out.action = { type: 'pickUpFind', find: find.id };
  out.label = spec.treasure ? OPEN_LABEL[spec.container] : `Take the ${nameOf(spec.good)}`;
  out.why = whyCannot(world, out.action, t);
  return out;
}



function placedPrompt(out, world, t, target, tool) {
  const placed = (world.placed || []).find((p) => p.id === target.id);
  if (!placed) return null;
  out.chosen = tool;
  const name = craftedName(placed.item);
  if (tool) {
    out.why = `The ${name} is picked up by hand - no tool needed.`;
    return out;
  }
  out.verb = 'takeBack';
  out.action = { type: 'takeBack', placed: placed.id };
  out.label = `Pick up the ${name}`;
  out.why = whyCannot(world, out.action, t);
  return out;
}







function homeDoorPrompt(out, tool) {
  if (tool) return { ...out, chosen: tool, why: 'The door opens by hand.' };
  out.verb = 'goIn';
  out.open = 'homeIn';
  out.label = 'Go inside';
  return out;
}

function homeExitPrompt(out, tool) {
  if (tool) return { ...out, chosen: tool, why: 'The door opens by hand.' };
  out.verb = 'goOut';
  out.open = 'homeOut';
  out.label = 'Go outside';
  return out;
}



const clock = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`);


export function bestToStock(world) {
  let best = null;
  for (const [good, n] of Object.entries(world.pockets)) {
    if (!sellable(good) || n < 1) continue;
    const room = shelfRoom(world, good);
    if (room < 1) continue;
    const price = GOODS[good].sell_coins;
    if (!best || price > best.price || (price === best.price && n > best.n)) best = { good, n, price, count: Math.min(n, room) };
  }
  return best && { good: best.good, count: best.count };
}

function shopPrompt(out, world, t) {
  const pick = bestToStock(world);
  if (pick) {
    out.verb = 'stock';
    out.action = { type: 'stock', good: pick.good, count: pick.count };
    out.label = `Stock ${nameOf(pick.good, pick.count)}`;
    out.why = whyCannot(world, out.action, t);
    return out;
  }
  out.verb = 'open';
  out.open = 'shop';
  out.label = 'Look at the shop';
  const anySellable = Object.keys(world.pockets).some((good) => sellable(good));
  out.why = anySellable ? 'The shelves are full.' : null;
  if (!anySellable) out.label = 'Look at the shop - bring apples or jam to sell';
  return out;
}

function pressPrompt(out, world, t) {
  const press = processorOf(world);
  if (!press) {
    const action = { type: 'build', building: 'processor' };
    const cost = BUILDINGS.processor.levels[0].cost_coins;
    out.verb = 'build';
    out.action = action;
    out.label = `Build a press - ${cost} coins`;
    const why = whyCannot(world, action, t);
    out.why = why && world.coins < cost ? `A press costs ${cost} coins - you have ${world.coins}.` : why;
    return out;
  }
  const s = pressSummary(world, press, t);
  if (s.ready > 0) {
    out.verb = 'collect';
    out.action = { type: 'collect', processor: press.id };
    out.label = `Collect ${listOf(Object.entries(s.goods).map(([good, n]) => ({ good, n })))}`;
    return out;
  }
  out.verb = 'open';
  out.open = 'press';
  out.label = s.free > 0 ? 'Choose a recipe' : `Busy - next ready in ${clock(s.nextDoneS)}`;
  return out;
}


export function sugarToBuy(world) {
  const per = 4;
  const want = Math.max(1, Math.floor((world.pockets.apple || 0) / per) - (world.pockets.sugar || 0));
  const afford = Math.floor(world.coins / STAPLES.sugar.buy_coins);
  return Math.max(1, Math.min(want, afford));
}





function storePrompt(out, world, t, target) {
  const spec = STORES[target.id];
  if (!spec) return { ...out, why: 'There is no such store in town.' };
  out.verb = 'open';
  out.open = 'store';
  out.storeId = target.id;
  out.label = spec.buys ? `Sell at ${spec.label}` : `Buy at ${spec.label}`;
  if (!storeOpen(hourAt(world, t), spec)) out.why = shutSentence(spec);
  return out;
}




function hallPrompt(out, world, t) {
  const hour = hourAt(world, t);
  const board = noticeBoard(world, t, hour);
  const open = storeOpen(hour, TOWN_HALL);
  if (open && board.up && !board.filled && board.held >= board.count) {
    out.verb = 'fillRequest';
    out.action = { type: 'fillRequest' };
    out.label = `Hand in ${nameOf(board.good, board.count)}`;
    out.why = whyCannot(world, out.action, t);
    return out;
  }
  out.verb = 'open';
  out.open = 'notice';
  out.label = 'Read the notice board';
  if (!open) out.why = shutSentence(TOWN_HALL);
  else if (board.filled) out.label = 'Read the notice board - today\u2019s notice is filled';
  return out;
}

function catPrompt(out) {
  out.verb = 'talk';
  out.open = 'talk';
  out.label = `Talk to ${CAT_NAME}`;
  return out;
}




function molePrompt(out) {
  out.verb = 'talk';
  out.open = 'talk';
  out.label = `Talk to ${MOLE_NAME}`;
  return out;
}



function villagerPrompt(out, world, target) {
  const v = (world.villagers || []).find((x) => x.id === target.id);
  out.verb = 'talk';
  out.open = 'talk';
  out.label = v ? `Talk to ${villagerName(v, world.villagers)}` : 'Talk';
  return out;
}


export function pressHold(prompt) {
  const pressed = Boolean(prompt && prompt.action && !prompt.why);
  return {
    s: 0,
    targetKey: targetKey(prompt && prompt.target),
    
    
    canFell: Boolean(prompt && prompt.hold) && (!pressed || prompt.verb === 'water'),
    fired: false,
  };
}

export const targetKey = (target) => (!target ? ''
  : target.type === 'tree' ? `tree:${target.id}`
    : ID_PLACES.includes(target.type) ? `${target.type}:${target.id}` : target.type);






export function holdStep(hold, dtS, prompt, cfg = INTERACT) {
  if (!hold) return { hold: null, fire: null, progress: 0 };
  if (targetKey(prompt && prompt.target) !== hold.targetKey) return { hold: null, fire: null, progress: 0 };
  const next = { ...hold, s: hold.s + Math.max(0, dtS) };
  const armed = next.canFell && prompt && prompt.hold;
  if (!armed) return { hold: next, fire: null, progress: 0 };
  if (!next.fired && next.s + 1e-9 >= cfg.holdToFellS) {
    next.fired = true;
    return { hold: next, fire: prompt.hold, progress: 1 };
  }
  return { hold: next, fire: null, progress: next.fired ? 1 : Math.min(1, next.s / cfg.holdToFellS) };
}





export function tapPick(origin, dir, focus, trees, { heightAt, k = CURVE_K, radius = Infinity, stepM = 0.1, maxM = 120, places = [] } = {}) {
  
  const boxes = places.map((p) => ({ p, cos: Math.cos(p.rotY || 0), sin: Math.sin(p.rotY || 0), g: heightAt(p.x, p.z) }));
  const placeAt = (q) => {
    for (const { p, cos, sin, g } of boxes) {
      const dx = q.x - p.x, dz = q.z - p.z;
      const lx = dx * cos - dz * sin, lz = dx * sin + dz * cos;
      if (Math.abs(lx) <= p.hx && Math.abs(lz) <= p.hz && q.y >= g - 0.3 && q.y <= g + p.h) return p;
    }
    return null;
  };
  const shapes = trees.map((v) => ({ v, s: PICK_SHAPES[v.stage] || PICK_SHAPES.fruiting, g: heightAt(v.x, v.z) }));
  const treeAt = (q) => {
    let best = null;
    for (const { v, s, g } of shapes) {
      const d = Math.hypot(q.x - v.x, q.z - v.z);
      if (d <= s.r && q.y >= g - 0.3 && q.y <= g + s.h && (!best || d < best.d)) best = { v, d };
    }
    return best && best.v;
  };
  const r2 = radius * radius;
  const ground = (q) => q.x * q.x + q.z * q.z <= r2 && q.y <= heightAt(q.x, q.z);
  const hit = marchRay(origin, dir, focus, (q) => ground(q) || Boolean(treeAt(q)) || Boolean(placeAt(q)), { k, stepM, maxM });
  if (!hit) return null;
  const v = treeAt(hit);
  if (v) return { type: 'tree', id: v.id, x: hit.x, z: hit.z };
  const p = placeAt(hit);
  if (p) return ID_PLACES.includes(p.type) ? { type: p.type, id: p.id, x: hit.x, z: hit.z } : { type: p.type, x: hit.x, z: hit.z };
  return { type: 'ground', x: hit.x, z: hit.z };
}

export { PLANTING };
