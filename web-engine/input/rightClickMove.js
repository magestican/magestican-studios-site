




































































export const RIGHT_CLICK_MOVE = Object.freeze({
  
  
  
  
  
  
  
  holdMs: 160,

  
  
  
  
  
  
  
  
  
  
  doubleMs: 280,

  
  
  
  jumpFrames: 2,

  
  
  jumpMaxMs: 400,
});

export function newRightClickMoveState() {
  return {
    
    downAt: null,
    
    
    
    pressJumped: false,
    
    
    
    
    lastClickAt: null,
    
    jumpFramesLeft: 0,
    jumpAt: 0,
  };
}





export function pressRightClick(state, t, cfg = RIGHT_CLICK_MOVE) {
  
  
  
  if (state.downAt !== null) return false;

  const chained = state.lastClickAt !== null && (t - state.lastClickAt) <= cfg.doubleMs;
  state.downAt = t;
  state.pressJumped = false;
  
  
  
  
  state.lastClickAt = null;

  if (chained) {
    state.pressJumped = true;
    state.jumpFramesLeft = cfg.jumpFrames;
    state.jumpAt = t;
    return true;
  }
  return false;
}


export function releaseRightClick(state, t, cfg = RIGHT_CLICK_MOVE) {
  if (state.downAt === null) return;
  const heldFor = t - state.downAt;
  
  
  
  
  
  state.lastClickAt = (!state.pressJumped && heldFor < cfg.holdMs) ? state.downAt : null;
  state.downAt = null;
  state.pressJumped = false;
}




export function resetRightClickMove(state) {
  state.downAt = null;
  state.pressJumped = false;
  state.lastClickAt = null;
  state.jumpFramesLeft = 0;
  state.jumpAt = 0;
}










export function stepRightClickMove(state, t, cfg = RIGHT_CLICK_MOVE) {
  let jumpDown = false;
  if (state.jumpFramesLeft > 0) {
    if (t - state.jumpAt > cfg.jumpMaxMs) {
      state.jumpFramesLeft = 0;      
    } else {
      state.jumpFramesLeft--;
      jumpDown = true;
    }
  }
  const forward = state.downAt !== null && (t - state.downAt) >= cfg.holdMs;
  return { forward, jumpDown };
}



















export function attachRightClickMove(target, bus, {
  enabled = () => true,
  isLocked = () => true,
  cfg = RIGHT_CLICK_MOVE,
  now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
} = {}) {
  const state = newRightClickMoveState();
  let pubForward = false;
  let pubJump = false;

  const publish = (forward, jumpDown) => {
    if (forward !== pubForward) { bus.setSynthetic('moveForward', forward); pubForward = forward; }
    if (jumpDown !== pubJump)   { bus.setSynthetic('jump', jumpDown);       pubJump = jumpDown; }
  };

  const onMouseDown = (e) => {
    if (e.button !== 2) return;
    if (!enabled() || !isLocked()) return;
    pressRightClick(state, now(), cfg);
  };
  
  
  const onMouseUp = (e) => {
    if (e.button !== 2) return;
    releaseRightClick(state, now(), cfg);
  };
  
  
  
  
  
  
  
  const onContextMenu = (e) => {
    if (!enabled() || !isLocked()) return;
    e.preventDefault();
  };

  target.addEventListener('mousedown', onMouseDown);
  target.addEventListener('mouseup', onMouseUp);
  target.addEventListener('contextmenu', onContextMenu);

  return {
    state,
    
    poll(t = now()) {
      if (!enabled() || !isLocked()) {
        
        resetRightClickMove(state);
        publish(false, false);
        return { forward: false, jumpDown: false };
      }
      const out = stepRightClickMove(state, t, cfg);
      publish(out.forward, out.jumpDown);
      return out;
    },
    detach() {
      target.removeEventListener('mousedown', onMouseDown);
      target.removeEventListener('mouseup', onMouseUp);
      target.removeEventListener('contextmenu', onContextMenu);
      resetRightClickMove(state);
      publish(false, false);
    },
  };
}
