




















export const ENTRANCE = Object.freeze({
  duct: { telegraph: 1.2, burst: 0.35, emerge: 0.9 },
  breach: { telegraph: 2.6, burst: 0.45, emerge: 1.4 },
  drop: { telegraph: 1.8, burst: 0.4, emerge: 1.0 },
});

export const PHASES = Object.freeze(['telegraph', 'burst', 'emerge', 'done']);

export function createEntrance(kind) {
  if (!ENTRANCE[kind]) throw new Error(`unknown entrance kind: ${kind}`);
  return { kind, phase: 'telegraph', t: 0, event: null };
}






export function stepEntrance(e, dt) {
  if (e.phase === 'done') return e.event ? { ...e, event: null } : e;
  const cfg = ENTRANCE[e.kind];
  const n = { ...e, t: e.t + Math.max(0, dt), event: null };
  const dur = cfg[n.phase];
  if (n.t >= dur) {
    n.t -= dur;
    if (n.phase === 'telegraph') { n.phase = 'burst'; n.event = 'burst'; }
    else if (n.phase === 'burst') n.phase = 'emerge';
    else if (n.phase === 'emerge') { n.phase = 'done'; n.event = 'emerged'; }
  }
  n.k = n.phase === 'done' ? 1 : Math.min(1, n.t / ENTRANCE[n.kind][n.phase]);
  return n;
}



export function isProtectedPhase(e) {
  return e.phase !== 'done';
}




export function emergeAt(gate, k) {
  const ease = k * k * (3 - 2 * k);
  const from = -0.7;
  const to = 1.0;
  const d = from + (to - from) * ease;
  return { x: gate.x + gate.nx * d, z: gate.z + gate.nz * d };
}



export function emergeY(k, ceiling = 2.95) {
  const fall = Math.min(1, k / 0.75);
  return ceiling * (1 - fall * fall);
}
