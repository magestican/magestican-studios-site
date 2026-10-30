



const MAX_CATCH_UP_S = 600;





export function clockOffset(probes) {
  if (!probes.length) return 0;
  const best = probes.reduce((a, b) => (b.received - b.sent < a.received - a.sent ? b : a));
  return best.server - (best.sent + best.received) / 2;
}


export const railSeconds = (nowMs, startAtMs, offsetMs) => Math.max(0, (nowMs + offsetMs - startAtMs) / 1000);


export const catchUpSeconds = (railS, simS) => Math.min(MAX_CATCH_UP_S, Math.max(0, railS - simS));
