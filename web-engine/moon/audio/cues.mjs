























const cue = (patch, gain, spread, priority) => Object.freeze({ patch, gain, spread, priority });

export const CUES = Object.freeze({
  
  'money.coin': cue('coin', 0.22, 10, 2),
  'money.coinBig': cue('coinBig', 0.22, 10, 3),
  
  'build.hammer': cue('hammer', 0.3, 40, 1),
  
  'ui.tap': cue('tick', 0.5, 25, 1),

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  'move.step': cue('step', 0.09, 60, 0),
  'ui.verb': cue('verbTick', 0.35, 30, 1),
  'tool.chop': cue('chop', 0.3, 45, 2),
  'tool.dig': cue('dig', 0.28, 50, 2),
  'tool.mine': cue('mine', 0.26, 45, 2),
  'tool.water': cue('water', 0.3, 30, 2),
  'pick.crop': cue('pluck', 0.3, 60, 2),
  'pick.find': cue('pocket', 0.28, 40, 2),
  'make.place': cue('place', 0.3, 35, 2),

  
  
  
  
  
  
  'gesture.wave': cue('verbTick', 0.3, 40, 2),
  'gesture.cheer': cue('coinBig', 0.14, 60, 2),
  'gesture.bow': cue('place', 0.22, 30, 2),
  'gesture.toss': cue('water', 0.28, 50, 2),

  
  
  
  'town.market': cue('coinBig', 0.16, 40, 2),
});

export const CUE_IDS = Object.freeze(Object.keys(CUES));










export const VOICE_CUES = Object.freeze({
  'voice.laugh': 'laugh',
  'voice.gasp': 'gasp',
  'voice.sigh': 'sigh',
  'voice.grumble': 'grumble',
  'voice.hum': 'hum',
});


export const cueOf = (id) => CUES[id] || null;
