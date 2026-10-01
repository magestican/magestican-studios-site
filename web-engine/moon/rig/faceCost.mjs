

























export const FACE_FRAME_BUDGET_MS = 0.3;




export const FACE_METER_KEEP = 600;

const round3 = (x) => Math.round(x * 1000) / 1000;





export function createFaceMeter(now, { keep = FACE_METER_KEEP } = {}) {
  let ms = 0;
  let writes = 0;
  let frames = [];
  return {
    
    start() { return now(); },
    
    stop(t0) {
      const d = now() - t0;
      if (d > 0) ms += d;
      writes += 1;
    },
    
    frame() {
      frames.push({ ms, writes });
      if (frames.length > keep) frames.shift();
      ms = 0;
      writes = 0;
    },
    reset() { frames = []; ms = 0; writes = 0; },
    reading() { return faceCostReading(frames); },
  };
}






export function faceCostReading(frames) {
  const faced = frames.filter((f) => f.writes > 0);
  if (!faced.length) return { frames: 0, meanMs: 0, p95Ms: 0, maxMs: 0, writesPerFrame: 0 };
  const sorted = faced.map((f) => f.ms).sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  return {
    frames: faced.length,
    meanMs: round3(sum / faced.length),
    p95Ms: round3(p95),
    maxMs: round3(sorted[sorted.length - 1]),
    writesPerFrame: round3(faced.reduce((a, f) => a + f.writes, 0) / faced.length),
  };
}













export const TEX_RECUR_PER_FRAME = 0.5;
export function faceCostVerdict({ jsMs, glMs, texUploadsPerFrame = 0 }) {
  const totalMs = round3(jsMs + glMs);
  return {
    totalMs,
    budgetMs: FACE_FRAME_BUDGET_MS,
    ok: totalMs < FACE_FRAME_BUDGET_MS && texUploadsPerFrame < TEX_RECUR_PER_FRAME,
  };
}
