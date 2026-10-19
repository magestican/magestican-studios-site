



const LAND_SOFT_MAX = 1.0; 
const LAND_RUN_MAX = 3.0; 
const WALK_SPEED = 5; 
const STRIDE = 1.9; 



const CUES = {
  jump: ['jump'],
  mantle: ['mantle', 'land_soft'],
  skid: ['skid'],
  pit: ['hurt_tone'],
  hurt: ['hurt_tone'],
  bonk: ['bonk'],
  corner: ['corner_slide'],
  stomp: ['stomp', 'land_soft'],
  kick: ['kick'],
  pebbleHit: ['pebble_hit', 'kick'],
  defeat: ['enemy_defeat_pop'],
  uncurl: ['pillbug_uncurl'],
  hop: ['ladybot_hop'],
  checkpoint: ['checkpoint_clockin'],
  secret: ['intel_found'],
  clear: ['shift_clear'],
};


const SIGNAL_SOUNDS = {
  'audio:hollow-knock': ['hollow_knock', 'kick'],
  'audio:glint-chime': ['secret_glint'],
  'audio:tiny-jingle': ['secret_glint'],
};


export function signalSounds(e, has = () => true) {
  return e.signals.map((sig) => SIGNAL_SOUNDS[sig]?.find(has)).filter(Boolean);
}





export function cueFor(e, has = () => true) {
  if (e.type === 'land') {
    const f = e.fall ?? 0;
    return f < LAND_SOFT_MAX ? 'land_soft' : f < LAND_RUN_MAX ? 'land_run' : 'land_hard';
  }
  return CUES[e.type]?.find(has) ?? null;
}


export function createFootsteps() {
  let dist = 0;
  return {
    
    update(p, dt) {
      const speed = Math.abs(p.vx);
      if (!p.grounded || speed < 0.5) {
        dist = STRIDE * 0.6; 
        return null;
      }
      dist += speed * dt;
      const stride = speed < WALK_SPEED ? STRIDE * 0.7 : STRIDE;
      if (dist < stride) return null;
      dist -= stride;
      return speed < WALK_SPEED ? 'footstep_dirt_walk' : 'footstep_dirt_run';
    },
  };
}


export function createPicker(seed = 95) {
  let s = seed >>> 0;
  const last = new Map();
  return ( name,  count) => {
    if (count <= 1) return 0;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    let i = s % (count - 1);
    const prev = last.get(name);
    if (prev !== undefined && i >= prev) i++;
    else if (prev === undefined) i = s % count;
    last.set(name, i);
    return i;
  };
}
