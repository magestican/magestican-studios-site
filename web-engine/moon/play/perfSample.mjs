






































export const PERF_EVENT = 'perf_sample';







export const PERF_AFTER_MS = 30000;






export const TIER_CODE = Object.freeze({ high: 3, medium: 2, low: 1 });


export const MEDIAN_MS_BUCKETS = Object.freeze([0, 8, 12, 17, 21, 25, 33, 40, 50, 67, 100]);

export const LOAD_S_BUCKETS = Object.freeze([0, 1, 2, 3, 5, 8, 12, 20, 30]);

export const CALLS_BUCKETS = Object.freeze([0, 25, 50, 100, 150, 200, 300, 400, 600, 800, 1200]);

export const DPR_STEP = 0.5;
export const DPR_MAX = 4;







export function bucket(value, edges) {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= edges[0]) return edges[0];
  let out = edges[0];
  for (const e of edges) if (v >= e) out = e;
  return out;
}


export function bucketDpr(dpr) {
  const v = Number(dpr);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.min(DPR_MAX, Math.round(v / DPR_STEP) * DPR_STEP);
}
















export function perfSamplePayload(reading = {}) {
  const r = reading && typeof reading === 'object' ? reading : {};
  const seconds = (ms) => (Number.isFinite(Number(ms)) ? Number(ms) / 1000 : NaN);
  return {
    tier: TIER_CODE[r.tier] || 0,
    median_ms: bucket(r.medianMs, MEDIAN_MS_BUCKETS),
    load_s: bucket(seconds(r.loadMs), LOAD_S_BUCKETS),
    ready_s: bucket(seconds(r.readyMs), LOAD_S_BUCKETS),
    dpr: bucketDpr(r.dpr),
    calls: bucket(r.calls, CALLS_BUCKETS),
  };
}






















export function createPerfSampler({ read, send, afterMs = PERF_AFTER_MS } = {}) {
  let done = false;
  let payload = null;
  return {
    
    get done() { return done; },
    
    get payload() { return payload; },
    



    tick(elapsedMs) {
      if (done) return false;
      if (!(Number(elapsedMs) >= afterMs)) return false;
      let reading = null;
      try {
        reading = typeof read === 'function' ? read() : null;
      } catch {
        done = true;          
        return false;
      }
      if (reading && reading.error) { done = true; return false; }
      if (!reading || !reading.ready) return false;
      done = true;
      payload = perfSamplePayload(reading);
      try {
        if (typeof send === 'function') send(PERF_EVENT, payload);
      } catch {
        
        
      }
      return true;
    },
  };
}
