















import { aimAt } from './sim/patterns.js';
import { isin, icos } from './sim/fixed.js';
import { BULWARK, DART, GUNSHIP, MID_LIFE, MINE, SKIFF, dartShots } from './sim/stage.js';
import { LANCE, hasSkill } from './sim/abilities.js';
import { P_PAIR, P_RAMPART } from './sim/mounts.js';
import { REST_YAW, yawOf } from './craftMotion.js';


export const AIM_LEAD = 45, AIM_HOLD = 20;


export const yawOfAngle = (a) => yawOf(isin(a), icos(a));





export function gunYaw(kind, path, age, x, y, players, st = 0) {
  if (kind === SKIFF || kind === MINE) return null; 
  const aimed = () => yawOfAngle(aimAt(players, x, y));
  if (kind === DART) {
    const [, lanceAt] = dartShots(path);
    
    if (hasSkill(st, LANCE) && age >= lanceAt - AIM_LEAD && age <= lanceAt + AIM_HOLD) return REST_YAW;
    for (const t of dartShots(path)) if (age >= t - AIM_LEAD && age <= t + AIM_HOLD) return aimed();
    return null;
  }
  if (kind === BULWARK) return REST_YAW; 
  if (kind === GUNSHIP) {
    if (path === P_RAMPART) return age >= 90 && age < 1200 ? aimed() : REST_YAW;
    if (path === P_PAIR) return age >= 120 && age < MID_LIFE ? aimed() : REST_YAW;
    return REST_YAW; 
  }
  return null;
}
