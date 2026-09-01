































export const HIDE = Object.freeze({
  
  
  doorTime: 0.22,
  
  
  stepTime: 0.28,
  
  concealAt: 0.45,
});

export const HIDE_PHASES = Object.freeze([
  'out',        
  'opening',    
  'entering',   
  'shutting',   
  'hidden',     
  'unshutting', 
  'exiting',    
  'closing',    
]);

export function createHide() {
  return {
    phase: 'out',
    t: 0,
    door: 0,        
    step: 0,        
    event: null,    
  };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);








export function stepHide(h, dt, { wantToggle = false } = {}) {
  const n = { ...h, t: h.t + Math.max(0, dt), event: null };

  switch (h.phase) {
    case 'out':
      n.door = 0; n.step = 0;
      if (wantToggle) { n.phase = 'opening'; n.t = 0; n.event = 'creak'; }
      break;
    case 'opening':
      n.door = ease(clamp01(n.t / HIDE.doorTime));
      if (wantToggle) { n.phase = 'closing'; n.t = (1 - clamp01(n.t / HIDE.doorTime)) * HIDE.doorTime; break; }
      if (n.t >= HIDE.doorTime) { n.phase = 'entering'; n.t = 0; n.door = 1; }
      break;
    case 'entering':
      n.step = ease(clamp01(n.t / HIDE.stepTime));
      if (wantToggle) { n.phase = 'exiting'; n.t = (1 - clamp01(n.t / HIDE.stepTime)) * HIDE.stepTime; break; }
      if (n.t >= HIDE.stepTime) { n.phase = 'shutting'; n.t = 0; n.step = 1; n.event = 'clank'; }
      break;
    case 'shutting':
      n.door = 1 - ease(clamp01(n.t / HIDE.doorTime));
      if (wantToggle) { n.phase = 'unshutting'; n.t = (1 - clamp01(n.t / HIDE.doorTime)) * HIDE.doorTime; break; }
      if (n.t >= HIDE.doorTime) { n.phase = 'hidden'; n.t = 0; n.door = 0; }
      break;
    case 'hidden':
      n.door = 0; n.step = 1;
      if (wantToggle) { n.phase = 'unshutting'; n.t = 0; n.event = 'creak'; }
      break;
    case 'unshutting':
      n.door = ease(clamp01(n.t / HIDE.doorTime));
      if (wantToggle) { n.phase = 'shutting'; n.t = (1 - clamp01(n.t / HIDE.doorTime)) * HIDE.doorTime; break; }
      if (n.t >= HIDE.doorTime) { n.phase = 'exiting'; n.t = 0; n.door = 1; }
      break;
    case 'exiting':
      n.step = 1 - ease(clamp01(n.t / HIDE.stepTime));
      if (wantToggle) { n.phase = 'entering'; n.t = (1 - clamp01(n.t / HIDE.stepTime)) * HIDE.stepTime; break; }
      if (n.t >= HIDE.stepTime) { n.phase = 'closing'; n.t = 0; n.step = 0; n.event = 'clank'; }
      break;
    case 'closing':
      n.door = 1 - ease(clamp01(n.t / HIDE.doorTime));
      if (wantToggle) { n.phase = 'opening'; n.t = (1 - clamp01(n.t / HIDE.doorTime)) * HIDE.doorTime; break; }
      if (n.t >= HIDE.doorTime) { n.phase = 'out'; n.t = 0; n.door = 0; }
      break;
    default:
      break;
  }
  return n;
}








export function hideProtects(h) {
  return h.phase === 'opening' || h.phase === 'entering'
    || h.phase === 'shutting' || h.phase === 'hidden';
}


export function hideDrawsPlayer(h) {
  if (h.phase === 'hidden') return false;
  if (h.phase === 'shutting') return h.door > HIDE.concealAt;
  if (h.phase === 'unshutting') return h.door > HIDE.concealAt;
  return true;
}


export function hideSettled(h) {
  return h.phase === 'out' || h.phase === 'hidden';
}
