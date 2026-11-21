











import { ANVIL, CROWN, FURNACE, LOOM, TWIN, TWIN_SPLIT, bossFireAll } from './sim/stages.js';
import { SIGNATURE_IDS } from './bullets.js';


export const CHARGE_LEAD = 36;

export const BIG_VOLLEY = 5;

export const CHARGE_QUIET = 30;

export const BOSS_LOOK = Object.freeze([
  Object.freeze({ kind: FURNACE, model: 'bosses/furnace', signature: SIGNATURE_IDS[FURNACE], charge: 'kiln', burst: 'flare', death: 'meltdown',
    words: 'heat gathers in its mouth; a flare of fire at each phase; it melts down from the core up' }),
  Object.freeze({ kind: LOOM, model: 'bosses/loom', signature: SIGNATURE_IDS[LOOM], charge: 'warp', burst: 'threads', death: 'unravel',
    words: 'threads draw in along its beam; a weave of streaks at each phase; it unravels end to end' }),
  Object.freeze({ kind: ANVIL, model: 'bosses/anvil', signature: SIGNATURE_IDS[ANVIL], charge: 'forge', burst: 'strike', death: 'shatter',
    words: 'sparks gather on the plate; a hammer strike shower at each phase; it shatters plate by plate' }),
  Object.freeze({ kind: TWIN, model: 'bosses/twin', signature: SIGNATURE_IDS[TWIN], charge: 'mirror', burst: 'split', death: 'sundered',
    words: 'each half gathers its own colour; mirrored rings at each phase; its halves burst in turn, then together' }),
  Object.freeze({ kind: CROWN, model: 'bosses/crown', signature: SIGNATURE_IDS[CROWN], charge: 'halo', burst: 'regalia', death: 'coronation',
    words: 'a halo of both colours turns in; four jewelled rays at each phase; four corner blasts, then the jewel' }),
]);






export function chargeAhead(kind, phase, fa, seed, x, y, players, thin) {
  const out = [], kids = [];
  const big = (t) => {
    if (t < 0) return false;
    out.length = 0; kids.length = 0;
    bossFireAll(kind, phase, t, seed, x, y, players, thin, out, kids);
    return out.length >= BIG_VOLLEY;
  };
  for (let d = 1; d <= CHARGE_LEAD; d++) {
    if (!big(fa + d)) continue;
    
    let quiet = true;
    for (let q = 1; q < CHARGE_QUIET && quiet; q++) if (big(fa + d - q)) quiet = false;
    if (!quiet) return null;
    big(fa + d);
    let iris = 0;
    const at = [];
    for (const b of out) {
      iris += b[4];
      if (at.length < 4 && !at.some((p) => Math.abs(p[0] - b[0]) < 4096 && Math.abs(p[1] - b[1]) < 4096)) at.push([b[0], b[1]]);
    }
    return { left: d, count: out.length, pol: iris * 2 > out.length ? 1 : 0, at };
  }
  return null;
}


export const chargeLevel = (left) => (CHARGE_LEAD - left) / (CHARGE_LEAD - 1);





export function deathPlan(kind) {
  if (kind === FURNACE) { 
    return [0.15, 0.3, 0.45, 0.6].map((t, i) => ({ t, dx: (i & 1 ? 30 : -30), dz: 40 - i * 28, size: 110 + i * 20, pol: 0 }))
      .concat([{ t: 0.95, dx: 0, dz: -20, size: 340, pol: 0 }]);
  }
  if (kind === LOOM) { 
    return [-150, -90, -30, 30, 90, 150].map((dx, i) => ({ t: 0.12 + i * 0.12, dx, dz: 0, size: 100, pol: i & 1 }))
      .concat([{ t: 1.0, dx: 0, dz: 0, size: 320, pol: 1 }]);
  }
  if (kind === ANVIL) { 
    return [{ t: 0.15, dx: -130, dz: 0, size: 150, pol: 0 }, { t: 0.4, dx: 130, dz: 0, size: 150, pol: 0 },
      { t: 0.6, dx: -60, dz: 30, size: 90, pol: 1 }, { t: 0.7, dx: 60, dz: 30, size: 90, pol: 1 },
      { t: 1.05, dx: 0, dz: 0, size: 360, pol: 0 }];
  }
  if (kind === TWIN) { 
    return [0.15, 0.35, 0.55].flatMap((t, i) => [{ t, dx: (i & 1 ? 1 : -1) * TWIN_SPLIT, dz: 0, size: 130, pol: i & 1 }])
      .concat([{ t: 0.95, dx: 0, dz: 0, size: 330, pol: 'both' }]);
  }
  
  return [[-110, -40], [110, -40], [-110, 40], [110, 40]].map(([dx, dz], i) => ({ t: 0.15 + i * 0.15, dx, dz, size: 120, pol: i & 1 }))
    .concat([{ t: 1.1, dx: 0, dz: 0, size: 380, pol: 'both' }]);
}
