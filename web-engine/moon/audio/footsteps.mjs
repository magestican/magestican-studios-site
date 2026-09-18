

































export const STRIDE_M = 0.95;
export const RUN_STRIDE_M = 1.35;
export const MIN_GAP_S = 0.16;


export const CARRY_MAX = 2;


export const MIN_SPEED_MS = 0.25;

export function createFootsteps({
  stride = STRIDE_M,
  runStride = RUN_STRIDE_M,
  minGapS = MIN_GAP_S,
  carryMax = CARRY_MAX,
  minSpeedMs = MIN_SPEED_MS,
} = {}) {
  let carried = 0;
  let lastS = -Infinity;
  let steps = 0;
  let skipped = 0;

  return {
    







    walked({ distanceM = 0, running = false, nowS = 0, grounded = true, speedMs = null } = {}) {
      if (!grounded) { carried = 0; return false; }
      const d = Number.isFinite(distanceM) ? Math.max(0, distanceM) : 0;
      if (speedMs !== null && Number.isFinite(speedMs) && speedMs < minSpeedMs) { carried = 0; return false; }
      const len = running ? runStride : stride;
      carried = Math.min(carried + d, len * carryMax);
      if (carried < len) return false;
      carried -= len;
      
      
      if (nowS - lastS < minGapS) { skipped += 1; return false; }
      lastS = nowS;
      steps += 1;
      return true;
    },

    
    reset() { carried = 0; lastS = -Infinity; },

    get state() { return { steps, skipped, carried: Math.round(carried * 1000) / 1000 }; },
  };
}
