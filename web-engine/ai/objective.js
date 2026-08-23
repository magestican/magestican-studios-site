























































import { WORLD_SIZE } from '../procgen/voxelWorldGen.js';

export const OBJECTIVE_FLAG = 'flag';
export const OBJECTIVE_POWER_UP = 'power-up';














export const DETOUR_FRACTION = 45 / 80;
export const MAX_DETOUR_M = Math.round(WORLD_SIZE.x * DETOUR_FRACTION);





export const DENIAL_VALUE = 0.22;






export const ALREADY_BUFFED = 0.2;

function dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);










export function appetiteFor(powerUp, bot, maxHp = 100) {
  if (!powerUp || !bot) return 0;
  
  
  if (bot.hasEnemyFlag) return 0;

  const hp = clamp01((bot.hp ?? maxHp) / (maxHp || 100));
  const sizeMul = powerUp.sizeMul ?? 1;
  const rateMul = powerUp.fireRateMul ?? 1;

  
  
  
  
  
  
  
  
  const sizeScore = sizeMul >= 1
    ? 0.55 * hp
    : 0.30 + 0.45 * (1 - hp);

  
  
  const rateScore = 0.45 * clamp01((rateMul - 1) / 0.4);

  let appetite = clamp01(DENIAL_VALUE + sizeScore + rateScore);
  if (bot.powerUpId) appetite *= ALREADY_BUFFED;
  return appetite;
}





















export function assignPickups({ bots = [], powerUps = [] } = {}) {
  const pairs = [];
  for (const pu of powerUps) {
    if (!pu || pu.available === false) continue;
    for (const b of bots) {
      if (!b || b.alive === false || b.hasEnemyFlag) continue;
      pairs.push({ pu: pu.id, bot: b.id, d: dist(b, pu) });
    }
  }
  pairs.sort((a, b) => (
    a.d - b.d
    || (a.pu < b.pu ? -1 : a.pu > b.pu ? 1 : 0)
    || (a.bot < b.bot ? -1 : a.bot > b.bot ? 1 : 0)
  ));
  const byPickup = new Map();
  const claimed = new Set();
  for (const p of pairs) {
    if (byPickup.has(p.pu) || claimed.has(p.bot)) continue;
    byPickup.set(p.pu, p.bot);
    claimed.add(p.bot);
  }
  return byPickup;
}













export function chooseObjective({ self, flag, powerUps = [], allies = [], maxHp = 100 } = {}) {
  const toFlag = (reason, extra = {}) => ({
    kind: OBJECTIVE_FLAG,
    x: flag?.x ?? 0, z: flag?.z ?? 0,
    powerUpId: null, detour: 0, appetite: 0, reason, ...extra,
  });

  if (!self || !flag) return toFlag('no bot or no flag');

  
  
  
  
  
  if (self.hasEnemyFlag) return toFlag('carrying the enemy flag — never detour');

  
  
  const team = allies.some((a) => a && a.id === self.id) ? allies : [...allies, self];
  const claims = assignPickups({ bots: team, powerUps });

  let best = null;
  const dSelfFlag = dist(self, flag);
  for (const pu of powerUps) {
    if (!pu || pu.available === false) continue;
    if (claims.get(pu.id) !== self.id) continue;      
    const appetite = appetiteFor(pu, self, maxHp);
    if (appetite <= 0) continue;
    const detour = dist(self, pu) + dist(pu, flag) - dSelfFlag;
    const surplus = appetite * MAX_DETOUR_M - detour;
    if (surplus < 0) continue;
    if (!best || surplus > best.surplus) best = { pu, appetite, detour, surplus };
  }

  if (!best) return toFlag('no power-up is worth the detour');
  return {
    kind: OBJECTIVE_POWER_UP,
    x: best.pu.x, z: best.pu.z,
    powerUpId: best.pu.id,
    detour: best.detour,
    appetite: best.appetite,
    reason: `${best.pu.id} costs ${best.detour.toFixed(1)} m of detour, `
          + `budget ${(best.appetite * MAX_DETOUR_M).toFixed(1)} m`,
  };
}
