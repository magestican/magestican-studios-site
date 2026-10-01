

























export const AUTO_HIDE = Object.freeze({
  
  afterS: 4,
  
  walkingMS: 0.15,
});


export const autoHideStart = Object.freeze({ hidden: false, walkingSinceS: null });














export function autoHideStep(prev, { nowS, speed = 0, wokeAtS = null, anyOpen = false }, cfg = AUTO_HIDE) {
  const state = prev || autoHideStart;
  const walking = speed > cfg.walkingMS;
  
  if (anyOpen || !walking) return same(state, false, null);
  const since = state.walkingSinceS === null ? nowS : state.walkingSinceS;
  
  
  const from = wokeAtS === null ? since : Math.max(since, wokeAtS);
  return same(state, nowS - from >= cfg.afterS, since);
}

function same(state, hidden, walkingSinceS) {
  if (state.hidden === hidden && state.walkingSinceS === walkingSinceS) return state;
  return { hidden, walkingSinceS };
}






export const AUTO_HIDE_KEEPS = Object.freeze(['stick', 'knob', 'ghost', 'pick', 'coins']);
