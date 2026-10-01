






















export const WINDOW = 60;
const POOL = 4;


export function medianOf(ring, n) {
  if (!n) return null;
  const a = Array.prototype.slice.call(ring, 0, n).sort((x, y) => x - y);
  const m = n >> 1;
  return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}


export function meterLine(m) {
  if (!m.enabled) return 'cpu/gpu off';
  const f = (v) => (v === null ? '-' : v.toFixed(1));
  const g = m.gpuAvailable === false ? 'n/a' : `${f(m.gpuMs)} ms`;
  return `cpu ${f(m.cpuMs)} ms  gpu ${g}`;
}


function rolling() {
  const ring = new Float64Array(WINDOW);
  let n = 0, cursor = 0;
  return {
    log: null,
    push(v) {
      ring[cursor] = v;
      cursor = (cursor + 1) % WINDOW;
      if (n < WINDOW) n += 1;
      if (this.log) this.log.push(v);
    },
    get count() { return n; },
    median() { return medianOf(ring, n); },
  };
}







export function createFrameMeter({ now, gl = null, enabled = false }) {
  const cpu = rolling();
  const gpu = rolling();
  let on = Boolean(enabled);
  let ext;            
  let t0 = 0;
  const free = [];
  const pending = [];  
  let active = null;   
  let queriesCreated = 0;
  let disjointDropped = 0;
  let skippedBusy = 0;

  const timer = () => {
    if (ext === undefined) ext = (gl && gl.getExtension && gl.getExtension('EXT_disjoint_timer_query_webgl2')) || null;
    return ext;
  };

  
  function collect() {
    if (!pending.length) return;
    const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
    while (pending.length) {
      const q = pending[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      pending.shift();
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT);
      if (disjoint) disjointDropped += 1;
      else gpu.push(ns / 1e6);
      free.push(q);
    }
    
    if (disjoint) {
      for (const q of pending) free.push(q);
      disjointDropped += pending.length;
      pending.length = 0;
    }
  }

  return {
    get enabled() { return on; },
    enable(v = true) { on = Boolean(v); return on; },
    
    get gpuAvailable() { return ext === undefined ? null : ext !== null; },
    get queriesCreated() { return queriesCreated; },
    get disjointDropped() { return disjointDropped; },
    get skippedBusy() { return skippedBusy; },
    get cpuMs() { return cpu.median(); },
    get gpuMs() { return gpu.median(); },
    get cpuCount() { return cpu.count; },
    get gpuCount() { return gpu.count; },

    begin() {
      if (!on) return;
      t0 = now();
    },
    end() {
      if (!on || !t0) return;
      cpu.push(now() - t0);
      t0 = 0;
    },
    beginGpu() {
      if (!on || !timer()) return;
      collect();
      if (!free.length) {
        
        
        if (queriesCreated >= POOL) { skippedBusy += 1; return; }
        free.push(gl.createQuery());
        queriesCreated += 1;
      }
      active = free.pop();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, active);
    },
    endGpu() {
      if (!active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(active);
      active = null;
    },

    
    start() { cpu.log = []; gpu.log = []; return true; },
    stop() {
      const out = { cpu: cpu.log || [], gpu: gpu.log || [] };
      cpu.log = null; gpu.log = null;
      return out;
    },
  };
}
