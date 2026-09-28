





















import { paintPixels } from './paintCache.js';



import { PATHS, pathDistanceWith } from '../../../../web-engine/moon/world/moonLayout.mjs';
import { pathField } from '../../../../web-engine/moon/world/pathField.mjs';

const PAINTERS = {
  bark: () => import('../../../../web-engine/moon/paint/bark.mjs'),
  blossom: () => import('../../../../web-engine/moon/paint/blossom.mjs'),
  bottle: () => import('../../../../web-engine/moon/paint/bottle.mjs'),
  canvas: () => import('../../../../web-engine/moon/paint/canvas.mjs'),
  cloth: () => import('../../../../web-engine/moon/paint/cloth.mjs'),
  copper: () => import('../../../../web-engine/moon/paint/copper.mjs'),
  eye: () => import('../../../../web-engine/moon/paint/eye.mjs'),
  fire: () => import('../../../../web-engine/moon/paint/fire.mjs'),
  fruit: () => import('../../../../web-engine/moon/paint/fruit.mjs'),
  fur: () => import('../../../../web-engine/moon/paint/fur.mjs'),
  gem: () => import('../../../../web-engine/moon/paint/gem.mjs'),
  glass: () => import('../../../../web-engine/moon/paint/glass.mjs'),
  gold: () => import('../../../../web-engine/moon/paint/gold.mjs'),
  grass: () => import('../../../../web-engine/moon/paint/grass.mjs'),
  'lamp-glow': () => import('../../../../web-engine/moon/paint/lamp-glow.mjs'),
  leaf: () => import('../../../../web-engine/moon/paint/leaf.mjs'),
  metal: () => import('../../../../web-engine/moon/paint/metal.mjs'),
  paper: () => import('../../../../web-engine/moon/paint/paper.mjs'),
  petal: () => import('../../../../web-engine/moon/paint/petal.mjs'),
  plank: () => import('../../../../web-engine/moon/paint/plank.mjs'),
  roof: () => import('../../../../web-engine/moon/paint/roof.mjs'),
  skin: () => import('../../../../web-engine/moon/paint/skin.mjs'),
  snow: () => import('../../../../web-engine/moon/paint/snow.mjs'),
  soil: () => import('../../../../web-engine/moon/paint/soil.mjs'),
  stone: () => import('../../../../web-engine/moon/paint/stone.mjs'),
  water: () => import('../../../../web-engine/moon/paint/water.mjs'),
  wood: () => import('../../../../web-engine/moon/paint/wood.mjs'),
};

async function run(spec) {
  const { kind, painter, size } = spec || {};
  if (kind === 'pathField') {
    const extra = Array.isArray(spec.extra) ? spec.extra : [];
    const f = pathField({ PATHS: [...PATHS, ...extra], pathDistance: pathDistanceWith(extra) });
    return { data: f.data, width: f.size, height: f.size };
  }
  if (kind !== 'paint') throw new Error(`paint worker: unknown job kind '${kind}'`);
  const load = PAINTERS[painter];
  if (!load) throw new Error(`paint worker: no painter '${painter}'`);
  const mod = await load();
  if (typeof mod.paint !== 'function') throw new Error(`paint worker: '${painter}' does not paint`);
  return paintPixels(mod, size);
}

self.onmessage = async (e) => {
  const { id, spec } = e.data || {};
  if (id === undefined) return;
  try {
    const t0 = performance.now();
    const img = await run(spec);
    const payload = { data: img.data, width: img.width, height: img.height };
    const ms = Math.round((performance.now() - t0) * 10) / 10;
    self.postMessage({ id, payload, ms }, [img.data.buffer]);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
