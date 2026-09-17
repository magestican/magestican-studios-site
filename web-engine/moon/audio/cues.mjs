























const cue = (patch, gain, spread, priority) => Object.freeze({ patch, gain, spread, priority });

export const CUES = Object.freeze({
  
  'money.coin': cue('coin', 0.22, 10, 2),
  'money.coinBig': cue('coinBig', 0.22, 10, 3),
  
  'build.hammer': cue('hammer', 0.3, 40, 1),
  
  'ui.tap': cue('tick', 0.5, 25, 1),
});

export const CUE_IDS = Object.freeze(Object.keys(CUES));


export const cueOf = (id) => CUES[id] || null;
