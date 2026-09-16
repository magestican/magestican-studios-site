

















import { FOOTPRINTS, sceneScale } from '../world/collision.mjs';
import { forageOn, rocksOn } from '../economy/world.mjs';

export const TOOLS = Object.freeze(['shovel', 'axe', 'pickaxe', 'wateringCan']);

export const VERB_TOOL = Object.freeze({
  plant: 'shovel', clearStump: 'shovel', dig: 'shovel', fell: 'axe', mine: 'pickaxe', water: 'wateringCan',
});


export const TOOL_NAMES = Object.freeze({ shovel: 'Shovel', axe: 'Axe', pickaxe: 'Pickaxe', wateringCan: 'Watering can' });

export const AUTO = Object.freeze({ tool: null, key: null });


export function toolFor(prompt) {
  if (!prompt) return null;
  if (prompt.verb) return VERB_TOOL[prompt.verb] || null;
  if (prompt.hold) return VERB_TOOL[prompt.hold.type] || null;
  return prompt.chosen || null;
}


export function chooseTool(choice, tool, key) {
  if (!TOOLS.includes(tool)) throw new Error(`no tool '${tool}'`);
  if (choice && choice.tool === tool && choice.key === key) return AUTO;
  return Object.freeze({ tool, key });
}

export const choiceFor = (choice, key) => (choice && choice.tool && choice.key === key ? choice.tool : null);

export const keepChoice = (choice, key) => (choice && choice.tool && choice.key === key ? choice : AUTO);









export const BAR = Object.freeze({ lingerS: 2.5 });

export const BAR_HIDDEN = Object.freeze({ visible: false, lastAtS: -Infinity });






export function barState(bar = BAR_HIDDEN, { tool = null, chosen = null, nowS = 0 } = {}, cfg = BAR) {
  const wanted = Boolean(tool || chosen);
  if (wanted) return { visible: true, lastAtS: nowS };
  const last = bar && Number.isFinite(bar.lastAtS) ? bar.lastAtS : -Infinity;
  const visible = nowS - last < cfg.lingerS;
  return visible === Boolean(bar && bar.visible) && last === (bar ? bar.lastAtS : -Infinity)
    ? bar
    : { visible, lastAtS: last };
}















export function rockTargets(world, P, { planet = 0 } = {}) {
  const rocks = P.filter((p) => p.role === 'rock');
  const mine = rocksOn(world, planet);
  if (rocks.length !== mine.length) throw new Error(`${rocks.length} rock placements but ${mine.length} rocks in the economy for planet ${planet}`);
  return rocks.map((p, i) => Object.freeze({ type: 'rock', id: mine[i].id, x: p.x, z: p.z, r: FOOTPRINTS.rock.radiusM * sceneScale(p) }));
}








export function forageTargets(world, spots, { planet = 0 } = {}) {
  const mine = forageOn(world, planet);
  if (spots.length !== mine.length) throw new Error(`${spots.length} forage spots but ${mine.length} in the economy for planet ${planet}`);
  return spots.map((s, i) => {
    if (mine[i].type !== s.type) throw new Error(`forage spot ${i} is ${s.type} on planet ${planet} but ${mine[i].type} in the economy`);
    return Object.freeze({ type: 'forage', id: mine[i].id, x: s.x, z: s.z, r: s.r, spot: s.type });
  });
}
