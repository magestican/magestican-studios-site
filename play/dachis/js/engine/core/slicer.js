





export function slicer(budget = 8) {
  let t0 = performance.now(), longest = 0, where = '', yields = 0;
  
  
  
  
  const pause = typeof requestAnimationFrame === 'function'
    ? () => new Promise((r) => { let done = false; const go = () => { if (!done) { done = true; setTimeout(r, 0); } }; requestAnimationFrame(go); setTimeout(go, 100); })
    : () => new Promise((r) => setTimeout(r, 0));
  const slice = async (label = '') => {
    const span = performance.now() - t0;
    if (span > longest) { longest = span; where = label; }
    if (span < budget) return;
    yields++;
    await pause();
    t0 = performance.now();
  };
  
  slice.mark = () => { t0 = performance.now(); };
  slice.stats = () => ({ longestMs: Math.round(longest * 10) / 10, where, yields });
  return slice;
}

export const noSlice = Object.assign(async () => {}, { stats: () => null });
