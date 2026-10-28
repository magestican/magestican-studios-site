








export const SHAPES = ['fountain', 'burst', 'swarm', 'shock', 'rise', 'orbit', 'beam', 'breath', 'pop', 'halo', 'rain'];




export const MAGIC = {
  wizard: { signature: 'flame', light: '#ffb347' },
  princess: { signature: 'petal', light: '#ff9ad5' },
  ghost: { signature: 'mini_ghost', light: '#d8e6ff' },
  fairy: { signature: 'fairy', light: '#b6ff9a' },
  dragon: { signature: 'flame', light: '#ff6a3d' },
  ice_queen: { signature: 'snowflake', light: '#bfefff' },
  astronaut: { signature: 'rocket', light: '#9ff3ff' },
  robot: { signature: 'bolt', light: '#5cffc8' },
};





export const COMBO_SHAPES = {
  lift_off: ['rise', 'shock', 'fountain'], 
  supernova: ['burst', 'burst', 'halo'], 
  spell_storm: ['beam', 'beam', 'beam', 'orbit'], 
  royal_welcome: ['halo', 'rain', 'burst'],
  take_off: ['swarm', 'rise', 'shock'], 
  spooky_surprise: ['pop', 'orbit', 'burst'],
  power_surge: ['halo', 'fountain', 'fountain', 'shock'], 
};

const s = (shape, kinds, extra = {}) => ({ shape, kinds, ...extra });


export const SPELLS = {
  wizard: {
    arms_up: s('fountain', ['flame']), 
    star: s('burst', ['star'], { light: '#ffe27a' }), 
    flap: s('swarm', ['flame', 'sparkle']), 
    jump: s('shock', ['flame']), 
    squat: s('rise', ['bubble']), 
    twirl: s('orbit', ['star', 'sparkle']), 
    wand: s('beam', ['flame']), 
    boo: s('pop', ['bubble']), 
    crown: s('halo', ['star']), 
  },
  princess: {
    arms_up: s('fountain', ['sparkle']),
    star: s('burst', ['star', 'petal']), 
    flap: s('swarm', ['petal']), 
    jump: s('shock', ['coin']), 
    squat: s('rise', ['petal']), 
    twirl: s('orbit', ['petal']), 
    wand: s('beam', ['star']), 
    boo: s('pop', ['petal']), 
    crown: s('rain', ['petal']), 
  },
  ghost: {
    arms_up: s('fountain', ['mini_ghost']), 
    star: s('burst', ['mini_ghost']),
    flap: s('swarm', ['mini_ghost']), 
    jump: s('rise', ['mini_ghost']), 
    squat: s('rise', ['bubble', 'mini_ghost']), 
    twirl: s('orbit', ['mini_ghost']), 
    wand: s('beam', ['mini_ghost']), 
    boo: s('pop', ['mini_ghost']), 
    crown: s('halo', ['mini_ghost']),
  },
  fairy: {
    arms_up: s('fountain', ['sparkle', 'fairy']), 
    star: s('burst', ['petal']), 
    flap: s('swarm', ['fairy']), 
    jump: s('shock', ['sparkle']), 
    squat: s('rise', ['sparkle']), 
    twirl: s('orbit', ['fairy']), 
    wand: s('beam', ['sparkle']), 
    boo: s('burst', ['fairy']), 
    crown: s('halo', ['petal']), 
  },
  dragon: {
    arms_up: s('rise', ['flame']), 
    star: s('burst', ['flame']), 
    flap: s('swarm', ['flame']), 
    jump: s('shock', ['coin', 'flame']), 
    squat: s('rise', ['bubble', 'flame']), 
    twirl: s('orbit', ['flame']), 
    wand: s('breath', ['flame']), 
    boo: s('pop', ['flame']), 
    crown: s('halo', ['flame']), 
  },
  ice_queen: {
    arms_up: s('fountain', ['snowflake']), 
    star: s('burst', ['ice_shard']), 
    flap: s('swarm', ['snowflake']), 
    jump: s('rise', ['ice_shard']), 
    squat: s('shock', ['snowflake']), 
    twirl: s('orbit', ['snowflake']), 
    wand: s('beam', ['ice_shard']), 
    boo: s('pop', ['snowflake'], { light: '#ffffff' }), 
    crown: s('halo', ['snowflake']), 
  },
  astronaut: {
    arms_up: s('fountain', ['rocket']), 
    star: s('burst', ['star', 'planet']), 
    flap: s('swarm', ['comet']), 
    jump: s('rise', ['coin'], { g: 0.2 }), 
    squat: s('rise', ['star']), 
    twirl: s('orbit', ['planet']), 
    wand: s('beam', ['comet']), 
    boo: s('pop', ['planet']), 
    crown: s('halo', ['planet']), 
  },
  
  robot: {
    arms_up: s('fountain', ['bolt']), 
    star: s('burst', ['gear']), 
    flap: s('swarm', ['bolt', 'gear']), 
    jump: s('shock', ['gear']), 
    squat: s('rise', ['bolt']), 
    twirl: s('orbit', ['gear']), 
    wand: s('beam', ['laser']), 
    boo: s('pop', ['bolt', 'gear'], { light: '#ffffff' }), 
    crown: s('halo', ['bolt']), 
  },
};
