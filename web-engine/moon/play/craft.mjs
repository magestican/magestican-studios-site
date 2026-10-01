












import { CRAFTABLES, CRAFT_CATEGORIES } from '../economy/tables.mjs';
import { RESOURCE_KINDS, costOf, craftPlan, craftedName, resourceHeld } from '../economy/crafting.mjs';

export const CATEGORY_LABELS = Object.freeze({
  pots: 'Pots', garden: 'Beds', paths: 'Paths', seats: 'Seats',
  lights: 'Lights', water: 'Water', rustic: 'Rustic', furniture: 'Indoors', houses: 'Houses',
});

export const itemsIn = (category) => Object.keys(CRAFTABLES).filter((id) => CRAFTABLES[id].category === category);


export const ALL_ITEMS = Object.freeze(Object.keys(CRAFTABLES));





export function craftMenu(world, { category = CRAFT_CATEGORIES[0], chosen = null } = {}) {
  const cat = CRAFT_CATEGORIES.includes(category) ? category : CRAFT_CATEGORIES[0];
  const made = world.made || {};
  const categories = CRAFT_CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key] || key,
    items: itemsIn(key).length,
    made: itemsIn(key).reduce((n, id) => n + (made[id] || 0), 0),
  }));
  const items = itemsIn(cat).map((item) => {
    const spec = CRAFTABLES[item];
    const cost = RESOURCE_KINDS.filter((r) => costOf(item)[r]).map((r) => ({ resource: r, n: costOf(item)[r], held: resourceHeld(world, r) }));
    if (costOf(item).coins) cost.push({ resource: 'coins', n: costOf(item).coins, held: world.coins });
    const plan = craftPlan(world, item, 1);
    return {
      item, name: spec.name, category: cat, cost, made: made[item] || 0,
      blocks: Boolean(spec.blocks), light: Boolean(spec.light), art: spec.art,
      action: plan.why ? null : { type: 'craft', item, count: 1 },
      why: plan.why || null,
      label: `Make ${craftedName(item, 1)}`,
    };
  });
  const selected = items.find((t) => t.item === chosen) || items[0] || null;
  return { category: cat, categories, items, selected: selected ? selected.item : null };
}


export function madeTray(world) {
  return Object.entries(world.made || {})
    .filter(([, n]) => n > 0)
    .map(([item, count]) => ({ item, count, name: CRAFTABLES[item] ? CRAFTABLES[item].name : item, art: CRAFTABLES[item] && CRAFTABLES[item].art }))
    .sort((a, b) => ALL_ITEMS.indexOf(a.item) - ALL_ITEMS.indexOf(b.item));
}


export const madeCount = (world) => Object.values(world.made || {}).reduce((n, c) => n + c, 0);
