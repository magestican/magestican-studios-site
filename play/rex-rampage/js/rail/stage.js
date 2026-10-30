


import { createRail, speedAt } from './rail.js';

export const VERBS = [
  'spawn', 
  'wave', 
  'look', 
  'shake', 
  'explode', 
  'swap_vehicle', 
  'slowmo', 
  'say', 
  'music', 
  'checkpoint', 
  'objective', 
  'hostage', 
  'cover', 
  'lights', 
  'boss', 
];

const WAVE_SLOW = 0.3;
const WAVE_CAP_S = 6;
const WAVE_GRACE_S = 0.5; 





export function loadStage(json) {
  if (!Array.isArray(json.rail) || json.rail.length < 2) throw new Error(`stage ${json.id}: a rail needs at least 2 points`);
  for (const e of json.events) if (!VERBS.includes(e.do)) throw new Error(`stage ${json.id}: unknown verb '${e.do}' at ${e.at} m`);
  const rail = createRail(json.rail.map(([x, y, z]) => ({ x, y, z })));
  const events = [...json.events].sort((a, b) => a.at - b.at);
  return {
    id: json.id,
    name: json.name ?? json.id,
    rail,
    speeds: json.speeds ?? [],
    events,
    loop: !!json.loop,
    cutscene: !!json.cutscene,
    theme: json.theme ?? 'jungle',
    vehicle: json.vehicle ?? 'jeep',
    
    water: typeof json.water === 'number' ? json.water : null,
    
    arena: json.arena ?? null,
    
    terrain: json.terrain ?? null,
  };
}


export function createStageRun(stage) {
  return {
    stage,
    dist: 0,
    time: 0,
    next: 0,
    done: false,
    
    waiting: null,
  };
}






export function stepStage(run, dt, { aliveInWave }) {
  if (run.done) return [];
  run.time += dt;
  
  const fired = [];
  const w = run.waiting;
  if (w) {
    w.left -= dt;
    w.grace -= dt;
    const alive = aliveInWave(w.id);
    if (w.grace <= 0 && alive === 0) run.waiting = null;
    else if (w.left <= 0) {
      run.waiting = null;
      if (alive > 0) fired.push({ at: run.dist, do: 'release', id: w.id }); 
    }
  }
  const slow = run.waiting ? run.waiting.slow : 1;
  run.dist += speedAt(run.stage.speeds, run.dist) * slow * dt;
  const ev = run.stage.events;
  while (run.next < ev.length && ev[run.next].at <= run.dist + 1e-9) {
    const e = ev[run.next++];
    fired.push(e);
    if (e.do === 'wave') {
      const cap = typeof e.cap === 'number' ? e.cap : WAVE_CAP_S;
      const sl = typeof e.slow === 'number' ? e.slow : WAVE_SLOW;
      run.waiting = { id: String(e.id), left: cap, grace: WAVE_GRACE_S, slow: sl };
    }
  }
  if (run.stage.loop) {
    run.dist %= run.stage.rail.length; 
    return fired;
  }
  if (run.dist >= run.stage.rail.length) {
    run.dist = run.stage.rail.length;
    run.done = true;
    fired.push({ at: run.dist, do: 'end' });
  }
  return fired;
}
