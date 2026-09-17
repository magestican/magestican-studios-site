



























const layer = (l) => Object.freeze({
  wave: l.noise ? null : (l.wave || 'sine'),
  noise: Boolean(l.noise),
  f0: l.f0 ?? 0,
  f1: l.f1 ?? l.f0 ?? 0,
  attack: l.attack,
  decay: l.decay,
  gain: l.gain,
  filter: l.filter ? Object.freeze({ type: l.filter.type, f: l.filter.f, q: l.filter.q ?? 1 }) : null,
  at: l.at ?? 0,
});

const patch = (note, layers) => Object.freeze({ note, layers: Object.freeze(layers.map(layer)) });

export const PATCHES = Object.freeze({
  
  
  
  coin: patch('a small ka-ching, cozy rather than casino', [
    { wave: 'triangle', f0: 1318.5, attack: 0.006, decay: 0.114, gain: 0.5 },
    { wave: 'triangle', f0: 1975.5, attack: 0.006, decay: 0.394, gain: 0.42, at: 0.06 },
  ]),
  
  
  
  coinBig: patch('the fuller ka-ching a big payment rings', [
    { wave: 'triangle', f0: 1318.5, attack: 0.006, decay: 0.114, gain: 0.5 },
    { wave: 'triangle', f0: 1975.5, attack: 0.006, decay: 0.474, gain: 0.42, at: 0.06 },
    { wave: 'triangle', f0: 2637, attack: 0.006, decay: 0.274, gain: 0.18, at: 0.11 },
  ]),
  
  
  hammer: patch('a wooden knock at a village building site', [
    { wave: 'triangle', f0: 210, f1: 126, attack: 0.004, decay: 0.086, gain: 0.8 },
    { wave: 'triangle', f0: 640, f1: 384, attack: 0.004, decay: 0.026, gain: 0.35 },
  ]),
  
  
  
  tick: patch('a soft confirming tick under a finger', [
    { wave: 'sine', f0: 880, f1: 740, attack: 0.008, decay: 0.09, gain: 0.35 },
    { noise: true, attack: 0.004, decay: 0.05, gain: 0.06, filter: { type: 'bandpass', f: 2400, q: 1.2 } },
  ]),
});

export const PATCH_IDS = Object.freeze(Object.keys(PATCHES));


export const patchOf = (id) => PATCHES[id] || null;


export const patchTail = (p) => p.layers.reduce((m, l) => Math.max(m, l.at + l.attack + l.decay), 0);
