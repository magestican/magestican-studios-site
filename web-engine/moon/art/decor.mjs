





















import { CRAFTABLES } from '../economy/craftables.mjs';
import * as flowerPot from './kit/flowerPot.mjs';
import * as flowerBed from './kit/flowerBed.mjs';
import * as footpath from './kit/footpath.mjs';
import * as bench from './kit/bench.mjs';
import * as postLantern from './kit/lantern.mjs';
import * as birdBath from './kit/birdBath.mjs';
import * as fence from './fence.mjs';
import * as firePit from './firepit.mjs';
import * as lampPost from './lamp.mjs';
import * as stone from './rock.mjs';
import * as fountain from './kit/decor/fountain.mjs';
import * as well from './kit/decor/well.mjs';
import * as barrel from './kit/decor/barrel.mjs';
import * as crate from './kit/decor/crate.mjs';
import * as signpost from './kit/decor/signpost.mjs';
import * as picnicTable from './kit/decor/picnicTable.mjs';






import * as furniture from './kit/decor/furniture.mjs';




import * as hedge from './kit/decor/hedge.mjs';
import * as statue from './kit/decor/statue.mjs';
import * as torch from './kit/decor/torch.mjs';
import * as hayBale from './kit/decor/hayBale.mjs';
import * as arch from './kit/decor/arch.mjs';
import * as bridge from './kit/decor/bridge.mjs';
import * as mailbox from './kit/decor/mailbox.mjs';
import * as windmill from './kit/decor/windmill.mjs';
import * as marketStall from './kit/decor/marketStall.mjs';










import * as scarecrow from './kit/decor/scarecrow.mjs';
import * as birdhouse from './kit/decor/birdhouse.mjs';
import * as cart from './kit/decor/cart.mjs';
import * as planter from './kit/decor/planter.mjs';
import * as house from './villagerHome.mjs';

const MODULES = Object.freeze({
  flowerPot, flowerBed, footpath, bench, postLantern, birdBath,
  fence, firePit, lampPost, stone,
  fountain, well, barrel, crate, signpost, picnicTable, furniture,
  hedge, statue, torch, hayBale, arch, bridge, mailbox, windmill, marketStall,
  scarecrow, birdhouse, cart, planter,
  house,
});

export const KINDS = Object.freeze(Object.keys(MODULES));


export const tierOf = (kind) => MODULES[kind].TIER;

export const LODS = Object.freeze([0, 1, 2]);


export function artOf(item) {
  const spec = CRAFTABLES[item];
  if (!spec) throw new Error(`there is no craftable '${item}'`);
  return spec.art;
}

function moduleOf(kind) {
  const mod = MODULES[kind];
  if (!mod) throw new Error(`there is no decor kind '${kind}'`);
  return mod;
}


export function generate({ kind, seed = 1, season = 'summer', lod = 0, variant = null, stage = null } = {}) {
  const mod = moduleOf(kind);
  if (kind === 'house') return mod.generate({ seed, season, lod, species: variant || 'human', stage: stage || 'house' });
  return mod.generate({ seed, season, lod });
}

const cache = new Map();









export function anchors({ kind, seed = 1, variant = null, stage = null } = {}) {
  const key = `${kind}/${seed}/${variant}/${stage}`;
  if (!cache.has(key)) {
    const b = generate({ kind, seed, season: 'summer', lod: 0, variant, stage }).bounds();
    const hx = Math.max(Math.abs(b.min[0]), Math.abs(b.max[0]));
    const hz = Math.max(Math.abs(b.min[2]), Math.abs(b.max[2]));
    cache.set(key, Object.freeze({ r: Math.max(hx, hz), hx, hz, height: b.max[1] }));
  }
  return cache.get(key);
}


export const anchorsOf = (item) => anchors(artOf(item));


export const generateOf = (item, { season = 'summer', lod = 0 } = {}) => generate({ ...artOf(item), season, lod });
