

































export const THRESHOLD = 18;


export const HITS_NEEDED = 3;
export const WINDOW_MS = 700;


export const COOLDOWN_MS = 1200;












export function createShakeDetector({
  threshold = THRESHOLD,
  hitsNeeded = HITS_NEEDED,
  windowMs = WINDOW_MS,
  cooldownMs = COOLDOWN_MS,
} = {}) {
  let last = null;
  let hits = [];
  let firedAt = -Infinity;

  return {
    




    feed(reading, now) {
      const { x = 0, y = 0, z = 0 } = reading ?? {};
      const previous = last;
      last = { x, y, z };
      
      
      
      if (!previous) return false;

      const change = Math.hypot(x - previous.x, y - previous.y, z - previous.z);
      if (change < threshold) return false;

      hits = hits.filter((at) => now - at < windowMs);
      hits.push(now);
      if (hits.length < hitsNeeded) return false;
      if (now - firedAt < cooldownMs) return false;

      firedAt = now;
      hits = [];
      return true;
    },

    
    reset() {
      last = null;
      hits = [];
      firedAt = -Infinity;
    },
  };
}
