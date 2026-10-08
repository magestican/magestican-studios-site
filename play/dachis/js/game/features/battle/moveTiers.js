







export const TIER_LEVELS = [40, 50, 60];
export const RANK_BONUS = 0.08;

export const moveRank = (lvl) => TIER_LEVELS.filter((L) => lvl >= L).length;

export const rankMult = (lvl) => 1 + RANK_BONUS * moveRank(lvl);

export const rankedName = (name, lvl) => name + '+'.repeat(moveRank(lvl));


export const rankedUp = (lvl0, lvl1) => moveRank(lvl1) > moveRank(lvl0);
