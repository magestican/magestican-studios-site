








import { SeededRng } from '../../rng/seededRng.js';
import { SEASONS } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';
import { NO_SHADOW_MATERIALS } from '../mesh/meshData.mjs';
import { LODS, TIER, assembleFigure } from './villager.mjs';
import { guestFigure, GUEST_LOOK } from './kit/guests/figures.mjs';

export const GUEST_BODY_KINDS = Object.freeze(Object.keys(GUEST_LOOK));
const SALT = { fairy: 401, mummy: 409, werewolf: 419, fox: 421 };

export function generate({ kind, seed = 1, season = 'summer', lod = 0 } = {}) {
  if (!GUEST_LOOK[kind]) throw new Error(`unknown guest '${kind}' (guests: ${GUEST_BODY_KINDS.join(', ')})`);
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const L = LODS[lod];
  if (!L) throw new Error(`unknown lod ${lod}`);
  const rng = new SeededRng(seed * 7919 + SALT[kind]);
  const fig = guestFigure(kind, { season, lod, L, rng, fuse: lod > 0 });
  const md = assembleFigure(kind, { seed, season, lod, L, budget: budgetFor(TIER, lod) }, fig);
  md.name = `guest-${kind}-${seed}-${season}-lod${lod}`;
  md.rig.guest = kind;
  if (kind === 'fox') coatInWind(md);
  return md;
}








export const COAT_WIND = Object.freeze({ material: 'cloth', from: 0.4, m: 0.03, power: 1.5 });
function coatInWind(md) {
  const g = md.groups.get(COAT_WIND.material);
  if (!g) return;
  let lo = Infinity, hi = -Infinity;
  for (let i = 1; i < g.positions.length; i += 3) { lo = Math.min(lo, g.positions[i]); hi = Math.max(hi, g.positions[i]); }
  const band = (hi - lo) * COAT_WIND.from;
  if (!(band > 0)) return;
  const out = new Array(g.positions.length / 3);
  for (let i = 1, j = 0; i < g.positions.length; i += 3, j++) {
    const t = Math.max(0, 1 - (g.positions[i] - lo) / band);
    out[j] = Math.round(COAT_WIND.m * t ** COAT_WIND.power * 1e5) / 1e5;
  }
  g.sways = out;
}


export function guestDraws(md) {
  let n = 0;
  for (const m of md.groups.keys()) n += NO_SHADOW_MATERIALS.includes(m) ? 1 : 2;
  return n;
}
