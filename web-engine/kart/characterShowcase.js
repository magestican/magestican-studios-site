






























export const SLIDE_TIME = 0.34;


export const SLOT_GAP = 1;










export const SPIN_PER_STEP = Math.PI * 2;








export const VISIBLE_SLOTS = 1.6;

const wrap = (i, n) => ((i % n) + n) % n;





export function createShowcase(ids, selected = null) {
  const list = [...ids];
  const start = Math.max(0, list.indexOf(selected ?? list[0]));
  return {
    ids: list,
    index: start,        
    offset: start,       
    from: start,         
    t: 1,                
    spin: 0,             
    spinFrom: 0,
    spinTo: 0,
    dir: 0,              
  };
}











export function nudge(state, dir) {
  const step = dir >= 0 ? 1 : -1;
  state.from = state.offset;
  
  
  
  state.spinFrom = state.spin;
  state.spinTo = state.spin + SPIN_PER_STEP * step;
  state.index += step;
  state.t = 0;
  state.dir = step;
  return state;
}


export function selectId(state, id) {
  const at = state.ids.indexOf(id);
  if (at < 0) return state;
  
  
  const n = state.ids.length;
  const here = wrap(state.index, n);
  let delta = wrap(at - here, n);
  if (delta > n / 2) delta -= n;
  state.from = state.offset;
  state.spinFrom = state.spin;
  state.spinTo = state.spin + SPIN_PER_STEP * delta;
  state.index += delta;
  state.t = delta === 0 ? 1 : 0;
  if (delta === 0) { state.offset = state.index; state.spin = state.spinTo; }
  state.dir = Math.sign(delta);
  return state;
}


export const selectedId = (state) => state.ids[wrap(state.index, state.ids.length)];








const ease = (u) => 1 - (1 - u) * (1 - u) * (1 - u);


export function stepShowcase(state, dt) {
  if (state.t >= 1) return false;
  state.t = Math.min(1, state.t + dt / SLIDE_TIME);
  const u = ease(state.t);
  state.offset = state.from + (state.index - state.from) * u;
  
  
  
  state.spin = state.spinFrom + (state.spinTo - state.spinFrom) * u;
  return state.t < 1;
}














export function slotsOf(state) {
  const n = state.ids.length;
  const out = [];
  
  
  
  for (let i = 0; i < n; i += 1) {
    let slot = i - state.offset;
    
    
    
    
    slot = wrap(slot + n / 2, n) - n / 2;
    if (Math.abs(slot) > VISIBLE_SLOTS) continue;
    const away = Math.abs(slot);
    out.push({
      at: i,
      id: state.ids[i],
      slot,
      
      
      
      scale: 1 - 0.38 * Math.min(1, away),
      
      
      
      depth: -1.15 * Math.min(1, away),
      
      
      opacity: away <= 1 ? 1 : Math.max(0, 1 - (away - 1) / (VISIBLE_SLOTS - 1)),
      
      
      
      spin: state.spin,
      selected: Math.abs(slot) < 0.5,
    });
  }
  return out.sort((a, b) => Math.abs(b.slot) - Math.abs(a.slot));
}












export function dragToNudge(dx, threshold = 48) {
  if (Math.abs(dx) < threshold) return 0;
  
  
  
  return dx < 0 ? 1 : -1;
}
