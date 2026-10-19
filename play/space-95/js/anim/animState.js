







const ONE_SHOTS = new Set([
  'jump_takeoff',
  'land_soft',
  'land_run',
  'land_hard',
  'ledge_mantle',
  'bonk',
  'hurt',
  'kick_passive',
  'run_stop',
  'double_jump_flip',
  'wall_jump',
  'dew_bounce',
  'pound_land',
  'climb_jump_off',
]);
const APEX_BAND = 1.5; 
const LAND_SOFT_MAX = 1.0;
const LAND_RUN_MAX = 3.0;





export function wantedState(p, events) {
  for (const e of events) {
    if (e.type === 'hurt') return 'hurt';
    if (e.type === 'pound') return 'pound_land';
    if (e.type === 'doubleJump') return 'double_jump_flip';
    if (e.type === 'wallJump') return 'wall_jump';
    if (e.type === 'dewBounce') return 'dew_bounce';
    if (e.type === 'climbJump') return 'climb_jump_off';
    if (e.type === 'mantle') return 'ledge_mantle';
    if (e.type === 'bonk') return 'bonk';
    if (e.type === 'jump' || e.type === 'stomp') return 'jump_takeoff';
    if (e.type === 'kick') return 'kick_passive';
    if (e.type === 'land') {
      const f = e.fall ?? 0;
      if (f >= LAND_RUN_MAX) return 'land_hard';
      return Math.abs(p.vx) > 2 && f >= LAND_SOFT_MAX * 0.5 ? 'land_run' : 'land_soft';
    }
  }
  
  const ab = p.ab;
  if (p.climbing) return p.vy > 0.3 ? 'climb_up' : p.vy < -0.3 ? 'climb_down' : 'climb_idle';
  if (ab?.dashT > 0) return 'dash';
  if (ab?.pound) return ab.pound === 'hang' ? 'pound_start' : 'pound_fall';
  if (p.ride) return 'ride';
  if (p.gliding) return 'glide';
  if (!p.grounded && ab?.wallDir && p.vy < 0 && p.abilities?.has?.('wall')) return 'wall_slide';
  if (!p.grounded) return p.vy > APEX_BAND ? 'rise' : p.vy < -APEX_BAND ? 'fall' : 'apex';
  if (p.skid > 0) return 'turn_skid';
  return Math.abs(p.vx) > 0.5 ? 'run' : 'idle';
}





export function createAnimator(graph, clips, start = 'idle') {
  const tr = new Map(graph.transitions.map((t) => [`${t.from}>${t.to}`, t]));
  const a = {
    state: start,
    
    clip: graph.states[start].clip,
    t: 0,
    
    pendingState: null,
    
    missing: new Set(),
  };
  const length = (clip) => {
    const c = clips[clip];
    return c ? c.frame_times.length / c.fps : 0;
  };
  const enter = (state) => {
    a.state = state;
    a.clip = graph.states[state].clip;
    a.t = 0;
    a.pendingState = null;
  };
  const go = (to) => {
    if (to === a.state || to === a.pendingState || !graph.states[to]) return;
    const t = tr.get(`${a.pendingState ?? a.state}>${to}`);
    if (!t) a.missing.add(`${a.state}>${to}`);
    if (t?.clip) {
      a.clip = t.clip;
      a.t = 0;
      a.pendingState = to;
      a.state = to;
      return;
    }
    enter(to);
  };
  
  const crossed = (clip, t0, t1) => {
    const c = clips[clip];
    if (!c?.events) return [];
    const f0 = Math.floor(t0 * c.fps);
    const f1 = Math.floor(t1 * c.fps);
    return c.events.filter((e) => e.frame > f0 && e.frame <= f1);
  };
  return {
    a,
    
    update(dt, wanted) {
      const busy = !a.pendingState && ONE_SHOTS.has(a.state) && a.t < length(a.clip);
      const urgent = wanted === 'hurt' || wanted === 'jump_takeoff' || wanted === 'ledge_mantle';
      if (!busy || urgent) go(wanted);
      const t0 = a.t;
      a.t += dt;
      const len = length(a.clip);
      let events = crossed(a.clip, t0, a.t);
      if (len > 0 && a.t >= len) {
        if (a.pendingState) {
          const st = a.pendingState;
          enter(st);
        } else if (graph.states[a.state].loop) {
          a.t -= len;
          events = events.concat(crossed(a.clip, -1 / 1e6, a.t));
        } else {
          a.t = len - 1e-6; 
        }
      }
      return events;
    },
    
    frame() {
      const c = clips[a.clip];
      if (!c) return { clip: a.clip, frame: 0 };
      return { clip: a.clip, frame: Math.min(c.frame_times.length - 1, Math.floor(a.t * c.fps)) };
    },
  };
}







export function missingTransitions(graph, pairs) {
  const have = new Set(graph.transitions.map((t) => `${t.from}>${t.to}`));
  return pairs.filter(([f, t]) => !graph.states[f] || !graph.states[t] || !have.has(`${f}>${t}`)).map(([f, t]) => `${f}>${t}`);
}
