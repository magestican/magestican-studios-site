














import { BUILDINGS, RECIPES, STAPLES, TREES } from '../economy/tables.mjs';
import { MS } from '../economy/math.mjs';
import { batchesDone, jobSlotsOf, readyToCollect, upgradeCost, whyCannot } from '../economy/world.mjs';
import { listOf, nameOf } from './names.mjs';

export const processorOf = (world) => world.buildings.find((b) => b.type === 'processor') || null;

const held = (world, good) => world.pockets[good] || 0;


export function maxBatches(world, recipeId) {
  const recipe = RECIPES[recipeId];
  let n = BUILDINGS.processor.maxBatches;
  for (const [good, per] of Object.entries(recipe.inputs)) n = Math.min(n, Math.floor(held(world, good) / per));
  return Math.max(0, n);
}


export function knownFruits(world) {
  const fruits = new Set(world.trees.map((tree) => TREES[tree.kind].fruit));
  for (const spec of Object.values(TREES)) if (held(world, spec.fruit) > 0) fruits.add(spec.fruit);
  return fruits;
}


export function clampBatches(chosen, max) {
  if (max < 1) return 0;
  if (!Number.isInteger(chosen) || chosen < 1) return max;
  return Math.min(chosen, max);
}









export function recipeMenu(world, press, t, { chosen = {} } = {}) {
  const slots = jobSlotsOf(press);
  const busy = press.jobs.length;
  const fruits = knownFruits(world);
  const recipes = [];
  for (const [id, recipe] of Object.entries(RECIPES)) {
    const inputs = Object.entries(recipe.inputs).map(([good, n]) => ({ good, n, held: held(world, good) }));
    if (!inputs.every(({ good }) => STAPLES[good] || fruits.has(good))) continue;
    if (recipe.processorLevel > press.level + 1) continue;
    const locked = recipe.processorLevel > press.level;
    const max = maxBatches(world, id);
    const batches = clampBatches(chosen[id], max);
    const tile = {
      recipe: id, output: recipe.output, inputs, time_s: recipe.time_s, level: recipe.processorLevel, locked, max, batches,
      action: null, why: null, label: `Make ${nameOf(recipe.output)}`,
    };
    if (locked) {
      tile.why = `Upgrade the press to level ${recipe.processorLevel} to make ${nameOf(recipe.output)}.`;
    } else if (busy >= slots) {
      tile.why = 'Every station is busy.';
    } else if (max < 1) {
      const short = inputs.filter(({ n, held: h }) => h < n).map(({ good, n, held: h }) => ({ good, n: n - h }));
      tile.why = `Short of ${listOf(short)}.`;
    } else {
      tile.action = { type: 'startJob', processor: press.id, recipe: id, batches };
      tile.why = whyCannot(world, tile.action, t);
      if (tile.why) tile.action = null;
      else tile.label = `Make ${nameOf(recipe.output, batches)}`;
    }
    recipes.push(tile);
  }
  const cost = upgradeCost(press);
  let upgrade = null;
  if (cost !== null) {
    const action = { type: 'upgrade', building: press.id };
    upgrade = { level: press.level + 1, cost, action, why: whyCannot(world, action, t) };
  }
  return { level: press.level, slots, busy, free: slots - busy, recipes, upgrade };
}

export const jobKey = (job) => `${job.startedAt}|${job.recipe}`;






export function assignStations(prev, jobs, slots) {
  const keys = new Set(jobs.map(jobKey));
  const out = new Array(slots).fill(null);
  (prev || []).forEach((key, i) => { if (i < slots && key && keys.has(key)) out[i] = key; });
  const placed = new Set(out.filter(Boolean));
  for (const job of jobs) {
    const key = jobKey(job);
    if (placed.has(key)) continue;
    const free = out.indexOf(null);
    if (free < 0) break;
    out[free] = key;
    placed.add(key);
  }
  return out;
}







export function stationViews(press, t, assignment) {
  const byKey = new Map(press.jobs.map((job) => [jobKey(job), job]));
  return assignment.map((key, station) => {
    const job = key && byKey.get(key);
    if (!job) return { station, idle: true };
    const each = RECIPES[job.recipe].time_s * MS;
    const total = each * job.batches;
    const elapsed = Math.max(0, t - job.startedAt);
    const done = batchesDone(job, t);
    const finished = done === job.batches;
    return {
      station, idle: false, key, recipe: job.recipe, output: RECIPES[job.recipe].output,
      batches: job.batches, done, collected: job.collected, ready: done - job.collected,
      progress: Math.min(1, elapsed / total),
      batchProgress: finished ? 1 : (elapsed - done * each) / each,
      remainingS: Math.max(0, Math.ceil((total - elapsed) / MS)),
      finished,
    };
  });
}


export function pressSummary(world, press, t) {
  const ready = readyToCollect(press, t);
  const goods = {};
  for (const job of press.jobs) {
    const n = batchesDone(job, t) - job.collected;
    if (n > 0) goods[RECIPES[job.recipe].output] = (goods[RECIPES[job.recipe].output] || 0) + n;
  }
  const running = press.jobs.filter((job) => batchesDone(job, t) < job.batches);
  const nextDoneS = running.length
    ? Math.min(...running.map((job) => Math.ceil((job.startedAt + (batchesDone(job, t) + 1) * RECIPES[job.recipe].time_s * MS - t) / MS)))
    : null;
  return { ready, goods, free: jobSlotsOf(press) - press.jobs.length, running: running.length, nextDoneS };
}
