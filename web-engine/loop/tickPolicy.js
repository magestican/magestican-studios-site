































export const VISIBLE_HZ = 0;    
export const HIDDEN_HZ = 20;







export const MAX_STEP = 0.05;






export const MAX_CATCHUP = 0.25;








export function planTick(elapsed, { hidden = false } = {}) {
  if (!(elapsed > 0)) return { steps: [], render: !hidden };
  const budget = Math.min(elapsed, MAX_CATCHUP);
  const steps = [];
  let left = budget;
  
  
  while (left > 1e-6) {
    const s = Math.min(MAX_STEP, left);
    steps.push(s);
    left -= s;
  }
  return { steps, render: !hidden };
}



export function intervalFor(hidden) {
  return hidden ? Math.round(1000 / HIDDEN_HZ) : null;
}
