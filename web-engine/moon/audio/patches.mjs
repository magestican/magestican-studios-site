



























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

  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  step: patch('a soft footfall on grass', [
    { noise: true, attack: 0.004, decay: 0.07, gain: 0.4, filter: { type: 'lowpass', f: 620, q: 0.8 } },
    { wave: 'sine', f0: 150, f1: 92, attack: 0.005, decay: 0.085, gain: 0.35 },
  ]),
  
  
  verbTick: patch('the action button taking up a new verb', [
    { wave: 'sine', f0: 1244.5, f1: 1661, attack: 0.004, decay: 0.05, gain: 0.22 },
  ]),
  
  chop: patch('an axe biting into a trunk', [
    { noise: true, attack: 0.003, decay: 0.09, gain: 0.6, filter: { type: 'bandpass', f: 1800, q: 0.9 } },
    { wave: 'triangle', f0: 240, f1: 110, attack: 0.003, decay: 0.16, gain: 0.5 },
  ]),
  
  dig: patch('a shovel turning soil', [
    { noise: true, attack: 0.006, decay: 0.2, gain: 0.5, filter: { type: 'lowpass', f: 700, q: 0.7 } },
    { wave: 'sine', f0: 120, f1: 80, attack: 0.006, decay: 0.12, gain: 0.25 },
  ]),
  
  
  mine: patch('a pickaxe ringing off stone', [
    { wave: 'triangle', f0: 1760, f1: 1320, attack: 0.002, decay: 0.22, gain: 0.35 },
    { noise: true, attack: 0.003, decay: 0.06, gain: 0.35, filter: { type: 'highpass', f: 3000, q: 0.7 } },
    { wave: 'sine', f0: 190, f1: 110, attack: 0.003, decay: 0.1, gain: 0.3 },
  ]),
  
  water: patch('water poured from a can', [
    { noise: true, attack: 0.03, decay: 0.42, gain: 0.45, filter: { type: 'bandpass', f: 1200, q: 0.6 } },
    { wave: 'sine', f0: 620, f1: 900, attack: 0.02, decay: 0.3, gain: 0.1 },
  ]),
  
  
  pluck: patch('fruit coming off the branch', [
    { noise: true, attack: 0.003, decay: 0.05, gain: 0.3, filter: { type: 'bandpass', f: 2600, q: 1.4 } },
    { wave: 'sine', f0: 660, f1: 990, attack: 0.005, decay: 0.13, gain: 0.3 },
  ]),
  
  
  
  pocket: patch('something going into the pockets', [
    { wave: 'sine', f0: 587.3, attack: 0.005, decay: 0.09, gain: 0.3 },
    { wave: 'sine', f0: 880, attack: 0.005, decay: 0.13, gain: 0.26, at: 0.06 },
  ]),
  
  
  place: patch('a thing set down where it belongs', [
    { wave: 'triangle', f0: 330, f1: 220, attack: 0.006, decay: 0.16, gain: 0.4 },
    { noise: true, attack: 0.004, decay: 0.06, gain: 0.18, filter: { type: 'lowpass', f: 1400, q: 0.7 } },
  ]),
});

export const PATCH_IDS = Object.freeze(Object.keys(PATCHES));


export const patchOf = (id) => PATCHES[id] || null;


export const patchTail = (p) => p.layers.reduce((m, l) => Math.max(m, l.at + l.attack + l.decay), 0);
